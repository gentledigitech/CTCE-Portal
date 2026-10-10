import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LogOut,
  GraduationCap,
  Calendar,
  ShieldCheck,
  User as UserIcon,
  Download,
  Sun,
  Moon
} from 'lucide-react';
import { SystemSettings } from '../../types';

interface HeaderProps {
  settings: SystemSettings | null;
  onTriggerInstall?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ settings, onTriggerInstall }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [logoSrc, setLogoSrc] = useState('/college-logo.png');
  const [logoError, setLogoError] = useState(false);

  const handleLogoError = () => {
    if (logoSrc === '/college-logo.png') {
      setLogoSrc('https://lh3.googleusercontent.com/d/1oKmWTIanlo2adz7GWseEkQZayxA8NFBH');
    } else {
      setLogoError(true);
    }
  };

  if (!user) return null;

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Staff Admin',
    viewer: 'Continuing Trainee',
    applicant: 'New Applicant'
  };

  return (
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-sky-200/50 dark:border-sky-900/40 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* Left: College Logo & Brand (College name removed beneath logo as requested) */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-white via-sky-50 to-emerald-50 dark:from-slate-800 dark:to-slate-900 border border-sky-200/80 dark:border-sky-800/60 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
            {!logoError ? (
              <img
                src={logoSrc}
                alt="CTCE College Logo"
                referrerPolicy="no-referrer"
                onError={handleLogoError}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-800 text-white rounded-xl">
                <GraduationCap className="w-6 h-6 text-sky-300" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-emerald-900 via-sky-900 to-emerald-950 dark:from-sky-300 dark:via-emerald-300 dark:to-white bg-clip-text text-transparent">
                CTCE PORTAL
              </span>
              {user.role === 'super_admin' && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-900 dark:bg-sky-900/60 dark:text-sky-200 border border-sky-300 dark:border-sky-700 shadow-2xs">
                  <ShieldCheck className="w-3 h-3 text-sky-600 dark:text-sky-300" />
                  Super Admin
                </span>
              )}
            </div>
            {/* College name beneath logo is removed */}
          </div>
        </div>

        {/* Right: Academic pill, Download App, Theme Toggle, Trainee Profile & Sign Out */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Academic Period pill (from live system settings) */}
          {settings && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50/90 dark:bg-slate-800/90 border border-sky-200/80 dark:border-sky-800/80 text-xs font-bold text-sky-900 dark:text-sky-200 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>{settings.current_academic_year}</span>
              <span className="text-sky-300 dark:text-sky-600">•</span>
              <span>Sem {settings.current_semester}</span>
            </div>
          )}

          {/* Download App Button */}
          {onTriggerInstall && (
            <button
              onClick={onTriggerInstall}
              title="Download App (PWA)"
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white font-bold text-xs shadow-xs hover:shadow-md transition flex items-center gap-1.5 min-h-[40px]"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download App</span>
            </button>
          )}

          {/* Dark / Light Mode Switch */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 sm:px-2.5 sm:py-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition border border-stone-200/80 dark:border-slate-700 min-h-[40px] min-w-[40px] flex items-center justify-center shadow-2xs"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-sky-700" />
            )}
          </button>

          {/* Trainee Name & Level */}
          <div className="flex items-center gap-2 sm:gap-3 pl-2 border-l border-stone-200 dark:border-slate-700">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-stone-900 dark:text-white truncate max-w-[150px]">
                {user.full_name}
              </div>
              <div className="flex items-center justify-end gap-1.5 text-xs">
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  Level {user.level}
                </span>
                <span className="text-stone-300 dark:text-slate-600">|</span>
                <span className="text-stone-500 dark:text-stone-400 text-[11px]">
                  {roleLabels[user.role] || user.role}
                </span>
              </div>
            </div>

            {/* Passport Photo Preview */}
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-sky-400/50 dark:border-sky-500/50 bg-gradient-to-br from-emerald-100 to-sky-100 dark:from-slate-800 dark:to-slate-700 shadow-xs shrink-0">
              {user.passport_url ? (
                <img
                  src={user.passport_url}
                  alt={user.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-700 via-sky-800 to-emerald-900 text-white font-bold text-xs sm:text-sm">
                  {user.full_name
                    ? user.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : <UserIcon className="w-5 h-5 text-sky-200" />}
                </div>
              )}
            </div>

            {/* Sign Out Button */}
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 sm:px-2.5 sm:py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition border border-transparent hover:border-red-200 dark:hover:border-red-900 min-h-[40px] min-w-[40px] flex items-center justify-center gap-1.5 text-xs font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden xl:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
