import { useCallback } from 'react';
import { Profile } from '@/types';
import { ChutiRecord } from '@/utils/offlineSync';

interface UseModalHandlersParams {
  profile: Profile | null;
  adminActiveTab: string;

  // Revision modal setters (from useChutiOperations)
  setRevisionRecord: (r: ChutiRecord | null) => void;
  setRevisionDate: (d: string) => void;
  setRevisionLeaveType: (t: string) => void;
  setRevisionAdjustment: (a: boolean) => void;
  setRevisionAdjustShortLeave: (v: boolean) => void;
  setRevisionSignInTime: (t: string) => void;
  setRevisionSignOutTime: (t: string) => void;
  setRevisionLeaveHour: (h: string) => void;
  setRevisionReserveHoliday: (h: string) => void;
  setRevisionComment: (c: string) => void;
  setShowUserRevisionModal: (v: boolean) => void;

  // Admin edit modal setters (from useChutiOperations)
  setAdminEditRecord: (r: ChutiRecord | null) => void;
  setAdminEditDate: (d: string) => void;
  setAdminEditLeaveType: (t: string) => void;
  setAdminEditAdjustment: (a: boolean) => void;
  setAdminEditAdjustShortLeave: (v: boolean) => void;
  setAdminEditSignInTime: (t: string) => void;
  setAdminEditSignOutTime: (t: string) => void;
  setAdminEditLeaveHour: (h: string) => void;
  setAdminEditReserveHoliday: (h: string) => void;
  setAdminEditComment: (c: string) => void;
  setShowAdminEditModal: (v: boolean) => void;

  // Add leave modal setters
  setComment: (c: string) => void;
  setReserveHoliday: (h: string) => void;
  setAdjustShortLeave: (v: boolean) => void;
  setDate: (d: string) => void;
  setShowAddLeaveModal: (v: boolean) => void;

  // Profile settings setters (from useAdminStaffOperations)
  setEditingStaffProfileId: (id: string | null) => void;
  setEditUsername: (u: string) => void;
  setIsCodenameEditable: (v: boolean) => void;
  setShowProfileSettingsModal: (v: boolean) => void;
  setIsEditRequestMode: (v: boolean) => void;
  setEditFullName: (n: string) => void;
  setEditWorkingHours: (h: string) => void;
  setProfileSignInTime: (t: string) => void;
  setProfileSignOutTime: (t: string) => void;
  setEditBreakTime: (t: string) => void;
  setEditJobRole: (r: string) => void;
  setEditNeedsApproval: (v: boolean) => void;
  setEditAllowReserve: (v: boolean) => void;
  setEditAllowOvertime: (v: boolean) => void;

  // Credentials modal setters
  setCredTargetUserId: (id: string) => void;
  setCredNewUsername: (u: string) => void;
  setCredNewPassword: (p: string) => void;
  setShowCredentialsModal: (v: boolean) => void;

  // Delete user modal setters
  setDeleteTargetUser: (s: Profile | null) => void;
  setShowDeleteUserModal: (v: boolean) => void;

  // Notification modal
  setShowUserNotificationsModal: (v: boolean) => void;
  setShowLeaveApprovalModal: (v: boolean) => void;
  setShowSupervisorApprovalModal: (v: boolean) => void;
  setLastViewedTime: (t: string) => void;
  unreadUserNotificationsCount: number;

}

export function useModalHandlers({
  profile,
  adminActiveTab,
  setRevisionRecord,
  setRevisionDate,
  setRevisionLeaveType,
  setRevisionAdjustment,
  setRevisionAdjustShortLeave,
  setRevisionSignInTime,
  setRevisionSignOutTime,
  setRevisionLeaveHour,
  setRevisionReserveHoliday,
  setRevisionComment,
  setShowUserRevisionModal,
  setAdminEditRecord,
  setAdminEditDate,
  setAdminEditLeaveType,
  setAdminEditAdjustment,
  setAdminEditAdjustShortLeave,
  setAdminEditSignInTime,
  setAdminEditSignOutTime,
  setAdminEditLeaveHour,
  setAdminEditReserveHoliday,
  setAdminEditComment,
  setShowAdminEditModal,
  setComment,
  setReserveHoliday,
  setAdjustShortLeave,
  setDate,
  setShowAddLeaveModal,
  setEditingStaffProfileId,
  setEditUsername,
  setIsCodenameEditable,
  setShowProfileSettingsModal,
  setIsEditRequestMode,
  setEditFullName,
  setEditWorkingHours,
  setProfileSignInTime,
  setProfileSignOutTime,
  setEditBreakTime,
  setEditJobRole,
  setEditNeedsApproval,
  setEditAllowReserve,
  setEditAllowOvertime,
  setCredTargetUserId,
  setCredNewUsername,
  setCredNewPassword,
  setShowCredentialsModal,
  setDeleteTargetUser,
  setShowDeleteUserModal,
  setShowUserNotificationsModal,
  setShowLeaveApprovalModal,
  setShowSupervisorApprovalModal,
  setLastViewedTime,
  unreadUserNotificationsCount,
}: UseModalHandlersParams) {

  // Open "Add Leave" modal with default values
  const handleOpenAddLeaveModal = useCallback(() => {
    setComment('');
    setReserveHoliday('');
    setAdjustShortLeave(false);
    const today = new Date();
    const localDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    setDate(localDate);
    setShowAddLeaveModal(true);
  }, [setComment, setReserveHoliday, setAdjustShortLeave, setDate, setShowAddLeaveModal]);

  // Open "User Revision" modal with record data
  const handleOpenRevisionModal = useCallback((r: ChutiRecord) => {
    setRevisionRecord(r);
    setRevisionDate(r.date);
    setRevisionLeaveType(r.leave_type);
    setRevisionAdjustment(r.adjustment);
    setRevisionAdjustShortLeave(r.adjust_short_leave === true);
    setRevisionSignInTime(r.sign_in_time ? r.sign_in_time.substring(0, 5) : '13:00');
    setRevisionSignOutTime(r.sign_out_time ? r.sign_out_time.substring(0, 5) : '22:30');
    setRevisionLeaveHour(r.leave_hour ? r.leave_hour.toString().split('.')[0].substring(0, 5) : '00:00');
    setRevisionReserveHoliday(r.reserve_holiday || '');
    setRevisionComment('');
    setShowUserRevisionModal(true);
  }, [setRevisionRecord, setRevisionDate, setRevisionLeaveType, setRevisionAdjustment, setRevisionAdjustShortLeave, setRevisionSignInTime, setRevisionSignOutTime, setRevisionLeaveHour, setRevisionReserveHoliday, setRevisionComment, setShowUserRevisionModal]);

  // Open "Admin Edit" modal with record data
  const handleOpenAdminEditModal = useCallback((r: ChutiRecord) => {
    setAdminEditRecord(r);
    setAdminEditDate(r.date);
    setAdminEditLeaveType(r.leave_type);
    setAdminEditAdjustment(r.adjustment);
    setAdminEditAdjustShortLeave(r.adjust_short_leave === true);
    setAdminEditSignInTime(r.sign_in_time ? r.sign_in_time.substring(0, 5) : '13:00');
    setAdminEditSignOutTime(r.sign_out_time ? r.sign_out_time.substring(0, 5) : '22:30');
    setAdminEditLeaveHour(r.leave_hour ? r.leave_hour.toString().split('.')[0].substring(0, 5) : '00:00');
    setAdminEditReserveHoliday(r.reserve_holiday || '');
    setAdminEditComment(r.comment || '');
    setShowAdminEditModal(true);
  }, [setAdminEditRecord, setAdminEditDate, setAdminEditLeaveType, setAdminEditAdjustment, setAdminEditAdjustShortLeave, setAdminEditSignInTime, setAdminEditSignOutTime, setAdminEditLeaveHour, setAdminEditReserveHoliday, setAdminEditComment, setShowAdminEditModal]);

  // Open Profile Settings for self (from Navbar)
  const handleOpenProfileSettingsForSelf = useCallback(() => {
    setEditingStaffProfileId(null);
    setEditUsername(profile?.username || '');
    setIsCodenameEditable(false);
    setShowProfileSettingsModal(true);
    setIsEditRequestMode(false);
    setEditFullName(profile?.full_name || '');
    setEditWorkingHours(profile?.working_hours ? Number(profile.working_hours).toFixed(1) : '');
    setProfileSignInTime(profile?.default_sign_in || '');
    setProfileSignOutTime(profile?.default_sign_out || '');
    setEditBreakTime(profile?.break_time !== null && profile?.break_time !== undefined ? String(profile.break_time) : '');
    setEditJobRole(profile?.job_role || '');
    setEditNeedsApproval(profile?.needs_supervisor_approval !== false);
    setEditAllowReserve(profile?.allow_reserve === true);
    setEditAllowOvertime(profile?.allow_overtime === true);
  }, [profile, setEditingStaffProfileId, setEditUsername, setIsCodenameEditable, setShowProfileSettingsModal, setIsEditRequestMode, setEditFullName, setEditWorkingHours, setProfileSignInTime, setProfileSignOutTime, setEditBreakTime, setEditJobRole, setEditNeedsApproval, setEditAllowReserve, setEditAllowOvertime]);

  // Open Profile Settings for a specific staff member (admin)
  const handleOpenProfileSettingsForStaff = useCallback((staff: Profile) => {
    setEditingStaffProfileId(staff.id);
    setEditUsername(staff.username || '');
    setIsCodenameEditable(false);
    setEditFullName(staff.full_name || '');
    setEditWorkingHours(staff.working_hours ? Number(staff.working_hours).toFixed(1) : '');
    setProfileSignInTime(staff.default_sign_in || '');
    setProfileSignOutTime(staff.default_sign_out || '');
    setEditBreakTime(staff.break_time !== null && staff.break_time !== undefined ? String(staff.break_time) : '');
    setEditJobRole(staff.job_role || '');
    setEditNeedsApproval(staff.needs_supervisor_approval !== false);
    setEditAllowReserve(staff.allow_reserve === true);
    setEditAllowOvertime(staff.allow_overtime === true);
    setShowProfileSettingsModal(true);
  }, [setEditingStaffProfileId, setEditUsername, setIsCodenameEditable, setEditFullName, setEditWorkingHours, setProfileSignInTime, setProfileSignOutTime, setEditBreakTime, setEditJobRole, setEditNeedsApproval, setEditAllowReserve, setEditAllowOvertime, setShowProfileSettingsModal]);

  // Open Credentials modal
  const handleOpenCredentialsModal = useCallback((userId: string, username: string) => {
    setCredTargetUserId(userId);
    setCredNewUsername(username);
    setCredNewPassword('');
    setShowCredentialsModal(true);
  }, [setCredTargetUserId, setCredNewUsername, setCredNewPassword, setShowCredentialsModal]);

  // Open Delete User modal
  const handleOpenDeleteUserModal = useCallback((staff: Profile) => {
    setDeleteTargetUser(staff);
    setShowDeleteUserModal(true);
  }, [setDeleteTargetUser, setShowDeleteUserModal]);

  // Open Notifications (with time tracking)
  const handleOpenNotifications = useCallback(() => {
    setShowUserNotificationsModal(true);
    const now = new Date().toISOString();
    localStorage.setItem('last_viewed_notifications_time', now);
    setLastViewedTime(now);
  }, [setShowUserNotificationsModal, setLastViewedTime]);

  // Notification bell click (role-aware routing)
  const handleNotificationClick = useCallback(() => {
    if (!profile) return;
    const isAdmin = profile.role === 'admin';
    if (isAdmin) {
      if (adminActiveTab === 'admin') {
        setShowLeaveApprovalModal(true);
      } else {
        handleOpenNotifications();
      }
    } else if (profile.role === 'supervisor') {
      if (unreadUserNotificationsCount > 0) {
        handleOpenNotifications();
      } else {
        setShowSupervisorApprovalModal(true);
      }
    } else {
      handleOpenNotifications();
    }
  }, [profile, adminActiveTab, unreadUserNotificationsCount, setShowLeaveApprovalModal, setShowSupervisorApprovalModal, handleOpenNotifications]);

  // Reset filters
  const handleResetFilters = useCallback((
    setFilterType: (v: string) => void,
    setFilterStartDate: (v: string) => void,
    setFilterEndDate: (v: string) => void
  ) => {
    setFilterType('all');
    setFilterStartDate('');
    setFilterEndDate('');
  }, []);

  return {
    handleOpenAddLeaveModal,
    handleOpenRevisionModal,
    handleOpenAdminEditModal,
    handleOpenProfileSettingsForSelf,
    handleOpenProfileSettingsForStaff,
    handleOpenCredentialsModal,
    handleOpenDeleteUserModal,
    handleOpenNotifications,
    handleNotificationClick,
    handleResetFilters,
  };
}
