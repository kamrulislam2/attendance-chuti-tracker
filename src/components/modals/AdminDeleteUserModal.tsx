'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Profile } from '@/types';

interface AdminDeleteUserModalProps {
  showDeleteUserModal: boolean;
  setShowDeleteUserModal: (val: boolean) => void;
  deleteTargetUser: Profile | null;
  setDeleteTargetUser: (val: Profile | null) => void;
  deletingUser: boolean;
  handleDeleteUser: () => void;
  profile: Profile | null;
}

export function AdminDeleteUserModal({
  showDeleteUserModal,
  setShowDeleteUserModal,
  deleteTargetUser,
  setDeleteTargetUser,
  deletingUser,
  handleDeleteUser,
  profile,
}: AdminDeleteUserModalProps) {
  if (!showDeleteUserModal || !deleteTargetUser || profile?.role !== 'admin') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden font-sans">
        <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-red-900/10 blur-[80px] pointer-events-none" />
        
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-red-600/10 border border-red-500/20 text-red-400 rounded-2xl mb-3">
            <AlertTriangle className="h-6 w-6 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-white">স্টাফ অ্যাকাউন্ট মুছে ফেলা নিশ্চিতকরণ</h3>
          <p className="text-xs text-slate-355 mt-2">
            আপনি কি নিশ্চিতভাবে স্টাফ <strong className="text-white">"{deleteTargetUser.full_name || deleteTargetUser.username}"</strong>-কে মুছে ফেলতে চান?
          </p>
          <p className="text-xs text-red-400 mt-2 font-semibold">
            ⚠️ সতর্কীকরণ: অ্যাকাউন্টটি মুছে ফেললে তার বাৎসরিক সমস্ত ছুটির রেকর্ডও স্থায়ীভাবে মুছে যাবে এবং এটি আর ফিরে পাওয়া সম্ভব নয়।
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setShowDeleteUserModal(false);
              setDeleteTargetUser(null);
            }}
            className="flex-1 flex justify-center py-2 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-355 bg-slate-955 hover:bg-slate-900 cursor-pointer transition-all"
          >
            না, বাতিল করুন
          </button>
          <button
            type="button"
            onClick={handleDeleteUser}
            disabled={deletingUser}
            className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-red-600 hover:bg-red-700 cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {deletingUser && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
            {deletingUser ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, স্টাফ মুছে ফেলুন'}
          </button>
        </div>
      </div>
    </div>
  );
}
