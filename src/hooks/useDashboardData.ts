'use client';

import { useState, useEffect, useCallback } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Profile, ChutiRecordWithProfile } from '@/types';
import { ChutiRecord, getOfflineRecords, syncOfflineData } from '@/utils/offlineSync';

export const useDashboardData = () => {
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

  // Lists states
  const [userRecords, setUserRecords] = useState<ChutiRecord[]>([]);
  const [adminRecords, setAdminRecords] = useState<ChutiRecordWithProfile[]>([]);
  const [profilesList, setProfilesList] = useState<Profile[]>([]);

  // Navigation / Tab states
  const [adminActiveTab, setAdminActiveTab] = useState<'user' | 'admin'>('admin');
  const [viewingStaffId, setViewingStaffId] = useState<string | null>(null);

  // Notification last viewed
  const [lastViewedTime, setLastViewedTime] = useState<string>('');

  // Theme Toggle state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Load theme on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') || 'dark';
      setTheme(savedTheme as 'dark' | 'light');
      if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  // Theme toggle handler
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', nextTheme);
    }
    if (nextTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  // Modal visibility states
  const [showLeaveApprovalModal, setShowLeaveApprovalModal] = useState(false);
  const [showSupervisorApprovalModal, setShowSupervisorApprovalModal] = useState(false);
  const [showUserNotificationsModal, setShowUserNotificationsModal] = useState(false);

  // Approval status sets
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
  const [reviewingIds, setReviewingIds] = useState<Set<string>>(new Set());
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());

  // Auto-dismiss messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Sync Check Loop
  const checkOfflineQueue = useCallback(async () => {
    const records = await getOfflineRecords();
    setOfflineCount(records.length);
  }, []);

  useEffect(() => {
    checkOfflineQueue();
  }, [checkOfflineQueue]);

  // Fetch Chuti Records based on Role
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

  // Load last viewed notification timestamp
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

  // Listen for real-time updates from Supabase
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
            const handleForceLogout = async () => {
              try {
                await supabase.auth.signOut();
              } catch (e) {
                console.error(e);
              }
              localStorage.removeItem(`session_start_time_${sessionUser.id}`);
              localStorage.removeItem(`last_access_time_${sessionUser.id}`);
              router.push('/login');
            };
            handleForceLogout();
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

  // Check Authentication and Fetch Profile on Mount
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

      setProfile(userProfile as Profile);
      setLoading(false);
    };

    fetchSession();
  }, [router]);

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

  return {
    sessionUser,
    profile,
    setProfile,
    isPushSubscribed,
    setIsPushSubscribed,
    isPushLoading,
    setIsPushLoading,
    loading,
    setLoading,
    submitting,
    setSubmitting,
    isOnline,
    setIsOnline,
    offlineCount,
    setOfflineCount,
    message,
    setMessage,
    userRecords,
    setUserRecords,
    adminRecords,
    setAdminRecords,
    profilesList,
    setProfilesList,
    adminActiveTab,
    setAdminActiveTab,
    viewingStaffId,
    setViewingStaffId,
    lastViewedTime,
    setLastViewedTime,
    theme,
    toggleTheme,
    showLeaveApprovalModal,
    setShowLeaveApprovalModal,
    showSupervisorApprovalModal,
    setShowSupervisorApprovalModal,
    showUserNotificationsModal,
    setShowUserNotificationsModal,
    approvingIds,
    setApprovingIds,
    reviewingIds,
    setReviewingIds,
    approvedIds,
    setApprovedIds,
    fetchRecords,
    checkOfflineQueue,
    handleManualSync,
    handleLogout,
  };
};
