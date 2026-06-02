'use client';

import React from 'react';
import { Plus, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { DateInput } from '@/components/DateInput';
import { Profile } from '@/types';
import { ChutiRecord } from '@/utils/offlineSync';
import { calculateStats } from '@/utils/dashboardHelpers';

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
  bulkAdjustments: boolean[];
  handleAddBulkDate: () => void;
  handleUpdateBulkDate: (index: number, val: string) => void;
  handleUpdateBulkAdjustment: (index: number, val: boolean) => void;
  handleRemoveBulkDate: (index: number) => void;
  profile: Profile | null;
  submitting: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  records: ChutiRecord[];
  profilesList?: Profile[];
  selectedSupervisors?: string[];
  setSelectedSupervisors?: (supervisors: string[]) => void;
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
  bulkAdjustments,
  handleAddBulkDate,
  handleUpdateBulkDate,
  handleUpdateBulkAdjustment,
  handleRemoveBulkDate,
  profile,
  submitting,
  handleSubmit,
  records,
  profilesList = [],
  selectedSupervisors = [],
  setSelectedSupervisors = () => {},
}: AddLeaveModalProps) {
  if (!showAddLeaveModal) return null;

  // Real-time balance calculations
  const selectedYear = date ? date.substring(0, 4) : new Date().getFullYear().toString();
  const approvedRecords = records.filter(r => r.status === 'approved' && r.date && r.date.substring(0, 4) === selectedYear);
  const stats = calculateStats(approvedRecords);
  const supervisors = (profilesList || []).filter(p => p.role === 'supervisor');

  const parseHHMMToMinutes = (str: string) => {
    if (!str) return 0;
    const parts = str.replace('-', '').split(':').map(Number);
    if (parts.length >= 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  const currentShortLeaveMinutes = (leaveType === 'Short Leave' && !adjustment) ? parseHHMMToMinutes(leaveHour) : 0;
  const totalShortLeaveMins = approvedRecords
    .filter(r => r.leave_type === 'Short Leave' && !r.adjustment)
    .reduce((sum, r) => {
      if (!r.leave_hour) return sum;
      let mins = parseHHMMToMinutes(r.leave_hour.toString());
      if (r.adjusted_hour) {
        mins = Math.max(0, mins - parseHHMMToMinutes(r.adjusted_hour.toString()));
      }
      return sum + mins;
    }, 0);

  const fullLeavesToRequest = leaveType === 'Full Leave'
    ? ((adjustment ? 0 : 1) + bulkDates.filter((_, idx) => !bulkAdjustments[idx]).length)
    : 0;
  const isFullLeaveQuotaExceeded = leaveType === 'Full Leave' && (stats.fullLeaves + fullLeavesToRequest > (profile?.max_full_leaves ?? 15));
  const isShortLeaveQuotaExceeded = leaveType === 'Short Leave' && (totalShortLeaveMins + currentShortLeaveMinutes > (profile?.max_short_leaves ?? 15) * 60);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-955/80 backdrop-blur-md p-4">
      <div className="flex min-h-full items-center justify-center">
        <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-3xl p-6 relative overflow-hidden my-8">
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

          {/* Warning Banner */}
          {(isFullLeaveQuotaExceeded || isShortLeaveQuotaExceeded) && (
            <div className="p-3 bg-amber-955/50 border border-amber-900/50 text-amber-300 text-xs rounded-lg mb-4 flex items-start gap-2 animate-pulse">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-slate-200">ছুটির কোটা সীমা অতিক্রম করছে!</span>
                <span className="text-[11px] block mt-0.5 text-slate-300">
                  {isFullLeaveQuotaExceeded 
                    ? `আপনার বার্ষিক ফুল লিভ লিমিট হলো ${profile?.max_full_leaves ?? 15} দিন, কিন্তু আপনি ইতিমধ্যে ${stats.fullLeaves} দিন ভোগ করেছেন।`
                    : `আপনার বার্ষিক শর্ট লিভ লিমিট হলো ${profile?.max_short_leaves ?? 15} ঘণ্টা, কিন্তু আপনার মোট শর্ট লিভ ${((totalShortLeaveMins + currentShortLeaveMinutes) / 60).toFixed(1)} ঘণ্টা হয়ে যাচ্ছে।`}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <form onSubmit={handleSubmit} className="md:col-span-2 space-y-4 font-sans text-xs">
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
              <div className="space-y-2.5 p-3 bg-slate-955/40 rounded-lg border border-slate-850/80 max-h-48 overflow-y-auto">
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

            {/* Supervisor Selection (Conditional) */}
            {profile?.needs_supervisor_approval !== false && supervisors.length > 0 && (
              <div className="space-y-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider font-semibold">
                    সুপারভাইজার অনুমোদন (Supervisor Approval)
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {selectedSupervisors.length > 0 ? `${selectedSupervisors.length} জন নির্বাচিত` : 'সবাই নির্বাচিত'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-450">
                  ছুটির আবেদনটি অনুমোদন করার জন্য নির্দিষ্ট সুপারভাইজার সিলেক্ট করুন। কোনো সুপারভাইজার সিলেক্ট না করলে সবার কাছেই নোটিফিকেশন যাবে।
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <label className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all select-none ${
                    selectedSupervisors.length === 0 
                      ? 'border-blue-600 bg-blue-955/20 text-blue-400' 
                      : 'border-slate-800 bg-slate-900/60 text-slate-300'
                  }`}>
                    <input
                      type="checkbox"
                      checked={selectedSupervisors.length === 0}
                      onChange={() => setSelectedSupervisors([])}
                      className="rounded border-slate-700 bg-slate-955 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span className="text-xs font-semibold">সবাই (All)</span>
                  </label>
                  
                  {supervisors.map(sup => {
                    const isChecked = selectedSupervisors.includes(sup.id);
                    return (
                      <label 
                        key={sup.id} 
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all select-none ${
                          isChecked 
                            ? 'border-blue-600 bg-blue-955/20 text-blue-400' 
                            : 'border-slate-800 bg-slate-900/60 text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedSupervisors(selectedSupervisors.filter(id => id !== sup.id));
                            } else {
                              setSelectedSupervisors([...selectedSupervisors, sup.id]);
                            }
                          }}
                          className="rounded border-slate-700 bg-slate-955 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 h-3.5 w-3.5 cursor-pointer"
                        />
                        <span className="text-xs font-semibold">
                          {sup.username} {sup.full_name ? `(${sup.full_name})` : ''}
                        </span>
                      </label>
                    );
                  })}
                </div>
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

            {/* Right Column: Balance & Limit display */}
            <div className="bg-slate-955/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-4 font-sans text-xs shrink-0 self-start md:mt-0 mt-4">
              <h4 className="font-bold text-white border-b border-slate-850 pb-2 mb-1 text-[11px] uppercase tracking-wider">
                ছুটি ব্যবহারের বিবরণী ({selectedYear})
              </h4>
              
              <div className="space-y-3">
                {/* Full Leave Stat */}
                <div className="flex justify-between items-center bg-slate-900/30 p-2.5 rounded-lg border border-slate-850">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-semibold">ফুল লিভ ভোগকৃত</span>
                    <span className="text-white text-xs font-bold font-mono">{stats.fullLeaves} দিন</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[9px] uppercase font-semibold">সর্বোচ্চ লিমিট</span>
                    <span className="text-blue-400 text-xs font-bold font-mono">{profile?.max_full_leaves ?? 15} দিন</span>
                  </div>
                </div>

                {/* Short Leave Stat */}
                <div className="flex justify-between items-center bg-slate-900/30 p-2.5 rounded-lg border border-slate-850">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-semibold">শর্ট লিভ ভোগকৃত</span>
                    <span className="text-white text-xs font-bold font-mono">{stats.shortHours} ঘণ্টা</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[9px] uppercase font-semibold">সর্বোচ্চ লিমিট</span>
                    <span className="text-blue-400 text-xs font-bold font-mono">{profile?.max_short_leaves ?? 15} ঘণ্টা</span>
                  </div>
                </div>

                {/* Overtime Stat */}
                {profile?.allow_overtime && (
                  <div className="flex justify-between items-center bg-slate-900/30 p-2.5 rounded-lg border border-slate-850">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-semibold">সর্বমোট ওভারটাইম</span>
                      <span className="text-white text-xs font-bold font-mono">{stats.overtimeHours} ঘণ্টা</span>
                    </div>
                  </div>
                )}

                {/* Reserve Holiday Stat */}
                {profile?.allow_reserve && (
                  <div className="flex justify-between items-center bg-slate-900/30 p-2.5 rounded-lg border border-slate-850">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-semibold">রিজার্ভ ছুটি</span>
                      <span className="text-white text-xs font-bold font-mono">{stats.reserveLeaves} দিন</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
