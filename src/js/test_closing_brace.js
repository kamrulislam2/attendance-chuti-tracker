const fs = require('fs');

const backupPath = 'C:/Users/kamru/.gemini/antigravity/scratch/chuti/src/app/page.tsx.bak';
const content = fs.readFileSync(backupPath, 'utf8');
const lines = content.split('\n');

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

// 1. parseIntervalToMinutes
let parseStart = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const parseIntervalToMinutes =')) { parseStart = i; break; }
}
let parseEnd = findClosingBrace(lines, parseStart);
console.log(`parseIntervalToMinutes: start line = ${parseStart + 1}, end line = ${parseEnd + 1}`);

// 2. getUserSummaryStats
let summaryStart = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const getUserSummaryStats =')) { summaryStart = i; break; }
}
let summaryEnd = findClosingBrace(lines, summaryStart);
console.log(`getUserSummaryStats: start line = ${summaryStart + 1}, end line = ${summaryEnd + 1}`);

// 3. calculateUserStats
let userStatsStart = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const calculateUserStats =')) { userStatsStart = i; break; }
}
let userStatsEnd = findClosingBrace(lines, userStatsStart);
console.log(`calculateUserStats: start line = ${userStatsStart + 1}, end line = ${userStatsEnd + 1}`);
