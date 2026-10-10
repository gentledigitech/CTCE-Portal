import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, RateLimitError } from '../../lib/api';
import { Hall, TraineeUser } from '../../types';
import { validateGhanaPhone, validateStudentId, validateFullName } from '../../lib/validators';
import {
  Building,
  CheckCircle2,
  Clock,
  Send,
  UserPlus,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AllocationTabProps {
  halls: Hall[];
  trainees: TraineeUser[];
  onRefreshData: () => Promise<void>;
}

export const AllocationTab: React.FC<AllocationTabProps> = ({
  halls,
  trainees,
  onRefreshData
}) => {
  const { user, refreshUser } = useAuth();

  // Applicant state
  const [isAllocatingSelf, setIsAllocatingSelf] = useState(false);
  const [resendingSms, setResendingSms] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [selfActionMsg, setSelfActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Query get-my-hall endpoint on result screen
  useEffect(() => {
    if (user && user.role === 'applicant') {
      api.getMyHall().then((data) => {
        if (data?.applicant && (data.applicant.status !== user.status || data.applicant.hall?.name !== user.hall_name)) {
          refreshUser();
        }
      }).catch(() => {});
    }
  }, [user?.id, refreshUser]);

  // Admin / Super Admin Data Entry Form State (Step-by-step entry)
  const [entryFullName, setEntryFullName] = useState('');
  const [entryEmail, setEntryEmail] = useState('');
  const [entryPhone, setEntryPhone] = useState('');
  const [entryProgramme, setEntryProgramme] = useState('Bachelor of Education (Primary)');
  const [entryTraineeId, setEntryTraineeId] = useState('');
  const [entryHallId, setEntryHallId] = useState(halls[0]?.id || '');
  const [entryReason, setEntryReason] = useState('Official SRC & Hall Master Data Entry Allocation');
  const [entryIsSubmitting, setEntryIsSubmitting] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);
  const [entrySuccess, setEntrySuccess] = useState<string | null>(null);

  // Manual Reallocation dialog for existing trainees
  const [selectedTraineeId, setSelectedTraineeId] = useState<string>('');
  const [reassignHallId, setReassignHallId] = useState<string>(halls[0]?.id || '');
  const [reassignReason, setReassignReason] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);
  const [reassignMsg, setReassignMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) return null;

  const isStaff = user.role === 'admin' || user.role === 'super_admin';

  // Applicant Self-Allocation Action
  const handleSelfAllocate = async () => {
    setIsAllocatingSelf(true);
    setSelfActionMsg(null);
    try {
      const res = await api.allocateHall(user.id);
      await refreshUser();
      await onRefreshData();

      if (res.status === 'allocated' && res.hall) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        setSelfActionMsg({
          type: 'success',
          text: `Congratulations! You have been allocated to ${res.hall.name}. An SMS notification has been dispatched to your phone.`
        });
      } else {
        setSelfActionMsg({
          type: 'error',
          text: 'All residential halls are currently at maximum capacity. You have been placed on the official college waitlist.'
        });
      }
    } catch (err: any) {
      setSelfActionMsg({
        type: 'error',
        text: err.message || 'Unable to complete hall allocation.'
      });
    } finally {
      setIsAllocatingSelf(false);
    }
  };

  // Applicant SMS Resend
  const handleResendSms = async () => {
    if (resendCooldown > 0 || resendingSms) return;
    setResendingSms(true);
    setSelfActionMsg(null);
    try {
      await api.resendHallSms(user.id);
      await refreshUser();
      setResendCooldown(60);
      setSelfActionMsg({
        type: 'success',
        text: 'Hall allocation SMS has been resent to your mobile number.'
      });
    } catch (err: any) {
      if (err instanceof RateLimitError || err.retryAfter) {
        const retry = err.retryAfter || 60;
        setResendCooldown(retry);
        setSelfActionMsg({
          type: 'error',
          text: err.message || `Rate limit reached. Please wait ${retry}s before retrying.`
        });
      } else {
        setSelfActionMsg({
          type: 'error',
          text: err.message || 'Could not resend SMS.'
        });
      }
    } finally {
      setResendingSms(false);
    }
  };

  // Admin / Super Admin: Step-by-step Data Entry System for Trainee Hall Allocation
  const handleStepByStepEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEntryError(null);
    setEntrySuccess(null);

    const nameVal = validateFullName(entryFullName);
    if (!nameVal.isValid || !nameVal.normalized) {
      setEntryError(nameVal.error || 'Please enter a valid full name.');
      return;
    }

    const phoneVal = validateGhanaPhone(entryPhone);
    if (!phoneVal.isValid || !phoneVal.normalized) {
      setEntryError(phoneVal.error || 'Please enter a valid Ghanaian phone number.');
      return;
    }

    if (!entryEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entryEmail.trim())) {
      setEntryError('Please enter a valid email address.');
      return;
    }

    let parsedLevel = 100;
    let validatedId: string | undefined = undefined;
    if (entryTraineeId.trim()) {
      const idVal = validateStudentId(entryTraineeId.trim());
      if (!idVal.isValid || !idVal.normalized) {
        setEntryError(idVal.error || 'Invalid Trainee ID format.');
        return;
      }
      validatedId = idVal.normalized;
      parsedLevel = idVal.level || 100;
    }

    if (!entryHallId) {
      setEntryError('Please select a hall for allocation.');
      return;
    }

    if (!entryReason.trim()) {
      setEntryError('Reason for allocation entry is strictly required.');
      return;
    }

    setEntryIsSubmitting(true);
    try {
      // Create trainee account and allocate to hall
      const newTrainee = await api.signUp({
        fullName: nameVal.normalized,
        email: entryEmail.trim().toLowerCase(),
        phoneE164: phoneVal.normalized,
        password: 'Password123', // Initial secure default password
        isContinuingStudent: Boolean(validatedId),
        traineeId: validatedId,
        level: parsedLevel,
        programme: entryProgramme
      });

      // Manually allocate to chosen hall
      await api.manualAllocate(newTrainee.id, entryHallId, entryReason.trim(), user.id);

      await onRefreshData();
      setEntrySuccess(`Successfully entered and allocated ${nameVal.normalized} to the designated hall! Trainee is now active in the system.`);
      
      // Reset form
      setEntryFullName('');
      setEntryEmail('');
      setEntryPhone('');
      setEntryTraineeId('');
    } catch (err: any) {
      setEntryError(err.message || 'Failed to complete data entry allocation.');
    } finally {
      setEntryIsSubmitting(false);
    }
  };

  // Staff Reallocate Existing Trainee
  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReassignMsg(null);

    if (!selectedTraineeId) {
      setReassignMsg({ type: 'error', text: 'Please select a trainee to reallocate.' });
      return;
    }
    if (!reassignReason.trim()) {
      setReassignMsg({ type: 'error', text: 'A detailed reason is required for manual reassignment.' });
      return;
    }

    setIsReassigning(true);
    try {
      await api.manualAllocate(selectedTraineeId, reassignHallId, reassignReason.trim(), user.id);
      await onRefreshData();
      setReassignMsg({
        type: 'success',
        text: 'Trainee successfully reallocated. An update SMS has been dispatched.'
      });
      setReassignReason('');
    } catch (err: any) {
      setReassignMsg({
        type: 'error',
        text: err.message || 'Reallocation failed.'
      });
    } finally {
      setIsReassigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ---------------- APPLICANT VIEW ---------------- */}
      {!isStaff && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
              <Building className="w-8 h-8" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-stone-900 mb-2">
              Hall Allocation Portal
            </h2>

            {user.status === 'allocated' && user.hall_name ? (
              <div className="space-y-5">
                <div
                  className="p-6 rounded-2xl border-2 text-left"
                  style={{
                    backgroundColor: `${user.hall_colour === 'blue' ? '#eff6ff' : user.hall_colour === 'green' ? '#f0fdf4' : user.hall_colour === 'cream' ? '#fefce8' : '#ecfdf5'}`,
                    borderColor: `${user.hall_colour === 'blue' ? '#3b82f6' : user.hall_colour === 'green' ? '#22c55e' : user.hall_colour === 'cream' ? '#eab308' : '#10b981'}`
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                      Officially Allocated
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-stone-900 mb-1">
                    {user.hall_name}
                  </h3>
                  <p className="text-xs text-stone-700 leading-relaxed mb-4">
                    Trainee: <strong className="text-stone-900">{user.full_name}</strong> | Ref:{' '}
                    <strong className="text-stone-900">{user.trainee_id || user.phone_e164}</strong>
                  </p>

                  <div className="p-3 bg-white/80 rounded-xl border border-stone-200/60 text-xs text-stone-600 font-medium">
                    Show this allocation screen or the confirmation SMS at the Hall Master&apos;s desk during physical registration.
                  </div>
                </div>

                {selfActionMsg && (
                  <div
                    className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                      selfActionMsg.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                        : 'bg-red-50 border border-red-200 text-red-900'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{selfActionMsg.text}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={handleResendSms}
                    disabled={resendingSms || resendCooldown > 0 || (user.hall_sms_count || 0) >= 10}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <Send className="w-4 h-4 text-emerald-700" />
                    {resendingSms
                      ? 'Resending SMS...'
                      : resendCooldown > 0
                      ? `Resend in ${resendCooldown}s (${user.hall_sms_count || 0}/10)`
                      : `Resend Hall SMS (${user.hall_sms_count || 0}/10)`}
                  </button>
                </div>
              </div>
            ) : user.status === 'waitlisted' ? (
              <div className="space-y-4 text-left p-6 bg-amber-50/70 rounded-2xl border border-amber-200">
                <div className="flex items-center gap-2 text-amber-900">
                  <Clock className="w-5 h-5 text-amber-700" />
                  <span className="font-bold text-sm">You are currently on the Waitlist</span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">
                  All halls have reached their approved capacity. As soon as additional hall spaces are sanctioned or vacancies emerge, the automated system will allocate you and dispatch an official SMS notification.
                </p>
                <div className="text-[11px] text-stone-500 font-medium">
                  Queue Priority: Verified Timestamp ({new Date(user.created_at).toLocaleDateString()})
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
                  Click the button below to be automatically and fairly allocated to one of the four residential halls.
                </p>

                {selfActionMsg && (
                  <div
                    className={`p-3.5 rounded-xl text-xs flex items-center gap-2 text-left ${
                      selfActionMsg.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                        : 'bg-red-50 border border-red-200 text-red-900'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{selfActionMsg.text}</span>
                  </div>
                )}

                <button
                  onClick={handleSelfAllocate}
                  disabled={isAllocatingSelf}
                  className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 min-h-[48px]"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  {isAllocatingSelf ? 'Allocating Hall...' : 'Allocate My Hall Now'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- ADMIN & SUPER ADMIN VIEW ---------------- */}
      {isStaff && (
        <div className="space-y-6">
          {/* Step-by-step Data Entry System for Trainee Hall Allocation */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-stone-900">
                  Data Entry Hall Allocation System
                </h2>
                <p className="text-xs text-stone-500">
                  Step-by-step entry to register a trainee and directly allocate them to a residential hall.
                </p>
              </div>
            </div>

            {entryError && (
              <div className="my-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{entryError}</span>
              </div>
            )}

            {entrySuccess && (
              <div className="my-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
                <span>{entrySuccess}</span>
              </div>
            )}

            <form onSubmit={handleStepByStepEntrySubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Legal Name (no example) */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Step 1: Full Legal Name
                  </label>
                  <input
                    type="text"
                    value={entryFullName}
                    onChange={(e) => setEntryFullName(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-emerald-600 text-sm min-h-[44px]"
                  />
                </div>

                {/* Trainee ID (Optional for new applicant, format CTCE/PRG/YY/0XXX) */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Step 2: Trainee ID (If Entitled)
                  </label>
                  <input
                    type="text"
                    value={entryTraineeId}
                    onChange={(e) => setEntryTraineeId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-emerald-600 text-sm uppercase min-h-[44px]"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Step 3: Trainee Email
                  </label>
                  <input
                    type="email"
                    value={entryEmail}
                    onChange={(e) => setEntryEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-emerald-600 text-sm min-h-[44px]"
                  />
                </div>

                {/* Phone Contact */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Step 4: Phone Contact
                  </label>
                  <input
                    type="tel"
                    value={entryPhone}
                    onChange={(e) => setEntryPhone(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-emerald-600 text-sm min-h-[44px]"
                  />
                </div>

                {/* Programme of Study */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Step 5: Programme of Study
                  </label>
                  <select
                    value={entryProgramme}
                    onChange={(e) => setEntryProgramme(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-emerald-600 text-sm min-h-[44px]"
                  >
                    <option value="Bachelor of Education (Primary)">Bachelor of Education (Primary)</option>
                    <option value="Bachelor of Education (Early Childhood)">Bachelor of Education (Early Childhood)</option>
                    <option value="Bachelor of Education (Junior High School)">Bachelor of Education (Junior High School)</option>
                  </select>
                </div>

                {/* Target Residential Hall */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Step 6: Allocate Residential Hall
                  </label>
                  <select
                    value={entryHallId}
                    onChange={(e) => setEntryHallId(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-emerald-600 text-sm min-h-[44px]"
                  >
                    {halls.map((h) => (
                      <option key={h.id} value={h.id} disabled={h.occupancy >= h.capacity}>
                        {h.name} ({h.occupancy}/{h.capacity} spaces)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reason for Manual / Direct Entry */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Step 7: Mandatory Reason for Entry
                </label>
                <input
                  type="text"
                  value={entryReason}
                  onChange={(e) => setEntryReason(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-emerald-600 text-sm min-h-[44px]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={entryIsSubmitting}
                  className="w-full sm:w-auto px-6 py-3.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-md min-h-[48px] flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-300" />
                  {entryIsSubmitting ? 'Registering & Allocating...' : 'Complete Trainee Entry & Allocate'}
                </button>
              </div>
            </form>
          </div>

          {/* Reallocation Panel for Existing Trainees */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center border border-blue-200">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  Manual Reassignment & Hall Transfer
                </h3>
                <p className="text-xs text-stone-500">
                  Reassign an existing trainee with a mandatory audit reason.
                </p>
              </div>
            </div>

            {reassignMsg && (
              <div
                className={`my-3 p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                  reassignMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border border-red-200 text-red-900'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{reassignMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleReassignSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Select Trainee
                  </label>
                  <select
                    value={selectedTraineeId}
                    onChange={(e) => setSelectedTraineeId(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm min-h-[44px]"
                  >
                    <option value="">-- Choose Trainee --</option>
                    {trainees.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name} ({t.trainee_id || t.phone_e164}) - {t.hall_name || 'No Hall'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Target Residential Hall
                  </label>
                  <select
                    value={reassignHallId}
                    onChange={(e) => setReassignHallId(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm min-h-[44px]"
                  >
                    {halls.map((h) => (
                      <option key={h.id} value={h.id} disabled={h.occupancy >= h.capacity}>
                        {h.name} ({h.occupancy}/{h.capacity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Mandatory Reassignment Reason
                </label>
                <input
                  type="text"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="e.g. Medical accommodation, Hall Warden special dispensation"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm min-h-[44px]"
                />
              </div>

              <button
                type="submit"
                disabled={isReassigning}
                className="px-6 py-3 bg-blue-800 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition min-h-[44px]"
              >
                {isReassigning ? 'Reassigning...' : 'Confirm Reassignment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
