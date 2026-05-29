import fs from 'fs';
import path from 'path';

const pagePath = path.resolve('src/app/page.tsx');
const content = fs.readFileSync(pagePath, 'utf8');
const lines = content.split(/\r?\n/);

console.log("=== Finding UserStats & UserRecordsTable block ===");
let userStatsStart = -1;
let userStatsEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{/* Summary Cards */}') && lines[i+1].includes('<div className="flex flex-wrap justify-center')) {
    userStatsStart = i;
    break;
  }
}

// Find userStatsEnd (it should close the Personal Chuti Records Table)
if (userStatsStart !== -1) {
  for (let i = userStatsStart; i < lines.length; i++) {
    // Look for the end of the staff view, right before admin view
    if (lines[i].includes('/* ================= ADMIN VIEW ================= */')) {
      // Find the closing parenthesised block before this comment
      for (let j = i; j > userStatsStart; j--) {
        if (lines[j].trim() === ')}' || lines[j].trim() === ')}') {
          userStatsEnd = j - 1; // It is inside the staff view check
          break;
        }
      }
      break;
    }
  }
}

console.log(`UserStats start: ${userStatsStart + 1}, end: ${userStatsEnd + 1}`);
for (let i = userStatsEnd - 5; i <= userStatsEnd + 5; i++) {
  if (lines[i]) console.log(`${i+1}: ${lines[i]}`);
}

console.log("\n=== Finding AdminRecordsTable block ===");
let adminRecordsStart = -1;
let adminRecordsEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('スタッフ ছুটির ফিল্টারিং প্যানেল') || lines[i].includes('স্টাফ ছুটির ফিল্টারিং প্যানেল')) {
    // Find the enclosing div/panel starting element above it
    for (let j = i; j > 0; j--) {
      if (lines[j].includes('<div className="bg-slate-900/40 backdrop-blur-xl border border-slate-900 shadow-2xl')) {
        adminRecordsStart = j;
        break;
      }
    }
    break;
  }
}

// The end is the closing of the viewed staff records table
if (adminRecordsStart !== -1) {
  for (let i = adminRecordsStart; i < lines.length; i++) {
    if (lines[i].includes('/* ================= STAFF MASTER DATABASE SUMMARY TABLE ================= */') || lines[i].includes('STAFF MASTER DATABASE SUMMARY TABLE')) {
      // Walk back to find the closing div of the records table
      for (let j = i; j > adminRecordsStart; j--) {
        if (lines[j].trim() === '</div>') {
          adminRecordsEnd = j;
          break;
        }
      }
      break;
    }
  }
}

console.log(`AdminRecords start: ${adminRecordsStart + 1}, end: ${adminRecordsEnd + 1}`);
for (let i = adminRecordsStart - 2; i <= adminRecordsStart + 2; i++) {
  if (lines[i]) console.log(`START ${i+1}: ${lines[i]}`);
}
for (let i = adminRecordsEnd - 2; i <= adminRecordsEnd + 2; i++) {
  if (lines[i]) console.log(`END ${i+1}: ${lines[i]}`);
}

console.log("\n=== Finding StaffMasterTable block ===");
let masterStart = -1;
let masterEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('/* ================= STAFF MASTER DATABASE SUMMARY TABLE ================= */') || lines[i].includes('STAFF MASTER DATABASE SUMMARY TABLE')) {
    masterStart = i + 1; // Start from the <div className=...> below it
    break;
  }
}

if (masterStart !== -1) {
  // Find the end of the admin view before rendering welcome popup
  for (let i = masterStart; i < lines.length; i++) {
    if (lines[i].includes('{/* Welcome & Profile Update Onboarding Popup */}')) {
      for (let j = i; j > masterStart; j--) {
        if (lines[j].trim() === '</div>') {
          masterEnd = j;
          break;
        }
      }
      break;
    }
  }
}

console.log(`StaffMasterTable start: ${masterStart + 1}, end: ${masterEnd + 1}`);
for (let i = masterStart - 2; i <= masterStart + 2; i++) {
  if (lines[i]) console.log(`START ${i+1}: ${lines[i]}`);
}
for (let i = masterEnd - 2; i <= masterEnd + 2; i++) {
  if (lines[i]) console.log(`END ${i+1}: ${lines[i]}`);
}
