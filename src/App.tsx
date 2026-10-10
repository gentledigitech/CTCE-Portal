/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Header } from './components/common/Header';
import { PwaInstallPrompt } from './components/common/PwaInstallPrompt';
import { AuthPage } from './components/auth/AuthPage';
import { OverviewTab } from './components/dashboard/OverviewTab';
import { AllocationTab } from './components/dashboard/AllocationTab';
import { CoursesTab } from './components/dashboard/CoursesTab';
import { TraineesTab } from './components/dashboard/TraineesTab';
import { SettingsTab } from './components/dashboard/SettingsTab';
import { BulkSmsTab } from './components/dashboard/BulkSmsTab';
import { UserManagementTab, SmsLogsTab } from './components/dashboard/SuperAdminTabs';
import { GraduationModal } from './components/dashboard/GraduationModal';
import { api } from './lib/api';
import { Hall, TraineeUser, SystemSettings } from './types';
import {
  LayoutDashboard,
  Building,
  BookOpen,
  Users,
  Settings,
  MessageSquare,
  ShieldAlert,
  FileText,
  Download,
  Menu,
  X,
  ChevronRight,
  Sparkles
} from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [trainees, setTrainees] = useState<TraineeUser[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [showGraduationModal, setShowGraduationModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load backend / mock state
  const loadPortalData = useCallback(async () => {
    try {
      const [s, h, t] = await Promise.all([
        api.getSettings(),
        api.getHalls(),
        api.getTrainees()
      ]);
      setSettings(s);
      setHalls(h);
      setTrainees(t);
    } catch (err) {
      console.error('Error fetching portal data:', err);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadPortalData();
      if (user.status === 'graduated') {
        setShowGraduationModal(true);
      }
    }
  }, [user, loadPortalData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-sky-50 to-white dark:from-slate-950 dark:via-emerald-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-sky-900 dark:text-sky-300 tracking-wider uppercase">
            Loading CTCE Portal...
          </p>
        </div>
      </div>
    );
  }

  // If not logged in, show Auth / Login / Sign Up Page
  if (!user) {
    return (
      <>
        <AuthPage />
        <PwaInstallPrompt />
      </>
    );
  }

  // Determine tabs by role:
  // Applicants: overview, allocation, course, trainees, settings
  // Viewer: overview, course, trainees, settings (NO allocation tab!)
  // Admin: overview, allocate, course, trainees, user, bulk-sms, settings
  // Super Admin: overview, allocate, course, trainees, user, sms-logs, bulk-sms, settings
  const tabs: { id: string; label: string; icon: React.ReactNode }[] = [];

  tabs.push({ id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> });

  // Only Applicants, Admins, and Super Admins get Allocation panel
  if (user.role === 'applicant' || user.role === 'admin' || user.role === 'super_admin') {
    tabs.push({
      id: 'allocation',
      label: user.role === 'applicant' ? 'Allocation' : 'Allocate',
      icon: <Building className="w-4 h-4" />
    });
  }

  tabs.push({ id: 'course', label: 'Courses', icon: <BookOpen className="w-4 h-4" /> });
  tabs.push({ id: 'trainees', label: 'Trainees', icon: <Users className="w-4 h-4" /> });

  // Admin & Super Admin User Management
  if (user.role === 'admin' || user.role === 'super_admin') {
    tabs.push({ id: 'user', label: 'Users', icon: <ShieldAlert className="w-4 h-4" /> });
  }

  // SMS Logs for Super Admin
  if (user.role === 'super_admin') {
    tabs.push({ id: 'sms-logs', label: 'SMS & Logs', icon: <FileText className="w-4 h-4" /> });
  }

  // Bulk SMS sending for Admin and Super Admin
  if (user.role === 'admin' || user.role === 'super_admin') {
    tabs.push({ id: 'bulk-sms', label: 'Broadcast SMS', icon: <MessageSquare className="w-4 h-4" /> });
  }

  // Settings for all roles
  tabs.push({ id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> });

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors duration-200">
      <Header settings={settings} onTriggerInstall={() => setShowInstallModal(true)} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 sm:py-6 space-y-5">
        {/* ============================================================ */}
        {/* PC / DESKTOP HORIZONTAL NAVIGATION BAR (Visible on md and up) */}
        {/* ============================================================ */}
        <div className="hidden md:flex items-center justify-between gap-3 p-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-sky-200/50 dark:border-sky-900/40 shadow-xs">
          <nav aria-label="Desktop Navigation" className="flex items-center gap-1.5 flex-wrap">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs transition min-h-[42px] ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-700 via-sky-700 to-emerald-800 text-white shadow-xs'
                      : 'text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick Download App Action Button on Desktop Navigation */}
          <button
            onClick={() => setShowInstallModal(true)}
            className="px-3.5 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-800 dark:text-sky-300 font-bold text-xs border border-sky-200 dark:border-sky-800 transition flex items-center gap-1.5 shrink-0 min-h-[42px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download App</span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* MOBILE VERTICAL NAVIGATION BAR (Strictly Vertical on Mobile) */}
        {/* ============================================================ */}
        <div className="md:hidden space-y-3">
          {/* Mobile Current Section Header & Toggle */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl p-3 border border-sky-200/60 dark:border-sky-900/40 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                {tabs.find((t) => t.id === activeTab)?.icon}
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                  Active Panel
                </span>
                <div className="text-sm font-extrabold text-stone-900 dark:text-white truncate">
                  {tabs.find((t) => t.id === activeTab)?.label}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowInstallModal(true)}
                title="Download App"
                className="px-2.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1 min-h-[44px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>App</span>
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2.5 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-stone-300 font-bold text-xs flex items-center justify-center min-h-[44px] min-w-[44px]"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Vertical Navigation Panel List on Mobile */}
          {mobileMenuOpen && (
            <nav
              aria-label="Mobile Vertical Navigation"
              className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl p-3 border border-sky-200/60 dark:border-sky-800 shadow-xl space-y-1.5 animate-slide-up"
            >
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                Select Portal Panel
              </div>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-xs transition min-h-[48px] ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-700 via-sky-700 to-emerald-800 text-white shadow-xs'
                        : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? 'text-white' : 'text-sky-600 dark:text-sky-400'}>
                        {tab.icon}
                      </span>
                      <span>{tab.label}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isActive ? 'text-sky-200' : 'text-stone-300'}`} />
                  </button>
                );
              })}

              <div className="pt-2 border-t border-stone-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setShowInstallModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-sky-600 text-white font-bold text-xs shadow-xs min-h-[48px]"
                >
                  <Download className="w-4 h-4" />
                  <span>Download App on this Device</span>
                </button>
              </div>
            </nav>
          )}
        </div>

        {/* Tab Content Section */}
        <section className="pb-12">
          {activeTab === 'overview' && (
            <OverviewTab
              settings={settings}
              halls={halls}
              onNavigateTab={(tab) => {
                setActiveTab(tab);
                setMobileMenuOpen(false);
              }}
            />
          )}

          {activeTab === 'allocation' && (
            <AllocationTab
              halls={halls}
              trainees={trainees}
              onRefreshData={loadPortalData}
            />
          )}

          {activeTab === 'course' && <CoursesTab settings={settings} />}

          {activeTab === 'trainees' && (
            <TraineesTab
              trainees={trainees}
              halls={halls}
              onRefreshData={loadPortalData}
            />
          )}

          {activeTab === 'user' && (
            <UserManagementTab
              trainees={trainees}
              onRefreshData={loadPortalData}
            />
          )}

          {activeTab === 'sms-logs' && <SmsLogsTab />}

          {activeTab === 'bulk-sms' && (
            <BulkSmsTab
              trainees={trainees}
              halls={halls}
              onRefreshData={loadPortalData}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              settings={settings}
              halls={halls}
              onRefreshData={loadPortalData}
            />
          )}
        </section>
      </main>

      {/* Graduation Modal for Level 400 trainees */}
      <GraduationModal
        isOpen={showGraduationModal}
        onClose={() => setShowGraduationModal(false)}
      />

      {/* App Install Download Modal */}
      <PwaInstallPrompt
        forceShowModal={showInstallModal}
        onCloseModal={() => setShowInstallModal(false)}
      />

      {/* App Footer Branding, Version & Copyright */}
      <footer className="w-full border-t border-sky-200/50 dark:border-sky-900/40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md py-4 px-4 text-center text-xs text-stone-500 dark:text-stone-400 space-y-1">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="font-extrabold text-stone-900 dark:text-white">CTCE PORTAL</span>
          <span className="px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-mono text-[10px] font-bold border border-sky-200 dark:border-sky-800">
            V 5.0.0
          </span>
          <span className="text-stone-300 dark:text-slate-600">•</span>
          <span>© 2026, Gentle DigiTech Solutions. All rights reserved.</span>
        </div>
        <div>
          Support Email:{' '}
          <a
            href="mailto:CTCESRC@proton.me"
            className="text-sky-700 dark:text-sky-400 font-semibold hover:underline"
          >
            CTCESRC@proton.me
          </a>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DashboardContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
