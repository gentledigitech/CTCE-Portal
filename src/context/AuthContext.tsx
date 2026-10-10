import React, { createContext, useContext, useState, useEffect } from 'react';
import { TraineeUser, AuthSession } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: TraineeUser | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<{ requiresMfa?: boolean; error?: string }>;
  confirmSuperAdminMfa: (code: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateCurrentUserProfile: (updates: Partial<TraineeUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<TraineeUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pendingSuperAdminUser, setPendingSuperAdminUser] = useState<TraineeUser | null>(null);

  useEffect(() => {
    // Real mode: Supabase keeps the sign-in, so just pick it up again after a refresh
    if (!api.isMock()) {
      let active = true;
      api
        .restoreRealSession()
        .then((restored) => {
          if (active && restored) setUser(restored);
        })
        .catch(console.warn)
        .finally(() => {
          if (active) setIsLoading(false);
        });
      const stopListening = api.onRealAuthChange((signedIn) => {
        if (!signedIn) setUser(null);
      });
      return () => {
        active = false;
        stopListening();
      };
    }

    // Mock mode: check session
    const session = api.getCurrentSession();
    if (session && session.user) {
      setUser(session.user);
      // Re-hydrate latest user details from DB so expected changes (level promotion, etc.) are reflected immediately on refresh!
      api.getTrainees().then((all) => {
        const freshUser = all.find((u) => u.id === session.user.id);
        if (freshUser) {
          session.user = freshUser;
          api.setMemorySession(session);
          setUser(freshUser);
        }
      }).catch(console.warn).finally(() => {
        setIsLoading(false);
      });
      return;
    }
    setIsLoading(false);
  }, []);

  const login = async (
    identifier: string,
    password: string
  ): Promise<{ requiresMfa?: boolean; error?: string }> => {
    // Real mode: Supabase checks the email and password. Admins come from the staff table.
    if (!api.isMock()) {
      try {
        const realUser = await api.realLogin(identifier, password);
        setUser(realUser);
        return {};
      } catch (err: any) {
        return { error: err?.message || 'Sign-in failed. Please try again.' };
      }
    }

    const cleanId = identifier.trim().toLowerCase();

    // Check for Super Admin special login:
    // Email: kinggentlejustice@proton.me, Password: Admin
    if (cleanId === 'kinggentlejustice@proton.me' && password === 'Admin') {
      const allUsers = await api.getAllUsersAdmin();
      const superAdmin = allUsers.find((u) => u.email === 'kinggentlejustice@proton.me');
      if (superAdmin) {
        setPendingSuperAdminUser(superAdmin);
        return { requiresMfa: true };
      }
    }

    // Standard login against trainees / users
    const allUsers = await api.getAllUsersAdmin();
    // Identifier can be Email or Trainee ID (case-insensitive)
    const matched = allUsers.find(
      (u) =>
        !u.is_deleted &&
        (u.email.toLowerCase() === cleanId ||
          (u.trainee_id && u.trainee_id.toLowerCase() === cleanId))
    );

    if (!matched) {
      return { error: 'Invalid credentials. Please verify your Email/Trainee ID and password.' };
    }

    // In mock mode, check password
    // In our mock DB, password is stored on user
    const dbUsers = await (api as any).getAllUsersAdmin();
    const fullUser = dbUsers.find((u: any) => u.id === matched.id);

    // If super admin logged in via regular path with password
    if (fullUser && fullUser.role === 'super_admin') {
      setPendingSuperAdminUser(fullUser);
      return { requiresMfa: true };
    }

    if (fullUser && fullUser.password_hash === password) {
      const session: AuthSession = {
        token: `session-token-${Date.now()}`,
        user: matched,
        expires_at: Date.now() + 30 * 60 * 1000 // 30 mins
      };
      api.setMemorySession(session);
      setUser(matched);
      return {};
    }

    return { error: 'Incorrect password. Please try again.' };
  };

  const confirmSuperAdminMfa = async (code: string): Promise<boolean> => {
    // Strictly requires confirmation number: 419248 (without hint!)
    if (code.trim() === '419248' && pendingSuperAdminUser) {
      const session: AuthSession = {
        token: `super-admin-session-${Date.now()}`,
        user: pendingSuperAdminUser,
        expires_at: Date.now() + 30 * 60 * 1000
      };
      api.setMemorySession(session);
      setUser(pendingSuperAdminUser);
      setPendingSuperAdminUser(null);
      return true;
    }
    return false;
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setPendingSuperAdminUser(null);
  };

  const refreshUser = async () => {
    if (!user) return;
    const all = await api.getTrainees();
    const current = all.find((u) => u.id === user.id);
    if (current) {
      setUser(current);
      const session = api.getCurrentSession();
      if (session) {
        session.user = current;
        api.setMemorySession(session);
      }
    }
  };

  const updateCurrentUserProfile = async (updates: Partial<TraineeUser>) => {
    if (!user) return;
    const updated = await api.updateTraineeDetails(user.id, updates, user.id);
    setUser(updated);
    const session = api.getCurrentSession();
    if (session) {
      session.user = updated;
      api.setMemorySession(session);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        confirmSuperAdminMfa,
        logout,
        refreshUser,
        updateCurrentUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
