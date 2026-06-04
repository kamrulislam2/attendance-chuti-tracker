'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import { GlobalSettings } from '@/utils/dashboardHelpers';

interface AdminOfficeLeaveSettingsModalProps {
  showModal: boolean;
  setShowModal: (val: boolean) => void;
  globalSettings: GlobalSettings;
  onSave: (settings: GlobalSettings) => Promise<boolean>;
}

export function AdminOfficeLeaveSettingsModal({
  showModal,
  setShowModal,
  globalSettings,
  onSave,
}: AdminOfficeLeaveSettingsModalProps) {
  const [officeLeaveDefault, setOfficeLeaveDefault] = useState(14);
  const [eidFitrLeave, setEidFitrLeave] = useState(0);
  const [eidAdhaLeave, setEidAdhaLeave] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (showModal) {
      setOfficeLeaveDefault(globalSettings.office_leave_default ?? 14);
      setEidFitrLeave(globalSettings.eid_fitr_leave ?? 0);
      setEidAdhaLeave(globalSettings.eid_adha_leave ?? 0);
    }
  }, [showModal, globalSettings]);

  if (!showModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const success = await onSave({
      ...globalSettings,
      office_leave_default: Number(officeLeaveDefault),
      eid_fitr_leave: Number(eidFitrLeave),
      eid_adha_leave: Number(eidAdhaLeave),
    });
    setSubmitting(false);
    if (success) {
      setShowModal(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-955/80 backdrop-blur-md p-4">
      <div className="flex min-h-full items-center justify-center">
        <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden font-sans">
          <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[80px] pointer-events-none" />
          
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 mb-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" /> অফিস বরাদ্দকৃত ছুটি সেটিংস
            </h3>
            <button 
              onClick={() => setShowModal(false)}
              className="text-slate-450 hover:text-white text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">ডিফল্ট অফিস ছুটি (দিন)</label>
              <input
                type="number"
                min="0"
                required
                value={officeLeaveDefault}
                onChange={(e) => setOfficeLeaveDefault(Number(e.target.value))}
                className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">প্রতিটি স্টাফের জন্য প্রাথমিক বাৎসরিক ডিফল্ট ছুটি (যেমন: 14 দিন)</span>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">ঈদুল ফিতরের ছুটি (দিন)</label>
              <input
                type="number"
                min="0"
                required
                value={eidFitrLeave}
                onChange={(e) => setEidFitrLeave(Number(e.target.value))}
                className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">ঈদুল আজহার ছুটি (দিন)</label>
              <input
                type="number"
                min="0"
                required
                value={eidAdhaLeave}
                onChange={(e) => setEidAdhaLeave(Number(e.target.value))}
                className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 flex justify-center py-2 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 cursor-pointer transition-all"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
              >
                {submitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                সেভ করুন
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
