const fs = require('fs');

const backupPath = 'C:/Users/kamru/.gemini/antigravity/scratch/chuti/src/app/page.tsx.bak';
const content = fs.readFileSync(backupPath, 'utf8');
const lines = content.split('\n');

function checkBlockBraces(name, start, end) {
  let open = 0, close = 0;
  for (let i = start; i <= end; i++) {
    for (let char of lines[i]) {
      if (char === '{') open++;
      if (char === '}') close++;
    }
  }
  console.log(`${name} (lines ${start+1}-${end+1}): open=${open}, close=${close}, diff=${open-close}`);
  if (open !== close) {
    console.log("WARNING: Block is not balanced!");
  }
}

// 1. parseIntervalToMinutes
let parseStart = -1, parseEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const parseIntervalToMinutes =')) { parseStart = i; break; }
}
if (parseStart !== -1) {
  for (let i = parseStart; i < lines.length; i++) {
    if (lines[i].trim() === '};') { parseEnd = i; break; }
  }
}
checkBlockBraces('parseIntervalToMinutes', parseStart, parseEnd);

// 2. getUserSummaryStats
let summaryStart = -1, summaryEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const getUserSummaryStats =')) { summaryStart = i; break; }
}
if (summaryStart !== -1) {
  for (let i = summaryStart; i < lines.length; i++) {
    if (lines[i].trim() === '};') { summaryEnd = i; break; }
  }
}
checkBlockBraces('getUserSummaryStats', summaryStart, summaryEnd);

// 3. calculateUserStats
let userStatsStart = -1, userStatsEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const calculateUserStats =')) { userStatsStart = i; break; }
}
if (userStatsStart !== -1) {
  for (let i = userStatsStart; i < lines.length; i++) {
    if (lines[i].trim() === '};') { userStatsEnd = i; break; }
  }
}
checkBlockBraces('calculateUserStats', userStatsStart, userStatsEnd);

// 4. staff inline calculations
let staffStart = -1, staffEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('let staffShortMins = 0;')) { staffStart = i; break; }
}
if (staffStart !== -1) {
  for (let i = staffStart; i < lines.length; i++) {
    if (lines[i].includes('const staffOvertimeHours =')) { staffEnd = i; break; }
  }
}
checkBlockBraces('staff inline calculation', staffStart, staffEnd);
