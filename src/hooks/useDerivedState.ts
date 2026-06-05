import { useMemo, useCallback } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Profile, ChutiRecordWithProfile, BulkRepresentative } from '@/types';
import { ChutiRecord } from '@/utils/offlineSync';
import { formatDate, calculateStats, parseHolidayItem, GlobalSettings } from '@/utils/dashboardHelpers';

// Notification item type (shared across the app)
export interface NotificationItem {
  id: string;
  chutiId?: string;
  record?: ChutiRecord;
  type: string;
  timestamp: string;
  title: string;
  body: string;
  text?: string;
  holidayDate?: string;
  holidayName?: string;
}

interface UseDerivedStateParams {
  sessionUser: SupabaseUser | null;
  profile: Profile | null;
  userRecords: ChutiRecord[];
  adminRecords: ChutiRecordWithProfile[];
  profilesList: Profile[];
  selectedYear: string;
  filterType: string;
  filterStartDate: string;
  filterEndDate: string;
  viewingStaffId: string | null;
  lastViewedTime: string | null;
  holidayResponses: any[];
  globalSettings: GlobalSettings;
  loading: boolean;
  initialFetchDone: boolean;
}

export function useDerivedState({
  sessionUser,
  profile,
  userRecords,
  adminRecords,
  profilesList,
  selectedYear,
  filterType,
  filterStartDate,
  filterEndDate,
  viewingStaffId,
  lastViewedTime,
  holidayResponses,
  globalSettings,
  loading,
  initialFetchDone,
}: UseDerivedStateParams) {

  // --- Record Filtering ---
  const applyFilters = useCallback(<T extends ChutiRecord>(records: T[]): T[] => {
    return records.filter(r => {
      if (selectedYear !== 'all' && r.date && r.date.substring(0, 4) !== selectedYear) return false;
      if (filterType !== 'all' && r.leave_type !== filterType) return false;
      if (filterStartDate && r.date < filterStartDate) return false;
      if (filterEndDate && r.date > filterEndDate) return false;
      return true;
    });
  }, [selectedYear, filterType, filterStartDate, filterEndDate]);

  const filteredUserRecords = useMemo(() => applyFilters(userRecords), [applyFilters, userRecords]);

  const getFilteredRecordsForUser = useCallback((userId: string) => {
    const baseRecords = (profile?.role === 'admin' || (profile?.role === 'supervisor' && userId !== sessionUser?.id)) 
      ? adminRecords.filter(r => r.user_id === userId) 
      : userRecords;
    return applyFilters(baseRecords);
  }, [profile, sessionUser, adminRecords, userRecords, applyFilters]);

  // --- Stats ---
  const userYearlyRecords = useMemo(() => {
    return userRecords.filter(r => selectedYear === 'all' || (r.date && r.date.substring(0, 4) === selectedYear));
  }, [userRecords, selectedYear]);

  const userStats = useMemo(() => calculateStats(userYearlyRecords), [userYearlyRecords]);

  const getUserSummaryStats = useCallback((userId: string) => {
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
      overtime: stats.overtimeHours
    };
  }, [adminRecords, selectedYear, filterType, filterStartDate, filterEndDate]);

  // --- Pending Request Grouping ---
  const groupPendingRequests = useCallback((requests: ChutiRecordWithProfile[]): BulkRepresentative[] => {
    const grouped: BulkRepresentative[] = [];
    const bulkMap = new Map<string, ChutiRecordWithProfile[]>();

    for (const req of requests) {
      if (req.bulk_id) {
        if (!bulkMap.has(req.bulk_id)) {
          bulkMap.set(req.bulk_id, []);
        }
        bulkMap.get(req.bulk_id)!.push(req);
      } else {
        grouped.push(req);
      }
    }

    bulkMap.forEach((subRequests, bulkId) => {
      subRequests.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const representative = {
        ...subRequests[0],
        id: `bulk-${bulkId}`,
        is_bulk: true,
        bulk_id: bulkId,
        all_bulk_dates: subRequests.map(s => s.date),
        all_bulk_ids: subRequests.map(s => s.id),
        all_bulk_records: subRequests,
        formatted_bulk_dates: subRequests.map(s => formatDate(s.date)).join(', '),
      };
      grouped.push(representative);
    });

    return grouped.sort((a, b) => {
      const aTime = new Date(a.created_at || a.date).getTime();
      const bTime = new Date(b.created_at || b.date).getTime();
      return bTime - aTime;
    });
  }, []);

  // --- Pending Request Lists ---
  const pendingProfileRequests = useMemo(() => 
    profilesList.filter(p => p.profile_change_status === 'pending'), 
    [profilesList]
  );

  const pendingReserveRequests = useMemo(() => 
    adminRecords.filter(r => 
      (r.leave_type === 'Overtime' && r.status === 'approved_by_supervisor') ||
      (r.reserve_adjustment_status === 'pending')
    ), 
    [adminRecords]
  );

  const pendingChutiRequests = useMemo(() => 
    adminRecords.filter(r => r.status === 'approved_by_supervisor' && r.leave_type !== 'Overtime'), 
    [adminRecords]
  );

  const pendingSupervisorRequests = useMemo(() => {
    return adminRecords.filter(r => {
      if (r.status !== 'pending_supervisor') return false;
      if (r.user_id === sessionUser?.id) return false;

      const meta = r.admin_edit_request && typeof r.admin_edit_request === 'object'
        ? (r.admin_edit_request as { supervisor_ids?: string[] })
        : null;

      if (meta && Array.isArray(meta.supervisor_ids) && meta.supervisor_ids.length > 0) {
        return meta.supervisor_ids.includes(sessionUser?.id || '');
      }

      return true;
    });
  }, [adminRecords, sessionUser]);

  const groupedSupervisorRequests = useMemo(() => 
    groupPendingRequests(pendingSupervisorRequests as ChutiRecordWithProfile[]), 
    [groupPendingRequests, pendingSupervisorRequests]
  );

  const groupedChutiRequests = useMemo(() => 
    groupPendingRequests(pendingChutiRequests as ChutiRecordWithProfile[]), 
    [groupPendingRequests, pendingChutiRequests]
  );



  // --- User Notifications ---
  const userNotificationsList = useMemo(() => {
    if (!sessionUser || !profile) return [];

    const list: NotificationItem[] = [];

    // Inject active government holiday notifications once initial load is complete
    if (initialFetchDone && profile.eligible_govt_holiday !== false) {
      const activeHolidays = (globalSettings.govt_holidays || []).map((h: any) => parseHolidayItem(h));

      activeHolidays.forEach((holiday: any) => {
        // Look up this user's response to this holiday
        const response = holidayResponses.find(r => r.user_id === profile.id && r.holiday_date === holiday.date);
        
        if (response) {
          if (response.response === 'reserve') {
            list.push({
              id: `govt-holiday-choice-${holiday.date}`,
              type: 'govt_holiday_choice',
              timestamp: response.created_at || new Date(holiday.date).toISOString(),
              title: 'সরকারি ছুটি রিজার্ভ করা হয়েছে 📥',
              body: `${holiday.name} (${formatDate(holiday.date)}) সরকারি ছুটির দিনটি আপনার রিজার্ভ ব্যালেন্সে যোগ করা হয়েছে।`
            });
          } else {
            list.push({
              id: `govt-holiday-choice-${holiday.date}`,
              type: 'govt_holiday_choice',
              timestamp: response.created_at || new Date(holiday.date).toISOString(),
              title: 'সরকারি ছুটির পেমেন্ট অনুমোদন 🎉',
              body: `${holiday.name} (${formatDate(holiday.date)}) সরকারি ছুটির পেমেন্টটি আপনার সেলারির সাথে পরিশোধ করার জন্য অনুমোদন করা হয়েছে।`
            });
          }
        } else if (profile.allow_reserve !== false) {
          // Actionable prompt: only show if the user is allowed to reserve
          list.push({
            id: `govt-holiday-prompt-${holiday.date}`,
            type: 'govt_holiday_prompt',
            timestamp: new Date(holiday.date).toISOString(),
            title: 'সরকারি ছুটির পছন্দ নির্বাচন করুন 🔔',
            body: `${holiday.name} (${formatDate(holiday.date)}) এই সরকারি ছুটির দিনটি আপনি কী করতে চান?`,
            holidayDate: holiday.date,
            holidayName: holiday.name
          });
        }
      });
    }

    // For Admin / Supervisor: inject all staff holiday responses as notifications
    if (initialFetchDone && (profile.role === 'admin' || profile.role === 'supervisor')) {
      holidayResponses.forEach((r: any) => {
        const staffName = r.profiles?.full_name || 'স্টাফ';
        const staffCode = r.profiles?.username?.toUpperCase() || 'N/A';
        const title = r.response === 'reserve' ? 'সরকারি ছুটি রিজার্ভের অনুরোধ 🔔' : 'সরকারি ছুটির পেমেন্টের অনুরোধ 🔔';
        const body = `${staffName} (${staffCode}) ${r.holiday_name} (${formatDate(r.holiday_date)}) ${
          r.response === 'reserve' ? 'ছুটি রিজার্ভ করার জন্য আগ্রহ জানিয়েছে।' : 'ছুটির পেমেন্ট নেয়ার জন্য আগ্রহ জানিয়েছে।'
        }`;
        
        list.push({
          id: `admin-holiday-resp-${r.id}`,
          type: 'admin_holiday_response',
          timestamp: r.created_at || new Date().toISOString(),
          title,
          body
        });
      });
    }

    userRecords.forEach(r => {
      const hasRequest = r.admin_edit_request && typeof r.admin_edit_request === 'object';
      const editRequestObj = r.admin_edit_request as { notifications?: NotificationItem[] } | null;
      const savedNotifications = hasRequest && editRequestObj && Array.isArray(editRequestObj.notifications)
        ? editRequestObj.notifications
        : [];

      savedNotifications.forEach(n => {
        list.push({
          ...n,
          chutiId: r.id,
          record: r
        });
      });

      if (r.status === 'needs_review') {
        const hasRevisionSaved = savedNotifications.some(n => n.type === 'revision');
        if (!hasRevisionSaved) {
          list.push({
            id: `synth-rev-${r.id}`,
            chutiId: r.id,
            record: r,
            type: 'revision',
            timestamp: r.created_at || new Date().toISOString(),
            title: 'ছুটি সংশোধনের অনুরোধ ⚠️',
            body: `আপনার ${r.leave_type} আবেদনটি সংশোধনের জন্য পাঠানো হয়েছে।`
          });
        }
      }
    });

    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [sessionUser, profile, userRecords, holidayResponses, globalSettings.govt_holidays, loading]);

  const unreadUserNotificationsCount = useMemo(() => 
    userNotificationsList.filter(
      n => !lastViewedTime || new Date(n.timestamp).getTime() > new Date(lastViewedTime).getTime()
    ).length,
    [userNotificationsList, lastViewedTime]
  );

  // --- Viewed Staff Member (individual view) ---
  const staffProfile = useMemo(() => 
    viewingStaffId ? (profilesList.find(p => p.id === viewingStaffId) || null) : null,
    [viewingStaffId, profilesList]
  );

  const individualRecords = useMemo(() => 
    viewingStaffId ? applyFilters(adminRecords.filter(r => r.user_id === viewingStaffId)) : [],
    [viewingStaffId, adminRecords, applyFilters]
  );

  const staffYearlyRecords = useMemo(() => 
    viewingStaffId ? adminRecords.filter(r => r.user_id === viewingStaffId && (selectedYear === 'all' || (r.date && r.date.substring(0, 4) === selectedYear))) : [],
    [viewingStaffId, adminRecords, selectedYear]
  );

  const staffStats = useMemo(() => calculateStats(staffYearlyRecords), [staffYearlyRecords]);

  // --- Available Years ---
  const availableYears = useMemo(() => 
    Array.from(new Set([
      new Date().getFullYear().toString(),
      ...userRecords.map(r => r.date ? r.date.substring(0, 4) : ''),
      ...adminRecords.map(r => r.date ? r.date.substring(0, 4) : '')
    ].filter(Boolean))).sort((a, b) => b.localeCompare(a)),
    [userRecords, adminRecords]
  );

  return {
    // Filtering
    filteredUserRecords,
    getFilteredRecordsForUser,

    // Stats
    userStats,
    getUserSummaryStats,

    // Pending Requests
    pendingProfileRequests,
    pendingReserveRequests,
    pendingChutiRequests,
    pendingSupervisorRequests,
    groupedSupervisorRequests,
    groupedChutiRequests,

    // Notifications
    userNotificationsList,
    unreadUserNotificationsCount,

    // Staff view
    staffProfile,
    individualRecords,
    staffStats,

    // Years
    availableYears,
  };
}
