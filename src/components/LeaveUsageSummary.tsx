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
  eligibleOfficeLeave = true,
  eligibleGovtHoliday = true,
  halfYearlyStats,
}) => {
  let officeRemainingDisplay = `${officeLeaveRemaining} দিন`;
  let officeTotalDisplay = `${officeLeaveTotal} দিন`;
  let officeSubtext = '';

  if (halfYearlyStats) {
    const isH1 = halfYearlyStats.currentHalf === 1;
    officeRemainingDisplay = isH1 
      ? `${halfYearlyStats.h1Remaining} দিন` 
      : `${halfYearlyStats.h2Remaining} দিন`;
    officeTotalDisplay = isH1 
      ? `${halfYearlyStats.h1Total} দিন` 
      : `${halfYearlyStats.h2Total} দিন`;
    officeSubtext = isH1
      ? 'H1 (জান-জুন) কোটা: 7 দিন'
      : `H2 (জুল-ডিসে) কোটা: 7 দিন + ${halfYearlyStats.carryForward} দিন ক্যারিওভার`;
  }

  return (
    <div className="bg-slate-955/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-4 font-sans text-xs shrink-0 self-start md:mt-0 mt-4 w-full">
      <h4 className="font-bold text-white border-b border-slate-850 pb-2 mb-1 text-[11px] uppercase tracking-wider">
        ছুটি ব্যবহারের বিবরণী ({selectedYear})
      </h4>

      <div className="space-y-3">
        {/* Office Leave Balance */}
        <div className="bg-slate-900/30 p-2.5 rounded-lg border border-slate-850">
          <span className="text-indigo-400 block text-[9px] uppercase font-semibold">অফিস বরাদ্দকৃত ছুটি</span>
          <div className="flex justify-between items-center mt-1">
            <span className="text-white text-xs font-bold font-mono">অবশিষ্ট: {officeRemainingDisplay}</span>
            <span className="text-slate-500 text-[10px] font-mono">মোট: {officeTotalDisplay}</span>
          </div>
          {officeSubtext && (
            <div className="text-[9px] text-slate-450 mt-1.5 pt-1.5 border-t border-slate-800/40">
              {officeSubtext}
            </div>
          )}
        </div>

        {/* Govt Holiday Balance */}
        {govtHolidayTotal > 0 && (
          <div className="bg-slate-900/30 p-2.5 rounded-lg border border-slate-850">
            <span className="text-teal-400 block text-[9px] uppercase font-semibold">সরকারি ছুটি</span>
            <div className="flex justify-between items-center mt-1">
              <span className="text-white text-xs font-bold font-mono">অবশিষ্ট: {govtHolidayRemaining} দিন</span>
              <span className="text-slate-500 text-[10px] font-mono">মোট: {govtHolidayTotal} দিন</span>
            </div>
          </div>
        )}

        {/* Eid-ul-Fitr Balance */}
        {eidFitrRemaining > 0 && (
          <div className="bg-slate-900/30 p-2.5 rounded-lg border border-slate-850">
            <span className="text-amber-400 block text-[9px] uppercase font-semibold">ঈদুল ফিতরের ছুটি</span>
            <div className="flex justify-between items-center mt-1">
              <span className="text-white text-xs font-bold font-mono">অবশিষ্ট: {eidFitrRemaining} দিন</span>
              <span className="text-slate-500 text-[10px] font-mono">মোট: {eidFitrTotal} দিন</span>
            </div>
          </div>
        )}

        {/* Eid-ul-Adha Balance */}
        {eidAdhaRemaining > 0 && (
          <div className="bg-slate-900/30 p-2.5 rounded-lg border border-slate-850">
            <span className="text-amber-400 block text-[9px] uppercase font-semibold">ঈদুল আজহার ছুটি</span>
            <div className="flex justify-between items-center mt-1">
              <span className="text-white text-xs font-bold font-mono">অবশিষ্ট: {eidAdhaRemaining} দিন</span>
              <span className="text-slate-500 text-[10px] font-mono">মোট: {eidAdhaTotal} দিন</span>
            </div>
          </div>
        )}

        {/* Full Leave Stat */}
        <div className="flex justify-between items-center bg-slate-900/30 p-2.5 rounded-lg border border-slate-850">
          <div>
            <span className="text-slate-400 block text-[9px] uppercase font-semibold">ফুল লিভ ভোগকৃত</span>
            <span className="text-white text-xs font-bold font-mono">{fullLeaves} দিন</span>
          </div>
        </div>

        {/* Short Leave Stat */}
        {shortHours && shortHours !== '00:00' && shortHours !== '-00:00' && (
          <div className="flex justify-between items-center bg-slate-900/30 p-2.5 rounded-lg border border-slate-850">
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-semibold">শর্ট লিভ ভোগকৃত</span>
              <span className="text-white text-xs font-bold font-mono">{shortHours} ঘণ্টা</span>
            </div>
          </div>
        )}

        {/* Overtime Stat */}
        {allowOvertime && overtimeHours && overtimeHours !== '00:00' && overtimeHours !== '-00:00' && (
          <div className="flex justify-between items-center bg-slate-900/30 p-2.5 rounded-lg border border-slate-850">
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-semibold">সর্বমোট ওভারটাইম</span>
              <span className="text-white text-xs font-bold font-mono">{overtimeHours} ঘণ্টা</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
