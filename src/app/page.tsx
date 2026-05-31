'use client';

import { useState, useEffect, useCallback } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { UserStats } from '@/components/UserStats';
import { UserRecordsTable } from '@/components/UserRecordsTable';
import { StaffMasterTable } from '@/components/StaffMasterTable';
import { AdminRecordsTable } from '@/components/AdminRecordsTable';
import { DateInput } from '@/components/DateInput';
import { exportHelper } from '@/utils/exportHelper';
import { 
  subscribeUserToPush, 
  unsubscribeUserFromPush, 
  checkSubscriptionStatus, 
  sendPushNotification 
} from '@/utils/webPushHelper';
import { 
  saveOfflineRecord, 
  getOfflineRecords, 
  syncOfflineData, 
  deleteOfflineRecord,
  saveOfflineUpdate,
  ChutiRecord
} from '@/utils/offlineSync';
import { 
  LogOut, 
  User, 
  Clock, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Wifi, 
  WifiOff, 
  Plus, 
  Trash2, 
  RefreshCw,
  SlidersHorizontal,
  Loader2,
  Coffee,
  Edit,
  Edit2,
  ArrowLeft,
  Bell,
  Lock,
  Sun,
  Moon
} from 'lucide-react';

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

// Helper function to format date from YYYY-MM-DD to DD-MM-YYYY
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateString;
};

const getPasswordMatchIndicator = (password: string, confirm: string) => {
  if (!confirm) return null;
  if (password !== confirm) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-500 mt-1 font-medium">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        <span>পাসওয়ার্ড মেলেনি!</span>
      </div>
    );
  }
  if (password.length < 4) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-500 mt-1 font-medium">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        <span>পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে!</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-xs text-emerald-500 mt-1 font-medium">
      <CheckCircle className="h-3.5 w-3.5 shrink-0" />
      <span>পাসওয়ার্ড মিলেছে</span>
    </div>
  );
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

// Helper functions for time parsing and formatting
const parseTimeToMinutes = (timeStr: string) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const formatDuration = (totalMinutes: number) => {
  const isNegative = totalMinutes < 0;
  const absMinutes = Math.abs(totalMinutes);
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;
  
  const hoursStr = String(hours).padStart(2, '0');
  const minsStr = String(mins).padStart(2, '0');
  
  return `${isNegative ? '-' : ''}${hoursStr}:${minsStr}`;
};

const parseIntervalToMinutes = (intervalStr: string | null | undefined) => {
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

const calculateStats = (records: ChutiRecord[]) => {
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
    fullLeaves: Math.max(0, totalFullLeaves),
    reserveLeaves: totalReserveLeaves,
    totalHours: formatDuration(totalShortMinutes)
  };
};


const calculateLeaveOrOvertime = (
  type: string,
  actualStart: string,
  actualEnd: string,
  shiftStart: string,
  shiftEnd: string
) => {
  if (type === 'Reserve' || type === 'Full Leave') {
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
    const worked = actualEndMins - actualStartMins;
    const regular = shiftEndMins - shiftStartMins;
    return formatDuration(Math.max(0, worked - regular));
  }
  return '00:00';
};

export interface Profile {
  id: string;
  username: string;
  role: 'admin' | 'supervisor' | 'user';
  username_changes?: number;
  username_request_status?: 'none' | 'pending' | 'approved';
  full_name?: string | null;
  working_hours?: number;
  break_time?: number;
  is_setup_completed?: boolean;
  job_role?: string | null;
  requested_full_name?: string | null;
  requested_working_hours?: number | null;
  requested_break_time?: number | null;
  requested_job_role?: string | null;
  profile_change_status?: 'none' | 'pending' | 'approved' | 'rejected';
  default_sign_in?: string | null;
  default_sign_out?: string | null;
  requested_default_sign_in?: string | null;
  requested_default_sign_out?: string | null;
  needs_supervisor_approval?: boolean;
  allow_reserve?: boolean;
  allow_overtime?: boolean;
  has_edited_profile?: boolean;
  has_changed_password?: boolean;
}

export interface ChutiRecordWithProfile extends ChutiRecord {
  id: string;
  profiles?: {
    username: string;
  } | null;
}

export interface BulkRepresentative extends ChutiRecordWithProfile {
  is_bulk?: boolean;
  all_bulk_dates?: string[];
  all_bulk_ids?: string[];
  all_bulk_records?: ChutiRecordWithProfile[];
  formatted_bulk_dates?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineCount, setOfflineCount] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New State variables for Supervisor, Admin Dashboard, Detail views, and Approval modals
  const [viewingStaffId, setViewingStaffId] = useState<string | null>(null);
  const [editingStaffProfileId, setEditingStaffProfileId] = useState<string | null>(null);
  const [editNeedsApproval, setEditNeedsApproval] = useState(true);
  const [editAllowReserve, setEditAllowReserve] = useState(false);
  const [editAllowOvertime, setEditAllowOvertime] = useState(false);
  const [showLeaveApprovalModal, setShowLeaveApprovalModal] = useState(false);
  const [showSupervisorApprovalModal, setShowSupervisorApprovalModal] = useState(false);
  const [showUserNotificationsModal, setShowUserNotificationsModal] = useState(false);
  const [lastViewedTime, setLastViewedTime] = useState<string>('');

  // Admin editing states
  const [showAdminEditModal, setShowAdminEditModal] = useState(false);
  const [adminEditRecord, setAdminEditRecord] = useState<ChutiRecord | null>(null);
  const [adminEditDate, setAdminEditDate] = useState('');
  const [adminEditLeaveType, setAdminEditLeaveType] = useState('Short Leave');
  const [adminEditAdjustment, setAdminEditAdjustment] = useState(false);
  const [adminEditSignInTime, setAdminEditSignInTime] = useState('13:00');
  const [adminEditSignOutTime, setAdminEditSignOutTime] = useState('22:30');
  const [adminEditLeaveHour, setAdminEditLeaveHour] = useState('00:00');
  const [adminEditReserveHoliday, setAdminEditReserveHoliday] = useState('');
  const [adminEditComment, setAdminEditComment] = useState('');
  const [adminEditAdjustShortLeave, setAdminEditAdjustShortLeave] = useState(false);

  // User revision states
  const [showUserRevisionModal, setShowUserRevisionModal] = useState(false);
  const [revisionRecord, setRevisionRecord] = useState<ChutiRecord | null>(null);
  const [revisionDate, setRevisionDate] = useState('');
  const [revisionLeaveType, setRevisionLeaveType] = useState('Short Leave');
  const [revisionAdjustment, setRevisionAdjustment] = useState(false);
  const [revisionSignInTime, setRevisionSignInTime] = useState('13:00');
  const [revisionSignOutTime, setRevisionSignOutTime] = useState('22:30');
  const [revisionLeaveHour, setRevisionLeaveHour] = useState('00:00');
  const [revisionReserveHoliday, setRevisionReserveHoliday] = useState('');
  const [revisionComment, setRevisionComment] = useState('');
  const [revisionAdjustShortLeave, setRevisionAdjustShortLeave] = useState(false);

  // Custom Revision Prompt States
  const [showRevisionPromptModal, setShowRevisionPromptModal] = useState(false);
  const [revisionPromptText, setRevisionPromptText] = useState('');
  const [revisionPromptChutiId, setRevisionPromptChutiId] = useState<string | null>(null);
  const [revisionPromptIsSupervisor, setRevisionPromptIsSupervisor] = useState(false);

  // Onboarding form states
  const [setupFullName, setSetupFullName] = useState('');
  const [setupUsername, setSetupUsername] = useState('');
  const [setupWorkingHours, setSetupWorkingHours] = useState('');
  const [setupBreakTime, setSetupBreakTime] = useState('');
  const [setupJobRole, setSetupJobRole] = useState('');
  const [setupSubmitting, setSetupSubmitting] = useState(false);
  const [setupError, setSetupError] = useState('');

  // Modal Settings states
  const [showProfileSettingsModal, setShowProfileSettingsModal] = useState(false);
  const [showAddLeaveModal, setShowAddLeaveModal] = useState(false);
  const [setupSignInTime, setSetupSignInTime] = useState('');
  const [setupSignOutTime, setSetupSignOutTime] = useState('');
  const [profileSignInTime, setProfileSignInTime] = useState('13:00');
  const [profileSignOutTime, setProfileSignOutTime] = useState('22:30');

  // Custom Confirmation Modals States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<ChutiRecord | null>(null);

  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentRecord, setAdjustmentRecord] = useState<ChutiRecord | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'full' | 'partial'>('full');
  const [partialAdjustmentTime, setPartialAdjustmentTime] = useState('02:00');
  const [adjustShortLeaveOption, setAdjustShortLeaveOption] = useState(false);
  
  const [showCancelAdjustmentModal, setShowCancelAdjustmentModal] = useState(false);
  const [cancelAdjustmentRecord, setCancelAdjustmentRecord] = useState<ChutiRecord | null>(null);
  const [isEditRequestMode, setIsEditRequestMode] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editWorkingHours, setEditWorkingHours] = useState('9.5');
  const [editBreakTime, setEditBreakTime] = useState('0');
  const [editJobRole, setEditJobRole] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [isCodenameEditable, setIsCodenameEditable] = useState(false);

  // Admin Tabs & User Management
  const [adminActiveTab, setAdminActiveTab] = useState<'user' | 'admin'>('admin');
  const [searchQuery, setSearchQuery] = useState('');
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
  const [reviewingIds, setReviewingIds] = useState<Set<string>>(new Set());
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  
  // Create User Modal states
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('user');
  const [newStaffFullName, setNewStaffFullName] = useState('');
  const [newStaffNeedsApproval, setNewStaffNeedsApproval] = useState(false);
  const [newStaffAllowReserve, setNewStaffAllowReserve] = useState(false);
  const [newStaffAllowOvertime, setNewStaffAllowOvertime] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newStaffConfirmPassword, setNewStaffConfirmPassword] = useState('');
  
  // Credentials Edit Modal states
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credTargetUserId, setCredTargetUserId] = useState<string | null>(null);
  const [credNewUsername, setCredNewUsername] = useState('');
  const [credNewPassword, setCredNewPassword] = useState('');
  const [credConfirmPassword, setCredConfirmPassword] = useState('');
  const [updatingCredentials, setUpdatingCredentials] = useState(false);

  // First-Time Password Change & Setup states
  const [showFirstTimePasswordModal, setShowFirstTimePasswordModal] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [firstTimePassword, setFirstTimePassword] = useState('');
  const [firstTimeConfirmPassword, setFirstTimeConfirmPassword] = useState('');
  const [firstTimePasswordSubmitting, setFirstTimePasswordSubmitting] = useState(false);
  const [firstTimePasswordError, setFirstTimePasswordError] = useState('');
  const [firstTimeSetupFullName, setFirstTimeSetupFullName] = useState('');
  const [firstTimeSetupJobRole, setFirstTimeSetupJobRole] = useState('');
  const [firstTimeSetupWorkingHours, setFirstTimeSetupWorkingHours] = useState('9.5');
  const [firstTimeSetupBreakTime, setFirstTimeSetupBreakTime] = useState('0');
  const [firstTimeSetupSignInTime, setFirstTimeSetupSignInTime] = useState('09:30');
  const [firstTimeSetupSignOutTime, setFirstTimeSetupSignOutTime] = useState('19:00');
  
  // Delete User Modal states
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState<Profile | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState(false);
  const [submittingRevision, setSubmittingRevision] = useState(false);

  // Theme Toggle state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Load theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme as 'dark' | 'light');
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Theme toggle handler
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  // User form states
  const [date, setDate] = useState('');
  const [leaveType, setLeaveType] = useState('Short Leave');
  const [adjustment, setAdjustment] = useState(false);
  const [adjustShortLeave, setAdjustShortLeave] = useState(false);
  const [signInTime, setSignInTime] = useState('13:00');
  const [signOutTime, setSignOutTime] = useState('22:30');
  const [leaveHour, setLeaveHour] = useState('00:00');
  const [reserveHoliday, setReserveHoliday] = useState('');
  const [comment, setComment] = useState('');
  const [bulkDates, setBulkDates] = useState<string[]>([]);

  useEffect(() => {
    if (leaveType !== 'Full Leave') {
      setBulkDates([]);
    }
  }, [leaveType]);

  useEffect(() => {
    if (!showAddLeaveModal) {
      setBulkDates([]);
    }
  }, [showAddLeaveModal]);

  const handleAddBulkDate = () => {
    if (bulkDates.length + 1 >= 10) {
      alert('সর্বোচ্চ ১০ দিন পর্যন্ত ছুটি একসাথে আবেদন করতে পারবেন!');
      return;
    }
    setBulkDates(prev => [...prev, '']);
  };

  const handleUpdateBulkDate = (index: number, val: string) => {
    if (val === date || bulkDates.some((d, idx) => idx !== index && d === val)) {
      alert('এই তারিখটি ইতিমধ্যে নির্বাচন করা হয়েছে!');
      return;
    }
    setBulkDates(prev => prev.map((d, idx) => idx === index ? val : d));
  };

  const handleRemoveBulkDate = (index: number) => {
    setBulkDates(prev => prev.filter((_, idx) => idx !== index));
  };

  // 10-minute auto-logout timer for first-time password change setup
  useEffect(() => {
    if (!showFirstTimePasswordModal || !sessionUser) return;

    const key = `first_time_modal_start_time_${sessionUser.id}`;
    let startTimeStr = localStorage.getItem(key);
    if (!startTimeStr) {
      startTimeStr = Date.now().toString();
      localStorage.setItem(key, startTimeStr);
    }
    const startTime = parseInt(startTimeStr, 10);
    const TEN_MINUTES_MS = 10 * 60 * 1000;

    let timer: NodeJS.Timeout;
    let interval: NodeJS.Timeout;

    const checkAndLogout = async () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= TEN_MINUTES_MS) {
        console.log('10 minutes expired without password change. Logging out user...');
        try {
          localStorage.removeItem(`session_start_time_${sessionUser.id}`);
          localStorage.removeItem(`last_access_time_${sessionUser.id}`);
          localStorage.removeItem(key);
          await supabase.auth.signOut();
          router.push('/login');
        } catch (e) {
          console.error('Error during auto-logout:', e);
        }
        return true;
      }
      return false;
    };

    checkAndLogout().then((loggedOut) => {
      if (loggedOut) return;

      const remainingDelay = Math.max(0, TEN_MINUTES_MS - (Date.now() - startTime));
      timer = setTimeout(async () => {
        await checkAndLogout();
      }, remainingDelay);

      interval = setInterval(async () => {
        await checkAndLogout();
      }, 5000);
    });

    return () => {
      if (timer) clearTimeout(timer);
      if (interval) clearInterval(interval);
    };
  }, [showFirstTimePasswordModal, sessionUser, router]);

  // Lists states
  const [userRecords, setUserRecords] = useState<ChutiRecord[]>([]);
  const [adminRecords, setAdminRecords] = useState<ChutiRecordWithProfile[]>([]);
  const [profilesList, setProfilesList] = useState<Profile[]>([]);

  // Admin filter states
  const [filterType, setFilterType] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const [selectedYear, setSelectedYear] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('selectedYear') || new Date().getFullYear().toString();
    }
    return new Date().getFullYear().toString();
  });

  const availableYears = Array.from(new Set([
    new Date().getFullYear().toString(),
    ...userRecords.map(r => r.date ? r.date.substring(0, 4) : ''),
    ...adminRecords.map(r => r.date ? r.date.substring(0, 4) : '')
  ].filter(Boolean))).sort((a, b) => b.localeCompare(a));

  // Auto-dismiss messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Sync push notification subscription status
  useEffect(() => {
    if (sessionUser?.id) {
      checkSubscriptionStatus(sessionUser.id).then(status => {
        setIsPushSubscribed(status.isSubscribed);
      });
    }
  }, [sessionUser, showProfileSettingsModal]);



  // 1. Check Authentication and Fetch Profile
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const userId = session.user.id;
      const now = Date.now();
      const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

      const sessionStart = localStorage.getItem(`session_start_time_${userId}`);
      const lastAccess = localStorage.getItem(`last_access_time_${userId}`);

      if (sessionStart || lastAccess) {
        const startAge = sessionStart ? now - parseInt(sessionStart, 10) : 0;
        const accessAge = lastAccess ? now - parseInt(lastAccess, 10) : 0;

        if (startAge > oneWeekMs || accessAge > oneWeekMs) {
          localStorage.removeItem(`session_start_time_${userId}`);
          localStorage.removeItem(`last_access_time_${userId}`);
          await supabase.auth.signOut();
          router.push('/login');
          return;
        }
      }

      if (!sessionStart) {
        localStorage.setItem(`session_start_time_${userId}`, now.toString());
      }
      localStorage.setItem(`last_access_time_${userId}`, now.toString());

      setSessionUser(session.user);

      const savedMode = localStorage.getItem('admin_mode_' + userId);
      if (savedMode === 'user' || savedMode === 'admin') {
        setAdminActiveTab(savedMode as 'user' | 'admin');
      }

      // Fetch user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, role, full_name, working_hours, break_time, is_setup_completed, has_changed_password, username_changes, username_request_status, job_role, requested_full_name, requested_working_hours, requested_break_time, requested_job_role, profile_change_status, default_sign_in, default_sign_out, requested_default_sign_in, requested_default_sign_out, needs_supervisor_approval, allow_reserve, allow_overtime, has_edited_profile')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError || !userProfile) {
        console.error('User profile not found. Logging out.', profileError);
        localStorage.removeItem(`session_start_time_${userId}`);
        localStorage.removeItem(`last_access_time_${userId}`);
        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.error(e);
        }
        router.push('/login');
        return;
      }

      const currentProfile = userProfile as Profile | null;
      setProfile(userProfile);
      setSetupUsername((userProfile.username || '').toUpperCase());
      setSetupFullName(userProfile.full_name || '');
      setSetupWorkingHours(Number(userProfile.working_hours || 9.5).toFixed(1));
      setSetupBreakTime(String(userProfile.break_time || 0));
      setSetupJobRole(userProfile.job_role || '');
      setSetupSignInTime(userProfile.default_sign_in || '13:00');
      setSetupSignOutTime(userProfile.default_sign_out || '22:30');
      
      setEditFullName(userProfile.requested_full_name || userProfile.full_name || '');
      setEditWorkingHours(Number(userProfile.requested_working_hours || userProfile.working_hours || 9.5).toFixed(1));
      setEditBreakTime(String(userProfile.requested_break_time || userProfile.break_time || 0));
      setEditJobRole(userProfile.requested_job_role || userProfile.job_role || '');
      setProfileSignInTime(userProfile.requested_default_sign_in || userProfile.default_sign_in || '13:00');
      setProfileSignOutTime(userProfile.requested_default_sign_out || userProfile.default_sign_out || '22:30');
      
      if (currentProfile && currentProfile.has_changed_password === false) {
        setShowFirstTimePasswordModal(true);
        setFirstTimeSetupFullName(currentProfile.full_name || '');
        setFirstTimeSetupJobRole(currentProfile.job_role || '');
        setFirstTimeSetupWorkingHours(String(currentProfile.working_hours || '9.5'));
        setFirstTimeSetupBreakTime(String(currentProfile.break_time || '0'));
        setFirstTimeSetupSignInTime(currentProfile.default_sign_in || '09:30');
        setFirstTimeSetupSignOutTime(currentProfile.default_sign_out || '19:00');
      }
      
      setLoading(false);
    };

    fetchSession();
  }, [router]);

  // Sync Check Loop
  const checkOfflineQueue = useCallback(async () => {
    const records = await getOfflineRecords();
    setOfflineCount(records.length);
  }, []);

  useEffect(() => {
    checkOfflineQueue();
  }, [checkOfflineQueue]);

  // 2. Fetch Chuti Records based on Role
  const fetchRecords = useCallback(async () => {
    if (!sessionUser || !profile) return;

    if (profile.role === 'admin' || profile.role === 'supervisor') {
      // Fetch all user records for Admin/Supervisor
      const { data: records, error } = await supabase
        .from('chuti')
        .select(`
          *,
          profiles (username)
        `)
        .order('date', { ascending: false });

      if (!error && records) {
        setAdminRecords(records);
      }

      // Fetch profile list for filtering
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, role, full_name, working_hours, break_time, username_changes, username_request_status, job_role, requested_full_name, requested_working_hours, requested_break_time, requested_job_role, profile_change_status, default_sign_in, default_sign_out, requested_default_sign_in, requested_default_sign_out, needs_supervisor_approval, allow_reserve, allow_overtime, has_edited_profile')
        .order('username', { ascending: true });

      if (profiles) {
        setProfilesList(profiles);
      }
    }
    
    if (profile.role === 'user' || profile.role === 'supervisor' || profile.role === 'admin') {
      // Fetch only logged-in user records
      const { data: records, error } = await supabase
        .from('chuti')
        .select('*')
        .eq('user_id', sessionUser.id)
        .order('date', { ascending: false });

      if (!error && records) {
        setUserRecords(records);
      }
    }
  }, [sessionUser, profile]);

  useEffect(() => {
    if (!loading && sessionUser && profile) {
      fetchRecords();
    }
  }, [loading, sessionUser, profile, fetchRecords]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('last_viewed_notifications_time');
      if (stored) {
        setLastViewedTime(stored);
      }
    }
  }, []);

  // Auto Sync Handler
  const triggerAutoSync = useCallback(async () => {
    if (!navigator.onLine) return;
    const res = await syncOfflineData();
    if (res.syncedCount > 0) {
      setMessage({ type: 'success', text: `${res.syncedCount}টি অফলাইন ডাটা সফলভাবে ক্লাউডে সেভ করা হয়েছে!` });
      checkOfflineQueue();
      fetchRecords();
      setTimeout(() => setMessage(null), 5000);
    }
  }, [checkOfflineQueue, fetchRecords]);

  // Auto Sync on Mount / Login
  useEffect(() => {
    if (isOnline && sessionUser) {
      triggerAutoSync();
    }
  }, [isOnline, sessionUser, triggerAutoSync]);

  // Network Status Monitor
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => {
        setIsOnline(true);
        setMessage({ type: 'success', text: 'আপনি পুনরায় অনলাইনের সাথে যুক্ত হয়েছেন।' });
        triggerAutoSync();
      };
      const handleOffline = () => {
        setIsOnline(false);
        setMessage({ type: 'error', text: 'আপনার ইন্টারনেট সংযোগ বিচ্ছিন্ন হয়েছে। আপনি অফলাইন মোডে আছেন।' });
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [triggerAutoSync]);

  // Listen for real-time updates from Supabase to refresh dashboard without manual reload
  useEffect(() => {
    if (!sessionUser) return;

    const chutiChannel = supabase
      .channel('realtime-chuti-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chuti' },
        (payload) => {
          console.log('Realtime chuti change received:', payload);
          fetchRecords();
        }
      )
      .subscribe();

    const profilesChannel = supabase
      .channel('realtime-profile-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('Realtime profile change received:', payload);
          if (payload.eventType === 'DELETE' && payload.old && payload.old.id === sessionUser.id) {
            console.log('Your profile has been deleted by admin. Logging out...');
            const handleLogout = async () => {
              try {
                await supabase.auth.signOut();
              } catch (e) {
                console.error(e);
              }
              localStorage.removeItem(`session_start_time_${sessionUser.id}`);
              localStorage.removeItem(`last_access_time_${sessionUser.id}`);
              router.push('/login');
            };
            handleLogout();
            return;
          }
          if (payload.eventType === 'UPDATE' && payload.new && payload.new.id === sessionUser.id) {
            setProfile(payload.new as Profile);
          }
          fetchRecords();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chutiChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [sessionUser, fetchRecords, router]);

  // Set default form date to today (respecting local timezone)
  useEffect(() => {
    const offset = new Date().getTimezoneOffset();
    const localDate = new Date(new Date().getTime() - (offset * 60 * 1000));
    const today = localDate.toISOString().split('T')[0];
    setDate(today);
  }, []);

  // Update default form sign-in/out times from profile
  useEffect(() => {
    if (profile) {
      setSignInTime(profile.default_sign_in || '13:00');
      setSignOutTime(profile.default_sign_out || '22:30');
    }
  }, [profile]);

  // Main Form Leave Hour Calculation
  useEffect(() => {
    const shiftStart = profile?.default_sign_in || '13:00';
    const shiftEnd = profile?.default_sign_out || '22:30';
    const calc = calculateLeaveOrOvertime(leaveType, signInTime, signOutTime, shiftStart, shiftEnd);
    setLeaveHour(calc);
  }, [signInTime, signOutTime, leaveType, profile]);

  // Admin Edit Hour Auto-Calculation
  useEffect(() => {
    if (!adminEditRecord) return;
    const targetProfile = profilesList.find(p => p.id === adminEditRecord.user_id) || profile;
    const shiftStart = targetProfile?.default_sign_in || '13:00';
    const shiftEnd = targetProfile?.default_sign_out || '22:30';
    const calc = calculateLeaveOrOvertime(adminEditLeaveType, adminEditSignInTime, adminEditSignOutTime, shiftStart, shiftEnd);
    setAdminEditLeaveHour(calc);
  }, [adminEditSignInTime, adminEditSignOutTime, adminEditLeaveType, adminEditRecord, profilesList, profile]);

  // User Revision Hour Auto-Calculation
  useEffect(() => {
    const shiftStart = profile?.default_sign_in || '13:00';
    const shiftEnd = profile?.default_sign_out || '22:30';
    const calc = calculateLeaveOrOvertime(revisionLeaveType, revisionSignInTime, revisionSignOutTime, shiftStart, shiftEnd);
    setRevisionLeaveHour(calc);
  }, [revisionSignInTime, revisionSignOutTime, revisionLeaveType, profile]);



  // 4. Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionUser) return;

    setSubmitting(true);
    setMessage(null);

    const isReserve = leaveType === 'Reserve';
    const isFullLeave = leaveType === 'Full Leave';

    // Gather all selected dates
    const allDates = isFullLeave 
      ? [date, ...bulkDates].filter(d => d)
      : [date];

    if (allDates.length === 0) {
      setMessage({ type: 'error', text: 'অন্তত একটি তারিখ নির্বাচন করুন!' });
      setSubmitting(false);
      return;
    }

    const bulkId = allDates.length > 1 ? (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    })) : null;

    const bypassSupervisor = 
      profile?.needs_supervisor_approval === false ||
      profile?.role === 'admin' ||
      profile?.role === 'supervisor' ||
      profile?.job_role === 'IT Manager' ||
      profile?.job_role === 'IT Officer';

    // Helper to build record format
    const getRecordForDate = (targetDate: string) => ({
      user_id: sessionUser.id,
      date: targetDate,
      leave_type: leaveType,
      adjustment: isReserve ? false : adjustment, // Reserve adjustment starts as false until approved
      adjust_short_leave: (leaveType === 'Overtime' || leaveType === 'Reserve') && adjustment ? adjustShortLeave : false,
      sign_in_time: (isReserve || isFullLeave) ? null : signInTime,
      sign_out_time: (isReserve || isFullLeave) ? null : signOutTime,
      leave_hour: (isReserve || isFullLeave) ? null : `${leaveHour}:00`, // Supabase interval format
      reserve_holiday: isReserve ? reserveHoliday : null,
      reserve_adjustment_status: isReserve ? (adjustment ? 'pending' : 'none') : 'none',
      status: bypassSupervisor ? 'approved_by_supervisor' : 'pending_supervisor',
      comment: comment || null,
      bulk_id: bulkId,
    });

    // Duplicate Check in Offline Queue first
    const offlineItems = await getOfflineRecords();
    const offlineDuplicates = allDates.filter(d => 
      offlineItems.some(item => item.user_id === sessionUser.id && item.date === d)
    );

    if (offlineDuplicates.length > 0) {
      const dupStrings = offlineDuplicates.map(d => formatDate(d)).join(', ');
      setMessage({ type: 'error', text: `এই তারিখগুলোতে অলরেডি এন্ট্রি অফলাইনে জমা রয়েছে: ${dupStrings}` });
      setSubmitting(false);
      return;
    }

    if (!isOnline) {
      // Save locally to IndexedDB if offline
      try {
        const addedTempRecords: ChutiRecord[] = [];
        for (const targetDate of allDates) {
          const rec = getRecordForDate(targetDate);
          await saveOfflineRecord(rec);
          addedTempRecords.push({
            ...rec,
            id: `temp-${Date.now()}-${targetDate}`,
            localId: `local-${Date.now()}-${targetDate}`,
            synced: false
          });
        }
        setMessage({ 
          type: 'success', 
          text: 'ইন্টারনেট কানেকশন নেই। ডাটাগুলো অফলাইনে সংরক্ষিত হয়েছে। ইন্টারনেট ফিরে আসলে অটো সিঙ্ক হবে।' 
        });
        checkOfflineQueue();
        
        // Add to local state list to show immediate feedback
        setUserRecords(prev => [...addedTempRecords, ...prev]);

        // Reset form
        setComment('');
        setReserveHoliday('');
        setAdjustShortLeave(false);
        setBulkDates([]);
        setShowAddLeaveModal(false);
      } catch {
        setMessage({ type: 'error', text: 'অফলাইনে ডাটা সেভ করার সময় সমস্যা হয়েছে।' });
      }
      setSubmitting(false);
      return;
    }

    // Submit to Supabase directly if online
    try {
      // Check if duplicate entry exists on cloud
      const { data: existing, error: checkError } = await supabase
        .from('chuti')
        .select('date')
        .eq('user_id', sessionUser.id)
        .in('date', allDates);

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        const dupStrings = existing.map((e) => formatDate(e.date)).join(', ');
        setMessage({ type: 'error', text: `এই তারিখগুলোতে অলরেডি ডাটা সাবমিট করা হয়েছে: ${dupStrings}` });
        setSubmitting(false);
        return;
      }

      // Build records to insert
      const recordsToInsert = allDates.map(d => getRecordForDate(d));

      const { error: insertError } = await supabase.from('chuti').insert(recordsToInsert);
      if (insertError) throw insertError;

      // Trigger Web Push Notification to Supervisors and/or Admins (Single push notification with comma-separated dates)
      const targetRoles = bypassSupervisor ? ['admins'] : ['supervisors', 'admins'];
      const formattedDates = allDates.map(d => formatDate(d)).join(', ');

      sendPushNotification({
        userIds: targetRoles,
        title: 'নতুন ছুটির আবেদন 🔔',
        body: `${profile?.full_name || profile?.username || 'স্টাফ'} ${leaveType}-এর আবেদন করেছেন (তারিখ: ${formattedDates})`,
        url: '/'
      }).catch(err => console.error('Error triggering push notification:', err));

      setMessage({ type: 'success', text: 'আপনার ছুটির তথ্য সফলভাবে সাবমিট করা হয়েছে!' });
      fetchRecords();

      // Reset form
      setComment('');
      setReserveHoliday('');
      setAdjustShortLeave(false);
      setBulkDates([]);
      setShowAddLeaveModal(false);
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message || 'ডাটা সাবমিট করার সময় ত্রুটি ঘটেছে।' });
    } finally {
      setSubmitting(false);
    }
  };

  const triggerDeleteRecord = (record: ChutiRecord) => {
    setRecordToDelete(record);
    setShowDeleteModal(true);
  };

  // Delete Record Handler (Supports offline delete or cloud delete)
  const handleConfirmDelete = async () => {
    if (!recordToDelete || !sessionUser) return;
    const record = recordToDelete;
    setDeletingRecord(true);
    
    try {
      if (record.id && typeof record.id === 'string' && record.id.startsWith('temp-')) {
        // Delete offline pending record
        const records = await getOfflineRecords();
        const target = records.find(r => r.date === record.date && r.user_id === sessionUser.id);
        if (target && target.localId) {
          await deleteOfflineRecord(target.localId);
        }
        setUserRecords(prev => prev.filter(r => r.id !== record.id));
        checkOfflineQueue();
        setMessage({ type: 'success', text: 'অফলাইন রেকর্ডটি সফলভাবে ডিলিট করা হয়েছে।' });
        return;
      }

      // Online delete from Supabase
      const { data, error } = await supabase.from('chuti').delete().eq('id', record.id || '').select();
      if (error) throw error;
      
      // If data is empty, it means RLS blocked the delete or the row wasn't found
      if (!data || data.length === 0) {
        throw new Error('রেকর্ডটি ডিলিট করার অনুমতি নেই অথবা রেকর্ডটি ডেটাবেজে খুঁজে পাওয়া যায়নি।');
      }
      
      // Update local state directly so UI updates immediately
      setUserRecords(prev => prev.filter(r => r.id !== record.id));
      setAdminRecords(prev => prev.filter(r => r.id !== record.id));
      
      setMessage({ type: 'success', text: 'রেকর্ডটি সফলভাবে ডিলিট করা হয়েছে।' });
      fetchRecords();
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message || 'রেকর্ডটি ডিলিট করতে সমস্যা হয়েছে।' });
    } finally {
      setDeletingRecord(false);
      setShowDeleteModal(false);
      setRecordToDelete(null);
    }
  };

  // Manual Sync Button Handler
  const handleManualSync = async () => {
    if (!isOnline) {
      setMessage({ type: 'error', text: 'আপনি এখনো অফলাইনে আছেন! ইন্টারনেট কানেক্ট করুন।' });
      return;
    }
    setLoading(true);
    const res = await syncOfflineData();
    setLoading(false);
    
    if (res.success) {
      setMessage({ type: 'success', text: `${res.syncedCount}টি অফলাইন রেকর্ড সিঙ্ক করা হয়েছে!` });
      checkOfflineQueue();
      fetchRecords();
    } else {
      setMessage({ type: 'error', text: res.error || 'সিঙ্ক করতে ব্যর্থ হয়েছে।' });
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    if (sessionUser) {
      localStorage.removeItem(`session_start_time_${sessionUser.id}`);
      localStorage.removeItem(`last_access_time_${sessionUser.id}`);
    }
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('selectedYear');
    }
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Time format to AM/PM style (e.g. 07:25 PM)
  const formatTimeToAMPM = (timeStr: string | null) => {
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

  const formatWorkingHours = (hours: number | string) => {
    const h = parseFloat(String(hours));
    if (isNaN(h)) return '৯ ঘণ্টা ৩০ মিনিট';
    if (h === 7.5) return '৭ ঘণ্টা ৩০ মিনিট';
    if (h === 8) return '৮ ঘণ্টা';
    if (h === 8.5) return '৮ ঘণ্টা ৩০ মিনিট';
    if (h === 9) return '৯ ঘণ্টা';
    if (h === 9.5) return '৯ ঘণ্টা ৩০ মিনিট';
    if (h === 10) return '১০ ঘণ্টা';
    return `${h} ঘণ্টা`;
  };

  const getDetailedLeaveLabel = (rec: { leave_type: string; reserve_holiday?: string | null }) => {
    if (rec.leave_type === 'Reserve' && rec.reserve_holiday) {
      return `Reserve (${rec.reserve_holiday})`;
    }
    return rec.leave_type;
  };

  const getUserNotifications = useCallback(() => {
    if (!sessionUser || !profile) return [];
    
    interface NotificationItem {
      id: string;
      chutiId?: string;
      record?: ChutiRecord;
      type: 'revision' | 'approved' | 'rejected' | 'adjusted' | 'cancelled' | 'supervisor_approved' | 'edited';
      timestamp: string;
      title: string;
      body: string;
      text?: string;
    }

    const list: NotificationItem[] = [];

    userRecords.forEach(r => {
      // 1. Check if there are saved notifications in admin_edit_request.notifications
      const hasRequest = r.admin_edit_request && typeof r.admin_edit_request === 'object';
      const savedNotifications = hasRequest && Array.isArray((r.admin_edit_request as any).notifications)
        ? ((r.admin_edit_request as any).notifications as NotificationItem[])
        : [];

      savedNotifications.forEach(n => {
        list.push({
          ...n,
          chutiId: r.id,
          record: r
        });
      });

      // 2. Synthesize Revision Notification if status is 'needs_review' and not already in savedNotifications
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
            body: `আপনার ${r.leave_type} আবেদনটি সংশোধনের জন্য পাঠানো হয়েছে।`
          });
        }
      }
    });

    // Sort by timestamp descending
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [userRecords, sessionUser, profile]);

  const handleOpenNotifications = () => {
    setShowUserNotificationsModal(true);
    const now = new Date().toISOString();
    localStorage.setItem('last_viewed_notifications_time', now);
    setLastViewedTime(now);
  };

  // Toggle Adjustment Status click trigger
  const handleToggleAdjustmentClick = (record: ChutiRecord) => {
    if (record.adjustment || record.adjusted_hour || record.reserve_adjustment_status === 'pending') {
      // Current status is Yes/Partial/Pending/Approved, clicking toggle will turn it OFF
      setCancelAdjustmentRecord(record);
      setShowCancelAdjustmentModal(true);
    } else {
      // Current status is No, clicking toggle will turn it ON
      setAdjustmentRecord(record);
      setAdjustShortLeaveOption(record.adjust_short_leave === true);
      if (record.leave_type === 'Short Leave') {
        setAdjustmentType('full');
        setPartialAdjustmentTime(record.leave_hour ? record.leave_hour.toString().split('.')[0].substring(0, 5) : '02:00');
      }
      setShowAdjustmentModal(true);
    }
  };

  const handleConfirmCancelAdjustment = async () => {
    if (!cancelAdjustmentRecord || submitting) return;
    setSubmitting(true);
    const record = cancelAdjustmentRecord;
    try {
      const isShortOrOvertime = record.leave_type === 'Short Leave' || record.leave_type === 'Overtime';
      const dateTimeStr = isShortOrOvertime
        ? `${formatDate(record.date)} (${formatTimeToAMPM(record.sign_in_time)} - ${formatTimeToAMPM(record.sign_out_time)})`
        : formatDate(record.date);
      const leaveLabel = getDetailedLeaveLabel(record);

      const existingNotifications = (record.admin_edit_request && typeof record.admin_edit_request === 'object' && 'notifications' in record.admin_edit_request)
        ? (record.admin_edit_request as { notifications?: any[] }).notifications || []
        : [];
      const isAdmin = profile?.role === 'admin' && adminActiveTab === 'admin';

      let updates: Record<string, unknown> = {};

      if (isAdmin) {
        const newNotification = {
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
          type: 'cancelled',
          timestamp: new Date().toISOString(),
          title: `${record.leave_type === 'Reserve' ? 'রিজার্ভ সমন্বয়' : 'ছুটি সমন্বয়'} বাতিল ⚠️`,
          body: `আপনার ${dateTimeStr} তারিখের ${leaveLabel} সমন্বয়টি বাতিল করা হয়েছে।`
        };

        updates = { 
          adjustment: false, 
          adjusted_hour: null, 
          adjust_short_leave: false,
          reserve_adjustment_status: 'none',
          admin_edit_request: {
            notifications: [...existingNotifications, newNotification]
          }
        };
      } else {
        updates = {
          reserve_adjustment_status: 'pending',
          admin_edit_request: {
            adjustment: false,
            adjusted_hour: null,
            adjust_short_leave: false,
            notifications: existingNotifications
          }
        };
      }

      setUserRecords(prev => prev.map(r => r.id === record.id ? { ...r, ...updates } : r));
      setAdminRecords(prev => prev.map(r => r.id === record.id ? { ...r, ...updates } : r));

      if (!isOnline) {
        await saveOfflineUpdate(record.id || '', updates);
      } else {
        const { error } = await supabase
          .from('chuti')
          .update(updates)
          .eq('id', record.id || '');

        if (error) throw error;

        // Trigger Web Push Notification
        if (isAdmin) {
          if (record?.user_id) {
            const actionLabel = record.leave_type === 'Reserve' ? 'রিজার্ভ সমন্বয়' : 'ছুটি সমন্বয়';
            sendPushNotification({
              userIds: [record.user_id],
              title: `${actionLabel} বাতিল ⚠️`,
              body: `আপনার ${dateTimeStr} তারিখের ${leaveLabel} সমন্বয়টি বাতিল করা হয়েছে।`,
              url: '/'
            }).catch(err => console.error('Error sending cancel push:', err));
          }
        } else {
          sendPushNotification({
            userIds: ['admins'],
            title: 'ছুটি সমন্বয় বাতিল অনুরোধ 🔄',
            body: `${profile?.full_name || profile?.username || 'স্টাফ'} একটি (${record.leave_type}) ছুটির সমন্বয় বাতিল অনুরোধ করেছেন (${formatDate(record.date)})।`,
            url: '/'
          }).catch(err => console.error('Error triggering cancel adjustment request push:', err));
        }
      }
      fetchRecords();
      setMessage({ 
        type: 'success', 
        text: isAdmin 
          ? 'ছুটি সমন্বয় সফলভাবে বাতিল করা হয়েছে।' 
          : 'সমন্বয় বাতিলের অনুরোধ সফলভাবে পাঠানো হয়েছে এবং অনুমোদনের অপেক্ষায় রয়েছে।' 
      });
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message || 'সমন্বয় বাতিল করতে সমস্যা হয়েছে।' });
    } finally {
      setShowCancelAdjustmentModal(false);
      setCancelAdjustmentRecord(null);
      setSubmitting(false);
    }
  };

  const handleSaveAdjustment = async (overrideAdjustShortLeave?: boolean) => {
    if (!adjustmentRecord || submitting) return;
    setSubmitting(true);
    const record = adjustmentRecord;
    try {
      const isShortLeave = record.leave_type === 'Short Leave';
      const isAdmin = profile?.role === 'admin' && adminActiveTab === 'admin';
      let requestedUpdates: Record<string, unknown> = {};

      if (isShortLeave) {
        if (adjustmentType === 'full') {
          requestedUpdates = { adjustment: true, adjusted_hour: null, adjust_short_leave: false };
        } else {
          const timeRegex = /^([0-9]{1,2}):([0-5][0-9])$/;
          if (!timeRegex.test(partialAdjustmentTime)) {
            alert('সঠিক সময় ফরম্যাট ব্যবহার করুন (যেমন: ০২:৩০)।');
            setSubmitting(false);
            return;
          }
          requestedUpdates = { adjustment: false, adjusted_hour: `${partialAdjustmentTime}:00`, adjust_short_leave: false };
        }
      } else if (record.leave_type === 'Overtime') {
        const shouldAdjust = overrideAdjustShortLeave !== undefined ? overrideAdjustShortLeave : adjustShortLeaveOption;
        requestedUpdates = { adjustment: true, adjusted_hour: null, adjust_short_leave: shouldAdjust };
      } else if (record.leave_type === 'Reserve') {
        const shouldAdjust = overrideAdjustShortLeave !== undefined ? overrideAdjustShortLeave : adjustShortLeaveOption;
        requestedUpdates = { reserve_adjustment_status: isAdmin ? 'approved' : 'pending', adjustment: isAdmin, adjust_short_leave: shouldAdjust };
      } else {
        // Full Leave
        requestedUpdates = { adjustment: true, adjusted_hour: null, adjust_short_leave: false };
      }

      let updates: Record<string, unknown> = {};
      const existingNotifications = (record.admin_edit_request && typeof record.admin_edit_request === 'object' && 'notifications' in record.admin_edit_request)
        ? (record.admin_edit_request as { notifications?: any[] }).notifications || []
        : [];

      if (isAdmin) {
        // Admin applies changes immediately
        const actionLabel = record.leave_type === 'Reserve' ? 'রিজার্ভ সমন্বয়' : 'ছুটি সমন্বয়';
        const leaveLabel = getDetailedLeaveLabel(record);
        const isShortOrOvertime = record.leave_type === 'Short Leave' || record.leave_type === 'Overtime';
        const dateTimeStr = isShortOrOvertime
          ? `${formatDate(record.date)} (${formatTimeToAMPM(record.sign_in_time)} - ${formatTimeToAMPM(record.sign_out_time)})`
          : formatDate(record.date);

        const newNotification = {
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
          type: 'adjusted',
          timestamp: new Date().toISOString(),
          title: `${actionLabel} সম্পন্ন ✅`,
          body: `আপনার ${dateTimeStr} তারিখের ${leaveLabel} সমন্বয় করা হয়েছে।`
        };

        updates = {
          ...requestedUpdates,
          reserve_adjustment_status: record.leave_type === 'Reserve' ? 'approved' : 'none',
          admin_edit_request: {
            notifications: [...existingNotifications, newNotification]
          }
        };
      } else {
        // User/Supervisor: creates a pending request
        updates = {
          reserve_adjustment_status: 'pending',
          admin_edit_request: {
            ...requestedUpdates,
            notifications: existingNotifications
          }
        };
      }

      setUserRecords(prev => prev.map(r => r.id === record.id ? { ...r, ...updates } : r));
      setAdminRecords(prev => prev.map(r => r.id === record.id ? { ...r, ...updates } : r));

      if (!isOnline) {
        await saveOfflineUpdate(record.id || '', updates);
      } else {
        const { error } = await supabase
          .from('chuti')
          .update(updates)
          .eq('id', record.id || '');

        if (error) throw error;
      }
      fetchRecords();

      // Trigger Web Push Notification to Admins (if requested by user) or to User (if approved by admin)
      if (!isAdmin) {
        sendPushNotification({
          userIds: ['admins'],
          title: 'ছুটি সমন্বয় অনুরোধ 🔄',
          body: `${profile?.full_name || profile?.username || 'স্টাফ'} একটি (${record.leave_type}) ছুটির সমন্বয় অনুরোধ করেছেন (${formatDate(record.date)})।`,
          url: '/'
        }).catch(err => console.error('Error triggering push notification for adjustment:', err));
      } else if (record?.user_id) {
        const actionLabel = record.leave_type === 'Reserve' ? 'রিজার্ভ সমন্বয়' : 'ছুটি সমন্বয়';
        const leaveLabel = getDetailedLeaveLabel(record);
        const isShortOrOvertime = record.leave_type === 'Short Leave' || record.leave_type === 'Overtime';
        const dateTimeStr = isShortOrOvertime
          ? `${formatDate(record.date)} (${formatTimeToAMPM(record.sign_in_time)} - ${formatTimeToAMPM(record.sign_out_time)})`
          : formatDate(record.date);

        sendPushNotification({
          userIds: [record.user_id],
          title: `${actionLabel} সম্পন্ন ✅`,
          body: `আপনার ${dateTimeStr} তারিখের ${leaveLabel} সমন্বয় করা হয়েছে।`,
          url: '/'
        }).catch(err => console.error('Error sending adjustment push to user:', err));
      }

      setMessage({ 
        type: 'success', 
        text: (isAdmin || record.leave_type === 'Reserve')
          ? (isAdmin ? 'ছুটি সমন্বয় সফলভাবে সম্পন্ন করা হয়েছে।' : 'রিজার্ভ সমন্বয় অনুরোধ সফলভাবে পাঠানো হয়েছে।')
          : 'সমন্বয় অনুরোধ সফলভাবে পাঠানো হয়েছে এবং অনুমোদনের অপেক্ষায় রয়েছে।'
      });
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message || 'সমন্বয় করতে সমস্যা হয়েছে।' });
    } finally {
      setShowAdjustmentModal(false);
      setAdjustmentRecord(null);
      setSubmitting(false);
    }
  };

  // Approve/Reject Reserve Holiday Adjustment Requests
  const handleApproveReserveAdjustment = async (record: ChutiRecordWithProfile, approve: boolean) => {
    setApprovingIds(prev => new Set(prev).add(record.id));
    try {
      const isCancelRequest = record.admin_edit_request && typeof record.admin_edit_request === 'object' && record.admin_edit_request.adjustment === false;
      const updates: Record<string, unknown> = {};

      if (isCancelRequest) {
        if (approve) {
          // Admin approves the cancellation -> turn adjustment OFF
          updates.reserve_adjustment_status = 'none';
          updates.adjustment = false;
          updates.adjusted_hour = null;
          updates.adjust_short_leave = false;
        } else {
          // Admin rejects the cancellation -> keep adjustment ON
          updates.reserve_adjustment_status = 'approved';
        }
      } else {
        // This is an adjustment request (turning it ON/partial)
        updates.reserve_adjustment_status = approve ? 'approved' : 'rejected';
        if (approve) {
          if (record.admin_edit_request && typeof record.admin_edit_request === 'object') {
            updates.adjustment = record.admin_edit_request.adjustment === true;
            updates.adjusted_hour = record.admin_edit_request.adjusted_hour || null;
            updates.adjust_short_leave = record.admin_edit_request.adjust_short_leave === true;
          } else {
            updates.adjustment = true;
            updates.adjusted_hour = null;
          }
        } else {
          // Rejecting adjustment request -> set adjustment OFF
          updates.adjustment = false;
          updates.adjusted_hour = null;
          updates.adjust_short_leave = false;
        }
      }

      const adminName = profile?.full_name ? `অ্যাডমিন ${profile.full_name}` : 'অ্যাডমিন';
      const leaveLabel = getDetailedLeaveLabel(record);
      const isShortOrOvertime = record.leave_type === 'Short Leave' || record.leave_type === 'Overtime';
      const dateTimeStr = isShortOrOvertime
        ? `${formatDate(record.date)} (${formatTimeToAMPM(record.sign_in_time)} - ${formatTimeToAMPM(record.sign_out_time)})`
        : formatDate(record.date);

      const requestTypeLabel = isCancelRequest ? 'সমন্বয় বাতিল' : 'সমন্বয়';

      const bodyText = approve 
        ? `${adminName} আপনার ${dateTimeStr} তারিখের ${leaveLabel} ${requestTypeLabel} আবেদনটি অনুমোদন করেছেন।`
        : `আপনার ${dateTimeStr} তারিখের ${leaveLabel} ${requestTypeLabel} আবেদনটি প্রত্যাখ্যান করা হয়েছে।`;

      const existingNotifications = (record.admin_edit_request && typeof record.admin_edit_request === 'object' && 'notifications' in record.admin_edit_request)
        ? (record.admin_edit_request as { notifications?: any[] }).notifications || []
        : [];

      const titleLabel = isCancelRequest 
        ? `${record.leave_type === 'Reserve' ? 'রিজার্ভ সমন্বয়' : 'ছুটি সমন্বয়'} বাতিল` 
        : (record.leave_type === 'Reserve' ? 'রিজার্ভ সমন্বয়' : 'ছুটি সমন্বয়');

      const newNotification = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
        type: approve ? 'approved' : 'rejected',
        timestamp: new Date().toISOString(),
        title: `${titleLabel} ${approve ? 'অনুমোদিত ✅' : 'প্রত্যাখ্যাত ❌'}`,
        body: bodyText
      };

      updates.admin_edit_request = {
        notifications: [...existingNotifications, newNotification]
      };

      if (record.status === 'approved_by_supervisor') {
        updates.status = approve ? 'approved' : 'needs_review';
      }

      setUserRecords(prev => prev.map(r => r.id === record.id ? { ...r, ...updates } : r));
      setAdminRecords(prev => prev.map(r => r.id === record.id ? { ...r, ...updates } : r));

      const { error } = await supabase
        .from('chuti')
        .update(updates)
        .eq('id', record.id || '');
      
      if (error) throw error;

      // Trigger Web Push Notification to Staff member
      if (record?.user_id) {
        const actionLabel = record.leave_type === 'Reserve' ? 'রিজার্ভ সমন্বয়' : 'ছুটি সমন্বয়';
        const adminName = profile?.full_name ? `অ্যাডমিন ${profile.full_name}` : 'অ্যাডমিন';
        const leaveLabel = getDetailedLeaveLabel(record);
        const isShortOrOvertime = record.leave_type === 'Short Leave' || record.leave_type === 'Overtime';
        const dateTimeStr = isShortOrOvertime
          ? `${formatDate(record.date)} (${formatTimeToAMPM(record.sign_in_time)} - ${formatTimeToAMPM(record.sign_out_time)})`
          : formatDate(record.date);

        const isCancelRequest = record.admin_edit_request && typeof record.admin_edit_request === 'object' && record.admin_edit_request.adjustment === false;
        const requestTypeLabel = isCancelRequest ? 'সমন্বয় বাতিল' : 'সমন্বয়';

        const bodyText = approve 
          ? `${adminName} আপনার ${dateTimeStr} তারিখের ${leaveLabel} ${requestTypeLabel} আবেদনটি অনুমোদন করেছেন।`
          : `আপনার ${dateTimeStr} তারিখের ${leaveLabel} ${requestTypeLabel} আবেদনটি প্রত্যাখ্যান করা হয়েছে।`;

        const titleLabel = isCancelRequest 
          ? `${actionLabel} বাতিল` 
          : actionLabel;

        sendPushNotification({
          userIds: [record.user_id],
          title: `${titleLabel} ${approve ? 'অনুমোদিত ✅' : 'প্রত্যাখ্যাত ❌'}`,
          body: bodyText,
          url: '/'
        }).catch(err => console.error('Error sending push:', err));
      }

      setApprovingIds(prev => { const s = new Set(prev); s.delete(record.id); return s; });
      if (approve) {
        setApprovedIds(prev => new Set(prev).add(record.id));
        setTimeout(() => setApprovedIds(prev => { const s = new Set(prev); s.delete(record.id); return s; }), 1500);
      }

      fetchRecords();
      setMessage({ 
        type: 'success', 
        text: approve 
          ? (isCancelRequest ? 'সমন্বয় বাতিল অনুমোদন করা হয়েছে।' : 'সমন্বয় অনুমোদন করা হয়েছে।') 
          : 'অনুরোধ প্রত্যাখ্যান করা হয়েছে।' 
      });
    } catch (err) {
      setApprovingIds(prev => { const s = new Set(prev); s.delete(record.id); return s; });
      alert('অ্যাকশন সম্পন্ন করতে ব্যর্থ হয়েছে: ' + (err as Error).message);
    }
  };


  // Submit Profile Changes (Direct update for admin/staff, Request for user)
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionUser || !profile) return;
    setSetupSubmitting(true);
    setMessage(null);

    try {
      if (editingStaffProfileId) {
        // Direct update of a staff profile by admin
        const updates = {
          username: editUsername.toUpperCase().trim(),
          full_name: editFullName,
          working_hours: parseFloat(editWorkingHours) || 9.5,
          break_time: parseInt(editBreakTime) || 0,
          job_role: editJobRole,
          default_sign_in: profileSignInTime,
          default_sign_out: profileSignOutTime,
          needs_supervisor_approval: editNeedsApproval,
          allow_reserve: editAllowReserve,
          allow_overtime: editAllowOvertime,
        };

        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', editingStaffProfileId);

        if (error) throw error;

        setMessage({ type: 'success', text: 'স্টাফ প্রোফাইল সফলভাবে আপডেট করা হয়েছে!' });
        setShowProfileSettingsModal(false);
        setEditingStaffProfileId(null);
        fetchRecords();
      } else if (profile.role === 'admin') {
        // Direct update for admin themselves
        const updates = {
          username: editUsername.toUpperCase().trim(),
          full_name: editFullName,
          working_hours: parseFloat(editWorkingHours) || 9.5,
          break_time: parseInt(editBreakTime) || 0,
          job_role: editJobRole,
          default_sign_in: profileSignInTime,
          default_sign_out: profileSignOutTime,
          needs_supervisor_approval: editNeedsApproval,
          allow_reserve: editAllowReserve,
          allow_overtime: editAllowOvertime,
        };

        const { data: updatedProfile, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', sessionUser.id)
          .select()
          .single();

        if (error) throw error;

        setProfile(updatedProfile);
        setMessage({ type: 'success', text: 'আপনার প্রোফাইল সফলভাবে আপডেট করা হয়েছে!' });
        setShowProfileSettingsModal(false);
      } else {
        // First edit does not require admin approval
        if (!profile?.has_edited_profile) {
          const updates = {
            full_name: editFullName,
            working_hours: parseFloat(editWorkingHours) || 9.5,
            break_time: parseInt(editBreakTime) || 0,
            job_role: editJobRole,
            default_sign_in: profileSignInTime,
            default_sign_out: profileSignOutTime,
            has_edited_profile: true
          };

          const { data: updatedProfile, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', sessionUser.id)
            .select()
            .single();

          if (error) throw error;

          setProfile(updatedProfile);
          setIsEditRequestMode(false);
          setMessage({ type: 'success', text: 'আপনার প্রোফাইল সফলভাবে আপডেট করা হয়েছে!' });
          setShowProfileSettingsModal(false);
        } else {
          // Send request for regular user (from second time onwards)
          const updates = {
            requested_full_name: editFullName,
            requested_working_hours: parseFloat(editWorkingHours) || 9.5,
            requested_break_time: parseInt(editBreakTime) || 0,
            requested_job_role: editJobRole,
            requested_default_sign_in: profileSignInTime,
            requested_default_sign_out: profileSignOutTime,
            profile_change_status: 'pending'
          };

          const { data: updatedProfile, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', sessionUser.id)
            .select()
            .single();

          if (error) throw error;

          // Trigger Web Push Notification to Admins
          sendPushNotification({
            userIds: ['admins'],
            title: 'প্রোফাইল পরিবর্তন অনুরোধ 👤',
            body: `${profile?.full_name || profile?.username || 'স্টাফ'} তাঁর প্রোফাইল তথ্য পরিবর্তনের অনুরোধ জানিয়েছেন।`,
            url: '/'
          }).catch(err => console.error('Error triggering push notification for profile change:', err));

          setProfile(updatedProfile);
          setIsEditRequestMode(false);
          setMessage({ type: 'success', text: 'প্রোফাইল পরিবর্তনের অনুরোধ অ্যাডমিনের কাছে পাঠানো হয়েছে।' });
          setShowProfileSettingsModal(false);
        }
      }
    } catch (err) {
      let errorMsg = (err as Error).message || 'অনুরোধ পাঠাতে সমস্যা হয়েছে।';
      if ((err as { code?: string }).code === '23505' || errorMsg.toLowerCase().includes('duplicate') || errorMsg.toLowerCase().includes('unique')) {
        errorMsg = 'এই কোডনেমটি ইতিমধ্যে ব্যবহার করা হচ্ছে! অন্য একটি কোডনেম ব্যবহার করুন।';
      }
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setSetupSubmitting(false);
    }
  };

  // Onboarding Setup Submit
  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionUser || !profile) return;
    setSetupSubmitting(true);
    setSetupError('');

    try {
      const updates: Record<string, unknown> = {
        full_name: setupFullName,
        working_hours: parseFloat(setupWorkingHours) || 9.5,
        break_time: parseInt(setupBreakTime) || 0,
        job_role: setupJobRole,
        default_sign_in: setupSignInTime,
        default_sign_out: setupSignOutTime,
        is_setup_completed: true,
      };

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', sessionUser.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(updatedProfile);
      setEditFullName(updatedProfile.full_name || '');
      setEditWorkingHours(Number(updatedProfile.working_hours || 9.5).toFixed(1));
      setEditBreakTime(String(updatedProfile.break_time || 0));
      setEditJobRole(updatedProfile.job_role || '');

      setMessage({ type: 'success', text: 'আপনার প্রোফাইল সেটআপ সফলভাবে সম্পন্ন হয়েছে!' });
    } catch (err) {
      setSetupError((err as Error).message || 'সেটআপ আপডেট করতে সমস্যা হয়েছে।');
    } finally {
      setSetupSubmitting(false);
    }
  };

  // First-Time Setup & Password Change Submit
  const handleFirstTimeSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionUser || !profile) return;
    if (firstTimePassword !== firstTimeConfirmPassword) {
      setFirstTimePasswordError('পাসওয়ার্ড মেলেনি!');
      return;
    }
    if (firstTimePassword.length < 4) {
      setFirstTimePasswordError('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে!');
      return;
    }

    setFirstTimePasswordSubmitting(true);
    setFirstTimePasswordError('');

    try {
      // 1. Update auth password in Supabase
      const { error: authError } = await supabase.auth.updateUser({
        password: firstTimePassword,
      });
      if (authError) throw authError;

      // 2. Prepare profile update updates
      const updates: Record<string, unknown> = {
        has_changed_password: true,
      };

      // If user profile setup is not completed and they are not Admin, save setup fields too
      const needsProfileSetup = profile.role !== 'admin' && !profile.is_setup_completed;
      if (needsProfileSetup) {
        updates.full_name = firstTimeSetupFullName;
        updates.job_role = firstTimeSetupJobRole;
        updates.working_hours = parseFloat(firstTimeSetupWorkingHours) || 9.5;
        updates.break_time = parseInt(firstTimeSetupBreakTime) || 0;
        updates.default_sign_in = firstTimeSetupSignInTime;
        updates.default_sign_out = firstTimeSetupSignOutTime;
        updates.is_setup_completed = true;
      }

      const { data: updatedProfile, error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', sessionUser.id)
        .select()
        .single();

      if (profileError) throw profileError;

      setProfile(updatedProfile);
      setEditFullName(updatedProfile.full_name || '');
      setEditWorkingHours(Number(updatedProfile.working_hours || 9.5).toFixed(1));
      setEditBreakTime(String(updatedProfile.break_time || 0));
      setEditJobRole(updatedProfile.job_role || '');
      setProfileSignInTime(updatedProfile.default_sign_in || '09:30');
      setProfileSignOutTime(updatedProfile.default_sign_out || '19:00');

      setShowFirstTimePasswordModal(false);
      localStorage.removeItem(`first_time_modal_start_time_${sessionUser.id}`);
      setShowWelcomePopup(true);
      setTimeout(() => {
        setShowWelcomePopup(false);
      }, 10000);
      setMessage({ type: 'success', text: 'পাসওয়ার্ড পরিবর্তন সফল হয়েছে!' });
    } catch (err) {
      setFirstTimePasswordError((err as Error).message || 'পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে।');
    } finally {
      setFirstTimePasswordSubmitting(false);
    }
  };

  // Approve/Reject Profile Change request from Admin view
  const handleApproveProfileChangeRequest = async (profileId: string, approve: boolean) => {
    setApprovingIds(prev => new Set(prev).add(profileId));
    try {
      let updates: Record<string, unknown> = {};
      if (approve) {
        // Get the requested values for this profile
        const targetProfile = profilesList.find(p => p.id === profileId);
        if (!targetProfile) throw new Error('প্রোফাইল খুঁজে পাওয়া যায়নি।');

        updates = {
          full_name: targetProfile.requested_full_name || targetProfile.full_name,
          working_hours: targetProfile.requested_working_hours || targetProfile.working_hours,
          break_time: targetProfile.requested_break_time || targetProfile.break_time,
          job_role: targetProfile.requested_job_role || targetProfile.job_role,
          default_sign_in: targetProfile.requested_default_sign_in || targetProfile.default_sign_in,
          default_sign_out: targetProfile.requested_default_sign_out || targetProfile.default_sign_out,
          requested_full_name: null,
          requested_working_hours: null,
          requested_break_time: null,
          requested_job_role: null,
          requested_default_sign_in: null,
          requested_default_sign_out: null,
          profile_change_status: 'none'
        };
      } else {
        updates = {
          requested_full_name: null,
          requested_working_hours: null,
          requested_break_time: null,
          requested_job_role: null,
          requested_default_sign_in: null,
          requested_default_sign_out: null,
          profile_change_status: 'none'
        };
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profileId);
      
      if (error) throw error;

      // Trigger Web Push Notification to Staff member
      sendPushNotification({
        userIds: [profileId],
        title: `প্রোফাইল পরিবর্তন ${approve ? 'অনুমোদিত ✅' : 'প্রত্যাখ্যাত ❌'}`,
        body: `আপনার প্রোফাইল তথ্য পরিবর্তনের অনুরোধটি অ্যাডমিন ${approve ? 'অনুমোদন' : 'প্রত্যাখ্যান'} করেছেন।`,
        url: '/'
      }).catch(err => console.error('Error sending profile change push:', err));
      
      setApprovingIds(prev => { const s = new Set(prev); s.delete(profileId); return s; });
      if (approve) {
        setApprovedIds(prev => new Set(prev).add(profileId));
        setTimeout(() => setApprovedIds(prev => { const s = new Set(prev); s.delete(profileId); return s; }), 1500);
      }
      
      // Update profiles list in local state
      setProfilesList(prev => prev.map(p => {
        if (p.id === profileId) {
          return {
            ...p,
            ...(approve ? {
              full_name: p.requested_full_name || p.full_name,
              working_hours: p.requested_working_hours || p.working_hours,
              break_time: p.requested_break_time || p.break_time,
              job_role: p.requested_job_role || p.job_role,
              default_sign_in: p.requested_default_sign_in || p.default_sign_in,
              default_sign_out: p.requested_default_sign_out || p.default_sign_out,
            } : {}),
            requested_full_name: null,
            requested_working_hours: null,
            requested_break_time: null,
            requested_job_role: null,
            requested_default_sign_in: null,
            requested_default_sign_out: null,
            profile_change_status: 'none'
          };
        }
        return p;
      }));

      // Also if the current session user is the one being updated, update the local profile state
      if (sessionUser && sessionUser.id === profileId) {
        setProfile((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            ...(approve ? {
              full_name: prev.requested_full_name || prev.full_name,
              working_hours: prev.requested_working_hours || prev.working_hours,
              break_time: prev.requested_break_time || prev.break_time,
              job_role: prev.requested_job_role || prev.job_role,
              default_sign_in: prev.requested_default_sign_in || prev.default_sign_in,
              default_sign_out: prev.requested_default_sign_out || prev.default_sign_out,
            } : {}),
            requested_full_name: null,
            requested_working_hours: null,
            requested_break_time: null,
            requested_job_role: null,
            requested_default_sign_in: null,
            requested_default_sign_out: null,
            profile_change_status: 'none'
          };
        });
      }
      
      fetchRecords();
      setMessage({ type: 'success', text: approve ? 'প্রোফাইল পরিবর্তন অনুমোদন করা হয়েছে।' : 'অনুরোধ প্রত্যাখ্যান করা হয়েছে।' });
    } catch (err) {
      alert('অ্যাকশন সম্পন্ন করতে ব্যর্থ হয়েছে: ' + (err as Error).message);
    }
  };

  // Supervisor Leave Approval/Revision Action
  const handleSupervisorApproveChuti = async (chutiId: string, approve: boolean) => {
    if (approve) {
      setApprovingIds(prev => new Set(prev).add(chutiId));
    } else {
      setRevisionPromptChutiId(chutiId);
      setRevisionPromptIsSupervisor(true);
      setRevisionPromptText('');
      setShowRevisionPromptModal(true);
      return;
    }
    try {
      const isBulk = chutiId.startsWith('bulk-');
      const bulkId = isBulk ? chutiId.replace('bulk-', '') : null;

      let targets: ChutiRecordWithProfile[] = [];
      if (isBulk) {
        targets = adminRecords.filter(r => r.bulk_id === bulkId && r.status === 'pending_supervisor');
      } else {
        const target = ((adminRecords.find(r => r.id === chutiId) || userRecords.find(r => r.id === chutiId)) as ChutiRecordWithProfile | undefined) as ChutiRecordWithProfile | undefined;
        if (target) targets = [target];
      }

      if (targets.length === 0) throw new Error('রেকর্ড খুঁজে পাওয়া যায়নি।');

      const user_id = targets[0].user_id;
      const leave_type = targets[0].leave_type;
      const formattedDates = targets.map(t => formatDate(t.date)).join(', ');

      await Promise.all(targets.map(async (t) => {
        let updatedComment = t.comment || '';
        if (profile?.username) {
          const prefix = `${profile.username} Approved`;
          if (!updatedComment.includes(prefix)) {
            updatedComment = updatedComment ? `${prefix} | ${updatedComment}` : `${prefix}`;
          }
        }
        const newNotification = {
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
          type: 'supervisor_approved',
          timestamp: new Date().toISOString(),
          title: 'ছুটি সুপারভাইজার দ্বারা অনুমোদিত ✅',
          body: `আপনার ${t.leave_type} আবেদনটি সুপারভাইজার অনুমোদন করেছেন (তারিখ: ${formatDate(t.date)})। এটি এখন অ্যাডমিন অ্যাপ্রুভালের অপেক্ষায় রয়েছে।`
        };
        const existingNotifications = (t.admin_edit_request && typeof t.admin_edit_request === 'object' && 'notifications' in t.admin_edit_request)
          ? (t.admin_edit_request as { notifications?: any[] }).notifications || []
          : [];

        const updates = { 
          status: 'approved_by_supervisor',
          comment: updatedComment || null,
          admin_edit_request: {
            ...(t.admin_edit_request || {}),
            notifications: [...existingNotifications, newNotification]
          }
        };

        setUserRecords(prev => prev.map(r => r.id === t.id ? { ...r, ...updates } : r));
        setAdminRecords(prev => prev.map(r => r.id === t.id ? { ...r, ...updates } : r));

        const { error } = await supabase
          .from('chuti')
          .update(updates)
          .eq('id', t.id);

        if (error) throw error;
      }));

      // Trigger Web Push Notification to Staff member
      if (user_id) {
        sendPushNotification({
          userIds: [user_id],
          title: 'ছুটি সুপারভাইজার দ্বারা অনুমোদিত ✅',
          body: `আপনার ${leave_type} আবেদনটি সুপারভাইজার অনুমোদন করেছেন (তারিখ: ${formattedDates})। এটি এখন অ্যাডমিন অ্যাপ্রuভালের অপেক্ষায় রয়েছে।`,
          url: '/'
        }).catch(err => console.error('Error sending push:', err));
      }

      // Notify Admins
      sendPushNotification({
        userIds: ['admins'],
        title: 'ছুটি সুপারভাইজার অ্যাপ্রুভড 🔔',
        body: `${targets[0]?.profiles?.username || 'স্টাফ'}-এর ছুটি সুপারভাইজার অনুমোদন করেছেন (তারিখ: ${formattedDates})। অ্যাডমিন প্যানেল চেক করুন।`,
        url: '/'
      }).catch(err => console.error('Error sending push to admin:', err));

      setApprovingIds(prev => { const s = new Set(prev); s.delete(chutiId); return s; });
      setApprovedIds(prev => new Set(prev).add(chutiId));
      setTimeout(() => setApprovedIds(prev => { const s = new Set(prev); s.delete(chutiId); return s; }), 1500);

      fetchRecords();
      setMessage({ 
        type: 'success', 
        text: 'ছুটি অনুমোদন করে অ্যাডমিনের কাছে পাঠানো হয়েছে।' 
      });
    } catch (err) {
      setApprovingIds(prev => { const s = new Set(prev); s.delete(chutiId); return s; });
      alert('অ্যাকশন সম্পন্ন করতে ব্যর্থ হয়েছে: ' + (err as Error).message);
    }
  };

  // Admin Leave Approval/Revision Action
  const handleApproveChutiRequest = async (chutiId: string, approve: boolean) => {
    if (approve) {
      setApprovingIds(prev => new Set(prev).add(chutiId));
    } else {
      setRevisionPromptChutiId(chutiId);
      setRevisionPromptIsSupervisor(false);
      setRevisionPromptText('');
      setShowRevisionPromptModal(true);
      return;
    }
    try {
      const isBulk = chutiId.startsWith('bulk-');
      const bulkId = isBulk ? chutiId.replace('bulk-', '') : null;

      let targets: ChutiRecordWithProfile[] = [];
      if (isBulk) {
        targets = adminRecords.filter(r => r.bulk_id === bulkId && r.status === 'approved_by_supervisor');
      } else {
        const target = adminRecords.find(r => r.id === chutiId);
        if (target) targets = [target];
      }

      if (targets.length === 0) throw new Error('রেকর্ড খুঁজে পাওয়া যায়নি।');

      const user_id = targets[0].user_id;
      const leave_type = targets[0].leave_type;
      const formattedDates = targets.map(t => formatDate(t.date)).join(', ');

      await Promise.all(targets.map(async (t) => {
        let updatedComment = t.comment || '';
        if (profile?.username) {
          const prefix = `${profile.username} Approved`;
          if (!updatedComment.includes(prefix)) {
            updatedComment = updatedComment ? `${prefix} | ${updatedComment}` : `${prefix}`;
          }
        }
        const newNotification = {
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
          type: 'approved',
          timestamp: new Date().toISOString(),
          title: 'ছুটি চূড়ান্তভাবে অনুমোদিত 🎉',
          body: `আপনার ${t.leave_type} আবেদনটি চূড়ান্তভাবে অনুমোদন করা হয়েছে (তারিখ: ${formatDate(t.date)})।`
        };
        const existingNotifications = (t.admin_edit_request && typeof t.admin_edit_request === 'object' && 'notifications' in t.admin_edit_request)
          ? (t.admin_edit_request as { notifications?: any[] }).notifications || []
          : [];

        const updates = {
          status: 'approved',
          reserve_adjustment_status: (t.leave_type === 'Reserve' && t.adjustment) ? 'approved' : 'none',
          comment: updatedComment || null,
          admin_edit_request: {
            ...(t.admin_edit_request || {}),
            notifications: [...existingNotifications, newNotification]
          }
        };

        setUserRecords(prev => prev.map(r => r.id === t.id ? { ...r, ...updates } : r));
        setAdminRecords(prev => prev.map(r => r.id === t.id ? { ...r, ...updates } : r));

        const { error } = await supabase
          .from('chuti')
          .update(updates)
          .eq('id', t.id);

        if (error) throw error;
      }));

      // Trigger Web Push Notification to Staff member
      if (user_id) {
        sendPushNotification({
          userIds: [user_id],
          title: 'ছুটি চূড়ান্তভাবে অনুমোদিত 🎉',
          body: `আপনার ${leave_type} আবেদনটি চূড়ান্তভাবে অনুমোদন করা হয়েছে (তারিখ: ${formattedDates})।`,
          url: '/'
        }).catch(err => console.error('Error sending push:', err));
      }

      setApprovingIds(prev => { const s = new Set(prev); s.delete(chutiId); return s; });
      setApprovedIds(prev => new Set(prev).add(chutiId));
      setTimeout(() => setApprovedIds(prev => { const s = new Set(prev); s.delete(chutiId); return s; }), 1500);

      fetchRecords();
      setMessage({ 
        type: 'success', 
        text: 'ছুটির তথ্য সফলভাবে অনুমোদন করা হয়েছে।' 
      });
    } catch (err) {
      setApprovingIds(prev => { const s = new Set(prev); s.delete(chutiId); return s; });
      alert('অ্যাকশন সম্পন্ন করতে ব্যর্থ হয়েছে: ' + (err as Error).message);
    }
  };

  // Custom Revision Submission Handler
  const submitRevisionWithReason = async () => {
    if (!revisionPromptChutiId) return;
    if (!revisionPromptText.trim()) {
      alert("রিভিশনে পাঠানোর কারণ অবশ্যই লিখতে হবে।");
      return;
    }

    const chutiId = revisionPromptChutiId;
    const reasonText = revisionPromptText.trim();
    
    setSubmittingRevision(true);
    setReviewingIds(prev => new Set(prev).add(chutiId));

    try {
      const isBulk = chutiId.startsWith('bulk-');
      const bulkId = isBulk ? chutiId.replace('bulk-', '') : null;

      let targets: ChutiRecordWithProfile[] = [];
      if (isBulk) {
        targets = adminRecords.filter(r => r.bulk_id === bulkId);
      } else {
        const target = (adminRecords.find(r => r.id === chutiId) || userRecords.find(r => r.id === chutiId)) as ChutiRecordWithProfile | undefined;
        if (target) targets = [target];
      }

      if (targets.length === 0) throw new Error('রেকর্ড খুঁজে পাওয়া যায়নি।');

      const user_id = targets[0].user_id;
      const leave_type = targets[0].leave_type;
      const formattedDates = targets.map(t => formatDate(t.date)).join(', ');

      if (revisionPromptIsSupervisor) {
        const updatedCommentPrefix = `${profile?.username || 'Supervisor'} Revision: ${reasonText}`;

        await Promise.all(targets.map(async (t) => {
          let updatedComment = t.comment || '';
          updatedComment = updatedComment ? `${updatedCommentPrefix} | ${updatedComment}` : updatedCommentPrefix;

          const newNotification = {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
            type: 'revision',
            timestamp: new Date().toISOString(),
            title: 'ছুটি সংশোধনের অনুরোধ ⚠️',
            body: `আপনার ${t.leave_type} আবেদনটি সুপারভাইজার সংশোধনের জন্য পাঠিয়েছেন (তারিখ: ${formatDate(t.date)})। কারণ: ${reasonText}`
          };
          const existingNotifications = (t.admin_edit_request && typeof t.admin_edit_request === 'object' && 'notifications' in t.admin_edit_request)
            ? (t.admin_edit_request as { notifications?: any[] }).notifications || []
            : [];

          const { error } = await supabase
            .from('chuti')
            .update({ 
              status: 'needs_review',
              comment: updatedComment,
              admin_edit_request: {
                ...(t.admin_edit_request || {}),
                notifications: [...existingNotifications, newNotification]
              }
            })
            .eq('id', t.id);

          if (error) throw error;
        }));

        // Trigger Web Push Notification to Staff member
        if (user_id) {
          sendPushNotification({
            userIds: [user_id],
            title: 'ছুটি সংশোধনের অনুরোধ ⚠️',
            body: `আপনার ${leave_type} আবেদনটি সুপারভাইজার সংশোধনের জন্য পাঠিয়েছেন (তারিখ: ${formattedDates})। কারণ: ${reasonText}`,
            url: '/'
          }).catch(err => console.error('Error sending push:', err));
        }

        setMessage({ 
          type: 'success', 
          text: 'ছুটি সংশোধনের জন্য ইউজারের কাছে ফেরত পাঠানো হয়েছে।' 
        });
      } else {
        const updatedCommentPrefix = `${profile?.username || 'Admin'} Revision: ${reasonText}`;

        await Promise.all(targets.map(async (t) => {
          let updatedComment = t.comment || '';
          updatedComment = updatedComment ? `${updatedCommentPrefix} | ${updatedComment}` : updatedCommentPrefix;

          const newNotification = {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
            type: 'revision',
            timestamp: new Date().toISOString(),
            title: 'ছুটি সংশোধনের অনুরোধ ⚠️',
            body: `আপনার ${t.leave_type} আবেদনটি অ্যাডমিন সংশোধনের জন্য পাঠিয়েছেন (তারিখ: ${formatDate(t.date)})। কারণ: ${reasonText}`
          };
          const existingNotifications = (t.admin_edit_request && typeof t.admin_edit_request === 'object' && 'notifications' in t.admin_edit_request)
            ? (t.admin_edit_request as { notifications?: any[] }).notifications || []
            : [];

          const updates = {
            status: 'needs_review',
            reserve_adjustment_status: 'none',
            comment: updatedComment,
            admin_edit_request: {
              ...(t.admin_edit_request || {}),
              notifications: [...existingNotifications, newNotification]
            }
          };

          const { error } = await supabase
            .from('chuti')
            .update(updates)
            .eq('id', t.id);

          if (error) throw error;
        }));

        // Trigger Web Push Notification to Staff member
        if (user_id) {
          sendPushNotification({
            userIds: [user_id],
            title: 'ছুটি সংশোধনের অনুরোধ ⚠️',
            body: `আপনার ${leave_type} আবেদনটি অ্যাডমিন সংশোধনের জন্য পাঠিয়েছেন (তারিখ: ${formattedDates})। কারণ: ${reasonText}`,
            url: '/'
          }).catch(err => console.error('Error sending push:', err));
        }

        setMessage({ 
          type: 'success', 
          text: 'ছুটির তথ্য সংশোধনের জন্য ইউজারের কাছে ফেরত পাঠানো হয়েছে।' 
        });
      }
      setShowRevisionPromptModal(false);
      setRevisionPromptChutiId(null);
      setRevisionPromptText('');
      fetchRecords();
    } catch (err) {
      alert('অ্যাকশন সম্পন্ন করতে ব্যর্থ হয়েছে: ' + (err as Error).message);
    } finally {
      setSubmittingRevision(false);
      setReviewingIds(prev => { const s = new Set(prev); s.delete(chutiId); return s; });
    }
  };

  // Admin save edited chuti record
  const handleAdminSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEditRecord) return;
    setSubmitting(true);
    
    try {
      const isReserve = adminEditLeaveType === 'Reserve';
      const isFullLeave = adminEditLeaveType === 'Full Leave';
      
      const newNotification = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
        type: 'edited',
        timestamp: new Date().toISOString(),
        title: 'ছুটির তথ্য সংশোধিত ✏️',
        body: `অ্যাডমিন আপনার (${formatDate(adminEditDate)}) তারিখের ছুটির তথ্য সংশোধন করেছেন।`
      };
      const existingNotifications = (adminEditRecord.admin_edit_request && typeof adminEditRecord.admin_edit_request === 'object' && 'notifications' in adminEditRecord.admin_edit_request)
        ? (adminEditRecord.admin_edit_request as { notifications?: any[] }).notifications || []
        : [];

      const updates = {
        date: adminEditDate,
        leave_type: adminEditLeaveType,
        adjustment: adminEditAdjustment,
        adjust_short_leave: (adminEditLeaveType === 'Overtime' || adminEditLeaveType === 'Reserve') && adminEditAdjustment ? adminEditAdjustShortLeave : false,
        sign_in_time: (isReserve || isFullLeave) ? null : adminEditSignInTime,
        sign_out_time: (isReserve || isFullLeave) ? null : adminEditSignOutTime,
        leave_hour: (isReserve || isFullLeave) ? null : `${adminEditLeaveHour}:00`,
        reserve_holiday: isReserve ? adminEditReserveHoliday : null,
        reserve_adjustment_status: isReserve ? (adminEditAdjustment ? 'approved' : 'none') : 'none',
        comment: adminEditComment || null,
        is_edited: true,
        admin_edit_request: {
          notifications: [...existingNotifications, newNotification]
        },
        admin_edit_status: 'none'
      };

      setUserRecords(prev => prev.map(r => r.id === adminEditRecord.id ? { ...r, ...updates } : r));
      setAdminRecords(prev => prev.map(r => r.id === adminEditRecord.id ? { ...r, ...updates } : r));

      const { error } = await supabase
        .from('chuti')
        .update(updates)
        .eq('id', adminEditRecord.id);

      if (error) throw error;

      // Trigger Web Push Notification to Staff member
      if (adminEditRecord?.user_id) {
        sendPushNotification({
          userIds: [adminEditRecord.user_id],
          title: 'ছুটির তথ্য সংশোধিত ✏️',
          body: `অ্যাডমিন আপনার (${formatDate(adminEditDate)}) তারিখের ছুটির তথ্য সংশোধন করেছেন।`,
          url: '/'
        }).catch(err => console.error('Error sending admin edit push:', err));
      }

      fetchRecords();
      setShowAdminEditModal(false);
      setMessage({ 
        type: 'success', 
        text: 'ছুটির তথ্য সফলভাবে আপডেট করা হয়েছে।' 
      });
    } catch (err) {
      alert('এডিট করতে সমস্যা হয়েছে: ' + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  // ===== USER MANAGEMENT FUNCTIONS =====
  const handleCreateNewUser = async () => {
    if (!newStaffEmail || !newStaffPassword || !newStaffUsername || !newStaffFullName) {
      setMessage({ type: 'error', text: 'সমস্ত ফিল্ড পূরণ করুন!' });
      return;
    }
    setCreatingUser(true);
    try {
      const { error } = await supabase.rpc('create_new_user', {
        p_email: newStaffEmail,
        p_password: newStaffPassword,
        p_username: newStaffUsername.toUpperCase(),
        p_role: newStaffRole,
        p_full_name: newStaffFullName,
        p_needs_supervisor_approval: newStaffNeedsApproval,
        p_allow_reserve: newStaffAllowReserve,
        p_allow_overtime: newStaffAllowOvertime,
      });
      if (error) throw error;
      
      setMessage({ type: 'success', text: `নতুন স্টাফ "${newStaffFullName}" সফলভাবে তৈরি করা হয়েছে!` });
      setShowCreateUserModal(false);
      setNewStaffEmail('');
      setNewStaffPassword('');
      setNewStaffConfirmPassword('');
      setNewStaffUsername('');
      setNewStaffRole('user');
      setNewStaffFullName('');
      setNewStaffNeedsApproval(false);
      setNewStaffAllowReserve(false);
      setNewStaffAllowOvertime(false);
      fetchRecords();
    } catch (err) {
      setMessage({ type: 'error', text: 'ইউজার তৈরি করতে ব্যর্থ: ' + (err as Error).message });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleUpdateCredentials = async () => {
    if (!credTargetUserId) return;
    if (!credNewUsername && !credNewPassword) {
      setMessage({ type: 'error', text: 'কমপক্ষে কোডনেম অথবা পাসওয়ার্ড দিন!' });
      return;
    }
    if (credNewPassword && credNewPassword !== credConfirmPassword) {
      setMessage({ type: 'error', text: 'পাসওয়ার্ড মেলেনি!' });
      return;
    }
    if (credNewPassword && credNewPassword.length < 4) {
      setMessage({ type: 'error', text: 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে!' });
      return;
    }
    setUpdatingCredentials(true);
    try {
      const { error } = await supabase.rpc('admin_update_user_credentials', {
        p_user_id: credTargetUserId,
        p_new_username: credNewUsername || null,
        p_new_password: credNewPassword || null,
      });
      if (error) throw error;

      setMessage({ type: 'success', text: 'ক্রিডেনশিয়াল সফলভাবে আপডেট করা হয়েছে!' });
      setShowCredentialsModal(false);
      setCredTargetUserId(null);
      setCredNewUsername('');
      setCredNewPassword('');
      setCredConfirmPassword('');
      fetchRecords();
    } catch (err) {
      setMessage({ type: 'error', text: 'ক্রিডেনশিয়াল আপডেট করতে ব্যর্থ: ' + (err as Error).message });
    } finally {
      setUpdatingCredentials(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTargetUser) return;
    if (deleteTargetUser.role === 'admin') {
      setMessage({ type: 'error', text: 'অ্যাডমিন প্রোফাইল ডিলিট করা সম্ভব নয়!' });
      return;
    }
    setDeletingUser(true);
    try {
      const { error } = await supabase.rpc('delete_user_by_id', {
        p_user_id: deleteTargetUser.id,
      });
      if (error) throw error;

      setMessage({ type: 'success', text: `স্টাফ "${deleteTargetUser.full_name || deleteTargetUser.username}" সফলভাবে মুছে ফেলা হয়েছে!` });
      setShowDeleteUserModal(false);
      setDeleteTargetUser(null);
      setViewingStaffId(null);
      fetchRecords();
    } catch (err) {
      setMessage({ type: 'error', text: 'ইউজার মুছে ফেলতে ব্যর্থ: ' + (err as Error).message });
    } finally {
      setDeletingUser(false);
    }
  };


  // User submits revision for a revision-requested record
  const handleUserSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionRecord) return;
    setSubmitting(true);

    try {
      const isReserve = revisionLeaveType === 'Reserve';
      const isFullLeave = revisionLeaveType === 'Full Leave';

      // Determine if supervisor approval can be bypassed
      const bypassSupervisor = 
        profile?.needs_supervisor_approval === false ||
        profile?.role === 'admin' ||
        profile?.role === 'supervisor' ||
        profile?.job_role === 'IT Manager' ||
        profile?.job_role === 'IT Officer';

      const updates = {
        date: revisionDate,
        leave_type: revisionLeaveType,
        adjustment: isReserve ? false : revisionAdjustment,
        adjust_short_leave: (revisionLeaveType === 'Overtime' || revisionLeaveType === 'Reserve') && revisionAdjustment ? revisionAdjustShortLeave : false,
        sign_in_time: (isReserve || isFullLeave) ? null : revisionSignInTime,
        sign_out_time: (isReserve || isFullLeave) ? null : revisionSignOutTime,
        leave_hour: (isReserve || isFullLeave) ? null : `${revisionLeaveHour}:00`,
        reserve_holiday: isReserve ? revisionReserveHoliday : null,
        reserve_adjustment_status: isReserve ? (revisionAdjustment ? 'pending' : 'none') : 'none',
        comment: revisionComment || null,
        status: bypassSupervisor ? 'approved_by_supervisor' : 'pending_supervisor'
      };

      const { error } = await supabase
        .from('chuti')
        .update(updates)
        .eq('id', revisionRecord.id);

      if (error) throw error;

      // Trigger Web Push Notification to Supervisors and/or Admins for resubmission
      const targetRoles = bypassSupervisor ? ['admins'] : ['supervisors', 'admins'];
      sendPushNotification({
        userIds: targetRoles,
        title: 'সংশোধিত ছুটির আবেদন 🔔',
        body: `${profile?.full_name || profile?.username || 'স্টাফ'} ছুটির আবেদন সংশোধন করে পুনরায় পাঠিয়েছেন (${formatDate(revisionDate)})`,
        url: '/'
      }).catch(err => console.error('Error triggering push notification for revision:', err));

      fetchRecords();
      setShowUserRevisionModal(false);
      setMessage({ 
        type: 'success', 
        text: bypassSupervisor 
          ? 'সংশোধিত তথ্য অ্যাডমিনের কাছে পুনরায় পাঠানো হয়েছে।' 
          : 'সংশোধিত তথ্য সুপারভাইজারের কাছে পুনরায় পাঠানো হয়েছে।' 
      });
    } catch (err) {
      alert('রিভিশন সাবমিট করতে সমস্যা হয়েছে: ' + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper for computing summary statistics of an individual user
  const getUserSummaryStats = (userId: string) => {
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
  };


  // Excel/CSV Export helper for individual staff
  const handleExportIndividualCSV = (userId: string, recordsToExport?: ChutiRecord[], searchTerm?: string) => {
    const staffProfile = profilesList.find(p => p.id === userId) || (userId === sessionUser?.id ? profile : null);
    const finalRecords = recordsToExport || getFilteredRecordsForUser(userId);
    
    exportHelper.exportIndividualCSV(
      userId,
      finalRecords,
      staffProfile,
      sessionUser,
      profile,
      {
        selectedYear,
        filterType,
        filterStartDate,
        filterEndDate,
        searchTerm: searchTerm || '',
      },
      () => {},
      (msg) => {
        setMessage({ type: 'error', text: msg });
      }
    );
  };

  const handleExportIndividualExcel = (userId: string, recordsToExport?: ChutiRecord[], searchTerm?: string) => {
    const staffProfile = profilesList.find(p => p.id === userId) || (userId === sessionUser?.id ? profile : null);
    const finalRecords = recordsToExport || getFilteredRecordsForUser(userId);
    
    exportHelper.exportIndividualExcel(
      userId,
      finalRecords,
      staffProfile,
      sessionUser,
      profile,
      {
        selectedYear,
        filterType,
        filterStartDate,
        filterEndDate,
        searchTerm: searchTerm || '',
      },
      () => {},
      (msg) => {
        setMessage({ type: 'error', text: msg });
      }
    );
  };

  const handleExportSummaryCSV = () => {
    const staffProfiles = searchQuery.trim() 
      ? profilesList.filter(p => 
          (p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
          (p.username || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
      : profilesList;

    exportHelper.exportSummaryCSV(
      staffProfiles,
      getUserSummaryStats,
      {
        selectedYear,
        filterType,
        filterStartDate,
        filterEndDate,
        searchQuery,
      },
      () => {},
      (msg) => {
        setMessage({ type: 'error', text: msg });
      }
    );
  };

  const handleExportSummaryExcel = () => {
    const staffProfiles = searchQuery.trim() 
      ? profilesList.filter(p => 
          (p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
          (p.username || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
      : profilesList;

    exportHelper.exportSummaryExcel(
      staffProfiles,
      getUserSummaryStats,
      {
        selectedYear,
        filterType,
        filterStartDate,
        filterEndDate,
        searchQuery,
      },
      () => {},
      (msg) => {
        setMessage({ type: 'error', text: msg });
      }
    );
  };



  // 6. User Leave Calculations (Google Sheets logic match)
  // 6. User Leave Calculations (Google Sheets logic match)
  const calculateUserStats = () => {
    const list = getFilteredUserRecords();
    return calculateStats(list);
  };

  // User filter helper
  const getFilteredUserRecords = () => {
    return userRecords.filter(r => {
      // Filter by Selected Year
      if (selectedYear !== 'all' && r.date && r.date.substring(0, 4) !== selectedYear) return false;
      // Filter by Leave Type
      if (filterType !== 'all' && r.leave_type !== filterType) return false;
      // Filter by Date Range
      if (filterStartDate && r.date < filterStartDate) return false;
      if (filterEndDate && r.date > filterEndDate) return false;
      
      return true;
    });
  };

  // Helper to get filtered records for a specific user ID (used by CSV/Excel individual exports)
  const getFilteredRecordsForUser = (userId: string) => {
    const baseRecords = (profile?.role === 'admin' || (profile?.role === 'supervisor' && userId !== sessionUser?.id)) 
      ? adminRecords.filter(r => r.user_id === userId) 
      : userRecords;
      
    return baseRecords.filter(r => {
      // Filter by Selected Year
      if (selectedYear !== 'all' && r.date && r.date.substring(0, 4) !== selectedYear) return false;
      // Filter by Leave Type
      if (filterType !== 'all' && r.leave_type !== filterType) return false;
      // Filter by Date Range
      if (filterStartDate && r.date < filterStartDate) return false;
      if (filterEndDate && r.date > filterEndDate) return false;
      
      return true;
    });
  };



  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-slate-950">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500 mb-4" />
        <p className="text-slate-400 text-sm">লোডিং হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...</p>
      </div>
    );
  }

  const userStats = calculateUserStats();

  const groupPendingRequests = (requests: ChutiRecordWithProfile[]) => {
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
  };

  const pendingProfileRequests = profilesList.filter(p => p.profile_change_status === 'pending');
  const pendingReserveRequests = adminRecords.filter(r => 
    (r.leave_type === 'Reserve' && (r.status === 'approved_by_supervisor' || r.reserve_adjustment_status === 'pending')) ||
    (r.leave_type === 'Overtime' && r.status === 'approved_by_supervisor') ||
    (r.reserve_adjustment_status === 'pending')
  );
  const pendingChutiRequests = adminRecords.filter(r => r.status === 'approved_by_supervisor' && r.leave_type !== 'Reserve' && r.leave_type !== 'Overtime');
  const groupedChutiRequests = groupPendingRequests(pendingChutiRequests);
  const pendingSupervisorRequests = adminRecords.filter(r => r.status === 'pending_supervisor' && r.user_id !== sessionUser?.id);
  const groupedSupervisorRequests = groupPendingRequests(pendingSupervisorRequests);
  const userRevisionRequests = userRecords.filter(r => r.status === 'needs_review');
  const userNotificationsList = getUserNotifications();
  const unreadUserNotificationsCount = userNotificationsList.filter(
    n => !lastViewedTime || new Date(n.timestamp).getTime() > new Date(lastViewedTime).getTime()
  ).length;

  // Viewed staff member calculations (for individual view)
  const staffProfile = viewingStaffId ? profilesList.find(p => p.id === viewingStaffId) : null;
  const individualRecords = viewingStaffId ? adminRecords.filter(r => {
    if (r.user_id !== viewingStaffId) return false;
    if (selectedYear !== 'all' && r.date && r.date.substring(0, 4) !== selectedYear) return false;
    if (filterType !== 'all' && r.leave_type !== filterType) return false;
    if (filterStartDate && r.date < filterStartDate) return false;
    if (filterEndDate && r.date > filterEndDate) return false;
    return true;
  }) : [];

  const staffStats = calculateStats(individualRecords);
  const staffHours = staffStats.shortHours;
  const staffFull = staffStats.fullLeaves;
  const staffReserve = staffStats.reserveLeaves;
  const staffOvertimeHours = staffStats.overtimeHours;

  const renderStatusBadge = (r: ChutiRecord) => {
    if (r.leave_type === 'Reserve' && r.reserve_adjustment_status === 'pending') {
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 border border-slate-800 text-slate-400" title="Adjustment Pending">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block animate-pulse"></span>
        </span>
      );
    }
    if (r.status === 'approved') {
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-950/60 border border-emerald-950/80 text-emerald-400" title="Approved">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
        </span>
      );
    }
    if (r.status === 'approved_by_supervisor') {
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-950/60 border border-amber-950/80 text-amber-400" title="Supervisor Approved">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse"></span>
        </span>
      );
    }
    if (r.status === 'needs_review') {
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-950/60 border border-red-950/80 text-red-400" title="Revision Needed">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block animate-pulse"></span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 border border-slate-800 text-slate-400" title="Pending">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block animate-pulse"></span>
      </span>
    );
  };

  return (
    <div className="flex-1 min-h-screen flex flex-col bg-slate-950 relative overflow-hidden pb-12">
      {/* Glow backgrounds */}
      <div className="absolute top-[-20%] right-[-20%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-violet-900/10 blur-[120px] pointer-events-none" />

      {/* 1. Header Bar */}
      <header className="bg-slate-900/40 backdrop-blur-md border-b border-slate-900 px-4 py-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
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
              }}
              className="p-2.5 bg-blue-600/15 rounded-xl border border-blue-500/20 text-blue-400 hover:bg-blue-600/25 transition-all cursor-pointer"
              title="প্রোফাইল সেটিংস"
            >
              <User className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                স্বাগতম, {profile?.full_name || 'User'} ({profile?.username ? profile.username.toUpperCase() : ''})
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  profile?.role === 'admin'
                    ? 'bg-purple-950/60 border-purple-800 text-purple-300' 
                    : profile?.role === 'supervisor'
                    ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                    : 'bg-blue-950/60 border-blue-800 text-blue-300'
                }`}>
                  {profile?.job_role || (profile?.role === 'admin' ? 'Admin' : (profile?.role === 'supervisor' ? 'Supervisor' : 'Staff'))}
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">রোল-ভিত্তিক অফিস অ্যাটেনডেন্স অ্যান্ড লিভ ট্র্যাকার</p>
              {profile && (profile.role !== 'admin' || adminActiveTab === 'user') && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 flex items-center gap-1.5 shadow-sm">
                    <Clock className="h-3.5 w-3.5 text-blue-400" />
                    <span>কর্মঘণ্টা: <strong className="text-white">{formatWorkingHours(profile.working_hours || 9.5)}</strong></span>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 flex items-center gap-1.5 shadow-sm">
                    <Coffee className="h-3.5 w-3.5 text-amber-400" />
                    <span>ব্রেক টাইম: <strong className="text-white">{profile.break_time || 0} মিনিট</strong></span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Online/Offline Badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
              isOnline 
                ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-400' 
                : 'bg-amber-950/50 border-amber-800/80 text-amber-400'
            }`}>
              {isOnline ? (
                <>
                  <Wifi className="h-4 w-4" /> অনলাইন
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4" /> অফলাইন
                </>
              )}
            </div>

            {/* Offline Sync Area */}
            {offlineCount > 0 && (
              <button
                onClick={handleManualSync}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-500 text-xs font-semibold cursor-pointer shadow-lg shadow-amber-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all border border-amber-700"
              >
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                সিঙ্ক করুন ({offlineCount})
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 hover:text-white rounded-lg cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center justify-center"
              title={theme === 'dark' ? 'লাইট মোড অন করুন' : 'ডার্ক মোড অন করুন'}
            >
              {theme === 'dark' ? (
                <Sun className="h-4.5 w-4.5 text-amber-500" />
              ) : (
                <Moon className="h-4.5 w-4.5 text-indigo-400" />
              )}
            </button>

            {/* Notification Bell */}
            {profile && (
              <button
                onClick={() => {
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
                }}
                className="relative p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 hover:text-white rounded-lg cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-all"
                title="নোটিফিকেশন"
              >
                <Bell className="h-4.5 w-4.5" />
                {profile.role === 'supervisor' && (groupedSupervisorRequests.length + unreadUserNotificationsCount) > 0 && (
                  <span className="absolute top-[-4px] right-[-4px] flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                    {groupedSupervisorRequests.length + unreadUserNotificationsCount}
                  </span>
                )}
                {profile.role === 'admin' && adminActiveTab === 'admin' && (groupedChutiRequests.length + pendingReserveRequests.length + pendingProfileRequests.length) > 0 && (
                  <span className="absolute top-[-4px] right-[-4px] flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                    {groupedChutiRequests.length + pendingReserveRequests.length + pendingProfileRequests.length}
                  </span>
                )}
                {((profile.role === 'user') || (profile.role === 'admin' && adminActiveTab === 'user')) && unreadUserNotificationsCount > 0 && (
                  <span className="absolute top-[-4px] right-[-4px] flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                    {unreadUserNotificationsCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <LogOut className="h-4 w-4" /> লগআউট
            </button>
          </div>
        </div>
      </header>

      {/* Alert Messages */}
      {message && (
        <div className="max-w-7xl mx-auto px-4 mt-6 w-full z-10">
          <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-lg ${
            message.type === 'success' 
              ? 'bg-emerald-950/50 border-emerald-800/50 text-emerald-300' 
              : 'bg-red-950/50 border-red-800/50 text-red-300'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="text-sm">{message.text}</div>
          </div>
        </div>
      )}

      {/* 2. Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 w-full z-10 flex-1 flex flex-col gap-6">
        
        {/* ================= STAFF VIEW ================= */}
        {(profile?.role !== 'admin' || adminActiveTab === 'user') && (
          <div className="flex flex-col gap-6 w-full">


              
              <UserStats 
                stats={userStats}
                allowReserve={profile?.allow_reserve}
                allowOvertime={profile?.allow_overtime}
              />

              <UserRecordsTable 
                records={getFilteredUserRecords()}
                allowOvertime={profile?.allow_overtime}
                allowReserve={profile?.allow_reserve}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                availableYears={availableYears}
                filterType={filterType}
                setFilterType={setFilterType}
                filterStartDate={filterStartDate}
                setFilterStartDate={setFilterStartDate}
                filterEndDate={filterEndDate}
                setFilterEndDate={setFilterEndDate}
                onResetFilters={() => {
                  setFilterType('all');
                  setFilterStartDate('');
                  setFilterEndDate('');
                }}
                onExportCSV={(filtered, term) => handleExportIndividualCSV(sessionUser?.id || '', filtered, term)}
                onExportExcel={(filtered, term) => handleExportIndividualExcel(sessionUser?.id || '', filtered, term)}
                onAddLeaveClick={() => {
                  setComment('');
                  setReserveHoliday('');
                  setAdjustShortLeave(false);
                  const today = new Date();
                  const localDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
                  setDate(localDate);
                  setShowAddLeaveModal(true);
                }}
                onToggleAdjustment={handleToggleAdjustmentClick}
                onDeleteClick={triggerDeleteRecord}
                onRevisionClick={(r) => {
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
                }}
                formatDate={formatDate}
                formatTimeToAMPM={formatTimeToAMPM}
                getCleanComment={getCleanComment}
                renderStatusBadge={renderStatusBadge}
              />

          </div>
        )}

        {/* ================= ADMIN VIEW ================= */}
        {profile?.role === 'admin' && adminActiveTab === 'admin' && (
          <div className="flex flex-col gap-6">
            
            {/* Summary Cards */}
            {!viewingStaffId && (
              <div className="flex flex-wrap justify-center gap-4 w-full">
                {/* Card 1: Total Staff */}
                <div className="w-full max-w-xs bg-slate-900/40 border border-slate-900 rounded-2xl p-5 flex items-center gap-4">
                  <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400">সর্বমোট স্টাফ সংখ্যা</span>
                    <span className="block text-2xl font-bold text-white mt-0.5">{profilesList.length} জন</span>
                  </div>
                </div>
              </div>
            )}

            {/* Conditional Rendering: Individual Staff Profile Detail View OR Staff Master Database Table */}
            {viewingStaffId ? (
              <div className="flex flex-col gap-6">
                    {/* Individual Profile Top Box */}
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-900 shadow-2xl rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setViewingStaffId(null)}
                          className="p-2.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-700 transition-all cursor-pointer"
                          title="পিছনে যান"
                        >
                          <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                          <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {staffProfile?.full_name || 'Staff User'} ({staffProfile?.username ? staffProfile.username.toUpperCase() : ''})
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                              staffProfile?.role === 'admin'
                                ? 'bg-purple-950/60 border-purple-800 text-purple-300' 
                                : staffProfile?.role === 'supervisor'
                                ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                                : 'bg-blue-950/60 border-blue-800 text-blue-300'
                            }`}>
                              {staffProfile?.job_role || (staffProfile?.role === 'admin' ? 'Admin' : (staffProfile?.role === 'supervisor' ? 'Supervisor' : 'Staff'))}
                            </span>
                          </h2>
                          <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-400">
                            <div>কর্মঘণ্টা: <strong className="text-white">{formatWorkingHours(staffProfile?.working_hours || 9.5)}</strong></div>
                            <div>ব্রেক টাইম: <strong className="text-white">{staffProfile?.break_time || 0} মিনিট</strong></div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setCredTargetUserId(staffProfile?.id || null);
                            setCredNewUsername(staffProfile?.username || '');
                            setCredNewPassword('');
                            setShowCredentialsModal(true);
                          }}
                          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-md flex items-center gap-1.5"
                        >
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Change Password
                        </button>
                        <button
                          onClick={() => {
                            setEditingStaffProfileId(staffProfile?.id || null);
                            setEditUsername(staffProfile?.username || '');
                            setIsCodenameEditable(false);
                            setEditFullName(staffProfile?.full_name || '');
                            setEditWorkingHours(staffProfile?.working_hours ? Number(staffProfile.working_hours).toFixed(1) : '');
                            setProfileSignInTime(staffProfile?.default_sign_in || '');
                            setProfileSignOutTime(staffProfile?.default_sign_out || '');
                            setEditBreakTime(staffProfile?.break_time !== null && staffProfile?.break_time !== undefined ? String(staffProfile.break_time) : '');
                            setEditJobRole(staffProfile?.job_role || '');
                            setEditNeedsApproval(staffProfile?.needs_supervisor_approval !== false);
                            setEditAllowReserve(staffProfile?.allow_reserve === true);
                            setEditAllowOvertime(staffProfile?.allow_overtime === true);
                            setShowProfileSettingsModal(true);
                          }}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-md shadow-blue-900/10 border border-blue-700 flex items-center gap-1.5"
                        >
                          <Edit className="h-3.5 w-3.5" /> Edit Profile
                        </button>
                        {staffProfile?.role !== 'admin' && (
                          <button
                            onClick={() => {
                              setDeleteTargetUser(staffProfile || null);
                              setShowDeleteUserModal(true);
                            }}
                            className="px-3.5 py-2 bg-red-600/90 hover:bg-red-700 border border-red-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-md flex items-center gap-1.5"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete User
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stats for the viewed staff */}
                    <div className="flex flex-wrap justify-center gap-4 w-full">
                      <div className="flex-1 min-w-[220px] max-w-[280px] bg-slate-900/20 border border-slate-900/80 rounded-xl p-4 flex items-center gap-3">
                        <Clock className="h-5 w-5 text-blue-400" />
                        <div>
                          <span className="block text-[11px] text-slate-400">শর্ট লিভ (Unadjusted)</span>
                          <span className="block text-lg font-bold text-white font-mono">{staffHours} ঘণ্টা</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-[220px] max-w-[280px] bg-slate-900/20 border border-slate-900/80 rounded-xl p-4 flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-violet-400" />
                        <div>
                          <span className="block text-[11px] text-slate-400">ফুল লিভ (Unadjusted)</span>
                          <span className="block text-lg font-bold text-white">{staffFull} দিন</span>
                        </div>
                      </div>
                      {staffProfile?.allow_reserve && (
                        <div className="flex-1 min-w-[220px] max-w-[280px] bg-slate-900/20 border border-slate-900/80 rounded-xl p-4 flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-amber-400" />
                          <div>
                            <span className="block text-[11px] text-slate-400">রিজার্ভ ছুটি (Unadjusted)</span>
                            <span className="block text-lg font-bold text-white">{staffReserve} দিন</span>
                          </div>
                        </div>
                      )}
                      {staffProfile?.allow_overtime && (
                        <div className="flex-1 min-w-[220px] max-w-[280px] bg-slate-900/20 border border-slate-900/80 rounded-xl p-4 flex items-center gap-3">
                          <Clock className="h-5 w-5 text-emerald-400" />
                          <div>
                            <span className="block text-[11px] text-slate-400">ওভারটাইম (Unadjusted)</span>
                            <span className="block text-lg font-bold text-white font-mono">{staffOvertimeHours} ঘণ্টা</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Filtering Panel for viewed staff */}
                    <AdminRecordsTable 
                      records={individualRecords}
                      allowOvertime={staffProfile?.allow_overtime}
                      allowReserve={staffProfile?.allow_reserve}
                      filterType={filterType}
                      setFilterType={setFilterType}
                      filterStartDate={filterStartDate}
                      setFilterStartDate={setFilterStartDate}
                      filterEndDate={filterEndDate}
                      setFilterEndDate={setFilterEndDate}
                      onResetFilters={() => {
                        setFilterType('all');
                        setFilterStartDate('');
                        setFilterEndDate('');
                      }}
                      onExportCSV={(filtered, term) => handleExportIndividualCSV(viewingStaffId, filtered, term)}
                      onExportExcel={(filtered, term) => handleExportIndividualExcel(viewingStaffId, filtered, term)}
                      onToggleAdjustment={handleToggleAdjustmentClick}
                      onEditClick={(r) => {
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
                      }}
                      onDeleteClick={triggerDeleteRecord}
                      formatDate={formatDate}
                      formatTimeToAMPM={formatTimeToAMPM}
                      getCleanComment={getCleanComment}
                      renderStatusBadge={renderStatusBadge}
                      selectedYear={selectedYear}
                    />
                  </div>
                ) : (
              /* ================= STAFF MASTER DATABASE SUMMARY TABLE ================= */
              <StaffMasterTable 
                profilesList={profilesList}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                getUserSummaryStats={getUserSummaryStats}
                selectedYear={selectedYear}
                setSelectedYear={(val) => {
                  setSelectedYear(val);
                  sessionStorage.setItem('selectedYear', val);
                }}
                availableYears={availableYears}
                onAddStaffClick={() => setShowCreateUserModal(true)}
                onExportCSV={handleExportSummaryCSV}
                onExportExcel={handleExportSummaryExcel}
                onViewDetails={setViewingStaffId}
              />
            )}

          </div>
        )}

      </main>
      
      {/* Welcome & Profile Update Onboarding Popup */}
      {showWelcomePopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-955/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-sm p-6 relative overflow-hidden text-center">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-900/10 blur-[80px] pointer-events-none" />
            
            <div className="inline-flex p-3 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-2xl mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            
            <h3 className="text-lg font-bold text-white mb-2">আপনার প্রোফাইলে স্বাগতম! 🎉</h3>
            <p className="text-xs text-slate-350 leading-relaxed mb-4">
              পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।
            </p>
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-left text-xs text-slate-400 leading-relaxed space-y-2">
              <p className="font-semibold text-blue-400">💡 পরবর্তী করণীয়:</p>
              <p>১. আপনার মূল ড্যাশবোর্ডের বাম পাশে উপরে অবস্থিত <span className="font-bold text-white">প্রোফাইল সেটিংস</span> (গিয়ার/মানুষ আইকন) এ ক্লিক করুন।</p>
              <p>২. সেখানে আপনার প্রোফাইলের প্রয়োজনীয় তথ্য আপডেট করে নিন।</p>
            </div>
            
            <button
              onClick={() => setShowWelcomePopup(false)}
              className="mt-5 w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all border border-emerald-700 shadow-md"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}

      {/* First-Time Password Change & Setup Modal */}
      {showFirstTimePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/90 backdrop-blur-xl p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden my-8">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[80px] pointer-events-none" />
            
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-2xl mb-3">
                <Lock className="h-6 w-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white">পাসওয়ার্ড ও প্রোফাইল সেটআপ সম্পন্ন করুন</h3>
              <p className="text-xs text-slate-400 mt-1">প্রথমবার লগইন করার পর নিরাপত্তা পাসওয়ার্ড পরিবর্তন এবং আপনার প্রোফাইল তথ্য সেট করা আবশ্যক</p>
            </div>

            {firstTimePasswordError && (
              <div className="p-3 bg-red-950/50 border border-red-800/50 text-red-300 text-xs rounded-lg mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                <span>{firstTimePasswordError}</span>
              </div>
            )}

            <form onSubmit={handleFirstTimeSetupSubmit} className="space-y-4">
              <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-4">
                <div className="text-xs font-semibold text-blue-400 border-b border-slate-850 pb-1.5 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" /> পাসওয়ার্ড পরিবর্তন
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-450 uppercase tracking-wider">নতুন পাসওয়ার্ড (New Password)</label>
                  <input
                    type="password"
                    required
                    placeholder="কমপক্ষে ৬টি ক্যারেক্টার"
                    value={firstTimePassword}
                    onChange={(e) => setFirstTimePassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-450 uppercase tracking-wider">পাসওয়ার্ড নিশ্চিত করুন (Confirm Password)</label>
                  <input
                    type="password"
                    required
                    placeholder="পাসওয়ার্ডটি আবার লিখুন"
                    value={firstTimeConfirmPassword}
                    onChange={(e) => setFirstTimeConfirmPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {getPasswordMatchIndicator(firstTimePassword, firstTimeConfirmPassword)}
                </div>
              </div>

              {/* Render profile fields only if they are not Admin and profile setup is NOT completed */}
              {profile?.role !== 'admin' && !profile?.is_setup_completed && (
                <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-4 mt-2">
                  <div className="text-xs font-semibold text-purple-400 border-b border-slate-850 pb-1.5 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> প্রোফাইল তথ্য
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-455 uppercase tracking-wider">সম্পূর্ণ নাম (Full Name)</label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: Kamrul Islam"
                      value={firstTimeSetupFullName}
                      onChange={(e) => setFirstTimeSetupFullName(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-455 uppercase tracking-wider">জব রোল (Job Role)</label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: IT Officer"
                      value={firstTimeSetupJobRole}
                      onChange={(e) => setFirstTimeSetupJobRole(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-455 uppercase tracking-wider">দৈনিক কর্মঘণ্টা</label>
                      <select
                        required
                        value={firstTimeSetupWorkingHours}
                        onChange={(e) => setFirstTimeSetupWorkingHours(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="" disabled hidden>নির্বাচন করুন</option>
                        <option value="7.5">৭ ঘণ্টা ৩০ মিনিট</option>
                        <option value="8.0">৮ ঘণ্টা</option>
                        <option value="8.5">৮ ঘণ্টা ৩০ মিনিট</option>
                        <option value="9.0">৯ ঘণ্টা</option>
                        <option value="9.5">৯ ঘণ্টা ৩০ মিনিট</option>
                        <option value="10.0">১০ ঘণ্টা</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-455 uppercase tracking-wider">ব্রেক (মিনিট)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={firstTimeSetupBreakTime}
                        onChange={(e) => setFirstTimeSetupBreakTime(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-455 uppercase tracking-wider">ডিফল্ট সাইন-ইন টাইম</label>
                      <input
                        type="time"
                        required
                        value={firstTimeSetupSignInTime}
                        onChange={(e) => setFirstTimeSetupSignInTime(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-455 uppercase tracking-wider">ডিফল্ট সাইন-আউট টাইম</label>
                      <input
                        type="time"
                        required
                        value={firstTimeSetupSignOutTime}
                        onChange={(e) => setFirstTimeSetupSignOutTime(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={async () => {
                    if (sessionUser) {
                      localStorage.removeItem(`first_time_modal_start_time_${sessionUser.id}`);
                    }
                    await handleLogout();
                  }}
                  className="flex-1 flex justify-center py-2.5 px-4 border border-slate-800 rounded-lg text-sm font-semibold text-slate-400 hover:text-slate-350 bg-slate-950 hover:bg-slate-900 cursor-pointer transition-all"
                >
                  লগআউট করুন
                </button>
                <button
                  type="submit"
                  disabled={firstTimePasswordSubmitting || firstTimePassword !== firstTimeConfirmPassword || firstTimePassword.length < 4}
                  className="flex-1 flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                >
                  {firstTimePasswordSubmitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  {firstTimePasswordSubmitting ? 'সেটআপ সম্পন্ন হচ্ছে...' : 'সেটআপ সম্পন্ন করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* First Login Onboarding Modal */}
      {!profile?.is_setup_completed && profile?.role !== 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xl p-4">
          <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[80px] pointer-events-none" />
            
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-2xl mb-3">
                <User className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">প্রোফাইল সেটআপ সম্পন্ন করুন</h3>
              <p className="text-xs text-slate-400 mt-1">প্রথমবার ড্যাশবোর্ডে প্রবেশের আগে আপনার সঠিক নাম ও তথ্য সেট করুন</p>
            </div>

            {setupError && (
              <div className="p-3 bg-red-950/50 border border-red-800/50 text-red-300 text-xs rounded-lg mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                <span>{setupError}</span>
              </div>
            )}

            <form onSubmit={handleSetupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">সম্পূর্ণ নাম (Full Name)</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: কামরুল হাসান"
                  value={setupFullName}
                  onChange={(e) => setSetupFullName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">কোডনেম (Codename)</label>
                <input
                  type="text"
                  required
                  disabled
                  value={(setupUsername || '').toUpperCase()}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-slate-500 text-sm cursor-not-allowed opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">জব রোল (Job Role)</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: IT Officer"
                  value={setupJobRole}
                  onChange={(e) => setSetupJobRole(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">দৈনিক কর্মঘণ্টা</label>
                  <select
                    required
                    value={setupWorkingHours}
                    onChange={(e) => setSetupWorkingHours(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled hidden>নির্বাচন করুন</option>
                    <option value="7.5">৭ ঘণ্টা ৩০ মিনিট</option>
                    <option value="8.0">৮ ঘণ্টা</option>
                    <option value="8.5">৮ ঘণ্টা ৩০ মিনিট</option>
                    <option value="9.0">৯ ঘণ্টা</option>
                    <option value="9.5">৯ ঘণ্টা ৩০ মিনিট</option>
                    <option value="10.0">১০ ঘণ্টা</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">ব্রেক (মিনিট)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={setupBreakTime}
                    onChange={(e) => setSetupBreakTime(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">ডিফল্ট সাইন-ইন টাইম</label>
                  <input
                    type="time"
                    required
                    value={setupSignInTime}
                    onChange={(e) => setSetupSignInTime(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">ডিফল্ট সাইন-আউট টাইম</label>
                  <input
                    type="time"
                    required
                    value={setupSignOutTime}
                    onChange={(e) => setSetupSignOutTime(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={setupSubmitting}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 transition-all mt-6 flex items-center justify-center gap-1.5"
              >
                {setupSubmitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                {setupSubmitting ? 'সেটআপ সম্পন্ন হচ্ছে...' : 'সেটআপ সম্পন্ন করুন'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Profile Settings Modal */}
      {showProfileSettingsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-955/80 backdrop-blur-md p-4">
          <div className="flex min-h-full items-center justify-center">
            <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden my-8">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[80px] pointer-events-none" />
            
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" /> প্রোফাইল সেটিংস
              </h3>
              <button 
                onClick={() => {
                  setShowProfileSettingsModal(false);
                  setIsEditRequestMode(false);
                }}
                className="text-slate-450 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {profile?.profile_change_status === 'pending' && (
              <div className="p-3 bg-amber-950/50 border border-amber-800/50 text-amber-300 text-xs rounded-lg mb-4 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span>আপনার প্রোফাইল পরিবর্তনের অনুরোধটি বর্তমানে পেন্ডিং অবস্থায় আছে। অ্যাডমিনের অনুমোদনের জন্য অপেক্ষা করুন।</span>
              </div>
            )}

            <form onSubmit={handleUpdateSettings} className="space-y-4">
              {/* Web Push Notification Toggle */}
              {!editingStaffProfileId && (
                <div className="push-notification-banner flex items-center justify-between p-3 bg-blue-950/45 rounded-lg border border-blue-900/35 mb-4 shadow-inner">
                  <div>
                    <span className="block text-sm font-semibold text-white">ডেস্কটপ নোটিফিকেশন 🔔</span>
                    <span className="block text-[11px] text-slate-400">ছুটি আপডেট ও নতুন আবেদনের তাৎক্ষণিক অ্যালার্ট পান</span>
                  </div>
                  <button
                    type="button"
                    disabled={isPushLoading}
                    onClick={async () => {
                      if (!sessionUser || isPushLoading) return;
                      
                      const willSubscribe = !isPushSubscribed;
                      
                      // Optimistically update the UI toggle state immediately
                      setIsPushSubscribed(willSubscribe);
                      setIsPushLoading(true);
                      
                      try {
                        if (!willSubscribe) {
                          const success = await unsubscribeUserFromPush(sessionUser.id);
                          if (!success) {
                            // Revert state if failed
                            setIsPushSubscribed(true);
                          }
                        } else {
                          const success = await subscribeUserToPush(sessionUser.id);
                          if (!success) {
                            // Revert state if failed
                            setIsPushSubscribed(false);
                          }
                        }
                      } catch {
                        // Revert on error
                        setIsPushSubscribed(!willSubscribe);
                      } finally {
                        setIsPushLoading(false);
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isPushSubscribed ? 'bg-blue-600' : 'bg-slate-800'
                    } ${isPushLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isPushSubscribed ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )}
              {profile?.role === 'admin' && !editingStaffProfileId && (
                <div className="admin-mode-banner flex items-center justify-between p-3 bg-purple-950/45 rounded-lg border border-purple-900/35 mb-4 shadow-inner">
                  <div>
                    <span className="block text-sm font-semibold text-white">অ্যাডমিন মোড (Admin Mode)</span>
                    <span className="block text-[11px] text-slate-400">অন করলে অ্যাডমিন প্যানেল ও অ্যাপ্রুভাল ফিচার চালু হবে</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = adminActiveTab === 'admin' ? 'user' : 'admin';
                      setAdminActiveTab(nextVal);
                      setViewingStaffId(null);
                      if (sessionUser?.id) {
                        localStorage.setItem('admin_mode_' + sessionUser.id, nextVal);
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      adminActiveTab === 'admin' ? 'bg-purple-600' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        adminActiveTab === 'admin' ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">কোডনেম (Codename)</label>
                  {profile?.role === 'admin' && adminActiveTab === 'admin' && (
                    <button
                      type="button"
                      onClick={() => setIsCodenameEditable(!isCodenameEditable)}
                      className={`text-[10px] flex items-center gap-1 transition-colors px-2 py-0.5 rounded cursor-pointer ${
                        isCodenameEditable 
                          ? 'text-amber-400 bg-amber-950/40 hover:bg-amber-950/60 border border-amber-800/30' 
                          : 'text-blue-400 hover:text-blue-300 bg-blue-955/20 hover:bg-blue-950/40 border border-blue-900/20'
                      }`}
                      title={isCodenameEditable ? "এডিট মোড বন্ধ করুন" : "কোডনেম পরিবর্তন করুন"}
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>{isCodenameEditable ? 'লক করুন' : 'পরিবর্তন'}</span>
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  disabled={!isCodenameEditable}
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className={`mt-1 block w-full px-3 py-2 bg-slate-950 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono ${
                    isCodenameEditable
                      ? 'border-blue-500/50 text-white cursor-text opacity-100 ring-1 ring-blue-500/30'
                      : 'border-slate-850 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">সম্পূর্ণ নাম (Full Name)</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  disabled={(profile?.role !== 'admin' || adminActiveTab === 'user') && profile?.has_edited_profile && (!isEditRequestMode || profile?.profile_change_status === 'pending')}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">জব রোল (Job Role)</label>
                <input
                  type="text"
                  required
                  value={editJobRole}
                  onChange={(e) => setEditJobRole(e.target.value)}
                  disabled={(profile?.role !== 'admin' || adminActiveTab === 'user') && profile?.has_edited_profile && (!isEditRequestMode || profile?.profile_change_status === 'pending')}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">দৈনিক কর্মঘণ্টা</label>
                  <select
                    value={editWorkingHours}
                    onChange={(e) => setEditWorkingHours(e.target.value)}
                    disabled={(profile?.role !== 'admin' || adminActiveTab === 'user') && profile?.has_edited_profile && (!isEditRequestMode || profile?.profile_change_status === 'pending')}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="" disabled hidden>নির্বাচন করুন</option>
                    <option value="7.5">৭ ঘণ্টা ৩০ মিনিট</option>
                    <option value="8.0">৮ ঘণ্টা</option>
                    <option value="8.5">৮ ঘণ্টা ৩০ মিনিট</option>
                    <option value="9.0">৯ ঘণ্টা</option>
                    <option value="9.5">৯ ঘণ্টা ৩০ মিনিট</option>
                    <option value="10.0">১০ ঘণ্টা</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">ব্রেক (মিনিট)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editBreakTime}
                    onChange={(e) => setEditBreakTime(e.target.value)}
                    disabled={(profile?.role !== 'admin' || adminActiveTab === 'user') && profile?.has_edited_profile && (!isEditRequestMode || profile?.profile_change_status === 'pending')}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">ডিফল্ট সাইন-ইন টাইম</label>
                  <input
                    type="time"
                    required
                    value={profileSignInTime}
                    onChange={(e) => setProfileSignInTime(e.target.value)}
                    disabled={(profile?.role !== 'admin' || adminActiveTab === 'user') && profile?.has_edited_profile && (!isEditRequestMode || profile?.profile_change_status === 'pending')}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">ডিফল্ট সাইন-আউট টাইম</label>
                  <input
                    type="time"
                    required
                    value={profileSignOutTime}
                    onChange={(e) => setProfileSignOutTime(e.target.value)}
                    disabled={(profile?.role !== 'admin' || adminActiveTab === 'user') && profile?.has_edited_profile && (!isEditRequestMode || profile?.profile_change_status === 'pending')}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Needs Supervisor Approval Toggle (Admin only) */}
              {profile?.role === 'admin' && adminActiveTab === 'admin' && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="block text-sm font-medium text-white font-semibold">Supervisor Approval?</span>
                      <span className="block text-[11px] text-slate-400">Yes দিলে ছুটির জন্য সুপারভাইজার অ্যাপ্রুভাল লাগবে</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditNeedsApproval(!editNeedsApproval)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-205 ease-in-out focus:outline-none ${
                        editNeedsApproval ? 'bg-blue-600' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          editNeedsApproval ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="block text-sm font-medium text-white font-semibold">Reserve Holiday?</span>
                      <span className="block text-[11px] text-slate-400">Yes দিলে রিজার্ভ ছুটির ক্যাটাগরি চালু হবে</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditAllowReserve(!editAllowReserve)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-205 ease-in-out focus:outline-none ${
                        editAllowReserve ? 'bg-blue-600' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          editAllowReserve ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="block text-sm font-medium text-white font-semibold">Overtime?</span>
                      <span className="block text-[11px] text-slate-400">Yes দিলে ওভারটাইমের ক্যাটাগরি চালু হবে</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditAllowOvertime(!editAllowOvertime)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-205 ease-in-out focus:outline-none ${
                        editAllowOvertime ? 'bg-blue-600' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          editAllowOvertime ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {(profile?.role !== 'admin' || adminActiveTab === 'user') && profile?.has_edited_profile && !isEditRequestMode && profile?.profile_change_status !== 'pending' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditRequestMode(true);
                    setEditFullName(profile?.full_name || '');
                    setEditWorkingHours(Number(profile?.working_hours || 9.5).toFixed(1));
                    setEditBreakTime(String(profile?.break_time || 0));
                    setEditJobRole(profile?.job_role || '');
                  }}
                  className="w-full flex justify-center py-2 px-4 border border-blue-500/30 rounded-lg shadow-sm text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-950/20 hover:bg-blue-950/40 cursor-pointer transition-all mt-4"
                >
                  প্রোফাইল পরিবর্তনের অনুরোধ পাঠান
                </button>
              )}

              {((profile?.role === 'admin' && adminActiveTab === 'admin') || !profile?.has_edited_profile || (isEditRequestMode && profile?.profile_change_status !== 'pending')) && (
                <div className="flex gap-3 mt-6">
                  {((profile?.role !== 'admin' || adminActiveTab === 'user') && profile?.has_edited_profile) && (
                    <button
                      type="button"
                      onClick={() => setIsEditRequestMode(false)}
                      className="flex-1 flex justify-center py-2 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 cursor-pointer transition-all"
                    >
                      বাতিল
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={setupSubmitting}
                    className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                  >
                    {setupSubmitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                    {setupSubmitting ? 'সেভ হচ্ছে...' : (((profile?.role === 'admin' && adminActiveTab === 'admin') || !profile?.has_edited_profile) ? 'সেটিংস সেভ করুন' : 'অনুরোধ সাবমিট করুন')}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
      )}

      {/* Admin Leave Approvals Modal */}
      {showLeaveApprovalModal && profile?.role === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-amber-900/10 blur-[80px] pointer-events-none" />
            
            <div className="flex justify-between items-center border-b border-slate-800/80 p-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-400 font-semibold" /> নোটিফিকেশন প্যানেল (Admin)
              </h3>
              <button 
                onClick={() => setShowLeaveApprovalModal(false)}
                className="text-slate-450 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-amber-400">💡 তথ্য সংশোধনের নিয়মাবলী:</p>
                <p>সুপারভাইজার বা অ্যাডমিন সরাসরি ছুটির অনুরোধ প্রত্যাখ্যান (Reject) করতে পারবেন না। তথ্যে ভুল বা সংশোধন প্রয়োজন হলে <strong>'রিভিশন পাঠান (Needs Review)'</strong> বাটনে ক্লিক করে ইউজারের কাছে সংশোধনের জন্য পাঠানো যাবে। ইউজার তথ্য সংশোধন করে পুনরায় সাবমিট করলে তা পুনরায় সুপারভাইজারের অনুমোদন হয়ে অ্যাডমিনের কাছে আসবে।</p>
              </div>
              {/* Section 1: Leave Approvals */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> ছুটির অনুরোধসমূহ (Pending Admin Approval)
                </h4>
                {groupedChutiRequests.length === 0 ? (
                  <div className="text-center py-6 bg-slate-950/40 border border-slate-850 rounded-xl text-slate-500 text-xs">
                    অনুমোদনের জন্য কোনো পেন্ডিং ছুটি নেই।
                  </div>
                ) : (
                  <div className="space-y-3">
                    {groupedChutiRequests.map(r => {
                      const user = profilesList.find(p => p.id === r.user_id);
                      return (
                        <div key={r.id} className="bg-slate-950/60 border border-slate-850 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4">
                          <div className="space-y-1 text-xs text-slate-350">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{user?.full_name || 'নাম নেই'}</span>
                              <span className="text-[10px] px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded text-slate-400 font-mono">@{(user?.username || '').toUpperCase()}</span>
                            </div>
                            <p><span className="text-slate-500">তারিখ:</span> <span className="font-semibold text-slate-200">{r.is_bulk ? r.formatted_bulk_dates : formatDate(r.date)}</span></p>
                            <p><span className="text-slate-500">ছুটির ধরন:</span> <span className="font-bold text-blue-400">{r.leave_type}</span></p>
                            {r.leave_type !== 'Reserve' && r.leave_type !== 'Full Leave' && (
                              <p><span className="text-slate-500">সময় ও ঘণ্টা:</span> <span className="font-mono text-slate-300">{formatTimeToAMPM(r.sign_in_time)} - {formatTimeToAMPM(r.sign_out_time)} ({r.leave_hour ? r.leave_hour.substring(0, 5) : '-'} ঘণ্টা)</span></p>
                            )}
                            {r.leave_type === 'Reserve' && (
                              <p><span className="text-slate-500">রিজার্ভ ছুটির দিন:</span> <span className="text-slate-200">{r.reserve_holiday || '-'}</span></p>
                            )}
                            <p>
                              <span className="text-slate-500">সমন্বয় (Adjustment):</span>{' '}
                              <span className={`font-semibold ${r.adjustment ? 'text-blue-400 font-bold' : r.adjusted_hour ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}>
                                {r.adjustment ? 'হ্যাঁ' : r.adjusted_hour ? `আংশিক (${r.adjusted_hour.toString().split('.')[0].substring(0, 5)} ঘণ্টা)` : 'না'}
                              </span>
                            </p>
                            {r.leave_type === 'Overtime' && (
                              <p>
                                <span className="text-slate-500">শর্ট লিভ থেকে সমন্বয় (Short Leave Adj):</span>{' '}
                                <span className={`font-semibold ${r.adjust_short_leave ? 'text-blue-400 font-bold' : 'text-slate-400'}`}>
                                  {r.adjust_short_leave ? 'হ্যাঁ' : 'না'}
                                </span>
                              </p>
                            )}
                            <p><span className="text-slate-500">কারণ/মন্তব্য:</span> <span className="italic text-slate-300">{r.comment || '-'}</span></p>
                          </div>

                          <div className="flex md:flex-col justify-end items-end gap-2 shrink-0">
                            <button
                              onClick={() => handleApproveChutiRequest(r.id, false)}
                              disabled={reviewingIds.has(r.id) || approvedIds.has(r.id)}
                              className="px-3 py-1.5 border border-amber-500/30 hover:border-amber-500 bg-amber-950/20 hover:bg-amber-950/50 text-amber-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                              {reviewingIds.has(r.id) && (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              )}
                              {reviewingIds.has(r.id) ? 'রিভিশন পাঠানো হচ্ছে...' : 'রিভিশন পাঠান (Needs Review)'}
                            </button>
                            <button
                              onClick={() => handleApproveChutiRequest(r.id, true)}
                              disabled={approvingIds.has(r.id) || approvedIds.has(r.id)}
                              className="px-3 py-1.5 border border-emerald-500/30 hover:border-emerald-500 bg-emerald-950/20 hover:bg-emerald-950/50 text-emerald-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-80 flex items-center gap-1.5"
                            >
                              {approvingIds.has(r.id) && (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              )}
                              {approvedIds.has(r.id) && (
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                              )}
                              {approvedIds.has(r.id) ? 'অনুমোদিত' : approvingIds.has(r.id) ? 'অনুমোদন হচ্ছে...' : 'অনুমোদন করুন (Approve)'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section 2: Reserve & Overtime Adjustments */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> রিজার্ভ, ওভারটাইম ও সমন্বয় অনুরোধসমূহ (Pending Requests & Adjustments)
                </h4>
                {pendingReserveRequests.length === 0 ? (
                  <div className="text-center py-6 bg-slate-950/40 border border-slate-850 rounded-xl text-slate-500 text-xs">
                    কোনো পেন্ডিং রিজার্ভ, ওভারটাইম বা সমন্বয় অনুরোধ নেই।
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingReserveRequests.map(r => {
                      const user = profilesList.find(p => p.id === r.user_id);
                      const isAdjustmentRequest = r.reserve_adjustment_status === 'pending';
                      return (
                        <div key={r.id} className="bg-slate-950/60 border border-slate-850 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4">
                          <div className="space-y-1 text-xs text-slate-350">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{user?.full_name || 'নাম নেই'}</span>
                              <span className="text-[10px] px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded text-slate-400 font-mono font-bold">@{(user?.username || '').toUpperCase()}</span>
                            </div>
                            <p><span className="text-slate-500">তারিখ:</span> <span className="font-semibold text-slate-200">{formatDate(r.date)}</span></p>
                            <p>
                              <span className="text-slate-500">ছুটির ধরন:</span>{' '}
                              <span className={`font-bold ${r.leave_type === 'Reserve' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                {r.leave_type}
                              </span>
                            </p>
                            
                            {r.leave_type === 'Reserve' && (
                              <p><span className="text-slate-500">রিজার্ভ ছুটির দিন:</span> <span className="font-semibold text-slate-200">{r.reserve_holiday || '-'}</span></p>
                            )}

                            {(r.leave_type === 'Overtime' || r.leave_type === 'Short Leave') && (
                              <p><span className="text-slate-500">সময় ও ঘণ্টা:</span> <span className="font-mono text-slate-300">{formatTimeToAMPM(r.sign_in_time)} - {formatTimeToAMPM(r.sign_out_time)} ({r.leave_hour ? r.leave_hour.substring(0, 5) : '-'} ঘণ্টা)</span></p>
                            )}

                            <p>
                              <span className="text-slate-500">সমন্বয় (Adjustment):</span>{' '}
                              <span className={`font-semibold ${(r.adjustment || isAdjustmentRequest) ? 'text-blue-400 font-bold' : 'text-slate-400'}`}>
                                {(r.adjustment || isAdjustmentRequest) ? 'হ্যাঁ' : 'না'}
                              </span>
                            </p>

                            {r.leave_type === 'Overtime' && (
                              <p>
                                <span className="text-slate-500">শর্ট লিভ থেকে সমন্বয় (Short Leave Adj):</span>{' '}
                                <span className={`font-semibold ${r.adjust_short_leave ? 'text-blue-400 font-bold' : 'text-slate-400'}`}>
                                  {r.adjust_short_leave ? 'হ্যাঁ' : 'না'}
                                </span>
                              </p>
                            )}

                            {isAdjustmentRequest && r.admin_edit_request && (
                              <div className="mt-1.5 p-2 bg-blue-950/40 border border-blue-900/40 rounded-lg text-blue-300 text-xs flex flex-col gap-0.5">
                                <div>
                                  <span className="font-bold text-white">অনুরোধকৃত সমন্বয়:</span>{' '}
                                  {r.admin_edit_request.adjusted_hour ? (
                                    <span className="font-semibold text-cyan-400">আংশিক সমন্বয় ({r.admin_edit_request.adjusted_hour.substring(0, 5)} ঘণ্টা)</span>
                                  ) : r.admin_edit_request.adjustment === false ? (
                                    <span className="font-semibold text-rose-400 font-bold">সমন্বয় বাতিল</span>
                                  ) : (
                                    <span className="font-semibold text-blue-400">পূর্ণ সমন্বয়</span>
                                  )}
                                  {r.admin_edit_request.adjust_short_leave && (
                                    <span className="text-emerald-400"> (শর্ট লিভ থেকে সমন্বয়)</span>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            <p><span className="text-slate-500">কারণ/মন্তব্য:</span> <span className="italic text-slate-300">{r.comment || '-'}</span></p>
                          </div>

                          <div className="flex md:flex-col justify-end items-end gap-2 shrink-0">
                            {isAdjustmentRequest ? (
                              <>
                                <button
                                  onClick={() => handleApproveReserveAdjustment(r, false)}
                                  disabled={approvingIds.has(r.id) || approvedIds.has(r.id)}
                                  className="px-3 py-1.5 border border-red-500/30 hover:border-red-500 bg-red-950/20 hover:bg-red-950/50 text-red-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  প্রত্যাখ্যান (Reject)
                                </button>
                                <button
                                  onClick={() => handleApproveReserveAdjustment(r, true)}
                                  disabled={approvingIds.has(r.id) || approvedIds.has(r.id)}
                                  className="px-3 py-1.5 border border-emerald-500/30 hover:border-emerald-500 bg-emerald-950/20 hover:bg-emerald-950/50 text-emerald-450 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-80 flex items-center gap-1.5"
                                >
                                  {approvingIds.has(r.id) && (
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                  )}
                                  {approvedIds.has(r.id) && (
                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                                  )}
                                  {approvedIds.has(r.id) ? 'অনুমোদিত' : approvingIds.has(r.id) ? 'অনুমোদন হচ্ছে...' : 'অনুমোদন (Approve)'}
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleApproveChutiRequest(r.id, false)}
                                  disabled={reviewingIds.has(r.id) || approvedIds.has(r.id)}
                                  className="px-3 py-1.5 border border-amber-500/30 hover:border-amber-500 bg-amber-950/20 hover:bg-amber-950/50 text-amber-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                                >
                                  {reviewingIds.has(r.id) && (
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                  )}
                                  {reviewingIds.has(r.id) ? 'রিভিশন পাঠানো হচ্ছে...' : 'রিভিশন পাঠান (Needs Review)'}
                                </button>
                                <button
                                  onClick={() => handleApproveChutiRequest(r.id, true)}
                                  disabled={approvingIds.has(r.id) || approvedIds.has(r.id)}
                                  className="px-3 py-1.5 border border-emerald-500/30 hover:border-emerald-500 bg-emerald-950/20 hover:bg-emerald-950/50 text-emerald-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-80 flex items-center gap-1.5"
                                >
                                  {approvingIds.has(r.id) && (
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                  )}
                                  {approvedIds.has(r.id) && (
                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                                  )}
                                  {approvedIds.has(r.id) ? 'অনুমোদিত' : approvingIds.has(r.id) ? 'অনুমোদন হচ্ছে...' : 'অনুমোদন করুন (Approve)'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section 3: Profile Approvals */}
              <div className="border-t border-slate-800/60 pt-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> প্রোফাইল পরিবর্তন অনুরোধসমূহ (Pending Profile Updates)
                </h4>
                {pendingProfileRequests.length === 0 ? (
                  <div className="text-center py-6 bg-slate-950/40 border border-slate-850 rounded-xl text-slate-500 text-xs">
                    কোনো পেন্ডিং প্রোফাইল পরিবর্তনের অনুরোধ নেই।
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingProfileRequests.map(p => (
                      <div key={p.id} className="bg-slate-950/60 border border-slate-850 rounded-xl p-4 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-bold text-white flex items-center gap-2">
                              <span>{p.full_name || 'নাম নেই'}</span>
                              <span className="text-[10px] px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded text-slate-400 font-mono">@{(p.username || '').toUpperCase()}</span>
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">রোল: {p.job_role || '-'}</p>
                          </div>
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-950 border border-amber-800 text-amber-400">
                            Pending
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                          {/* Comparison Columns */}
                          <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-850">
                            <span className="block font-bold text-slate-400 mb-1.5 border-b border-slate-800 pb-1 font-semibold">বর্তমান তথ্য</span>
                            <div className="space-y-1 text-slate-350">
                              <p><span className="text-slate-500">নাম:</span> {p.full_name || '-'}</p>
                              <p><span className="text-slate-500">জব রোল:</span> {p.job_role || '-'}</p>
                              <p><span className="text-slate-500">কর্মঘণ্টা:</span> {p.working_hours} ঘণ্টা</p>
                              <p><span className="text-slate-500">ব্রেক টাইম:</span> {p.break_time} মিনিট</p>
                              <p><span className="text-slate-500">সাইন-ইন টাইম:</span> {formatTimeToAMPM(p.default_sign_in || null) || '-'}</p>
                              <p><span className="text-slate-500">সাইন-আউট টাইম:</span> {formatTimeToAMPM(p.default_sign_out || null) || '-'}</p>
                            </div>
                          </div>

                          <div className="bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-900/30">
                            <span className="block font-bold text-indigo-400 mb-1.5 border-b border-indigo-900/30 pb-1 font-semibold">অনুরোধকৃত নতুন তথ্য</span>
                            <div className="space-y-1 text-slate-200 font-medium">
                              <p className={p.requested_full_name && p.requested_full_name !== p.full_name ? 'text-indigo-300 font-bold' : ''}>
                                <span className="text-slate-500">নাম:</span> {p.requested_full_name || p.full_name || '-'}
                              </p>
                              <p className={p.requested_job_role && p.requested_job_role !== p.job_role ? 'text-indigo-300 font-bold' : ''}>
                                <span className="text-slate-500">জব রোল:</span> {p.requested_job_role || p.job_role || '-'}
                              </p>
                              <p className={p.requested_working_hours && p.requested_working_hours !== p.working_hours ? 'text-indigo-300 font-bold' : ''}>
                                <span className="text-slate-500">কর্মঘণ্টা:</span> {p.requested_working_hours || p.working_hours} ঘণ্টা
                              </p>
                              <p className={p.requested_break_time && p.requested_break_time !== p.break_time ? 'text-indigo-300 font-bold' : ''}>
                                <span className="text-slate-500">ব্রেক টাইম:</span> {p.requested_break_time || p.break_time} মিনিট
                              </p>
                              <p className={p.requested_default_sign_in && p.requested_default_sign_in !== p.default_sign_in ? 'text-indigo-300 font-bold' : ''}>
                                <span className="text-slate-500">সাইন-ইন টাইম:</span> {formatTimeToAMPM(p.requested_default_sign_in || p.default_sign_in || null) || '-'}
                              </p>
                              <p className={p.requested_default_sign_out && p.requested_default_sign_out !== p.default_sign_out ? 'text-indigo-300 font-bold' : ''}>
                                <span className="text-slate-500">সাইন-আউট টাইম:</span> {formatTimeToAMPM(p.requested_default_sign_out || p.default_sign_out || null) || '-'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => handleApproveProfileChangeRequest(p.id, false)}
                            disabled={approvingIds.has(p.id) || approvedIds.has(p.id)}
                            className="px-3 py-1.5 border border-red-500/30 hover:border-red-500 bg-red-950/20 hover:bg-red-950/50 text-red-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            প্রত্যাখ্যান (Reject)
                          </button>
                          <button
                            onClick={() => handleApproveProfileChangeRequest(p.id, true)}
                            disabled={approvingIds.has(p.id) || approvedIds.has(p.id)}
                            className="px-3 py-1.5 border border-emerald-500/30 hover:border-emerald-500 bg-emerald-950/20 hover:bg-emerald-950/50 text-emerald-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-80 flex items-center gap-1.5"
                          >
                            {approvingIds.has(p.id) && (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            )}
                            {approvedIds.has(p.id) && (
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                            )}
                            {approvedIds.has(p.id) ? 'অনুমোদিত' : approvingIds.has(p.id) ? 'অনুমোদন হচ্ছে...' : 'অনুমোদন করুন (Approve)'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supervisor Leave Approvals Modal */}
      {showSupervisorApprovalModal && profile?.role === 'supervisor' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-900/10 blur-[80px] pointer-events-none" />
            
            <div className="flex justify-between items-center border-b border-slate-800/80 p-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-indigo-400 animate-pulse" /> পেন্ডিং ভেরিফিকেশন প্যানেল (Supervisor)
              </h3>
              <button 
                onClick={() => setShowSupervisorApprovalModal(false)}
                className="text-slate-450 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-amber-400">💡 তথ্য সংশোধনের নিয়মাবলী:</p>
                <p>সুপারভাইজার সরাসরি ছুটির অনুরোধ প্রত্যাখ্যান (Reject) করতে পারবেন না। কোনো সংশোধন প্রয়োজন হলে <strong>'রিভিশন পাঠান (Needs Review)'</strong> বাটনে ক্লিক করে ইউজারের কাছে সংশোধনের জন্য পাঠানো যাবে। ইউজার তথ্য সংশোধন করে পুনরায় সাবমিট করলে তা পুনরায় আপনার কাছে অনুমোদনের জন্য আসবে।</p>
              </div>
              {groupedSupervisorRequests.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  ভেরিফিকেশনের জন্য কোনো পেন্ডিং ছুটি নেই।
                </div>
              ) : (
                groupedSupervisorRequests.map(r => {
                  const user = profilesList.find(p => p.id === r.user_id);
                  return (
                    <div key={r.id} className="bg-slate-950/60 border border-slate-850 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4">
                      <div className="space-y-1 text-xs text-slate-350">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{user?.full_name || 'নাম নেই'}</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded text-slate-400 font-mono">@{(user?.username || '').toUpperCase()}</span>
                        </div>
                        <p><span className="text-slate-500">তারিখ:</span> <span className="font-semibold text-slate-200">{r.is_bulk ? r.formatted_bulk_dates : formatDate(r.date)}</span></p>
                        <p><span className="text-slate-500">ছুটির ধরন:</span> <span className="font-bold text-blue-400">{r.leave_type}</span></p>
                        {r.leave_type !== 'Reserve' && r.leave_type !== 'Full Leave' && (
                          <p><span className="text-slate-500">সময় ও ঘণ্টা:</span> <span className="font-mono text-slate-300">{formatTimeToAMPM(r.sign_in_time)} - {formatTimeToAMPM(r.sign_out_time)} ({r.leave_hour ? r.leave_hour.substring(0, 5) : '-'} ঘণ্টা)</span></p>
                        )}
                        {r.leave_type === 'Reserve' && (
                          <p><span className="text-slate-500">রিজার্ভ ছুটির দিন:</span> <span className="text-slate-200">{r.reserve_holiday || '-'}</span></p>
                        )}
                        <p>
                          <span className="text-slate-500">সমন্বয় (Adjustment):</span>{' '}
                          <span className={`font-semibold ${r.adjustment ? 'text-blue-400 font-bold' : r.adjusted_hour ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}>
                            {r.adjustment ? 'হ্যাঁ' : r.adjusted_hour ? `আংশিক (${r.adjusted_hour.toString().split('.')[0].substring(0, 5)} ঘণ্টা)` : 'না'}
                          </span>
                        </p>
                        {r.leave_type === 'Overtime' && (
                          <p>
                            <span className="text-slate-500">শর্ট লিভ থেকে সমন্বয় (Short Leave Adj):</span>{' '}
                            <span className={`font-semibold ${r.adjust_short_leave ? 'text-blue-400 font-bold' : 'text-slate-400'}`}>
                              {r.adjust_short_leave ? 'হ্যাঁ' : 'না'}
                            </span>
                          </p>
                        )}
                        <p><span className="text-slate-500">কারণ/মন্তব্য:</span> <span className="italic text-slate-300">{r.comment || '-'}</span></p>
                      </div>

                      <div className="flex md:flex-col justify-end items-end gap-2 shrink-0">
                        <button
                          onClick={() => handleSupervisorApproveChuti(r.id, false)}
                          disabled={reviewingIds.has(r.id) || approvedIds.has(r.id)}
                          className="px-3 py-1.5 border border-amber-500/30 hover:border-amber-500 bg-amber-955/20 hover:bg-amber-955/50 text-amber-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                          {reviewingIds.has(r.id) && (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          )}
                          {reviewingIds.has(r.id) ? 'রিভিশন পাঠানো হচ্ছে...' : 'রিভিশন পাঠান (Needs Review)'}
                        </button>
                        <button
                          onClick={() => handleSupervisorApproveChuti(r.id, true)}
                          disabled={approvingIds.has(r.id) || approvedIds.has(r.id)}
                          className="px-3 py-1.5 border border-emerald-500/30 hover:border-emerald-500 bg-emerald-950/20 hover:bg-emerald-950/50 text-emerald-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-80 flex items-center gap-1.5"
                        >
                          {approvingIds.has(r.id) && (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          )}
                          {approvedIds.has(r.id) && (
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                          )}
                          {approvedIds.has(r.id) ? 'অনুমোদিত' : approvingIds.has(r.id) ? 'অনুমোদন হচ্ছে...' : 'অনুমোদন করুন (Approve)'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Edit Modal */}
      {showAdminEditModal && profile?.role === 'admin' && adminEditRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[80px] pointer-events-none" />
            
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-500" /> ছুটির তথ্য সংশোধন (Admin Edit)
              </h3>
              <button 
                onClick={() => setShowAdminEditModal(false)}
                className="text-slate-450 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdminSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">তারিখ</label>
                <div className="mt-1">
                  <DateInput
                    required
                    value={adminEditDate}
                    onChange={setAdminEditDate}
                    className="bg-slate-955 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">ছুটির ধরন</label>
                <select
                  value={adminEditLeaveType}
                  onChange={(e) => setAdminEditLeaveType(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Short Leave">Short Leave</option>
                  <option value="Full Leave">Full Leave</option>
                  {(profilesList.find(p => p.id === adminEditRecord?.user_id)?.allow_overtime || adminEditLeaveType === 'Overtime') && <option value="Overtime">Overtime</option>}
                  {(profilesList.find(p => p.id === adminEditRecord?.user_id)?.allow_reserve || adminEditLeaveType === 'Reserve') && <option value="Reserve">Reserve</option>}
                </select>
              </div>

              {adminEditLeaveType !== 'Reserve' && adminEditLeaveType !== 'Full Leave' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">শুরুর সময়</label>
                      <input
                        type="time"
                        required
                        value={adminEditSignInTime}
                        onChange={(e) => setAdminEditSignInTime(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">শেষের সময়</label>
                      <input
                        type="time"
                        required
                        value={adminEditSignOutTime}
                        onChange={(e) => setAdminEditSignOutTime(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">মোট লিভ সময়</label>
                      <input
                        type="text"
                        required
                        placeholder="যেমন: 02:30"
                        value={adminEditLeaveHour}
                        onChange={(e) => setAdminEditLeaveHour(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-slate-955/60 rounded-lg border border-slate-800/80">
                      <div>
                        <span className="block text-xs font-medium text-white font-semibold">অ্যাডজাস্টমেন্ট (Adjustment)</span>
                        <span className="block text-[10px] text-slate-400">Yes দিলে মোট ছুটিতে যোগ হবে না</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newAdj = !adminEditAdjustment;
                          setAdminEditAdjustment(newAdj);
                          if (!newAdj) {
                            setAdminEditAdjustShortLeave(false);
                          }
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          adminEditAdjustment ? 'bg-blue-600' : 'bg-slate-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            adminEditAdjustment ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {adminEditLeaveType === 'Overtime' && adminEditAdjustment && (
                      <div className="flex items-center justify-between p-3 bg-slate-955/60 rounded-lg border border-slate-800/80 font-sans">
                        <div>
                          <span className="block text-xs font-medium text-white font-semibold">Adjust with Short Leave?</span>
                          <span className="block text-[10px] text-slate-400">Yes দিলে শর্ট লিভ থেকে বিয়োগ হবে</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAdminEditAdjustShortLeave(!adminEditAdjustShortLeave)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            adminEditAdjustShortLeave ? 'bg-emerald-600' : 'bg-slate-800'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              adminEditAdjustShortLeave ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {adminEditLeaveType === 'Reserve' && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">রিজার্ভ ছুটির দিন (Reserve Holiday)</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: শবে বরাত"
                    value={adminEditReserveHoliday}
                    onChange={(e) => setAdminEditReserveHoliday(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">মন্তব্য/কারণ</label>
                <textarea
                  placeholder="পরিবর্তনের কারণ..."
                  value={adminEditComment}
                  onChange={(e) => setAdminEditComment(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdminEditModal(false)}
                  className="flex-1 flex justify-center py-2 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 cursor-pointer transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                >
                  {submitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  {submitting ? 'সেভ হচ্ছে...' : 'অনুরোধ পাঠান'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Revision Prompt Modal */}
      {showRevisionPromptModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-955/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-amber-900/10 blur-[80px] pointer-events-none" />
            
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" /> রিভিশনে পাঠানোর কারণ
              </h3>
              <button 
                disabled={submittingRevision}
                onClick={() => {
                  if (submittingRevision) return;
                  setShowRevisionPromptModal(false);
                  setRevisionPromptChutiId(null);
                  setRevisionPromptText('');
                }}
                className="text-slate-450 hover:text-white text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                এই ছুটির অনুরোধটি সংশোধনের জন্য ফেরত পাঠানোর কারণ বা মন্তব্যটি নিচে লিখুন। এটি ইউজারের সংশোধন পেজে প্রদর্শিত হবে:
              </p>
              
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 font-semibold">রিভিশন মন্তব্য/কারণ (Required)</label>
                <textarea
                  required
                  disabled={submittingRevision}
                  placeholder="যেমন: তারিখ পরিবর্তন করুন অথবা সঠিক ছুটির ধরন নির্বাচন করুন..."
                  value={revisionPromptText}
                  onChange={(e) => setRevisionPromptText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 h-24 resize-none font-sans disabled:opacity-50"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  disabled={submittingRevision}
                  onClick={() => {
                    setShowRevisionPromptModal(false);
                    setRevisionPromptChutiId(null);
                    setRevisionPromptText('');
                  }}
                  className="flex-1 flex justify-center py-2 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 cursor-pointer transition-all disabled:opacity-50"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={submittingRevision}
                  onClick={submitRevisionWithReason}
                  className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {submittingRevision && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  {submittingRevision ? 'দাখিল হচ্ছে...' : 'দাখিল করুন'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Notifications Modal */}
      {showUserNotificationsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-lg p-6 relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[80px] pointer-events-none" />
            
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-500" /> ছুটির নোটিফিকেশনসমূহ
              </h3>
              <button 
                onClick={() => setShowUserNotificationsModal(false)}
                className="text-slate-450 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {userNotificationsList.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  কোনো নোটিফিকেশন নেই।
                </div>
              ) : (
                userNotificationsList.map((n) => (
                  <div key={n.id} className="p-4 bg-slate-955/60 border border-slate-850 rounded-xl flex flex-col gap-3 shadow-md">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500 font-mono font-medium">
                          {n.timestamp ? new Date(n.timestamp).toLocaleString('bn-BD', { hour12: true }) : ''}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold w-fit ${
                          n.record?.leave_type === 'Full Leave' 
                            ? 'bg-red-950/60 border border-red-900 text-red-400' 
                            : n.record?.leave_type === 'Reserve'
                            ? 'bg-purple-950/60 border border-purple-900 text-purple-400'
                            : n.record?.leave_type === 'Overtime'
                            ? 'bg-blue-950/60 border border-blue-900 text-blue-400'
                            : n.record?.leave_type === 'Short Leave'
                            ? 'bg-amber-950/60 border border-amber-900 text-amber-400'
                            : 'bg-slate-950/60 border border-slate-900 text-slate-400'
                        }`}>
                          {n.record?.leave_type || 'Notification'}
                        </span>
                      </div>
                      
                      {n.type === 'revision' && n.record && (
                        <button
                          onClick={() => {
                            const r = n.record!;
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
                            setShowUserNotificationsModal(false);
                            setShowUserRevisionModal(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all border border-amber-700 shadow-md shrink-0"
                        >
                          <Edit className="h-3.5 w-3.5" /> সংশোধন করুন
                        </button>
                      )}
                    </div>

                    <div className="p-3 bg-slate-900/60 border border-slate-800/80 text-slate-300 rounded-lg text-xs leading-relaxed">
                      <span className="font-semibold text-slate-200 block mb-1">{n.title}</span>
                      {n.body || n.text}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-slate-800/80 mt-5">
              {((profile?.role === 'admin' && adminActiveTab === 'admin') || profile?.role === 'supervisor') && (
                <button
                  onClick={() => {
                    setShowUserNotificationsModal(false);
                    if (profile.role === 'admin') {
                      setShowLeaveApprovalModal(true);
                    } else {
                      setShowSupervisorApprovalModal(true);
                    }
                  }}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-350 hover:text-white cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Bell className="h-3.5 w-3.5" /> অনুমোদন প্যানেলে যান
                </button>
              )}
              <button
                onClick={() => setShowUserNotificationsModal(false)}
                className="px-4 py-2 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 cursor-pointer transition-all ml-auto"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Revision Modal */}
      {showUserRevisionModal && revisionRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-amber-900/10 blur-[80px] pointer-events-none" />
            
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit className="h-5 w-5 text-amber-500" /> ছুটির তথ্য সংশোধন ও পুনর্সাবমিট
              </h3>
              <button 
                onClick={() => setShowUserRevisionModal(false)}
                className="text-slate-450 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUserSubmitRevision} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">তারিখ</label>
                <div className="mt-1">
                  <DateInput
                    required
                    value={revisionDate}
                    onChange={setRevisionDate}
                    className="bg-slate-955 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">ছুটির ধরন</label>
                <select
                  value={revisionLeaveType}
                  onChange={(e) => setRevisionLeaveType(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Short Leave">Short Leave</option>
                  <option value="Full Leave">Full Leave</option>
                  {(profile?.allow_overtime || revisionLeaveType === 'Overtime') && <option value="Overtime">Overtime</option>}
                  {(profile?.allow_reserve || revisionLeaveType === 'Reserve') && <option value="Reserve">Reserve</option>}
                </select>
              </div>

              {/* Sign In & Sign Out Times (Conditional) */}
              {revisionLeaveType !== 'Reserve' && revisionLeaveType !== 'Full Leave' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">শুরুর সময়</label>
                    <input
                      type="time"
                      required
                      value={revisionSignInTime}
                      onChange={(e) => setRevisionSignInTime(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">শেষের সময়</label>
                    <input
                      type="time"
                      required
                      value={revisionSignOutTime}
                      onChange={(e) => setRevisionSignOutTime(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Total Leave Time & Adjustment (Conditional) */}
              {revisionLeaveType !== 'Full Leave' && (
                <div className="space-y-3">
                  {revisionLeaveType !== 'Reserve' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">মোট লিভ সময়</label>
                      <input
                        type="text"
                        required
                        placeholder="যেমন: 02:30"
                        value={revisionLeaveHour}
                        onChange={(e) => setRevisionLeaveHour(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between p-3 bg-slate-955/60 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="block text-xs font-medium text-white font-semibold">
                        {revisionLeaveType === 'Reserve' ? 'রিজার্ভ সমন্বয় অনুরোধ?' : 'অ্যাডজাস্টমেন্ট'}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {revisionLeaveType === 'Reserve' 
                          ? 'অ্যাডমিন অনুমোদন করলে মোট ছুটিতে অ্যাডজাস্ট হবে' 
                          : 'Yes দিলে মোট ছুটিতে যোগ হবে না'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newAdj = !revisionAdjustment;
                        setRevisionAdjustment(newAdj);
                        if (!newAdj) {
                          setRevisionAdjustShortLeave(false);
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        revisionAdjustment ? 'bg-blue-600' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          revisionAdjustment ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {revisionLeaveType === 'Overtime' && revisionAdjustment && (
                    <div className="flex items-center justify-between p-3 bg-slate-955/60 rounded-lg border border-slate-800/80">
                      <div>
                        <span className="block text-xs font-medium text-white font-semibold">Adjust with Short Leave?</span>
                        <span className="block text-[10px] text-slate-400">Yes দিলে শর্ট লিভ থেকে বিয়োগ হবে</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRevisionAdjustShortLeave(!revisionAdjustShortLeave)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          revisionAdjustShortLeave ? 'bg-emerald-600' : 'bg-slate-800'
                        }`}
                        title="Yes দিলে ওভারটাইম সময়টি শর্ট লিভ থেকে বিয়োগ হবে"
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            revisionAdjustShortLeave ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  )}

                  {revisionLeaveType === 'Reserve' && revisionAdjustment && (
                    <div className="flex items-center justify-between p-3 bg-slate-955/60 rounded-lg border border-slate-800/80">
                      <div>
                        <span className="block text-xs font-medium text-white font-semibold">Adjust with Full Leave?</span>
                        <span className="block text-[10px] text-slate-400">Yes দিলে রিজার্ভ ছুটি ফুল লিভ থেকে বিয়োগ হবে</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRevisionAdjustShortLeave(!revisionAdjustShortLeave)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          revisionAdjustShortLeave ? 'bg-emerald-600' : 'bg-slate-800'
                        }`}
                        title="Yes দিলে রিজার্ভ ছুটি ফুল লিভ থেকে বিয়োগ হবে"
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            revisionAdjustShortLeave ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {revisionLeaveType === 'Reserve' && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">রিজার্ভ ছুটির দিন (Reserve Holiday)</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: শবে বরাত"
                    value={revisionReserveHoliday}
                    onChange={(e) => setRevisionReserveHoliday(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">মন্তব্য/কারণ</label>
                <textarea
                  placeholder="সংশোধনের কারণ..."
                  value={revisionComment}
                  onChange={(e) => setRevisionComment(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                />
              </div>

              {revisionRecord.comment && (
                <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs leading-relaxed">
                  <div className="font-semibold flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> রিভিশন নির্দেশনা (Supervisor/Admin Remark):
                  </div>
                  <p className="text-slate-350">{getCleanComment(revisionRecord.comment)}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUserRevisionModal(false)}
                  className="flex-1 flex justify-center py-2 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 cursor-pointer transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                >
                  {submitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  {submitting ? 'সাবমিট হচ্ছে...' : 'পুনরায় সাবমিট করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. Delete Confirmation Modal */}
      {showDeleteModal && recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/85 backdrop-blur-md p-4">
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-red-900/10 blur-[80px] pointer-events-none" />
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-red-600/10 border border-red-500/20 text-red-400 rounded-2xl mb-3">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">রেকর্ড ডিলিট নিশ্চিতকরণ</h3>
              <p className="text-xs text-slate-400 mt-1">আপনি কি নিশ্চিতভাবে এই রেকর্ডটি ডিলিট করতে চান? এই কাজটি আর ফেরত নেওয়া যাবে না।</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={deletingRecord}
                onClick={() => {
                  setShowDeleteModal(false);
                  setRecordToDelete(null);
                }}
                className="flex-1 flex justify-center py-2.5 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200 disabled:opacity-50"
              >
                না, বাতিল করুন
              </button>
              <button
                type="button"
                disabled={deletingRecord}
                onClick={handleConfirmDelete}
                className="flex-1 flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-red-600 hover:bg-red-700 hover:scale-[1.01] active:scale-[0.99] text-white rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {deletingRecord && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                {deletingRecord ? 'ডিলিট হচ্ছে...' : 'হ্যাঁ, ডিলিট করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Adjustment Settings Modal */}
      {showAdjustmentModal && adjustmentRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/85 backdrop-blur-md p-4">
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[80px] pointer-events-none" />
            
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-blue-500" /> ছুটি সমন্বয় নিশ্চিতকরণ
              </h3>
              <button 
                onClick={() => {
                  setShowAdjustmentModal(false);
                  setAdjustmentRecord(null);
                }}
                className="text-slate-450 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {adjustmentRecord.leave_type === 'Short Leave' ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">শর্ট লিভের ক্ষেত্রে আপনি কি সম্পূর্ণ সময় নাকি আংশিক সময় সমন্বয় করতে চান তা সিলেক্ট করুন:</p>
                <div className="flex gap-4">
                  <label className="flex-1 flex items-center gap-2 p-3 bg-slate-950/60 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700 hover:scale-[1.01] transition-all">
                    <input
                      type="radio"
                      name="adjustmentType"
                      checked={adjustmentType === 'full'}
                      onChange={() => setAdjustmentType('full')}
                      className="text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-xs text-white font-medium">সম্পূর্ণ আওয়ার ({adjustmentRecord.leave_hour ? adjustmentRecord.leave_hour.toString().split('.')[0].substring(0, 5) : '-'})</span>
                  </label>
                  <label className="flex-1 flex items-center gap-2 p-3 bg-slate-950/60 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700 hover:scale-[1.01] transition-all">
                    <input
                      type="radio"
                      name="adjustmentType"
                      checked={adjustmentType === 'partial'}
                      onChange={() => setAdjustmentType('partial')}
                      className="text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-xs text-white font-medium">আংশিক সময়</span>
                  </label>
                </div>

                {adjustmentType === 'partial' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">আংশিক সমন্বয়ের সময় (ঘণ্টা:মিনিট)</label>
                    <input
                      type="text"
                      placeholder="যেমন: 02:00"
                      value={partialAdjustmentTime}
                      onChange={(e) => setPartialAdjustmentTime(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdjustmentModal(false);
                      setAdjustmentRecord(null);
                    }}
                    className="flex-1 flex justify-center py-2 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200"
                  >
                    বাতিল
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveAdjustment()}
                    className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200"
                  >
                    সমন্বয় করুন
                  </button>
                </div>
              </div>
            ) : adjustmentRecord.leave_type === 'Overtime' ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-350">ওভারটাইম সমন্বয়ের সময় আপনি কি এটি শর্ট লিভের মোট ব্যালেন্স থেকে বিয়োগ (Adjust) করতে চান?</p>
                <div className="flex flex-col gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustShortLeaveOption(true);
                      handleSaveAdjustment(true);
                    }}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200"
                  >
                    হ্যাঁ, শর্ট লিভ থেকে বিয়োগ করুন
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustShortLeaveOption(false);
                      handleSaveAdjustment(false);
                    }}
                    className="w-full flex justify-center py-2.5 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200"
                  >
                    না, কেবল ওভারটাইম বাদ দিন
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdjustmentModal(false);
                      setAdjustmentRecord(null);
                    }}
                    className="w-full flex justify-center py-2.5 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200"
                  >
                    বাতিল করুন
                  </button>
                </div>
              </div>
            ) : adjustmentRecord.leave_type === 'Reserve' ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-350">রিজার্ভ ছুটির সমন্বয় করার সময় আপনি কি এটি ফুল লিভের মোট ব্যালেন্স থেকে বিয়োগ (Adjust) করতে চান?</p>
                <div className="flex flex-col gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustShortLeaveOption(true);
                      handleSaveAdjustment(true);
                    }}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200"
                  >
                    হ্যাঁ, ফুল লিভ থেকে বিয়োগ করুন
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustShortLeaveOption(false);
                      handleSaveAdjustment(false);
                    }}
                    className="w-full flex justify-center py-2.5 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200"
                  >
                    না, কেবল রিজার্ভ থেকে মাইনাস করুন
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdjustmentModal(false);
                      setAdjustmentRecord(null);
                    }}
                    className="w-full flex justify-center py-2.5 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200"
                  >
                    বাতিল করুন
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-350">আপনি কি নিশ্চিতভাবে এই ছুটির রেকর্ডটি সম্পূর্ণ সমন্বয় করতে চান?</p>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdjustmentModal(false);
                      setAdjustmentRecord(null);
                    }}
                    className="flex-1 flex justify-center py-2 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200"
                  >
                    না
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveAdjustment()}
                    className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200"
                  >
                    হ্যাঁ, সমন্বয় করুন
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Cancel Adjustment Modal */}
      {showCancelAdjustmentModal && cancelAdjustmentRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/85 backdrop-blur-md p-4">
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-amber-900/10 blur-[80px] pointer-events-none" />
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-amber-600/10 border border-amber-500/20 text-amber-400 rounded-2xl mb-3">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {profile?.role === 'admin' && adminActiveTab === 'admin' ? 'সমন্বয় বাতিল নিশ্চিতকরণ' : 'সমন্বয় বাতিলের অনুরোধ'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {profile?.role === 'admin' && adminActiveTab === 'admin'
                  ? 'আপনি কি নিশ্চিতভাবে এই রেকর্ডটির ছুটি সমন্বয় বাতিল করতে চান?'
                  : 'আপনি কি নিশ্চিতভাবে এই রেকর্ডটির ছুটি সমন্বয় বাতিলের অনুরোধ পাঠাতে চান?'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCancelAdjustmentModal(false);
                  setCancelAdjustmentRecord(null);
                }}
                className="flex-1 flex justify-center py-2.5 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200"
              >
                না
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelAdjustment}
                className="flex-1 flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200"
              >
                {profile?.role === 'admin' && adminActiveTab === 'admin' ? 'হ্যাঁ, বাতিল করুন' : 'হ্যাঁ, অনুরোধ পাঠান'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Create User Modal */}
      {showCreateUserModal && profile?.role === 'admin' && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-955/80 backdrop-blur-md p-4">
          <div className="flex min-h-full items-center justify-center">
            <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden my-8">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-purple-900/10 blur-[80px] pointer-events-none" />
            
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-purple-500" /> নতুন স্টাফ যুক্ত করুন
              </h3>
              <button 
                onClick={() => {
                  setShowCreateUserModal(false);
                  setNewStaffEmail('');
                  setNewStaffPassword('');
                  setNewStaffConfirmPassword('');
                  setNewStaffUsername('');
                  setNewStaffFullName('');
                  setNewStaffRole('user');
                }}
                className="text-slate-450 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">স্টাফ নাম (Full Name)</label>
                <input
                  type="text"
                  placeholder="যেমন: Kamrul Islam"
                  value={newStaffFullName}
                  onChange={(e) => setNewStaffFullName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">কোডনেম (Codename / Username)</label>
                <input
                  type="text"
                  placeholder="যেমন: KI1024"
                  value={newStaffUsername}
                  onChange={(e) => setNewStaffUsername(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">ইউজার আইডি (User ID)</label>
                <input
                  type="email"
                  placeholder="যেমন: ki1024"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">পাসওয়ার্ড (Password)</label>
                <input
                  type="password"
                  placeholder="কমপক্ষে 4-6টি ক্যারেক্টার"
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">পাসওয়ার্ড নিশ্চিত করুন (Confirm Password)</label>
                <input
                  type="password"
                  placeholder="পাসওয়ার্ডটি আবার লিখুন"
                  value={newStaffConfirmPassword}
                  onChange={(e) => setNewStaffConfirmPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {getPasswordMatchIndicator(newStaffPassword, newStaffConfirmPassword)}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">রোল (Role)</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="user">Staff / User</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Needs Supervisor Approval Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <div>
                  <span className="block text-sm font-medium text-white font-semibold">Supervisor Approval?</span>
                  <span className="block text-[11px] text-slate-400">Yes দিলে ছুটির জন্য সুপারভাইজার অ্যাপ্রুভাল লাগবে</span>
                </div>
                <button
                  type="button"
                  onClick={() => setNewStaffNeedsApproval(!newStaffNeedsApproval)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    newStaffNeedsApproval ? 'bg-purple-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      newStaffNeedsApproval ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Allow Reserve Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <div>
                  <span className="block text-sm font-medium text-white font-semibold">Reserve Holiday?</span>
                  <span className="block text-[11px] text-slate-400">Yes দিলে রিজার্ভ ছুটির ক্যাটাগরি চালু হবে</span>
                </div>
                <button
                  type="button"
                  onClick={() => setNewStaffAllowReserve(!newStaffAllowReserve)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    newStaffAllowReserve ? 'bg-purple-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      newStaffAllowReserve ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Allow Overtime Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <div>
                  <span className="block text-sm font-medium text-white font-semibold">Overtime Category?</span>
                  <span className="block text-[11px] text-slate-400">Yes দিলে ওভারটাইমের ক্যাটাগরি চালু হবে</span>
                </div>
                <button
                  type="button"
                  onClick={() => setNewStaffAllowOvertime(!newStaffAllowOvertime)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    newStaffAllowOvertime ? 'bg-purple-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      newStaffAllowOvertime ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateUserModal(false);
                    setNewStaffEmail('');
                    setNewStaffPassword('');
                    setNewStaffConfirmPassword('');
                    setNewStaffUsername('');
                    setNewStaffFullName('');
                    setNewStaffRole('user');
                    setNewStaffNeedsApproval(false);
                  }}
                  className="flex-1 flex justify-center py-2 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 cursor-pointer transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleCreateNewUser}
                  disabled={creatingUser || !newStaffPassword || newStaffPassword !== newStaffConfirmPassword || newStaffPassword.length < 4}
                  className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {creatingUser && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  {creatingUser ? 'তৈরি হচ্ছে...' : 'স্টাফ তৈরি করুন'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Credentials Edit Modal */}
      {showCredentialsModal && profile?.role === 'admin' && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-955/80 backdrop-blur-md p-4">
          <div className="flex min-h-full items-center justify-center">
            <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden my-8">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[80px] pointer-events-none" />
            
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-500" /> Change Password প্যানেল
              </h3>
              <button 
                onClick={() => {
                  setShowCredentialsModal(false);
                  setCredTargetUserId(null);
                  setCredNewUsername('');
                  setCredNewPassword('');
                  setCredConfirmPassword('');
                }}
                className="text-slate-450 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-xs text-blue-300">
                <p>💡 এখানে আপনি এই স্টাফের জন্য নতুন <strong>কোডনেম (Username)</strong> অথবা নতুন <strong>পাসওয়ার্ড</strong> সেট করতে পারবেন। পাসওয়ার্ড পরিবর্তন করলে স্টাফকে পরের বার নতুন পাসওয়ার্ড দিয়ে লগইন করতে হবে।</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">নতুন কোডনেম (Username)</label>
                <input
                  type="text"
                  placeholder="যেমন: KMH"
                  value={credNewUsername}
                  onChange={(e) => setCredNewUsername(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">নতুন পাসওয়ার্ড (Password)</label>
                <input
                  type="password"
                  placeholder="পরিবর্তন না করতে চাইলে ফাঁকা রাখুন"
                  value={credNewPassword}
                  onChange={(e) => setCredNewPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">নতুন পাসওয়ার্ড নিশ্চিত করুন (Confirm Password)</label>
                <input
                  type="password"
                  placeholder="নতুন পাসওয়ার্ডটি আবার লিখুন"
                  value={credConfirmPassword}
                  onChange={(e) => setCredConfirmPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {getPasswordMatchIndicator(credNewPassword, credConfirmPassword)}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setShowCredentialsModal(false);
                    setCredTargetUserId(null);
                    setCredNewUsername('');
                    setCredNewPassword('');
                    setCredConfirmPassword('');
                  }}
                  className="flex-1 flex justify-center py-2 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 cursor-pointer transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleUpdateCredentials}
                  disabled={updatingCredentials || (credNewPassword ? (credNewPassword !== credConfirmPassword || credNewPassword.length < 4) : false)}
                  className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {updatingCredentials && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  {updatingCredentials ? 'সেভ হচ্ছে...' : 'আপডেট করুন'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Delete User Modal */}
      {showDeleteUserModal && deleteTargetUser && profile?.role === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-red-900/10 blur-[80px] pointer-events-none" />
            
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-red-600/10 border border-red-500/20 text-red-400 rounded-2xl mb-3">
                <AlertTriangle className="h-6 w-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white">স্টাফ অ্যাকাউন্ট মুছে ফেলা নিশ্চিতকরণ</h3>
              <p className="text-xs text-slate-350 mt-2">
                আপনি কি নিশ্চিতভাবে স্টাফ <strong className="text-white">"{deleteTargetUser.full_name || deleteTargetUser.username}"</strong>-কে মুছে ফেলতে চান?
              </p>
              <p className="text-xs text-red-400 mt-2 font-semibold">
                ⚠️ সতর্কীকরণ: অ্যাকাউন্টটি মুছে ফেললে তার বাৎসরিক সমস্ত ছুটির রেকর্ডও স্থায়ীভাবে মুছে যাবে এবং এটি আর ফিরে পাওয়া সম্ভব নয়।
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteUserModal(false);
                  setDeleteTargetUser(null);
                }}
                className="flex-1 flex justify-center py-2 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 cursor-pointer transition-all"
              >
                না, বাতিল করুন
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deletingUser}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deletingUser && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                {deletingUser ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, স্টাফ মুছে ফেলুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Leave Info Modal */}
      {showAddLeaveModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-955/80 backdrop-blur-md p-4">
          <div className="flex min-h-full items-center justify-center">
            <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-lg p-6 relative overflow-hidden my-8">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[80px] pointer-events-none" />
            
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-500" /> নতুন ছুটির এন্ট্রি দিন
              </h3>
              <button 
                onClick={() => setShowAddLeaveModal(false)}
                className="text-slate-450 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Date & Leave Type side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider font-semibold">তারিখ (Date)</label>
                  <div className="flex gap-2 items-center mt-1">
                    <DateInput
                      required
                      value={date}
                      onChange={(val) => {
                        if (bulkDates.includes(val)) {
                          alert('এই তারিখটি অলরেডি অতিরিক্ত তারিখ হিসেবে সিলেক্ট করা হয়েছে!');
                          return;
                        }
                        setDate(val);
                      }}
                      className="bg-slate-955"
                    />
                    {leaveType === 'Full Leave' && (
                      <button
                        type="button"
                        onClick={handleAddBulkDate}
                        className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all flex items-center justify-center cursor-pointer shrink-0 border border-blue-700 shadow-md"
                        title="আরও তারিখ যোগ করুন"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider font-semibold">ছুটির ধরন (Leave Type)</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Short Leave">Short Leave</option>
                    <option value="Full Leave">Full Leave</option>
                    {profile?.allow_overtime && <option value="Overtime">Overtime</option>}
                    {profile?.allow_reserve && <option value="Reserve">Reserve</option>}
                  </select>
                </div>
              </div>

              {/* Bulk Dates Input List */}
              {leaveType === 'Full Leave' && bulkDates.length > 0 && (
                <div className="space-y-2.5 p-3 bg-slate-950/40 rounded-lg border border-slate-800/80 max-h-48 overflow-y-auto">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">অতিরিক্ত ছুটির তারিখসমূহ ({bulkDates.length} দিন)</label>
                  <div className="grid grid-cols-1 gap-2">
                    {bulkDates.map((bulkDate, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <span className="text-[10px] text-slate-500 font-mono w-4">{index + 2}.</span>
                        <div className="flex-1">
                          <DateInput
                            required
                            value={bulkDate}
                            onChange={(val) => handleUpdateBulkDate(index, val)}
                            className="bg-slate-955 py-1.5"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveBulkDate(index)}
                          className="p-1.5 bg-red-955/60 hover:bg-red-900 border border-red-900/50 text-red-400 rounded-lg transition-all flex items-center justify-center cursor-pointer shrink-0"
                          title="বাদ দিন"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Adjustment Switch & Overtime Switch */}
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="block text-xs font-medium text-white font-semibold">
                      {leaveType === 'Reserve' ? 'Adjustment Request?' : 'Adjustment?'}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {leaveType === 'Reserve' 
                        ? 'অ্যাডমিন অনুমোদন করলে মোট ছুটিতে অ্যাডজাস্ট হবে' 
                        : 'Yes দিলে মোট ছুটিতে যোগ হবে না'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newAdj = !adjustment;
                      setAdjustment(newAdj);
                      if (!newAdj) {
                        setAdjustShortLeave(false);
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      adjustment ? 'bg-blue-600' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        adjustment ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {leaveType === 'Overtime' && adjustment && (
                  <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="block text-xs font-medium text-white font-semibold">Adjust with Short Leave?</span>
                      <span className="block text-[10px] text-slate-400">Yes দিলে শর্ট লিভ থেকে বিয়োগ হবে</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdjustShortLeave(!adjustShortLeave)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        adjustShortLeave ? 'bg-emerald-600' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          adjustShortLeave ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                )}

                {leaveType === 'Reserve' && adjustment && (
                  <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="block text-xs font-medium text-white font-semibold">Adjust with Full Leave?</span>
                      <span className="block text-[10px] text-slate-400">Yes দিলে ফুল লিভ থেকে বিয়োগ হবে</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdjustShortLeave(!adjustShortLeave)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        adjustShortLeave ? 'bg-emerald-600' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          adjustShortLeave ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                )}
              </div>

              {/* Sign In & Sign Out Times & Leave Hour (Conditional) */}
              {leaveType !== 'Reserve' && leaveType !== 'Full Leave' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider font-semibold">সাইন-ইন টাইম</label>
                      <input
                        type="time"
                        required
                        value={signInTime}
                        onChange={(e) => setSignInTime(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider font-semibold">সাইন-আউট টাইম</label>
                      <input
                        type="time"
                        required
                        value={signOutTime}
                        onChange={(e) => setSignOutTime(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider font-semibold">হিসাবকৃত ছুটির আওয়ার (Leave Hour)</label>
                    <input
                      type="text"
                      required
                      value={leaveHour}
                      onChange={(e) => setLeaveHour(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-blue-400 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Reserve Holiday (Conditional) */}
              {leaveType === 'Reserve' && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider font-semibold">রিজার্ভ ছুটির দিন</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: শবে বরাত"
                    value={reserveHoliday}
                    onChange={(e) => setReserveHoliday(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Comment Box */}
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider font-semibold">মন্তব্য (Comment)</label>
                <textarea
                  rows={2}
                  placeholder="ছুটির সংক্ষিপ্ত বিবরণ লিখুন..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddLeaveModal(false)}
                  className="flex-1 flex justify-center py-2 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 cursor-pointer transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                >
                  {submitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  {submitting ? 'সাবমিট হচ্ছে...' : 'সাবমিট করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
