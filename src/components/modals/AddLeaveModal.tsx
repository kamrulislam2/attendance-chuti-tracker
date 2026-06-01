'use client';

import React from 'react';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { DateInput } from '@/components/DateInput';
import { Profile } from '@/types';

interface AddLeaveModalProps {
  showAddLeaveModal: boolean;
  setShowAddLeaveModal: (val: boolean) => void;
  date: string;
  setDate: (val: string) => void;
  leaveType: string;
  setLeaveType: (val: string) => void;
  adjustment: boolean;
  setAdjustment: (val: boolean) => void;
  adjustShortLeave: boolean;
  setAdjustShortLeave: (val: boolean) => void;
  signInTime: string;
  setSignInTime: (val: string) => void;
  signOutTime: string;
  setSignOutTime: (val: string) => void;
  leaveHour: string;
  setLeaveHour: (val: string) => void;
  reserveHoliday: string;
  setReserveHoliday: (val: string) => void;
  comment: string;
  setComment: (val: string) => void;
  bulkDates: string[];
  handleAddBulkDate: () => void;
  handleUpdateBulkDate: (index: number, val: string) => void;
  handleRemoveBulkDate: (index: number) => void;
  profile: Profile | null;
  submitting: boolean;
  handleSubmit: (e: React.FormEvent) => void;
}

export function AddLeaveModal({
  showAddLeaveModal,
  setShowAddLeaveModal,
  date,
  setDate,
  leaveType,
  setLeaveType,
  adjustment,
  setAdjustment,
  adjustShortLeave,
  setAdjustShortLeave,
  signInTime,
  setSignInTime,
  signOutTime,
  setSignOutTime,
  leaveHour,
  setLeaveHour,
  reserveHoliday,
  setReserveHoliday,
  comment,
  setComment,
  bulkDates,
  handleAddBulkDate,
  handleUpdateBulkDate,
  handleRemoveBulkDate,
  profile,
  submitting,
  handleSubmit,
}: AddLeaveModalProps) {
  if (!showAddLeaveModal) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-955/80 backdrop-blur-md p-4">
      <div className="flex min-h-full items-center justify-center">
        <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-lg p-6 relative overflow-hidden my-8">
          <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[80px] pointer-events-none" />
          
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 mb-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-500" /> নতুন ছুটির এন্ট্রি দিন
            </h3>
            <button 
              onClick={() => setShowAddLeaveModal(false)}
              className="text-slate-450 hover:text-white text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 font-sans">
            {/* Date & Leave Type side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider font-semibold">তারিখ (Date)</label>
                <div className="flex gap-2 items-center mt-1">
                  <DateInput
                    required
                    value={date}
                    onChange={(val) => setDate(val)}
                    className="bg-slate-955"
                  />
                  {leaveType === 'Full Leave' && (
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
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider font-semibold">ছুটির ধরন (Leave Type)</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Short Leave">Short Leave</option>
                  <option value="Full Leave">Full Leave</option>
                  {profile?.allow_overtime && <option value="Overtime">Overtime</option>}
                  {profile?.allow_reserve && <option value="Reserve">Reserve</option>}
                </select>
              </div>
            </div>

            {/* Bulk Dates Input List */}
            {leaveType === 'Full Leave' && bulkDates.length > 0 && (
              <div className="space-y-2.5 p-3 bg-slate-950/40 rounded-lg border border-slate-800/80 max-h-48 overflow-y-auto">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">অতিরিক্ত ছুটির তারিখসমূহ ({bulkDates.length} দিন)</label>
                <div className="grid grid-cols-1 gap-2">
                  {bulkDates.map((bulkDate, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <span className="text-[10px] text-slate-500 font-mono w-4">{index + 2}.</span>
                      <div className="flex-1">
                        <DateInput
                          required
                          value={bulkDate}
                          onChange={(val) => handleUpdateBulkDate(index, val)}
                          className="bg-slate-955 py-1.5"
                        />
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
                  ))}
                </div>
              </div>
            )}

            {/* Adjustment Switch & Overtime Switch */}
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <div>
                  <span className="block text-xs font-medium text-white font-semibold">
                    {leaveType === 'Reserve' ? 'Adjustment Request?' : 'Adjustment?'}
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    {leaveType === 'Reserve' 
                      ? 'অ্যাডমিন অনুমোদন করলে মোট ছুটিতে অ্যাডজাস্ট হবে' 
                      : 'Yes দিলে মোট ছুটিতে যোগ হবে না'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newAdj = !adjustment;
                    setAdjustment(newAdj);
                    if (!newAdj) {
                      setAdjustShortLeave(false);
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    adjustment ? 'bg-blue-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      adjustment ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {leaveType === 'Overtime' && adjustment && (
                <div className="flex items-center justify-between p-3 bg-slate-955/60 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="block text-xs font-medium text-white font-semibold">Adjust with Short Leave?</span>
                    <span className="block text-[10px] text-slate-400">Yes দিলে শর্ট লিভ থেকে বিয়োগ হবে</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdjustShortLeave(!adjustShortLeave)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      adjustShortLeave ? 'bg-emerald-600' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        adjustShortLeave ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )}

              {leaveType === 'Reserve' && adjustment && (
                <div className="flex items-center justify-between p-3 bg-slate-955/60 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="block text-xs font-medium text-white font-semibold">Adjust with Full Leave?</span>
                    <span className="block text-[10px] text-slate-400">Yes দিলে ফুল লিভ থেকে বিয়োগ হবে</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdjustShortLeave(!adjustShortLeave)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      adjustShortLeave ? 'bg-emerald-600' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        adjustShortLeave ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>

            {/* Sign In & Sign Out Times & Leave Hour (Conditional) */}
            {leaveType !== 'Reserve' && leaveType !== 'Full Leave' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider font-semibold">সাইন-ইন টাইম</label>
                    <input
                      type="time"
                      required
                      value={signInTime}
                      onChange={(e) => setSignInTime(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider font-semibold">সাইন-আউট টাইম</label>
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
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider font-semibold">হিসাবকৃত ছুটির আওয়ার (Leave Hour)</label>
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

            {/* Reserve Holiday (Conditional) */}
            {leaveType === 'Reserve' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider font-semibold">রিজার্ভ ছুটির দিন</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: শবে বরাত"
                  value={reserveHoliday}
                  onChange={(e) => setReserveHoliday(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Comment Box */}
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider font-semibold">মন্তব্য (Comment)</label>
              <textarea
                rows={2}
                placeholder="ছুটির সংক্ষিপ্ত বিবরণ লিখুন..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddLeaveModal(false)}
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
                {submitting ? 'সাবমিট হচ্ছে...' : 'সাবমিট করুন'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
