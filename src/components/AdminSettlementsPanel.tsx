'use client';

import React, { useState } from 'react';
import { RotateCcw, Calendar, CheckCircle2, AlertCircle, Sparkles, Send, BellOff, Edit3 } from 'lucide-react';
import { Profile, LeaveSettlement, GovtHolidayResponse } from '@/types';
import { ChutiRecord } from '@/utils/offlineSync';
import { GlobalSettings, calculateStats, formatDate } from '@/utils/dashboardHelpers';
import { AdminSettleUserModal } from './modals/AdminSettleUserModal';
import { toast } from 'react-hot-toast';

interface AdminSettlementsPanelProps {
  profilesList: Profile[];
  selectedYear: string;
  records: ChutiRecord[];
  globalSettings: GlobalSettings;
  onSaveGlobalSettings: (settings: GlobalSettings) => Promise<boolean>;
  leaveSettlements: LeaveSettlement[];
  holidayResponses: GovtHolidayResponse[];
  onSaveSettlementsBulk: (settlementsList: any[]) => Promise<boolean>;
  currentUserProfile: Profile | null;
}

export const AdminSettlementsPanel: React.FC<AdminSettlementsPanelProps> = ({
  profilesList,
  selectedYear,
  records,
  globalSettings,
  onSaveGlobalSettings,
  leaveSettlements,
  holidayResponses,
  onSaveSettlementsBulk,
  currentUserProfile,
}) => {
  const [activeSettleStaff, setActiveSettleStaff] = useState<Profile | null>(null);
  const [showSettleModal, setShowSettleModal] = useState(false);

  // Filter out admins from settlement list
  const staffProfiles = profilesList.filter((p) => p.role !== 'admin');

  const isBroadcastActive = globalSettings.settlement_active_year === selectedYear;

  const handleToggleBroadcast = async () => {
    const nextSettings = {
      ...globalSettings,
      settlement_active_year: isBroadcastActive ? null : selectedYear,
    };
    const success = await onSaveGlobalSettings(nextSettings);
    if (success) {
      toast.success(
        isBroadcastActive
          ? `Settlement broadcast deactivated for ${selectedYear}!`
          : `Settlement broadcast activated for ${selectedYear}! Staff will see notification banners.`
      );
    }
  };

  const getStaffBalancesAndSettlements = (staff: Profile) => {
    // Current Year approved records
    const staffRecords = records.filter(
      (r) => r.user_id === staff.id && r.status === 'approved' && r.date && r.date.substring(0, 4) === selectedYear
    );
    const stats = calculateStats(staffRecords);

    // Carry forward calculation from previous year
    const prevYear = (Number(selectedYear) - 1).toString();
    const carriedOffice = leaveSettlements
      .filter((s) => s.user_id === staff.id && s.year === prevYear && s.leave_category === 'Office Leave' && s.action_type === 'carry_forward')
      .reduce((acc, s) => acc + s.remaining_days, 0);

    const carriedGovt = leaveSettlements
      .filter((s) => s.user_id === staff.id && s.year === prevYear && s.leave_category === 'Govt Holiday' && s.action_type === 'carry_forward')
      .reduce((acc, s) => acc + s.remaining_days, 0);

    const carriedEidFitr = leaveSettlements
      .filter((s) => s.user_id === staff.id && s.year === prevYear && s.leave_category === 'Eid-ul-Fitr' && s.action_type === 'carry_forward')
      .reduce((acc, s) => acc + s.remaining_days, 0);

    const carriedEidAdha = leaveSettlements
      .filter((s) => s.user_id === staff.id && s.year === prevYear && s.leave_category === 'Eid-ul-Adha' && s.action_type === 'carry_forward')
      .reduce((acc, s) => acc + s.remaining_days, 0);

    // Compute remaining
    const isOfficeLeaveEligible = staff.eligible_office_leave !== false;
    const isGovtHolidayEligible = staff.eligible_govt_holiday !== false;

    const officeLeaveTotal = (isOfficeLeaveEligible ? (globalSettings.office_leave_default ?? 14) : 0) + carriedOffice;
    const officeLeaveTaken = (stats.officeLeavesTaken ?? 0) + (stats.fullLeaves ?? 0) + (staff.converted_short_leaves_days ?? 0);
    const officeRemaining = Math.max(0, officeLeaveTotal - officeLeaveTaken);

    const userGovtResponses = holidayResponses.filter(
      (r) => r.user_id === staff.id && r.response === 'reserve' && r.holiday_date.substring(0, 4) === selectedYear
    );
    const govtRemaining = isGovtHolidayEligible
      ? Math.max(0, userGovtResponses.length + carriedGovt - (stats.govtHolidaysTaken ?? 0))
      : 0;

    const eidFitrTotal = (globalSettings.eid_fitr_leave ?? 0) + carriedEidFitr;
    const eidFitrRemaining = Math.max(0, eidFitrTotal - (stats.eidFitrTaken ?? 0));

    const eidAdhaTotal = (globalSettings.eid_adha_leave ?? 0) + carriedEidAdha;
    const eidAdhaRemaining = Math.max(0, eidAdhaTotal - (stats.eidAdhaTaken ?? 0));

    // Get active settlements for selectedYear
    const activeSettlements = leaveSettlements.filter(
      (s) => s.user_id === staff.id && s.year === selectedYear
    );

    return {
      balances: {
        office: officeRemaining,
        govt: govtRemaining,
        eidFitr: eidFitrRemaining,
        eidAdha: eidAdhaRemaining,
        totalRemaining: officeRemaining + govtRemaining + eidFitrRemaining + eidAdhaRemaining,
      },
      settlements: activeSettlements,
    };
  };

  return (
    <div className="bg-slate-900/40 border border-slate-900 shadow-2xl rounded-2xl overflow-hidden flex flex-col animate-fade-in font-sans text-xs">
      {/* Top Controller Header */}
      <div className="px-6 py-5 border-b border-slate-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-955/20">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-orange-500" />
            Year-End Leave Settlements ({selectedYear})
          </h3>
          <p className="text-slate-400 text-[11px] mt-1">
            Manage Carry Forwards and Payments for unused staff leave balances.
          </p>
        </div>

        {/* Broadcast Trigger Button */}
        <button
          onClick={handleToggleBroadcast}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
            isBroadcastActive
              ? 'bg-amber-600/10 border border-amber-500/30 text-amber-400 hover:bg-amber-600/20'
              : 'bg-indigo-600 border border-indigo-500 text-white hover:bg-indigo-500'
          }`}
        >
          {isBroadcastActive ? (
            <>
              <BellOff className="h-4 w-4" />
              <span>Deactivate Settlement Broadcast</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4 animate-bounce" />
              <span>Broadcast Settlement Request ({selectedYear})</span>
            </>
          )}
        </button>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-955/60">
            <tr>
              <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Staff member</th>
              <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remaining Quotas</th>
              <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settlement Actions</th>
              <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3.5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850 bg-slate-900/10">
            {staffProfiles.map((staff) => {
              const data = getStaffBalancesAndSettlements(staff);
              const hasUnsettled = data.balances.totalRemaining > 0 && data.settlements.length < Object.values(data.balances).filter(b => typeof b === 'number' && b > 0).length - 1; // Subtract totalRemaining key
              
              const totalActiveCategories = [
                data.balances.office,
                data.balances.govt,
                data.balances.eidFitr,
                data.balances.eidAdha
              ].filter(b => b > 0).length;

              const isSettled = data.settlements.length >= totalActiveCategories && totalActiveCategories > 0;

              return (
                <tr key={staff.id} className="hover:bg-slate-900/30 transition-all">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-white text-sm">{staff.full_name || '-'}</div>
                    <div className="text-[10px] text-slate-455 font-mono mt-0.5 uppercase tracking-wide">
                      {staff.username} • {staff.job_role || (staff.role === 'supervisor' ? 'Supervisor' : 'Staff')}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {data.balances.totalRemaining === 0 ? (
                      <span className="text-slate-500 italic">No remaining balance</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-w-sm">
                        {data.balances.office > 0 && (
                          <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[10px] font-medium text-slate-300">
                            Office: <span className="font-bold text-orange-400 font-mono">{data.balances.office}d</span>
                          </span>
                        )}
                        {data.balances.govt > 0 && (
                          <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[10px] font-medium text-slate-300">
                            Govt: <span className="font-bold text-orange-400 font-mono">{data.balances.govt}d</span>
                          </span>
                        )}
                        {data.balances.eidFitr > 0 && (
                          <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[10px] font-medium text-slate-300">
                            Fitr: <span className="font-bold text-orange-400 font-mono">{data.balances.eidFitr}d</span>
                          </span>
                        )}
                        {data.balances.eidAdha > 0 && (
                          <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[10px] font-medium text-slate-300">
                            Adha: <span className="font-bold text-orange-400 font-mono">{data.balances.eidAdha}d</span>
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {data.settlements.length === 0 ? (
                      <span className="text-slate-500 italic text-[11px]">No settlement choices</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-w-md">
                        {data.settlements.map((s) => (
                          <span
                            key={s.id}
                            className={`px-2 py-1 rounded border text-[10px] font-semibold flex items-center gap-1 ${
                              s.action_type === 'carry_forward'
                                ? 'bg-indigo-950/20 border-indigo-900/60 text-indigo-400'
                                : 'bg-teal-955/20 border-teal-900/60 text-teal-400'
                            }`}
                          >
                            <span>
                              {s.leave_category === 'Office Leave' ? 'Office' : s.leave_category === 'Govt Holiday' ? 'Govt' : s.leave_category.replace('Eid-ul-', '')}
                            </span>
                            <span className="opacity-60">•</span>
                            <span className="font-bold">
                              {s.action_type === 'carry_forward' ? 'Carry' : 'Paid'}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {totalActiveCategories === 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-955 border border-slate-800 rounded-lg text-slate-500 font-semibold text-[10px]">
                        <CheckCircle2 className="h-3 w-3" /> Settled (0 Bal)
                      </span>
                    ) : isSettled ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 rounded-lg font-semibold text-[10px]">
                        <CheckCircle2 className="h-3 w-3" /> Settlement Complete
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-955/30 border border-amber-900/30 text-amber-400 rounded-lg font-semibold text-[10px]">
                        <AlertCircle className="h-3 w-3" /> Preferences Pending
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setActiveSettleStaff(staff);
                        setShowSettleModal(true);
                      }}
                      className="inline-flex items-center gap-1 py-1.5 px-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                    >
                      <Edit3 className="h-3 w-3 text-orange-500" />
                      Settle Leaves
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Settle User Modal */}
      {showSettleModal && activeSettleStaff && (
        <AdminSettleUserModal
          showModal={showSettleModal}
          setShowModal={setShowSettleModal}
          staff={activeSettleStaff}
          selectedYear={selectedYear}
          records={records}
          globalSettings={globalSettings}
          settlements={leaveSettlements}
          holidayResponses={holidayResponses}
          onSaveSettlementsBulk={onSaveSettlementsBulk}
          currentUserProfile={currentUserProfile}
        />
      )}
    </div>
  );
};
