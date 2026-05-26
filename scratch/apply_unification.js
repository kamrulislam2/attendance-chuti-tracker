const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/kamru/.gemini/antigravity/scratch/chuti/src/app/page.tsx';
const backupPath = filePath + '.bak';

// 1. Revert to original backup to start clean
if (fs.existsSync(backupPath)) {
  fs.copyFileSync(backupPath, filePath);
  console.log("Reverted page.tsx to original backup.");
} else {
  console.error("Backup file not found!");
  process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log(`Loaded page.tsx, total lines: ${lines.length}`);

// Brace depth matching helper
function findClosingBrace(lines, startLine) {
  let depth = 0;
  let foundStart = false;
  for (let i = startLine; i < lines.length; i++) {
    for (let char of lines[i]) {
      if (char === '{') {
        depth++;
        foundStart = true;
      }
      if (char === '}') {
        depth--;
      }
    }
    if (foundStart && depth === 0) {
      return i;
    }
  }
  return -1;
}

// 1. Find parseIntervalToMinutes
let parseStart = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const parseIntervalToMinutes =')) {
    parseStart = i;
    break;
  }
}
let parseEnd = findClosingBrace(lines, parseStart);

// 2. Find getUserSummaryStats
let summaryStart = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const getUserSummaryStats =')) {
    summaryStart = i;
    break;
  }
}
let summaryEnd = findClosingBrace(lines, summaryStart);

// 3. Find calculateUserStats
let userStatsStart = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const calculateUserStats =')) {
    userStatsStart = i;
    break;
  }
}
let userStatsEnd = findClosingBrace(lines, userStatsStart);

// 4. Find staff inline calculations block
let staffStart = -1;
let staffEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('let staffShortMins = 0;')) {
    staffStart = i;
    break;
  }
}
if (staffStart !== -1) {
  for (let i = staffStart; i < lines.length; i++) {
    if (lines[i].includes('const staffOvertimeHours =')) {
      staffEnd = i;
      break;
    }
  }
}

if (parseStart === -1 || parseEnd === -1 || summaryStart === -1 || summaryEnd === -1 || userStatsStart === -1 || userStatsEnd === -1 || staffStart === -1 || staffEnd === -1) {
  console.error("Error: Could not find all blocks in page.tsx!");
  process.exit(1);
}

console.log(`All block coordinates found successfully:`);
console.log(`- parseIntervalToMinutes: lines ${parseStart + 1} to ${parseEnd + 1}`);
console.log(`- getUserSummaryStats: lines ${summaryStart + 1} to ${summaryEnd + 1}`);
console.log(`- calculateUserStats: lines ${userStatsStart + 1} to ${userStatsEnd + 1}`);
console.log(`- staff inline calculation: lines ${staffStart + 1} to ${staffEnd + 1}`);

// Define the replacement content
const calculateStatsCode = `
const calculateStats = (records: any[]) => {
  let totalShortMinutes = 0;
  let totalOvertimeMinutes = 0;
  let totalFullLeaves = 0;
  let totalReserveLeaves = 0;

  records.forEach(r => {
    // Count only approved leaves in total counters
    if (r.status === 'approved') {
      if (r.leave_type === 'Full Leave') {
        if (!r.adjustment) totalFullLeaves++;
      } else if (r.leave_type === 'Reserve') {
        if (r.adjustment) {
          if (r.adjust_short_leave) {
            totalFullLeaves--;
          }
        } else {
          totalReserveLeaves++;
        }
      } else if (r.leave_type === 'Short Leave') {
        if (r.leave_hour) {
          let mins = parseIntervalToMinutes(r.leave_hour);
          if (r.adjustment) {
            mins = 0;
          } else if (r.adjusted_hour) {
            const adjMins = parseIntervalToMinutes(r.adjusted_hour);
            mins = Math.max(0, mins - adjMins);
          }
          const isNegative = r.leave_hour.toString().startsWith('-');
          totalShortMinutes += isNegative ? -mins : mins;
        }
      } else if (r.leave_type === 'Overtime') {
        if (r.leave_hour) {
          let mins = parseIntervalToMinutes(r.leave_hour);
          if (r.adjustment) {
            mins = 0;
            if (r.adjust_short_leave) {
              const isNegative = r.leave_hour.toString().startsWith('-');
              const otMins = parseIntervalToMinutes(r.leave_hour);
              totalShortMinutes -= isNegative ? -otMins : otMins;
            }
          } else if (r.adjusted_hour) {
            const adjMins = parseIntervalToMinutes(r.adjusted_hour);
            mins = Math.max(0, mins - adjMins);
          }
          const isNegative = r.leave_hour.toString().startsWith('-');
          totalOvertimeMinutes += isNegative ? -mins : mins;
        }
      }
    }
  });

  return {
    shortHours: formatDuration(totalShortMinutes),
    overtimeHours: formatDuration(totalOvertimeMinutes),
    fullLeaves: totalFullLeaves,
    reserveLeaves: totalReserveLeaves,
    totalHours: formatDuration(totalShortMinutes)
  };
};
`;

const getUserSummaryStatsCode = `  const getUserSummaryStats = (userId: string) => {
    const userRecs = adminRecords.filter(r => {
      if (r.user_id !== userId) return false;
      if (r.status !== 'approved') return false;
      if (selectedYear !== 'all' && r.date && r.date.substring(0, 4) !== selectedYear) return false;
      if (filterType !== 'all' && r.leave_type !== filterType) return false;
      if (filterStartDate && r.date < filterStartDate) return false;
      if (filterEndDate && r.date > filterEndDate) return false;
      return true;
    });
    const stats = calculateStats(userRecs);
    return {
      full: stats.fullLeaves,
      short: stats.shortHours,
      reserve: stats.reserveLeaves,
      overtime: stats.overtimeHours
    };
  };`;

const calculateUserStatsCode = `  // 6. User Leave Calculations (Google Sheets logic match)
  const calculateUserStats = () => {
    const list = getFilteredUserRecords();
    return calculateStats(list);
  };`;

const staffStatsCode = `  const staffStats = calculateStats(individualRecords);
  const staffHours = staffStats.shortHours;
  const staffFull = staffStats.fullLeaves;
  const staffReserve = staffStats.reserveLeaves;
  const staffOvertimeHours = staffStats.overtimeHours;`;

// Construct the new lines
const newLines = [];

// Part 1: from beginning to parseEnd (inclusive of parseIntervalToMinutes)
for (let i = 0; i <= parseEnd; i++) {
  newLines.push(lines[i]);
}

// Add calculateStats function
newLines.push(calculateStatsCode);

// Part 2: from parseEnd + 1 to summaryStart - 1
for (let i = parseEnd + 1; i < summaryStart; i++) {
  newLines.push(lines[i]);
}

// Add new getUserSummaryStats
newLines.push(getUserSummaryStatsCode);

// Part 3: from summaryEnd + 1 to userStatsStart - 1
for (let i = summaryEnd + 1; i < userStatsStart; i++) {
  newLines.push(lines[i]);
}

// Add new calculateUserStats
newLines.push(calculateUserStatsCode);

// Part 4: from userStatsEnd + 1 to staffStart - 1
for (let i = userStatsEnd + 1; i < staffStart; i++) {
  newLines.push(lines[i]);
}

// Add new staff stats calculations
newLines.push(staffStatsCode);

// Part 5: from staffEnd + 1 to end of file
for (let i = staffEnd + 1; i < lines.length; i++) {
  newLines.push(lines[i]);
}

// Write updated content back
const newContent = newLines.join('\n');
fs.writeFileSync(filePath, newContent, 'utf8');
console.log(`Successfully updated ${filePath}!`);
console.log(`New total lines: ${newContent.split('\n').length}`);
