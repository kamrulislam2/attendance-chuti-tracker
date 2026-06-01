'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, Calendar } from 'lucide-react';
import { DateInput } from '@/components/DateInput';
import { Profile } from '@/types';
import { supabase } from '@/utils/supabase';
import { calculateLeaveOrOvertime, formatDate } from '@/utils/dashboardHelpers';

interface AdminAddLeaveModalProps {
  showModal: boolean;
  setShowModal: (val: boolean) => void;
  staffProfile: Profile | null;
  onSuccess: () => void;
}

export function AdminAddLeaveModal({
  showModal,
  setShowModal,
  staffProfile,
  onSuccess,
}: AdminAddLeaveModalProps) {
  const [date, setDate] = useState('');
  const [leaveType, setLeaveType] = useState('Short Leave');
  const [adjustment, setAdjustment] = useState(false);
  const [adjustShortLeave, setAdjustShortLeave] = useState(false);
  const [signInTime, setSignInTime] = useState('13:00');
  const [signOutTime, setSignOutTime] = useState('22:30');
  const [leaveHour, setLeaveHour] = useState('00:00');
  const [reserveHoliday, setReserveHoliday] = useState('');
  const [comment, setComment] = useState('');
  const [bulkDates, setBulkDates] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize today's date and default times when modal is opened
  useEffect(() => {
    if (showModal && staffProfile) {
      const today = new Date();
      const localDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
      setDate(localDate);
      
      setSignInTime(staffProfile.default_sign_in || '13:00');
      setSignOutTime(staffProfile.default_sign_out || '22:30');
      setLeaveType('Short Leave');
      setAdjustment(false);
      setAdjustShortLeave(false);
      setReserveHoliday('');
      setComment('');
      setBulkDates([]);
      setError(null);
    }
  }, [showModal, staffProfile]);

  // Recalculate leave hour when inputs change
  useEffect(() => {
    if (!staffProfile) return;
    const shiftStart = staffProfile.default_sign_in || '13:00';
    const shiftEnd = staffProfile.default_sign_out || '22:30';
    const calc = calculateLeaveOrOvertime(leaveType, signInTime, signOutTime, shiftStart, shiftEnd);
    setLeaveHour(calc);
  }, [signInTime, signOutTime, leaveType, staffProfile]);

  if (!showModal || !staffProfile) return null;

  const isFullLeave = leaveType === 'Full Leave';
  const isReserve = leaveType === 'Reserve';

  const handleAddBulkDate = () => {
    if (bulkDates.length + 1 >= 10) {
      alert('সর্বোচ্চ ১০ দিন পর্যন্ত ছুটি একসাথে এন্ট্রি করতে পারবেন!');
      return;
    }
    setBulkDates(prev => [...prev, '']);
  };

  const handleUpdateBulkDate = (index: number, val: string) => {
    if (val === date || bulkDates.some((d, idx) => idx !== index && d === val)) {
      alert('এই তারিখটি ইতিমধ্যে নির্বাচন করা হয়েছে!');
      return;
    }
    setBulkDates(prev => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  const handleRemoveBulkDate = (index: number) => {
    setBulkDates(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffProfile) return;
    setSubmitting(true);
    setError(null);

    const allDates = isFullLeave 
      ? [date, ...bulkDates].filter(d => d)
      : [date];

    if (allDates.length === 0) {
      setError('অন্তত একটি তারিখ নির্বাচন করুন!');
      setSubmitting(false);
      return;
    }

    const bulkId = allDates.length > 1 ? (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    })) : null;

    try {
      // 1. Check for duplicates in database
      const { data: existing, error: checkError } = await supabase
        .from('chuti')
        .select('date')
        .eq('user_id', staffProfile.id)
        .in('date', allDates);

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        const dupStrings = existing.map((e) => formatDate(e.date)).join(', ');
        setError(`এই তারিখগুলোতে অলরেডি ডাটা সাবমিট করা হয়েছে: ${dupStrings}`);
        setSubmitting(false);
        return;
      }

      // 2. Try using the RPC first (runs with SECURITY DEFINER to bypass RLS policies if database is updated)
      const { error: rpcError } = await supabase.rpc('admin_insert_chuti_records_bulk', {
        p_user_id: staffProfile.id,
        p_dates: allDates,
        p_leave_type: leaveType,
        p_adjustment: isReserve ? false : adjustment,
        p_adjust_short_leave: (leaveType === 'Overtime' || leaveType === 'Reserve') && adjustment ? adjustShortLeave : false,
        p_sign_in_time: (isReserve || isFullLeave) ? null : signInTime,
        p_sign_out_time: (isReserve || isFullLeave) ? null : signOutTime,
        p_leave_hour: (isReserve || isFullLeave) ? null : `${leaveHour}:00`,
        p_reserve_holiday: isReserve ? reserveHoliday : null,
        p_comment: comment.trim() ? `${comment.trim()} (অ্যাডমিন দ্বারা যুক্ত)` : '(অ্যাডমিন দ্বারা যুক্ত)',
        p_bulk_id: bulkId
      });

      if (rpcError) {
        console.warn('RPC admin_insert_chuti_records_bulk failed, falling back to direct insert:', rpcError);
        
        // 3. Fallback to direct client-side insert
        const recordsToInsert = allDates.map(d => ({
          user_id: staffProfile.id,
          date: d,
          leave_type: leaveType,
          adjustment: isReserve ? false : adjustment,
          adjust_short_leave: (leaveType === 'Overtime' || leaveType === 'Reserve') && adjustment ? adjustShortLeave : false,
          sign_in_time: (isReserve || isFullLeave) ? null : signInTime,
          sign_out_time: (isReserve || isFullLeave) ? null : signOutTime,
          leave_hour: (isReserve || isFullLeave) ? null : `${leaveHour}:00`,
          reserve_holiday: isReserve ? reserveHoliday : null,
          reserve_adjustment_status: isReserve ? (adjustment ? 'approved' : 'none') : 'none',
          status: 'approved',
          comment: comment.trim() ? `${comment.trim()} (অ্যাডমিন দ্বারা যুক্ত)` : '(অ্যাডমিন দ্বারা যুক্ত)',
          bulk_id: bulkId
        }));
        
        const { error: insertError } = await supabase.from('chuti').insert(recordsToInsert);
        if (insertError) throw insertError;
      }

      onSuccess();
      setShowModal(false);
    } catch (err) {
      setError((err as Error).message || 'ছুটি সাবমিট করার সময় একটি ত্রুটি ঘটেছে।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-955/80 backdrop-blur-md p-4">
      <div className="flex min-h-full items-center justify-center">
        <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-lg p-6 relative overflow-hidden my-8">
          <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[80px] pointer-events-none" />
          
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 mb-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" /> ছুটি যুক্ত করুন ({staffProfile.full_name || staffProfile.username})
            </h3>
            <button 
              onClick={() => setShowModal(false)}
              className="text-slate-450 hover:text-white text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-950/50 border border-red-900/50 text-red-300 text-xs rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
            {/* Date & Leave Type side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 uppercase tracking-wider font-semibold">তারিখ (Date)</label>
                <div className="flex gap-2 items-center mt-1">
                  <DateInput
                    required
                    value={date}
                    onChange={(val) => setDate(val)}
                    className="bg-slate-955 text-xs py-2"
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
                <label className="block text-slate-400 uppercase tracking-wider font-semibold">ছুটির ধরন (Leave Type)</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Short Leave">Short Leave</option>
                  <option value="Full Leave">Full Leave</option>
                  {staffProfile.allow_overtime && <option value="Overtime">Overtime</option>}
                  {staffProfile.allow_reserve && <option value="Reserve">Reserve</option>}
                </select>
              </div>
            </div>

            {/* Bulk Dates Input List */}
            {leaveType === 'Full Leave' && bulkDates.length > 0 && (
              <div className="space-y-2.5 p-3 bg-slate-950/40 rounded-lg border border-slate-800/80 max-h-48 overflow-y-auto">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">অতিরিক্ত ছুটির তারিখসমূহ ({bulkDates.length} দিন)</label>
                <div className="grid grid-cols-1 gap-2">
                  {bulkDates.map((bulkDate, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <span className="text-[10px] text-slate-500 font-mono w-4">{index + 2}.</span>
                      <div className="flex-1">
                        <DateInput
                          required
                          value={bulkDate}
                          onChange={(val) => handleUpdateBulkDate(index, val)}
                          className="bg-slate-955 py-1.5 text-xs"
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
              <div className="flex items-center justify-between p-3 bg-slate-955/60 rounded-lg border border-slate-800/80">
                <div>
                  <span className="block text-slate-200 font-semibold">
                    {leaveType === 'Reserve' ? 'Adjustment Request?' : 'Adjustment?'}
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    {leaveType === 'Reserve' 
                      ? 'মোট ছুটি থেকে সমন্বয় করা হবে' 
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

              {leaveType === 'Overtime' && adjustment && (
                <div className="flex items-center justify-between p-3 bg-slate-955/60 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="block text-slate-200 font-semibold">Adjust with Short Leave?</span>
                    <span className="block text-[10px] text-slate-400">Yes দিলে শর্ট লিভ থেকে বিয়োগ হবে</span>
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
              )}

              {leaveType === 'Reserve' && adjustment && (
                <div className="flex items-center justify-between p-3 bg-slate-955/60 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="block text-slate-200 font-semibold">Adjust with Full Leave?</span>
                    <span className="block text-[10px] text-slate-400">Yes দিলে ফুল লিভ থেকে বিয়োগ হবে</span>
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
              )}
            </div>

            {/* Sign In & Sign Out Times & Leave Hour (Conditional) */}
            {leaveType !== 'Reserve' && leaveType !== 'Full Leave' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider font-semibold">সাইন-ইন টাইম</label>
                    <input
                      type="time"
                      required
                      value={signInTime}
                      onChange={(e) => setSignInTime(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider font-semibold">সাইন-আউট টাইম</label>
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
                  <label className="block text-slate-400 uppercase tracking-wider font-semibold">হিসাবকৃত ছুটির আওয়ার (Leave Hour)</label>
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
                <label className="block text-slate-400 uppercase tracking-wider font-semibold">রিজার্ভ ছুটির দিন</label>
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
              <label className="block text-slate-400 uppercase tracking-wider font-semibold">মন্তব্য (Comment)</label>
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
                {submitting ? 'যুক্ত হচ্ছে...' : 'যুক্ত করুন'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
