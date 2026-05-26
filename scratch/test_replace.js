const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/kamru/.gemini/antigravity/scratch/chuti/src/app/page.tsx';
const content = fs.readFileSync(filePath, 'utf8');

// Target 1: parseIntervalToMinutes block
const target1 = `const parseIntervalToMinutes = (intervalStr: string | null | undefined) => {
  if (!intervalStr) return 0;
  const clean = intervalStr.toString().replace('-', '');
  const parts = clean.split(':');
  if (parts.length >= 2) {
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    return h * 60 + m;
  }
  return 0;
};`;

// Target 2: getUserSummaryStats block
const target2 = `  const getUserSummaryStats = (userId: string) => {
    const userRecs = adminRecords.filter(r => {
      if (r.user_id !== userId) return false;
      if (r.status !== 'approved') return false;
      if (selectedYear !== 'all' && r.date && r.date.substring(0, 4) !== selectedYear) return false;
      if (filterType !== 'all' && r.leave_type !== filterType) return false;
      if (filterStartDate && r.date < filterStartDate) return false;
      if (filterEndDate && r.date > filterEndDate) return false;
      return true;
    });
    let full = 0;
    let shortMins = 0;
    let reserve = 0;
    let overtimeMins = 0;
    userRecs.forEach(r => {
      if (r.leave_type === 'Full Leave') {
        if (!r.adjustment) full++;
      } else if (r.leave_type === 'Reserve') {
        if (r.adjustment) {
          if (r.adjust_short_leave) {
            full--;
          }
        } else {
          reserve++;
        }
      } else if (r.leave_type === 'Short Leave') {
        if (!r.adjustment) {
          if (r.leave_hour) {
            const parts = r.leave_hour.toString().split(':');
            if (parts.length >= 2) {
              shortMins += Number(parts[0]) * 60 + Number(parts[1]);
            }
          }
        }
      } else if (r.leave_type === 'Overtime') {
        if (!r.adjustment) {
          if (r.leave_hour) {
            const parts = r.leave_hour.toString().split(':');
            if (parts.length >= 2) {
              overtimeMins += Number(parts[0]) * 60 + Number(parts[1]);
            }
          }
        } else if (r.adjust_short_leave) {
          if (r.leave_hour) {
            const parts = r.leave_hour.toString().split(':');
            if (parts.length >= 2) {
              shortMins -= Number(parts[0]) * 60 + Number(parts[1]);
            }
          }
        }
      }
    });
    const shortHoursStr = \`\${String(Math.floor(shortMins / 60)).padStart(2, '0')}:\${String(shortMins % 60).padStart(2, '0')}\`;
    const overtimeHoursStr = \`\${String(Math.floor(overtimeMins / 60)).padStart(2, '0')}:\${String(overtimeMins % 60).padStart(2, '0')}\`;
    return { full, short: shortHoursStr, reserve, overtime: overtimeHoursStr };
  };`;

// Target 3: calculateUserStats block
const target3 = `  // 6. User Leave Calculations (Google Sheets logic match)
  const calculateUserStats = () => {
    const list = getFilteredUserRecords();
    let totalShortMinutes = 0;
    let totalOvertimeMinutes = 0;
    let totalFullLeaves = 0;
    let totalReserveLeaves = 0;

    list.forEach(r => {
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

    const isShortNegative = totalShortMinutes < 0;
    const absShortMins = Math.abs(totalShortMinutes);
    const shortH = Math.floor(absShortMins / 60);
    const shortM = absShortMins % 60;
    const shortHoursStr = \`\${isShortNegative ? '-' : ''}\${String(shortH).padStart(2, '0')}:\&nbsp;\`;`; // Wait, let's double check line 2251: it is:
    // const shortHoursStr = `${isShortNegative ? '-' : ''}${String(shortH).padStart(2, '0')}:${String(shortM).padStart(2, '0')}`;
    // Oh! My target3 definition has formatting/escape differences!
    // Let's use simple substring searches or exact line-by-line matches rather than long literal strings.
