import React from 'react';
import { 
  User, 
  Clock, 
  Calendar, 
  ArrowLeft, 
  AlertTriangle, 
  Edit, 
  Trash2,
  Settings,
  RotateCcw
} from 'lucide-react';
import { Profile, ChutiRecordWithProfile, GovtHolidayResponse } from '@/types';
import { ChutiRecord } from '@/utils/offlineSync';
import { LeavesRecordsTable } from './LeavesRecordsTable';
import { StaffMasterTable } from './StaffMasterTable';
import { 
  formatDate, 
  formatTimeToAMPM, 
  getCleanComment, 
  formatWorkingHours, 
  GlobalSettings,
  parseIntervalToMinutes,
  formatDuration,
  parseHolidayItem,
  calculateHalfYearlyOfficeLeave,
  HalfYearlyOfficeLeaveStats
} from '@/utils/dashboardHelpers';
import { useGovtHolidayStats, useHalfYearlyStats } from '@/hooks/useLeaveQuotaStats';
import { AdminOfficeLeaveSettingsModal } from './modals/AdminOfficeLeaveSettingsModal';
import { AdminGovtHolidaysSettingsModal } from './modals/AdminGovtHolidaysSettingsModal';
import { StatCard } from './StatCard';
import { UserStats } from './UserStats';
import { DateInput } from './DateInput';

interface AdminDashboardViewProps {
  profilesList: Profile[];
  viewingStaffId: string | null;
  setViewingStaffId: (id: string | null) => void;
  staffProfile: Profile | null;
  individualRecords: ChutiRecordWithProfile[];
  unfilteredStaffRecords: ChutiRecordWithProfile[];
  staffStats: {
    shortHours: string;
    overtimeHours: string;
    fullLeaves: number;
    totalHours: string;
    govtHolidaysTaken?: number;
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
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  availableYears: string[];
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  getUserSummaryStats: (id: string) => {
    full: number;
    short: string;
    overtime: string;
  };
  onChangePasswordClick: (userId: string, username: string) => void;
  onEditProfileClick: (staff: Profile) => void;
  onDeleteUserClick: (staff: Profile) => void;
  onAddStaffClick: () => void;
  onExportSummaryCSV: () => void;
  onExportSummaryExcel: () => void;
  onExportSummaryPDF: () => void;
  onAddLeaveClick: () => void;
  globalSettings: GlobalSettings;
  onSaveGlobalSettings: (settings: GlobalSettings) => Promise<boolean>;
  onConvertShortLeaveToFullLeave: (userId: string, workingHours: number, shortMins: number) => void;
  holidayResponses: GovtHolidayResponse[];
  onExportHolidayResponsesCSV: (responses: GovtHolidayResponse[]) => void;
  onExportHolidayResponsesExcel: (responses: GovtHolidayResponse[]) => void;
  onExportHolidayResponsesPDF: (responses: GovtHolidayResponse[]) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  profilesList,
  viewingStaffId,
  setViewingStaffId,
  staffProfile,
  individualRecords,
  unfilteredStaffRecords,
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
  globalSettings,
  onSaveGlobalSettings,
  onConvertShortLeaveToFullLeave,
  holidayResponses,
  onExportHolidayResponsesCSV,
  onExportHolidayResponsesExcel,
  onExportHolidayResponsesPDF,
}) => {
  const staffOvertimeHours = staffStats.overtimeHours;

  // Local settings modals visibility
  const [showOfficeModal, setShowOfficeModal] = React.useState(false);
  const [showGovtModal, setShowGovtModal] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'staff_master' | 'govt_responses'>('staff_master');

  // Holiday search filters state
  const [holidaySearchQuery, setHolidaySearchQuery] = React.useState('');
  const [holidaySearchDate, setHolidaySearchDate] = React.useState('');

  // Eligibility & Deduction for viewed staff
  const isOfficeLeaveEligible = staffProfile?.eligible_office_leave !== false;
  const isGovtHolidayEligible = staffProfile?.eligible_govt_holiday !== false;

  // Staff deduction is deleted from DB settings, default is 0
  const staffOfficeQuota = isOfficeLeaveEligible
    ? (globalSettings.office_leave_default ?? 14) + (globalSettings.eid_fitr_leave ?? 0) + (globalSettings.eid_adha_leave ?? 0)
    : (globalSettings.eid_fitr_leave ?? 0) + (globalSettings.eid_adha_leave ?? 0);

  const staffGovtQuota = isGovtHolidayEligible ? (globalSettings.govt_holidays?.length ?? 0) : 0;

  const approvedIndividualRecs = React.useMemo(() => {
    return unfilteredStaffRecords.filter(r => r.status === 'approved' && r.date && (selectedYear === 'all' || r.date.substring(0, 4) === selectedYear));
  }, [unfilteredStaffRecords, selectedYear]);

  const staffOfficeTaken = React.useMemo(() => {
    if (isOfficeLeaveEligible) {
      return approvedIndividualRecs.filter(r => r.comment?.startsWith("Adjusted: Office Leave") || r.comment?.startsWith("Adjusted: Eid-ul-Fitr") || r.comment?.startsWith("Adjusted: Eid-ul-Adha")).length;
    } else {
      return approvedIndividualRecs.filter(r => r.comment?.startsWith("Adjusted: Eid-ul-Fitr") || r.comment?.startsWith("Adjusted: Eid-ul-Adha")).length;
    }
  }, [approvedIndividualRecs, isOfficeLeaveEligible]);

  // Government Holiday calculations using shared hook
  const { userResponses: staffResponses, paidCount, reservedCount, respondedHolidays, govtHolidayStats } = useGovtHolidayStats(
    staffProfile?.id,
    holidayResponses,
    globalSettings,
    isGovtHolidayEligible,
    staffStats.govtHolidaysTaken || 0
  );

  // Half-yearly split calculations using shared hook
  const { halfYearlyStats } = useHalfYearlyStats(
    unfilteredStaffRecords,
    globalSettings.office_leave_default ?? 14,
    selectedYear
  );

  // Short to Full Leave Conversion Adjustments for viewed staff
  const convertedDays = staffProfile?.converted_short_leaves_days ?? 0;
  const convertedHours = staffProfile?.converted_short_leaves_hours ?? 0;

  // Total full-day leaves taken: adjusted office + unadjusted full + reserve taken + converted days
  const totalTaken = staffOfficeTaken 
    + (staffStats.fullLeaves ?? 0)
    + (staffStats.govtHolidaysTaken ?? 0) 
    + convertedDays;

  const totalAllowed = staffOfficeQuota + reservedCount;

  const officeLeaveStats = {
    total: totalAllowed,
    taken: totalTaken,
    remaining: totalAllowed - totalTaken,
  };

  const totalShortMins = parseIntervalToMinutes(staffStats.shortHours);
  const netShortMins = Math.max(0, totalShortMins - convertedHours * 60);
  const displayShortHours = formatDuration(netShortMins);
  
  const displayFullLeaves = staffStats.fullLeaves + convertedDays;

  const workingHours = staffProfile?.working_hours ?? 9.5;
  const hasConvertibleHours = netShortMins >= workingHours * 60;

  const handleConvertToFullLeave = () => {
    if (!staffProfile) return;
    const maxDays = Math.floor(netShortMins / (workingHours * 60));
    const hoursText = (maxDays * workingHours).toFixed(1);
    
    if (confirm(`আপনি কি ${hoursText} ঘণ্টা শর্ট লিভকে ${maxDays} দিন ফুল লিভে রূপান্তর করতে চান?\n(এটি স্টাফের শর্ট লিভ ব্যালেন্স থেকে বিয়োগ হবে এবং ফুল লিভের সাথে যোগ হবে)`)) {
      onConvertShortLeaveToFullLeave(staffProfile.id, workingHours, netShortMins);
    }
  };

  // Filtered responses for Govt Holiday Response table report
  const filteredResponses = React.useMemo(() => {
    const activeHolidayDates = new Set((globalSettings.govt_holidays || []).map(h => parseHolidayItem(h).date));
    return holidayResponses.filter(r => {
      if (!activeHolidayDates.has(r.holiday_date)) return false;
      
      const matchesDate = holidaySearchDate ? r.holiday_date === holidaySearchDate : true;
      
      const searchLower = holidaySearchQuery.toLowerCase().trim();
      if (!searchLower) return matchesDate;
      
      const employeeName = r.profiles?.full_name || '';
      const employeeCode = r.profiles?.username || '';
      const holidayName = r.holiday_name || '';
      
      const matchesQuery = 
        employeeName.toLowerCase().includes(searchLower) ||
        employeeCode.toLowerCase().includes(searchLower) ||
        holidayName.toLowerCase().includes(searchLower);
        
      return matchesDate && matchesQuery;
    });
  }, [holidayResponses, holidaySearchDate, holidaySearchQuery, globalSettings.govt_holidays]);

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      {!viewingStaffId && (
        <div className="flex flex-wrap justify-center gap-4 w-full animate-fade-in">
          {/* Card 1: Total Staff */}
          <StatCard
            icon={User}
            iconBgClass="bg-purple-500/10"
            iconColorClass="text-purple-400"
            iconBorderClass="border-purple-500/20"
            title="সর্বমোট স্টাফ সংখ্যা"
            value={`${profilesList.length} জন`}
            className="w-full max-w-xs"
          />

          {/* Card 2: Office Allocated Leave */}
          <StatCard
            icon={Calendar}
            iconBgClass="bg-blue-500/10"
            iconColorClass="text-blue-400"
            iconBorderClass="border-blue-500/20"
            title="অফিস বরাদ্দকৃত ছুটি (ডিফল্ট)"
            value={`${(globalSettings.office_leave_default ?? 14) + (globalSettings.eid_fitr_leave ?? 0) + (globalSettings.eid_adha_leave ?? 0)} দিন`}
            action={
              <button
                onClick={() => setShowOfficeModal(true)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer border border-transparent hover:border-slate-700"
                title="লিভ কোটা সেটিংস"
              >
                <Settings className="h-4 w-4" />
              </button>
            }
            className="w-full max-w-xs"
          />

          {/* Card 3: Govt Holiday */}
          <StatCard
            icon={Calendar}
            iconBgClass="bg-teal-500/10"
            iconColorClass="text-teal-400"
            iconBorderClass="border-teal-500/20"
            title="সরকারি ছুটি"
            value={`${globalSettings.govt_holidays?.length ?? 0} দিন`}
            action={
              <button
                onClick={() => setShowGovtModal(true)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer border border-transparent hover:border-slate-700"
                title="সরকারি ছুটির তালিকা সম্পাদনা"
              >
                <Settings className="h-4 w-4" />
              </button>
            }
            className="w-full max-w-xs"
          />
        </div>
      )}

      {/* Conditional Rendering: Individual Staff Profile Detail View OR Staff Master Database Table */}
      {viewingStaffId ? (
        <div className="flex flex-col gap-6">
          {/* Individual Profile Top Box */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-850 shadow-2xl rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewingStaffId(null)}
                className="p-2.5 bg-slate-850 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-700 transition-all cursor-pointer"
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
                      ? 'bg-amber-950/60 border-amber-805 text-amber-300'
                      : 'bg-blue-950/60 border-blue-805 text-blue-300'
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
                className="px-3.5 py-2 bg-slate-855 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-md flex items-center gap-1.5"
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
          <UserStats 
            stats={{
              shortHours: displayShortHours,
              fullLeaves: displayFullLeaves,
              overtimeHours: staffStats.overtimeHours
            }}
            officeLeaveStats={officeLeaveStats}
            govtHolidayStats={govtHolidayStats}
            allowOvertime={staffProfile?.allow_overtime}
            respondedHolidays={respondedHolidays}
            convertedDays={convertedDays}
            convertedHours={convertedHours}
            onConvertToFullLeave={handleConvertToFullLeave}
            hasConvertibleHours={hasConvertibleHours}
            eligibleOfficeLeave={staffProfile?.eligible_office_leave !== false}
            eligibleGovtHoliday={staffProfile?.eligible_govt_holiday !== false}
            halfYearlyStats={halfYearlyStats}
          />

          {/* Filtering Panel for viewed staff */}
          <LeavesRecordsTable 
            records={individualRecords}
            allowOvertime={staffProfile?.allow_overtime}
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
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            availableYears={availableYears}
            title="ছুটির বিবরণী রেকর্ডসমূহ"
            emptyMessage="এই স্টাফের জন্য কোনো ছুটির রেকর্ড পাওয়া যায়নি।"
          />
        </div>
      ) : (
        /* ================= STAFF MASTER DATABASE SUMMARY TABLE ================= */
        <div className="flex flex-col gap-6">
          {/* Tabs Navigation */}
          <div className="flex flex-col sm:flex-row w-full sm:w-auto bg-slate-900/40 backdrop-blur-xl p-1 rounded-xl border border-slate-850/80 self-center gap-1 sm:gap-0">
            <button
              onClick={() => setActiveTab('staff_master')}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'staff_master'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/40 border border-purple-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent'
              }`}
            >
              <User className="h-4 w-4" />
              <span>স্টাফ ছুটির মাস্টার ডাটাবেজ</span>
            </button>
            <button
              onClick={() => setActiveTab('govt_responses')}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'govt_responses'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-950/40 border border-teal-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>সরকারি ছুটির রেসপন্স রিপোর্ট</span>
            </button>
          </div>

          {activeTab === 'staff_master' ? (
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
          ) : (
            /* ================= GOVT HOLIDAY RESPONSES TABLE REPORT ================= */
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-850 shadow-2xl rounded-2xl p-6 flex flex-col gap-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-md font-bold text-white flex items-center gap-2">
                    <Calendar className="h-4.5 w-4.5 text-teal-400" />
                    সরকারি ছুটির রেসপন্স রিপোর্ট
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    সরকারি ছুটির বিপরীতে স্টাফদের পেমেন্ট বা রিজার্ভ পদের পছন্দ ও প্রতিক্রিয়াসমূহ
                  </p>
                </div>
                
                {/* Export buttons */}
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => onExportHolidayResponsesCSV(filteredResponses)}
                    disabled={filteredResponses.length === 0}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40 transition-all"
                  >
                    CSV Export
                  </button>
                  <button
                    onClick={() => onExportHolidayResponsesExcel(filteredResponses)}
                    disabled={filteredResponses.length === 0}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40 transition-all"
                  >
                    Excel Export
                  </button>
                  <button
                    onClick={() => onExportHolidayResponsesPDF(filteredResponses)}
                    disabled={filteredResponses.length === 0}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40 transition-all"
                  >
                    PDF Export
                  </button>
                </div>
              </div>

              {/* Search Filters */}
              <div className="flex flex-col sm:flex-row gap-3 w-full bg-slate-905/40 p-3 rounded-xl border border-slate-850">
                <div className="flex-1 relative">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">ছুটির নাম বা স্টাফের নাম (কোডনাম) দিয়ে সার্চ</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="নাম বা কোডনাম সার্চ করুন..."
                      value={holidaySearchQuery}
                      onChange={(e) => setHolidaySearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-3 pr-10 py-2 text-xs text-white focus:outline-none focus:border-teal-500/50 transition-all placeholder-slate-500"
                    />
                    {holidaySearchQuery && (
                      <button
                        onClick={() => setHolidaySearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-350 transition-colors cursor-pointer text-sm font-semibold"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                <div className="w-full sm:w-48">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">ছুটির তারিখ দিয়ে ফিল্টার</label>
                  <DateInput
                    value={holidaySearchDate}
                    onChange={(val) => setHolidaySearchDate(val)}
                    className="bg-slate-900 border border-slate-800"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setHolidaySearchQuery('');
                      setHolidaySearchDate('');
                    }}
                    className="flex items-center justify-center h-[32px] w-[32px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg cursor-pointer transition-all"
                    title="রিসেট করুন"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto rounded-xl border border-slate-900 bg-slate-950/20">
                <table className="min-w-full divide-y divide-slate-900 text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">ছুটির তারিখ</th>
                      <th className="px-4 py-3">ছুটির নাম</th>
                      <th className="px-4 py-3">স্টাফের নাম (কোডনাম)</th>
                      <th className="px-4 py-3">পছন্দ/রেসপন্স</th>
                      <th className="px-4 py-3 text-right">রেসপন্সের সময়</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 bg-slate-900/10">
                    {filteredResponses.length > 0 ? (
                      filteredResponses.map((resp) => {
                        const fullName = resp.profiles?.full_name || 'স্টাফ';
                        const codeName = resp.profiles?.username ? resp.profiles.username.toUpperCase() : 'N/A';
                        
                        return (
                          <tr key={resp.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-200">
                              {formatDate(resp.holiday_date)}
                            </td>
                            <td className="px-4 py-3 text-slate-300">
                              {resp.holiday_name}
                            </td>
                            <td className="px-4 py-3 font-medium text-teal-400">
                              {fullName} ({codeName})
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                resp.response === 'paid'
                                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                                  : 'bg-teal-950/60 border-teal-800 text-teal-300'
                              }`}>
                                {resp.response === 'paid' ? 'Get Paid (পেমেন্ট)' : 'Reserve (রিজার্ভ)'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-slate-500">
                              {resp.created_at ? new Date(resp.created_at).toLocaleString('bn-BD', { hour12: true }) : '-'}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          কোনো ছুটির রেসপন্স রেকর্ড পাওয়া যায়নি।
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin Settings Modals */}
      <AdminOfficeLeaveSettingsModal
        showModal={showOfficeModal}
        setShowModal={setShowOfficeModal}
        globalSettings={globalSettings}
        onSave={onSaveGlobalSettings}
      />
      <AdminGovtHolidaysSettingsModal
        showModal={showGovtModal}
        setShowModal={setShowGovtModal}
        globalSettings={globalSettings}
        onSave={onSaveGlobalSettings}
      />
    </div>
  );
};
