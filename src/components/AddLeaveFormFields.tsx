'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { DateInput } from '@/components/DateInput';
import { ChutiRecord } from '@/utils/offlineSync';
import { formatDate } from '@/utils/dashboardHelpers';

interface AddLeaveFormFieldsProps {
  date: string;
  setDate: (val: string) => void;
  leaveType: string;
  setLeaveType: (val: string) => void;
  adjustmentCategory: string;
  setAdjustmentCategory: (val: string) => void;
  setAdjustment: (val: boolean) => void;
  adjustShortLeave: boolean;
  setAdjustShortLeave: (val: boolean) => void;
  signInTime: string;
  setSignInTime: (val: string) => void;
  signOutTime: string;
  setSignOutTime: (val: string) => void;
  leaveHour: string;
  setLeaveHour: (val: string) => void;
  comment: string;
  setComment: (val: string) => void;
  bulkDates: string[];
  bulkAdjustments: boolean[];
  handleAddBulkDate: () => void;
  handleUpdateBulkDate: (index: number, val: string) => void;
  handleUpdateBulkAdjustment: (index: number, val: boolean) => void;
  handleRemoveBulkDate: (index: number) => void;
  allowOvertime: boolean;
  children?: React.ReactNode; // Slots for supervisor selection or other content
  adjustment?: boolean;
  availableOvertimeMins?: number;
  availableShortLeaveMins?: number;
  records?: ChutiRecord[];
  govtHolidayRemaining?: number;
  eidFitrRemaining?: number;
  eidAdhaRemaining?: number;
  eligibleOfficeLeave?: boolean;
  isAdmin?: boolean;
}

export const AddLeaveFormFields: React.FC<AddLeaveFormFieldsProps> = ({
  date,
  setDate,
  leaveType,
  setLeaveType,
  adjustmentCategory,
  setAdjustmentCategory,
  setAdjustment,
  adjustShortLeave,
  setAdjustShortLeave,
  signInTime,
  setSignInTime,
  signOutTime,
  setSignOutTime,
  leaveHour,
  setLeaveHour,
  comment,
  setComment,
  bulkDates,
  bulkAdjustments,
  handleAddBulkDate,
  handleUpdateBulkDate,
  handleUpdateBulkAdjustment,
  handleRemoveBulkDate,
  allowOvertime,
  children,
  adjustment = false,
  availableOvertimeMins = 0,
  availableShortLeaveMins = 0,
  records = [],
  govtHolidayRemaining = 0,
  eidFitrRemaining = 0,
  eidAdhaRemaining = 0,
  eligibleOfficeLeave = true,
  isAdmin = false,
}) => {
  const isFullLeave = leaveType === 'Full Leave';
  const hasAnyFullLeaveToggle = isAdmin || (govtHolidayRemaining > 0) || (eidFitrRemaining > 0) || (eidAdhaRemaining > 0);

  const [showBulkAdjPrompt, setShowBulkAdjPrompt] = React.useState(false);
  const [pendingCategory, setPendingCategory] = React.useState('');
  const [customDaysInput, setCustomDaysInput] = React.useState('');

  const handleToggleCategory = (cat: string) => {
    if (cat === 'None') {
      if (adjustment && adjustmentCategory === 'None') {
        setAdjustment(false);
        bulkDates.forEach((_, idx) => handleUpdateBulkAdjustment(idx, false));
        if (comment.trim() === 'Adjustment') {
          setComment('');
        }
      } else {
        if (bulkDates.length > 0) {
          setPendingCategory('None');
          setCustomDaysInput(String(bulkDates.length + 1));
          setShowBulkAdjPrompt(true);
        } else {
          setAdjustmentCategory('None');
          setAdjustment(true);
          if (!comment || comment.trim() === '' || ['Office Leave', 'Govt Holiday', 'Eid-ul-Fitr', 'Eid-ul-Adha', 'Adjustment'].includes(comment.trim())) {
            setComment('Adjustment');
          }
        }
      }
      return;
    }

    if (adjustmentCategory === cat && adjustment) {
      setAdjustmentCategory('None');
      setAdjustment(false);
      bulkDates.forEach((_, idx) => handleUpdateBulkAdjustment(idx, false));
      if (comment.trim() === cat) {
        setComment('');
      }
    } else {
      if (bulkDates.length > 0) {
        setPendingCategory(cat);
        setCustomDaysInput(String(bulkDates.length + 1));
        setShowBulkAdjPrompt(true);
      } else {
        setAdjustmentCategory(cat);
        setAdjustment(true);
        if (!comment || comment.trim() === '' || ['Office Leave', 'Govt Holiday', 'Eid-ul-Fitr', 'Eid-ul-Adha', 'Adjustment'].includes(comment.trim())) {
          setComment(cat);
        }
      }
    }
  };

  const handleConfirmBulkAdj = (k: number) => {
    setAdjustmentCategory(pendingCategory);
    setAdjustment(k >= 1);
    bulkDates.forEach((_, idx) => {
      handleUpdateBulkAdjustment(idx, idx < k - 1);
    });
    if (!comment || comment.trim() === '' || ['Office Leave', 'Govt Holiday', 'Eid-ul-Fitr', 'Eid-ul-Adha', 'Adjustment'].includes(comment.trim())) {
      setComment(pendingCategory === 'None' ? 'Adjustment' : pendingCategory);
    }
    setShowBulkAdjPrompt(false);
    setPendingCategory('');
  };

  const parseHHMMToMins = (str: string): number => {
    if (!str) return 0;
    const parts = str.replace('-', '').split(':').map(Number);
    if (parts.length >= 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  const formatMinsToHHMM = (totalMins: number): string => {
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const leaveMins = parseHHMMToMins(leaveHour);

  // Short Leave Adjustment details helper message
  let shortLeaveAdjMsg = '';
  if (leaveType === 'Short Leave' && availableOvertimeMins > 0) {
    const adjustedMins = Math.min(leaveMins, availableOvertimeMins);
    const adjustedStr = formatMinsToHHMM(adjustedMins);
    const remainingMins = Math.max(0, leaveMins - availableOvertimeMins);
    const remainingStr = formatMinsToHHMM(remainingMins);

    if (adjustment) {
      shortLeaveAdjMsg = `✅ ${adjustedStr} hour adjusted, ${remainingStr} hour short leave হিসেবে কাউন্ট হবে।`;
    } else {
      shortLeaveAdjMsg = `ℹ️ adjust with ${adjustedStr} hours`;
    }
  }

  // Overtime Adjustment details helper message
  let overtimeAdjMsg = '';
  if (leaveType === 'Overtime' && availableShortLeaveMins > 0) {
    const adjustedMins = Math.min(leaveMins, availableShortLeaveMins);
    const adjustedStr = formatMinsToHHMM(adjustedMins);
    const remainingMins = Math.max(0, leaveMins - availableShortLeaveMins);
    const remainingStr = formatMinsToHHMM(remainingMins);

    if (adjustShortLeave) {
      overtimeAdjMsg = `✅ ${adjustedStr} hour adjusted, ${remainingStr} hour overtime হিসেবে কাউন্ট হবে।`;
    } else {
      overtimeAdjMsg = `ℹ️ adjust with ${adjustedStr} hours`;
    }
  }

  const duplicateRecord = date ? records.find(r => r.date === date) : null;

  return (
    <div className="space-y-4">
      {/* Date & Leave Type side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">তারিখ (Date)</label>
          <div className="flex gap-2 items-center mt-1">
            <DateInput
              required
              value={date}
              onChange={setDate}
              className="bg-slate-955 text-xs py-2"
            />
            {isFullLeave && (
              <button
                type="button"
                onClick={handleAddBulkDate}
                className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all flex items-center justify-center cursor-pointer shrink-0 border border-blue-700 shadow-md"
                title="আরও তারিখ যোগ করুন"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
          {duplicateRecord && (
            <p className="text-red-500 font-semibold text-[10px] mt-1.5 leading-snug">
              ⚠️ ডুপ্লিকেট! {formatDate(date)} তারিখে ইতিমধ্যে {duplicateRecord.leave_type === 'Full Leave' ? 'Full Leave (ফুল লিভ)' : duplicateRecord.leave_type === 'Short Leave' ? 'Short Leave (শর্ট লিভ)' : 'Overtime (ওভারটাইম)'} যোগ করা হয়েছে
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">ছুটির ধরন (Leave Type)</label>
          <select
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Short Leave">Short Leave</option>
            <option value="Full Leave">Full Leave</option>
            {allowOvertime && <option value="Overtime">Overtime</option>}
          </select>
        </div>
      </div>

      {/* Bulk Dates Input List */}
      {isFullLeave && bulkDates.length > 0 && (
        <div className="space-y-2.5 p-3 bg-slate-955/40 rounded-lg border border-slate-850/80 max-h-48 overflow-y-auto">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">অতিরিক্ত ছুটির তারিখসমূহ ({bulkDates.length} দিন)</label>
          <div className="grid grid-cols-1 gap-2">
            {bulkDates.map((bulkDate, index) => {
              const bulkDup = bulkDate ? records.find(r => r.date === bulkDate) : null;
              return (
                <div key={index} className="flex flex-col gap-1">
                  <div className="flex gap-2 items-center">
                    <span className="text-[10px] text-slate-500 font-mono w-4">{index + 2}.</span>
                    <div className="flex-1">
                      <DateInput
                        required
                        value={bulkDate}
                        onChange={(val) => handleUpdateBulkDate(index, val)}
                        className="bg-slate-955 py-1.5 text-xs"
                      />
                    </div>

                    {/* Individual Adjustment Switch */}
                    <div className="flex items-center gap-1.5 bg-slate-900/60 px-2 py-1.5 rounded-lg border border-slate-800/40 shrink-0">
                      <span className="text-[10px] font-semibold text-slate-400">Adj?</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateBulkAdjustment(index, !bulkAdjustments[index])}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          bulkAdjustments[index] ? 'bg-blue-600' : 'bg-slate-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            bulkAdjustments[index] ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveBulkDate(index)}
                      className="p-1.5 bg-red-955/60 hover:bg-red-900 border border-red-900/50 text-red-400 rounded-lg transition-all flex items-center justify-center cursor-pointer shrink-0"
                      title="বাদ দিন"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {bulkDup && (
                    <p className="text-red-500 font-semibold text-[9px] pl-6 leading-snug">
                      ⚠️ ডুপ্লিকেট! {formatDate(bulkDate)} তারিখে ইতিমধ্যে {bulkDup.leave_type === 'Full Leave' ? 'Full Leave (ফুল লিভ)' : bulkDup.leave_type === 'Short Leave' ? 'Short Leave (শর্ট লিভ)' : 'Overtime (ওভারটাইম)'} যোগ করা হয়েছে
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Adjustment Category & Overtime/Reserve Switch */}
      <div className="grid grid-cols-1 gap-4">
        {/* Render Adjustment Category Toggles only for Full Leave */}
        {leaveType === 'Full Leave' && hasAnyFullLeaveToggle && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              ছুটি সমন্বয় (Leave Adjustment)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* General Adjustment Toggle - Render only if isAdmin === true */}
              {isAdmin && (
                <div className="flex items-center justify-between p-3 bg-slate-955/60 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="block text-xs font-semibold text-slate-200 font-sans">Adjustment (সমন্বয় - বেতন/অন্যান্য)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleCategory('None')}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      adjustment && adjustmentCategory === 'None' ? 'bg-blue-600' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        adjustment && adjustmentCategory === 'None' ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* Govt Holiday Toggle - Render only if govtHolidayRemaining > 0 */}
              {govtHolidayRemaining > 0 && (
                <div className="flex items-center justify-between p-3 bg-slate-955/60 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="block text-xs font-semibold text-slate-200 font-sans">Govt Holiday (সরকারি সাধারণ ছুটি)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleCategory('Govt Holiday')}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      adjustmentCategory === 'Govt Holiday' ? 'bg-teal-600' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        adjustmentCategory === 'Govt Holiday' ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* Eid-ul-Fitr Toggle - Render only if eidFitrRemaining > 0 */}
              {eidFitrRemaining > 0 && (
                <div className="flex items-center justify-between p-3 bg-slate-955/60 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="block text-xs font-semibold text-slate-200 font-sans">Eid-ul-Fitr (ঈদুল ফিতরের ছুটি)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleCategory('Eid-ul-Fitr')}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      adjustmentCategory === 'Eid-ul-Fitr' ? 'bg-amber-600' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        adjustmentCategory === 'Eid-ul-Fitr' ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* Eid-ul-Adha Toggle - Render only if eidAdhaRemaining > 0 */}
              {eidAdhaRemaining > 0 && (
                <div className="flex items-center justify-between p-3 bg-slate-955/60 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="block text-xs font-semibold text-slate-200 font-sans">Eid-ul-Adha (ঈদুল আজহার ছুটি)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleCategory('Eid-ul-Adha')}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      adjustmentCategory === 'Eid-ul-Adha' ? 'bg-amber-600' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        adjustmentCategory === 'Eid-ul-Adha' ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Short Leave Adjustment toggle with Overtime (Conditional) */}
        {leaveType === 'Short Leave' && availableOvertimeMins > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-slate-955/60 rounded-lg border border-slate-800/80">
              <div>
                <span className="block text-xs font-semibold text-slate-200 font-sans">ওভারটাইমের সাথে সমন্বয় (Adjust with Overtime)?</span>
                <span className="block text-[10px] text-slate-450">Yes দিলে ওভারটাইম ব্যালেন্স থেকে সমন্বয় করা হবে</span>
              </div>
              <button
                type="button"
                onClick={() => setAdjustment(!adjustment)}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  adjustment ? 'bg-blue-600' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    adjustment ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            {shortLeaveAdjMsg && (
              <div className={`text-[11px] font-semibold px-1 font-sans ${adjustment ? 'text-blue-400' : 'text-slate-450'}`}>
                {shortLeaveAdjMsg}
              </div>
            )}
          </div>
        )}

        {/* Overtime Adjustment toggle with Short Leave (Conditional) */}
        {leaveType === 'Overtime' && availableShortLeaveMins > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-slate-955/60 rounded-lg border border-slate-800/80">
              <div>
                <span className="block text-xs font-semibold text-slate-200 font-sans">শর্ট লিভের সাথে সমন্বয় (Adjust with Short Leave)?</span>
                <span className="block text-[10px] text-slate-450">Yes দিলে শর্ট লিভ ব্যালেন্স থেকে সমন্বয় করা হবে</span>
              </div>
              <button
                type="button"
                onClick={() => setAdjustShortLeave(!adjustShortLeave)}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  adjustShortLeave ? 'bg-emerald-600' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    adjustShortLeave ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            {overtimeAdjMsg && (
              <div className={`text-[11px] font-semibold px-1 font-sans ${adjustShortLeave ? 'text-emerald-400' : 'text-slate-450'}`}>
                {overtimeAdjMsg}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sign In & Sign Out Times & Leave Hour (Conditional) */}
      {!isFullLeave && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">সাইন-ইন টাইম</label>
              <input
                type="time"
                required
                value={signInTime}
                onChange={(e) => setSignInTime(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">সাইন-আউট টাইম</label>
              <input
                type="time"
                required
                value={signOutTime}
                onChange={(e) => setSignOutTime(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {leaveType === 'Overtime' ? 'হিসাবকৃত ওভারটাইম আওয়ার (Overtime Hour)' : 'হিসাবকৃত ছুটির আওয়ার (Leave Hour)'}
            </label>
            <input
              type="text"
              required
              value={leaveHour}
              onChange={(e) => setLeaveHour(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-blue-400 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Children slots e.g. Supervisor selection fields */}
      {children}

      {/* Comment Box */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">মন্তব্য (Comment)</label>
        <textarea
          rows={2}
          placeholder="ছুটির সংক্ষিপ্ত বিবরণ লিখুন..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Bulk Adjustment Prompt Modal */}
      {showBulkAdjPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-955/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-sm p-6 relative overflow-hidden font-sans">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[80px] pointer-events-none" />
            
            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              ছুটি অ্যাডজাস্টমেন্ট নির্ধারণ করুন
            </h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              আপনি মোট {bulkDates.length + 1} দিনের ছুটি আবেদন করছেন। এর মধ্যে কতদিনের ছুটি <strong>{pendingCategory === 'None' ? 'Adjustment' : pendingCategory === 'Govt Holiday' ? 'Govt Holiday' : pendingCategory === 'Eid-ul-Fitr' ? 'Eid-ul-Fitr' : 'Eid-ul-Adha'}</strong> হিসেবে অ্যাডজাস্ট করতে চান?
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleConfirmBulkAdj(bulkDates.length + 1)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all border border-blue-700 shadow-md"
              >
                সব দিন অ্যাডজাস্ট করুন ({bulkDates.length + 1} দিন)
              </button>

              <div className="relative flex items-center gap-2 pt-2 border-t border-slate-800/80">
                <input
                  type="number"
                  min={1}
                  max={bulkDates.length + 1}
                  placeholder="নির্দিষ্ট দিনের সংখ্যা লিখুন"
                  value={customDaysInput}
                  onChange={(e) => setCustomDaysInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = parseInt(customDaysInput, 10);
                    if (!isNaN(val) && val >= 1 && val <= bulkDates.length + 1) {
                      handleConfirmBulkAdj(val);
                    }
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all"
                >
                  নির্ধারণ করুন
                </button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-850 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowBulkAdjPrompt(false);
                  setPendingCategory('');
                }}
                className="text-xs text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                বাতিল করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
