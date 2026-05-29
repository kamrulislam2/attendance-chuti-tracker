import React from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { ChutiRecord } from '@/utils/offlineSync';

interface UserRecordsTableProps {
  records: ChutiRecord[];
  allowOvertime?: boolean;
  allowReserve?: boolean;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  availableYears: string[];
  onAddLeaveClick: () => void;
  onToggleAdjustment: (r: ChutiRecord) => void;
  onDeleteClick: (r: ChutiRecord) => void;
  onRevisionClick: (r: ChutiRecord) => void;
  formatDate: (d: string) => string;
  formatTimeToAMPM: (t: string | null) => string;
  getCleanComment: (c: string | null | undefined) => string;
  renderStatusBadge: (r: ChutiRecord) => React.ReactNode;
}

export const UserRecordsTable: React.FC<UserRecordsTableProps> = ({
  records,
  allowOvertime,
  allowReserve,
  selectedYear,
  setSelectedYear,
  availableYears,
  onAddLeaveClick,
  onToggleAdjustment,
  onDeleteClick,
  onRevisionClick,
  formatDate,
  formatTimeToAMPM,
  getCleanComment,
  renderStatusBadge,
}) => {
  return (
    <div className="bg-slate-900/40 border border-slate-900 shadow-2xl rounded-2xl overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-col">
          <h3 className="text-base font-bold text-white">আমার বাৎসরিক ছুটির রেকর্ডসমূহ</h3>
          <span className="text-xs text-slate-400 mt-0.5">সর্বমোট: {records.length}টি এন্ট্রি</span>
        </div>
        
        {/* Export buttons for User/Supervisor */}
        <div className="flex gap-2">
          <button
            onClick={onAddLeaveClick}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all border border-blue-700 shadow-md"
          >
            <Plus className="h-3.5 w-3.5" /> Add Leave
          </button>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-md"
          >
            <option value="all" className="bg-slate-900 text-white">All</option>
            {availableYears.map(y => (
              <option key={y} value={y} className="bg-slate-900 text-white">
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {records.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            কোনো ছুটির রেকর্ড পাওয়া যায়নি। নতুন এন্ট্রি সাবমিট করুন।
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-950/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">তারিখ</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">ধরন</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Adjustment</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">সাইন ইন/আউট</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">লিভ আওয়ার</th>
                {allowOvertime && <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">ওভারটাইম</th>}
                {allowReserve && <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">রিজার্ভ ছুটি</th>}
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">মন্তব্য</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">একশন</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 bg-slate-900/20">
              {records.map((r) => {
                const isTemp = typeof r.id === 'string' && r.id.startsWith('temp-');
                return (
                  <tr key={r.id} className="hover:bg-slate-900/30 transition-all">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white flex items-center gap-2">
                      {formatDate(r.date)}
                      {isTemp && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/80 border border-amber-800 text-amber-400 animate-pulse">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-350">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                        r.leave_type === 'Full Leave' 
                          ? 'bg-red-950/50 border border-red-800 text-red-300' 
                          : r.leave_type === 'Reserve'
                          ? 'bg-amber-950/50 border border-amber-800 text-amber-300'
                          : r.leave_type === 'Overtime'
                          ? 'bg-emerald-950/50 border border-emerald-800 text-emerald-300'
                          : 'bg-blue-950/50 border border-blue-800 text-blue-300'
                      }`}>
                        {r.leave_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-350">
                      {r.leave_type === 'Reserve' ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onToggleAdjustment(r)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              (r.reserve_adjustment_status === 'approved' || r.reserve_adjustment_status === 'pending' || r.adjustment) 
                                ? 'bg-blue-600' 
                                : 'bg-slate-800'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                (r.reserve_adjustment_status === 'approved' || r.reserve_adjustment_status === 'pending' || r.adjustment) 
                                  ? 'translate-x-4' 
                                  : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className="text-xs font-semibold">
                            {(r.reserve_adjustment_status === 'approved' || r.adjustment) ? (
                              <span className="text-emerald-400">হ্যাঁ</span>
                            ) : r.reserve_adjustment_status === 'pending' ? (
                              <span className="text-amber-400 animate-pulse">হ্যাঁ</span>
                            ) : r.reserve_adjustment_status === 'rejected' ? (
                              <span className="text-slate-500">না (Rejected)</span>
                            ) : (
                              <span className="text-slate-500">না</span>
                            )}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onToggleAdjustment(r)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              (r.adjustment || r.adjusted_hour || r.reserve_adjustment_status === 'pending') ? 'bg-blue-600' : 'bg-slate-800'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                (r.adjustment || r.adjusted_hour || r.reserve_adjustment_status === 'pending') ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className="text-xs font-semibold">
                            {r.reserve_adjustment_status === 'pending' ? (
                              <span className="text-amber-400 animate-pulse font-semibold">পেন্ডিং</span>
                            ) : r.adjustment ? (
                              <span className="text-blue-400">হ্যাঁ</span>
                            ) : r.adjusted_hour ? (
                              <span className="text-cyan-400 font-mono">আংশিক ({r.adjusted_hour.toString().split('.')[0].substring(0, 5)})</span>
                            ) : r.reserve_adjustment_status === 'rejected' ? (
                              <span className="text-slate-500">না (Rejected)</span>
                            ) : (
                              <span className="text-slate-500">না</span>
                            )}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-350 font-mono">
                      {r.leave_type === 'Reserve' || r.leave_type === 'Full Leave' ? '-' : `${formatTimeToAMPM(r.sign_in_time)} / ${formatTimeToAMPM(r.sign_out_time)}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-mono font-bold">
                      {r.leave_type === 'Reserve' || r.leave_type === 'Full Leave' || r.leave_type === 'Overtime' ? '-' : (r.leave_hour ? r.leave_hour.toString().split('.')[0].substring(0, 5) : '-')}
                    </td>
                    {allowOvertime && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-mono font-bold">
                        {r.leave_type === 'Overtime' ? (r.leave_hour ? r.leave_hour.toString().split('.')[0].substring(0, 5) : '-') : '-'}
                      </td>
                    )}
                    {allowReserve && (
                      <td className="px-6 py-4 text-sm text-slate-350 max-w-[150px] truncate">
                        {r.reserve_holiday || '-'}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-slate-400 max-w-[200px] truncate" title={getCleanComment(r.comment)}>
                      {getCleanComment(r.comment) || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                      <div className="flex gap-1.5">
                        {r.status === 'needs_review' && (
                          <button
                            onClick={() => onRevisionClick(r)}
                            className="text-amber-400 hover:text-amber-300 p-1.5 rounded-lg hover:bg-amber-500/10 cursor-pointer transition-all animate-pulse"
                            title="সংশোধন করুন (Revision)"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteClick(r)}
                          className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer transition-all"
                          title="Delete Entry"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex flex-col gap-1 items-end">
                        {renderStatusBadge(r)}
                        {r.is_edited && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-950/40 border border-blue-800 text-blue-400">
                            (Edited)
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
