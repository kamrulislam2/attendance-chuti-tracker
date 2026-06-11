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

import { Modal } from '../Modal';

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

  const isFullLeave = leaveType === 'Full Leave';

  const handleAddBulkDate = () => {
    if (bulkDates.length + 1 >= 10) {
      setError('You can enter up to 10 days of leaves at once!');
      return;
    }
    setError(null);
    setBulkDates(prev => [...prev, '']);
    setBulkAdjustments(prev => [...prev, false]);
  };

  const handleUpdateBulkDate = (index: number, val: string) => {
    if (val === date || bulkDates.some((d, idx) => idx !== index && d === val)) {
      setError('This date has already been selected!');
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
      setError('Please select at least one date!');
      setSubmitting(false);
      return;
    }

    try {
      // Direct Admin bulk insertion (bypasses regular user submission logic)
      const adjustedArr = datesWithAdjustment.map(item => item.adjustment);
      
      const { data: newChutiRecords, error: bulkInsertError } = await supabase.rpc(
        'admin_insert_chuti_records_bulk',
        {
          p_user_id: staffProfile.id,
          p_dates: allDates,
          p_leave_type: leaveType,
          p_adjustments: adjustedArr,
          p_adjust_short_leave: adjustShortLeave,
          p_sign_in_time: leaveType === 'Full Leave' ? null : signInTime,
          p_sign_out_time: leaveType === 'Full Leave' ? null : signOutTime,
          p_leave_hour: leaveType === 'Full Leave' ? null : leaveHour,
          p_comment: comment || null,
          p_reserve_holiday: adjustmentCategory !== 'None' ? adjustmentCategory : null,
          p_bulk_id: generateUUID()
        }
      );

      if (bulkInsertError) throw bulkInsertError;

      // Trigger push notification to user
      sendPushNotification({
        userIds: [staffProfile.id],
        title: 'New Leave Entry Completed 📝',
        body: `Admin has completed a ${leaveType} leave entry for you on ${formatDate(date)}.`,
        url: '/'
      }).catch(err => console.error('Error sending push notification for admin added leave:', err));

      onSuccess();
      setShowModal(false);
    } catch (err) {
      setError((err as Error).message || 'An error occurred while submitting the leave.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={showModal && staffProfile !== null}
      onClose={() => setShowModal(false)}
      title={`Add Leave (${staffProfile ? (staffProfile.full_name || staffProfile.username) : ''})`}
      icon={<Calendar className="h-5 w-5 text-orange-500" />}
      maxWidthClass="max-w-4xl"
    >
      {staffProfile && (
        <>
          {error && (
            <div className="p-3 bg-red-955/50 border border-red-900/50 text-red-300 text-xs rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Warning Banner */}
          {isFullLeaveQuotaExceeded && (
            <div className="p-3 bg-amber-955/50 border border-amber-900/50 text-amber-300 text-xs rounded-lg mb-4 flex items-start gap-2 animate-pulse">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-slate-200">Leave Quota Limit Exceeded!</span>
                <span className="text-[11px] block mt-0.5 text-slate-305">
                  Staff's annual full leave limit is {staffProfile?.max_full_leaves ?? 15} days, but they have already taken {stats.fullLeaves} days.
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
                  className="flex-1 flex justify-center py-2 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-355 bg-slate-955 hover:bg-slate-900 cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                >
                  {submitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  {submitting ? 'Adding...' : 'Add Leave'}
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
        </>
      )}
    </Modal>
  );
}
