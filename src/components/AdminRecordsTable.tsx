import React from 'react';
import { Calendar, SlidersHorizontal, Download, RefreshCw, Edit, Trash2, Search } from 'lucide-react';
import { ChutiRecord } from '@/utils/offlineSync';
import { DateInput } from './DateInput';

interface AdminRecordsTableProps {
  records: ChutiRecord[];
  allowOvertime?: boolean;
  allowReserve?: boolean;
  filterType: string;
  setFilterType: (val: string) => void;
  filterStartDate: string;
  setFilterStartDate: (val: string) => void;
  filterEndDate: string;
  setFilterEndDate: (val: string) => void;
  onResetFilters: () => void;
  onExportCSV: (filtered: ChutiRecord[], searchTerm: string) => void;
  onExportExcel: (filtered: ChutiRecord[], searchTerm: string) => void;
  onToggleAdjustment: (r: ChutiRecord) => void;
  onEditClick: (r: ChutiRecord) => void;
  onDeleteClick: (r: ChutiRecord) => void;
  formatDate: (d: string) => string;
  formatTimeToAMPM: (t: string | null) => string;
  getCleanComment: (c: string | null | undefined) => string;
  renderStatusBadge: (r: ChutiRecord) => React.ReactNode;
  selectedYear: string;
}

export const AdminRecordsTable: React.FC<AdminRecordsTableProps> = ({
  records,
  allowOvertime,
  allowReserve,
  filterType,
  setFilterType,
  filterStartDate,
  setFilterStartDate,
  filterEndDate,
  setFilterEndDate,
  onResetFilters,
  onExportCSV,
  onExportExcel,
  onToggleAdjustment,
  onEditClick,
  onDeleteClick,
  formatDate,
  formatTimeToAMPM,
  getCleanComment,
  renderStatusBadge,
  selectedYear,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredRecords = React.useMemo(() => {
    return records.filter((r) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const commentMatch = (r.comment || '').toLowerCase().includes(term);
      const typeMatch = (r.leave_type || '').toLowerCase().includes(term);
      const reserveMatch = (r.reserve_holiday || '').toLowerCase().includes(term);
      return commentMatch || typeMatch || reserveMatch;
    });
  }, [records, searchTerm]);

  const handleReset = () => {
    setSearchTerm('');
    onResetFilters();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Filtering Panel for viewed staff */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-900 shadow-2xl rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-3 mb-4">
          <SlidersHorizontal className="h-4 w-4 text-blue-500" /> স্টাফ ছুটির ফিল্টারিং প্যানেল
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filter Leave Type */}
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">ছুটির ধরন</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">সকল ক্যাটাগরি (All)</option>
              <option value="Short Leave">Short Leave</option>
              <option value="Full Leave">Full Leave</option>
              {allowOvertime && <option value="Overtime">Overtime</option>}
              {allowReserve && <option value="Reserve">Reserve</option>}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">শুরুর তারিখ</label>
            <div className="mt-1">
              <DateInput
                min={selectedYear === 'all' ? undefined : `${selectedYear}-01-01`}
                max={selectedYear === 'all' ? undefined : `${selectedYear}-12-31`}
                value={filterStartDate}
                onChange={setFilterStartDate}
                className="bg-slate-955"
              />
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">শেষ তারিখ</label>
            <div className="mt-1">
              <DateInput
                min={selectedYear === 'all' ? undefined : `${selectedYear}-01-01`}
                max={selectedYear === 'all' ? undefined : `${selectedYear}-12-31`}
                value={filterEndDate}
                onChange={setFilterEndDate}
                className="bg-slate-955"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-end gap-2">
            <button
              onClick={() => onExportCSV(filteredRecords, searchTerm)}
              className="flex-1 flex justify-center items-center gap-1.5 py-2 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all border border-emerald-700 shadow-md"
              title="CSV Export"
            >
              <Download className="h-4 w-4" /> CSV
            </button>
            <button
              onClick={() => onExportExcel(filteredRecords, searchTerm)}
              className="flex-1 flex justify-center items-center gap-1.5 py-2 px-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all border border-blue-700 shadow-md"
            >
              <Download className="h-4 w-4" /> Excel
            </button>
            <button
              onClick={handleReset}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs cursor-pointer transition-all"
              title="Filters Reset"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Records Table for Viewed Staff */}
      <div className="bg-slate-900/40 border border-slate-900 shadow-2xl rounded-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" /> ছুটির বিবরণী রেকর্ডসমূহ
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Quick Search */}
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 dark:text-slate-500">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="মন্তব্য বা ছুটির ধরণ দিয়ে খুঁজুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs transition-all dark:bg-slate-955/80 dark:border-slate-800 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>
            <span className="text-xs text-slate-400 shrink-0">রেকর্ড সংখ্যা: {filteredRecords.length}টি</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              এই স্টাফের জন্য কোনো ছুটির রেকর্ড পাওয়া যায়নি।
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
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/30 transition-all">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">
                      {formatDate(r.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-350">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                        r.leave_type === 'Full Leave' 
                          ? 'bg-red-955/50 border border-red-800 text-red-300' 
                          : r.leave_type === 'Reserve'
                          ? 'bg-amber-955/50 border border-amber-800 text-amber-300'
                          : r.leave_type === 'Overtime'
                          ? 'bg-emerald-955/50 border border-emerald-800 text-emerald-300'
                          : 'bg-blue-955/50 border border-blue-800 text-blue-300'
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
                      <td className="px-6 py-4 text-sm text-slate-355 max-w-[120px] truncate">
                        {r.reserve_holiday || '-'}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-slate-400 max-w-[150px] truncate" title={getCleanComment(r.comment)}>
                      {getCleanComment(r.comment) || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => onEditClick(r)}
                          className="text-blue-400 hover:text-blue-300 p-1.5 rounded-lg hover:bg-blue-500/10 cursor-pointer transition-all"
                          title="এডিট করুন (Admin Edit)"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteClick(r)}
                          className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer transition-all"
                          title="Delete Record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex flex-col gap-1 items-end">
                        {renderStatusBadge(r)}
                        {r.is_edited && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-955/40 border border-blue-800 text-blue-400">
                            (Edited)
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
