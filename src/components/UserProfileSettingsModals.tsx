import React from 'react';
import { User, Lock, AlertTriangle, RefreshCw, Edit2 } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Profile } from '../types';

interface UserProfileSettingsModalsProps {
  profile: Profile | null;
  sessionUser: SupabaseUser | null;
  
  // First-time Password Modal
  showFirstTimePasswordModal: boolean;
  firstTimePassword: string;
  setFirstTimePassword: (val: string) => void;
  firstTimeConfirmPassword: string;
  setFirstTimeConfirmPassword: (val: string) => void;
  firstTimeSetupFullName: string;
  setFirstTimeSetupFullName: (val: string) => void;
  firstTimeSetupJobRole: string;
  setFirstTimeSetupJobRole: (val: string) => void;
  firstTimeSetupWorkingHours: string;
  setFirstTimeSetupWorkingHours: (val: string) => void;
  firstTimeSetupBreakTime: string;
  setFirstTimeSetupBreakTime: (val: string) => void;
  firstTimeSetupSignInTime: string;
  setFirstTimeSetupSignInTime: (val: string) => void;
  firstTimeSetupSignOutTime: string;
  setFirstTimeSetupSignOutTime: (val: string) => void;
  firstTimePasswordSubmitting: boolean;
  firstTimePasswordError: string;
  handleFirstTimeSetupSubmit: (e: React.FormEvent) => Promise<void>;

  // Onboarding Setup Modal
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
  setupError: string;
  handleSetupSubmit: (e: React.FormEvent) => Promise<void>;
  
  handleLogout: () => Promise<void>;
  getPasswordMatchIndicator: (pass: string, conf: string) => React.ReactNode;

  // Profile Settings Modal
  showProfileSettingsModal: boolean;
  setShowProfileSettingsModal: (val: boolean) => void;
  isEditRequestMode: boolean;
  setIsEditRequestMode: (val: boolean) => void;
  editUsername: string;
  setEditUsername: (val: string) => void;
  editFullName: string;
  setEditFullName: (val: string) => void;
  editJobRole: string;
  setEditJobRole: (val: string) => void;
  editWorkingHours: string;
  setEditWorkingHours: (val: string) => void;
  editBreakTime: string;
  setEditBreakTime: (val: string) => void;
  profileSignInTime: string;
  setProfileSignInTime: (val: string) => void;
  profileSignOutTime: string;
  setProfileSignOutTime: (val: string) => void;
  isCodenameEditable: boolean;
  setIsCodenameEditable: (val: boolean) => void;
  
  isPushSubscribed: boolean;
  setIsPushSubscribed: (val: boolean) => void;
  isPushLoading: boolean;
  setIsPushLoading: (val: boolean) => void;
  
  adminActiveTab: 'user' | 'admin';
  setAdminActiveTab: (val: 'user' | 'admin') => void;
  setViewingStaffId: (val: string | null) => void;
  
  subscribeUserToPush: (id: string) => Promise<boolean>;
  unsubscribeUserFromPush: (id: string) => Promise<boolean>;
  handleUpdateSettings: (e: React.FormEvent) => Promise<void>;

  editNeedsApproval: boolean;
  setEditNeedsApproval: (val: boolean) => void;
  editAllowReserve: boolean;
  setEditAllowReserve: (val: boolean) => void;
  editAllowOvertime: boolean;
  setEditAllowOvertime: (val: boolean) => void;
  editingStaffProfileId: string | null;
}

export const UserProfileSettingsModals: React.FC<UserProfileSettingsModalsProps> = ({
  profile,
  sessionUser,
  
  // First-time Password
  showFirstTimePasswordModal,
  firstTimePassword,
  setFirstTimePassword,
  firstTimeConfirmPassword,
  setFirstTimeConfirmPassword,
  firstTimeSetupFullName,
  setFirstTimeSetupFullName,
  firstTimeSetupJobRole,
  setFirstTimeSetupJobRole,
  firstTimeSetupWorkingHours,
  setFirstTimeSetupWorkingHours,
  firstTimeSetupBreakTime,
  setFirstTimeSetupBreakTime,
  firstTimeSetupSignInTime,
  setFirstTimeSetupSignInTime,
  firstTimeSetupSignOutTime,
  setFirstTimeSetupSignOutTime,
  firstTimePasswordSubmitting,
  firstTimePasswordError,
  handleFirstTimeSetupSubmit,

  // Onboarding Setup
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
  setupError,
  handleSetupSubmit,
  
  handleLogout,
  getPasswordMatchIndicator,

  // Profile Settings
  showProfileSettingsModal,
  setShowProfileSettingsModal,
  isEditRequestMode,
  setIsEditRequestMode,
  editUsername,
  setEditUsername,
  editFullName,
  setEditFullName,
  editJobRole,
  setEditJobRole,
  editWorkingHours,
  setEditWorkingHours,
  editBreakTime,
  setEditBreakTime,
  profileSignInTime,
  setProfileSignInTime,
  profileSignOutTime,
  setProfileSignOutTime,
  isCodenameEditable,
  setIsCodenameEditable,
  
  isPushSubscribed,
  setIsPushSubscribed,
  isPushLoading,
  setIsPushLoading,
  
  adminActiveTab,
  setAdminActiveTab,
  setViewingStaffId,
  
  subscribeUserToPush,
  unsubscribeUserFromPush,
  handleUpdateSettings,

  editNeedsApproval,
  setEditNeedsApproval,
  editAllowReserve,
  setEditAllowReserve,
  editAllowOvertime,
  setEditAllowOvertime,
  editingStaffProfileId,
}) => {
  return (
    <>
      {/* First-Time Password Change & Setup Modal */}
      {showFirstTimePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/90 backdrop-blur-xl p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden my-8">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[80px] pointer-events-none" />
            
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-2xl mb-3">
                <Lock className="h-6 w-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white">পাসওয়ার্ড ও প্রোফাইল সেটআপ সম্পন্ন করুন</h3>
              <p className="text-xs text-slate-400 mt-1">প্রথমবার লগইন করার পর নিরাপত্তা পাসওয়ার্ড পরিবর্তন এবং আপনার প্রোফাইল তথ্য সেট করা আবশ্যক</p>
            </div>

            {firstTimePasswordError && (
              <div className="p-3 bg-red-955/50 border border-red-800/50 text-red-300 text-xs rounded-lg mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                <span>{firstTimePasswordError}</span>
              </div>
            )}

            <form onSubmit={handleFirstTimeSetupSubmit} className="space-y-4">
              <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-4">
                <div className="text-xs font-semibold text-blue-400 border-b border-slate-855 pb-1.5 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" /> পাসওয়ার্ড পরিবর্তন
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-450 uppercase tracking-wider">নতুন পাসওয়ার্ড (New Password)</label>
                  <input
                    type="password"
                    required
                    placeholder="কমপক্ষে ৪টি ক্যারেক্টার"
                    value={firstTimePassword}
                    onChange={(e) => setFirstTimePassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  {getPasswordMatchIndicator(firstTimePassword, firstTimeConfirmPassword)}
                </div>
              </div>

              {/* Render profile fields only if they are not Admin and profile setup is NOT completed */}
              {profile?.role !== 'admin' && !profile?.is_setup_completed && (
                <div className="p-3 bg-slate-955/60 border border-slate-850 rounded-xl space-y-4 mt-2">
                  <div className="text-xs font-semibold text-purple-400 border-b border-slate-855 pb-1.5 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> প্রোফাইল তথ্য
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-455 uppercase tracking-wider">সম্পূর্ণ নাম (Full Name)</label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: কামরুল হাসান"
                      value={firstTimeSetupFullName}
                      onChange={(e) => setFirstTimeSetupFullName(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-455 uppercase tracking-wider">জব রোল (Job Role)</label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: IT Officer"
                      value={firstTimeSetupJobRole}
                      onChange={(e) => setFirstTimeSetupJobRole(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-455 uppercase tracking-wider">দৈনিক কর্মঘণ্টা</label>
                      <select
                        required
                        value={firstTimeSetupWorkingHours}
                        onChange={(e) => setFirstTimeSetupWorkingHours(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="" disabled hidden>নির্বাচন করুন</option>
                        <option value="7.5">৭ ঘণ্টা ৩০ মিনিট</option>
                        <option value="8.0">৮ ঘণ্টা</option>
                        <option value="8.5">৮ ঘণ্টা ৩০ মিনিট</option>
                        <option value="9.0">৯ ঘণ্টা</option>
                        <option value="9.5">৯ ঘণ্টা ৩০ মিনিট</option>
                        <option value="10.0">১০ ঘণ্টা</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-455 uppercase tracking-wider">ব্রেক (মিনিট)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={firstTimeSetupBreakTime}
                        onChange={(e) => setFirstTimeSetupBreakTime(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-455 uppercase tracking-wider">ডিফল্ট সাইন-ইন টাইম</label>
                      <input
                        type="time"
                        required
                        value={firstTimeSetupSignInTime}
                        onChange={(e) => setFirstTimeSetupSignInTime(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-455 uppercase tracking-wider">ডিফল্ট সাইন-আউট টাইম</label>
                      <input
                        type="time"
                        required
                        value={firstTimeSetupSignOutTime}
                        onChange={(e) => setFirstTimeSetupSignOutTime(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

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
                  {firstTimePasswordSubmitting ? 'সেটআপ সম্পন্ন হচ্ছে...' : 'সেটআপ সম্পন্ন করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* First Login Onboarding Modal */}
      {!profile?.is_setup_completed && profile?.role !== 'admin' && (
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
              <div className="p-3 bg-red-955/50 border border-red-800/50 text-red-300 text-xs rounded-lg mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                <span>{setupError}</span>
              </div>
            )}

            <form onSubmit={handleSetupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">সম্পূর্ণ নাম (Full Name)</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: কামরুল হাসান"
                  value={setupFullName}
                  onChange={(e) => setSetupFullName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">কোডনেম (Codename)</label>
                <input
                  type="text"
                  required
                  disabled
                  value={(setupUsername || '').toUpperCase()}
                  className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-850 rounded-lg text-slate-500 text-sm cursor-not-allowed opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">জব রোল (Job Role)</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: IT Officer"
                  value={setupJobRole}
                  onChange={(e) => setSetupJobRole(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">দৈনিক কর্মঘণ্টা</label>
                  <select
                    required
                    value={setupWorkingHours}
                    onChange={(e) => setSetupWorkingHours(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled hidden>নির্বাচন করুন</option>
                    <option value="7.5">৭ ঘণ্টা ৩০ মিনিট</option>
                    <option value="8.0">৮ ঘণ্টা</option>
                    <option value="8.5">৮ ঘণ্টা ৩০ মিনিট</option>
                    <option value="9.0">৯ ঘণ্টা</option>
                    <option value="9.5">৯ ঘণ্টা ৩০ মিনিট</option>
                    <option value="10.0">১০ ঘণ্টা</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">ব্রেক (মিনিট)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={setupBreakTime}
                    onChange={(e) => setSetupBreakTime(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">ডিফল্ট সাইন-ইন টাইম</label>
                  <input
                    type="time"
                    required
                    value={setupSignInTime}
                    onChange={(e) => setSetupSignInTime(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">ডিফল্ট সাইন-আউট টাইম</label>
                  <input
                    type="time"
                    required
                    value={setupSignOutTime}
                    onChange={(e) => setSetupSignOutTime(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

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

      {/* Profile Settings Modal */}
      {showProfileSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[80px] pointer-events-none" />
            
            <div className="flex justify-between items-center border-b border-slate-800/80 p-6 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" /> প্রোফাইল সেটিংস
              </h3>
              <button 
                onClick={() => {
                  setShowProfileSettingsModal(false);
                  setIsEditRequestMode(false);
                }}
                className="text-slate-455 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {profile?.profile_change_status === 'pending' && (
                <div className="p-3 bg-amber-955/50 border border-amber-800/50 text-amber-300 text-xs rounded-lg mb-4 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>আপনার প্রোফাইল পরিবর্তনের অনুরোধটি বর্তমানে পেন্ডিং অবস্থায় আছে। অ্যাডমিনের অনুমোদনের জন্য অপেক্ষা করুন।</span>
                </div>
              )}

              <form onSubmit={handleUpdateSettings} className="space-y-4">
                {/* Web Push Notification Toggle */}
                {!editingStaffProfileId && (
                  <div className="push-notification-banner flex items-center justify-between p-3 bg-blue-955/45 rounded-lg border border-blue-900/35 mb-4 shadow-inner">
                    <div>
                      <span className="block text-sm font-semibold text-white">ডেস্কটপ নোটিফিকেশন 🔔</span>
                      <span className="block text-[11px] text-slate-400">ছুটি আপডেট ও নতুন আবেদনের তাৎক্ষণিক অ্যালার্ট পান</span>
                    </div>
                    <button
                      type="button"
                      disabled={isPushLoading}
                      onClick={async () => {
                        if (!sessionUser || isPushLoading) return;
                        
                        const willSubscribe = !isPushSubscribed;
                        setIsPushSubscribed(willSubscribe);
                        setIsPushLoading(true);
                        
                        try {
                          if (!willSubscribe) {
                            const success = await unsubscribeUserFromPush(sessionUser.id);
                            if (!success) {
                              setIsPushSubscribed(true);
                            }
                          } else {
                            const success = await subscribeUserToPush(sessionUser.id);
                            if (!success) {
                              setIsPushSubscribed(false);
                            }
                          }
                        } catch {
                          setIsPushSubscribed(!willSubscribe);
                        } finally {
                          setIsPushLoading(false);
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isPushSubscribed ? 'bg-blue-600' : 'bg-slate-800'
                      } ${isPushLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isPushSubscribed ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                )}
                
                {profile?.role === 'admin' && !editingStaffProfileId && (
                  <div className="admin-mode-banner flex items-center justify-between p-3 bg-purple-955/45 rounded-lg border border-purple-900/35 mb-4 shadow-inner">
                    <div>
                      <span className="block text-sm font-semibold text-white">অ্যাডমিন মোড (Admin Mode)</span>
                      <span className="block text-[11px] text-slate-400">অন করলে অ্যাডমিন প্যানেল ও অ্যাপ্রুভাল ফিচার চালু হবে</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = adminActiveTab === 'admin' ? 'user' : 'admin';
                        setAdminActiveTab(nextVal);
                        setViewingStaffId(null);
                        if (sessionUser?.id) {
                          localStorage.setItem('admin_mode_' + sessionUser.id, nextVal);
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        adminActiveTab === 'admin' ? 'bg-purple-600' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          adminActiveTab === 'admin' ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                )}
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">কোডনেম (Codename)</label>
                    {profile?.role === 'admin' && adminActiveTab === 'admin' && (
                      <button
                        type="button"
                        onClick={() => setIsCodenameEditable(!isCodenameEditable)}
                        className={`text-[10px] flex items-center gap-1 transition-colors px-2 py-0.5 rounded cursor-pointer ${
                          isCodenameEditable 
                            ? 'text-amber-400 bg-amber-955/40 hover:bg-amber-950/60 border border-amber-800/30' 
                            : 'text-blue-400 hover:text-blue-300 bg-blue-955/20 hover:bg-blue-950/40 border border-blue-900/20'
                        }`}
                        title={isCodenameEditable ? "এডিট মোড বন্ধ করুন" : "কোডনেম পরিবর্তন করুন"}
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>{isCodenameEditable ? 'লক করুন' : 'পরিবর্তন'}</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    disabled={!isCodenameEditable}
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className={`mt-1 block w-full px-3 py-2 bg-slate-950 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono ${
                      isCodenameEditable
                        ? 'border-blue-500/50 text-white opacity-100 ring-1 ring-blue-500/30'
                        : 'border-slate-855 text-slate-500 cursor-not-allowed opacity-60'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">সম্পূর্ণ নাম (Full Name)</label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    disabled={(profile?.role !== 'admin' || adminActiveTab === 'user') && profile?.has_edited_profile && (!isEditRequestMode || profile?.profile_change_status === 'pending')}
                    className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">জব রোল (Job Role)</label>
                  <input
                    type="text"
                    required
                    value={editJobRole}
                    onChange={(e) => setEditJobRole(e.target.value)}
                    disabled={(profile?.role !== 'admin' || adminActiveTab === 'user') && profile?.has_edited_profile && (!isEditRequestMode || profile?.profile_change_status === 'pending')}
                    className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">দৈনিক কর্মঘণ্টা</label>
                    <select
                      value={editWorkingHours}
                      onChange={(e) => setEditWorkingHours(e.target.value)}
                      disabled={(profile?.role !== 'admin' || adminActiveTab === 'user') && profile?.has_edited_profile && (!isEditRequestMode || profile?.profile_change_status === 'pending')}
                      className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="" disabled hidden>নির্বাচন করুন</option>
                      <option value="7.5">৭ ঘণ্টা ৩০ মিনিট</option>
                      <option value="8.0">৮ ঘণ্টা</option>
                      <option value="8.5">৮ ঘণ্টা ৩০ মিনিট</option>
                      <option value="9.0">৯ ঘণ্টা</option>
                      <option value="9.5">৯ ঘণ্টা ৩০ মিনিট</option>
                      <option value="10.0">১০ ঘণ্টা</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">ব্রেক (মিনিট)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editBreakTime}
                      onChange={(e) => setEditBreakTime(e.target.value)}
                      disabled={(profile?.role !== 'admin' || adminActiveTab === 'user') && profile?.has_edited_profile && (!isEditRequestMode || profile?.profile_change_status === 'pending')}
                      className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">ডিফল্ট সাইন-ইন টাইম</label>
                    <input
                      type="time"
                      required
                      value={profileSignInTime}
                      onChange={(e) => setProfileSignInTime(e.target.value)}
                      disabled={(profile?.role !== 'admin' || adminActiveTab === 'user') && profile?.has_edited_profile && (!isEditRequestMode || profile?.profile_change_status === 'pending')}
                      className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">ডিফল্ট সাইন-আউট টাইম</label>
                    <input
                      type="time"
                      required
                      value={profileSignOutTime}
                      onChange={(e) => setProfileSignOutTime(e.target.value)}
                      disabled={(profile?.role !== 'admin' || adminActiveTab === 'user') && profile?.has_edited_profile && (!isEditRequestMode || profile?.profile_change_status === 'pending')}
                      className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Needs Supervisor Approval Toggle (Admin only) */}
                {profile?.role === 'admin' && adminActiveTab === 'admin' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between p-3 bg-slate-955/60 rounded-lg border border-slate-800/80">
                      <div>
                        <span className="block text-sm font-medium text-white font-semibold">Supervisor Approval?</span>
                        <span className="block text-[11px] text-slate-400">Yes দিলে ছুটির জন্য সুপারভাইজার অ্যাপ্রুভাল লাগবে</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditNeedsApproval(!editNeedsApproval)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          editNeedsApproval ? 'bg-blue-600' : 'bg-slate-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            editNeedsApproval ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-955/60 rounded-lg border border-slate-800/80">
                      <div>
                        <span className="block text-sm font-medium text-white font-semibold">Reserve Holiday?</span>
                        <span className="block text-[11px] text-slate-400">Yes দিলে রিজার্ভ ছুটির ক্যাটাগরি চালু হবে</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditAllowReserve(!editAllowReserve)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          editAllowReserve ? 'bg-blue-600' : 'bg-slate-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            editAllowReserve ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-955/60 rounded-lg border border-slate-800/80">
                      <div>
                        <span className="block text-sm font-medium text-white font-semibold">Overtime?</span>
                        <span className="block text-[11px] text-slate-400">Yes দিলে ওভারটাইমের ক্যাটাগরি চালু হবে</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditAllowOvertime(!editAllowOvertime)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          editAllowOvertime ? 'bg-blue-600' : 'bg-slate-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            editAllowOvertime ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}

                {(profile?.role !== 'admin' || adminActiveTab === 'user') && profile?.has_edited_profile && !isEditRequestMode && profile?.profile_change_status !== 'pending' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditRequestMode(true);
                      setEditFullName(profile?.full_name || '');
                      setEditWorkingHours(Number(profile?.working_hours || 9.5).toFixed(1));
                      setEditBreakTime(String(profile?.break_time || 0));
                      setEditJobRole(profile?.job_role || '');
                    }}
                    className="w-full flex justify-center py-2 px-4 border border-blue-500/30 rounded-lg shadow-sm text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-955/20 hover:bg-blue-955/40 cursor-pointer transition-all mt-4"
                  >
                    প্রোফাইল পরিবর্তনের অনুরোধ পাঠান
                  </button>
                )}

                {((profile?.role === 'admin' && adminActiveTab === 'admin') || !profile?.has_edited_profile || (isEditRequestMode && profile?.profile_change_status !== 'pending')) && (
                  <div className="flex gap-3 mt-6">
                    {((profile?.role !== 'admin' || adminActiveTab === 'user') && profile?.has_edited_profile) && (
                      <button
                        type="button"
                        onClick={() => setIsEditRequestMode(false)}
                        className="flex-1 flex justify-center py-2 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 cursor-pointer transition-all"
                      >
                        বাতিল
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={setupSubmitting}
                      className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                    >
                      {setupSubmitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                      {setupSubmitting ? 'সেভ হচ্ছে...' : (((profile?.role === 'admin' && adminActiveTab === 'admin') || !profile?.has_edited_profile) ? 'সেটিংস সেভ করুন' : 'অনুরোধ সাবমিট করুন')}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
