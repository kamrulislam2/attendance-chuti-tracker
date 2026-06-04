'use client';

import React from 'react';
import { User, AlertTriangle, RefreshCw } from 'lucide-react';
import { Profile } from '@/types';
import { subscribeUserToPush, unsubscribeUserFromPush } from '@/utils/webPushHelper';
import { ProfileFields } from '../ProfileFields';

interface AdminProfileSettingsModalProps {
  showProfileSettingsModal: boolean;
  setShowProfileSettingsModal: (val: boolean) => void;
  profile: Profile | null;
  editingStaffProfileId: string | null;
  sessionUser: any;
  isPushSubscribed: boolean;
  setIsPushSubscribed: (val: boolean) => void;
  isPushLoading: boolean;
  setIsPushLoading: (val: boolean) => void;
  adminActiveTab: 'user' | 'admin';
  setAdminActiveTab: (val: 'user' | 'admin') => void;
  setViewingStaffId: (val: string | null) => void;
  isCodenameEditable: boolean;
  setIsCodenameEditable: (val: boolean) => void;
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
  editNeedsApproval: boolean;
  setEditNeedsApproval: (val: boolean) => void;
  editAllowReserve: boolean;
  setEditAllowReserve: (val: boolean) => void;
  editAllowOvertime: boolean;
  setEditAllowOvertime: (val: boolean) => void;
  editEligibleOfficeLeave: boolean;
  setEditEligibleOfficeLeave: (val: boolean) => void;
  editEligibleGovtHoliday: boolean;
  setEditEligibleGovtHoliday: (val: boolean) => void;
  isEditRequestMode: boolean;
  setIsEditRequestMode: (val: boolean) => void;
  setupSubmitting: boolean;
  handleUpdateSettings: (e: React.FormEvent) => void;
  editMaxFullLeaves: string;
  setEditMaxFullLeaves: (val: string) => void;
}

export function AdminProfileSettingsModal({
  showProfileSettingsModal,
  setShowProfileSettingsModal,
  profile,
  editingStaffProfileId,
  sessionUser,
  isPushSubscribed,
  setIsPushSubscribed,
  isPushLoading,
  setIsPushLoading,
  adminActiveTab,
  setAdminActiveTab,
  setViewingStaffId,
  isCodenameEditable,
  setIsCodenameEditable,
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
  editNeedsApproval,
  setEditNeedsApproval,
  editAllowReserve,
  setEditAllowReserve,
  editAllowOvertime,
  setEditAllowOvertime,
  editEligibleOfficeLeave,
  setEditEligibleOfficeLeave,
  editEligibleGovtHoliday,
  setEditEligibleGovtHoliday,
  isEditRequestMode,
  setIsEditRequestMode,
  setupSubmitting,
  handleUpdateSettings,
  editMaxFullLeaves,
  setEditMaxFullLeaves,
}: AdminProfileSettingsModalProps) {
  if (!showProfileSettingsModal) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-955/80 backdrop-blur-md p-4">
      <div className="flex min-h-full items-center justify-center">
        <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden my-8">
          <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[80px] pointer-events-none" />

          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 mb-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" /> প্রোফাইল সেটিংস
            </h3>
            <button
              onClick={() => {
                setShowProfileSettingsModal(false);
                setIsEditRequestMode(false);
              }}
              className="text-slate-450 hover:text-white text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>

          {profile?.profile_change_status === 'pending' && (
            <div className="p-3 bg-amber-955/50 border border-amber-800/50 text-amber-300 text-xs rounded-lg mb-4 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <span>আপনার প্রোফাইল পরিবর্তনের অনুরোধটি বর্তমানে পেন্ডিং অবস্থায় আছে। অ্যাডমিনের অনুমোদনের জন্য অপেক্ষা করুন।</span>
            </div>
          )}

          <form onSubmit={handleUpdateSettings} className="space-y-4 font-sans">
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

                    // Optimistically update the UI toggle state immediately
                    setIsPushSubscribed(willSubscribe);
                    localStorage.setItem('push_subscribed_pref_' + sessionUser.id, willSubscribe ? 'true' : 'false');
                    setIsPushLoading(true);

                    try {
                      if (!willSubscribe) {
                        const success = await unsubscribeUserFromPush(sessionUser.id);
                        if (!success) {
                          // Revert state if failed
                          setIsPushSubscribed(true);
                          localStorage.setItem('push_subscribed_pref_' + sessionUser.id, 'true');
                        }
                      } else {
                        const success = await subscribeUserToPush(sessionUser.id);
                        if (!success) {
                          // Revert state if failed
                          setIsPushSubscribed(false);
                          localStorage.setItem('push_subscribed_pref_' + sessionUser.id, 'false');
                        }
                      }
                    } catch {
                      // Revert on error
                      setIsPushSubscribed(!willSubscribe);
                      localStorage.setItem('push_subscribed_pref_' + sessionUser.id, (!willSubscribe) ? 'true' : 'false');
                    } finally {
                      setIsPushLoading(false);
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isPushSubscribed ? 'bg-blue-600' : 'bg-slate-800'
                    } ${isPushLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isPushSubscribed ? 'translate-x-5' : 'translate-x-0'
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
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${adminActiveTab === 'admin' ? 'bg-purple-600' : 'bg-slate-800'
                    }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${adminActiveTab === 'admin' ? 'translate-x-5' : 'translate-x-0'
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
                    className={`text-[10px] flex items-center gap-1 transition-colors px-2 py-0.5 rounded cursor-pointer ${isCodenameEditable
                        ? 'text-amber-400 bg-amber-955/40 hover:bg-amber-955/60 border border-amber-800/30'
                        : 'text-blue-400 hover:text-blue-300 bg-blue-955/20 hover:bg-blue-950/40 border border-blue-900/20'
                      }`}
                    title={isCodenameEditable ? "এডিট মোড বন্ধ করুন" : "কোডনেম পরিবর্তন করুন"}
                  >
                    <EditIcon className="h-3 w-3" />
                    <span>{isCodenameEditable ? 'লক করুন' : 'পরিবর্তন'}</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                disabled={!isCodenameEditable}
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className={`mt-1 block w-full px-3 py-2 bg-slate-955 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono ${isCodenameEditable
                    ? 'border-blue-500/50 text-white cursor-text opacity-100 ring-1 ring-blue-500/30'
                    : 'border-slate-850 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
              />
            </div>

            <ProfileFields
              fullName={editFullName}
              setFullName={setEditFullName}
              jobRole={editJobRole}
              setJobRole={setEditJobRole}
              workingHours={editWorkingHours}
              setWorkingHours={setEditWorkingHours}
              breakTime={editBreakTime}
              setBreakTime={setEditBreakTime}
              signInTime={profileSignInTime}
              setSignInTime={setProfileSignInTime}
              signOutTime={profileSignOutTime}
              setSignOutTime={setProfileSignOutTime}
              disabled={(profile?.role !== 'admin' || adminActiveTab === 'user') && profile?.has_edited_profile && (!isEditRequestMode || profile?.profile_change_status === 'pending')}
            />

            {/* Settings Toggles (Admin only) */}
            {profile?.role === 'admin' && adminActiveTab === 'admin' && (
              <div className="flex flex-col gap-3 font-sans">
                <label className="flex items-center gap-3 p-3 bg-slate-955/60 rounded-lg border border-slate-800/80 cursor-pointer hover:bg-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={editNeedsApproval}
                    onChange={(e) => setEditNeedsApproval(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-550 focus:ring-offset-slate-900 focus:ring-2 cursor-pointer"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-white">Supervisor Approval?</span>
                    <span className="block text-[10px] text-slate-400">Yes দিলে ছুটির জন্য সুপারভাইজার অ্যাপ্রুভাল লাগবে</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-955/60 rounded-lg border border-slate-800/80 cursor-pointer hover:bg-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={editEligibleOfficeLeave}
                    onChange={(e) => setEditEligibleOfficeLeave(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-550 focus:ring-offset-slate-900 focus:ring-2 cursor-pointer"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-white">Office Leave Eligible?</span>
                    <span className="block text-[10px] text-slate-400">অন থাকলে বাৎসরিক অফিস বরাদ্দকৃত ছুটি ও ঈদ ছুটির যোগ্য হবেন</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-955/60 rounded-lg border border-slate-800/80 cursor-pointer hover:bg-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={editEligibleGovtHoliday}
                    onChange={(e) => setEditEligibleGovtHoliday(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-550 focus:ring-offset-slate-900 focus:ring-2 cursor-pointer"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-white">Govt Holiday Eligible?</span>
                    <span className="block text-[10px] text-slate-400">অন থাকলে সরকারি সাধারণ ছুটির তালিকা অনুযায়ী ছুটি পাওয়ার যোগ্য হবেন</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-955/60 rounded-lg border border-slate-800/80 cursor-pointer hover:bg-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={editAllowReserve}
                    onChange={(e) => setEditAllowReserve(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-550 focus:ring-offset-slate-900 focus:ring-2 cursor-pointer"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-white">Reserve Govt Holiday?</span>
                    <span className="block text-[10px] text-slate-400">Yes দিলে সরকারি সাধারণ ছুটি রিজার্ভ করার সুযোগ পাবে</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-955/60 rounded-lg border border-slate-800/80 cursor-pointer hover:bg-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={editAllowOvertime}
                    onChange={(e) => setEditAllowOvertime(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-550 focus:ring-offset-slate-900 focus:ring-2 cursor-pointer"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-white">Overtime?</span>
                    <span className="block text-[10px] text-slate-400">Yes দিলে ওভারটাইমের ক্যাটাগরি চালু হবে</span>
                  </div>
                </label>

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
                className="w-full flex justify-center py-2 px-4 border border-blue-500/30 rounded-lg shadow-sm text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-955/20 hover:bg-blue-950/40 cursor-pointer transition-all mt-4"
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
  );
}

// Simple Edit icon replacement to avoid extra lucide imports
function EditIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
