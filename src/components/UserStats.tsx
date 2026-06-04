import React, { useState } from 'react';
import { Clock, Calendar, History, Info } from 'lucide-react';
import { StatCard } from './StatCard';
import { formatDate, HalfYearlyOfficeLeaveStats } from '@/utils/dashboardHelpers';

interface UserStatsProps {
  stats: {
    shortHours: string | number;
    fullLeaves: string | number;
    overtimeHours: string | number;
  };
  officeLeaveStats?: {
    total: number;
    taken: number;
    remaining: number;
  };
  govtHolidayStats?: {
    total: number;
    taken: number;
    reserved: number;
    paid: number;
    remaining: number;
  };
  allowOvertime?: boolean;
  respondedHolidays?: { date: string; name: string; response: string }[];
  eligibleOfficeLeave?: boolean;
  eligibleGovtHoliday?: boolean;
  halfYearlyStats?: HalfYearlyOfficeLeaveStats;

  // Conversion props
  convertedDays?: number;
  convertedHours?: number;
  onConvertToFullLeave?: () => void;
  hasConvertibleHours?: boolean;
}

export const UserStats: React.FC<UserStatsProps> = ({
  stats,
  officeLeaveStats,
  govtHolidayStats,
  allowOvertime,
  respondedHolidays = [],
  eligibleOfficeLeave = true,
  eligibleGovtHoliday = true,
  halfYearlyStats,
  convertedDays = 0,
  convertedHours = 0,
  onConvertToFullLeave,
  hasConvertibleHours = false,
}) => {
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showOfficeDetailsModal, setShowOfficeDetailsModal] = useState(false);

  // Office leave display determinations based on half-yearly split
  const showOfficeCard = eligibleOfficeLeave !== false && officeLeaveStats;
  const showGovtCard = eligibleGovtHoliday !== false && govtHolidayStats;

  let officeRemainingDisplay = officeLeaveStats ? `${officeLeaveStats.remaining} দিন` : '0 দিন';
  const officeTotalDisplay = officeLeaveStats ? `${officeLeaveStats.total} দিন` : '0 দিন';
  let officeSubtitle = officeLeaveStats ? `মোট বরাদ্দ: ${officeLeaveStats.total} দিন (ভোগকৃত: ${officeLeaveStats.taken} দিন)` : '';

  if (halfYearlyStats) {
    const isH1 = halfYearlyStats.currentHalf === 1;
    officeRemainingDisplay = isH1 
      ? `${halfYearlyStats.h1Remaining} দিন` 
      : `${halfYearlyStats.h2Remaining} দিন`;
    
    officeSubtitle = isH1
      ? `H1 (জান-জুন) বরাদ্দ: ${halfYearlyStats.h1Total} দিন | ভোগকৃত: ${halfYearlyStats.h1Taken} দিন`
      : `H2 (জুল-ডিসে) বরাদ্দ: 7 দিন + ${halfYearlyStats.carryForward} দিন ক্যারিওভার | ভোগকৃত: ${halfYearlyStats.h2Taken} দিন`;
  }

  return (
    <div className="flex flex-wrap justify-center gap-4 w-full">
      {/* Office Leave */}
      {showOfficeCard && officeLeaveStats && (
        <StatCard
          icon={Calendar}
          iconBgClass="bg-indigo-500/10"
          iconColorClass="text-indigo-400"
          iconBorderClass="border-indigo-500/20"
          title={halfYearlyStats ? `অফিস বরাদ্দকৃত ছুটি (অবশিষ্ট - H${halfYearlyStats.currentHalf})` : "অফিস বরাদ্দকৃত ছুটি (অবশিষ্ট)"}
          value={officeRemainingDisplay}
          subtitle={officeSubtitle}
          action={halfYearlyStats ? (
            <button
              type="button"
              onClick={() => setShowOfficeDetailsModal(true)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 rounded-lg cursor-pointer transition-all shadow-sm flex items-center justify-center shrink-0"
              title="অর্ধবার্ষিক ছুটির হিসাব"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          ) : undefined}
        />
      )}

      {/* Govt Holiday */}
      {showGovtCard && govtHolidayStats && (
        <StatCard
          icon={Calendar}
          iconBgClass="bg-teal-500/10"
          iconColorClass="text-teal-400"
          iconBorderClass="border-teal-500/20"
          title="সরকারি ছুটি (রিজার্ভ)"
          value={`${govtHolidayStats.remaining} দিন`}
          subtitle={`মোট সরকারি ছুটি: ${govtHolidayStats.total} দিন | পেমেন্ট: ${govtHolidayStats.paid} দিন | রিজার্ভ: ${govtHolidayStats.reserved} দিন | ভোগকৃত: ${govtHolidayStats.taken} দিন`}
          action={respondedHolidays && respondedHolidays.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-teal-400 border border-slate-700 rounded-lg cursor-pointer transition-all shadow-sm flex items-center justify-center shrink-0"
              title="সরকারি ছুটির রেসপন্স ইতিহাস"
            >
              <History className="h-3.5 w-3.5" />
            </button>
          ) : undefined}
        />
      )}

      {/* Short Leave */}
      <StatCard
        icon={Clock}
        iconBgClass="bg-blue-500/10"
        iconColorClass="text-blue-400"
        iconBorderClass="border-blue-500/20"
        title="মোট শর্ট লিভ (Unadjusted)"
        value={`${stats.shortHours} ঘণ্টা`}
        subtitle={convertedHours > 0 ? `কনভার্ট করা হয়েছে: ${convertedHours} ঘণ্টা` : undefined}
        action={onConvertToFullLeave && hasConvertibleHours ? (
          <button
            type="button"
            onClick={onConvertToFullLeave}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-550 text-white rounded text-[10px] font-bold cursor-pointer transition-all border border-blue-700 shadow-sm flex items-center justify-center shrink-0"
            title="ফুল লিভে রূপান্তর করুন"
          >
            Add to Full Leave
          </button>
        ) : undefined}
      />

      {/* Full Leave */}
      <StatCard
        icon={Calendar}
        iconBgClass="bg-violet-500/10"
        iconColorClass="text-violet-400"
        iconBorderClass="border-violet-500/20"
        title="মোট ফুল লিভ"
        value={`${stats.fullLeaves} দিন`}
        subtitle={convertedDays > 0 ? `শর্ট লিভ থেকে যুক্ত: +${convertedDays} দিন` : undefined}
      />

      {/* Overtime */}
      {allowOvertime && (
        <StatCard
          icon={Clock}
          iconBgClass="bg-emerald-500/10"
          iconColorClass="text-emerald-400"
          iconBorderClass="border-emerald-500/20"
          title="ওভারটাইম (Unadjusted)"
          value={`${stats.overtimeHours} ঘণ্টা`}
        />
      )}

      {/* Govt Holiday History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden font-sans">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-teal-900/10 blur-[80px] pointer-events-none" />
            
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="h-4 w-4 text-teal-400" /> সরকারি ছুটির রেসপন্স ইতিহাস
              </h3>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-450 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto pr-1">
              {respondedHolidays && respondedHolidays.length > 0 ? (
                <div className="border border-slate-850 rounded-xl overflow-hidden bg-slate-955/40">
                  <table className="w-full text-xs text-slate-350">
                    <thead>
                      <tr className="bg-slate-900/60 border-b border-slate-850 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                        <th className="py-2 px-3 text-left">তারিখ</th>
                        <th className="py-2 px-3 text-left">ছুটির নাম</th>
                        <th className="py-2 px-3 text-right">রেসপন্স</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {respondedHolidays.map((h, i) => (
                        <tr key={i} className="hover:bg-slate-900/20 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-teal-400">{formatDate(h.date)}</td>
                          <td className="py-2.5 px-3 text-slate-200">{h.name}</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              h.response === 'reserve'
                                ? 'bg-teal-955/60 border border-teal-900 text-teal-400'
                                : 'bg-emerald-955/60 border border-emerald-900 text-emerald-400'
                            }`}>
                              {h.response === 'reserve' ? 'Reserve' : 'Paid'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-6 text-xs text-slate-500 font-medium">
                  কোনো সরকারি ছুটির রেসপন্স রেকর্ড নেই।
                </p>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800/80 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-all"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Half-Yearly Office Leave Details Modal */}
      {showOfficeDetailsModal && halfYearlyStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden font-sans">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-900/10 blur-[80px] pointer-events-none" />
            
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-400" /> অর্ধবার্ষিক অফিস ছুটির বিবরণী
              </h3>
              <button 
                onClick={() => setShowOfficeDetailsModal(false)}
                className="text-slate-450 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* H1 Section */}
              <div className="bg-slate-955/40 border border-slate-850 p-4 rounded-xl">
                <h4 className="text-xs font-bold text-indigo-400 mb-2 border-b border-slate-800 pb-1.5 uppercase tracking-wider">
                  ১ম অর্ধবার্ষিক (জানুয়ারি - জুন)
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-850/60">
                    <span className="text-slate-500 block text-[9px] uppercase font-semibold">বরাদ্দ</span>
                    <span className="text-slate-200 font-bold font-mono">{halfYearlyStats.h1Total} দিন</span>
                  </div>
                  <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-850/60">
                    <span className="text-slate-500 block text-[9px] uppercase font-semibold">ভোগকৃত</span>
                    <span className="text-slate-200 font-bold font-mono">{halfYearlyStats.h1Taken} দিন</span>
                  </div>
                  <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-850/60">
                    <span className="text-slate-500 block text-[9px] uppercase font-semibold">অবশিষ্ট</span>
                    <span className={`font-bold font-mono ${halfYearlyStats.h1Remaining < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {halfYearlyStats.h1Remaining} দিন
                    </span>
                  </div>
                </div>
                {halfYearlyStats.h1Remaining < 0 && (
                  <p className="text-[10px] text-red-400 mt-2">
                    ⚠️ ১ম অর্ধবার্ষিকে অতিরিক্ত ছুটি নেওয়া হয়েছে, যা বেতন থেকে কাটা যেতে পারে।
                  </p>
                )}
              </div>

              {/* H2 Section */}
              <div className="bg-slate-955/40 border border-slate-850 p-4 rounded-xl">
                <h4 className="text-xs font-bold text-indigo-400 mb-2 border-b border-slate-800 pb-1.5 uppercase tracking-wider">
                  ২য় অর্ধবার্ষিক (জুলাই - ডিসেম্বর)
                </h4>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-850/60">
                    <span className="text-slate-500 block text-[9px] uppercase font-semibold">ভিত্তি</span>
                    <span className="text-slate-200 font-bold font-mono">7 দিন</span>
                  </div>
                  <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-850/60">
                    <span className="text-slate-500 block text-[9px] uppercase font-semibold">ক্যারিওভার</span>
                    <span className="text-slate-200 font-bold font-mono">+{halfYearlyStats.carryForward} দিন</span>
                  </div>
                  <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-850/60">
                    <span className="text-slate-500 block text-[9px] uppercase font-semibold">ভোগকৃত</span>
                    <span className="text-slate-200 font-bold font-mono">{halfYearlyStats.h2Taken} দিন</span>
                  </div>
                  <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-850/60">
                    <span className="text-slate-500 block text-[9px] uppercase font-semibold">অবশিষ্ট</span>
                    <span className={`font-bold font-mono ${halfYearlyStats.h2Remaining < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {halfYearlyStats.h2Remaining} দিন
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800/80 flex justify-end">
              <button
                type="button"
                onClick={() => setShowOfficeDetailsModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-all"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
