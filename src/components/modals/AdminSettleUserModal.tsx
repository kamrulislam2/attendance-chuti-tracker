'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, RotateCcw, ShieldAlert } from 'lucide-react';
import { Profile, LeaveSettlement, GovtHolidayResponse } from '@/types';
import { ChutiRecord } from '@/utils/offlineSync';
import { GlobalSettings, calculateStats } from '@/utils/dashboardHelpers';
import { Modal } from '../Modal';

interface AdminSettleUserModalProps {
  showModal: boolean;
  setShowModal: (val: boolean) => void;
  staff: Profile | null;
  selectedYear: string;
  records: ChutiRecord[];
  globalSettings: GlobalSettings;
  settlements: LeaveSettlement[];
  holidayResponses: GovtHolidayResponse[];
  onSaveSettlementsBulk: (settlementsList: any[]) => Promise<boolean>;
  currentUserProfile: Profile | null;
}

export function AdminSettleUserModal({
  showModal,
  setShowModal,
  staff,
  selectedYear,
  records,
  globalSettings,
  settlements,
  holidayResponses,
  onSaveSettlementsBulk,
  currentUserProfile,
}: AdminSettleUserModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [preferences, setPreferences] = useState<Record<string, 'carry_forward' | 'payment' | 'none'>>({});

  // Filter records for this staff & year
  const staffRecords = records.filter(
    (r) => r.user_id === staff?.id && r.status === 'approved' && r.date && r.date.substring(0, 4) === selectedYear
  );
  const stats = calculateStats(staffRecords);

  // Previous year carried balances
  const prevYear = (Number(selectedYear) - 1).toString();
  const carriedOffice = settlements
    .filter((s) => s.user_id === staff?.id && s.year === prevYear && s.leave_category === 'Office Leave' && s.action_type === 'carry_forward')
    .reduce((acc, s) => acc + s.remaining_days, 0);

  const carriedGovt = settlements
    .filter((s) => s.user_id === staff?.id && s.year === prevYear && s.leave_category === 'Govt Holiday' && s.action_type === 'carry_forward')
    .reduce((acc, s) => acc + s.remaining_days, 0);

  const carriedEidFitr = settlements
    .filter((s) => s.user_id === staff?.id && s.year === prevYear && s.leave_category === 'Eid-ul-Fitr' && s.action_type === 'carry_forward')
    .reduce((acc, s) => acc + s.remaining_days, 0);

  const carriedEidAdha = settlements
    .filter((s) => s.user_id === staff?.id && s.year === prevYear && s.leave_category === 'Eid-ul-Adha' && s.action_type === 'carry_forward')
    .reduce((acc, s) => acc + s.remaining_days, 0);

  // Compute Remaining Balances for current year
  const isOfficeLeaveEligible = staff?.eligible_office_leave !== false;
  const isGovtHolidayEligible = staff?.eligible_govt_holiday !== false;

  const officeLeaveTotal = (isOfficeLeaveEligible ? (globalSettings.office_leave_default ?? 14) : 0) + carriedOffice;
  const officeLeaveTaken = (stats.officeLeavesTaken ?? 0) + (stats.fullLeaves ?? 0) + (staff?.converted_short_leaves_days ?? 0);
  const officeRemaining = Math.max(0, officeLeaveTotal - officeLeaveTaken);

  const userGovtResponses = holidayResponses.filter(
    (r) => r.user_id === staff?.id && r.response === 'reserve' && r.holiday_date.substring(0, 4) === selectedYear
  );
  const govtRemaining = isGovtHolidayEligible
    ? Math.max(0, userGovtResponses.length + carriedGovt - (stats.govtHolidaysTaken ?? 0))
    : 0;

  const eidFitrTotal = (globalSettings.eid_fitr_leave ?? 0) + carriedEidFitr;
  const eidFitrRemaining = Math.max(0, eidFitrTotal - (stats.eidFitrTaken ?? 0));

  const eidAdhaTotal = (globalSettings.eid_adha_leave ?? 0) + carriedEidAdha;
  const eidAdhaRemaining = Math.max(0, eidAdhaTotal - (stats.eidAdhaTaken ?? 0));

  // Initialize preference selections
  useEffect(() => {
    if (showModal && staff) {
      const initialPrefs: Record<string, 'carry_forward' | 'payment' | 'none'> = {};
      const categories = ['Office Leave', 'Govt Holiday', 'Eid-ul-Fitr', 'Eid-ul-Adha'];
      
      categories.forEach((cat) => {
        const existing = settlements.find(
          (s) => s.user_id === staff.id && s.year === selectedYear && s.leave_category === cat
        );
        initialPrefs[cat] = existing ? existing.action_type : 'none';
      });

      setPreferences(initialPrefs);
    }
  }, [showModal, staff, settlements, selectedYear]);

  const handleSelectPreference = (category: string, choice: 'carry_forward' | 'payment' | 'none') => {
    setPreferences((prev) => ({
      ...prev,
      [category]: choice,
    }));
  };

  const handleSelectAll = (choice: 'carry_forward' | 'payment') => {
    const updated: Record<string, 'carry_forward' | 'payment' | 'none'> = {};
    if (officeRemaining > 0) updated['Office Leave'] = choice;
    if (govtRemaining > 0) updated['Govt Holiday'] = choice;
    if (eidFitrRemaining > 0) updated['Eid-ul-Fitr'] = choice;
    if (eidAdhaRemaining > 0) updated['Eid-ul-Adha'] = choice;

    setPreferences((prev) => ({
      ...prev,
      ...updated,
    }));
  };

  const handleSave = async () => {
    if (!staff) return;
    setSubmitting(true);

    const settlementsList: any[] = [];
    const categoriesWithBalances = [
      { name: 'Office Leave', balance: officeRemaining },
      { name: 'Govt Holiday', balance: govtRemaining },
      { name: 'Eid-ul-Fitr', balance: eidFitrRemaining },
      { name: 'Eid-ul-Adha', balance: eidAdhaRemaining },
    ];

    categoriesWithBalances.forEach((cat) => {
      const choice = preferences[cat.name];
      if (choice && choice !== 'none' && cat.balance > 0) {
        settlementsList.push({
          user_id: staff.id,
          year: selectedYear,
          leave_category: cat.name,
          remaining_days: cat.balance,
          action_type: choice,
          status: 'processed',
          processed_by: currentUserProfile?.id || null,
          action_by: currentUserProfile?.id || null,
        });
      }
    });

    const success = await onSaveSettlementsBulk(settlementsList);
    setSubmitting(false);
    if (success) {
      setShowModal(false);
    }
  };

  const categories = [
    { name: 'Office Leave', balance: officeRemaining, label: 'Allocated Office Leave' },
    { name: 'Govt Holiday', balance: govtRemaining, label: 'Reserved Govt Holiday' },
    { name: 'Eid-ul-Fitr', balance: eidFitrRemaining, label: 'Eid-ul-Fitr Leave' },
    { name: 'Eid-ul-Adha', balance: eidAdhaRemaining, label: 'Eid-ul-Adha Leave' },
  ].filter(c => c.balance > 0);

  return (
    <Modal
      isOpen={showModal && staff !== null}
      onClose={() => setShowModal(false)}
      title={`Settle Leaves — ${staff?.full_name || staff?.username} (${selectedYear})`}
      icon={<RotateCcw className="h-5 w-5 text-orange-500" />}
      maxWidthClass="max-w-xl"
    >
      <div className="space-y-5 font-sans text-xs">
        {categories.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-900/40 border border-slate-800 rounded-xl flex flex-col items-center justify-center gap-2">
            <ShieldAlert className="h-8 w-8 text-slate-500" />
            <p className="font-semibold text-slate-300">No remaining leave balances found for {selectedYear}!</p>
            <p className="text-[11px] text-slate-500">This user has utilized all allocated and reserved leaves.</p>
          </div>
        ) : (
          <>
            <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Quick Actions</span>
              <div className="flex gap-2 pt-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectAll('carry_forward')}
                  className="flex-1 py-1.5 px-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-900/50 rounded-lg font-bold text-[10px] transition-all cursor-pointer"
                >
                  Carry Forward All Remaining
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAll('payment')}
                  className="flex-1 py-1.5 px-3 bg-teal-600/10 hover:bg-teal-600/20 text-teal-400 border border-teal-900/50 rounded-lg font-bold text-[10px] transition-all cursor-pointer"
                >
                  Get Paid for All Remaining
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Category Preferences
              </label>

              <div className="space-y-2.5">
                {categories.map((cat) => {
                  const choice = preferences[cat.name] || 'none';
                  return (
                    <div
                      key={cat.name}
                      className="p-3.5 bg-slate-955/60 border border-slate-850 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                    >
                      <div>
                        <div className="font-bold text-slate-200">{cat.label}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Remaining: <span className="font-semibold font-mono text-orange-400">{cat.balance} days</span>
                        </div>
                      </div>

                      <div className="flex gap-1.5 w-full sm:w-auto self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleSelectPreference(cat.name, 'carry_forward')}
                          className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            choice === 'carry_forward'
                              ? 'bg-indigo-600 text-white border border-indigo-500 shadow-sm'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-255'
                          }`}
                        >
                          Carry Forward
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectPreference(cat.name, 'payment')}
                          className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            choice === 'payment'
                              ? 'bg-teal-600 text-white border border-teal-500 shadow-sm'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-255'
                          }`}
                        >
                          Get Paid
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectPreference(cat.name, 'none')}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            choice === 'none'
                              ? 'bg-slate-800 border border-slate-700 text-slate-300'
                              : 'bg-transparent border border-transparent text-slate-500 hover:text-slate-400'
                          }`}
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="flex-1 flex justify-center py-2 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-355 bg-slate-955 hover:bg-slate-900 cursor-pointer transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={submitting || categories.length === 0}
            className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
          >
            {submitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
            {submitting ? 'Processing...' : 'Confirm Settlement'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
