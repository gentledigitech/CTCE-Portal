import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SystemSettings, Hall } from '../../types';
import { api } from '../../lib/api';
import { validateGhanaPhone, validateStudentId, validateFullName } from '../../lib/validators';
import {
  Settings,
  Camera,
  User,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Building,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface SettingsTabProps {
  settings: SystemSettings | null;
  halls: Hall[];
  onRefreshData: () => Promise<void>;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  halls,
  onRefreshData
}) => {
  const { user, updateCurrentUserProfile, refreshUser } = useAuth();

  // User Profile Form
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone_e164 || '');
  const [traineeId, setTraineeId] = useState(user?.trainee_id || '');
  const [programme, setProgramme] = useState(user?.programme || '');
  const [passportBase64, setPassportBase64] = useState<string | undefined>(user?.passport_url);
  const [passportError, setPassportError] = useState<string | null>(null);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Super Admin System Settings Controls
  const [portalOpen, setPortalOpen] = useState(settings?.portal_open ?? true);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(settings?.current_academic_year || '2026/2027');
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(settings?.current_semester || 1);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Super Admin Hall Capacities
  const [hallCapacities, setHallCapacities] = useState<Record<string, number>>(
    halls.reduce((acc, h) => ({ ...acc, [h.id]: h.capacity }), {})
  );
  const [savingHallId, setSavingHallId] = useState<string | null>(null);
  const [hallMsg, setHallMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) return null;

  const isSuperAdmin = user.role === 'super_admin';

  // Handle Passport Photo Upload (Limit 2MB)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size <= 2MB
    if (file.size > 2 * 1024 * 1024) {
      setPassportError('Passport picture size must not exceed 2MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setPassportError('Please select a valid image file (JPEG, PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPassportBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    const nameVal = validateFullName(fullName);
    if (!nameVal.isValid || !nameVal.normalized) {
      setProfileMsg({ type: 'error', text: nameVal.error || 'Invalid name' });
      return;
    }

    const phoneVal = validateGhanaPhone(phone);
    if (!phoneVal.isValid || !phoneVal.normalized) {
      setProfileMsg({ type: 'error', text: phoneVal.error || 'Invalid phone number' });
      return;
    }

    let calculatedLevel = user.level;
    let validatedTraineeId: string | undefined = undefined;

    if (traineeId.trim()) {
      const idVal = validateStudentId(traineeId.trim());
      if (!idVal.isValid || !idVal.normalized) {
        setProfileMsg({ type: 'error', text: idVal.error || 'Invalid Trainee ID format' });
        return;
      }
      validatedTraineeId = idVal.normalized;
      // Determine level if newly added
      if (idVal.level) {
        calculatedLevel = idVal.level;
      }
    }

    setIsSavingProfile(true);
    try {
      await updateCurrentUserProfile({
        full_name: nameVal.normalized,
        phone_e164: phoneVal.normalized,
        trainee_id: validatedTraineeId,
        programme: programme.trim(),
        level: calculatedLevel,
        passport_url: passportBase64
      });

      await onRefreshData();
      setProfileMsg({
        type: 'success',
        text: 'Profile and passport photo updated successfully! Passport is now visible in the header.'
      });
    } catch (err: any) {
      setProfileMsg({
        type: 'error',
        text: err.message || 'Failed to update profile.'
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Super Admin: Save Portal & Academic Year Settings
  const handleSaveSystemSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    setSettingsMsg(null);
    setIsSavingSettings(true);
    try {
      await api.updateSettings(
        {
          portal_open: portalOpen,
          current_academic_year: selectedAcademicYear,
          current_semester: selectedSemester
        },
        user.id
      );
      await refreshUser();
      await onRefreshData();
      setSettingsMsg({
        type: 'success',
        text: 'System settings saved. All trainees have been automatically updated/promoted to their corresponding academic standing!'
      });
    } catch (err: any) {
      setSettingsMsg({
        type: 'error',
        text: err.message || 'Failed to update settings.'
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Super Admin: Update Hall Capacity
  const handleUpdateCapacity = async (hall: Hall) => {
    const newCap = hallCapacities[hall.id];
    if (newCap === undefined || newCap < hall.occupancy) {
      setHallMsg({
        type: 'error',
        text: `Capacity cannot be lower than current occupancy (${hall.occupancy}).`
      });
      return;
    }

    setSavingHallId(hall.id);
    setHallMsg(null);
    try {
      await api.updateHallCapacity(hall.id, newCap, user.id);
      await onRefreshData();
      setHallMsg({
        type: 'success',
        text: `Capacity for ${hall.name} updated to ${newCap}. Waitlisted applicants were re-checked.`
      });
    } catch (err: any) {
      setHallMsg({
        type: 'error',
        text: err.message || 'Error updating hall capacity.'
      });
    } finally {
      setSavingHallId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ---------------- 1. TRAINEE ACCOUNT DETAILS (ALL USERS) ---------------- */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900">
              Trainee Account Details
            </h2>
            <p className="text-xs text-stone-500">
              Manage your personal information, Trainee ID, and upload a verified passport photo (max 2MB).
            </p>
          </div>
        </div>

        {profileMsg && (
          <div
            className={`my-4 p-3.5 rounded-xl text-xs flex items-center gap-2 ${
              profileMsg.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : 'bg-red-50 border border-red-200 text-red-900'
            }`}
          >
            {profileMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span>{profileMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-5 pt-3">
          {/* Passport Photo Upload & Preview */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-200">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-600/30 bg-white shadow-xs shrink-0">
              {passportBase64 ? (
                <img
                  src={passportBase64}
                  alt="Passport preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-stone-400">
                  <Camera className="w-6 h-6 mb-1 text-emerald-700" />
                  <span className="text-[10px] font-semibold">No Photo</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
                Upload Passport Picture (Max 2MB)
              </label>
              <p className="text-xs text-stone-500">
                This image replaces your initials and will appear in the top portal preview alongside your name and level.
              </p>
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handlePhotoUpload}
                className="text-xs text-stone-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-800 file:text-white hover:file:bg-emerald-700 cursor-pointer pt-1"
              />
              {passportError && (
                <p className="text-xs text-red-600 font-semibold">{passportError}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Full Legal Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 text-sm min-h-[44px]"
              />
            </div>

            {/* Trainee ID: Left blank if new applicant until entitled to one */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Trainee ID
              </label>
              <input
                type="text"
                placeholder="Leave blank if new applicant"
                value={traineeId}
                onChange={(e) => setTraineeId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 text-sm uppercase min-h-[44px]"
              />
              <span className="text-[11px] text-stone-500 mt-1 block">
                Format: CTCE/PRG/YY/0XXX (determines level, e.g. 25 = Level 200).
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Phone Contact
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 text-sm min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Programme of Study
              </label>
              <input
                type="text"
                value={programme}
                onChange={(e) => setProgramme(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 text-sm min-h-[44px]"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-6 py-3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs min-h-[44px] flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSavingProfile ? 'Saving Changes...' : 'Save Profile Details'}
            </button>
          </div>
        </form>
      </div>

      {/* ---------------- 2. SUPER ADMIN SYSTEM SETTINGS (PORTAL & ACADEMIC YEAR) ---------------- */}
      {isSuperAdmin && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-900">
                Institutional & Portal Controls
              </h2>
              <p className="text-xs text-stone-500">
                Portal state, 40-year academic cycle calendar, and semester progression.
              </p>
            </div>
          </div>

          {settingsMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                settingsMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border border-red-200 text-red-900'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
              <span>{settingsMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveSystemSettings} className="space-y-5">
            {/* Portal State: Moved from allocation to settings as requested */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-sm text-stone-900 block">
                  Hall Allocation Portal State
                </span>
                <p className="text-xs text-stone-500">
                  When open, newly verified applicants can self-allocate into residential halls.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPortalOpen(!portalOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition min-h-[44px] ${
                  portalOpen
                    ? 'bg-emerald-800 text-white'
                    : 'bg-stone-300 text-stone-700'
                }`}
              >
                {portalOpen ? (
                  <>
                    <ToggleRight className="w-5 h-5 text-emerald-300" /> Open
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-5 h-5 text-stone-500" /> Closed
                  </>
                )}
              </button>
            </div>

            {/* Academic Year Selection (40 continuous counts starting 2026/2027) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Academic Year (40-Year Registry)
                </label>
                <select
                  value={selectedAcademicYear}
                  onChange={(e) => setSelectedAcademicYear(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm font-semibold min-h-[44px]"
                >
                  {settings?.academic_years_list.map((year) => (
                    <option key={year} value={year}>
                      Academic Year {year}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-stone-500 mt-1 block">
                  Advancing the year automatically promotes trainees (100&rarr;200&rarr;300&rarr;400, and 400 graduates).
                </span>
              </div>

              {/* Semester (Two semesters: 1 & 2) */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Active Semester
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(Number(e.target.value) as 1 | 2)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm font-semibold min-h-[44px]"
                >
                  <option value={1}>Semester 1</option>
                  <option value={2}>Semester 2</option>
                </select>
                <span className="text-[11px] text-stone-500 mt-1 block">
                  Updates the curriculum and courses viewed across all student dashboards.
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition shadow-xs min-h-[44px] flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSavingSettings ? 'Updating System...' : 'Apply Academic & Portal Changes'}
            </button>
          </form>

          {/* Hall Capacity Management */}
          <div className="pt-6 border-t border-stone-200">
            <h3 className="text-base font-bold text-stone-900 mb-1">
              Hall Capacities & Limits
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Capacity must be greater than or equal to current occupancy.
            </p>

            {hallMsg && (
              <div
                className={`mb-4 p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                  hallMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border border-red-200 text-red-900'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{hallMsg.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {halls.map((hall) => (
                <div
                  key={hall.id}
                  className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-stone-900">{hall.name}</span>
                    <span className="text-xs text-stone-500">
                      Occupancy: {hall.occupancy}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={hall.occupancy}
                      value={hallCapacities[hall.id] ?? hall.capacity}
                      onChange={(e) =>
                        setHallCapacities({
                          ...hallCapacities,
                          [hall.id]: parseInt(e.target.value, 10) || hall.occupancy
                        })
                      }
                      className="w-28 px-3 py-2 rounded-lg border border-stone-300 text-sm font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateCapacity(hall)}
                      disabled={savingHallId === hall.id}
                      className="px-3 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold min-h-[40px]"
                    >
                      {savingHallId === hall.id ? 'Saving...' : 'Update'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
