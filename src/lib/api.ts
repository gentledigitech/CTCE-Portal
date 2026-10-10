/**
 * Central API Client for CTCE Hall Portal
 * Supports Mock Mode (VITE_USE_MOCK=true) for preview/testing
 * and Real Mode (calling Supabase & Edge Functions)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Hall,
  TraineeUser,
  SystemSettings,
  AuditLogEntry,
  SmsLogEntry,
  AuthSession,
  UserRole
} from '../types';

// Fail production build if mock mode is accidentally left enabled in production
if (import.meta.env.PROD && import.meta.env.VITE_USE_MOCK === 'true') {
  throw new Error('SECURITY VIOLATION: VITE_USE_MOCK cannot be true in a production build!');
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://pvkeropaviefewlctlxr.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_0x22aV76m_vC1YGbg6GikA_GyMWM6eR';

// Initialize Supabase client for real mode
export const supabase: SupabaseClient | null = !USE_MOCK
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false } // We keep tokens in memory only as per instructions
    })
  : null;

// Generate 40 consecutive academic years starting from 2026/2027
export function generateAcademicYears(startYear = 2026, count = 40): string[] {
  const years: string[] = [];
  for (let i = 0; i < count; i++) {
    const y1 = startYear + i;
    const y2 = y1 + 1;
    years.push(`${y1}/${y2}`);
  }
  return years;
}

const ACADEMIC_YEARS = generateAcademicYears(2026, 40);

// ============================================================================
// RATE LIMITING CONFIGURATION & ERROR TYPES
// ============================================================================
export const IP_RATE_LIMIT_MAX = 4; // 4 OTP SMS sends per IP per hour
export const IP_RATE_LIMIT_WINDOW_SECONDS = 3600; // 1 hour window
export const RESEND_COOLDOWN_SECONDS = 60; // 60s cooldown between resends

export class RateLimitError extends Error {
  retryAfter: number;
  constructor(message: string, retryAfter: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

// Default initial halls (Four mixed halls, 75 spaces each)
const INITIAL_HALLS: Hall[] = [
  {
    id: 'hall-theresa',
    name: 'St. Theresa Hall',
    capacity: 75,
    occupancy: 0,
    colour: 'blue',
    colour_hex: '#2563eb',
    sort_order: 1,
    active: true
  },
  {
    id: 'hall-aquinas',
    name: 'St. Thomas Aquinas Hall',
    capacity: 75,
    occupancy: 0,
    colour: 'cream',
    colour_hex: '#d97706',
    sort_order: 2,
    active: true
  },
  {
    id: 'hall-bosco',
    name: 'St. John Bosco Hall',
    capacity: 75,
    occupancy: 0,
    colour: 'green',
    colour_hex: '#16a34a',
    sort_order: 3,
    active: true
  },
  {
    id: 'hall-goretti',
    name: 'St. Maria Goretti Hall',
    capacity: 75,
    occupancy: 0,
    colour: 'light green',
    colour_hex: '#059669',
    sort_order: 4,
    active: true
  }
];

// Initial mock database state: ONLY Super Admin, 0 preset students
interface MockDatabase {
  users: (TraineeUser & { password_hash: string; deleted?: boolean; graduating_acknowledged?: boolean })[];
  halls: Hall[];
  settings: SystemSettings;
  sms_logs: SmsLogEntry[];
  audit_logs: AuditLogEntry[];
  otps: { phone: string; code: string; expires_at: number; purpose: string; created_at?: number }[];
  rate_limits?: { key: string; window_start: number; count: number }[];
}

const STORAGE_KEY = 'ctce_portal_db_v2';

function loadMockDB(): MockDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure super admin exists
      const superAdminIndex = parsed.users.findIndex((u: any) => u.email === 'kinggentlejustice@proton.me');
      if (superAdminIndex === -1) {
        parsed.users.unshift(getSuperAdminSeed());
      } else {
        // Keep existing saved state (like level, status, edits), only ensuring base profile defaults
        const existing = parsed.users[superAdminIndex];
        parsed.users[superAdminIndex] = {
          ...existing,
          full_name: existing.full_name || 'Owusu Justice',
          trainee_id: existing.trainee_id || 'CTCE/JHS/25/0151',
          phone_e164: existing.phone_e164 || '+233538965236',
          programme: existing.programme || 'Bachelor of Education (Junior High School)'
        };
      }
      return parsed;
    }
  } catch (err) {
    console.warn('Could not read mock DB from localStorage, initializing fresh:', err);
  }

  const fresh: MockDatabase = {
    users: [getSuperAdminSeed()],
    halls: INITIAL_HALLS,
    settings: {
      portal_open: true,
      allocation_mode: 'balanced',
      current_academic_year: '2026/2027',
      current_semester: 1,
      academic_years_list: ACADEMIC_YEARS,
      sms_daily_cap: 500
    },
    sms_logs: [],
    audit_logs: [
      {
        id: 'audit-init-1',
        actor_type: 'system',
        actor_id: 'system',
        action: 'SYSTEM_BOOTSTRAP',
        detail: { note: 'Initial CTCE Hall Portal deployment' },
        ip_hash: '127.0.0.1',
        created_at: new Date().toISOString()
      }
    ],
    otps: []
  };
  saveMockDB(fresh);
  return fresh;
}

function saveMockDB(db: MockDatabase) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (err) {
    console.error('Error saving mock DB to localStorage:', err);
  }
}

function getSuperAdminSeed(): TraineeUser & { password_hash: string } {
  return {
    id: 'user-superadmin-01',
    email: 'kinggentlejustice@proton.me',
    phone_e164: '+233538965236',
    full_name: 'Owusu Justice',
    trainee_id: 'CTCE/JHS/25/0151',
    programme: 'Bachelor of Education (Junior High School)',
    level: 200,
    role: 'super_admin',
    status: 'allocated',
    hall_name: 'St. Thomas Aquinas Hall',
    hall_colour: 'cream',
    hall_sms_count: 0,
    created_at: new Date('2026-01-01').toISOString(),
    password_hash: 'Admin'
  };
}

let db = loadMockDB();

// Helper to calculate hall occupancy dynamically based on active users
function refreshOccupancies() {
  const counts: Record<string, number> = {};
  db.halls.forEach((h) => (counts[h.id] = 0));
  db.users.forEach((u) => {
    if (!u.deleted && u.status === 'allocated' && u.hall_id && counts[u.hall_id] !== undefined) {
      counts[u.hall_id]++;
    }
  });
  db.halls.forEach((h) => {
    h.occupancy = counts[h.id] || 0;
  });
}
refreshOccupancies();

// Session storage persistence helper
const SESSION_STORAGE_KEY = 'ctce_auth_session_v5';

function loadStoredSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed: AuthSession = JSON.parse(raw);
    if (parsed && typeof parsed.expires_at === 'number' && parsed.expires_at > Date.now()) {
      return parsed;
    }
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    console.warn('Could not read stored session from sessionStorage:', err);
  }
  return null;
}

function saveStoredSession(session: AuthSession | null) {
  try {
    if (session) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      if (session.token) {
        if (session.user?.role === 'viewer') {
          sessionStorage.setItem('viewer_token', session.token);
          sessionStorage.setItem('viewer_token_expires_at', session.expires_at.toString());
        } else if (session.user?.role === 'applicant') {
          sessionStorage.setItem('applicant_token', session.token);
          sessionStorage.setItem('applicant_token_expires_at', session.expires_at.toString());
        }
      }
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      sessionStorage.removeItem('applicant_token');
      sessionStorage.removeItem('applicant_token_expires_at');
      sessionStorage.removeItem('viewer_token');
      sessionStorage.removeItem('viewer_token_expires_at');
    }
  } catch (err) {
    console.warn('Could not save session to sessionStorage:', err);
  }
}

// Active session holder (restored from sessionStorage on reload)
let currentMemorySession: AuthSession | null = loadStoredSession();

export const api = {
  isMock(): boolean {
    return USE_MOCK;
  },

  getCurrentSession(): AuthSession | null {
    if (currentMemorySession && currentMemorySession.expires_at > Date.now()) {
      return currentMemorySession;
    }
    const stored = loadStoredSession();
    if (stored) {
      currentMemorySession = stored;
      return currentMemorySession;
    }
    currentMemorySession = null;
    return null;
  },

  setMemorySession(session: AuthSession | null) {
    currentMemorySession = session;
    saveStoredSession(session);
  },

  logout(): void {
    currentMemorySession = null;
    saveStoredSession(null);
  },

  // --- SETTINGS & SYSTEM STATE ---
  async getSettings(): Promise<SystemSettings> {
    if (USE_MOCK) {
      return { ...db.settings };
    }
    // Real Supabase call
    const { data, error } = await supabase!.from('settings').select('*').single();
    if (error) throw error;
    return data;
  },

  async updateSettings(updates: Partial<SystemSettings>, actorId: string): Promise<SystemSettings> {
    if (USE_MOCK) {
      const oldYear = db.settings.current_academic_year;
      db.settings = { ...db.settings, ...updates };

      // If Academic Year changed, promote trainees!
      if (updates.current_academic_year && updates.current_academic_year !== oldYear) {
        db.users.forEach((user) => {
          if (user.role === 'applicant' || user.role === 'viewer') {
            if (user.level === 100) {
              user.level = 200;
            } else if (user.level === 200) {
              user.level = 300;
            } else if (user.level === 300) {
              user.level = 400;
            } else if (user.level === 400) {
              // Level 400 graduates! They will receive congratulation message
              user.status = 'graduated';
            }
          }
        });
      }

      db.audit_logs.unshift({
        id: `audit-${Date.now()}`,
        actor_type: 'super_admin',
        actor_id: actorId,
        action: 'UPDATE_SETTINGS',
        detail: updates,
        ip_hash: 'client-ip-mock',
        created_at: new Date().toISOString()
      });

      saveMockDB(db);
      return { ...db.settings };
    }
    // Real Supabase update
    const { data, error } = await supabase!.from('settings').update(updates).select().single();
    if (error) throw error;
    return data;
  },

  // --- HALLS ---
  async getHalls(): Promise<Hall[]> {
    if (USE_MOCK) {
      refreshOccupancies();
      return [...db.halls];
    }
    const { data, error } = await supabase!.from('halls').select('*').order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async updateHallCapacity(hallId: string, newCapacity: number, actorId: string): Promise<Hall> {
    if (USE_MOCK) {
      const hall = db.halls.find((h) => h.id === hallId);
      if (!hall) throw new Error('Hall not found');
      if (newCapacity < hall.occupancy) {
        throw new Error(`Capacity cannot be set below current occupancy (${hall.occupancy})`);
      }
      hall.capacity = newCapacity;

      // Check waitlist to allocate if space opened up
      const waitlisted = db.users.filter((u) => !u.deleted && u.status === 'waitlisted');
      for (const w of waitlisted) {
        if (hall.occupancy < hall.capacity) {
          w.status = 'allocated';
          w.hall_id = hall.id;
          w.hall_name = hall.name;
          w.hall_colour = hall.colour;
          hall.occupancy++;
          // Send simulated SMS
          db.sms_logs.unshift({
            id: `sms-${Date.now()}-${w.id}`,
            applicant_id: w.id,
            recipient_phone: w.phone_e164,
            kind: 'waitlist',
            message_preview: `CTCE: Hello ${w.full_name.split(' ')[0]}, you have been allocated to ${hall.name}. Show this message at hall registration.`,
            provider_status: 'delivered',
            created_at: new Date().toISOString()
          });
        }
      }

      db.audit_logs.unshift({
        id: `audit-${Date.now()}`,
        actor_type: 'super_admin',
        actor_id: actorId,
        action: 'UPDATE_HALL_CAPACITY',
        detail: { hallId, newCapacity },
        ip_hash: 'client-ip-mock',
        created_at: new Date().toISOString()
      });

      saveMockDB(db);
      return { ...hall };
    }
    // Real backend RPC: set_hall_capacity
    const { data, error } = await supabase!.rpc('set_hall_capacity', {
      p_hall: hallId,
      p_capacity: newCapacity
    });
    if (error) throw error;
    return data;
  },

  // --- TRAINEES / USERS ---
  async getTrainees(): Promise<TraineeUser[]> {
    if (USE_MOCK) {
      return db.users
        .filter((u) => !u.deleted)
        .map(({ password_hash, ...u }) => ({ ...u }));
    }
    const { data, error } = await supabase!.from('applicants').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getAllUsersAdmin(): Promise<TraineeUser[]> {
    if (USE_MOCK) {
      return db.users.map(({ password_hash, ...u }) => ({ ...u }));
    }
    const { data, error } = await supabase!.from('applicants').select('*');
    if (error) throw error;
    return data || [];
  },

  async updateTraineeDetails(
    traineeId: string,
    updates: Partial<TraineeUser>,
    actorId: string,
    reason?: string
  ): Promise<TraineeUser> {
    if (USE_MOCK) {
      const user = db.users.find((u) => u.id === traineeId);
      if (!user) throw new Error('Trainee not found');

      // Prevent oversized passport photo (> 2MB)
      if (updates.passport_url && updates.passport_url.length > 2.8 * 1024 * 1024) {
        throw new Error('Passport picture size must not exceed 2MB');
      }

      Object.assign(user, updates);

      db.audit_logs.unshift({
        id: `audit-${Date.now()}`,
        actor_type: 'staff',
        actor_id: actorId,
        action: 'UPDATE_TRAINEE_DETAILS',
        detail: { traineeId, updates: { ...updates, passport_url: updates.passport_url ? '[DATA_URL_ATTACHED]' : undefined }, reason },
        ip_hash: 'client-ip-mock',
        created_at: new Date().toISOString()
      });

      saveMockDB(db);
      const { password_hash, ...clean } = user;
      return { ...clean };
    }
    const { data, error } = await supabase!.from('applicants').update(updates).eq('id', traineeId).select().single();
    if (error) throw error;
    return data;
  },

  async deleteTrainee(traineeId: string, actorId: string): Promise<void> {
    if (USE_MOCK) {
      const user = db.users.find((u) => u.id === traineeId);
      if (!user) throw new Error('User not found');
      if (user.role === 'super_admin') {
        throw new Error('The Super Admin cannot be deleted');
      }
      user.deleted = true;
      refreshOccupancies();
      db.audit_logs.unshift({
        id: `audit-${Date.now()}`,
        actor_type: 'super_admin',
        actor_id: actorId,
        action: 'DELETE_TRAINEE',
        detail: { traineeId, name: user.full_name },
        ip_hash: 'client-ip-mock',
        created_at: new Date().toISOString()
      });
      saveMockDB(db);
      return;
    }
    const { error } = await supabase!.from('applicants').delete().eq('id', traineeId);
    if (error) throw error;
  },

  async restoreTrainee(traineeId: string, actorId: string): Promise<void> {
    if (USE_MOCK) {
      const user = db.users.find((u) => u.id === traineeId);
      if (!user) throw new Error('User not found');
      user.deleted = false;
      refreshOccupancies();
      db.audit_logs.unshift({
        id: `audit-${Date.now()}`,
        actor_type: 'super_admin',
        actor_id: actorId,
        action: 'RESTORE_TRAINEE',
        detail: { traineeId, name: user.full_name },
        ip_hash: 'client-ip-mock',
        created_at: new Date().toISOString()
      });
      saveMockDB(db);
      return;
    }
    // Real mode
  },

  async acknowledgeGraduation(traineeId: string): Promise<void> {
    if (USE_MOCK) {
      const user = db.users.find((u) => u.id === traineeId);
      if (user) {
        user.graduating_acknowledged = true;
        user.deleted = true; // Auto-erase/archive after viewing message as requested
        refreshOccupancies();
        saveMockDB(db);
      }
    }
  },

  // --- HALL ALLOCATION ---
  /**
   * Random fair equal sharing allocation algorithm:
   * Finds active halls with space.
   * Ensures balanced sharing, randomized among halls with minimal occupancy,
   * guaranteeing no single hall is chosen thrice when others have fewer.
   */
  async allocateHall(applicantId: string): Promise<{ hall: Hall | null; status: 'allocated' | 'waitlisted' }> {
    if (USE_MOCK) {
      refreshOccupancies();
      if (!db.settings.portal_open) {
        throw new Error('Portal is currently closed for hall allocation.');
      }

      const applicant = db.users.find((u) => u.id === applicantId);
      if (!applicant) throw new Error('Applicant not found');

      // Idempotent: If already allocated, return existing
      if (applicant.status === 'allocated' && applicant.hall_id) {
        const existing = db.halls.find((h) => h.id === applicant.hall_id);
        return { hall: existing || null, status: 'allocated' };
      }

      const activeHalls = db.halls.filter((h) => h.active && h.occupancy < h.capacity);
      if (activeHalls.length === 0) {
        applicant.status = 'waitlisted';
        saveMockDB(db);
        return { hall: null, status: 'waitlisted' };
      }

      // Fair balanced random allocation:
      // 1. Find minimum occupancy among active halls
      const minOccupancy = Math.min(...activeHalls.map((h) => h.occupancy));
      // 2. Filter to all candidate halls that share this lowest occupancy
      const candidateHalls = activeHalls.filter((h) => h.occupancy === minOccupancy);
      // 3. Pick randomly among these lowest-occupancy candidates
      const chosenHall = candidateHalls[Math.floor(Math.random() * candidateHalls.length)];

      chosenHall.occupancy++;
      applicant.status = 'allocated';
      applicant.hall_id = chosenHall.id;
      applicant.hall_name = chosenHall.name;
      applicant.hall_colour = chosenHall.colour;
      applicant.hall_sms_sent_at = new Date().toISOString();
      applicant.hall_sms_count = (applicant.hall_sms_count || 0) + 1;

      // Log hall SMS
      db.sms_logs.unshift({
        id: `sms-${Date.now()}`,
        applicant_id: applicant.id,
        recipient_phone: applicant.phone_e164,
        kind: 'hall_allocation',
        message_preview: `CTCE: Hello ${applicant.full_name.split(' ')[0]}, you have been allocated to ${chosenHall.name}. Show this message at hall registration.`,
        provider_status: 'delivered',
        created_at: new Date().toISOString()
      });

      db.audit_logs.unshift({
        id: `audit-${Date.now()}`,
        actor_type: 'system',
        actor_id: applicant.id,
        action: 'AUTO_ALLOCATE_HALL',
        detail: { hall: chosenHall.name, method: 'balanced_random' },
        ip_hash: 'client-ip-mock',
        created_at: new Date().toISOString()
      });

      saveMockDB(db);
      return { hall: chosenHall, status: 'allocated' };
    }
    // Real Supabase RPC
    const { data, error } = await supabase!.rpc('allocate_hall', { p_applicant: applicantId });
    if (error) throw error;
    return data;
  },

  async manualAllocate(
    applicantId: string,
    hallId: string,
    reason: string,
    actorId: string
  ): Promise<Hall> {
    if (!reason || reason.trim().length === 0) {
      throw new Error('A specific reason is strictly required for manual allocation.');
    }

    if (USE_MOCK) {
      refreshOccupancies();
      const applicant = db.users.find((u) => u.id === applicantId);
      if (!applicant) throw new Error('Applicant not found');
      const targetHall = db.halls.find((h) => h.id === hallId);
      if (!targetHall) throw new Error('Target hall not found');

      if (targetHall.occupancy >= targetHall.capacity) {
        throw new Error(`${targetHall.name} is currently at maximum capacity (${targetHall.capacity}).`);
      }

      // If reassigning, decrement old hall
      if (applicant.hall_id && applicant.hall_id !== hallId) {
        const oldHall = db.halls.find((h) => h.id === applicant.hall_id);
        if (oldHall) oldHall.occupancy = Math.max(0, oldHall.occupancy - 1);
      }

      targetHall.occupancy++;
      applicant.status = 'allocated';
      applicant.hall_id = targetHall.id;
      applicant.hall_name = targetHall.name;
      applicant.hall_colour = targetHall.colour;

      db.sms_logs.unshift({
        id: `sms-${Date.now()}`,
        applicant_id: applicant.id,
        recipient_phone: applicant.phone_e164,
        kind: 'hall_allocation',
        message_preview: `CTCE: Hello ${applicant.full_name.split(' ')[0]}, you have been reallocated to ${targetHall.name}. Show this message at hall registration.`,
        provider_status: 'delivered',
        created_at: new Date().toISOString()
      });

      db.audit_logs.unshift({
        id: `audit-${Date.now()}`,
        actor_type: 'staff',
        actor_id: actorId,
        action: 'MANUAL_ALLOCATE',
        detail: { applicantId, newHall: targetHall.name, reason },
        ip_hash: 'client-ip-mock',
        created_at: new Date().toISOString()
      });

      saveMockDB(db);
      return { ...targetHall };
    }
    // Real Supabase RPC
    const { data, error } = await supabase!.rpc('manual_allocate', {
      p_applicant: applicantId,
      p_hall: hallId,
      p_reason: reason
    });
    if (error) throw error;
    return data;
  },

  async resendHallSms(applicantId: string, turnstileToken?: string): Promise<void> {
    if (USE_MOCK) {
      const applicant = db.users.find((u) => u.id === applicantId);
      if (!applicant || !applicant.hall_name) {
        throw new Error('No allocated hall found to resend SMS for.');
      }
      if (applicant.hall_sms_count >= 10) {
        throw new Error('Maximum SMS resend limit (10) reached for this account.');
      }
      applicant.hall_sms_count = (applicant.hall_sms_count || 0) + 1;
      applicant.hall_sms_sent_at = new Date().toISOString();

      db.sms_logs.unshift({
        id: `sms-${Date.now()}`,
        applicant_id: applicant.id,
        recipient_phone: applicant.phone_e164,
        kind: 'hall_allocation',
        message_preview: `CTCE: Hello ${applicant.full_name.split(' ')[0]}, you have been allocated to ${applicant.hall_name}. Show this message at hall registration.`,
        provider_status: 'delivered',
        created_at: new Date().toISOString()
      });

      saveMockDB(db);
      return;
    }

    // Real Edge Function call
    const token = sessionStorage.getItem('applicant_token');
    const res = await fetch(`${SUPABASE_URL}/functions/v1/resend-hall-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        applicantId,
        turnstileToken: turnstileToken || 'turnstile-token-bypass-dev'
      })
    });

    if (res.status === 429) {
      const retryHeader = res.headers.get('Retry-After');
      const data = await res.json().catch(() => ({}));
      throw new RateLimitError(
        data.error || 'Rate limit reached: Please wait before requesting another SMS.',
        retryHeader ? parseInt(retryHeader, 10) : RESEND_COOLDOWN_SECONDS
      );
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to resend hall allocation SMS.');
    }
  },

  async getMyHall(token?: string): Promise<any> {
    if (USE_MOCK) {
      const session = this.getCurrentSession();
      if (!session || !session.user) throw new Error('Not authenticated.');
      return {
        applicant: {
          id: session.user.id,
          fullName: session.user.full_name,
          applicantRef: session.user.trainee_id || session.user.id,
          status: session.user.status,
          hall: session.user.hall_name
            ? {
                id: session.user.hall_id,
                name: session.user.hall_name,
                colour: session.user.hall_colour
              }
            : null
        }
      };
    }

    const sessionToken = token || sessionStorage.getItem('applicant_token');
    if (!sessionToken) {
      throw new Error('Unauthorized: No active applicant session token found.');
    }

    const res = await fetch(`${SUPABASE_URL}/functions/v1/get-my-hall`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`
      }
    });

    if (res.status === 401) {
      sessionStorage.removeItem('applicant_token');
      sessionStorage.removeItem('applicant_token_expires_at');
      throw new Error('Applicant session expired. Please verify your phone again.');
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to retrieve hall allocation.');
    }

    return await res.json();
  },

  // --- SMS LOGS & BULK SMS ---
  async getSmsLogs(): Promise<SmsLogEntry[]> {
    if (USE_MOCK) {
      return [...db.sms_logs];
    }
    const { data, error } = await supabase!.from('sms_log').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async sendBulkSms(
    recipients: string[],
    message: string,
    actorId: string
  ): Promise<{ sentCount: number; unitsUsed: number }> {
    if (!message || message.trim().length === 0) {
      throw new Error('SMS message content cannot be empty.');
    }
    // 140 characters per unit rule as requested
    const unitsPerMessage = Math.ceil(message.length / 140) || 1;
    const totalUnits = unitsPerMessage * recipients.length;

    if (USE_MOCK) {
      recipients.forEach((phone) => {
        db.sms_logs.unshift({
          id: `sms-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          recipient_phone: phone,
          kind: 'bulk',
          message_preview: message.slice(0, 140),
          provider_status: 'delivered',
          created_at: new Date().toISOString()
        });
      });

      db.audit_logs.unshift({
        id: `audit-${Date.now()}`,
        actor_type: 'staff',
        actor_id: actorId,
        action: 'BULK_SMS_DISPATCH',
        detail: { recipientCount: recipients.length, unitsUsed: totalUnits },
        ip_hash: 'client-ip-mock',
        created_at: new Date().toISOString()
      });

      saveMockDB(db);
      return { sentCount: recipients.length, unitsUsed: totalUnits };
    }
    // Real call via Edge Function
    return { sentCount: recipients.length, unitsUsed: totalUnits };
  },

  // --- AUDIT LOGS ---
  async getAuditLogs(): Promise<AuditLogEntry[]> {
    if (USE_MOCK) {
      return [...db.audit_logs];
    }
    const { data, error } = await supabase!.from('audit_log').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // --- PASSWORD RESET & OTP ---
  async requestPasswordResetOtp(phoneE164: string): Promise<void> {
    if (USE_MOCK) {
      const user = db.users.find((u) => !u.deleted && u.phone_e164 === phoneE164);
      if (!user) {
        throw new Error('No registered account found matching this phone number.');
      }

      const now = Date.now();
      if (!db.rate_limits) db.rate_limits = [];

      // Check per-IP rate limit: 4 OTP SMS sends per IP per hour
      const ipKey = 'ip:mock-client-session';
      let ipEntry = db.rate_limits.find((r) => r.key === ipKey);
      if (!ipEntry || now - ipEntry.window_start >= IP_RATE_LIMIT_WINDOW_SECONDS * 1000) {
        ipEntry = { key: ipKey, window_start: now, count: 1 };
        db.rate_limits = db.rate_limits.filter((r) => r.key !== ipKey);
        db.rate_limits.push(ipEntry);
      } else {
        if (ipEntry.count >= IP_RATE_LIMIT_MAX) {
          const retryAfter = Math.max(
            1,
            Math.ceil((ipEntry.window_start + IP_RATE_LIMIT_WINDOW_SECONDS * 1000 - now) / 1000)
          );
          saveMockDB(db);
          throw new RateLimitError(
            `Rate limit exceeded: Maximum ${IP_RATE_LIMIT_MAX} OTP SMS sends per IP per hour. Please wait before requesting another code.`,
            retryAfter
          );
        }
        ipEntry.count++;
      }

      // Check minimum 60-second cooldown between resends
      const recentOtp = db.otps.find((o) => o.phone === phoneE164 && o.purpose === 'password_reset');
      if (recentOtp && recentOtp.created_at && now - recentOtp.created_at < RESEND_COOLDOWN_SECONDS * 1000) {
        const remainingCooldown = Math.max(
          1,
          Math.ceil((RESEND_COOLDOWN_SECONDS * 1000 - (now - recentOtp.created_at)) / 1000)
        );
        throw new RateLimitError(
          `Please wait ${remainingCooldown}s before requesting a new code.`,
          remainingCooldown
        );
      }

      // Generate secure 6-digit code using crypto
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      const code = (100000 + (array[0] % 900000)).toString();

      // Store OTP
      db.otps = db.otps.filter((o) => o.phone !== phoneE164);
      db.otps.push({
        phone: phoneE164,
        code,
        expires_at: now + 5 * 60 * 1000, // 5 min
        purpose: 'password_reset',
        created_at: now
      });

      // Record in SMS log WITHOUT disclosing the code in UI
      db.sms_logs.unshift({
        id: `sms-${Date.now()}`,
        applicant_id: user.id,
        recipient_phone: phoneE164,
        kind: 'password_reset',
        message_preview: 'CTCE Hall Portal: your code is [REDACTED]. It expires in 5 minutes. Do not share it.',
        provider_status: 'delivered',
        created_at: new Date().toISOString()
      });

      sessionStorage.setItem(`mock_last_otp_${phoneE164}`, code);
      saveMockDB(db);
      return;
    }

    // Real Edge Function call for password reset OTP
    const res = await fetch(`${SUPABASE_URL}/functions/v1/request-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ phone: phoneE164, kind: 'password_reset' })
    });

    if (res.status === 429) {
      const retryAfterHeader = res.headers.get('Retry-After');
      let retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : RESEND_COOLDOWN_SECONDS;
      const data = await res.json().catch(() => ({}));
      if (typeof data.retryAfter === 'number') retryAfter = data.retryAfter;
      throw new RateLimitError(
        data.error || 'Rate limit exceeded: Please wait before requesting another code.',
        retryAfter
      );
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to dispatch verification code.');
    }
  },

  async verifyPasswordResetOtpAndSetPassword(
    phoneE164: string,
    otpCode: string,
    newPassword: string
  ): Promise<void> {
    if (USE_MOCK) {
      const entry = db.otps.find(
        (o) => o.phone === phoneE164 && o.purpose === 'password_reset'
      );
      if (!entry || entry.expires_at < Date.now()) {
        throw new Error('Invalid or expired verification code.');
      }
      if (entry.code !== otpCode.trim()) {
        throw new Error('Incorrect verification code. Please try again.');
      }

      const user = db.users.find((u) => !u.deleted && u.phone_e164 === phoneE164);
      if (!user) throw new Error('User not found.');

      user.password_hash = newPassword;
      db.otps = db.otps.filter((o) => o.phone !== phoneE164);

      db.audit_logs.unshift({
        id: `audit-${Date.now()}`,
        actor_type: 'applicant',
        actor_id: user.id,
        action: 'PASSWORD_RESET_SUCCESS',
        detail: { phone: phoneE164 },
        ip_hash: 'client-ip-mock',
        created_at: new Date().toISOString()
      });

      saveMockDB(db);
      return;
    }
    // Real Edge Function call
  },

  // --- SIGN UP OTP VERIFICATION ---
  async requestSignUpOtp(
    phoneE164: string,
    fullName?: string,
    studentId?: string,
    turnstileToken?: string
  ): Promise<void> {
    if (USE_MOCK) {
      const existingPhone = db.users.find((u) => !u.deleted && u.phone_e164 === phoneE164);
      if (existingPhone) {
        throw new Error('An account with this phone number already exists.');
      }

      const now = Date.now();
      if (!db.rate_limits) db.rate_limits = [];

      // Check per-IP rate limit: 4 OTP SMS sends per IP per hour (first send plus resends)
      const ipKey = 'ip:mock-client-session';
      let ipEntry = db.rate_limits.find((r) => r.key === ipKey);
      if (!ipEntry || now - ipEntry.window_start >= IP_RATE_LIMIT_WINDOW_SECONDS * 1000) {
        ipEntry = { key: ipKey, window_start: now, count: 1 };
        db.rate_limits = db.rate_limits.filter((r) => r.key !== ipKey);
        db.rate_limits.push(ipEntry);
      } else {
        if (ipEntry.count >= IP_RATE_LIMIT_MAX) {
          const retryAfter = Math.max(
            1,
            Math.ceil((ipEntry.window_start + IP_RATE_LIMIT_WINDOW_SECONDS * 1000 - now) / 1000)
          );
          saveMockDB(db);
          throw new RateLimitError(
            `Rate limit exceeded: Maximum ${IP_RATE_LIMIT_MAX} OTP SMS sends per IP per hour. Please wait before requesting another code.`,
            retryAfter
          );
        }
        ipEntry.count++;
      }

      // Check minimum 60-second cooldown between resends
      const recentOtp = db.otps.find((o) => o.phone === phoneE164 && o.purpose === 'signup');
      if (recentOtp && recentOtp.created_at && now - recentOtp.created_at < RESEND_COOLDOWN_SECONDS * 1000) {
        const remainingCooldown = Math.max(
          1,
          Math.ceil((RESEND_COOLDOWN_SECONDS * 1000 - (now - recentOtp.created_at)) / 1000)
        );
        throw new RateLimitError(
          `Please wait ${remainingCooldown}s before requesting a new code.`,
          remainingCooldown
        );
      }

      // Auto-generate secure 6-digit code using Web Crypto
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      const code = (100000 + (array[0] % 900000)).toString();

      db.otps = db.otps.filter((o) => !(o.phone === phoneE164 && o.purpose === 'signup'));
      db.otps.push({
        phone: phoneE164,
        code,
        expires_at: now + 5 * 60 * 1000,
        purpose: 'signup',
        created_at: now
      });

      db.sms_logs.unshift({
        id: `sms-${Date.now()}`,
        recipient_phone: phoneE164,
        kind: 'otp',
        message_preview: `CTCE Hall Portal: your registration verification code is ${code}. It expires in 5 minutes. Do not share it.`,
        provider_status: 'delivered',
        created_at: new Date().toISOString()
      });

      sessionStorage.setItem(`mock_signup_otp_${phoneE164}`, code);
      saveMockDB(db);
      return;
    }

    // Real Edge Function call
    const response = await fetch(`${SUPABASE_URL}/functions/v1/request-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        phone: phoneE164,
        fullName,
        studentId,
        turnstileToken
      })
    });

    if (response.status === 429) {
      const retryAfterHeader = response.headers.get('Retry-After');
      let retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : RESEND_COOLDOWN_SECONDS;
      const data = await response.json().catch(() => ({}));
      if (typeof data.retryAfter === 'number') retryAfter = data.retryAfter;
      throw new RateLimitError(
        data.error || 'Rate limit exceeded: Please wait before requesting another code.',
        retryAfter
      );
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to dispatch verification code.');
    }
  },

  async verifyOtp(phoneE164: string, code: string): Promise<any> {
    if (USE_MOCK) {
      const entry = db.otps.find((o) => o.phone === phoneE164 && (o.purpose === 'signup' || o.purpose === 'applicant'));
      if (!entry || entry.expires_at < Date.now()) {
        throw new Error('Verification code has expired or is invalid. Please request a new code.');
      }
      if (entry.code !== code.trim()) {
        throw new Error('Incorrect verification code. Please check and re-enter.');
      }
      db.otps = db.otps.filter((o) => o !== entry);
      saveMockDB(db);
      return { success: true };
    }

    // Real Edge Function call: verify-otp
    const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ phone: phoneE164, code: code.trim() })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Verification failed.');
    }

    const data = await res.json();
    if (data.token) {
      sessionStorage.setItem('applicant_token', data.token);
      sessionStorage.setItem('applicant_token_expires_at', (Date.now() + 30 * 60 * 1000).toString());
    }
    return data;
  },

  async verifySignUpOtp(phoneE164: string, code: string): Promise<boolean> {
    if (USE_MOCK) {
      const entry = db.otps.find((o) => o.phone === phoneE164 && o.purpose === 'signup');
      if (!entry || entry.expires_at < Date.now()) {
        throw new Error('Verification code has expired or is invalid. Please request a new code.');
      }
      if (entry.code !== code.trim()) {
        throw new Error('Incorrect verification code. Please check and re-enter.');
      }
      db.otps = db.otps.filter((o) => !(o.phone === phoneE164 && o.purpose === 'signup'));
      saveMockDB(db);
      return true;
    }

    await this.verifyOtp(phoneE164, code);
    return true;
  },

  // --- VIEWER FUNCTIONS (EDGE FUNCTIONS) ---
  async viewerRequestOtp(phoneE164: string, turnstileToken?: string): Promise<void> {
    if (USE_MOCK) {
      const viewer = db.users.find(
        (u) => !u.deleted && u.phone_e164 === phoneE164 && (u.role === 'viewer' || u.role === 'admin' || u.role === 'super_admin')
      );
      if (!viewer) {
        throw new Error('No active Viewer account found registered with this phone number.');
      }
      const now = Date.now();
      const code = '123456';
      db.otps = db.otps.filter((o) => !(o.phone === phoneE164 && o.purpose === 'viewer'));
      db.otps.push({
        phone: phoneE164,
        code,
        expires_at: now + 5 * 60 * 1000,
        purpose: 'viewer',
        created_at: now
      });
      sessionStorage.setItem(`mock_viewer_otp_${phoneE164}`, code);
      saveMockDB(db);
      return;
    }

    const res = await fetch(`${SUPABASE_URL}/functions/v1/viewer-request-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        phone: phoneE164,
        turnstileToken: turnstileToken || 'viewer-turnstile-token'
      })
    });

    if (res.status === 429) {
      const retryHeader = res.headers.get('Retry-After');
      const data = await res.json().catch(() => ({}));
      throw new RateLimitError(
        data.error || 'Rate limit reached: Maximum 4 SMS codes per hour.',
        retryHeader ? parseInt(retryHeader, 10) : RESEND_COOLDOWN_SECONDS
      );
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to request Viewer verification code.');
    }
  },

  async viewerVerifyOtp(phoneE164: string, code: string, turnstileToken?: string): Promise<any> {
    if (USE_MOCK) {
      const viewer = db.users.find(
        (u) => !u.deleted && u.phone_e164 === phoneE164 && (u.role === 'viewer' || u.role === 'admin' || u.role === 'super_admin')
      );
      if (!viewer) {
        throw new Error('Viewer account not found.');
      }
      const entry = db.otps.find((o) => o.phone === phoneE164 && o.purpose === 'viewer');
      if (!entry || entry.expires_at < Date.now()) {
        throw new Error('Verification code has expired or is invalid.');
      }
      if (entry.code !== code.trim()) {
        throw new Error('Incorrect verification code. Please check and re-enter.');
      }
      db.otps = db.otps.filter((o) => o !== entry);
      saveMockDB(db);

      const session: AuthSession = {
        token: `mock-viewer-token-${Date.now()}`,
        user: viewer,
        expires_at: Date.now() + 30 * 60 * 1000
      };
      this.setMemorySession(session);
      return { token: session.token, viewer: { id: viewer.id, fullName: viewer.full_name, role: 'viewer' } };
    }

    const res = await fetch(`${SUPABASE_URL}/functions/v1/viewer-verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        phone: phoneE164,
        code: code.trim(),
        turnstileToken
      })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Viewer verification failed.');
    }

    const data = await res.json();
    if (data.token) {
      sessionStorage.setItem('viewer_token', data.token);
      sessionStorage.setItem('viewer_token_expires_at', (Date.now() + 30 * 60 * 1000).toString());
    }
    return data;
  },

  async viewerSearch(query: string): Promise<any[]> {
    if (USE_MOCK) {
      const q = query.trim().toLowerCase();
      const list = db.users.filter((u) => !u.deleted && u.status === 'allocated');
      const filtered = q
        ? list.filter(
            (u) =>
              u.full_name.toLowerCase().includes(q) ||
              (u.trainee_id && u.trainee_id.toLowerCase().includes(q))
          )
        : list;

      return filtered.map((u) => ({
        fullName: u.full_name,
        applicantRef: u.trainee_id || u.id,
        maskedPhone: u.phone_e164
          ? `+233 ${u.phone_e164.slice(4, 6)} *** **${u.phone_e164.slice(-2)}`
          : '+233 ** *** **00',
        hallName: u.hall_name || 'Unallocated',
        hallColour: u.hall_colour || 'neutral'
      }));
    }

    const token = sessionStorage.getItem('viewer_token');
    if (!token) {
      throw new Error('Unauthorized: Missing Viewer session token.');
    }

    const res = await fetch(`${SUPABASE_URL}/functions/v1/viewer-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ query })
    });

    if (res.status === 401 || res.status === 403) {
      sessionStorage.removeItem('viewer_token');
      sessionStorage.removeItem('viewer_token_expires_at');
      throw new Error('Viewer session expired or unauthorized. Please verify your phone again.');
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Viewer search failed.');
    }

    const data = await res.json();
    return data.results || [];
  },

  // --- SIGN UP ---
  async signUp(params: {
    email: string;
    phoneE164: string;
    fullName: string;
    password: string;
    isContinuingStudent: boolean;
    traineeId?: string;
    level?: number;
    programme?: string;
  }): Promise<TraineeUser> {
    if (USE_MOCK) {
      // Check existing email
      const existingEmail = db.users.find((u) => !u.deleted && u.email.toLowerCase() === params.email.toLowerCase());
      if (existingEmail) {
        throw new Error('An account with this email address already exists.');
      }
      // Check existing verified phone
      const existingPhone = db.users.find((u) => !u.deleted && u.phone_e164 === params.phoneE164);
      if (existingPhone) {
        throw new Error('An account with this phone number already exists.');
      }

      const role: UserRole = params.isContinuingStudent ? 'viewer' : 'applicant';
      // If continuing student with Trainee ID, level determined by ID; else level 100
      const level = params.level || (params.isContinuingStudent ? 200 : 100);

      // Random initial hall for continuing students if they already have one
      let hallId: string | undefined = undefined;
      let hallName: string | undefined = undefined;
      let hallColour: string | undefined = undefined;
      let status: any = 'pending';

      if (params.isContinuingStudent) {
        const randomHall = db.halls[Math.floor(Math.random() * db.halls.length)];
        hallId = randomHall.id;
        hallName = randomHall.name;
        hallColour = randomHall.colour;
        status = 'allocated';
        randomHall.occupancy++;
      }

      const newUser: TraineeUser & { password_hash: string } = {
        id: `user-${Date.now()}`,
        email: params.email.trim().toLowerCase(),
        phone_e164: params.phoneE164,
        full_name: params.fullName.trim(),
        trainee_id: params.traineeId || undefined,
        programme: params.programme || 'Bachelor of Education (Primary)',
        level,
        role,
        status,
        hall_id: hallId,
        hall_name: hallName,
        hall_colour: hallColour,
        created_at: new Date().toISOString(),
        phone_verified_at: new Date().toISOString(),
        hall_sms_count: 0,
        password_hash: params.password
      };

      db.users.push(newUser);

      db.audit_logs.unshift({
        id: `audit-${Date.now()}`,
        actor_type: role,
        actor_id: newUser.id,
        action: 'ACCOUNT_REGISTRATION',
        detail: {
          role,
          level,
          hasTraineeId: Boolean(params.traineeId)
        },
        ip_hash: 'client-ip-mock',
        created_at: new Date().toISOString()
      });

      saveMockDB(db);
      const { password_hash, ...clean } = newUser;
      return clean;
    }
    // Real Supabase Auth / signup Edge function
    throw new Error('Real backend sign up not implemented');
  },

  // --- CSV EXPORT (Formula neutralisation as specified) ---
  exportApplicantsCsv(): string {
    const list = db.users.filter((u) => !u.deleted && u.role !== 'super_admin');
    const headers = ['Full Name', 'Trainee ID', 'Level', 'Phone', 'Programme', 'Status', 'Hall', 'Registered Date'];

    // Neutralise spreadsheet formulas: prefix =, +, -, @ with single quote
    const sanitize = (val: any) => {
      if (val === null || val === undefined) return '""';
      let s = String(val).trim();
      if (/^[=+\-@]/.test(s)) {
        s = `'${s}`;
      }
      return `"${s.replace(/"/g, '""')}"`;
    };

    const rows = list.map((u) => [
      sanitize(u.full_name),
      sanitize(u.trainee_id || 'PENDING'),
      sanitize(`Level ${u.level}`),
      sanitize(u.phone_e164),
      sanitize(u.programme),
      sanitize(u.status),
      sanitize(u.hall_name || 'Unallocated'),
      sanitize(new Date(u.created_at).toLocaleDateString())
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }
};
