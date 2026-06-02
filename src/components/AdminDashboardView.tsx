import React from 'react';
import { 
  User, 
  Clock, 
  Calendar, 
  ArrowLeft, 
  AlertTriangle, 
  Edit, 
  Trash2 
} from 'lucide-react';
import { Profile, ChutiRecordWithProfile } from '@/types';
import { ChutiRecord } from '@/utils/offlineSync';
import { LeavesRecordsTable } from './LeavesRecordsTable';
import { StaffMasterTable } from './StaffMasterTable';
import { formatDate, formatTimeToAMPM, getCleanComment, formatWorkingHours } from '@/utils/dashboardHelpers';

interface AdminDashboardViewProps {
  profilesList: Profile[];
  viewingStaffId: string | null;
  setViewingStaffId: (id: string | null) => void;
  staffProfile: Profile | null;
  individualRecords: ChutiRecordWithProfile[];
  staffStats: {
    shortHours: string;
    overtimeHours: string;
    fullLeaves: number;
    reserveLeaves: number;
    totalHours: string;
  };
  filterType: string;
  setFilterType: (val: string) => void;
  filterStartDate: string;
  setFilterStartDate: (val: string) => void;
  filterEndDate: string;
  setFilterEndDate: (val: string) => void;
  onResetFilters: () => void;
  onExportIndividualCSV: (filtered: ChutiRecord[], searchTerm: string) => void;
  onExportIndividualExcel: (filtered: ChutiRecord[], searchTerm: string) => void;
  onExportIndividualPDF: (filtered: ChutiRecord[], searchTerm: string) => void;
  onToggleAdjustment: (r: ChutiRecord) => void;
  onEditClick: (r: ChutiRecord) => void;
  onDeleteClick: (r: ChutiRecord) => void;
  renderStatusBadge: (r: ChutiRecord) => React.ReactNode;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  availableYears: string[];
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  getUserSummaryStats: (id: string) => {
    full: number;
    short: string;
    overtime: string;
    reserve: number;
  };
  onChangePasswordClick: (userId: string, username: string) => void;
  onEditProfileClick: (staff: Profile) => void;
  onDeleteUserClick: (staff: Profile) => void;
  onAddStaffClick: () => void;
  onExportSummaryCSV: () => void;
  onExportSummaryExcel: () => void;
  onExportSummaryPDF: () => void;
  onAddLeaveClick: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  profilesList,
  viewingStaffId,
  setViewingStaffId,
  staffProfile,
  individualRecords,
  staffStats,
  filterType,
  setFilterType,
  filterStartDate,
  setFilterStartDate,
  filterEndDate,
  setFilterEndDate,
  onResetFilters,
  onExportIndividualCSV,
  onExportIndividualExcel,
  onExportIndividualPDF,
  onToggleAdjustment,
  onEditClick,
  onDeleteClick,
  renderStatusBadge,
  selectedYear,
  setSelectedYear,
  availableYears,
  searchQuery,
  setSearchQuery,
  getUserSummaryStats,
  onChangePasswordClick,
  onEditProfileClick,
  onDeleteUserClick,
  onAddStaffClick,
  onExportSummaryCSV,
  onExportSummaryExcel,
  onExportSummaryPDF,
  onAddLeaveClick,
}) => {
  const staffHours = staffStats.shortHours;
  const staffFull = staffStats.fullLeaves;
  const staffReserve = staffStats.reserveLeaves;
  const staffOvertimeHours = staffStats.overtimeHours;

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      {!viewingStaffId && (
        <div className="flex flex-wrap justify-center gap-4 w-full">
          {/* Card 1: Total Staff */}
          <div className="w-full max-w-xs bg-slate-900/40 border border-slate-900 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <User className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-xs text-slate-400">সর্বমোট স্টাফ সংখ্যা</span>
              <span className="block text-2xl font-bold text-white mt-0.5">{profilesList.length} জন</span>
            </div>
          </div>
        </div>
      )}

      {/* Conditional Rendering: Individual Staff Profile Detail View OR Staff Master Database Table */}
      {viewingStaffId ? (
        <div className="flex flex-col gap-6">
          {/* Individual Profile Top Box */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-900 shadow-2xl rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewingStaffId(null)}
                className="p-2.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-700 transition-all cursor-pointer"
                title="পিছনে যান"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {staffProfile?.full_name || 'Staff User'} ({staffProfile?.username ? staffProfile.username.toUpperCase() : ''})
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                    staffProfile?.role === 'admin'
                      ? 'bg-purple-950/60 border-purple-800 text-purple-300' 
                      : staffProfile?.role === 'supervisor'
                      ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                      : 'bg-blue-950/60 border-blue-800 text-blue-300'
                  }`}>
                    {staffProfile?.job_role || (staffProfile?.role === 'admin' ? 'Admin' : (staffProfile?.role === 'supervisor' ? 'Supervisor' : 'Staff'))}
                  </span>
                </h2>
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-400">
                  <div>কর্মঘণ্টা: <strong className="text-white">{formatWorkingHours(staffProfile?.working_hours || 9.5)}</strong></div>
                  <div>ব্রেক টাইম: <strong className="text-white">{staffProfile?.break_time || 0} মিনিট</strong></div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onChangePasswordClick(staffProfile?.id || '', staffProfile?.username || '')}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-md flex items-center gap-1.5"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Change Password
              </button>
              <button
                onClick={() => staffProfile && onEditProfileClick(staffProfile)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-md shadow-blue-900/10 border border-blue-700 flex items-center gap-1.5"
              >
                <Edit className="h-3.5 w-3.5" /> Edit Profile
              </button>
              {staffProfile?.role !== 'admin' && (
                <button
                  onClick={() => staffProfile && onDeleteUserClick(staffProfile)}
                  className="px-3.5 py-2 bg-red-600/90 hover:bg-red-700 border border-red-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-md flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete User
                </button>
              )}
            </div>
          </div>

          {/* Stats for the viewed staff */}
          <div className="flex flex-wrap justify-center gap-4 w-full">
            <div className="flex-1 min-w-[220px] max-w-[280px] bg-slate-900/20 border border-slate-900/80 rounded-xl p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-400" />
              <div>
                <span className="block text-[11px] text-slate-400">শর্ট লিভ (Unadjusted)</span>
                <span className="block text-lg font-bold text-white font-mono">{staffHours} ঘণ্টা</span>
              </div>
            </div>
            <div className="flex-1 min-w-[220px] max-w-[280px] bg-slate-900/20 border border-slate-900/80 rounded-xl p-4 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-violet-400" />
              <div>
                <span className="block text-[11px] text-slate-400">ফুল লিভ (Unadjusted)</span>
                <span className="block text-lg font-bold text-white">{staffFull} দিন</span>
              </div>
            </div>
            {staffProfile?.allow_reserve && (
              <div className="flex-1 min-w-[220px] max-w-[280px] bg-slate-900/20 border border-slate-900/80 rounded-xl p-4 flex items-center gap-3">
                <Calendar className="h-5 w-5 text-amber-400" />
                <div>
                  <span className="block text-[11px] text-slate-400">রিজার্ভ ছুটি (Unadjusted)</span>
                  <span className="block text-lg font-bold text-white">{staffReserve} দিন</span>
                </div>
              </div>
            )}
            {staffProfile?.allow_overtime && (
              <div className="flex-1 min-w-[220px] max-w-[280px] bg-slate-900/20 border border-slate-900/80 rounded-xl p-4 flex items-center gap-3">
                <Clock className="h-5 w-5 text-emerald-400" />
                <div>
                  <span className="block text-[11px] text-slate-400">ওভারটাইম (Unadjusted)</span>
                  <span className="block text-lg font-bold text-white font-mono">{staffOvertimeHours} ঘণ্টা</span>
                </div>
              </div>
            )}
          </div>

          {/* Filtering Panel for viewed staff */}
          <LeavesRecordsTable 
            records={individualRecords}
            allowOvertime={staffProfile?.allow_overtime}
            allowReserve={staffProfile?.allow_reserve}
            filterType={filterType}
            setFilterType={setFilterType}
            filterStartDate={filterStartDate}
            setFilterStartDate={setFilterStartDate}
            filterEndDate={filterEndDate}
            setFilterEndDate={setFilterEndDate}
            onResetFilters={onResetFilters}
            onExportCSV={onExportIndividualCSV}
            onExportExcel={onExportIndividualExcel}
            onExportPDF={onExportIndividualPDF}
            onToggleAdjustment={onToggleAdjustment}
            onEditClick={onEditClick}
            onDeleteClick={onDeleteClick}
            onAddLeaveClick={onAddLeaveClick}
            formatDate={formatDate}
            formatTimeToAMPM={formatTimeToAMPM}
            getCleanComment={getCleanComment}
            renderStatusBadge={renderStatusBadge}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            availableYears={availableYears}
            title="ছুটির বিবরণী রেকর্ডসমূহ"
            emptyMessage="এই স্টাফের জন্য কোনো ছুটির রেকর্ড পাওয়া যায়নি।"
          />
        </div>
      ) : (
        /* ================= STAFF MASTER DATABASE SUMMARY TABLE ================= */
        <StaffMasterTable 
          profilesList={profilesList}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          getUserSummaryStats={getUserSummaryStats}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          availableYears={availableYears}
          onAddStaffClick={onAddStaffClick}
          onExportCSV={onExportSummaryCSV}
          onExportExcel={onExportSummaryExcel}
          onExportPDF={onExportSummaryPDF}
          onViewDetails={setViewingStaffId}
        />
      )}
    </div>
  );
};
