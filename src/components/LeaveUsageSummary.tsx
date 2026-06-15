import React from 'react';
import { HalfYearlyOfficeLeaveStats } from '@/utils/dashboardHelpers';

interface LeaveUsageSummaryProps {
  selectedYear: string;
  officeLeaveRemaining: number;
  officeLeaveTotal: number;
  govtHolidayRemaining: number;
  govtHolidayTotal: number;
  eidFitrRemaining: number;
  eidFitrTotal: number;
  eidAdhaRemaining: number;
  eidAdhaTotal: number;
  fullLeaves: number;
  shortHours: string;
  overtimeHours: string;
  allowOvertime?: boolean;
  eligibleOfficeLeave?: boolean;
  eligibleGovtHoliday?: boolean;
  halfYearlyStats?: HalfYearlyOfficeLeaveStats;
  officeDeduction?: number;
  govtDeduction?: number;
  eidFitrDeduction?: number;
  eidAdhaDeduction?: number;
}

export const LeaveUsageSummary: React.FC<LeaveUsageSummaryProps> = ({
  selectedYear,
  officeLeaveRemaining,
  officeLeaveTotal,
  govtHolidayRemaining,
  govtHolidayTotal,
  eidFitrRemaining,
  eidFitrTotal,
  eidAdhaRemaining,
  eidAdhaTotal,
  fullLeaves,
  shortHours,
  overtimeHours,
  allowOvertime = false,
  halfYearlyStats,
  officeDeduction = 0,
  govtDeduction = 0,
  eidFitrDeduction = 0,
  eidAdhaDeduction = 0,
}) => {
  let officeRemainingVal = officeLeaveRemaining;
  let officeTotalDisplay = `${officeLeaveTotal} days`;
  let officeSubtext = '';

  if (halfYearlyStats) {
    const isH1 = halfYearlyStats.currentHalf === 1;
    officeRemainingVal = isH1 
      ? halfYearlyStats.h1Remaining 
      : halfYearlyStats.h2Remaining;
    officeTotalDisplay = isH1 
      ? `${halfYearlyStats.h1Total} days` 
      : `${halfYearlyStats.h2Total} days`;
    officeSubtext = isH1
      ? 'H1 (Jan-Jun) Allowance: 7 days'
      : `H2 (Jul-Dec) Allowance: 7 days + ${halfYearlyStats.carryForward} days carryover`;
  }

  const finalOfficeRemaining = officeRemainingVal - officeDeduction;
  const isOfficeChanged = officeDeduction > 0;

  const finalGovtRemaining = govtHolidayRemaining - govtDeduction;
  const isGovtChanged = govtDeduction > 0;

  const finalEidFitrRemaining = eidFitrRemaining - eidFitrDeduction;
  const isEidFitrChanged = eidFitrDeduction > 0;

  const finalEidAdhaRemaining = eidAdhaRemaining - eidAdhaDeduction;
  const isEidAdhaChanged = eidAdhaDeduction > 0;

  return (
    <div className="bg-slate-955/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-4 font-sans text-xs shrink-0 self-start md:mt-0 mt-4 w-full">
      <h4 className="font-bold text-white border-b border-slate-850 pb-2 mb-1 text-[11px] uppercase tracking-wider">
        Leave Usage Summary ({selectedYear})
      </h4>

      <div className="space-y-3">
        {/* Office Leave Balance */}
        <div className="bg-slate-900/30 p-2.5 rounded-lg border border-slate-850">
          <span className="text-orange-400 block text-[9px] uppercase font-semibold">Allocated Office Leave</span>
          <div className="flex justify-between items-center mt-1">
            {isOfficeChanged ? (
              <span className="text-orange-400 text-xs font-bold font-mono animate-pulse">
                Remaining: {finalOfficeRemaining} days (-{officeDeduction})
              </span>
            ) : (
              <span className="text-white text-xs font-bold font-mono">
                Remaining: {officeRemainingVal} days
              </span>
            )}
            <span className="text-slate-500 text-[10px] font-mono">Total: {officeTotalDisplay}</span>
          </div>
          {officeSubtext && (
            <div className="text-[9px] text-slate-455 mt-1.5 pt-1.5 border-t border-slate-800/40">
              {officeSubtext}
            </div>
          )}
        </div>

        {/* Govt Holiday Balance */}
        {govtHolidayTotal > 0 && (
          <div className="bg-slate-900/30 p-2.5 rounded-lg border border-slate-850">
            <span className="text-teal-400 block text-[9px] uppercase font-semibold">Govt Holiday</span>
            <div className="flex justify-between items-center mt-1">
              {isGovtChanged ? (
                <span className="text-teal-400 text-xs font-bold font-mono animate-pulse">
                  Remaining: {finalGovtRemaining} days (-{govtDeduction})
                </span>
              ) : (
                <span className="text-white text-xs font-bold font-mono">
                  Remaining: {govtHolidayRemaining} days
                </span>
              )}
              <span className="text-slate-500 text-[10px] font-mono">Total: {govtHolidayTotal} days</span>
            </div>
          </div>
        )}

        {/* Eid-ul-Fitr Balance */}
        {eidFitrRemaining > 0 && (
          <div className="bg-slate-900/30 p-2.5 rounded-lg border border-slate-850">
            <span className="text-amber-400 block text-[9px] uppercase font-semibold">Eid-ul-Fitr Leave</span>
            <div className="flex justify-between items-center mt-1">
              {isEidFitrChanged ? (
                <span className="text-amber-400 text-xs font-bold font-mono animate-pulse">
                  Remaining: {finalEidFitrRemaining} days (-{eidFitrDeduction})
                </span>
              ) : (
                <span className="text-white text-xs font-bold font-mono">
                  Remaining: {eidFitrRemaining} days
                </span>
              )}
              <span className="text-slate-500 text-[10px] font-mono">Total: {eidFitrTotal} days</span>
            </div>
          </div>
        )}

        {/* Eid-ul-Adha Balance */}
        {eidAdhaRemaining > 0 && (
          <div className="bg-slate-900/30 p-2.5 rounded-lg border border-slate-850">
            <span className="text-amber-400 block text-[9px] uppercase font-semibold">Eid-ul-Adha Leave</span>
            <div className="flex justify-between items-center mt-1">
              {isEidAdhaChanged ? (
                <span className="text-amber-400 text-xs font-bold font-mono animate-pulse">
                  Remaining: {finalEidAdhaRemaining} days (-{eidAdhaDeduction})
                </span>
              ) : (
                <span className="text-white text-xs font-bold font-mono">
                  Remaining: {eidAdhaRemaining} days
                </span>
              )}
              <span className="text-slate-500 text-[10px] font-mono">Total: {eidAdhaTotal} days</span>
            </div>
          </div>
        )}

        {/* Full Leave Stat */}
        {fullLeaves > 0 && (
          <div className="flex justify-between items-center bg-slate-900/30 p-2.5 rounded-lg border border-slate-850">
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-semibold">Full Leave Taken</span>
              <span className="text-white text-xs font-bold font-mono">{fullLeaves} days</span>
            </div>
          </div>
        )}

        {/* Short Leave Stat */}
        {shortHours && shortHours !== '00:00' && shortHours !== '-00:00' && (
          <div className="flex justify-between items-center bg-slate-900/30 p-2.5 rounded-lg border border-slate-850">
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-semibold">Short Leave Taken</span>
              <span className="text-white text-xs font-bold font-mono">{shortHours} hrs</span>
            </div>
          </div>
        )}

        {/* Overtime Stat */}
        {allowOvertime && overtimeHours && overtimeHours !== '00:00' && overtimeHours !== '-00:00' && (
          <div className="flex justify-between items-center bg-slate-900/30 p-2.5 rounded-lg border border-slate-850">
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-semibold">Total Overtime</span>
              <span className="text-white text-xs font-bold font-mono">{overtimeHours} hrs</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
