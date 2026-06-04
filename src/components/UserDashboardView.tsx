import React from 'react';
import { UserStats } from './UserStats';
import { LeavesRecordsTable } from './LeavesRecordsTable';
import { ChutiRecord } from '@/utils/offlineSync';
import { Profile, GovtHolidayResponse } from '@/types';
import { 
  formatDate, 
  formatTimeToAMPM, 
  getCleanComment, 
  GlobalSettings,
  parseIntervalToMinutes,
  formatDuration,
  parseHolidayItem,
  HalfYearlyOfficeLeaveStats
} from '@/utils/dashboardHelpers';
import { useGovtHolidayStats, useHalfYearlyStats } from '@/hooks/useLeaveQuotaStats';
import { Calendar } from 'lucide-react';

interface UserDashboardViewProps {
  profile: Profile | null;
  userStats: {
    shortHours: string;
    overtimeHours: string;
    fullLeaves: number;
    totalHours: string;
    officeLeavesTaken?: number;
    eidFitrTaken?: number;
    eidAdhaTaken?: number;
    govtHolidaysTaken?: number;
  };
  globalSettings: GlobalSettings;
  filteredUserRecords: ChutiRecord[];
  userRecords: ChutiRecord[];
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  availableYears: string[];
  filterType: string;
  setFilterType: (val: string) => void;
  filterStartDate: string;
  setFilterStartDate: (val: string) => void;
  filterEndDate: string;
  setFilterEndDate: (val: string) => void;
  onResetFilters: () => void;
  onExportCSV: (filtered: ChutiRecord[], searchTerm: string) => void;
  onExportExcel: (filtered: ChutiRecord[], searchTerm: string) => void;
  onExportPDF: (filtered: ChutiRecord[], searchTerm: string) => void;
  onAddLeaveClick: () => void;
  onToggleAdjustment: (r: ChutiRecord) => void;
  onDeleteClick: (r: ChutiRecord) => void;
  onRevisionClick: (r: ChutiRecord) => void;
  onConvertShortLeaveToFullLeave: (userId: string, workingHours: number, shortMins: number) => void;
  holidayResponses: GovtHolidayResponse[];
  onSaveHolidayResponse: (holidayDate: string, holidayName: string, response: 'paid' | 'reserve') => Promise<boolean>;
}

export const UserDashboardView: React.FC<UserDashboardViewProps> = ({
  profile,
  userStats,
  globalSettings,
  filteredUserRecords,
  userRecords,
  selectedYear,
  setSelectedYear,
  availableYears,
  filterType,
  setFilterType,
  filterStartDate,
  setFilterStartDate,
  filterEndDate,
  setFilterEndDate,
  onResetFilters,
  onExportCSV,
  onExportExcel,
  onExportPDF,
  onAddLeaveClick,
  onToggleAdjustment,
  onDeleteClick,
  onRevisionClick,
  onConvertShortLeaveToFullLeave,
  holidayResponses,
  onSaveHolidayResponse,
}) => {
  // Eligibility & Deduction
  const isOfficeLeaveEligible = profile?.eligible_office_leave !== false;
  const isGovtHolidayEligible = profile?.eligible_govt_holiday !== false;

  // Deduction setting is removed completely, so deduction = 0
  const officeLeaveTotal = isOfficeLeaveEligible
    ? (globalSettings.office_leave_default ?? 14) + (globalSettings.eid_fitr_leave ?? 0) + (globalSettings.eid_adha_leave ?? 0)
    : (globalSettings.eid_fitr_leave ?? 0) + (globalSettings.eid_adha_leave ?? 0);

  // Government Holiday calculations using shared hook
  const { paidCount, reservedCount, respondedHolidays, govtHolidayStats } = useGovtHolidayStats(
    profile?.id,
    holidayResponses,
    globalSettings,
    isGovtHolidayEligible,
    userStats.govtHolidaysTaken || 0
  );

  // Half-yearly split calculations using shared hook
  const { halfYearlyStats } = useHalfYearlyStats(
    userRecords,
    globalSettings.office_leave_default ?? 14,
    selectedYear
  );

  // Short to Full Leave Conversion Adjustments
  const convertedDays = profile?.converted_short_leaves_days ?? 0;

  // Total full-day leaves taken: unadjusted full + adjusted office + adjusted eids + reserve taken + converted days
  const officeLeaveTaken = (userStats.officeLeavesTaken ?? 0)
    + (userStats.eidFitrTaken ?? 0)
    + (userStats.eidAdhaTaken ?? 0)
    + (userStats.fullLeaves ?? 0)
    + (userStats.govtHolidaysTaken ?? 0)
    + convertedDays;

  const totalAllowed = officeLeaveTotal + reservedCount;

  const officeLeaveStats = {
    total: totalAllowed,
    taken: officeLeaveTaken,
    remaining: totalAllowed - officeLeaveTaken,
  };

  // Identify government holidays that the user has not responded to yet
  const pendingHolidays = React.useMemo(() => {
    return (globalSettings.govt_holidays || [])
      .map(h => parseHolidayItem(h))
      .filter(h => {
        const responded = holidayResponses.some(r => r.user_id === profile?.id && r.holiday_date === h.date);
        return !responded;
      });
  }, [globalSettings.govt_holidays, holidayResponses, profile?.id]);

  // Auto-approve as 'paid' if allow_reserve is false and there are pending holidays
  React.useEffect(() => {
    if (profile && profile.eligible_govt_holiday !== false && profile.allow_reserve === false && pendingHolidays.length > 0) {
      pendingHolidays.forEach((holiday) => {
        onSaveHolidayResponse(holiday.date, holiday.name, 'paid');
      });
    }
  }, [profile, pendingHolidays, onSaveHolidayResponse]);

  // Short to Full Leave Conversion Adjustments
  const convertedHours = profile?.converted_short_leaves_hours ?? 0;

  const totalShortMins = parseIntervalToMinutes(userStats.shortHours);
  const netShortMins = Math.max(0, totalShortMins - convertedHours * 60);
  const displayShortHours = formatDuration(netShortMins);
  
  const displayFullLeaves = userStats.fullLeaves + convertedDays;

  const workingHours = profile?.working_hours ?? 9.5;
  const hasConvertibleHours = netShortMins >= workingHours * 60;

  const handleConvertToFullLeave = () => {
    if (!profile) return;
    const maxDays = Math.floor(netShortMins / (workingHours * 60));
    const hoursText = (maxDays * workingHours).toFixed(1);
    
    if (confirm(`আপনি কি ${hoursText} ঘণ্টা শর্ট লিভকে ${maxDays} দিন ফুল লিভে রূপান্তর করতে চান?\n(এটি আপনার শর্ট লিভ ব্যালেন্স থেকে বিয়োগ হবে এবং ফুল লিভের সাথে যোগ হবে)`)) {
      onConvertShortLeaveToFullLeave(profile.id, workingHours, netShortMins);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <UserStats 
        stats={{
          ...userStats,
          shortHours: displayShortHours,
          fullLeaves: displayFullLeaves
        }}
        officeLeaveStats={officeLeaveStats}
        govtHolidayStats={govtHolidayStats}
        allowOvertime={profile?.allow_overtime}
        respondedHolidays={respondedHolidays}
        convertedDays={convertedDays}
        convertedHours={convertedHours}
        onConvertToFullLeave={handleConvertToFullLeave}
        hasConvertibleHours={hasConvertibleHours}
        eligibleOfficeLeave={profile?.eligible_office_leave !== false}
        eligibleGovtHoliday={profile?.eligible_govt_holiday !== false}
        halfYearlyStats={halfYearlyStats}
      />

      <LeavesRecordsTable 
        records={filteredUserRecords}
        allowOvertime={profile?.allow_overtime}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        availableYears={availableYears}
        filterType={filterType}
        setFilterType={setFilterType}
        filterStartDate={filterStartDate}
        setFilterStartDate={setFilterStartDate}
        filterEndDate={filterEndDate}
        setFilterEndDate={setFilterEndDate}
        onResetFilters={onResetFilters}
        onExportCSV={onExportCSV}
        onExportExcel={onExportExcel}
        onExportPDF={onExportPDF}
        onAddLeaveClick={onAddLeaveClick}
        onToggleAdjustment={onToggleAdjustment}
        onDeleteClick={onDeleteClick}
        onRevisionClick={onRevisionClick}
        formatDate={formatDate}
        formatTimeToAMPM={formatTimeToAMPM}
        getCleanComment={getCleanComment}
        title="আমার বাৎসরিক ছুটির রেকর্ডসমূহ"
        emptyMessage="কোনো ছুটির রেকর্ড পাওয়া যায়নি। নতুন এন্ট্রি সাবমিট করুন।"
        showPendingBadge={true}
      />
    </div>
  );
};
