'use client';

import React, { useState } from 'react';
import { RefreshCw, RotateCcw, ShieldAlert, DollarSign, FolderPlus, ArrowRightLeft } from 'lucide-react';
import { Profile, LeaveSettlement } from '@/types';
import { Modal } from '../Modal';
import { sendPushNotification } from '@/utils/webPushHelper';
import { GlobalSettings, getOutstandingOfficeLeave } from '@/utils/dashboardHelpers';
import { ChutiRecord } from '@/utils/offlineSync';

interface AdminSettleUserModalProps {
  showModal: boolean;
  setShowModal: (val: boolean) => void;
  staff: Profile | null;
  settlement: LeaveSettlement | null;
  onSaveSettlementsBulk: (settlementsList: any[]) => Promise<boolean>;
  currentUserProfile: Profile | null;
  globalSettings: GlobalSettings;
  records: ChutiRecord[];
  leaveSettlements: LeaveSettlement[];
}

export function AdminSettleUserModal({
  showModal,
  setShowModal,
  staff,
  settlement,
  onSaveSettlementsBulk,
  currentUserProfile,
  globalSettings,
  records,
  leaveSettlements,
}: AdminSettleUserModalProps) {
  const [submitting, setSubmitting] = useState(false);

  // Initialize splits directly on mount (flicker-free)
  const [carryForwardDays, setCarryForwardDays] = useState<number>(() => {
    if (!settlement) return 0;
    return settlement.carry_forward_days ?? (settlement.action_type === 'carry_forward' ? settlement.remaining_days : 0);
  });
  const [paymentDays, setPaymentDays] = useState<number>(() => {
    if (!settlement) return 0;
    return settlement.payment_days ?? (settlement.action_type === 'payment' ? settlement.remaining_days : 0);
  });
  const [adjustLeaveDays, setAdjustLeaveDays] = useState<number>(() => {
    if (!settlement) return 0;
    return settlement.adjust_leave_days ?? (settlement.action_type === 'adjust_leave' ? settlement.remaining_days : 0);
  });

  const isBroadcastActive = settlement
    ? globalSettings.settlement_active_year === settlement.year &&
      globalSettings.settlement_active_period === settlement.period &&
      globalSettings.settlement_active_category === settlement.leave_category
    : false;

  const total = settlement?.remaining_days || 0;
  const isNegative = total < 0;

  const totalOutstandingOffice = React.useMemo(() => {
    if (!staff?.id || !settlement) return 0;
    return getOutstandingOfficeLeave(
      records,
      globalSettings.office_leave_h1,
      globalSettings.office_leave_h2,
      settlement.year,
      leaveSettlements,
      staff.id
    );
  }, [records, globalSettings.office_leave_h1, globalSettings.office_leave_h2, settlement, leaveSettlements, staff?.id]);

  const allocated = carryForwardDays + paymentDays + adjustLeaveDays;
  const isAllocatedCorrectly = isNegative ? true : Math.abs(allocated - total) < 0.01;

  const handleQuickAllocate = (action: 'carry_forward' | 'payment' | 'adjust_leave') => {
    if (action === 'carry_forward') {
      setCarryForwardDays(total);
      setPaymentDays(0);
      setAdjustLeaveDays(0);
    } else if (action === 'payment') {
      setCarryForwardDays(0);
      setPaymentDays(total);
      setAdjustLeaveDays(0);
    } else if (action === 'adjust_leave') {
      setCarryForwardDays(0);
      setPaymentDays(0);
      setAdjustLeaveDays(Math.min(total, totalOutstandingOffice));
    }
  };

  const handleConfirm = async () => {
    if (!staff || !settlement) return;
    if (!isNegative && !isAllocatedCorrectly) return;
    setSubmitting(true);

    const updateRecord = {
      id: settlement.id,
      user_id: settlement.user_id,
      year: settlement.year,
      period: settlement.period,
      leave_category: settlement.leave_category,
      remaining_days: total,
      status: 'processed' as const,
      processed_by: currentUserProfile?.id || null,
      action_by: currentUserProfile?.id || null,
      carry_forward_days: isNegative ? 0 : carryForwardDays,
      payment_days: isNegative ? total : paymentDays,
      adjust_leave_days: isNegative ? 0 : adjustLeaveDays,
    };

    const success = await onSaveSettlementsBulk([updateRecord]);
    setSubmitting(false);
    if (success) {
      setShowModal(false);
      // Notify user via Web Push
      try {
        let choiceLabel = '';
        if (isNegative) {
          choiceLabel = `Salary Deduction of ${Math.abs(total)} days`;
        } else {
          const parts: string[] = [];
          if (carryForwardDays > 0) parts.push(`${carryForwardDays}d Carry Forward`);
          if (paymentDays > 0) parts.push(`${paymentDays}d Cash Out`);
          if (adjustLeaveDays > 0) parts.push(`${adjustLeaveDays}d Adjust`);
          choiceLabel = parts.join(', ') || 'No allocation';
        }

        await sendPushNotification({
          userIds: [staff.id],
          title: 'Leave Settlement Processed ✅',
          body: `Your preference for ${settlement.leave_category} (${settlement.period === 'H1' ? 'January-June (H1)' : settlement.period === 'H2' ? 'July-December (H2)' : settlement.period}) has been processed as: ${choiceLabel}.`,
          url: '/'
        });
      } catch (err) {
        console.error('Error sending push notification to user:', err);
      }
    }
  };

  if (!settlement) return null;

  // Detect if there's a delta/change from stored remaining days (due to live settings update)
  const storedTotal = (settlement.carry_forward_days ?? 0) + (settlement.payment_days ?? 0) + (settlement.adjust_leave_days ?? 0) || (settlement.action_type ? settlement.remaining_days : 0);
  const showDeltaWarning = settlement.status === 'processed' && Math.abs(storedTotal - total) > 0.01;  return (
    <Modal
      isOpen={showModal && staff !== null}
      onClose={() => setShowModal(false)}
      title={isNegative ? `Process Salary Deduction — ${staff?.full_name || staff?.username}` : `Process Settlement — ${staff?.full_name || staff?.username}`}
      icon={<RotateCcw className="h-5 w-5 text-orange-500" />}
      maxWidthClass="max-w-xl"
    >
      <div className="space-y-5 font-sans text-xs text-slate-350">
        <div className="p-3.5 bg-slate-950/40 border border-slate-850 rounded-xl space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Leave Category</span>
              <h4 className="text-sm font-bold text-slate-100 mt-0.5">{settlement.leave_category}</h4>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                {isNegative ? 'Outstanding Balance' : 'Unused Balance'}
              </span>
              <span className={`text-base font-bold font-mono block mt-0.5 ${isNegative ? 'text-rose-500 font-extrabold' : 'text-orange-400'}`}>
                {isNegative ? `${Math.abs(total)} days` : `${total} days`}
              </span>
            </div>
          </div>
          <div className="flex gap-4 pt-1.5 border-t border-slate-900 text-[10px] text-slate-400">
            <span>Year: <strong className="text-slate-300">{settlement.year}</strong></span>
            <span>Period: <strong className="text-slate-300">{settlement.period === 'H1' ? 'January-June (H1)' : settlement.period === 'H2' ? 'July-December (H2)' : settlement.period}</strong></span>
            <span>User Choice: <strong className="text-slate-300 capitalize">
              {settlement.status === 'initiated' ? 'Pending Response' : (isNegative ? 'Salary Deduction' : settlement.action_type.replace('_', ' '))}
            </strong></span>
          </div>
        </div>

        {settlement.status === 'initiated' && !isNegative && (
          <div className="p-3 bg-amber-955/15 border border-amber-900/40 rounded-xl flex items-start gap-2 text-amber-300">
            <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[10.5px] leading-relaxed">
              {isBroadcastActive
                ? 'Staff has not submitted their preference yet. Settle manually or wait for their response.'
                : 'Staff has not submitted their preference yet. Settle manually or send broadcast message for their preference.'}
            </p>
          </div>
        )}

        {showDeltaWarning && !isNegative && (
          <div className="p-3 bg-indigo-955/15 border border-indigo-900/40 rounded-xl flex items-start gap-2 text-indigo-300">
            <ShieldAlert className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-[10.5px] leading-relaxed">
              Unused balance is updated from {storedTotal} to {total} days (+{total - storedTotal} day(s) unsettled due to quota/record updates). Please re-allocate the total balance.
            </p>
          </div>
        )}

        {/* Dynamic Splits Section */}
        {isNegative ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200">
              <p className="text-xs leading-relaxed">
                Staff member <strong>{staff?.full_name || staff?.username}</strong> has an outstanding unpaid leave balance of <strong>{Math.abs(total)} days</strong> for {settlement.leave_category} ({settlement.period === 'H1' ? 'January-June' : settlement.period === 'H2' ? 'July-December' : settlement.period}) - {settlement.year}.
              </p>
              <p className="text-[11px] text-rose-400 mt-2 font-medium">
                Processing this will record a salary deduction for the unpaid days and mark their negative balance as resolved.
              </p>
            </div>
            <div className="p-3.5 bg-slate-950/20 border border-slate-850 rounded-xl flex justify-between items-center text-xs">
              <span className="text-slate-400">Total Deduction Days</span>
              <span className="font-mono font-bold text-rose-400 text-sm">{Math.abs(total)} days</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Custom Splits Allocation
            </label>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Carry Forward Option */}
              <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-900/30 border-slate-850/80 focus-within:border-indigo-500/60 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-400/30 text-indigo-400">
                    <FolderPlus className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Carry Forward / Reserve</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Carry forward to the next period's active quota.</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    min={0}
                    max={total}
                    step={0.5}
                    value={carryForwardDays}
                    onChange={(e) => setCarryForwardDays(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-16 bg-slate-955 border border-slate-800 rounded-lg px-2 py-1 text-right text-xs font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleQuickAllocate('carry_forward')}
                    className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  >
                    All
                  </button>
                </div>
              </div>

              {/* Cash Payment Option */}
              <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-900/30 border-slate-850/80 focus-within:border-emerald-500/60 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-400/30 text-emerald-400">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Cash Payment (Payout)</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Pay direct cash equivalent. Deducts from active quota.</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    min={0}
                    max={total}
                    step={0.5}
                    value={paymentDays}
                    onChange={(e) => setPaymentDays(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-16 bg-slate-955 border border-slate-800 rounded-lg px-2 py-1 text-right text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleQuickAllocate('payment')}
                    className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  >
                    All
                  </button>
                </div>
              </div>

              {/* Adjust Leaves Option */}
              {totalOutstandingOffice > 0 && (
                <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-900/30 border-slate-850/80 focus-within:border-amber-500/60 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-400/30 text-amber-400">
                      <ArrowRightLeft className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Adjust Leaves</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Adjust against outstanding Office Leave ({totalOutstandingOffice} days).</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      min={0}
                      max={Math.min(total, totalOutstandingOffice)}
                      step={0.5}
                      value={adjustLeaveDays}
                      onChange={(e) => setAdjustLeaveDays(Math.max(0, Math.min(totalOutstandingOffice, parseFloat(e.target.value) || 0)))}
                      className="w-16 bg-slate-955 border border-slate-800 rounded-lg px-2 py-1 text-right text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleQuickAllocate('adjust_leave')}
                      className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                    >
                      All
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Visual Allocation Summary & Segment Bar */}
        {!isNegative && (
          <div className="p-3.5 bg-slate-955 border border-slate-850 rounded-xl space-y-2.5">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Allocation Summary</span>
              <span className={isAllocatedCorrectly ? "text-emerald-400" : "text-rose-400 animate-pulse"}>
                {allocated} / {total} Days Allocated
              </span>
            </div>

            <div className="h-2 w-full bg-slate-950/80 rounded-full overflow-hidden flex border border-slate-900">
              {total > 0 ? (
                <>
                  <div style={{ width: `${(carryForwardDays / total) * 100}%` }} className="bg-indigo-500 h-full transition-all duration-300" />
                  <div style={{ width: `${(paymentDays / total) * 100}%` }} className="bg-emerald-500 h-full transition-all duration-300" />
                  <div style={{ width: `${(adjustLeaveDays / total) * 100}%` }} className="bg-amber-500 h-full transition-all duration-300" />
                </>
              ) : null}
            </div>

            {isAllocatedCorrectly ? (
              <div className="text-[10.5px] text-emerald-400 font-semibold flex items-center gap-1 justify-center bg-emerald-500/5 py-1 rounded-lg border border-emerald-500/10">
                ✓ Unused leave balance is fully allocated.
              </div>
            ) : (
              <div className="text-[10.5px] text-rose-455 font-semibold flex items-center gap-1 justify-center bg-rose-500/5 py-1 rounded-lg border border-rose-500/10">
                ⚠ Allocated sum ({allocated}d) must exactly match unused balance ({total}d).
              </div>
            )}
          </div>
        )}

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
            onClick={handleConfirm}
            disabled={submitting || !isAllocatedCorrectly}
            className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
          >
            {submitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
            {submitting ? 'Processing...' : 'Finalize & Process'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
