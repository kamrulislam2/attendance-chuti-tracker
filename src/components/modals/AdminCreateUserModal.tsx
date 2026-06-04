'use client';

import React from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { PasswordMatchIndicator } from '@/components/PasswordMatchIndicator';
import { Profile } from '@/types';
import { ProfileFields } from '@/components/ProfileFields';

interface AdminCreateUserModalProps {
  showCreateUserModal: boolean;
  setShowCreateUserModal: (val: boolean) => void;
  profile: Profile | null;
  newStaffPassword: string;
  setNewStaffPassword: (val: string) => void;
  newStaffUsername: string;
  setNewStaffUsername: (val: string) => void;
  newStaffRole: string;
  setNewStaffRole: (val: string) => void;
  newStaffFullName: string;
  setNewStaffFullName: (val: string) => void;
  newStaffNeedsApproval: boolean;
  setNewStaffNeedsApproval: (val: boolean) => void;
  newStaffAllowReserve: boolean;
  setNewStaffAllowReserve: (val: boolean) => void;
  newStaffAllowOvertime: boolean;
  setNewStaffAllowOvertime: (val: boolean) => void;
  creatingUser: boolean;
  newStaffConfirmPassword: string;
  setNewStaffConfirmPassword: (val: string) => void;
  handleCreateNewUser: () => void;
  newStaffJobRole: string;
  setNewStaffJobRole: (val: string) => void;
  newStaffWorkingHours: string;
  setNewStaffWorkingHours: (val: string) => void;
  newStaffBreakTime: string;
  setNewStaffBreakTime: (val: string) => void;
  newStaffSignInTime: string;
  setNewStaffSignInTime: (val: string) => void;
  newStaffSignOutTime: string;
  setNewStaffSignOutTime: (val: string) => void;
  newStaffEligibleOfficeLeave: boolean;
  setNewStaffEligibleOfficeLeave: (val: boolean) => void;
  newStaffEligibleGovtHoliday: boolean;
  setNewStaffEligibleGovtHoliday: (val: boolean) => void;
}

export function AdminCreateUserModal({
  showCreateUserModal,
  setShowCreateUserModal,
  profile,
  newStaffPassword,
  setNewStaffPassword,
  newStaffUsername,
  setNewStaffUsername,
  newStaffRole,
  setNewStaffRole,
  newStaffFullName,
  setNewStaffFullName,
  newStaffNeedsApproval,
  setNewStaffNeedsApproval,
  newStaffAllowReserve,
  setNewStaffAllowReserve,
  newStaffAllowOvertime,
  setNewStaffAllowOvertime,
  creatingUser,
  newStaffConfirmPassword,
  setNewStaffConfirmPassword,
  handleCreateNewUser,
  newStaffJobRole,
  setNewStaffJobRole,
  newStaffWorkingHours,
  setNewStaffWorkingHours,
  newStaffBreakTime,
  setNewStaffBreakTime,
  newStaffSignInTime,
  setNewStaffSignInTime,
  newStaffSignOutTime,
  setNewStaffSignOutTime,
  newStaffEligibleOfficeLeave,
  setNewStaffEligibleOfficeLeave,
  newStaffEligibleGovtHoliday,
  setNewStaffEligibleGovtHoliday,
}: AdminCreateUserModalProps) {
  if (!showCreateUserModal || profile?.role !== 'admin') return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-955/80 backdrop-blur-md p-4">
      <div className="flex min-h-full items-center justify-center font-sans">
        <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden my-8">
          <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-purple-900/10 blur-[80px] pointer-events-none" />
          
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 mb-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-purple-500" /> নতুন স্টাফ যুক্ত করুন
            </h3>
            <button 
              onClick={() => {
                setShowCreateUserModal(false);
                setNewStaffPassword('');
                setNewStaffConfirmPassword('');
                setNewStaffUsername('');
                setNewStaffFullName('');
                setNewStaffRole('user');
                setNewStaffNeedsApproval(false);
                setNewStaffAllowReserve(false);
                setNewStaffAllowOvertime(false);
              }}
              className="text-slate-450 hover:text-white text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">কোডনেম (Codename / Username)</label>
              <input
                type="text"
                placeholder="যেমন: KI1024"
                value={newStaffUsername}
                onChange={(e) => setNewStaffUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">পাসওয়ার্ড (Password)</label>
              <input
                type="password"
                placeholder="কমপক্ষে 4-6টি ক্যারেক্টার"
                value={newStaffPassword}
                onChange={(e) => setNewStaffPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">পাসওয়ার্ড নিশ্চিত করুন (Confirm Password)</label>
              <input
                type="password"
                placeholder="পাসওয়ার্ডটি আবার লিখুন"
                value={newStaffConfirmPassword}
                onChange={(e) => setNewStaffConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <PasswordMatchIndicator password={newStaffPassword} confirmPassword={newStaffConfirmPassword} />
            </div>

            <ProfileFields
              fullName={newStaffFullName}
              setFullName={setNewStaffFullName}
              jobRole={newStaffJobRole}
              setJobRole={setNewStaffJobRole}
              workingHours={newStaffWorkingHours}
              setWorkingHours={setNewStaffWorkingHours}
              breakTime={newStaffBreakTime}
              setBreakTime={setNewStaffBreakTime}
              signInTime={newStaffSignInTime}
              setSignInTime={setNewStaffSignInTime}
              signOutTime={newStaffSignOutTime}
              setSignOutTime={setNewStaffSignOutTime}
            />

            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">রোল (Role)</label>
              <select
                value={newStaffRole}
                onChange={(e) => setNewStaffRole(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="user">Staff / User</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Checkboxes Grid */}
            <div className="grid grid-cols-1 gap-2.5 pt-2">
              <label className="flex items-center gap-3 p-3 bg-slate-955/60 rounded-lg border border-slate-800/80 cursor-pointer hover:bg-slate-900 transition-colors">
                <input
                  type="checkbox"
                  checked={newStaffNeedsApproval}
                  onChange={(e) => setNewStaffNeedsApproval(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-slate-800 bg-slate-955 text-purple-600 focus:ring-purple-550 focus:ring-offset-slate-900 focus:ring-2 cursor-pointer"
                />
                <div>
                  <span className="block text-xs font-semibold text-white">Supervisor Approval?</span>
                  <span className="block text-[10px] text-slate-400">Yes দিলে ছুটির জন্য সুপারভাইজার অ্যাপ্রুভাল লাগবে</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-955/60 rounded-lg border border-slate-800/80 cursor-pointer hover:bg-slate-900 transition-colors">
                <input
                  type="checkbox"
                  checked={newStaffEligibleOfficeLeave}
                  onChange={(e) => setNewStaffEligibleOfficeLeave(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-slate-800 bg-slate-950 text-purple-600 focus:ring-purple-550 focus:ring-offset-slate-900 focus:ring-2 cursor-pointer"
                />
                <div>
                  <span className="block text-xs font-semibold text-white">Office Leave Eligible?</span>
                  <span className="block text-[10px] text-slate-400">অন থাকলে বাৎসরিক অফিস বরাদ্দকৃত ছুটি ও ঈদ ছুটির যোগ্য হবেন</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-955/60 rounded-lg border border-slate-800/80 cursor-pointer hover:bg-slate-900 transition-colors">
                <input
                  type="checkbox"
                  checked={newStaffEligibleGovtHoliday}
                  onChange={(e) => setNewStaffEligibleGovtHoliday(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-slate-800 bg-slate-955 text-purple-600 focus:ring-purple-550 focus:ring-offset-slate-900 focus:ring-2 cursor-pointer"
                />
                <div>
                  <span className="block text-xs font-semibold text-white">Govt Holiday Eligible?</span>
                  <span className="block text-[10px] text-slate-400">অন থাকলে সরকারি সাধারণ ছুটির তালিকা অনুযায়ী ছুটি পাওয়ার যোগ্য হবেন</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-955/60 rounded-lg border border-slate-800/80 cursor-pointer hover:bg-slate-900 transition-colors">
                <input
                  type="checkbox"
                  checked={newStaffAllowReserve}
                  onChange={(e) => setNewStaffAllowReserve(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-slate-800 bg-slate-955 text-purple-600 focus:ring-purple-550 focus:ring-offset-slate-900 focus:ring-2 cursor-pointer"
                />
                <div>
                  <span className="block text-xs font-semibold text-white">Reserve Govt Holiday?</span>
                  <span className="block text-[10px] text-slate-400">Yes দিলে সরকারি সাধারণ ছুটি রিজার্ভ করার সুযোগ পাবে</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-955/60 rounded-lg border border-slate-800/80 cursor-pointer hover:bg-slate-900 transition-colors">
                <input
                  type="checkbox"
                  checked={newStaffAllowOvertime}
                  onChange={(e) => setNewStaffAllowOvertime(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-slate-800 bg-slate-955 text-purple-600 focus:ring-purple-550 focus:ring-offset-slate-900 focus:ring-2 cursor-pointer"
                />
                <div>
                  <span className="block text-xs font-semibold text-white">Overtime Category?</span>
                  <span className="block text-[10px] text-slate-400">Yes দিলে ওভারটাইমের ক্যাটাগরি চালু হবে</span>
                </div>
              </label>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setShowCreateUserModal(false);
                  setNewStaffPassword('');
                  setNewStaffConfirmPassword('');
                  setNewStaffUsername('');
                  setNewStaffFullName('');
                  setNewStaffRole('user');
                  setNewStaffNeedsApproval(false);
                  setNewStaffAllowReserve(false);
                  setNewStaffAllowOvertime(false);
                }}
                className="flex-1 flex justify-center py-2 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 cursor-pointer transition-all"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleCreateNewUser}
                disabled={creatingUser || !newStaffPassword || newStaffPassword !== newStaffConfirmPassword || newStaffPassword.length < 4}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {creatingUser && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                {creatingUser ? 'তৈরি হচ্ছে...' : 'স্টাফ তৈরি করুন'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
