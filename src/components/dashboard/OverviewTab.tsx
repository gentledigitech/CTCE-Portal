import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { SystemSettings, Hall } from '../../types';
import {
  GraduationCap,
  Building,
  Calendar,
  CheckCircle,
  Clock,
  Award,
  Sparkles
} from 'lucide-react';

interface OverviewTabProps {
  settings: SystemSettings | null;
  halls: Hall[];
  onNavigateTab: (tab: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  settings,
  halls,
  onNavigateTab
}) => {
  const { user } = useAuth();

  if (!user) return null;

  const currentHall = halls.find((h) => h.id === user.hall_id) || (user.hall_name ? { name: user.hall_name, colour: user.hall_colour } : null);

  return (
    <div className="space-y-6">
      {/* Glossy Welcome Banner with Light Green & Sky Blue Gradients */}
      <div className="bg-gradient-to-br from-emerald-900 via-sky-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden border border-white/20">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-xs font-semibold text-sky-200 mb-3 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            CTCE Portal Academic Dashboard
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Welcome, {user.full_name}
          </h1>
          <p className="text-sky-100/90 text-xs sm:text-sm leading-relaxed mb-4">
            {user.role === 'applicant'
              ? 'Welcome to your portal. You can monitor your hall allocation status, view your modular courses, and edit your profile.'
              : user.role === 'viewer'
              ? 'Your continuing trainee records are active. Review your academic standing, current level courses, and residential status.'
              : 'Administrative command center for trainees management, hall allocations, and institutional session operations.'}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {user.role === 'applicant' && user.status !== 'allocated' && (
              <button
                onClick={() => onNavigateTab('allocation')}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-stone-950 font-bold text-xs rounded-xl transition shadow-xs min-h-[44px] flex items-center gap-2"
              >
                <Building className="w-4 h-4" />
                Go to Hall Allocation
              </button>
            )}
            <button
              onClick={() => onNavigateTab('course')}
              className="px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-semibold text-xs rounded-xl transition border border-white/30 min-h-[44px] flex items-center gap-2"
            >
              <Award className="w-4 h-4 text-sky-300" />
              View Courses
            </button>
          </div>
        </div>
      </div>

      {/* Trainee Academic Standing Cards: ONLY Level and Semester */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Level */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl p-5 border border-sky-100 dark:border-sky-900/40 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Current Level</div>
            <div className="text-2xl font-black text-stone-900 dark:text-white">Level {user.level}</div>
            <div className="text-xs text-stone-600 dark:text-stone-300 mt-0.5 truncate max-w-[200px]">{user.programme}</div>
          </div>
        </div>

        {/* Card 2: Semester & Academic Year */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl p-5 border border-sky-100 dark:border-sky-900/40 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 flex items-center justify-center shrink-0 border border-sky-200 dark:border-sky-800">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Current Semester</div>
            <div className="text-2xl font-black text-stone-900 dark:text-white">
              Semester {settings ? settings.current_semester : 1}
            </div>
            <div className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
              Academic Year {settings ? settings.current_academic_year : '2026/2027'}
            </div>
          </div>
        </div>

        {/* Card 3: Hall Status */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl p-5 border border-sky-100 dark:border-sky-900/40 shadow-xs flex items-center gap-4 sm:col-span-2 lg:col-span-1">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Allocated Hall</div>
            {currentHall ? (
              <div>
                <div className="text-lg font-bold text-stone-900 dark:text-white leading-tight">
                  {currentHall.name}
                </div>
                <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Allocated
                </div>
              </div>
            ) : user.status === 'waitlisted' ? (
              <div>
                <div className="text-lg font-bold text-amber-800 dark:text-amber-300">Waitlisted</div>
                <div className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 mt-1">
                  <Clock className="w-3.5 h-3.5" /> Pending capacity
                </div>
              </div>
            ) : (
              <div>
                <div className="text-base font-bold text-stone-600 dark:text-stone-300">Pending Allocation</div>
                <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Not yet allocated to hall</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hall Capacity & Occupancy Overview (Live Data) */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl p-6 border border-sky-100 dark:border-sky-900/40 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-white">Residential Halls Overview</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">Live capacity and occupancy across college halls</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            {halls.reduce((acc, h) => acc + h.occupancy, 0)} Occupied / {halls.reduce((acc, h) => acc + h.capacity, 0)} Total
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {halls.map((hall) => {
            const percent = Math.min(100, Math.round((hall.occupancy / (hall.capacity || 1)) * 100));
            const isUserHall = user.hall_id === hall.id || user.hall_name === hall.name;

            return (
              <div
                key={hall.id}
                className={`p-4 rounded-xl border transition ${
                  isUserHall
                    ? 'border-emerald-500 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                    : 'border-stone-200 dark:border-slate-800 bg-stone-50/60 dark:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: hall.colour_hex }}
                    />
                    <span className="font-bold text-sm text-stone-900 dark:text-white">{hall.name}</span>
                  </div>
                  {isUserHall && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-700 text-white uppercase tracking-wider">
                      Your Hall
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 mb-1.5">
                  <span>Occupancy: {hall.occupancy} / {hall.capacity} spaces</span>
                  <span className="font-bold">{percent}%</span>
                </div>

                <div className="w-full bg-stone-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: hall.colour_hex
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
