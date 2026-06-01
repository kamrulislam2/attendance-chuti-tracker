import React from 'react';
import { UserStats } from './UserStats';
import { UserRecordsTable } from './UserRecordsTable';
import { ChutiRecord } from '@/utils/offlineSync';
import { Profile } from '@/types';
import { formatDate, formatTimeToAMPM, getCleanComment } from '@/utils/dashboardHelpers';

interface UserDashboardViewProps {
  profile: Profile | null;
  userStats: {
    shortHours: string;
    overtimeHours: string;
    fullLeaves: number;
    reserveLeaves: number;
    totalHours: string;
  };
  filteredUserRecords: ChutiRecord[];
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
  onAddLeaveClick: () => void;
  onToggleAdjustment: (r: ChutiRecord) => void;
  onDeleteClick: (r: ChutiRecord) => void;
  onRevisionClick: (r: ChutiRecord) => void;
  renderStatusBadge: (r: ChutiRecord) => React.ReactNode;
}

export const UserDashboardView: React.FC<UserDashboardViewProps> = ({
  profile,
  userStats,
  filteredUserRecords,
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
  onAddLeaveClick,
  onToggleAdjustment,
  onDeleteClick,
  onRevisionClick,
  renderStatusBadge,
}) => {
  return (
    <div className="flex flex-col gap-6 w-full">
      <UserStats 
        stats={userStats}
        allowReserve={profile?.allow_reserve}
        allowOvertime={profile?.allow_overtime}
      />

      <UserRecordsTable 
        records={filteredUserRecords}
        allowOvertime={profile?.allow_overtime}
        allowReserve={profile?.allow_reserve}
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
        onAddLeaveClick={onAddLeaveClick}
        onToggleAdjustment={onToggleAdjustment}
        onDeleteClick={onDeleteClick}
        onRevisionClick={onRevisionClick}
        formatDate={formatDate}
        formatTimeToAMPM={formatTimeToAMPM}
        getCleanComment={getCleanComment}
        renderStatusBadge={renderStatusBadge}
      />
    </div>
  );
};
