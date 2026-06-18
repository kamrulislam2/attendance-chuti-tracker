'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, RotateCcw, Sparkles, CheckCircle2, DollarSign, ArrowRightLeft, FolderPlus, ShieldAlert } from 'lucide-react';
import { Profile, LeaveSettlement, GovtHolidayResponse } from '@/types';
import { ChutiRecord } from '@/utils/offlineSync';
import { GlobalSettings, calculateStats, calculateHalfYearlyOfficeLeave, getSettlementSplits, getOutstandingOfficeLeave } from '@/utils/dashboardHelpers';
import { Modal } from '../Modal';
import { supabase } from '@/utils/supabase';
import { sendPushNotification } from '@/utils/webPushHelper';

interface UserSettleModalProps {
  showModal: boolean;
  setShowModal: (val: boolean) => void;
  profile: Profile | null;
  selectedYear: string;
  records: ChutiRecord[];
  globalSettings: GlobalSettings;
  settlements: LeaveSettlement[];
  holidayResponses: GovtHolidayResponse[];
  onSaveSettlementsBulk: (settlementsList: any[]) => Promise<boolean>;
}

export function UserSettleModal({
  showModal,
  setShowModal,
  profile,
  selectedYear,
  records,
  globalSettings,
  settlements,
  holidayResponses,
  onSaveSettlementsBulk,
}: UserSettleModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [splits, setSplits] = useState<Record<string, { carryForward: number; payment: number; adjustLeave: number }>>({});

  // 1. Filter active (initiated or responded but not processed) settlements for the current user
  const activeSettlements = React.useMemo(() => settlements.filter(
    (s) => s.user_id === profile?.id && s.year === selectedYear && (s.status === 'initiated' || s.status === 'responded')
  ), [settlements, profile?.id, selectedYear]);

  // 2. Calculate remaining balances for general broadcast mode
  const userRecords = React.useMemo(() => records.filter(
    (r) => r.user_id === profile?.id && r.status === 'approved' && r.date && r.date.substring(0, 4) === selectedYear
  ), [records, profile?.id, selectedYear]);
  const stats = React.useMemo(() => calculateStats(userRecords), [userRecords]);

  const prevYear = (Number(selectedYear) - 1).toString();

  const carriedGovt = settlements
    .filter((s) => s.user_id === profile?.id && s.year === prevYear && s.leave_category === 'Govt Holiday')
    .reduce((acc, s) => acc + getSettlementSplits(s).carry_forward, 0);

  const carriedEidFitr = settlements
    .filter((s) => s.user_id === profile?.id && s.year === prevYear && s.leave_category === 'Eid-ul-Fitr')
    .reduce((acc, s) => acc + getSettlementSplits(s).carry_forward, 0);

  const carriedEidAdha = settlements
    .filter((s) => s.user_id === profile?.id && s.year === prevYear && s.leave_category === 'Eid-ul-Adha')
    .reduce((acc, s) => acc + getSettlementSplits(s).carry_forward, 0);

  const isGovtHolidayEligible = profile?.eligible_govt_holiday !== false;
  const halfYearlyStats = React.useMemo(() => calculateHalfYearlyOfficeLeave(
    records,
    globalSettings.office_leave_h1,
    globalSettings.office_leave_h2,
    selectedYear,
    settlements,
    profile?.id
  ), [records, globalSettings.office_leave_h1, globalSettings.office_leave_h2, selectedYear, settlements, profile?.id]);

  const totalOutstandingOffice = React.useMemo(() => {
    if (!profile?.id) return 0;
    return getOutstandingOfficeLeave(
      records,
      globalSettings.office_leave_h1,
      globalSettings.office_leave_h2,
      selectedYear,
      settlements,
      profile.id
    );
  }, [records, globalSettings.office_leave_h1, globalSettings.office_leave_h2, selectedYear, settlements, profile?.id]);

  const currentHalfPeriod: 'H1' | 'H2' = halfYearlyStats.currentHalf === 1 ? 'H1' : 'H2';
  const officeRemaining = halfYearlyStats.currentHalf === 1 ? halfYearlyStats.h1Remaining : halfYearlyStats.h2Remaining;

  const activeGovtSettledForPeriod = settlements.some(
    s => s.user_id === profile?.id && s.year === selectedYear && s.leave_category === 'Govt Holiday' && s.period === currentHalfPeriod && (s.status === 'processed' || s.status === 'responded')
  );
  const userGovtResponses = holidayResponses.filter(
    (r) => r.user_id === profile?.id && r.response === 'reserve' && r.holiday_date.substring(0, 4) === selectedYear
  );
  const govtRemaining = isGovtHolidayEligible && !activeGovtSettledForPeriod
    ? Math.max(0, userGovtResponses.length + carriedGovt - (stats.govtHolidaysTaken ?? 0))
    : 0;

  const activeEidFitrSettledForPeriod = settlements.some(
    s => s.user_id === profile?.id && s.year === selectedYear && s.leave_category === 'Eid-ul-Fitr' && (s.status === 'processed' || s.status === 'responded')
  );
  const eidFitrTotal = (globalSettings.eid_fitr_leave ?? 0) + carriedEidFitr;
  const eidFitrRemaining = !activeEidFitrSettledForPeriod
    ? Math.max(0, eidFitrTotal - (stats.eidFitrTaken ?? 0))
    : 0;

  const activeEidAdhaSettledForPeriod = settlements.some(
    s => s.user_id === profile?.id && s.year === selectedYear && s.leave_category === 'Eid-ul-Adha' && (s.status === 'processed' || s.status === 'responded')
  );
  const eidAdhaTotal = (globalSettings.eid_adha_leave ?? 0) + carriedEidAdha;
  const eidAdhaRemaining = !activeEidAdhaSettledForPeriod
    ? Math.max(0, eidAdhaTotal - (stats.eidAdhaTaken ?? 0))
    : 0;

  // Construct display items list combining individual requests & general broadcast fallback
  const displayItems = React.useMemo(() => {
    if (activeSettlements.length > 0) {
      return activeSettlements.map(s => ({
        id: s.id,
        leave_category: s.leave_category,
        period: s.period,
        year: s.year,
        remaining_days: s.remaining_days,
        isCustom: false,
      }));
    }

    // General broadcast: show only the specific category+period admin broadcasted
    const broadcastPeriod = globalSettings.settlement_active_period;
    const broadcastCategory = globalSettings.settlement_active_category;

    if (globalSettings.settlement_active_year === selectedYear && broadcastPeriod && broadcastCategory) {
      let remaining = 0;
      if (broadcastCategory === 'Office Leave') {
        if (broadcastPeriod === 'H1') remaining = Math.max(0, halfYearlyStats.h1Remaining);
        else if (broadcastPeriod === 'H2') remaining = Math.max(0, halfYearlyStats.h2Remaining);
        else remaining = officeRemaining;
      } else if (broadcastCategory === 'Govt Holiday') {
        remaining = govtRemaining;
      } else if (broadcastCategory === 'Eid-ul-Fitr') {
        remaining = eidFitrRemaining;
      } else if (broadcastCategory === 'Eid-ul-Adha') {
        remaining = eidAdhaRemaining;
      }

      if (remaining > 0) {
        return [{
          id: `mock-${broadcastCategory.toLowerCase().replace(/\s+/g, '-')}`,
          leave_category: broadcastCategory,
          period: broadcastPeriod,
          year: selectedYear,
          remaining_days: remaining,
          isCustom: true,
        }];
      }
    }

    return [];
  }, [activeSettlements, globalSettings.settlement_active_year, globalSettings.settlement_active_period, globalSettings.settlement_active_category, selectedYear, halfYearlyStats, officeRemaining, govtRemaining, eidFitrRemaining, eidAdhaRemaining]);

  // Initialize preference selections
  useEffect(() => {
    if (showModal && profile) {
      const initialSplits: Record<string, { carryForward: number; payment: number; adjustLeave: number }> = {};
      displayItems.forEach((item) => {
        if (!item.isCustom) {
          const matched = activeSettlements.find(s => s.id === item.id);
          if (matched) {
            initialSplits[item.id] = {
              carryForward: matched.carry_forward_days ?? (matched.action_type === 'carry_forward' ? matched.remaining_days : 0),
              payment: matched.payment_days ?? (matched.action_type === 'payment' ? matched.remaining_days : 0),
              adjustLeave: matched.adjust_leave_days ?? (matched.action_type === 'adjust_leave' ? matched.remaining_days : 0),
            };
          } else {
            initialSplits[item.id] = { carryForward: item.remaining_days, payment: 0, adjustLeave: 0 };
          }
        } else {
          initialSplits[item.id] = { carryForward: item.remaining_days, payment: 0, adjustLeave: 0 };
        }
      });
      setSplits((prev) => {
        const isIdentical = Object.keys(initialSplits).length === Object.keys(prev).length &&
          Object.keys(initialSplits).every((key) => {
            const a = initialSplits[key];
            const b = prev[key];
            return b && a.carryForward === b.carryForward && a.payment === b.payment && a.adjustLeave === b.adjustLeave;
          });
        return isIdentical ? prev : initialSplits;
      });
    } else if (!showModal) {
      setSplits({});
    }
  }, [showModal, profile, displayItems, activeSettlements]);

  const handleSplitChange = (itemId: string, field: 'carryForward' | 'payment' | 'adjustLeave', value: number) => {
    setSplits((prev) => {
      const current = prev[itemId] || { carryForward: 0, payment: 0, adjustLeave: 0 };
      let finalVal = Math.max(0, value);
      if (field === 'adjustLeave') {
        finalVal = Math.min(finalVal, totalOutstandingOffice);
      }
      return {
        ...prev,
        [itemId]: {
          ...current,
          [field]: finalVal,
        },
      };
    });
  };

  const handleQuickAllocate = (itemId: string, action: 'carryForward' | 'payment' | 'adjustLeave', total: number) => {
    const finalVal = action === 'adjustLeave' ? Math.min(total, totalOutstandingOffice) : total;
    setSplits((prev) => ({
      ...prev,
      [itemId]: {
        carryForward: action === 'carryForward' ? finalVal : 0,
        payment: action === 'payment' ? finalVal : 0,
        adjustLeave: action === 'adjustLeave' ? finalVal : 0,
      },
    }));
  };

  const isAllAllocatedCorrectly = displayItems.every((item) => {
    const itemSplits = splits[item.id] || { carryForward: 0, payment: 0, adjustLeave: 0 };
    const allocated = itemSplits.carryForward + itemSplits.payment + itemSplits.adjustLeave;
    return Math.abs(allocated - item.remaining_days) < 0.01;
  });

  const handleSave = async () => {
    if (!profile || !isAllAllocatedCorrectly) return;
    setSubmitting(true);

    const settlementsList = displayItems.map((item) => {
      const itemSplits = splits[item.id] || { carryForward: 0, payment: 0, adjustLeave: 0 };
      
      // Determine action type
      let actionType: 'carry_forward' | 'payment' | 'adjust_leave' | 'split' = 'carry_forward';
      const activeCount = [itemSplits.carryForward > 0, itemSplits.payment > 0, itemSplits.adjustLeave > 0].filter(Boolean).length;
      if (activeCount > 1) {
        actionType = 'split';
      } else if (itemSplits.carryForward > 0) {
        actionType = 'carry_forward';
      } else if (itemSplits.payment > 0) {
        actionType = 'payment';
      } else if (itemSplits.adjustLeave > 0) {
        actionType = 'adjust_leave';
      }

      return {
        ...(!item.isCustom ? { id: item.id } : {}),
        user_id: profile.id,
        year: item.year,
        period: item.period,
        leave_category: item.leave_category,
        remaining_days: item.remaining_days,
        action_type: actionType,
        status: 'responded' as const,
        action_by: profile.id,
        carry_forward_days: itemSplits.carryForward,
        payment_days: itemSplits.payment,
        adjust_leave_days: itemSplits.adjustLeave,
      };
    });

    const success = await onSaveSettlementsBulk(settlementsList);
    setSubmitting(false);
    if (success) {
      setShowModal(false);
      // Notify admin profiles via Web Push
      try {
        const { data: admins } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'admin');
        if (admins && admins.length > 0) {
          const adminIds = admins.map(a => a.id);
          const firstItem = settlementsList[0];
          await sendPushNotification({
            userIds: adminIds,
            title: 'Leave Preference Submitted 📥',
            body: `${profile.full_name || profile.username} submitted choice for ${firstItem.leave_category} (${firstItem.period === 'H1' ? 'January-June (H1)' : firstItem.period === 'H2' ? 'July-December (H2)' : firstItem.period}).`,
            url: '/?tab=admin'
          });
        }
      } catch (err) {
        console.error('Error sending push notification to admins:', err);
      }
    }
  };

  return (
    <Modal
      isOpen={showModal && profile !== null}
      onClose={() => setShowModal(false)}
      title="Submit Leave Preference"
      icon={<RotateCcw className="h-5 w-5 text-orange-500" />}
      maxWidthClass="max-w-xl"
    >
      <div className="space-y-6 font-sans text-xs text-slate-300">
        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-6 scrollbar-thin scrollbar-thumb-slate-850 scrollbar-track-transparent">
          <div className="p-4 bg-indigo-950/20 border border-indigo-900/40 text-indigo-300 rounded-xl leading-relaxed">
            <p className="font-bold flex items-center gap-1.5 text-slate-100 text-sm">
              <Sparkles className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
              Action Required: Settle Unused Leaves
            </p>
            <p className="mt-1.5 text-[11px] text-slate-400">
              {activeSettlements.some(s => s.status === 'initiated')
                ? 'The administrator has initiated a preference review for your unused leave balances. Please submit your choice for each item below.'
                : 'A general leave review session is active. Please submit your preferred actions for your unused leave balances below.'}
            </p>
          </div>

          {displayItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-900/40 border border-slate-800 rounded-xl flex flex-col items-center justify-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <p className="font-semibold text-slate-300">All Settled!</p>
              <p className="text-[11px] text-slate-500 font-medium">You have no remaining leave balances to settle.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {displayItems.map((item) => {
                const itemSplits = splits[item.id] || { carryForward: 0, payment: 0, adjustLeave: 0 };
                const allocated = itemSplits.carryForward + itemSplits.payment + itemSplits.adjustLeave;
                const isCorrect = Math.abs(allocated - item.remaining_days) < 0.01;

                return (
                  <div key={item.id} className="p-4 bg-slate-955/40 border border-slate-850/80 rounded-2xl space-y-4">
                    {/* Category Header */}
                    <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                      <div>
                        <h4 className="text-sm font-bold text-white tracking-wide">
                          {item.leave_category === 'Office Leave' ? 'Allocated Office Leave' : item.leave_category}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-455 mt-0.5">
                          <span className="bg-indigo-650/15 text-indigo-400 border border-indigo-900/45 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                            Period: {item.period === 'H1' ? 'January-June (H1)' : item.period === 'H2' ? 'July-December (H2)' : item.period}
                          </span>
                          <span>•</span>
                          <span>Year: {item.year}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Unused Balance</span>
                        <span className="text-lg font-bold font-mono text-orange-400">{item.remaining_days} days</span>
                      </div>
                    </div>

                    {/* Split Allocation Fields */}
                    <div className="space-y-2.5">
                      {/* Carry Forward Option */}
                      <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-900/30 border-slate-850/80 focus-within:border-indigo-500/60 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-400/30 text-indigo-400">
                            <FolderPlus className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-100 block">Reserve / Carry Forward</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Carry forward to the next period's active quota.</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="number"
                            min={0}
                            max={item.remaining_days}
                            step={0.5}
                            value={itemSplits.carryForward}
                            onChange={(e) => handleSplitChange(item.id, 'carryForward', parseFloat(e.target.value) || 0)}
                            className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-right text-xs font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuickAllocate(item.id, 'carryForward', item.remaining_days)}
                            className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          >
                            All
                          </button>
                        </div>
                      </div>

                      {/* Cash Out Option */}
                      <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-900/30 border-slate-850/80 focus-within:border-emerald-500/60 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-400/30 text-emerald-400">
                            <DollarSign className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-100 block">Get Cash Payment (Cash Out)</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Receive direct monetary payout.</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="number"
                            min={0}
                            max={item.remaining_days}
                            step={0.5}
                            value={itemSplits.payment}
                            onChange={(e) => handleSplitChange(item.id, 'payment', parseFloat(e.target.value) || 0)}
                            className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-right text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuickAllocate(item.id, 'payment', item.remaining_days)}
                            className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          >
                            All
                          </button>
                        </div>
                      </div>

                      {/* Adjust Option */}
                      {totalOutstandingOffice > 0 && (
                        <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-900/30 border-slate-850/80 focus-within:border-amber-500/60 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-400/30 text-amber-400">
                              <ArrowRightLeft className="h-4 w-4" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-100 block">Adjust with Unpaid or Other Leaves</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">Adjust against outstanding Office Leave ({totalOutstandingOffice} days).</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <input
                              type="number"
                              min={0}
                              max={Math.min(item.remaining_days, totalOutstandingOffice)}
                              step={0.5}
                              value={itemSplits.adjustLeave}
                              onChange={(e) => handleSplitChange(item.id, 'adjustLeave', parseFloat(e.target.value) || 0)}
                              className="w-16 bg-slate-955 border border-slate-800 rounded-lg px-2 py-1 text-right text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleQuickAllocate(item.id, 'adjustLeave', item.remaining_days)}
                              className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                            >
                              All
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar & Validation Status for item */}
                    <div className="p-3 bg-slate-950/20 border border-slate-850 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-455 uppercase tracking-wide">
                        <span>Allocation Progress</span>
                        <span className={isCorrect ? "text-emerald-400" : "text-rose-400 animate-pulse"}>
                          {allocated} / {item.remaining_days} days allocated
                        </span>
                      </div>

                      <div className="h-1.5 w-full bg-slate-950/80 rounded-full overflow-hidden flex border border-slate-900">
                        {item.remaining_days > 0 ? (
                          <>
                            <div style={{ width: `${(itemSplits.carryForward / item.remaining_days) * 100}%` }} className="bg-indigo-500 h-full transition-all duration-300" />
                            <div style={{ width: `${(itemSplits.payment / item.remaining_days) * 100}%` }} className="bg-emerald-500 h-full transition-all duration-300" />
                            <div style={{ width: `${(itemSplits.adjustLeave / item.remaining_days) * 100}%` }} className="bg-amber-500 h-full transition-all duration-300" />
                          </>
                        ) : null}
                      </div>

                      {!isCorrect && (
                        <div className="text-[10px] text-rose-455 font-semibold flex items-center justify-center gap-1 mt-1 bg-rose-500/5 py-0.5 rounded border border-rose-500/10">
                          <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                          Sum of allocations ({allocated}d) must match unused balance ({item.remaining_days}d).
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-slate-850">
          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="flex-1 flex justify-center py-2 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-950 hover:bg-slate-900 cursor-pointer transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={submitting || displayItems.length === 0 || !isAllAllocatedCorrectly}
            className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
          >
            {submitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
            {submitting ? 'Submitting...' : 'Submit Preferences'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
