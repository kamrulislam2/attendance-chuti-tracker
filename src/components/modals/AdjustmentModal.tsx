'use client';

import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { ChutiRecord } from '@/utils/offlineSync';

import { Modal } from '../Modal';

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
  return (
    <Modal
      isOpen={showAdjustmentModal && adjustmentRecord !== null}
      onClose={() => {
        setShowAdjustmentModal(false);
        setAdjustmentRecord(null);
      }}
      title="Confirm Leave Adjustment"
      icon={<SlidersHorizontal className="h-5 w-5 text-orange-500" />}
      glowClass="bg-orange-900/10"
      maxWidthClass="max-w-md"
    >
      {adjustmentRecord && (
        <>
          {adjustmentRecord.leave_type === 'Short Leave' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">For Short Leave, select whether you want to adjust the full duration or a partial duration:</p>
              <div className="flex gap-4">
                <label className="flex-1 flex items-center gap-2 p-3 bg-slate-950/60 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700 hover:scale-[1.01] transition-all">
                  <input
                    type="radio"
                    name="adjustmentType"
                    checked={adjustmentType === 'full'}
                    onChange={() => setAdjustmentType('full')}
                    className="text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-xs text-white font-medium">Full Duration ({adjustmentRecord.leave_hour ? adjustmentRecord.leave_hour.toString().split('.')[0].substring(0, 5) : '-'})</span>
                </label>
                <label className="flex-1 flex items-center gap-2 p-3 bg-slate-955/60 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700 hover:scale-[1.01] transition-all">
                  <input
                    type="radio"
                    name="adjustmentType"
                    checked={adjustmentType === 'partial'}
                    onChange={() => setAdjustmentType('partial')}
                    className="text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-xs text-white font-medium">Partial Duration</span>
                </label>
              </div>

              {adjustmentType === 'partial' && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Partial Adjustment Duration (HH:MM)</label>
                  <input
                    type="text"
                    placeholder="e.g., 02:00"
                    value={partialAdjustmentTime}
                    onChange={(e) => setPartialAdjustmentTime(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
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
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveAdjustment()}
                  className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200"
                >
                  Adjust Leave
                </button>
              </div>
            </div>
          ) : adjustmentRecord.leave_type === 'Overtime' ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-355 font-medium">For Overtime adjustment, do you want to deduct it from the Short Leave balance?</p>
              <div className="flex flex-col gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setAdjustShortLeaveOption(true);
                    handleSaveAdjustment(true);
                  }}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200"
                >
                  Yes, deduct from Short Leave
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdjustShortLeaveOption(false);
                    handleSaveAdjustment(false);
                  }}
                  className="w-full flex justify-center py-2.5 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200"
                >
                  No, just discard Overtime
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdjustmentModal(false);
                    setAdjustmentRecord(null);
                  }}
                  className="w-full flex justify-center py-2.5 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-355 font-medium">Are you sure you want to fully adjust this leave record?</p>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdjustmentModal(false);
                    setAdjustmentRecord(null);
                  }}
                  className="flex-1 flex justify-center py-2 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200"
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveAdjustment()}
                  className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200"
                >
                  Yes, Adjust
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
