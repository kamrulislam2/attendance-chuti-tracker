'use client';

import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { ChutiRecord } from '@/utils/offlineSync';

interface AdjustmentModalProps {
  showAdjustmentModal: boolean;
  setShowAdjustmentModal: (val: boolean) => void;
  adjustmentRecord: ChutiRecord | null;
  setAdjustmentRecord: (val: ChutiRecord | null) => void;
  adjustmentType: 'full' | 'partial';
  setAdjustmentType: (val: 'full' | 'partial') => void;
  partialAdjustmentTime: string;
  setPartialAdjustmentTime: (val: string) => void;
  setAdjustShortLeaveOption: (val: boolean) => void;
  handleSaveAdjustment: (adjustSL?: boolean) => void;
}

export function AdjustmentModal({
  showAdjustmentModal,
  setShowAdjustmentModal,
  adjustmentRecord,
  setAdjustmentRecord,
  adjustmentType,
  setAdjustmentType,
  partialAdjustmentTime,
  setPartialAdjustmentTime,
  setAdjustShortLeaveOption,
  handleSaveAdjustment,
}: AdjustmentModalProps) {
  if (!showAdjustmentModal || !adjustmentRecord) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/85 backdrop-blur-md p-4">
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden font-sans">
        <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[80px] pointer-events-none" />
        
        <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 mb-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-blue-500" /> ছুটি সমন্বয় নিশ্চিতকরণ
          </h3>
          <button 
            onClick={() => {
              setShowAdjustmentModal(false);
              setAdjustmentRecord(null);
            }}
            className="text-slate-450 hover:text-white text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {adjustmentRecord.leave_type === 'Short Leave' ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">শর্ট লিভের ক্ষেত্রে আপনি কি সম্পূর্ণ সময় নাকি আংশিক সময় সমন্বয় করতে চান তা সিলেক্ট করুন:</p>
            <div className="flex gap-4">
              <label className="flex-1 flex items-center gap-2 p-3 bg-slate-950/60 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700 hover:scale-[1.01] transition-all">
                <input
                  type="radio"
                  name="adjustmentType"
                  checked={adjustmentType === 'full'}
                  onChange={() => setAdjustmentType('full')}
                  className="text-blue-500 focus:ring-blue-500"
                />
                <span className="text-xs text-white font-medium">সম্পূর্ণ আওয়ার ({adjustmentRecord.leave_hour ? adjustmentRecord.leave_hour.toString().split('.')[0].substring(0, 5) : '-'})</span>
              </label>
              <label className="flex-1 flex items-center gap-2 p-3 bg-slate-955/60 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700 hover:scale-[1.01] transition-all">
                <input
                  type="radio"
                  name="adjustmentType"
                  checked={adjustmentType === 'partial'}
                  onChange={() => setAdjustmentType('partial')}
                  className="text-blue-500 focus:ring-blue-500"
                />
                <span className="text-xs text-white font-medium">আংশিক সময়</span>
              </label>
            </div>

            {adjustmentType === 'partial' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">আংশিক সমন্বয়ের সময় (ঘণ্টা:মিনিট)</label>
                <input
                  type="text"
                  placeholder="যেমন: 02:00"
                  value={partialAdjustmentTime}
                  onChange={(e) => setPartialAdjustmentTime(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setShowAdjustmentModal(false);
                  setAdjustmentRecord(null);
                }}
                className="flex-1 flex justify-center py-2 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-355 bg-slate-955 hover:bg-slate-900 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => handleSaveAdjustment()}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200"
              >
                সমন্বয় করুন
              </button>
            </div>
          </div>
        ) : adjustmentRecord.leave_type === 'Overtime' ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-350 font-medium">ওভারটাইম সমন্বয়ের সময় আপনি কি এটি শর্ট লিভের মোট ব্যালেন্স থেকে বিয়োগ (Adjust) করতে চান?</p>
            <div className="flex flex-col gap-2 pt-4">
              <button
                type="button"
                onClick={() => {
                  setAdjustShortLeaveOption(true);
                  handleSaveAdjustment(true);
                }}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200"
              >
                হ্যাঁ, শর্ট লিভ থেকে বিয়োগ করুন
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdjustShortLeaveOption(false);
                  handleSaveAdjustment(false);
                }}
                className="w-full flex justify-center py-2.5 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200"
              >
                না, কেবল ওভারটাইম বাদ দিন
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAdjustmentModal(false);
                  setAdjustmentRecord(null);
                }}
                className="w-full flex justify-center py-2.5 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200"
              >
                বাতিল করুন
              </button>
            </div>
          </div>
        ) : adjustmentRecord.leave_type === 'Reserve' ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-350 font-medium">রিজার্ভ ছুটির সমন্বয় করার সময় আপনি কি এটি ফুল লিভের মোট ব্যালেন্স থেকে বিয়োগ (Adjust) করতে চান?</p>
            <div className="flex flex-col gap-2 pt-4">
              <button
                type="button"
                onClick={() => {
                  setAdjustShortLeaveOption(true);
                  handleSaveAdjustment(true);
                }}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200"
              >
                হ্যাঁ, ফুল লিভ থেকে বিয়োগ করুন
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdjustShortLeaveOption(false);
                  handleSaveAdjustment(false);
                }}
                className="w-full flex justify-center py-2.5 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200"
              >
                না, কেবল রিজার্ভ থেকে মাইনাস করুন
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAdjustmentModal(false);
                  setAdjustmentRecord(null);
                }}
                className="w-full flex justify-center py-2.5 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200"
              >
                বাতিল করুন
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-355 font-medium">আপনি কি নিশ্চিতভাবে এই ছুটির রেকর্ডটি সম্পূর্ণ সমন্বয় করতে চান?</p>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowAdjustmentModal(false);
                  setAdjustmentRecord(null);
                }}
                className="flex-1 flex justify-center py-2 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200"
              >
                না
              </button>
              <button
                type="button"
                onClick={() => handleSaveAdjustment()}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200"
              >
                হ্যাঁ, সমন্বয় করুন
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
