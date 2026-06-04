'use client';

import React from 'react';
import { CheckCircle, Lock, AlertTriangle, User, RefreshCw } from 'lucide-react';
import { Profile } from '@/types';
import { PasswordMatchIndicator } from '@/components/PasswordMatchIndicator';
import { ProfileFields } from '../ProfileFields';

interface WelcomeModalsProps {
  // Onboarding welcome popup
  showWelcomePopup: boolean;
  setShowWelcomePopup: (show: boolean) => void;

  // First time password & setup modal
  showFirstTimePasswordModal: boolean;
  firstTimePasswordError: string | null;
  firstTimePassword: string;
  setFirstTimePassword: (val: string) => void;
  firstTimeConfirmPassword: string;
  setFirstTimeConfirmPassword: (val: string) => void;
  profile: Profile | null;

  firstTimePasswordSubmitting: boolean;
  sessionUser: any;
  handleFirstTimeSetupSubmit: (e: React.FormEvent) => void;
  handleLogout: () => void;

  // Setup profile for user (not admin) if setup not completed
  setupError: string | null;
  setupFullName: string;
  setSetupFullName: (val: string) => void;
  setupUsername: string;
  setupJobRole: string;
  setSetupJobRole: (val: string) => void;
  setupWorkingHours: string;
  setSetupWorkingHours: (val: string) => void;
  setupBreakTime: string;
  setSetupBreakTime: (val: string) => void;
  setupSignInTime: string;
  setSetupSignInTime: (val: string) => void;
  setupSignOutTime: string;
  setSetupSignOutTime: (val: string) => void;
  setupSubmitting: boolean;
  handleSetupSubmit: (e: React.FormEvent) => void;
}

export const WelcomeModals: React.FC<WelcomeModalsProps> = ({
  showWelcomePopup,
  setShowWelcomePopup,

  showFirstTimePasswordModal,
  firstTimePasswordError,
  firstTimePassword,
  setFirstTimePassword,
  firstTimeConfirmPassword,
  setFirstTimeConfirmPassword,
  profile,

  firstTimePasswordSubmitting,
  sessionUser,
  handleFirstTimeSetupSubmit,
  handleLogout,

  setupError,
  setupFullName,
  setSetupFullName,
  setupUsername,
  setupJobRole,
  setSetupJobRole,
  setupWorkingHours,
  setSetupWorkingHours,
  setupBreakTime,
  setSetupBreakTime,
  setupSignInTime,
  setSetupSignInTime,
  setupSignOutTime,
  setSetupSignOutTime,
  setupSubmitting,
  handleSetupSubmit,
}) => {
  return (
    <>
      {/* Welcome & Profile Update Onboarding Popup */}
      {showWelcomePopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-955/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-sm p-6 relative overflow-hidden text-center">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-900/10 blur-[80px] pointer-events-none" />

            <div className="inline-flex p-3 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-2xl mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">আপনার প্রোফাইলে স্বাগতম! 🎉</h3>
            <p className="text-xs text-slate-355 leading-relaxed mb-4">
              {profile?.role === 'admin'
                ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।'
                : 'আপনার পাসওয়ার্ড পরিবর্তন এবং প্রোফাইল সেটআপ সফলভাবে সম্পন্ন হয়েছে!'}
            </p>
            <div className="p-3.5 bg-slate-955/60 rounded-xl border border-slate-800/80 text-left text-xs text-slate-400 leading-relaxed space-y-2">
              <p className="font-semibold text-blue-400">💡 তথ্য আপডেট করার নিয়ম:</p>
              <p>পরবর্তীতে প্রয়োজন হলে ড্যাশবোর্ডের বাম পাশে উপরে অবস্থিত <span className="font-bold text-white">প্রোফাইল সেটিংস</span> (মানুষ/গিয়ার আইকন) এ ক্লিক করে পুনরায় আপনার প্রোফাইল তথ্য আপডেট করতে পারবেন।</p>
            </div>

            <button
              onClick={() => setShowWelcomePopup(false)}
              className="mt-5 w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all border border-emerald-700 shadow-md"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}

      {/* First-Time Password Change & Setup Modal */}
      {showFirstTimePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/90 backdrop-blur-xl p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden my-8">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[80px] pointer-events-none" />

            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-2xl mb-3">
                <Lock className="h-6 w-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white">নিরাপত্তা পাসওয়ার্ড পরিবর্তন করুন</h3>
              <p className="text-xs text-slate-400 mt-1">প্রথমবার লগইন করার পর নিরাপত্তা পাসওয়ার্ড পরিবর্তন করা আবশ্যক</p>
            </div>

            {firstTimePasswordError && (
              <div className="p-3 bg-red-950/50 border border-red-800/50 text-red-300 text-xs rounded-lg mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                <span>{firstTimePasswordError}</span>
              </div>
            )}

            <form onSubmit={handleFirstTimeSetupSubmit} className="space-y-4">
              <div className="p-3 bg-slate-955/60 border border-slate-850 rounded-xl space-y-4">
                <div className="text-xs font-semibold text-blue-400 border-b border-slate-850 pb-1.5 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" /> পাসওয়ার্ড পরিবর্তন
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-455 uppercase tracking-wider">নতুন পাসওয়ার্ড (New Password)</label>
                  <input
                    type="password"
                    required
                    placeholder="কমপক্ষে 6টি ক্যারেক্টার"
                    value={firstTimePassword}
                    onChange={(e) => setFirstTimePassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-455 uppercase tracking-wider">পাসওয়ার্ড নিশ্চিত করুন (Confirm Password)</label>
                  <input
                    type="password"
                    required
                    placeholder="পাসওয়ার্ডটি আবার লিখুন"
                    value={firstTimeConfirmPassword}
                    onChange={(e) => setFirstTimeConfirmPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <PasswordMatchIndicator password={firstTimePassword} confirmPassword={firstTimeConfirmPassword} />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={async () => {
                    if (sessionUser) {
                      localStorage.removeItem(`first_time_modal_start_time_${sessionUser.id}`);
                    }
                    await handleLogout();
                  }}
                  className="flex-1 flex justify-center py-2.5 px-4 border border-slate-800 rounded-lg text-sm font-semibold text-slate-400 hover:text-slate-350 bg-slate-950 hover:bg-slate-900 cursor-pointer transition-all"
                >
                  লগআউট করুন
                </button>
                <button
                  type="submit"
                  disabled={firstTimePasswordSubmitting || firstTimePassword !== firstTimeConfirmPassword || firstTimePassword.length < 4}
                  className="flex-1 flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                >
                  {firstTimePasswordSubmitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  {firstTimePasswordSubmitting ? 'Updating password...' : 'Update password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* First Login Onboarding Modal */}
      {!showFirstTimePasswordModal && profile?.has_changed_password && !profile?.is_setup_completed && profile?.role !== 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/85 backdrop-blur-xl p-4">
          <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[80px] pointer-events-none" />

            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-2xl mb-3">
                <User className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">প্রোফাইল সেটআপ সম্পন্ন করুন</h3>
              <p className="text-xs text-slate-400 mt-1">প্রথমবার ড্যাশবোর্ডে প্রবেশের আগে আপনার সঠিক নাম ও তথ্য সেট করুন</p>
            </div>

            {setupError && (
              <div className="p-3 bg-red-950/50 border border-red-800/50 text-red-300 text-xs rounded-lg mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                <span>{setupError}</span>
              </div>
            )}

            <form onSubmit={handleSetupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">কোডনেম (Codename)</label>
                <input
                  type="text"
                  required
                  disabled
                  value={(setupUsername || '').toUpperCase()}
                  className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-850 rounded-lg text-slate-500 text-sm cursor-not-allowed opacity-60 font-mono"
                />
              </div>

              <ProfileFields
                fullName={setupFullName}
                setFullName={setSetupFullName}
                jobRole={setupJobRole}
                setJobRole={setSetupJobRole}
                workingHours={setupWorkingHours}
                setWorkingHours={setSetupWorkingHours}
                breakTime={setupBreakTime}
                setBreakTime={setSetupBreakTime}
                signInTime={setupSignInTime}
                setSignInTime={setSetupSignInTime}
                signOutTime={setupSignOutTime}
                setSignOutTime={setSetupSignOutTime}
              />

              <button
                type="submit"
                disabled={setupSubmitting}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 transition-all mt-6 flex items-center justify-center gap-1.5"
              >
                {setupSubmitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                {setupSubmitting ? 'সেটআপ সম্পন্ন হচ্ছে...' : 'সেটআপ সম্পন্ন করুন'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
