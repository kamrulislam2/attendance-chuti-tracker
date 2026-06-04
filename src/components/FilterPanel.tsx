import React from 'react';
import { SlidersHorizontal, Download, RefreshCw } from 'lucide-react';
import { DateInput } from './DateInput';

interface FilterPanelProps {
  filterType: string;
  setFilterType: (val: string) => void;
  filterStartDate: string;
  setFilterStartDate: (val: string) => void;
  filterEndDate: string;
  setFilterEndDate: (val: string) => void;
  selectedYear: string;
  allowOvertime?: boolean;
  onExportCSV: () => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
  onResetFilters: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filterType,
  setFilterType,
  filterStartDate,
  setFilterStartDate,
  filterEndDate,
  setFilterEndDate,
  selectedYear,
  allowOvertime,
  onExportCSV,
  onExportExcel,
  onExportPDF,
  onResetFilters,
}) => {
  return (
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
            className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">সকল ক্যাটাগরি (All)</option>
            <option value="Short Leave">Short Leave</option>
            <option value="Full Leave">Full Leave</option>
            {allowOvertime && <option value="Overtime">Overtime</option>}
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
            onClick={onExportCSV}
            className="flex-1 flex justify-center items-center gap-1.5 py-2 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all border border-emerald-700 shadow-md"
            title="CSV Export"
            type="button"
          >
            <Download className="h-4 w-4" /> CSV
          </button>
          <button
            onClick={onExportExcel}
            className="flex-1 flex justify-center items-center gap-1.5 py-2 px-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all border border-blue-700 shadow-md"
            title="Excel Export"
            type="button"
          >
            <Download className="h-4 w-4" /> Excel
          </button>
          <button
            onClick={onExportPDF}
            className="flex-1 flex justify-center items-center gap-1.5 py-2 px-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all border border-red-700 shadow-md"
            title="PDF Export"
            type="button"
          >
            <Download className="h-4 w-4" /> PDF
          </button>
          <button
            onClick={onResetFilters}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs cursor-pointer transition-all"
            title="Filters Reset"
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
