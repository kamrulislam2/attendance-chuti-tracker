'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { ChutiRecord } from '@/utils/offlineSync';
import { Profile } from '@/types';

interface AdminCancelAdjustmentModalProps {
  showCancelAdjustmentModal: boolean;
  setShowCancelAdjustmentModal: (val: boolean) => void;
  cancelAdjustmentRecord: ChutiRecord | null;
  setCancelAdjustmentRecord: (val: ChutiRecord | null) => void;
  handleConfirmCancelAdjustment: () => void;
  profile: Profile | null;
  adminActiveTab: 'user' | 'admin';
}

export function AdminCancelAdjustmentModal({
  showCancelAdjustmentModal,
  setShowCancelAdjustmentModal,
  cancelAdjustmentRecord,
  setCancelAdjustmentRecord,
  handleConfirmCancelAdjustment,
  profile,
  adminActiveTab,
}: AdminCancelAdjustmentModalProps) {
  if (!showCancelAdjustmentModal || !cancelAdjustmentRecord) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/85 backdrop-blur-md p-4">
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden font-sans">
        <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-amber-900/10 blur-[80px] pointer-events-none" />
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-amber-600/10 border border-amber-500/20 text-amber-400 rounded-2xl mb-3">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white">
            {profile?.role === 'admin' && adminActiveTab === 'admin' ? 'সমন্বয় বাতিল নিশ্চিতকরণ' : 'সমন্বয় বাতিলের অনুরোধ'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {profile?.role === 'admin' && adminActiveTab === 'admin'
              ? 'আপনি কি নিশ্চিতভাবে এই রেকর্ডটির ছুটি সমন্বয় বাতিল করতে চান?'
              : 'আপনি কি নিশ্চিতভাবে এই রেকর্ডটির ছুটি সমন্বয় বাতিলের অনুরোধ পাঠাতে চান?'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setShowCancelAdjustmentModal(false);
              setCancelAdjustmentRecord(null);
            }}
            className="flex-1 flex justify-center py-2.5 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200"
          >
            না
          </button>
          <button
            type="button"
            onClick={handleConfirmCancelAdjustment}
            className="flex-1 flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200"
          >
            {profile?.role === 'admin' && adminActiveTab === 'admin' ? 'হ্যাঁ, বাতিল করুন' : 'হ্যাঁ, অনুরোধ পাঠান'}
          </button>
        </div>
      </div>
    </div>
  );
}
