import { useMemo, useCallback } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Profile, ChutiRecordWithProfile, BulkRepresentative } from '@/types';
import { ChutiRecord } from '@/utils/offlineSync';
import { formatDate, calculateStats } from '@/utils/dashboardHelpers';

// Notification item type (shared across the app)
export interface NotificationItem {
  id: string;
  chutiId?: string;
  record?: ChutiRecord;
  type: 'revision' | 'approved' | 'rejected' | 'adjusted' | 'cancelled' | 'supervisor_approved' | 'edited';
  timestamp: string;
  title: string;
  body: string;
  text?: string;
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
  const userStats = useMemo(() => calculateStats(filteredUserRecords), [filteredUserRecords]);

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
      reserve: stats.reserveLeaves,
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
      (r.leave_type === 'Reserve' && (r.status === 'approved_by_supervisor' || r.reserve_adjustment_status === 'pending')) ||
      (r.leave_type === 'Overtime' && r.status === 'approved_by_supervisor') ||
      (r.reserve_adjustment_status === 'pending')
    ), 
    [adminRecords]
  );

  const pendingChutiRequests = useMemo(() => 
    adminRecords.filter(r => r.status === 'approved_by_supervisor' && r.leave_type !== 'Reserve' && r.leave_type !== 'Overtime'), 
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
  }, [sessionUser, profile, userRecords]);

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

  const staffStats = useMemo(() => calculateStats(individualRecords), [individualRecords]);

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
