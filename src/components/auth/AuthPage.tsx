import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api, RateLimitError } from '../../lib/api';
import { validateGhanaPhone, validateStudentId, validateFullName } from '../../lib/validators';
import {
  Lock,
  Mail,
  Phone,
  User,
  GraduationCap,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Smartphone,
  Shield
} from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'reset-password';

export const AuthPage: React.FC = () => {
  const { login, confirmSuperAdminMfa } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState<AuthMode>('login');
  const [logoError, setLogoError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Countdown timer states for Resend SMS buttons
  const [resendCountdown, setResendCountdown] = useState<number>(0);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [resetCountdown, setResetCountdown] = useState<number>(0);
  const [isResendingReset, setIsResendingReset] = useState<boolean>(false);

  // Active countdown timers
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  useEffect(() => {
    if (resetCountdown <= 0) return;
    const timer = setTimeout(() => {
      setResetCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [resetCountdown]);

  // Format seconds to mm:ss or ss
  const formatCountdown = (seconds: number): string => {
    if (seconds <= 0) return '';
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Super Admin MFA state
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);

  // Sign up form state
  const [signUpStep, setSignUpStep] = useState<'fill-details' | 'verify-phone'>('fill-details');
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [isContinuingStudent, setIsContinuingStudent] = useState(false);
  const [signUpTraineeId, setSignUpTraineeId] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [signUpOtpCode, setSignUpOtpCode] = useState('');
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState<string | null>(null);
  const [isSubmittingSignUp, setIsSubmittingSignUp] = useState(false);

  // Password reset state
  const [resetStep, setResetStep] = useState<'enter-phone' | 'enter-code'>('enter-phone');
  const [resetPhone, setResetPhone] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [isRequestingReset, setIsRequestingReset] = useState(false);

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!loginIdentifier.trim() || !loginPassword) {
      setLoginError('Please enter both your Email / Trainee ID and password.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const result = await login(loginIdentifier, loginPassword);
      if (result.requiresMfa) {
        setRequiresMfa(true);
      } else if (result.error) {
        setLoginError(result.error);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Super Admin MFA Code
  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaError(null);
    if (!mfaCode.trim()) {
      setMfaError('Please enter the confirmation number.');
      return;
    }

    setIsVerifyingMfa(true);
    try {
      const ok = await confirmSuperAdminMfa(mfaCode.trim());
      if (!ok) {
        setMfaError('Invalid confirmation number. Access denied.');
      }
    } catch (err: any) {
      setMfaError(err.message || 'Verification error.');
    } finally {
      setIsVerifyingMfa(false);
    }
  };

  // Step 1: Request Auto-generated 6-digit Code for Sign Up
  const handleRequestSignUpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError(null);
    setSignUpSuccess(null);

    // Validate full name
    const nameVal = validateFullName(signUpFullName);
    if (!nameVal.isValid) {
      setSignUpError(nameVal.error || 'Invalid name.');
      return;
    }

    // Validate email
    const emailTrim = signUpEmail.trim().toLowerCase();
    if (!emailTrim || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setSignUpError('Please enter a valid email address.');
      return;
    }

    // Validate phone
    const phoneVal = validateGhanaPhone(signUpPhone);
    if (!phoneVal.isValid || !phoneVal.normalized) {
      setSignUpError(phoneVal.error || 'Please enter a valid Ghanaian phone number.');
      return;
    }

    // Passwords match
    if (signUpPassword.length < 6) {
      setSignUpError('Password must be at least 6 characters.');
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      setSignUpError('Passwords do not match.');
      return;
    }

    // If continuing student, validate Trainee ID
    if (isContinuingStudent) {
      if (!signUpTraineeId.trim()) {
        setSignUpError('Please enter your Trainee ID.');
        return;
      }
      const idVal = validateStudentId(signUpTraineeId);
      if (!idVal.isValid) {
        setSignUpError(idVal.error || 'Invalid Trainee ID format.');
        return;
      }
    }

    if (!consentChecked) {
      setSignUpError('Please consent to the processing of personal data under the Ghana Data Protection Act.');
      return;
    }

    setIsSubmittingSignUp(true);
    try {
      // Auto-generate 6-digit verification code and dispatch via SMS
      await api.requestSignUpOtp(phoneVal.normalized, signUpFullName, signUpTraineeId);
      setResendCountdown(60);
      setSignUpStep('verify-phone');
      setSignUpSuccess('A 6-digit verification code has been dispatched to your phone contact.');
    } catch (err: any) {
      if (err instanceof RateLimitError || err.retryAfter) {
        const retry = err.retryAfter || 60;
        setResendCountdown(retry);
        setSignUpError(err.message || `Rate limit reached. Please wait ${formatCountdown(retry)}.`);
      } else {
        setSignUpError(err.message || 'Failed to dispatch verification code.');
      }
    } finally {
      setIsSubmittingSignUp(false);
    }
  };

  // Handle Resend Sign Up Verification Code with Countdown Cooldown
  const handleResendSignUpCode = async () => {
    if (resendCountdown > 0 || isResending) return;
    setSignUpError(null);
    setSignUpSuccess(null);
    setIsResending(true);
    try {
      const phoneVal = validateGhanaPhone(signUpPhone);
      if (!phoneVal.normalized) {
        setSignUpError('Invalid phone number.');
        return;
      }
      await api.requestSignUpOtp(phoneVal.normalized, signUpFullName, signUpTraineeId);
      setSignUpSuccess('A new 6-digit verification code has been dispatched via SMS.');
      setResendCountdown(60);
    } catch (err: any) {
      if (err instanceof RateLimitError || err.retryAfter) {
        const retry = err.retryAfter || 60;
        setResendCountdown(retry);
        setSignUpError(err.message || `Rate limit reached. Please wait ${formatCountdown(retry)}.`);
      } else {
        setSignUpError(err.message || 'Failed to resend verification code.');
      }
    } finally {
      setIsResending(false);
    }
  };

  // Step 2: Verify Phone Code & Finalize Account Creation
  const handleVerifyPhoneAndCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError(null);

    if (!signUpOtpCode.trim() || signUpOtpCode.trim().length !== 6) {
      setSignUpError('Please enter the 6-digit verification code sent to your phone.');
      return;
    }

    const phoneVal = validateGhanaPhone(signUpPhone);
    if (!phoneVal.isValid || !phoneVal.normalized) {
      setSignUpError('Invalid phone number.');
      return;
    }

    setIsSubmittingSignUp(true);
    try {
      // Verify code
      await api.verifySignUpOtp(phoneVal.normalized, signUpOtpCode.trim());

      const nameVal = validateFullName(signUpFullName);
      let calculatedLevel = 100;
      let validatedTraineeId: string | undefined = undefined;

      if (isContinuingStudent && signUpTraineeId.trim()) {
        const idVal = validateStudentId(signUpTraineeId);
        validatedTraineeId = idVal.normalized;
        calculatedLevel = idVal.level || 200;
      }

      await api.signUp({
        fullName: nameVal.normalized!,
        email: signUpEmail.trim().toLowerCase(),
        phoneE164: phoneVal.normalized,
        password: signUpPassword,
        isContinuingStudent,
        traineeId: validatedTraineeId,
        level: calculatedLevel
      });

      setSignUpSuccess('Phone verified and account successfully created! You may now sign in.');
      setLoginIdentifier(signUpEmail.trim().toLowerCase());
      setMode('login');
      setSignUpStep('fill-details');
      setSignUpOtpCode('');
    } catch (err: any) {
      setSignUpError(err.message || 'Verification failed. Please re-enter the code.');
    } finally {
      setIsSubmittingSignUp(false);
    }
  };

  // Handle Request Password Reset Code
  const handleRequestResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    const phoneVal = validateGhanaPhone(resetPhone);
    if (!phoneVal.isValid || !phoneVal.normalized) {
      setResetError(phoneVal.error || 'Please enter your registered Ghanaian mobile number.');
      return;
    }

    setIsRequestingReset(true);
    try {
      await api.requestPasswordResetOtp(phoneVal.normalized);
      setResetCountdown(60);
      setResetStep('enter-code');
      setResetSuccess('A 6-digit verification code has been dispatched to your mobile contact.');
    } catch (err: any) {
      if (err instanceof RateLimitError || err.retryAfter) {
        const retry = err.retryAfter || 60;
        setResetCountdown(retry);
        setResetError(err.message || `Rate limit reached. Please wait ${formatCountdown(retry)}.`);
      } else {
        setResetError(err.message || 'Unable to request code. Please verify phone number.');
      }
    } finally {
      setIsRequestingReset(false);
    }
  };

  // Handle Resend Password Reset Code
  const handleResendResetOtp = async () => {
    if (resetCountdown > 0 || isResendingReset) return;
    setResetError(null);
    setResetSuccess(null);
    setIsResendingReset(true);
    try {
      const phoneVal = validateGhanaPhone(resetPhone);
      if (!phoneVal.normalized) {
        setResetError('Invalid phone number.');
        return;
      }
      await api.requestPasswordResetOtp(phoneVal.normalized);
      setResetSuccess('A new password reset code has been dispatched via SMS.');
      setResetCountdown(60);
    } catch (err: any) {
      if (err instanceof RateLimitError || err.retryAfter) {
        const retry = err.retryAfter || 60;
        setResetCountdown(retry);
        setResetError(err.message || `Rate limit reached. Please wait ${formatCountdown(retry)}.`);
      } else {
        setResetError(err.message || 'Failed to resend code.');
      }
    } finally {
      setIsResendingReset(false);
    }
  };

  // Handle Verify Password Reset & Set New Password
  const handleVerifyResetAndChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    if (!resetCode.trim() || resetCode.trim().length !== 6) {
      setResetError('Please enter the 6-digit verification code sent via SMS.');
      return;
    }
    if (resetNewPassword.length < 6) {
      setResetError('New password must be at least 6 characters long.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    const phoneVal = validateGhanaPhone(resetPhone);
    if (!phoneVal.normalized) {
      setResetError('Invalid phone number.');
      return;
    }

    setIsRequestingReset(true);
    try {
      await api.verifyPasswordResetOtpAndSetPassword(
        phoneVal.normalized,
        resetCode.trim(),
        resetNewPassword
      );
      setResetSuccess('Password reset successfully! Please sign in with your new password.');
      setMode('login');
      setResetStep('enter-phone');
      setResetCode('');
      setResetNewPassword('');
      setResetConfirmPassword('');
    } catch (err: any) {
      setResetError(err.message || 'Failed to verify code.');
    } finally {
      setIsRequestingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-sky-950 to-slate-950 dark:from-slate-950 dark:via-emerald-950 dark:to-black flex flex-col justify-between items-center px-4 py-6 sm:py-10 transition-colors duration-200">
      {/* Top Bar with Dark/Light Switch */}
      <div className="w-full max-w-md flex justify-end">
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-xs transition"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-300" />
          ) : (
            <Moon className="w-4 h-4 text-sky-200" />
          )}
        </button>
      </div>

      <div className="w-full max-w-md my-auto">
        {/* College Crest & Title (College Name beneath logo is removed as requested) */}
        <div className="text-center mb-6">
          <div className="inline-block relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/90 p-2 shadow-2xl border-2 border-sky-300/60 mb-3 overflow-hidden backdrop-blur-md">
            {!logoError ? (
              <img
                src="https://lh3.googleusercontent.com/d/1oKmWTIanlo2adz7GWseEkQZayxA8NFBH"
                alt="CTCE Crest"
                referrerPolicy="no-referrer"
                onError={() => setLogoError(true)}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-emerald-800 text-white rounded-2xl">
                <GraduationCap className="w-12 h-12 text-sky-300" />
              </div>
            )}
          </div>

          {/* Heading requested: CTCE on top and beneath it STUDENT PORTAL in capital letters, small font size */}
          <div className="mt-1">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
              CTCE
            </div>
            <div className="text-[11px] sm:text-xs font-bold tracking-widest text-sky-300 dark:text-emerald-300 uppercase">
              STUDENT PORTAL
            </div>
          </div>
        </div>

        {/* Glossy Card Container (White, Light Green, Sky Blue accents) */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/60 dark:border-sky-900/40 transition-colors duration-200">
          {/* Super Admin MFA Prompt */}
          {requiresMfa ? (
            <div>
              <div className="flex items-center gap-2 mb-3 text-sky-950 dark:text-sky-200">
                <ShieldCheck className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                <h3 className="text-lg font-bold">Confirmation Required</h3>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 mb-5 leading-relaxed">
                Super administrator session verification. Enter the authorized confirmation number to proceed.
              </p>

              {mfaError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{mfaError}</span>
                </div>
              )}

              <form onSubmit={handleMfaSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    Confirmation Number
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-sky-300/60 dark:border-sky-800 bg-white/80 dark:bg-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-center tracking-widest text-lg font-bold min-h-[48px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isVerifyingMfa}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-700 via-sky-700 to-emerald-800 hover:from-emerald-600 hover:to-sky-600 text-white font-bold text-sm rounded-xl transition shadow-md min-h-[48px] flex items-center justify-center gap-2"
                >
                  {isVerifyingMfa ? 'Verifying...' : 'Confirm Access'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRequiresMfa(false);
                    setMfaCode('');
                    setMfaError(null);
                  }}
                  className="w-full py-2 text-xs text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-white"
                >
                  Cancel
                </button>
              </form>
            </div>
          ) : mode === 'reset-password' ? (
            /* Reset Password Flow */
            <div>
              <div className="flex items-center gap-2 mb-2 text-sky-950 dark:text-sky-200">
                <KeyRound className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <h3 className="text-lg font-bold">Reset Password</h3>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 mb-4">
                {resetStep === 'enter-phone'
                  ? 'Enter your registered phone contact to receive a 6-digit SMS verification code.'
                  : 'Enter the verification code and set your new password.'}
              </p>

              {resetError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{resetError}</span>
                </div>
              )}

              {resetSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
                  <span>{resetSuccess}</span>
                </div>
              )}

              {resetStep === 'enter-phone' ? (
                <form onSubmit={handleRequestResetOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                      Phone Contact
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={resetPhone}
                        onChange={(e) => setResetPhone(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-sky-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:border-sky-500 text-sm min-h-[48px]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isRequestingReset}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-700 to-sky-700 hover:from-emerald-600 hover:to-sky-600 text-white font-bold text-sm rounded-xl transition shadow-md min-h-[48px]"
                  >
                    {isRequestingReset ? 'Checking...' : 'Send Verification Code'}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setResetError(null);
                        setResetSuccess(null);
                      }}
                      className="text-xs font-bold text-sky-700 dark:text-sky-300 hover:underline"
                    >
                      Sign In to Portal
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyResetAndChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                      6-Digit SMS Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-sky-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center tracking-widest text-lg font-bold min-h-[48px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-sky-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm min-h-[48px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-sky-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm min-h-[48px]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isRequestingReset}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-700 to-sky-700 hover:from-emerald-600 hover:to-sky-600 text-white font-bold text-sm rounded-xl transition shadow-md min-h-[48px]"
                  >
                    {isRequestingReset ? 'Updating...' : 'Save New Password'}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-2">
                    <button
                      type="button"
                      onClick={() => setResetStep('enter-phone')}
                      className="text-stone-500 dark:text-stone-400 hover:underline"
                    >
                      Change Phone Number
                    </button>
                    <button
                      type="button"
                      disabled={resetCountdown > 0 || isResendingReset}
                      onClick={handleResendResetOtp}
                      className={`font-semibold transition ${
                        resetCountdown > 0 || isResendingReset
                          ? 'text-stone-400 dark:text-stone-500 cursor-not-allowed'
                          : 'text-sky-700 dark:text-sky-300 hover:underline'
                      }`}
                    >
                      {isResendingReset ? (
                        'Sending code...'
                      ) : resetCountdown > 0 ? (
                        `Resend in ${formatCountdown(resetCountdown)}`
                      ) : (
                        'Resend SMS Code'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : mode === 'login' ? (
            /* Login Flow */
            <div>
              {/* Login / Sign Up Toggle */}
              <div className="grid grid-cols-2 p-1 bg-stone-100 dark:bg-slate-800 rounded-2xl mb-6">
                <button
                  type="button"
                  className="py-2.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-700 text-emerald-950 dark:text-sky-200 shadow-xs transition"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setSignUpStep('fill-details');
                    setLoginError(null);
                  }}
                  className="py-2.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition"
                >
                  Create Account
                </button>
              </div>

              {loginError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{loginError}</span>
                </div>
              )}

              {signUpSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
                  <span>{signUpSuccess}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    Email or Trainee ID
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-sky-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:border-sky-500 text-sm min-h-[48px]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('reset-password');
                        setResetStep('enter-phone');
                        setResetError(null);
                      }}
                      className="text-xs text-sky-700 dark:text-sky-300 hover:underline font-semibold"
                    >
                      Reset password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-11 py-3 rounded-xl border border-sky-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:border-sky-500 text-sm min-h-[48px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-700 via-sky-700 to-emerald-800 hover:from-emerald-600 hover:to-sky-600 text-white font-bold text-sm rounded-xl transition shadow-md min-h-[48px] flex items-center justify-center gap-2"
                >
                  {isLoggingIn ? 'Signing in...' : 'Sign In'}
                </button>

                {/* Strictly Sign Up to Portal link */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setSignUpStep('fill-details');
                      setLoginError(null);
                    }}
                    className="text-xs font-bold text-sky-800 dark:text-sky-300 hover:underline"
                  >
                    Sign Up to Portal
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Sign Up Flow with Auto-generated Phone OTP Verification */
            <div>
              {/* Login / Sign Up Toggle */}
              <div className="grid grid-cols-2 p-1 bg-stone-100 dark:bg-slate-800 rounded-2xl mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setSignUpError(null);
                  }}
                  className="py-2.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className="py-2.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-700 text-emerald-950 dark:text-sky-200 shadow-xs transition"
                >
                  Create Account
                </button>
              </div>

              {signUpError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{signUpError}</span>
                </div>
              )}

              {signUpSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
                  <span>{signUpSuccess}</span>
                </div>
              )}

              {signUpStep === 'fill-details' ? (
                <form onSubmit={handleRequestSignUpVerification} className="space-y-3.5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      Full Legal Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={signUpFullName}
                        onChange={(e) => setSignUpFullName(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sky-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:border-sky-500 text-sm min-h-[44px]"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sky-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:border-sky-500 text-sm min-h-[44px]"
                      />
                    </div>
                  </div>

                  {/* Phone Contact */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      Phone Contact (Will Receive Verification Code)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={signUpPhone}
                        onChange={(e) => setSignUpPhone(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sky-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:border-sky-500 text-sm min-h-[44px]"
                      />
                    </div>
                  </div>

                  {/* Checkbox: Continuing student with Trainee ID */}
                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isContinuingStudent}
                        onChange={(e) => setIsContinuingStudent(e.target.checked)}
                        className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-stone-300"
                      />
                      <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                        I have a Student ID / Trainee ID (Continuing Student)
                      </span>
                    </label>
                  </div>

                  {isContinuingStudent && (
                    <div>
                      <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                        Trainee ID
                      </label>
                      <input
                        type="text"
                        value={signUpTraineeId}
                        onChange={(e) => setSignUpTraineeId(e.target.value)}
                        required={isContinuingStudent}
                        className="w-full px-4 py-2.5 rounded-xl border border-sky-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:border-sky-500 text-sm uppercase min-h-[44px]"
                      />
                    </div>
                  )}

                  {/* Passwords */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={signUpConfirmPassword}
                        onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm min-h-[44px]"
                      />
                    </div>
                  </div>

                  {/* Data Protection Consent */}
                  <div className="pt-1">
                    <label className="flex items-start gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={consentChecked}
                        onChange={(e) => setConsentChecked(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded text-sky-600 focus:ring-sky-500 border-stone-300"
                      />
                      <span className="text-[11px] text-stone-600 dark:text-stone-300 leading-tight">
                        I consent to CTCE processing my personal details under the Ghana Data Protection Act, 2012 (Act 843).
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingSignUp}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-700 via-sky-700 to-emerald-800 hover:from-emerald-600 hover:to-sky-600 text-white font-bold text-sm rounded-xl transition shadow-md min-h-[48px] flex items-center justify-center gap-2"
                  >
                    <Smartphone className="w-4 h-4 text-sky-300" />
                    {isSubmittingSignUp ? 'Sending Verification Code...' : 'Verify Phone & Proceed'}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setSignUpError(null);
                      }}
                      className="text-xs font-bold text-sky-800 dark:text-sky-300 hover:underline"
                    >
                      Sign In to Portal
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: Enter 6-digit Code to Complete Account Creation */
                <form onSubmit={handleVerifyPhoneAndCreateAccount} className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-sky-950 dark:text-sky-200">
                    <div className="font-bold flex items-center gap-1.5 mb-1">
                      <Smartphone className="w-4 h-4 text-sky-600" />
                      Verification Code Sent
                    </div>
                    <p>
                      Enter the auto-generated 6-digit code sent via SMS to <strong>{signUpPhone}</strong> to verify and create your account.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                      6-Digit SMS Verification Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={signUpOtpCode}
                      onChange={(e) => setSignUpOtpCode(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-sky-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center tracking-widest text-lg font-bold min-h-[48px]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingSignUp}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-700 via-sky-700 to-emerald-800 hover:from-emerald-600 hover:to-sky-600 text-white font-bold text-sm rounded-xl transition shadow-md min-h-[48px] flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-sky-300" />
                    {isSubmittingSignUp ? 'Verifying & Creating...' : 'Verify Code & Create Account'}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setSignUpStep('fill-details')}
                      className="text-stone-500 dark:text-stone-400 hover:underline"
                    >
                      Change Phone Details
                    </button>
                    <button
                      type="button"
                      disabled={resendCountdown > 0 || isResending}
                      onClick={handleResendSignUpCode}
                      className={`font-semibold text-xs transition flex items-center gap-1.5 ${
                        resendCountdown > 0 || isResending
                          ? 'text-stone-400 dark:text-stone-500 cursor-not-allowed'
                          : 'text-sky-700 dark:text-sky-300 hover:underline'
                      }`}
                    >
                      {isResending ? (
                        'Sending code...'
                      ) : resendCountdown > 0 ? (
                        `Resend in ${formatCountdown(resendCountdown)}`
                      ) : (
                        'Resend SMS Code'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Branding, Version & Copyright */}
      <footer className="w-full max-w-md text-center py-3 text-[11px] text-white/70 space-y-1">
        <div>
          <span className="font-semibold text-white/90">CTCE PORTAL { }</span>
          <span className="px-1.5 py-0.5 rounded bg-sky-900/60 border border-sky-700/50 text-sky-200 font-mono text-[10px]">
            V 5.0.0
          </span>
        </div>
        <p>© 2026, Gentle DigiTech Solutions. All rights reserved.</p>
        <p className="text-white/60">
          Support: <a href="mailto:CTCESRC@proton.me" className="text-sky-300 hover:underline">CTCESRC@proton.me</a>
        </p>
      </footer>
    </div>
  );
};
