import fs from 'fs';
import path from 'path';

const pagePath = path.resolve('src/app/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');
const lines = content.split(/\r?\n/);

// --- Find the exact indices ---

// 1. UserStats & UserRecordsTable block (lines 2801-3152)
let userStatsStart = -1;
let userStatsEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{/* Summary Cards */}') && lines[i+1].includes('<div className="flex flex-wrap justify-center')) {
    userStatsStart = i; // 0-indexed line 2800 (line 2801)
    break;
  }
}

if (userStatsStart !== -1) {
  // We want to find the closing div of the "Chuti Records Table" (line 3152)
  for (let i = userStatsStart; i < lines.length; i++) {
    if (lines[i].includes('/* ================= ADMIN VIEW ================= */')) {
      // Find the second </div> above this comment
      let divCount = 0;
      for (let j = i; j > userStatsStart; j--) {
        if (lines[j].trim() === '</div>') {
          divCount++;
          if (divCount === 2) {
            userStatsEnd = j; // This is line 3152
            break;
          }
        }
      }
      break;
    }
  }
}

// 2. AdminRecordsTable block (lines 3287-3544)
let adminRecordsStart = -1;
let adminRecordsEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('স্টাফ ছুটির ফিল্টারিং প্যানেল')) {
    for (let j = i; j > 0; j--) {
      if (lines[j].includes('<div className="bg-slate-900/40 backdrop-blur-xl border border-slate-900 shadow-2xl')) {
        adminRecordsStart = j; // 0-indexed line 3286 (line 3287)
        break;
      }
    }
    break;
  }
}

if (adminRecordsStart !== -1) {
  for (let i = adminRecordsStart; i < lines.length; i++) {
    if (lines[i].includes('/* ================= STAFF MASTER DATABASE SUMMARY TABLE ================= */') || lines[i].includes('STAFF MASTER DATABASE SUMMARY TABLE')) {
      // Walk back to find the second </div> (the card wrapper)
      let divCount = 0;
      for (let j = i; j > adminRecordsStart; j--) {
        if (lines[j].trim() === '</div>') {
          divCount++;
          if (divCount === 2) {
            adminRecordsEnd = j; // This is line 3544
            break;
          }
        }
      }
      break;
    }
  }
}

// 3. StaffMasterTable block (lines 3548-3674)
let masterStart = -1;
let masterEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('/* ================= STAFF MASTER DATABASE SUMMARY TABLE ================= */') || lines[i].includes('STAFF MASTER DATABASE SUMMARY TABLE')) {
    masterStart = i + 1; // 0-indexed line 3547 (line 3548)
    break;
  }
}

if (masterStart !== -1) {
  for (let i = masterStart; i < lines.length; i++) {
    if (lines[i].includes('{/* Welcome & Profile Update Onboarding Popup */}')) {
      // Walk back to find the second </div> (the master card wrapper)
      let divCount = 0;
      for (let j = i; j > masterStart; j--) {
        if (lines[j].trim() === '</div>') {
          divCount++;
          if (divCount === 2) {
            masterEnd = j; // This is line 3674
            break;
          }
        }
      }
      break;
    }
  }
}

console.log(`Indices found:
- UserStats & UserRecordsTable: line ${userStatsStart + 1} to ${userStatsEnd + 1}
- AdminRecordsTable: line ${adminRecordsStart + 1} to ${adminRecordsEnd + 1}
- StaffMasterTable: line ${masterStart + 1} to ${masterEnd + 1}
`);

if (
  userStatsStart === -1 || userStatsEnd === -1 ||
  adminRecordsStart === -1 || adminRecordsEnd === -1 ||
  masterStart === -1 || masterEnd === -1
) {
  console.error("Failed to find some block indices.");
  process.exit(1);
}

// --- Replacements ---

const masterReplacement = [
  '              <StaffMasterTable ',
  '                profilesList={profilesList}',
  '                searchQuery={searchQuery}',
  '                setSearchQuery={setSearchQuery}',
  '                getUserSummaryStats={getUserSummaryStats}',
  '                selectedYear={selectedYear}',
  '                setSelectedYear={(val) => {',
  '                  setSelectedYear(val);',
  "                  sessionStorage.setItem('selectedYear', val);",
  '                }}',
  '                availableYears={availableYears}',
  '                onAddStaffClick={() => setShowCreateUserModal(true)}',
  '                onExportCSV={handleExportSummaryCSV}',
  '                onExportExcel={handleExportSummaryExcel}',
  '                onViewDetails={setViewingStaffId}',
  '              />'
];

const adminRecordsReplacement = [
  '                    <AdminRecordsTable ',
  '                      records={individualRecords}',
  '                      allowOvertime={staffProfile?.allow_overtime}',
  '                      allowReserve={staffProfile?.allow_reserve}',
  '                      filterType={filterType}',
  '                      setFilterType={setFilterType}',
  '                      filterStartDate={filterStartDate}',
  '                      setFilterStartDate={setFilterStartDate}',
  '                      filterEndDate={filterEndDate}',
  '                      setFilterEndDate={setFilterEndDate}',
  '                      onResetFilters={() => {',
  "                        setFilterType('all');",
  "                        setFilterStartDate('');",
  "                        setFilterEndDate('');",
  '                      }}',
  '                      onExportCSV={() => handleExportIndividualCSV(viewingStaffId)}',
  '                      onExportExcel={() => handleExportIndividualExcel(viewingStaffId)}',
  '                      onToggleAdjustment={handleToggleAdjustmentClick}',
  '                      onEditClick={(r) => {',
  '                        setAdminEditRecord(r);',
  '                        setAdminEditDate(r.date);',
  '                        setAdminEditLeaveType(r.leave_type);',
  '                        setAdminEditAdjustment(r.adjustment);',
  '                        setAdminEditAdjustShortLeave(r.adjust_short_leave === true);',
  "                        setAdminEditSignInTime(r.sign_in_time ? r.sign_in_time.substring(0, 5) : '13:00');",
  "                        setAdminEditSignOutTime(r.sign_out_time ? r.sign_out_time.substring(0, 5) : '22:30');",
  "                        setAdminEditLeaveHour(r.leave_hour ? r.leave_hour.toString().split('.')[0].substring(0, 5) : '00:00');",
  "                        setAdminEditReserveHoliday(r.reserve_holiday || '');",
  "                        setAdminEditComment(r.comment || '');",
  '                        setShowAdminEditModal(true);',
  '                      }}',
  '                      onDeleteClick={triggerDeleteRecord}',
  '                      formatDate={formatDate}',
  '                      formatTimeToAMPM={formatTimeToAMPM}',
  '                      getCleanComment={getCleanComment}',
  '                      renderStatusBadge={renderStatusBadge}',
  '                      selectedYear={selectedYear}',
  '                    />'
];

const userStatsReplacement = [
  '              <UserStats ',
  '                stats={userStats}',
  '                allowReserve={profile?.allow_reserve}',
  '                allowOvertime={profile?.allow_overtime}',
  '              />',
  '',
  '              <UserRecordsTable ',
  '                records={getFilteredUserRecords()}',
  '                allowOvertime={profile?.allow_overtime}',
  '                allowReserve={profile?.allow_reserve}',
  '                selectedYear={selectedYear}',
  '                setSelectedYear={setSelectedYear}',
  '                availableYears={availableYears}',
  '                onAddLeaveClick={() => {',
  "                  setComment('');",
  "                  setReserveHoliday('');",
  '                  setAdjustShortLeave(false);',
  '                  const today = new Date();',
  "                  const localDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');",
  '                  setDate(localDate);',
  '                  setShowAddLeaveModal(true);',
  '                }}',
  '                onToggleAdjustment={handleToggleAdjustmentClick}',
  '                onDeleteClick={triggerDeleteRecord}',
  '                onRevisionClick={(r) => {',
  '                  setRevisionRecord(r);',
  '                  setRevisionDate(r.date);',
  '                  setRevisionLeaveType(r.leave_type);',
  '                  setRevisionAdjustment(r.adjustment);',
  '                  setRevisionAdjustShortLeave(r.adjust_short_leave === true);',
  "                  setRevisionSignInTime(r.sign_in_time ? r.sign_in_time.substring(0, 5) : '13:00');",
  "                  setRevisionSignOutTime(r.sign_out_time ? r.sign_out_time.substring(0, 5) : '22:30');",
  "                  setRevisionLeaveHour(r.leave_hour ? r.leave_hour.toString().split('.')[0].substring(0, 5) : '00:00');",
  "                  setRevisionReserveHoliday(r.reserve_holiday || '');",
  "                  setRevisionComment('');",
  '                  setShowUserRevisionModal(true);',
  '                }}',
  '                formatDate={formatDate}',
  '                formatTimeToAMPM={formatTimeToAMPM}',
  '                getCleanComment={getCleanComment}',
  '                renderStatusBadge={renderStatusBadge}',
  '              />'
];

// --- Splicing (Bottom to Top) ---

lines.splice(masterStart, masterEnd - masterStart + 1, ...masterReplacement);
lines.splice(adminRecordsStart, adminRecordsEnd - adminRecordsStart + 1, ...adminRecordsReplacement);
lines.splice(userStatsStart, userStatsEnd - userStatsStart + 1, ...userStatsReplacement);

// Add imports
const importInsertIndex = 6;
const importsToAdd = [
  "import { UserStats } from '@/components/UserStats';",
  "import { UserRecordsTable } from '@/components/UserRecordsTable';",
  "import { StaffMasterTable } from '@/components/StaffMasterTable';",
  "import { AdminRecordsTable } from '@/components/AdminRecordsTable';"
];
lines.splice(importInsertIndex, 0, ...importsToAdd);

fs.writeFileSync(pagePath, lines.join('\n'), 'utf8');
console.log("Splitting applied successfully!");
