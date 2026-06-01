'use client';

import React from 'react';
import { Trash2, RefreshCw } from 'lucide-react';
import { ChutiRecord } from '@/utils/offlineSync';

interface DeleteConfirmModalProps {
  showDeleteModal: boolean;
  setShowDeleteModal: (val: boolean) => void;
  recordToDelete: ChutiRecord | null;
  setRecordToDelete: (val: ChutiRecord | null) => void;
  deletingRecord: boolean;
  handleConfirmDelete: () => void;
}

export function DeleteConfirmModal({
  showDeleteModal,
  setShowDeleteModal,
  recordToDelete,
  setRecordToDelete,
  deletingRecord,
  handleConfirmDelete,
}: DeleteConfirmModalProps) {
  if (!showDeleteModal || !recordToDelete) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/85 backdrop-blur-md p-4">
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden font-sans">
        <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-red-900/10 blur-[80px] pointer-events-none" />
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-red-600/10 border border-red-500/20 text-red-400 rounded-2xl mb-3">
            <Trash2 className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white">রেকর্ড ডিলিট নিশ্চিতকরণ</h3>
          <p className="text-xs text-slate-400 mt-1">আপনি কি নিশ্চিতভাবে এই রেকর্ডটি ডিলিট করতে চান? এই কাজটি আর ফেরত নেওয়া যাবে না।</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={deletingRecord}
            onClick={() => {
              setShowDeleteModal(false);
              setRecordToDelete(null);
            }}
            className="flex-1 flex justify-center py-2.5 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200 disabled:opacity-50"
          >
            না, বাতিল করুন
          </button>
          <button
            type="button"
            disabled={deletingRecord}
            onClick={handleConfirmDelete}
            className="flex-1 flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-red-600 hover:bg-red-700 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {deletingRecord && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
            {deletingRecord ? 'ডিলিট হচ্ছে...' : 'হ্যাঁ, ডিলিট করুন'}
          </button>
        </div>
      </div>
    </div>
  );
}
