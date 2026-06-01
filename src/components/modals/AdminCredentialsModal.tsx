'use client';

import React from 'react';
import { Edit, RefreshCw } from 'lucide-react';
import { PasswordMatchIndicator } from '@/components/PasswordMatchIndicator';
import { Profile } from '@/types';

interface AdminCredentialsModalProps {
  showCredentialsModal: boolean;
  setShowCredentialsModal: (val: boolean) => void;
  profile: Profile | null;
  credTargetUserId: string | null;
  setCredTargetUserId: (val: string | null) => void;
  credNewUsername: string;
  setCredNewUsername: (val: string) => void;
  credNewPassword: string;
  setCredNewPassword: (val: string) => void;
  credConfirmPassword: string;
  setCredConfirmPassword: (val: string) => void;
  updatingCredentials: boolean;
  handleUpdateCredentials: () => void;
}

export function AdminCredentialsModal({
  showCredentialsModal,
  setShowCredentialsModal,
  profile,
  credTargetUserId,
  setCredTargetUserId,
  credNewUsername,
  setCredNewUsername,
  credNewPassword,
  setCredNewPassword,
  credConfirmPassword,
  setCredConfirmPassword,
  updatingCredentials,
  handleUpdateCredentials,
}: AdminCredentialsModalProps) {
  if (!showCredentialsModal || profile?.role !== 'admin' || !credTargetUserId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-955/80 backdrop-blur-md p-4">
      <div className="flex min-h-full items-center justify-center">
        <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden my-8">
          <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[80px] pointer-events-none" />
          
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 mb-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-500" /> Change Password প্যানেল
            </h3>
            <button 
              onClick={() => {
                setShowCredentialsModal(false);
                setCredTargetUserId(null);
                setCredNewUsername('');
                setCredNewPassword('');
                setCredConfirmPassword('');
              }}
              className="text-slate-450 hover:text-white text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4 font-sans">
            <div className="p-3 bg-blue-955/20 border border-blue-900/30 rounded-xl text-xs text-blue-300">
              <p>💡 এখানে আপনি এই স্টাফের জন্য নতুন <strong>কোডনেম (Username)</strong> অথবা নতুন <strong>পাসওয়ার্ড</strong> সেট করতে পারবেন। পাসওয়ার্ড পরিবর্তন করলে স্টাফকে পরের বার নতুন পাসওয়ার্ড দিয়ে লগইন করতে হবে।</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">নতুন কোডনেম (Username)</label>
              <input
                type="text"
                placeholder="যেমন: KMH"
                value={credNewUsername}
                onChange={(e) => setCredNewUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">নতুন পাসওয়ার্ড (Password)</label>
              <input
                type="password"
                placeholder="পরিবর্তন না করতে চাইলে ফাঁকা রাখুন"
                value={credNewPassword}
                onChange={(e) => setCredNewPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">নতুন পাসওয়ার্ড নিশ্চিত করুন (Confirm Password)</label>
              <input
                type="password"
                placeholder="নতুন পাসওয়ার্ডটি আবার লিখুন"
                value={credConfirmPassword}
                onChange={(e) => setCredConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <PasswordMatchIndicator password={credNewPassword} confirmPassword={credConfirmPassword} />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-800/80 font-sans">
              <button
                type="button"
                onClick={() => {
                  setShowCredentialsModal(false);
                  setCredTargetUserId(null);
                  setCredNewUsername('');
                  setCredNewPassword('');
                  setCredConfirmPassword('');
                }}
                className="flex-1 flex justify-center py-2 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 cursor-pointer transition-all"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleUpdateCredentials}
                disabled={updatingCredentials || (credNewPassword ? (credNewPassword !== credConfirmPassword || credNewPassword.length < 4) : false)}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {updatingCredentials && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                {updatingCredentials ? 'সেভ হচ্ছে...' : 'আপডেট করুন'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
