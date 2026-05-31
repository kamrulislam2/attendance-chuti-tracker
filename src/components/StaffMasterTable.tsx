import React from 'react';
import { User, Plus, Download, Search } from 'lucide-react';

export interface Profile {
  id: string;
  username: string;
  role: 'admin' | 'supervisor' | 'user';
  username_changes?: number;
  username_request_status?: 'none' | 'pending' | 'approved';
  full_name?: string | null;
  working_hours?: number;
  break_time?: number;
  is_setup_completed?: boolean;
  job_role?: string | null;
  requested_full_name?: string | null;
  requested_working_hours?: number | null;
  requested_break_time?: number | null;
  requested_job_role?: string | null;
  profile_change_status?: 'none' | 'pending' | 'approved' | 'rejected';
  default_sign_in?: string | null;
  default_sign_out?: string | null;
  requested_default_sign_in?: string | null;
  requested_default_sign_out?: string | null;
  needs_supervisor_approval?: boolean;
  allow_reserve?: boolean;
  allow_overtime?: boolean;
  has_edited_profile?: boolean;
  has_changed_password?: boolean;
}

interface StaffMasterTableProps {
  profilesList: Profile[];
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  getUserSummaryStats: (id: string) => { full: number; short: string; overtime: string; reserve: number };
  selectedYear: string;
  setSelectedYear: (val: string) => void;
  availableYears: string[];
  onAddStaffClick: () => void;
  onExportCSV: () => void;
  onExportExcel: () => void;
  onViewDetails: (id: string) => void;
}

export const StaffMasterTable: React.FC<StaffMasterTableProps> = ({
  profilesList,
  searchQuery,
  setSearchQuery,
  getUserSummaryStats,
  selectedYear,
  setSelectedYear,
  availableYears,
  onAddStaffClick,
  onExportCSV,
  onExportExcel,
  onViewDetails,
}) => {
  return (
    <div className="bg-slate-900/40 border border-slate-900 shadow-2xl rounded-2xl overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <User className="h-5 w-5 text-purple-500" /> স্টাফ উপস্থিতি ও ছুটির মাস্টার ডাটাবেজ
        </h3>
        
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 dark:text-slate-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="নাম বা কোডনেম দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs transition-all dark:bg-slate-950/80 dark:border-slate-800 dark:text-white dark:placeholder-slate-500"
          />
        </div>
        
        {/* Master Export Summary buttons */}
        <div className="flex gap-2">
          <button
            onClick={onAddStaffClick}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white border border-purple-800 rounded-lg text-xs font-bold cursor-pointer transition-all shadow-md mr-2"
          >
            <Plus className="h-3.5 w-3.5" /> Add Staff
          </button>
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all border border-emerald-700 shadow-md"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
          <button
            onClick={onExportExcel}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all border border-blue-700 shadow-md"
          >
            <Download className="h-3.5 w-3.5" /> Excel
          </button>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-md"
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
        {profilesList.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            কোনো স্টাফ প্রোফাইল পাওয়া যায়নি।
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-950/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">স্টাফ নাম</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">কোডনেম</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">রোল</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">ফুল লিভ (Unadjusted)</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">শর্ট লিভ (Unadjusted)</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">ওভারটাইম (Unadjusted)</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">রিজার্ভ হলিডে (Unadjusted)</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">স্টাফ বিস্তারিত</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 bg-slate-900/20">
              {profilesList
                .filter(p => 
                  (p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                  (p.username || '').toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((p) => {
                  const stats = getUserSummaryStats(p.id);
                  return (
                    <tr key={p.id} className="hover:bg-slate-900/30 transition-all">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">
                        {p.full_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-350 font-mono">
                        {p.username ? p.username.toUpperCase() : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-350">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border bg-slate-900 border-slate-800 text-slate-300">
                          {p.job_role || (p.role === 'admin' ? 'Admin' : (p.role === 'supervisor' ? 'Supervisor' : 'Staff'))}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-bold font-mono">
                        {stats.full} দিন
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-bold font-mono">
                        {stats.short} ঘণ্টা
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-bold font-mono">
                        {p.allow_overtime ? `${stats.overtime} ঘণ্টা` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-bold font-mono">
                        {p.allow_reserve ? `${stats.reserve} দিন` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => onViewDetails(p.id)}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold cursor-pointer border border-purple-700 transition-all"
                        >
                          View Details
                        </button>
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
