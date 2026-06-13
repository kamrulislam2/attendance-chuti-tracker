'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Profile, ChutiRecordWithProfile, LeaveSettlement } from '@/types';
import { ChutiRecord, getOfflineRecords, syncOfflineData } from '@/utils/offlineSync';
import { checkSubscriptionStatus, sendPushNotification } from '@/utils/webPushHelper';
import { getGlobalSettingsFromProfile, defaultGlobalSettings, GlobalSettings, formatDate, parseHolidayItem } from '@/utils/dashboardHelpers';

export const useDashboardData = () => {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineCount, setOfflineCount] = useState(0);
  const [message, setMessageState] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const setMessage = useCallback((msg: { type: 'success' | 'error'; text: string } | null) => {
    setMessageState(msg);
    if (msg) {
      if (msg.type === 'success') {
        toast.success(msg.text, { id: msg.text });
      } else {
        toast.error(msg.text, { id: msg.text });
      }
    }
  }, []);

  // Lists states
  const [userRecords, setUserRecords] = useState<ChutiRecord[]>([]);
  const [adminRecords, setAdminRecords] = useState<ChutiRecordWithProfile[]>([]);
  const [profilesList, setProfilesList] = useState<Profile[]>([]);
  const [holidayResponses, setHolidayResponses] = useState<any[]>([]);
  const [leaveSettlements, setLeaveSettlements] = useState<LeaveSettlement[]>([]);

  // Navigation / Tab states
  const [adminActiveTab, setAdminActiveTab] = useState<'user' | 'admin'>('admin');
  const [viewingStaffId, setViewingStaffId] = useState<string | null>(null);

  // Notification last viewed
  const [lastViewedTime, setLastViewedTime] = useState<string>('');

  // Theme Toggle state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Global Settings state
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(defaultGlobalSettings);

  // Fetch Chuti Records based on Role
  const fetchRecords = useCallback(async () => {
    if (!sessionUser || !profile) return;

    try {
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
          .select('*')
          .order('username', { ascending: true });

        if (profiles) {
          setProfilesList(profiles);
        }
      } else {
        // For normal users, fetch only the list of supervisors to allow routing requests
        const { data: supervisors } = await supabase
          .from('profiles')
          .select('id, username, role, full_name')
          .eq('role', 'supervisor')
          .order('username', { ascending: true });

        if (supervisors) {
          setProfilesList(supervisors as any[]);
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

      // Fetch Govt Holiday Responses
      if (profile.role === 'admin' || profile.role === 'supervisor') {
        const { data: responses, error: respError } = await supabase
          .from('govt_holiday_responses')
          .select(`
            *,
            profiles (full_name, username)
          `)
          .order('created_at', { ascending: false });
        if (!respError && responses) {
          setHolidayResponses(responses);
        }

        const { data: settlements, error: settError } = await supabase
          .from('leave_settlements')
          .select(`
            *,
            profiles (full_name, username)
          `)
          .order('created_at', { ascending: false });
        if (!settError && settlements) {
          setLeaveSettlements(settlements);
        }
      } else {
        const { data: responses, error: respError } = await supabase
          .from('govt_holiday_responses')
          .select('*')
          .eq('user_id', sessionUser.id)
          .order('created_at', { ascending: false });
        if (!respError && responses) {
          setHolidayResponses(responses);
        }

        const { data: settlements, error: settError } = await supabase
          .from('leave_settlements')
          .select('*')
          .eq('user_id', sessionUser.id)
          .order('created_at', { ascending: false });
        if (!settError && settlements) {
          setLeaveSettlements(settlements);
        }
      }
    } finally {
      setInitialFetchDone(true);
    }
  }, [sessionUser, profile]);

  const handleSaveGlobalSettings = useCallback(async (newSettings: GlobalSettings) => {
    if (!profile) return false;
    const hasGlobalSettingsColumn = 'global_settings' in profile;
    const updates: any = {};
    if (hasGlobalSettingsColumn) {
      updates.global_settings = newSettings;
    } else {
      updates.requested_default_sign_in = JSON.stringify(newSettings);
    }
    
    // Compare old and new government holidays to detect newly added ones
    const oldHolidays = (globalSettings.govt_holidays || []).map((h: any) => parseHolidayItem(h));
    const newHolidays = (newSettings.govt_holidays || []).map((h: any) => parseHolidayItem(h));
    const oldDates = new Set(oldHolidays.map(h => h.date));
    const addedHolidays = newHolidays.filter(h => h.date && !oldDates.has(h.date));

    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .neq('role', 'none');
      
    if (error) {
      console.error('Error saving global settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings: ' + error.message });
      setLoading(false);
      return false;
    }
    
    setGlobalSettings(newSettings);
    setMessage({ type: 'success', text: 'Leave quota settings successfully updated!' });
    setLoading(false);
    fetchRecords();

    // Send push notifications for newly added holidays
    if (addedHolidays.length > 0) {
      addedHolidays.forEach((h) => {
        const reserveFalseIds = profilesList
          .filter(p => p.eligible_govt_holiday !== false && p.allow_reserve === false)
          .map(p => p.id);
          
        const reserveTrueIds = profilesList
          .filter(p => p.eligible_govt_holiday !== false && p.allow_reserve !== false)
          .map(p => p.id);

        if (reserveFalseIds.length > 0) {
          // Auto-save 'paid' response in govt_holiday_responses for reserve-disabled users
          const autoResponses = reserveFalseIds.map(userId => ({
            user_id: userId,
            holiday_date: h.date,
            holiday_name: h.name,
            response: 'paid'
          }));
          
          supabase
            .from('govt_holiday_responses')
            .upsert(autoResponses, { onConflict: 'user_id,holiday_date' })
            .then(({ error: upsertError }) => {
              if (upsertError) {
                console.error('Error auto-saving paid responses for holiday:', h.name, upsertError);
              }
            });

          sendPushNotification({
            userIds: reserveFalseIds,
            title: 'Govt Holiday Payment Approved 🎉',
            body: `${h.name} (${formatDate(h.date)}) Govt Holiday payment has been approved to be paid with your salary.`,
            url: '/'
          }).catch(err => console.error('Error sending push notification to paid users:', err));
        }

        if (reserveTrueIds.length > 0) {
          sendPushNotification({
            userIds: reserveTrueIds,
            title: 'Select Govt Holiday Preference 🔔',
            body: `What would you like to do for this government holiday: ${h.name} (${formatDate(h.date)})?`,
            url: '/'
          }).catch(err => console.error('Error sending push notification to reserve-enabled users:', err));
        }
      });
    }

    return true;
  }, [profile, globalSettings.govt_holidays, profilesList, fetchRecords]);

  const handleSaveHolidayResponse = useCallback(async (holidayDate: string, holidayName: string, response: 'paid' | 'reserve') => {
    if (!sessionUser) return false;
    
    setLoading(true);
    const { error } = await supabase
      .from('govt_holiday_responses')
      .upsert({
        user_id: sessionUser.id,
        holiday_date: holidayDate,
        holiday_name: holidayName,
        response: response
      }, {
        onConflict: 'user_id,holiday_date'
      });
      
    if (error) {
      console.error('Error saving holiday response:', error);
      setMessage({ type: 'error', text: 'Failed to save response: ' + error.message });
      setLoading(false);
      return false;
    }
    
    // Trigger push notification to admins
    const staffName = profile?.full_name || 'Staff';
    const staffCode = profile?.username ? profile.username.toUpperCase() : 'N/A';
    const titleText = 'Govt Holiday Response Report 🔔';
    const bodyText = response === 'reserve'
      ? `${staffName} (${staffCode}) has requested to reserve the leave for ${holidayName} (${formatDate(holidayDate)}).`
      : `${staffName} (${staffCode}) has requested to get paid for ${holidayName} (${formatDate(holidayDate)}).`;

    sendPushNotification({
      userIds: ['admins'],
      title: titleText,
      body: bodyText,
      url: '/'
    }).catch(err => console.error('Error sending push notification to admins for holiday choice:', err));

    setMessage({ type: 'success', text: 'Your preference has been successfully saved!' });
    setLoading(false);
    fetchRecords();
    return true;
  }, [sessionUser, profile, fetchRecords]);

  const handleAdminUpdateHolidayResponse = useCallback(async (targetUserId: string, holidayDate: string, holidayName: string, response: 'paid' | 'reserve') => {
    if (!profile || profile.role !== 'admin') return false;
    
    setLoading(true);

    // 1. Check existing preference
    const { data: existingResponse } = await supabase
      .from('govt_holiday_responses')
      .select('response')
      .eq('user_id', targetUserId)
      .eq('holiday_date', holidayDate)
      .maybeSingle();
      
    const wasReserved = existingResponse?.response === 'reserve';
    const isNowPaid = response === 'paid';

    // 2. Perform the update
    const { error } = await supabase
      .from('govt_holiday_responses')
      .upsert({
        user_id: targetUserId,
        holiday_date: holidayDate,
        holiday_name: holidayName,
        response: response,
        updated_by_admin: true,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,holiday_date'
      });
      
    if (error) {
      console.error('Error admin-saving holiday response:', error);
      setMessage({ type: 'error', text: 'Failed to update response: ' + error.message });
      setLoading(false);
      return false;
    }

    // 3. If preference was reserve and is now paid, automatically unadjust excess leaves
    if (wasReserved && isNowPaid) {
      try {
        const selectedYear = holidayDate.substring(0, 4);

        // Fetch new reserved count
        const { data: activeReserveResponses } = await supabase
          .from('govt_holiday_responses')
          .select('*')
          .eq('user_id', targetUserId)
          .eq('response', 'reserve');
        
        const newReservedCount = (activeReserveResponses || []).filter(
          r => r.holiday_date.substring(0, 4) === selectedYear
        ).length;

        // Fetch user's adjusted full leaves in the same year
        const { data: userLeaves } = await supabase
          .from('chuti')
          .select('*')
          .eq('user_id', targetUserId)
          .eq('leave_type', 'Full Leave')
          .eq('adjustment', true)
          .gte('date', `${selectedYear}-01-01`)
          .lte('date', `${selectedYear}-12-31`);

        const govtHolidayLeaves = (userLeaves || []).filter(r => 
          r.comment?.includes("Govt Holiday") || r.reserve_holiday === "Govt Holiday"
        );

        // If taken adjusted leaves exceed reserve count, unadjust the excess
        if (govtHolidayLeaves.length > newReservedCount) {
          const excessCount = govtHolidayLeaves.length - newReservedCount;
          // Sort by date descending (unadjust most recent first)
          govtHolidayLeaves.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const leavesToUnadjust = govtHolidayLeaves.slice(0, excessCount);

          for (const leaf of leavesToUnadjust) {
            let cleanComment = leaf.comment || '';
            // Clean prefix "Adjusted: Govt Holiday | "
            cleanComment = cleanComment.replace(/Adjusted:\s*Govt Holiday(?:\s*\|\s*)?/g, '').trim();

            await supabase
              .from('chuti')
              .update({
                adjustment: false,
                reserve_holiday: null,
                comment: cleanComment || null
              })
              .eq('id', leaf.id);
          }
        }
      } catch (unadjustErr) {
        console.error('Error auto-unadjusting leaves:', unadjustErr);
      }
    }
    
    // Trigger push notification to updated user
    sendPushNotification({
      userIds: [targetUserId],
      title: 'Govt Holiday Choice Updated 💸',
      body: `Admin has updated your preference for ${holidayName} (${formatDate(holidayDate)}) to ${response === 'reserve' ? 'Reserve' : 'Get Paid'}.`,
      url: '/'
    }).catch(err => console.error('Error sending push notification to user:', err));

    setMessage({ type: 'success', text: 'Holiday response updated successfully!' });
    setLoading(false);
    fetchRecords();
    return true;
  }, [profile, fetchRecords]);

  const handleSaveLeaveSettlementsBulk = useCallback(async (
    settlementsList: Array<{
      user_id: string;
      year: string;
      leave_category: string;
      remaining_days: number;
      action_type: 'carry_forward' | 'payment';
      status?: 'pending' | 'processed';
      processed_by?: string;
      action_by?: string;
    }>
  ) => {
    try {
      setLoading(true);
      const formatted = settlementsList.map(item => ({
        user_id: item.user_id,
        year: item.year,
        leave_category: item.leave_category,
        remaining_days: item.remaining_days,
        action_type: item.action_type,
        status: item.status || 'processed',
        processed_by: item.processed_by || null,
        processed_at: (item.status === 'processed' || item.status === undefined) ? new Date().toISOString() : null,
        action_by: item.action_by || item.user_id
      }));

      const { error } = await supabase
        .from('leave_settlements')
        .upsert(formatted, {
          onConflict: 'user_id,year,leave_category'
        });

      if (error) throw error;

      // Trigger user push notification
      const uniqueUserIds = Array.from(new Set(settlementsList.map(s => s.user_id)));
      for (const targetUserId of uniqueUserIds) {
        const userSettlements = settlementsList.filter(s => s.user_id === targetUserId);
        const details = userSettlements.map(s => `${s.leave_category}: ${s.action_type === 'carry_forward' ? 'Carry Forward' : 'Payment'} (${s.remaining_days} days)`).join(', ');
        
        sendPushNotification({
          userIds: [targetUserId],
          title: 'Leave Settlements Processed 📅',
          body: `Your leave settlements have been processed: ${details}.`,
          url: '/'
        }).catch(err => console.error('Error sending push notification for settlement:', err));
      }

      setMessage({ type: 'success', text: 'Settlement choices processed successfully!' });
      await fetchRecords();
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Error bulk saving leave settlements:', err);
      setMessage({ type: 'error', text: 'Failed to process settlements: ' + (err as Error).message });
      setLoading(false);
      return false;
    }
  }, [fetchRecords, setMessage]);

  useEffect(() => {
    if (profile) {
      // Find the first admin profile in profilesList with custom settings, or fall back to the first admin profile
      const adminProfile = profilesList.find(p => p.role === 'admin' && p.global_settings && JSON.stringify(p.global_settings) !== JSON.stringify(defaultGlobalSettings))
        || profilesList.find(p => p.role === 'admin');

      if (adminProfile && (profile.role === 'admin' || profile.role === 'supervisor')) {
        setGlobalSettings(getGlobalSettingsFromProfile(adminProfile));
      } else {
        setGlobalSettings(getGlobalSettingsFromProfile(profile));
      }
    }
  }, [profile, profilesList]);

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
      setMessage({ type: 'success', text: `${res.syncedCount} offline records successfully saved to cloud!` });
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
        setMessage({ type: 'success', text: 'You are back online.' });
        triggerAutoSync();
      };
      const handleOffline = () => {
        setIsOnline(false);
        setMessage({ type: 'error', text: 'Internet disconnected. You are in offline mode.' });
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
            setProfile(prev => prev ? { ...prev, ...payload.new } : (payload.new as Profile));
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
      try {
        const getSessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error('Supabase session fetch timed out')), 4000)
        );
        const { data, error: sessionError } = await Promise.race([getSessionPromise, timeoutPromise]);
        
        if (sessionError) {
          console.error('Supabase session fetch error:', sessionError);
          setInitialFetchDone(false);
          setLoading(false);
          router.push('/login');
          return;
        }

        const session = data?.session;
        if (!session) {
          setInitialFetchDone(false);
          setLoading(false);
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
            try {
              await supabase.auth.signOut();
            } catch (signOutError) {
              console.error('Error signing out expired session:', signOutError);
            }
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
          .select('*')
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

        // Optimistically restore push preference from localStorage on reload
        const savedPref = localStorage.getItem('push_subscribed_pref_' + userId);
        setIsPushSubscribed(savedPref === 'true');

        // Verify actual subscription status asynchronously
        checkSubscriptionStatus(userId)
          .then((status) => {
            setIsPushSubscribed(status.isSubscribed);
            localStorage.setItem('push_subscribed_pref_' + userId, status.isSubscribed ? 'true' : 'false');
          })
          .catch((err) => {
            console.error('Error verifying push status:', err);
          });

        setLoading(false);
      } catch (err) {
        console.error('Fatal exception in fetchSession:', err);
        setInitialFetchDone(false);
        setLoading(false);
        router.push('/login');
      }
    };

    fetchSession();
  }, [router]);

  // Manual Sync Button Handler
  const handleManualSync = async () => {
    if (!isOnline) {
      setMessage({ type: 'error', text: 'You are still offline! Please connect to the internet.' });
      return;
    }
    setLoading(true);
    const res = await syncOfflineData();
    setLoading(false);
    
    if (res.success) {
      setMessage({ type: 'success', text: `${res.syncedCount} offline records synced!` });
      checkOfflineQueue();
      fetchRecords();
    } else {
      setMessage({ type: 'error', text: res.error || 'Sync failed.' });
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
    setInitialFetchDone(false);
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
    globalSettings,
    handleSaveGlobalSettings,
    holidayResponses,
    setHolidayResponses,
    handleSaveHolidayResponse,
    handleAdminUpdateHolidayResponse,
    leaveSettlements,
    setLeaveSettlements,
    handleSaveLeaveSettlementsBulk,
    initialFetchDone,
  };
};
