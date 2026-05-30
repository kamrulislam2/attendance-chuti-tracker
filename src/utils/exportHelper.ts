import { User as SupabaseUser } from '@supabase/supabase-js';
import { Profile } from '../types';
import { ChutiRecord } from './offlineSync';

// Helper function to format date from YYYY-MM-DD to DD-MM-YYYY
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateString;
};

// Helper function to format time in HH:MM to 12-hour AM/PM format
const formatTimeToAMPM = (timeStr: string | null | undefined): string => {
  if (!timeStr) return '-';
  try {
    const [hoursStr, minutesStr] = timeStr.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${displayHours}:${displayMinutes} ${ampm}`;
  } catch {
    return timeStr;
  }
};

// Helper function to clean supervisor/admin approval prefix from comment for table display
const getCleanComment = (comment: string | null | undefined): string => {
  if (!comment) return '';
  let clean = comment;
  const regex = /^[A-Za-z0-9_-]+\s+Approved(?:\s*\|\s*)?/;
  while (regex.test(clean)) {
    clean = clean.replace(regex, '');
  }
  return clean.trim();
};

const escapeHtml = (unsafeStr: unknown): string => {
  if (unsafeStr === null || unsafeStr === undefined) return '';
  return unsafeStr
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const exportHelper = {
  // Export individual staff report as CSV
  exportIndividualCSV: (
    userId: string,
    recordsToExport: ChutiRecord[],
    staffProfile: Profile | null,
    sessionUser: SupabaseUser | null,
    profile: Profile | null,
    filters: {
      selectedYear?: string;
      filterType?: string;
      filterStartDate?: string;
      filterEndDate?: string;
      searchTerm?: string;
    },
    onSuccess: () => void,
    onError: (msg: string) => void
  ) => {
    const activeProfile = staffProfile || (userId === sessionUser?.id ? profile : null);
    if (recordsToExport.length === 0) {
      onError('রপ্তানি (Export) করার মতো কোনো ডাটা পাওয়া যায়নি!');
      return;
    }

    const showOvertime = activeProfile?.allow_overtime === true;
    const showReserve = activeProfile?.allow_reserve === true;

    const headers = ['Date', 'Leave Type', 'Adjustment Status', 'Sign In Time', 'Sign Out Time', 'Leave Hour'];
    if (showOvertime) headers.push('Overtime');
    if (showReserve) headers.push('Reserve Holiday');
    headers.push('Comment', 'Status');

    const rows = recordsToExport.map(record => {
      let adjustmentVal = 'No';
      if (record.leave_type === 'Reserve') {
        if (record.reserve_adjustment_status === 'approved' || record.adjustment) {
          adjustmentVal = 'Yes';
        } else if (record.reserve_adjustment_status === 'pending') {
          adjustmentVal = 'Pending';
        } else if (record.reserve_adjustment_status === 'rejected') {
          adjustmentVal = 'Rejected';
        }
      } else {
        if (record.adjustment) {
          adjustmentVal = 'Yes';
        } else if (record.adjusted_hour) {
          const adjHourStr = record.adjusted_hour.toString().split('.')[0].substring(0, 5);
          adjustmentVal = `Partial (${adjHourStr})`;
        }
      }

      const signInStr = record.leave_type === 'Reserve' || record.leave_type === 'Full Leave' ? '-' : formatTimeToAMPM(record.sign_in_time);
      const signOutStr = record.leave_type === 'Reserve' || record.leave_type === 'Full Leave' ? '-' : formatTimeToAMPM(record.sign_out_time);
      const leaveHourStr = record.leave_type === 'Reserve' || record.leave_type === 'Full Leave' || record.leave_type === 'Overtime' ? '-' : (record.leave_hour ? record.leave_hour.toString().split('.')[0].substring(0, 5) : '-');

      const row = [
        `="${formatDate(record.date)}"`, // force Excel to treat date as text
        record.leave_type,
        adjustmentVal,
        signInStr,
        signOutStr,
        leaveHourStr
      ];

      if (showOvertime) {
        const overtimeStr = record.leave_type === 'Overtime' ? (record.leave_hour ? record.leave_hour.toString().split('.')[0].substring(0, 5) : '-') : '-';
        row.push(overtimeStr);
      }

      if (showReserve) {
        row.push(record.reserve_holiday || '-');
      }

      row.push(
        `="${(getCleanComment(record.comment) || '').replace(/"/g, '""')}"`,
        record.status || ''
      );

      return row;
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));

    let filename = `leave_report_${(activeProfile?.username || 'user').toUpperCase()}`;
    if (filters.selectedYear && filters.selectedYear !== 'all') {
      filename += `_year_${filters.selectedYear}`;
    }
    if (filters.filterType && filters.filterType !== 'all') {
      filename += `_type_${filters.filterType.replace(/\s+/g, '_')}`;
    }
    if (filters.filterStartDate && filters.filterEndDate) {
      filename += `_${filters.filterStartDate}_to_${filters.filterEndDate}`;
    } else if (filters.filterStartDate) {
      filename += `_from_${filters.filterStartDate}`;
    } else if (filters.filterEndDate) {
      filename += `_until_${filters.filterEndDate}`;
    }
    if (filters.searchTerm && filters.searchTerm.trim()) {
      // sanitize search term for filename
      const cleanSearch = filters.searchTerm.trim().replace(/[^a-zA-Z0-9\u0980-\u09FF_-]/g, '_');
      filename += `_search_${cleanSearch}`;
    }
    if (
      (!filters.selectedYear || filters.selectedYear === 'all') &&
      (!filters.filterType || filters.filterType === 'all') &&
      !filters.filterStartDate &&
      !filters.filterEndDate &&
      (!filters.searchTerm || !filters.searchTerm.trim())
    ) {
      filename += `_${new Date().toISOString().split('T')[0]}`;
    }
    filename += '.csv';

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onSuccess();
  },

  // Export individual staff report as Excel (HTML format)
  exportIndividualExcel: (
    userId: string,
    recordsToExport: ChutiRecord[],
    staffProfile: Profile | null,
    sessionUser: SupabaseUser | null,
    profile: Profile | null,
    filters: {
      selectedYear?: string;
      filterType?: string;
      filterStartDate?: string;
      filterEndDate?: string;
      searchTerm?: string;
    },
    onSuccess: () => void,
    onError: (msg: string) => void
  ) => {
    const activeProfile = staffProfile || (userId === sessionUser?.id ? profile : null);
    if (recordsToExport.length === 0) {
      onError('রপ্তানি (Export) করার মতো কোনো ডাটা পাওয়া যায়নি!');
      return;
    }

    const showOvertime = activeProfile?.allow_overtime === true;
    const showReserve = activeProfile?.allow_reserve === true;

    let headersHtml = `
      <th>তারিখ</th>
      <th>ধরন</th>
      <th>Adjustment</th>
      <th>সাইন ইন/আউট</th>
      <th>লিভ আওয়ার</th>
    `;
    if (showOvertime) headersHtml += `<th>ওভারটাইম</th>`;
    if (showReserve) headersHtml += `<th>রিজার্ভ ছুটি</th>`;
    headersHtml += `
      <th>মন্তব্য</th>
      <th>অবস্থা</th>
    `;

    let rowsHtml = '';
    recordsToExport.forEach(r => {
      let adjustmentVal = 'না';
      if (r.leave_type === 'Reserve') {
        if (r.reserve_adjustment_status === 'approved' || r.adjustment) {
          adjustmentVal = 'হ্যাঁ';
        } else if (r.reserve_adjustment_status === 'pending') {
          adjustmentVal = 'হ্যাঁ (Pending)';
        } else if (r.reserve_adjustment_status === 'rejected') {
          adjustmentVal = 'না (Rejected)';
        }
      } else {
        if (r.adjustment) {
          adjustmentVal = 'হ্যাঁ';
        } else if (r.adjusted_hour) {
          const adjHourStr = r.adjusted_hour.toString().split('.')[0].substring(0, 5);
          adjustmentVal = `আংশিক (${adjHourStr})`;
        }
      }

      const signInStr = r.leave_type === 'Reserve' || r.leave_type === 'Full Leave' ? '-' : formatTimeToAMPM(r.sign_in_time);
      const signOutStr = r.leave_type === 'Reserve' || r.leave_type === 'Full Leave' ? '-' : formatTimeToAMPM(r.sign_out_time);
      const leaveHourStr = r.leave_type === 'Reserve' || r.leave_type === 'Full Leave' || r.leave_type === 'Overtime' ? '-' : (r.leave_hour ? r.leave_hour.toString().split('.')[0].substring(0, 5) : '-');

      rowsHtml += `
        <tr>
          <td style="mso-number-format:'\\@';">${escapeHtml(formatDate(r.date))}</td>
          <td>${escapeHtml(r.leave_type)}</td>
          <td>${escapeHtml(adjustmentVal)}</td>
          <td>${r.leave_type === 'Reserve' || r.leave_type === 'Full Leave' ? '-' : escapeHtml(`${signInStr} / ${signOutStr}`)}</td>
          <td>${escapeHtml(leaveHourStr)}</td>
      `;

      if (showOvertime) {
        const overtimeStr = r.leave_type === 'Overtime' ? (r.leave_hour ? r.leave_hour.toString().split('.')[0].substring(0, 5) : '-') : '-';
        rowsHtml += `<td>${escapeHtml(overtimeStr)}</td>`;
      }

      if (showReserve) {
        rowsHtml += `<td>${escapeHtml(r.reserve_holiday) || '-'}</td>`;
      }

      rowsHtml += `
          <td>${escapeHtml(getCleanComment(r.comment)) || '-'}</td>
          <td>${escapeHtml(r.status)}</td>
        </tr>
      `;
    });

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"/><style>td { border: 0.5pt solid #ccc; }</style></head>
      <body>
        <h3>ছুটির বিস্তারিত রিপোর্ট: ${escapeHtml(activeProfile?.full_name)} (${escapeHtml((activeProfile?.username || '').toUpperCase())})</h3>
        <table border="1">
          <thead>
            <tr style="background-color: #4F81BD; color: white;">
              ${headersHtml}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);

    let filename = `leave_report_${(activeProfile?.username || 'user').toUpperCase()}`;
    if (filters.selectedYear && filters.selectedYear !== 'all') {
      filename += `_year_${filters.selectedYear}`;
    }
    if (filters.filterType && filters.filterType !== 'all') {
      filename += `_type_${filters.filterType.replace(/\s+/g, '_')}`;
    }
    if (filters.filterStartDate && filters.filterEndDate) {
      filename += `_${filters.filterStartDate}_to_${filters.filterEndDate}`;
    } else if (filters.filterStartDate) {
      filename += `_from_${filters.filterStartDate}`;
    } else if (filters.filterEndDate) {
      filename += `_until_${filters.filterEndDate}`;
    }
    if (filters.searchTerm && filters.searchTerm.trim()) {
      const cleanSearch = filters.searchTerm.trim().replace(/[^a-zA-Z0-9\u0980-\u09FF_-]/g, '_');
      filename += `_search_${cleanSearch}`;
    }
    if (
      (!filters.selectedYear || filters.selectedYear === 'all') &&
      (!filters.filterType || filters.filterType === 'all') &&
      !filters.filterStartDate &&
      !filters.filterEndDate &&
      (!filters.searchTerm || !filters.searchTerm.trim())
    ) {
      filename += `_${new Date().toISOString().split('T')[0]}`;
    }
    filename += '.xls';

    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onSuccess();
  },

  // Export summary report for all staff as CSV
  exportSummaryCSV: (
    staffProfiles: Profile[],
    getUserSummaryStats: (id: string) => { full: number; short: string; overtime: string; reserve: number },
    filters: {
      selectedYear?: string;
      filterType?: string;
      filterStartDate?: string;
      filterEndDate?: string;
      searchQuery?: string;
    },
    onSuccess: () => void,
    onError: (msg: string) => void
  ) => {
    if (staffProfiles.length === 0) {
      onError('রপ্তানি (Export) করার মতো কোনো ডাটা পাওয়া যায়নি!');
      return;
    }

    const headers = ['Full Name', 'Codename', 'Total Full Leave', 'Total Short Leave', 'Total Overtime', 'Total Reserve Holiday'];
    const rows = staffProfiles.map(p => {
      const stats = getUserSummaryStats(p.id);
      return [
        `"${(p.full_name || '').replace(/"/g, '""')}"`,
        p.username ? p.username.toUpperCase() : '',
        stats.full,
        stats.short,
        p.allow_overtime ? stats.overtime : '-',
        p.allow_reserve ? stats.reserve : '-'
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));

    let filename = 'staff_leaves_summary';
    if (filters.selectedYear && filters.selectedYear !== 'all') {
      filename += `_year_${filters.selectedYear}`;
    }
    if (filters.filterType && filters.filterType !== 'all') {
      filename += `_type_${filters.filterType.replace(/\s+/g, '_')}`;
    }
    if (filters.filterStartDate && filters.filterEndDate) {
      filename += `_${filters.filterStartDate}_to_${filters.filterEndDate}`;
    } else if (filters.filterStartDate) {
      filename += `_from_${filters.filterStartDate}`;
    } else if (filters.filterEndDate) {
      filename += `_until_${filters.filterEndDate}`;
    }
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const cleanSearch = filters.searchQuery.trim().replace(/[^a-zA-Z0-9\u0980-\u09FF_-]/g, '_');
      filename += `_search_${cleanSearch}`;
    }
    if (
      (!filters.selectedYear || filters.selectedYear === 'all') &&
      (!filters.filterType || filters.filterType === 'all') &&
      !filters.filterStartDate &&
      !filters.filterEndDate &&
      (!filters.searchQuery || !filters.searchQuery.trim())
    ) {
      filename += `_${new Date().toISOString().split('T')[0]}`;
    }
    filename += '.csv';

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onSuccess();
  },

  // Export summary report for all staff as Excel (HTML format)
  exportSummaryExcel: (
    staffProfiles: Profile[],
    getUserSummaryStats: (id: string) => { full: number; short: string; overtime: string; reserve: number },
    filters: {
      selectedYear?: string;
      filterType?: string;
      filterStartDate?: string;
      filterEndDate?: string;
      searchQuery?: string;
    },
    onSuccess: () => void,
    onError: (msg: string) => void
  ) => {
    if (staffProfiles.length === 0) {
      onError('রপ্তানি (Export) করার মতো কোনো ডাটা পাওয়া যায়নি!');
      return;
    }

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"/><style>td { border: 0.5pt solid #ccc; }</style></head>
      <body>
        <h3>স্টাফ উপস্থিতি ও ছুটির মাস্টার ডাটাবেজ সামারি</h3>
        <table border="1">
          <thead>
            <tr style="background-color: #4F81BD; color: white;">
              <th>স্টাফ নাম</th>
              <th>কোডনেম</th>
              <th>ফুল লিভ</th>
              <th>শর্ট লিভ</th>
              <th>ওভারটাইম</th>
              <th>রিজার্ভ হলিডে</th>
            </tr>
          </thead>
          <tbody>
    `;

    staffProfiles.forEach(p => {
      const stats = getUserSummaryStats(p.id);
      html += `
        <tr>
          <td>${p.full_name || ''}</td>
          <td>${(p.username || '').toUpperCase()}</td>
          <td>${stats.full}</td>
          <td>${stats.short}</td>
          <td>${p.allow_overtime ? stats.overtime : '-'}</td>
          <td>${p.allow_reserve ? stats.reserve : '-'}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);

    let filename = 'staff_leaves_summary';
    if (filters.selectedYear && filters.selectedYear !== 'all') {
      filename += `_year_${filters.selectedYear}`;
    }
    if (filters.filterType && filters.filterType !== 'all') {
      filename += `_type_${filters.filterType.replace(/\s+/g, '_')}`;
    }
    if (filters.filterStartDate && filters.filterEndDate) {
      filename += `_${filters.filterStartDate}_to_${filters.filterEndDate}`;
    } else if (filters.filterStartDate) {
      filename += `_from_${filters.filterStartDate}`;
    } else if (filters.filterEndDate) {
      filename += `_until_${filters.filterEndDate}`;
    }
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const cleanSearch = filters.searchQuery.trim().replace(/[^a-zA-Z0-9\u0980-\u09FF_-]/g, '_');
      filename += `_search_${cleanSearch}`;
    }
    if (
      (!filters.selectedYear || filters.selectedYear === 'all') &&
      (!filters.filterType || filters.filterType === 'all') &&
      !filters.filterStartDate &&
      !filters.filterEndDate &&
      (!filters.searchQuery || !filters.searchQuery.trim())
    ) {
      filename += `_${new Date().toISOString().split('T')[0]}`;
    }
    filename += '.xls';

    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onSuccess();
  }
};
