import { ChutiRecord, generateUUID } from '@/utils/offlineSync';

export interface GlobalSettings {
  office_leave_default: number;
  eid_fitr_leave: number;
  eid_adha_leave: number;
  govt_holidays: any[]; // Supports date strings or { date: string; name: string } objects
  settlement_active_year?: string | null;
}

export const defaultGlobalSettings: GlobalSettings = {
  office_leave_default: 14,
  eid_fitr_leave: 0,
  eid_adha_leave: 0,
  govt_holidays: []
};

export const parseHolidayItem = (item: any): { date: string; name: string } => {
  if (item && typeof item === 'object' && item.date) {
    return { date: item.date, name: item.name || 'Government Holiday' };
  }
  return { date: String(item), name: 'Government Holiday' };
};

export const getGlobalSettingsFromProfile = (profile: any): GlobalSettings => {
  if (!profile) return defaultGlobalSettings;
  
  if (profile.global_settings) {
    try {
      const gs = typeof profile.global_settings === 'string'
        ? JSON.parse(profile.global_settings)
        : profile.global_settings;
      if (gs && typeof gs === 'object') {
        return {
          office_leave_default: Number(gs.office_leave_default ?? 14),
          eid_fitr_leave: Number(gs.eid_fitr_leave ?? 0),
          eid_adha_leave: Number(gs.eid_adha_leave ?? 0),
          govt_holidays: Array.isArray(gs.govt_holidays) ? gs.govt_holidays : [],
          settlement_active_year: gs.settlement_active_year || null
        };
      }
    } catch (e) {
      console.error('Error parsing global_settings:', e);
    }
  }
  
  if (profile.requested_default_sign_in && profile.requested_default_sign_in.startsWith('{')) {
    try {
      const gs = JSON.parse(profile.requested_default_sign_in);
      if (gs && typeof gs === 'object') {
        return {
          office_leave_default: Number(gs.office_leave_default ?? 14),
          eid_fitr_leave: Number(gs.eid_fitr_leave ?? 0),
          eid_adha_leave: Number(gs.eid_adha_leave ?? 0),
          govt_holidays: Array.isArray(gs.govt_holidays) ? gs.govt_holidays : [],
          settlement_active_year: gs.settlement_active_year || null
        };
      }
    } catch (e) {
      console.error('Error parsing fallback settings:', e);
    }
  }
  
  return defaultGlobalSettings;
};

// Helper function to clean supervisor/admin approval prefix and adjustments from comment for table display
export const getCleanComment = (comment: string | null | undefined): string => {
  if (!comment) return '';
  let clean = comment;
  
  // Clean approval prefixes
  const regex = /^[A-Za-z0-9_-]+\s+Approved(?:\s*\|\s*)?/;
  while (regex.test(clean)) {
    clean = clean.replace(regex, '');
  }
  
  // Clean adjustment prefixes
  const adjRegex = /^Adjusted:\s*(?:Office Leave|Eid-ul-Fitr|Eid-ul-Adha|Govt Holiday)(?:\s*\|\s*)?/;
  while (adjRegex.test(clean)) {
    clean = clean.replace(adjRegex, '');
  }
  
  return clean.trim();
};

// Helper function to format date from YYYY-MM-DD to DD-MM-YYYY
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateString;
};

export const escapeHtml = (unsafeStr: unknown): string => {
  if (unsafeStr === null || unsafeStr === undefined) return '';
  return unsafeStr
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Helper functions for time parsing and formatting
export const parseTimeToMinutes = (timeStr: string) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export const formatDuration = (totalMinutes: number) => {
  const isNegative = totalMinutes < 0;
  const absMinutes = Math.abs(totalMinutes);
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;
  
  const hoursStr = String(hours).padStart(2, '0');
  const minsStr = String(mins).padStart(2, '0');
  
  return `${isNegative ? '-' : ''}${hoursStr}:${minsStr}`;
};

export const parseIntervalToMinutes = (intervalStr: string | null | undefined) => {
  if (!intervalStr) return 0;
  const clean = intervalStr.toString().replace(/-/g, '');
  const parts = clean.split(':');
  if (parts.length >= 2) {
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    return h * 60 + m;
  }
  return 0;
};

export const calculateStats = (records: ChutiRecord[]) => {
  let totalShortMinutes = 0;
  let totalOvertimeMinutes = 0;
  let totalFullLeaves = 0;
  const totalReserveLeaves = 0;
  
  let officeLeavesTaken = 0;
  let eidFitrTaken = 0;
  let eidAdhaTaken = 0;
  let govtHolidaysTaken = 0;

  records.forEach(r => {
    // Count only approved leaves in total counters
    if (r.status === 'approved') {
      const isOfficeLeave = r.adjustment && (r.comment?.includes("Office Leave") || r.reserve_holiday === "Office Leave" || false);
      const isEidFitr = r.adjustment && (r.comment?.includes("Eid-ul-Fitr") || r.reserve_holiday === "Eid-ul-Fitr" || false);
      const isEidAdha = r.adjustment && (r.comment?.includes("Eid-ul-Adha") || r.reserve_holiday === "Eid-ul-Adha" || false);
      const isGovtHoliday = r.adjustment && (r.comment?.includes("Govt Holiday") || r.reserve_holiday === "Govt Holiday" || false);
      const hasCategoryAdj = isOfficeLeave || isEidFitr || isEidAdha || isGovtHoliday;

      if (r.leave_type === 'Full Leave') {
        if (hasCategoryAdj) {
          if (isOfficeLeave) officeLeavesTaken++;
          else if (isEidFitr) eidFitrTaken++;
          else if (isEidAdha) eidAdhaTaken++;
          else if (isGovtHoliday) govtHolidaysTaken++;
        } else {
          if (!r.adjustment) totalFullLeaves++;
        }
      } else if (r.leave_type === 'Short Leave') {
        if (r.leave_hour) {
          let mins = parseIntervalToMinutes(r.leave_hour);
          const isNegative = r.leave_hour.toString().startsWith('-');
          if (r.adjustment) {
            mins = 0;
            const fullAdjMins = parseIntervalToMinutes(r.leave_hour);
            totalOvertimeMinutes -= isNegative ? -fullAdjMins : fullAdjMins;
          } else if (r.adjusted_hour) {
            const adjMins = parseIntervalToMinutes(r.adjusted_hour);
            mins = Math.max(0, mins - adjMins);
            totalOvertimeMinutes -= isNegative ? -adjMins : adjMins;
          }
          totalShortMinutes += isNegative ? -mins : mins;
        }
      } else if (r.leave_type === 'Overtime') {
        if (r.leave_hour) {
          let mins = parseIntervalToMinutes(r.leave_hour);
          const isNegative = r.leave_hour.toString().startsWith('-');
          if (r.adjustment) {
            mins = 0;
            if (r.adjust_short_leave) {
              const otMins = parseIntervalToMinutes(r.leave_hour);
              totalShortMinutes -= isNegative ? -otMins : otMins;
            }
          } else if (r.adjusted_hour) {
            const adjMins = parseIntervalToMinutes(r.adjusted_hour);
            mins = Math.max(0, mins - adjMins);
            if (r.adjust_short_leave) {
              totalShortMinutes -= isNegative ? -adjMins : adjMins;
            }
          }
          totalOvertimeMinutes += isNegative ? -mins : mins;
        }
      }
    }
  });

  return {
    shortHours: formatDuration(totalShortMinutes),
    overtimeHours: formatDuration(totalOvertimeMinutes),
    fullLeaves: Math.max(0, totalFullLeaves),
    reserveLeaves: totalReserveLeaves,
    totalHours: formatDuration(totalShortMinutes),
    officeLeavesTaken,
    eidFitrTaken,
    eidAdhaTaken,
    govtHolidaysTaken
  };
};

export const checkIfHolidayOrWeekend = (dateString: string, globalSettings: GlobalSettings): boolean => {
  if (!dateString) return false;
  
  const parts = dateString.split('-').map(Number);
  if (parts.length === 3) {
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    const day = dateObj.getDay();
    if (day === 5 || day === 6) { // Friday and Saturday
      return true;
    }
  }
  
  const holidays = globalSettings?.govt_holidays || [];
  const isGovtHoliday = holidays.some((h: any) => {
    const hDate = typeof h === 'object' ? h.date : String(h);
    return hDate === dateString;
  });
  
  return isGovtHoliday;
};

export const calculateLeaveOrOvertime = (
  type: string,
  actualStart: string,
  actualEnd: string,
  shiftStart: string,
  shiftEnd: string,
  workingHours: number = 9.5,
  isHoliday: boolean = false
) => {
  if (type === 'Full Leave') {
    return '00:00';
  }
  if (!actualStart || !actualEnd) return '00:00';

  const shiftStartMins = parseTimeToMinutes(shiftStart);
  
  const getShiftRelativeMins = (t: string) => {
    let m = parseTimeToMinutes(t);
    if (m < shiftStartMins - 4 * 60) {
      m += 24 * 60;
    }
    return m;
  };

  const shiftEndMins = getShiftRelativeMins(shiftEnd);
  const actualStartMins = getShiftRelativeMins(actualStart);
  const actualEndMins = getShiftRelativeMins(actualEnd);

  if (type === 'Short Leave') {
    const lateIn = Math.max(0, actualStartMins - shiftStartMins);
    const earlyOut = Math.max(0, shiftEndMins - actualEndMins);
    return formatDuration(Math.max(0, lateIn + earlyOut));
  } else if (type === 'Overtime') {
    let worked = actualEndMins - actualStartMins;
    if (worked < 0) {
      worked += 24 * 60;
    }
    if (isHoliday) {
      return formatDuration(Math.max(0, worked));
    } else {
      const regular = workingHours * 60;
      return formatDuration(Math.max(0, worked - regular));
    }
  }
  return '00:00';
};

export const formatWorkingHours = (hours: number | string) => {
  const h = parseFloat(String(hours));
  if (isNaN(h)) return '9 hours 30 mins';
  const wholeHours = Math.floor(h);
  const fraction = h - wholeHours;
  if (fraction === 0.5) {
    return `${wholeHours} hours 30 mins`;
  }
  if (fraction === 0) {
    return `${wholeHours} hours`;
  }
  return `${h} hours`;
};

// Time format to AM/PM style (e.g. 07:25 PM)
export const formatTimeToAMPM = (timeStr: string | null) => {
  if (!timeStr) return '-';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour should be 12
  const formattedHours = String(hours).padStart(2, '0');
  return `${formattedHours}:${minutes} ${ampm}`;
};

export const getDetailedLeaveLabel = (rec: { leave_type: string; reserve_holiday?: string | null }) => {
  return rec.leave_type;
};

export interface HalfYearlyOfficeLeaveStats {
  h1Total: number;
  h1Taken: number;
  h1Remaining: number;
  carryForward: number;
  h2Total: number;
  h2Taken: number;
  h2Remaining: number;
  currentHalf: 1 | 2;
}

export const calculateHalfYearlyOfficeLeave = (
  records: ChutiRecord[],
  officeLeaveDefault: number,
  selectedYear: string
): HalfYearlyOfficeLeaveStats => {
  const h1Quota = Math.floor(officeLeaveDefault / 2); // 7 days
  const h2Quota = officeLeaveDefault - h1Quota; // 7 days

  // Filter approved full-day records for the selected year
  const approvedRecs = records.filter(r => r.status === 'approved' && r.date && r.date.substring(0, 4) === selectedYear);

  let h1Taken = 0;
  let h2Taken = 0;

  approvedRecs.forEach(r => {
    // Only count full-day leaves (Full Leave) that count against office leave
    const isFullLeave = r.leave_type === 'Full Leave';
    if (!isFullLeave) return;

    // Check if it should count against office leave: 
    // It should count only if it is NOT adjusted, OR if it is adjusted specifically as "Office Leave".
    const shouldCountAsOffice = !r.adjustment || (r.adjustment && (r.comment?.includes("Office Leave") || r.reserve_holiday === "Office Leave"));
    if (!shouldCountAsOffice) return;

    const month = parseInt(r.date.substring(5, 7), 10);
    if (month <= 6) {
      h1Taken++;
    } else {
      h2Taken++;
    }
  });

  const h1Remaining = h1Quota - h1Taken;
  const carryForward = Math.max(0, h1Remaining);
  const h2Total = h2Quota + carryForward;
  const h2Remaining = h2Total - h2Taken;

  // Determine current active half
  const now = new Date();
  const currentYear = now.getFullYear().toString();
  let currentHalf: 1 | 2 = 1;
  if (selectedYear < currentYear) {
    currentHalf = 2; // Past year is fully complete, default to H2
  } else if (selectedYear > currentYear) {
    currentHalf = 1; // Future year starts in H1
  } else {
    currentHalf = (now.getMonth() + 1) <= 6 ? 1 : 2;
  }

  return {
    h1Total: h1Quota,
    h1Taken,
    h1Remaining,
    carryForward,
    h2Total: h2Quota,
    h2Taken,
    h2Remaining,
    currentHalf,
  };
};

// Helper to safely extract existing notifications from a ChutiRecord's admin_edit_request
export const getExistingNotifications = (record: ChutiRecord): any[] => {
  if (record.admin_edit_request && typeof record.admin_edit_request === 'object' && 'notifications' in record.admin_edit_request) {
    return (record.admin_edit_request as { notifications?: any[] }).notifications || [];
  }
  return [];
};

// Factory to create a notification object with auto-generated id and timestamp
export const createNotification = (type: string, title: string, body: string) => ({
  id: generateUUID(),
  type,
  timestamp: new Date().toISOString(),
  title,
  body,
});
