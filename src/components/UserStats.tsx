import React from 'react';
import { Clock, Calendar } from 'lucide-react';

interface UserStatsProps {
  stats: {
    shortHours: string | number;
    fullLeaves: string | number;
    reserveLeaves: string | number;
    overtimeHours: string | number;
  };
  allowReserve?: boolean;
  allowOvertime?: boolean;
}

export const UserStats: React.FC<UserStatsProps> = ({
  stats,
  allowReserve,
  allowOvertime,
}) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 w-full">
      {/* Short Leave */}
      <div className="flex-1 min-w-[250px] max-w-[350px] bg-slate-900/40 border border-slate-900 rounded-2xl p-5 flex items-center gap-4">
        <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
          <Clock className="h-6 w-6" />
        </div>
        <div>
          <span className="block text-xs text-slate-400">মোট শর্ট লিভ (Unadjusted)</span>
          <span className="block text-2xl font-bold text-white font-mono mt-0.5">{stats.shortHours} ঘণ্টা</span>
        </div>
      </div>

      {/* Full Leave */}
      <div className="flex-1 min-w-[250px] max-w-[350px] bg-slate-900/40 border border-slate-900 rounded-2xl p-5 flex items-center gap-4">
        <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl border border-violet-500/20">
          <Calendar className="h-6 w-6" />
        </div>
        <div>
          <span className="block text-xs text-slate-400">মোট ফুল লিভ (Unadjusted)</span>
          <span className="block text-2xl font-bold text-white mt-0.5">{stats.fullLeaves} দিন</span>
        </div>
      </div>

      {/* Reserve Leave */}
      {allowReserve && (
        <div className="flex-1 min-w-[250px] max-w-[350px] bg-slate-900/40 border border-slate-900 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs text-slate-400">রিজার্ভ ছুটি (Unadjusted)</span>
            <span className="block text-2xl font-bold text-white mt-0.5">{stats.reserveLeaves} দিন</span>
          </div>
        </div>
      )}

      {/* Overtime */}
      {allowOvertime && (
        <div className="flex-1 min-w-[250px] max-w-[350px] bg-slate-900/40 border border-slate-900 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs text-slate-400">ওভারটাইম (Unadjusted)</span>
            <span className="block text-2xl font-bold text-white font-mono mt-0.5">{stats.overtimeHours} ঘণ্টা</span>
          </div>
        </div>
      )}
    </div>
  );
};
