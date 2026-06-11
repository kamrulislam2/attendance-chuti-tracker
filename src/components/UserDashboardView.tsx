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
  onExportExcel: (filtered: ChutiRecord[], searchTerm: string) => void;
  onExportPDF: (filtered: ChutiRecord[], searchTerm: string) => void;
  onAddLeaveClick: () => void;
  onToggleAdjustment: (r: ChutiRecord) => void;
  onDeleteClick: (r: ChutiRecord) => void;
  onRevisionClick: (r: ChutiRecord) => void;
  onConvertShortLeaveToFullLeave: (userId: string, workingHours: number, shortMins: number) => void;
  holidayResponses: GovtHolidayResponse[];
  onSaveHolidayResponse: (holidayDate: string, holidayName: string, response: 'paid' | 'reserve') => Promise<boolean>;
  initialFetchDone: boolean;
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
  onExportExcel,
  onExportPDF,
  onAddLeaveClick,
  onToggleAdjustment,
  onDeleteClick,
  onRevisionClick,
  onConvertShortLeaveToFullLeave,
  holidayResponses,
  onSaveHolidayResponse,
  initialFetchDone,
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

  // Auto-approve as 'paid' if allow_reserve is false, initial fetch is done, and there are pending holidays
  React.useEffect(() => {
    if (initialFetchDone && profile && profile.eligible_govt_holiday !== false && profile.allow_reserve === false && pendingHolidays.length > 0) {
      pendingHolidays.forEach((holiday) => {
        onSaveHolidayResponse(holiday.date, holiday.name, 'paid');
      });
    }
  }, [initialFetchDone, profile, pendingHolidays, onSaveHolidayResponse]);

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
    
    if (confirm(`Do you want to convert ${hoursText} hours of short leave to ${maxDays} days of full leave?\n(This will deduct from your short leave balance and add to your full leave)`)) {
      onConvertShortLeaveToFullLeave(profile.id, workingHours, netShortMins);
    }
  };

  const [submittingDates, setSubmittingDates] = React.useState<string[]>([]);

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* Pending Govt Holiday Response Alert Banner */}
      {initialFetchDone && profile && profile.eligible_govt_holiday !== false && profile.allow_reserve !== false && pendingHolidays.length > 0 && (
        <div className="bg-slate-900/40 backdrop-blur-xl border border-amber-900/40 p-4 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-600/10 border border-amber-500/20 text-amber-400 rounded-xl shrink-0 mt-0.5">
              <Calendar className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Government Holiday Preferences Pending 🔔</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Please select what you would like to do for the following government holidays. You can either get paid or reserve the leave:
              </p>
              <div className="flex flex-wrap gap-2 mt-2.5">
                {pendingHolidays.map((holiday, idx) => (
                  <span key={idx} className="inline-flex items-center px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 gap-1.5 font-sans">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {holiday.name} ({formatDate(holiday.date)})
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 w-full md:w-auto shrink-0 border-t border-slate-850/80 md:border-t-0 pt-3 md:pt-0">
            {pendingHolidays.map((holiday) => {
              const isSubmitting = submittingDates.includes(holiday.date);
              return (
                <div key={holiday.date} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-slate-955/60 border border-slate-850 rounded-xl md:w-80 font-sans">
                  <div className="text-[11px] font-semibold text-slate-300">
                    {holiday.name}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={async () => {
                        setSubmittingDates(prev => [...prev, holiday.date]);
                        await onSaveHolidayResponse(holiday.date, holiday.name, 'paid');
                        setSubmittingDates(prev => prev.filter(d => d !== holiday.date));
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-600 hover:bg-emerald-555 text-white border border-emerald-700 shadow-sm transition-all cursor-pointer disabled:opacity-50 font-sans"
                    >
                      {isSubmitting ? '...' : 'Get Paid'}
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={async () => {
                        setSubmittingDates(prev => [...prev, holiday.date]);
                        await onSaveHolidayResponse(holiday.date, holiday.name, 'reserve');
                        setSubmittingDates(prev => prev.filter(d => d !== holiday.date));
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-teal-600 hover:bg-teal-555 text-white border border-teal-700 shadow-sm transition-all cursor-pointer disabled:opacity-50 font-sans"
                    >
                      {isSubmitting ? '...' : 'Reserve'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
        onExportExcel={onExportExcel}
        onExportPDF={onExportPDF}
        onAddLeaveClick={onAddLeaveClick}
        onToggleAdjustment={onToggleAdjustment}
        onDeleteClick={onDeleteClick}
        onRevisionClick={onRevisionClick}
        formatDate={formatDate}
        formatTimeToAMPM={formatTimeToAMPM}
        getCleanComment={getCleanComment}
        title="My Annual Leave Records"
        emptyMessage="No leave records found. Submit a new entry."
        showPendingBadge={true}
      />
    </div>
  );
};
