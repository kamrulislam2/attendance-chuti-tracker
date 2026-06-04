'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Profile } from '@/types';
import { sendPushNotification } from '@/utils/webPushHelper';

interface useAdminStaffOperationsParams {
  sessionUser: any;
  profile: Profile | null;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  fetchRecords: () => Promise<void>;
  profilesList: Profile[];
  setProfilesList: React.Dispatch<React.SetStateAction<Profile[]>>;
  setViewingStaffId: React.Dispatch<React.SetStateAction<string | null>>;
  setMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void;
  isPushSubscribed: boolean;
  setIsPushSubscribed: (val: boolean) => void;
  isPushLoading: boolean;
  setIsPushLoading: (val: boolean) => void;
  adminActiveTab: 'user' | 'admin';
  setAdminActiveTab: React.Dispatch<React.SetStateAction<'user' | 'admin'>>;
  handleLogout: () => Promise<void>;
  router: any;
  setApprovingIds?: React.Dispatch<React.SetStateAction<Set<string>>>;
  setApprovedIds?: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export const useAdminStaffOperations = ({
  sessionUser,
  profile,
  setProfile,
  fetchRecords,
  profilesList,
  setProfilesList,
  setViewingStaffId,
  setMessage,
  isPushSubscribed,
  setIsPushSubscribed,
  isPushLoading,
  setIsPushLoading,
  adminActiveTab,
  setAdminActiveTab,
  handleLogout,
  router,
  setApprovingIds,
  setApprovedIds,
}: useAdminStaffOperationsParams) => {
  // --- Welcome Onboarding Popup ---
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  // --- First-time password setup states ---
  const [showFirstTimePasswordModal, setShowFirstTimePasswordModal] = useState(false);
  const [firstTimePassword, setFirstTimePassword] = useState('');
  const [firstTimeConfirmPassword, setFirstTimeConfirmPassword] = useState('');
  const [firstTimePasswordSubmitting, setFirstTimePasswordSubmitting] = useState(false);
  const [firstTimePasswordError, setFirstTimePasswordError] = useState('');


  // --- Onboarding setup states ---
  const [setupFullName, setSetupFullName] = useState('');
  const [setupUsername, setSetupUsername] = useState('');
  const [setupWorkingHours, setSetupWorkingHours] = useState('');
  const [setupBreakTime, setSetupBreakTime] = useState('');
  const [setupJobRole, setSetupJobRole] = useState('');
  const [setupSignInTime, setSetupSignInTime] = useState('');
  const [setupSignOutTime, setSetupSignOutTime] = useState('');
  const [setupSubmitting, setSetupSubmitting] = useState(false);
  const [setupError, setSetupError] = useState('');

  // --- Add New Staff Account states ---
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);

  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffConfirmPassword, setNewStaffConfirmPassword] = useState('');
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('user');
  const [newStaffFullName, setNewStaffFullName] = useState('');
  const [newStaffNeedsApproval, setNewStaffNeedsApproval] = useState(false);
  const [newStaffAllowReserve, setNewStaffAllowReserve] = useState(false);
  const [newStaffAllowOvertime, setNewStaffAllowOvertime] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);

  // New staff details and eligibility states
  const [newStaffJobRole, setNewStaffJobRole] = useState('IT Officer');
  const [newStaffWorkingHours, setNewStaffWorkingHours] = useState('9.5');
  const [newStaffBreakTime, setNewStaffBreakTime] = useState('10');
  const [newStaffSignInTime, setNewStaffSignInTime] = useState('13:00');
  const [newStaffSignOutTime, setNewStaffSignOutTime] = useState('22:30');
  const [newStaffEligibleOfficeLeave, setNewStaffEligibleOfficeLeave] = useState(true);
  const [newStaffEligibleGovtHoliday, setNewStaffEligibleGovtHoliday] = useState(true);

  // --- Edit Credentials states ---
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credTargetUserId, setCredTargetUserId] = useState<string | null>(null);
  const [credNewUsername, setCredNewUsername] = useState('');
  const [credNewPassword, setCredNewPassword] = useState('');
  const [credConfirmPassword, setCredConfirmPassword] = useState('');
  const [updatingCredentials, setUpdatingCredentials] = useState(false);

  // --- Delete User states ---
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState<Profile | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  // --- Profile settings states ---
  const [showProfileSettingsModal, setShowProfileSettingsModal] = useState(false);
  const [editingStaffProfileId, setEditingStaffProfileId] = useState<string | null>(null);
  const [isCodenameEditable, setIsCodenameEditable] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editJobRole, setEditJobRole] = useState('');
  const [editWorkingHours, setEditWorkingHours] = useState('9.5');
  const [editBreakTime, setEditBreakTime] = useState('0');
  const [profileSignInTime, setProfileSignInTime] = useState('13:00');
  const [profileSignOutTime, setProfileSignOutTime] = useState('22:30');
  const [editNeedsApproval, setEditNeedsApproval] = useState(true);
  const [editAllowReserve, setEditAllowReserve] = useState(false);
  const [editAllowOvertime, setEditAllowOvertime] = useState(false);
  const [isEditRequestMode, setIsEditRequestMode] = useState(false);
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [editMaxFullLeaves, setEditMaxFullLeaves] = useState('15');
  const [editEligibleOfficeLeave, setEditEligibleOfficeLeave] = useState(true);
  const [editEligibleGovtHoliday, setEditEligibleGovtHoliday] = useState(true);

  // Sync state values on profile change
  useEffect(() => {
    if (profile) {
      setSetupUsername((profile.username || '').toUpperCase());
      setSetupFullName(profile.full_name || '');
      setSetupWorkingHours(Number(profile.working_hours || 9.5).toFixed(1));
      setSetupBreakTime(String(profile.break_time || 0));
      setSetupJobRole(profile.job_role || '');
      setSetupSignInTime(profile.default_sign_in || '13:00');
      setSetupSignOutTime(profile.default_sign_out || '22:30');
      
      setEditFullName(profile.requested_full_name || profile.full_name || '');
      setEditWorkingHours(Number(profile.requested_working_hours || profile.working_hours || 9.5).toFixed(1));
      setEditBreakTime(String(profile.requested_break_time || profile.break_time || 0));
      setEditJobRole(profile.requested_job_role || profile.job_role || '');
      setProfileSignInTime(profile.requested_default_sign_in || profile.default_sign_in || '13:00');
      setProfileSignOutTime(profile.requested_default_sign_out || profile.default_sign_out || '22:30');
      setEditMaxFullLeaves(String(profile.max_full_leaves ?? 15));
      setEditEligibleOfficeLeave(profile.eligible_office_leave !== false);
      setEditEligibleGovtHoliday(profile.eligible_govt_holiday !== false);
      
      if (profile.has_changed_password === false) {
        setShowFirstTimePasswordModal(true);
      }
    }
  }, [profile]);

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
    const TEN_MINUTES_MS = 10 * 60 * 1050; // slightly padded 10m

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

  // Submit Profile settings changes
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionUser || !profile) return;
    setProfileSubmitting(true);
    setMessage(null);

    try {
      if (editingStaffProfileId) {
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
          max_full_leaves: parseInt(editMaxFullLeaves) || 15,
          max_short_leaves: 0,
          eligible_office_leave: editEligibleOfficeLeave,
          eligible_govt_holiday: editEligibleGovtHoliday,
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
          max_full_leaves: parseInt(editMaxFullLeaves) || 15,
          max_short_leaves: 0,
          eligible_office_leave: editEligibleOfficeLeave,
          eligible_govt_holiday: editEligibleGovtHoliday,
        };

        const { data: updatedProfile, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', sessionUser.id)
          .select()
          .single();

        if (error) throw error;

        setProfile(updatedProfile as Profile);
        setMessage({ type: 'success', text: 'আপনার প্রোফাইল সফলভাবে আপডেট করা হয়েছে!' });
        setShowProfileSettingsModal(false);
      } else {
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

          setProfile(updatedProfile as Profile);
          setIsEditRequestMode(false);
          setMessage({ type: 'success', text: 'আপনার প্রোফাইল সফলভাবে আপডেট করা হয়েছে!' });
          setShowProfileSettingsModal(false);
        } else {
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

          sendPushNotification({
            userIds: ['admins'],
            title: 'প্রোফাইল পরিবর্তন অনুরোধ 👤',
            body: `${profile?.full_name || profile?.username || 'স্টাফ'} তাঁর প্রোফাইল তথ্য পরিবর্তনের অনুরোধ জানিয়েছেন।`,
            url: '/'
          }).catch(err => console.error('Error triggering push notification for profile change:', err));

          setProfile(updatedProfile as Profile);
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
      setProfileSubmitting(false);
    }
  };

  // Setup / onboarding profile info submit
  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionUser || !profile) return;
    setSetupSubmitting(true);
    setSetupError('');

    try {
      const updates = {
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

      setProfile(updatedProfile as Profile);
      setEditFullName(updatedProfile.full_name || '');
      setEditWorkingHours(Number(updatedProfile.working_hours || 9.5).toFixed(1));
      setEditBreakTime(String(updatedProfile.break_time || 0));
      setEditJobRole(updatedProfile.job_role || '');

      setShowWelcomePopup(true);
      setTimeout(() => {
        setShowWelcomePopup(false);
      }, 10000);

      setMessage({ type: 'success', text: 'আপনার প্রোফাইল সেটআপ সফলভাবে সম্পন্ন হয়েছে!' });
    } catch (err) {
      setSetupError((err as Error).message || 'সেটআপ আপডেট করতে সমস্যা হয়েছে।');
    } finally {
      setSetupSubmitting(false);
    }
  };

  // First-time setups & password updates submit
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
      const { error: authError } = await supabase.auth.updateUser({
        password: firstTimePassword,
      });
      if (authError) throw authError;

      const updates: Record<string, unknown> = {
        has_changed_password: true,
      };

      if (profile.role !== 'admin') {
        updates.is_setup_completed = false;
      }

      const { data: updatedProfile, error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', sessionUser.id)
        .select()
        .single();

      if (profileError) throw profileError;

      setProfile(updatedProfile as Profile);
      setEditFullName(updatedProfile.full_name || '');
      setEditWorkingHours(Number(updatedProfile.working_hours || 9.5).toFixed(1));
      setEditBreakTime(String(updatedProfile.break_time || 0));
      setEditJobRole(updatedProfile.job_role || '');
      setProfileSignInTime(updatedProfile.default_sign_in || '09:30');
      setProfileSignOutTime(updatedProfile.default_sign_out || '19:00');

      setShowFirstTimePasswordModal(false);
      localStorage.removeItem(`first_time_modal_start_time_${sessionUser.id}`);
      
      const needsProfileSetup = updatedProfile.role !== 'admin' && !updatedProfile.is_setup_completed;
      if (!needsProfileSetup) {
        setShowWelcomePopup(true);
        setTimeout(() => {
          setShowWelcomePopup(false);
        }, 10000);
      }
      
      setMessage({ type: 'success', text: 'পাসওয়ার্ড পরিবর্তন সফল হয়েছে!' });
    } catch (err) {
      setFirstTimePasswordError((err as Error).message || 'পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে।');
    } finally {
      setFirstTimePasswordSubmitting(false);
    }
  };

  // Create User Account (Admin feature)
  const handleCreateNewUser = async () => {
    if (!newStaffUsername || !newStaffPassword || !newStaffFullName) {
      setMessage({ type: 'error', text: 'সমস্ত ফিল্ড পূরণ করুন!' });
      return;
    }
    setCreatingUser(true);
    try {
      const derivedEmail = `${newStaffUsername.toLowerCase().trim()}@office.local`;
      const { data: newUserId, error } = await supabase.rpc('create_new_user', {
        p_email: derivedEmail,
        p_password: newStaffPassword,
        p_username: newStaffUsername.toUpperCase(),
        p_role: newStaffRole,
        p_full_name: newStaffFullName,
        p_needs_supervisor_approval: newStaffNeedsApproval,
        p_allow_reserve: newStaffAllowReserve,
        p_allow_overtime: newStaffAllowOvertime,
      });
      if (error) throw error;

      if (newUserId) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            job_role: newStaffJobRole,
            working_hours: parseFloat(newStaffWorkingHours) || 9.5,
            break_time: parseInt(newStaffBreakTime) || 10,
            default_sign_in: newStaffSignInTime || '13:00',
            default_sign_out: newStaffSignOutTime || '22:30',
            eligible_office_leave: newStaffEligibleOfficeLeave,
            eligible_govt_holiday: newStaffEligibleGovtHoliday,
          })
          .eq('id', newUserId);
        if (updateError) {
          console.error('Error setting profile defaults:', updateError);
        }
      }
      
      setMessage({ type: 'success', text: `নতুন স্টাফ "${newStaffFullName}" সফলভাবে তৈরি করা হয়েছে!` });
      setShowCreateUserModal(false);
      setNewStaffPassword('');
      setNewStaffConfirmPassword('');
      setNewStaffUsername('');
      setNewStaffRole('user');
      setNewStaffFullName('');
      setNewStaffNeedsApproval(false);
      setNewStaffAllowReserve(false);
      setNewStaffAllowOvertime(false);
      
      // Reset additional fields
      setNewStaffJobRole('IT Officer');
      setNewStaffWorkingHours('9.5');
      setNewStaffBreakTime('10');
      setNewStaffSignInTime('13:00');
      setNewStaffSignOutTime('22:30');
      setNewStaffEligibleOfficeLeave(true);
      setNewStaffEligibleGovtHoliday(true);
      
      fetchRecords();
    } catch (err) {
      setMessage({ type: 'error', text: 'ইউজার তৈরি করতে ব্যর্থ: ' + (err as Error).message });
    } finally {
      setCreatingUser(false);
    }
  };

  // Reset staff credentials (Admin feature)
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

  // Delete User Account (Admin feature)
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

  // Approve Profile update changes
  const handleApproveProfileChangeRequest = async (profileId: string, approve: boolean) => {
    if (setApprovingIds) {
      setApprovingIds(prev => new Set(prev).add(profileId));
    }
    try {
      let updates: Record<string, unknown> = {};
      if (approve) {
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

      sendPushNotification({
        userIds: [profileId],
        title: `প্রোফাইল পরিবর্তন ${approve ? 'অনুমোদিত ✅' : 'প্রত্যাখ্যাত ❌'}`,
        body: `আপনার প্রোফাইল তথ্য পরিবর্তনের অনুরোধটি অ্যাডমিন ${approve ? 'অনুমোদন' : 'প্রত্যাখ্যান'} করেছেন।`,
        url: '/'
      }).catch(err => console.error('Error sending profile change push:', err));
      
      const updateLocalState = () => {
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
      };

      if (setApprovingIds) {
        setApprovingIds(prev => { const s = new Set(prev); s.delete(profileId); return s; });
      }

      if (approve) {
        if (setApprovedIds) {
          setApprovedIds(prev => new Set(prev).add(profileId));
          setTimeout(() => {
            setApprovedIds(prev => { const s = new Set(prev); s.delete(profileId); return s; });
            updateLocalState();
          }, 1500);
        } else {
          updateLocalState();
        }
      } else {
        updateLocalState();
      }

      setMessage({ type: 'success', text: approve ? 'প্রোফাইল পরিবর্তন অনুমোদন করা হয়েছে।' : 'অনুরোধ প্রত্যাখ্যান করা হয়েছে।' });
    } catch (err) {
      if (setApprovingIds) {
        setApprovingIds(prev => { const s = new Set(prev); s.delete(profileId); return s; });
      }
      setMessage({ type: 'error', text: 'অ্যাকশন সম্পন্ন করতে ব্যর্থ হয়েছে: ' + (err as Error).message });
    }
  };

  // Convert Short Leave to Full Leave
  const handleConvertShortLeaveToFullLeave = async (targetUserId: string, workingHours: number, shortMins: number) => {
    if (shortMins <= 0 || workingHours <= 0) return;
    const workingMins = workingHours * 60;
    if (shortMins < workingMins) {
      setMessage({ type: 'error', text: 'শর্ট লিভের পরিমাণ দৈনিক কর্মঘণ্টার চেয়ে কম!' });
      return;
    }
    
    setProfileSubmitting(true);
    try {
      const staff = profilesList.find(p => p.id === targetUserId) || (profile && profile.id === targetUserId ? profile : null);
      if (!staff) throw new Error('স্টাফ খুঁজে পাওয়া যায়নি');
      
      const currentDays = staff.converted_short_leaves_days || 0;
      const currentHours = staff.converted_short_leaves_hours || 0;
      
      const daysToConvert = Math.floor(shortMins / workingMins);
      const hoursToConvert = daysToConvert * workingHours;

      // Ask for adjustment category if they are eligible for govt holiday and have reserve entries
      let adjustCategory = 'Office Leave';
      if (staff.eligible_govt_holiday !== false) {
        const { data: userResps } = await supabase
          .from('govt_holiday_responses')
          .select('id')
          .eq('user_id', targetUserId)
          .eq('response', 'reserve');
          
        const reserveCount = userResps ? userResps.length : 0;
        if (reserveCount > 0) {
          const choice = prompt(
            `কনভার্ট করা ${daysToConvert} দিন ছুটি কোন ক্যাটাগরি থেকে অ্যাডজাস্ট করতে চান?\n\n` +
            `১ লিখতে '1' লিখুন: অফিস বরাদ্দকৃত ছুটি (Office Leave)\n` +
            `২ লিখতে '2' লিখুন: সরকারি রিজার্ভ ছুটি (Reserve Holiday)`,
            "1"
          );
          if (choice === '2') {
            adjustCategory = 'Govt Holiday';
          }
        }
      }

      // Find free dates starting from today and going backward
      const datesToInsert: string[] = [];
      const currentDate = new Date();
      while (datesToInsert.length < daysToConvert) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const { data: existingEntry } = await supabase
          .from('chuti')
          .select('id')
          .eq('user_id', targetUserId)
          .eq('date', dateStr)
          .maybeSingle();
          
        if (!existingEntry) {
          datesToInsert.push(dateStr);
        }
        currentDate.setDate(currentDate.getDate() - 1);
      }

      // Insert chuti records for the converted days
      const recordsToInsert = datesToInsert.map(d => ({
        user_id: targetUserId,
        date: d,
        leave_type: 'Full Leave',
        adjustment: true,
        status: 'approved',
        comment: `Adjusted: ${adjustCategory} | Converted from Short Leave`
      }));

      const { error: insertError } = await supabase
        .from('chuti')
        .insert(recordsToInsert);

      if (insertError) throw insertError;
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          converted_short_leaves_days: currentDays + daysToConvert,
          converted_short_leaves_hours: currentHours + hoursToConvert
        })
        .eq('id', targetUserId);
        
      if (profileError) throw profileError;
      
      setMessage({ 
        type: 'success', 
        text: `সফলভাবে ${hoursToConvert} ঘণ্টা শর্ট লিভ ${daysToConvert} দিন ফুল লিভে কনভার্ট করা হয়েছে এবং ${adjustCategory === 'Govt Holiday' ? 'সরকারি রিজার্ভ' : 'অফিস বরাদ্দকৃত'} ছুটির সাথে অ্যাডজাস্ট করা হয়েছে!` 
      });
      fetchRecords();
    } catch (err) {
      setMessage({ type: 'error', text: 'কনভার্ট করতে ব্যর্থ: ' + (err as Error).message });
    } finally {
      setProfileSubmitting(false);
    }
  };

  return {
    showWelcomePopup,
    setShowWelcomePopup,

    showFirstTimePasswordModal,
    setShowFirstTimePasswordModal,
    firstTimePassword,
    setFirstTimePassword,
    firstTimeConfirmPassword,
    setFirstTimeConfirmPassword,
    firstTimePasswordSubmitting,
    firstTimePasswordError,
    setFirstTimePasswordError,


    setupFullName,
    setSetupFullName,
    setupUsername,
    setSetupUsername,
    setupWorkingHours,
    setSetupWorkingHours,
    setupBreakTime,
    setSetupBreakTime,
    setupJobRole,
    setSetupJobRole,
    setupSignInTime,
    setSetupSignInTime,
    setupSignOutTime,
    setSetupSignOutTime,
    setupSubmitting,
    setupError,

    showCreateUserModal,
    setShowCreateUserModal,

    newStaffPassword,
    setNewStaffPassword,
    newStaffConfirmPassword,
    setNewStaffConfirmPassword,
    newStaffUsername,
    setNewStaffUsername,
    newStaffRole,
    setNewStaffRole,
    newStaffFullName,
    setNewStaffFullName,
    newStaffNeedsApproval,
    setNewStaffNeedsApproval,
    newStaffAllowReserve,
    setNewStaffAllowReserve,
    newStaffAllowOvertime,
    setNewStaffAllowOvertime,
    creatingUser,
    newStaffJobRole,
    setNewStaffJobRole,
    newStaffWorkingHours,
    setNewStaffWorkingHours,
    newStaffBreakTime,
    setNewStaffBreakTime,
    newStaffSignInTime,
    setNewStaffSignInTime,
    newStaffSignOutTime,
    setNewStaffSignOutTime,
    newStaffEligibleOfficeLeave,
    setNewStaffEligibleOfficeLeave,
    newStaffEligibleGovtHoliday,
    setNewStaffEligibleGovtHoliday,

    showCredentialsModal,
    setShowCredentialsModal,
    credTargetUserId,
    setCredTargetUserId,
    credNewUsername,
    setCredNewUsername,
    credNewPassword,
    setCredNewPassword,
    credConfirmPassword,
    setCredConfirmPassword,
    updatingCredentials,

    showDeleteUserModal,
    setShowDeleteUserModal,
    deleteTargetUser,
    setDeleteTargetUser,
    deletingUser,

    showProfileSettingsModal,
    setShowProfileSettingsModal,
    editingStaffProfileId,
    setEditingStaffProfileId,
    isCodenameEditable,
    setIsCodenameEditable,
    editUsername,
    setEditUsername,
    editFullName,
    setEditFullName,
    editJobRole,
    setEditJobRole,
    editWorkingHours,
    setEditWorkingHours,
    editBreakTime,
    setEditBreakTime,
    profileSignInTime,
    setProfileSignInTime,
    profileSignOutTime,
    setProfileSignOutTime,
    editNeedsApproval,
    setEditNeedsApproval,
    editAllowReserve,
    setEditAllowReserve,
    editAllowOvertime,
    setEditAllowOvertime,
    editEligibleOfficeLeave,
    setEditEligibleOfficeLeave,
    editEligibleGovtHoliday,
    setEditEligibleGovtHoliday,
    isEditRequestMode,
    setIsEditRequestMode,
    profileSubmitting,
    editMaxFullLeaves,
    setEditMaxFullLeaves,

    // Handlers
    handleUpdateSettings,
    handleSetupSubmit,
    handleFirstTimeSetupSubmit,
    handleCreateNewUser,
    handleUpdateCredentials,
    handleDeleteUser,
    handleApproveProfileChangeRequest,
    handleConvertShortLeaveToFullLeave,
  };
};
