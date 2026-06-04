'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Calendar, AlertTriangle } from 'lucide-react';
import { Profile } from '@/types';
import { AddLeaveFormFields } from '@/components/AddLeaveFormFields';
import { supabase } from '@/utils/supabase';
import { calculateLeaveOrOvertime, formatDate, calculateStats, GlobalSettings, calculateHalfYearlyOfficeLeave, checkIfHolidayOrWeekend } from '@/utils/dashboardHelpers';
import { ChutiRecord, generateUUID } from '@/utils/offlineSync';
import { sendPushNotification } from '@/utils/webPushHelper';
import { LeaveUsageSummary } from '@/components/LeaveUsageSummary';

interface AdminAddLeaveModalProps {
  showModal: boolean;
  setShowModal: (val: boolean) => void;
  staffProfile: Profile | null;
  onSuccess: () => void;
  records: ChutiRecord[];
  globalSettings: GlobalSettings;
}

export function AdminAddLeaveModal({
  showModal,
  setShowModal,
  staffProfile,
  onSuccess,
  records,
  globalSettings,
}: AdminAddLeaveModalProps) {
  const [date, setDate] = useState('');
  const [leaveType, setLeaveType] = useState('Short Leave');
  const [adjustment, setAdjustment] = useState(false);
  const [adjustmentCategory, setAdjustmentCategory] = useState('None');
  const [adjustShortLeave, setAdjustShortLeave] = useState(false);
  const [signInTime, setSignInTime] = useState('13:00');
  const [signOutTime, setSignOutTime] = useState('22:30');
  const [leaveHour, setLeaveHour] = useState('00:00');
  const [comment, setComment] = useState('');
  const [bulkDates, setBulkDates] = useState<string[]>([]);
  const [bulkAdjustments, setBulkAdjustments] = useState<boolean[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userResponses, setUserResponses] = useState<any[]>([]);

  // Fetch responses when staffProfile changes
  useEffect(() => {
    if (showModal && staffProfile) {
      const fetchUserResponses = async () => {
        const { data } = await supabase
          .from('govt_holiday_responses')
          .select('*')
          .eq('user_id', staffProfile.id);
        if (data) {
          setUserResponses(data);
        }
      };
      fetchUserResponses();
    } else {
      setUserResponses([]);
    }
  }, [showModal, staffProfile]);

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
      setAdjustmentCategory('None');
      setAdjustShortLeave(false);
      setComment('');
      setBulkDates([]);
      setBulkAdjustments([]);
      setError(null);
    }
  }, [showModal, staffProfile]);

  // Recalculate leave hour when inputs change
  useEffect(() => {
    if (!staffProfile) return;
    const shiftStart = staffProfile.default_sign_in || '13:00';
    const shiftEnd = staffProfile.default_sign_out || '22:30';
    const workingHours = staffProfile.working_hours ?? 9.5;
    const isHoliday = checkIfHolidayOrWeekend(date, globalSettings);
    const calc = calculateLeaveOrOvertime(leaveType, signInTime, signOutTime, shiftStart, shiftEnd, workingHours, isHoliday);
    setLeaveHour(calc);
  }, [signInTime, signOutTime, leaveType, date, staffProfile, globalSettings]);

  // Real-time balance calculations
  const selectedYear = date ? date.substring(0, 4) : new Date().getFullYear().toString();
  const approvedRecords = records.filter(r => r.status === 'approved' && r.date && r.date.substring(0, 4) === selectedYear);
  const stats = calculateStats(approvedRecords);

  const parseHHMMToMinutes = (str: string) => {
    if (!str) return 0;
    const parts = str.replace('-', '').split(':').map(Number);
    if (parts.length >= 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  const isOfficeLeaveEligible = staffProfile?.eligible_office_leave !== false;
  const officeLeaveTotalBase = isOfficeLeaveEligible ? (globalSettings.office_leave_default ?? 14) : 0;

  const reservedCount = userResponses.filter((r: any) => r.response === 'reserve').length;
  const govtHolidayTotal = reservedCount;
  const govtHolidayRemaining = Math.max(0, reservedCount - (stats.govtHolidaysTaken ?? 0));

  const convertedDays = staffProfile?.converted_short_leaves_days ?? 0;

  const totalAllowed = officeLeaveTotalBase + reservedCount;
  const totalTaken = (stats.officeLeavesTaken ?? 0)
    + (stats.eidFitrTaken ?? 0)
    + (stats.eidAdhaTaken ?? 0)
    + (stats.fullLeaves ?? 0)
    + (stats.govtHolidaysTaken ?? 0)
    + convertedDays;

  const officeLeaveTotal = totalAllowed;
  const officeLeaveRemaining = totalAllowed - totalTaken; // Can go negative

  const eidFitrTotal = globalSettings.eid_fitr_leave ?? 0;
  const eidFitrRemaining = Math.max(0, eidFitrTotal - (stats.eidFitrTaken ?? 0));

  const eidAdhaTotal = globalSettings.eid_adha_leave ?? 0;
  const eidAdhaRemaining = Math.max(0, eidAdhaTotal - (stats.eidAdhaTaken ?? 0));

  const isFullLeaveQuotaExceeded = false;

  const halfYearlyStats = React.useMemo(() => {
    return calculateHalfYearlyOfficeLeave(
      records,
      globalSettings.office_leave_default ?? 14,
      selectedYear
    );
  }, [records, globalSettings.office_leave_default, selectedYear]);

  if (!showModal || !staffProfile) return null;

  const isFullLeave = leaveType === 'Full Leave';

  const handleAddBulkDate = () => {
    if (bulkDates.length + 1 >= 10) {
      setError('সর্বোচ্চ ১০ দিন পর্যন্ত ছুটি একসাথে এন্ট্রি করতে পারবেন!');
      return;
    }
    setError(null);
    setBulkDates(prev => [...prev, '']);
    setBulkAdjustments(prev => [...prev, false]);
  };

  const handleUpdateBulkDate = (index: number, val: string) => {
    if (val === date || bulkDates.some((d, idx) => idx !== index && d === val)) {
      setError('এই তারিখটি ইতিমধ্যে নির্বাচন করা হয়েছে!');
      return;
    }
    setError(null);
    setBulkDates(prev => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  const handleUpdateBulkAdjustment = (index: number, val: boolean) => {
    setBulkAdjustments(prev => prev.map((adj, idx) => idx === index ? val : adj));
  };

  const handleRemoveBulkDate = (index: number) => {
    setBulkDates(prev => prev.filter((_, idx) => idx !== index));
    setBulkAdjustments(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffProfile) return;
    setSubmitting(true);
    setError(null);

    const datesWithAdjustment = isFullLeave
      ? [
        { date, adjustment: adjustmentCategory !== 'None' },
        ...bulkDates.map((d, idx) => ({ date: d, adjustment: bulkAdjustments[idx] || false }))
      ].filter(item => item.date)
      : [{ date, adjustment: false }];

    const allDates = datesWithAdjustment.map(item => item.date);

    if (allDates.length === 0) {
      setError('অন্তত একটি তারিখ নির্বাচন করুন!');
      setSubmitting(false);
      return;
    }

    const bulkId = allDates.length > 1 ? generateUUID() : null;

    const availableOvertimeMins = parseHHMMToMinutes(stats.overtimeHours);
    const availableShortLeaveMins = parseHHMMToMinutes(stats.shortHours);
    const leaveMins = parseHHMMToMinutes(leaveHour);

    let finalAdjustment = false;
    let finalAdjustedHour: string | null = null;
    let finalAdjustShortLeave = false;

    if (leaveType === 'Full Leave') {
      finalAdjustment = adjustmentCategory !== 'None';
      finalAdjustedHour = null;
      finalAdjustShortLeave = false;
    } else if (leaveType === 'Short Leave') {
      if (adjustment && availableOvertimeMins > 0) {
        if (leaveMins <= availableOvertimeMins) {
          finalAdjustment = true;
          finalAdjustedHour = null;
        } else {
          finalAdjustment = false;
          const otHours = Math.floor(availableOvertimeMins / 60);
          const otMins = availableOvertimeMins % 60;
          finalAdjustedHour = `${String(otHours).padStart(2, '0')}:${String(otMins).padStart(2, '0')}:00`;
        }
      } else {
        finalAdjustment = false;
        finalAdjustedHour = null;
      }
      finalAdjustShortLeave = false;
    } else if (leaveType === 'Overtime') {
      if (adjustShortLeave && availableShortLeaveMins > 0) {
        finalAdjustShortLeave = true;
        if (leaveMins <= availableShortLeaveMins) {
          finalAdjustment = true;
          finalAdjustedHour = null;
        } else {
          finalAdjustment = false;
          const slHours = Math.floor(availableShortLeaveMins / 60);
          const slMins = availableShortLeaveMins % 60;
          finalAdjustedHour = `${String(slHours).padStart(2, '0')}:${String(slMins).padStart(2, '0')}:00`;
        }
      } else {
        finalAdjustment = false;
        finalAdjustedHour = null;
        finalAdjustShortLeave = false;
      }
    }

    let commentWithCategory = comment;
    if (leaveType === 'Full Leave') {
      commentWithCategory = adjustmentCategory !== 'None'
        ? `Adjusted: ${adjustmentCategory} | ${comment}`
        : comment;
    } else if (leaveType === 'Short Leave' && finalAdjustment) {
      commentWithCategory = `Adjusted with Overtime | ${comment}`;
    } else if (leaveType === 'Short Leave' && finalAdjustedHour) {
      commentWithCategory = `Partially Adjusted with Overtime (${finalAdjustedHour.substring(0, 5)}) | ${comment}`;
    } else if (leaveType === 'Overtime' && finalAdjustment) {
      commentWithCategory = `Adjusted with Short Leave | ${comment}`;
    } else if (leaveType === 'Overtime' && finalAdjustedHour) {
      commentWithCategory = `Partially Adjusted with Short Leave (${finalAdjustedHour.substring(0, 5)}) | ${comment}`;
    }
    const finalComment = commentWithCategory.trim() ? `${commentWithCategory.trim()} (Admin added)` : '(Admin added)';

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

      if (isFullLeave) {
        // 2. Try using the RPC first for Full Leave
        const { error: rpcError } = await supabase.rpc('admin_insert_chuti_records_bulk', {
          p_user_id: staffProfile.id,
          p_dates: allDates,
          p_leave_type: leaveType,
          p_adjustments: datesWithAdjustment.map(item => item.adjustment),
          p_adjust_short_leave: false,
          p_sign_in_time: null,
          p_sign_out_time: null,
          p_leave_hour: null,
          p_reserve_holiday: null,
          p_comment: finalComment,
          p_bulk_id: bulkId
        });

        if (rpcError) {
          console.warn('RPC admin_insert_chuti_records_bulk failed, falling back to direct insert:', rpcError);

          // 3. Fallback to direct client-side insert
          const recordsToInsert = datesWithAdjustment.map(item => {
            let itemComment = comment;
            if (item.adjustment && adjustmentCategory !== 'None') {
              itemComment = `Adjusted: ${adjustmentCategory} | ${comment}`;
            }
            const finalItemComment = itemComment.trim() ? `${itemComment.trim()} (Admin added)` : '(Admin added)';
            return {
              user_id: staffProfile.id,
              date: item.date,
              leave_type: leaveType,
              adjustment: item.adjustment,
              adjust_short_leave: false,
              sign_in_time: null,
              sign_out_time: null,
              leave_hour: null,
              reserve_holiday: null,
              reserve_adjustment_status: 'none',
              status: 'approved',
              comment: finalItemComment,
              bulk_id: bulkId
            };
          });

          const { error: insertError } = await supabase.from('chuti').insert(recordsToInsert);
          if (insertError) throw insertError;
        }
      } else {
        // Direct insert for Short Leave and Overtime to fully support partial/full adjustments
        const recordsToInsert = [{
          user_id: staffProfile.id,
          date: date,
          leave_type: leaveType,
          adjustment: finalAdjustment,
          adjusted_hour: finalAdjustedHour,
          adjust_short_leave: finalAdjustShortLeave,
          sign_in_time: signInTime,
          sign_out_time: signOutTime,
          leave_hour: `${leaveHour}:00`,
          reserve_holiday: null,
          reserve_adjustment_status: 'none',
          status: 'approved',
          comment: finalComment,
          bulk_id: null
        }];

        const { error: insertError } = await supabase.from('chuti').insert(recordsToInsert);
        if (insertError) throw insertError;
      }

      // Trigger push notification to user
      sendPushNotification({
        userIds: [staffProfile.id],
        title: 'নতুন ছুটির এন্ট্রি সম্পন্ন 📝',
        body: `অ্যাডমিন আপনার জন্য ${formatDate(date)} এ ${leaveType} ছুটি এন্ট্রি সম্পন্ন করেছেন।`,
        url: '/'
      }).catch(err => console.error('Error sending push notification for admin added leave:', err));

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
        <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-4xl p-6 md:p-8 relative overflow-hidden my-8">
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

          {/* Warning Banner */}
          {isFullLeaveQuotaExceeded && (
            <div className="p-3 bg-amber-955/50 border border-amber-900/50 text-amber-300 text-xs rounded-lg mb-4 flex items-start gap-2 animate-pulse">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-slate-200">ছুটির কোটা সীমা অতিক্রম করছে!</span>
                <span className="text-[11px] block mt-0.5 text-slate-300">
                  স্টাফের বার্ষিক ফুল লিভ লিমিট হলো {staffProfile?.max_full_leaves ?? 15} দিন, কিন্তু সে ইতিমধ্যে ${stats.fullLeaves} দিন ভোগ করেছেন।
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <form onSubmit={handleSubmit} className="md:col-span-2 space-y-4 font-sans text-xs">
              <AddLeaveFormFields
                date={date}
                setDate={setDate}
                leaveType={leaveType}
                setLeaveType={setLeaveType}
                adjustmentCategory={adjustmentCategory}
                setAdjustmentCategory={setAdjustmentCategory}
                setAdjustment={setAdjustment}
                adjustShortLeave={adjustShortLeave}
                setAdjustShortLeave={setAdjustShortLeave}
                signInTime={signInTime}
                setSignInTime={setSignInTime}
                signOutTime={signOutTime}
                setSignOutTime={setSignOutTime}
                leaveHour={leaveHour}
                setLeaveHour={setLeaveHour}
                comment={comment}
                setComment={setComment}
                bulkDates={bulkDates}
                bulkAdjustments={bulkAdjustments}
                handleAddBulkDate={handleAddBulkDate}
                handleUpdateBulkDate={handleUpdateBulkDate}
                handleUpdateBulkAdjustment={handleUpdateBulkAdjustment}
                handleRemoveBulkDate={handleRemoveBulkDate}
                allowOvertime={staffProfile.allow_overtime || false}
                adjustment={adjustment}
                availableOvertimeMins={parseHHMMToMinutes(stats.overtimeHours)}
                availableShortLeaveMins={parseHHMMToMinutes(stats.shortHours)}
                records={records}
                govtHolidayRemaining={govtHolidayRemaining}
                eidFitrRemaining={eidFitrRemaining}
                eidAdhaRemaining={eidAdhaRemaining}
                eligibleOfficeLeave={isOfficeLeaveEligible}
                isAdmin={true}
              />

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

            {/* Right Column: Balance & Limit display */}
            <LeaveUsageSummary
              selectedYear={selectedYear}
              officeLeaveRemaining={officeLeaveRemaining}
              officeLeaveTotal={officeLeaveTotal}
              govtHolidayRemaining={govtHolidayRemaining}
              govtHolidayTotal={govtHolidayTotal}
              eidFitrRemaining={eidFitrRemaining}
              eidFitrTotal={eidFitrTotal}
              eidAdhaRemaining={eidAdhaRemaining}
              eidAdhaTotal={eidAdhaTotal}
              fullLeaves={stats.fullLeaves}
              shortHours={stats.shortHours}
              overtimeHours={stats.overtimeHours}
              allowOvertime={staffProfile?.allow_overtime}
              eligibleOfficeLeave={staffProfile?.eligible_office_leave !== false}
              eligibleGovtHoliday={staffProfile?.eligible_govt_holiday !== false}
              halfYearlyStats={halfYearlyStats}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
