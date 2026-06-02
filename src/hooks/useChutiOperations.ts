'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Profile, ChutiRecordWithProfile, BulkRepresentative } from '@/types';
import { 
  ChutiRecord, 
  saveOfflineRecord, 
  getOfflineRecords, 
  saveOfflineUpdate, 
  saveOfflineDelete, 
  deleteOfflineRecord 
} from '@/utils/offlineSync';
import { formatDate, calculateLeaveOrOvertime } from '@/utils/dashboardHelpers';
import { sendPushNotification } from '@/utils/webPushHelper';

interface useChutiOperationsParams {
  sessionUser: any;
  profile: Profile | null;
  isOnline: boolean;
  fetchRecords: () => Promise<void>;
  checkOfflineQueue: () => Promise<void>;
  userRecords: ChutiRecord[];
  setUserRecords: React.Dispatch<React.SetStateAction<ChutiRecord[]>>;
  adminRecords: ChutiRecordWithProfile[];
  setAdminRecords: React.Dispatch<React.SetStateAction<ChutiRecordWithProfile[]>>;
  setMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void;
  submitting: boolean;
  setSubmitting: (val: boolean) => void;
  profilesList: Profile[];
  approvingIds: Set<string>;
  setApprovingIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  reviewingIds: Set<string>;
  setReviewingIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  approvedIds: Set<string>;
  setApprovedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export const useChutiOperations = ({
  sessionUser,
  profile,
  isOnline,
  fetchRecords,
  checkOfflineQueue,
  userRecords,
  setUserRecords,
  adminRecords,
  setAdminRecords,
  setMessage,
  submitting,
  setSubmitting,
  profilesList,
  approvingIds,
  setApprovingIds,
  reviewingIds,
  setReviewingIds,
  approvedIds,
  setApprovedIds,
}: useChutiOperationsParams) => {
  // --- Form states for Adding Leave ---
  const [showAddLeaveModal, setShowAddLeaveModal] = useState(false);
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
  const [bulkAdjustments, setBulkAdjustments] = useState<boolean[]>([]);
  const [selectedSupervisors, setSelectedSupervisors] = useState<string[]>([]);

  // --- Form states for Revision ---
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

  // --- Deletion States ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<ChutiRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState(false);

  // --- Admin Edit States ---
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

  // --- Supervisor Revision Prompt States ---
  const [showRevisionPromptModal, setShowRevisionPromptModal] = useState(false);
  const [revisionPromptText, setRevisionPromptText] = useState('');
  const [revisionPromptChutiId, setRevisionPromptChutiId] = useState<string | null>(null);
  const [revisionPromptIsSupervisor, setRevisionPromptIsSupervisor] = useState(false);
  const [submittingRevision, setSubmittingRevision] = useState(false);



  // Form setups on mount / leave type change
  useEffect(() => {
    if (leaveType !== 'Full Leave') {
      setBulkDates([]);
      setBulkAdjustments([]);
    }
  }, [leaveType]);

  useEffect(() => {
    if (!showAddLeaveModal) {
      setBulkDates([]);
      setBulkAdjustments([]);
    }
  }, [showAddLeaveModal]);

  // Set default form date to today (respecting local timezone)
  useEffect(() => {
    const offset = new Date().getTimezoneOffset();
    const localDate = new Date(new Date().getTime() - (offset * 60 * 1050)); // ~offset
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

  const handleAddBulkDate = () => {
    if (bulkDates.length + 1 >= 10) {
      alert('সর্বোচ্চ ১০ দিন পর্যন্ত ছুটি একসাথে আবেদন করতে পারবেন!');
      return;
    }
    setBulkDates(prev => [...prev, '']);
    setBulkAdjustments(prev => [...prev, false]);
  };

  const handleUpdateBulkDate = (index: number, val: string) => {
    if (val === date || bulkDates.some((d, idx) => idx !== index && d === val)) {
      alert('এই তারিখটি ইতিমধ্যে নির্বাচন করা হয়েছে!');
      return;
    }
    setBulkDates(prev => prev.map((d, idx) => idx === index ? val : d));
  };

  const handleUpdateBulkAdjustment = (index: number, val: boolean) => {
    setBulkAdjustments(prev => prev.map((adj, idx) => idx === index ? val : adj));
  };

  const handleRemoveBulkDate = (index: number) => {
    setBulkDates(prev => prev.filter((_, idx) => idx !== index));
    setBulkAdjustments(prev => prev.filter((_, idx) => idx !== index));
  };

  // Submit Leave Request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionUser) return;

    setSubmitting(true);
    setMessage(null);

    const isReserve = leaveType === 'Reserve';
    const isFullLeave = leaveType === 'Full Leave';

    // Gather all selected dates with their adjustments
    const datesWithAdjustment = isFullLeave
      ? [
          { date, adjustment },
          ...bulkDates.map((d, idx) => ({ date: d, adjustment: bulkAdjustments[idx] || false }))
        ].filter(item => item.date)
      : [{ date, adjustment }];

    const allDates = datesWithAdjustment.map(item => item.date);

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
      profile?.role === 'supervisor';

    const getRecordForDate = (targetDate: string, targetAdjustment: boolean) => ({
      user_id: sessionUser.id,
      date: targetDate,
      leave_type: leaveType,
      adjustment: isReserve ? false : targetAdjustment,
      adjust_short_leave: (leaveType === 'Overtime' || leaveType === 'Reserve') && targetAdjustment ? adjustShortLeave : false,
      sign_in_time: (isReserve || isFullLeave) ? null : signInTime,
      sign_out_time: (isReserve || isFullLeave) ? null : signOutTime,
      leave_hour: (isReserve || isFullLeave) ? null : `${leaveHour}:00`,
      reserve_holiday: isReserve ? reserveHoliday : null,
      reserve_adjustment_status: isReserve ? (targetAdjustment ? 'pending' : 'none') : 'none',
      status: bypassSupervisor ? 'approved_by_supervisor' : 'pending_supervisor',
      comment: comment || null,
      bulk_id: bulkId,
      admin_edit_request: (!bypassSupervisor && selectedSupervisors.length > 0)
        ? { supervisor_ids: selectedSupervisors }
        : null
    });

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
      try {
        const addedTempRecords: ChutiRecord[] = [];
        for (const item of datesWithAdjustment) {
          const rec = getRecordForDate(item.date, item.adjustment);
          await saveOfflineRecord(rec);
          addedTempRecords.push({
            ...rec,
            id: `temp-${Date.now()}-${item.date}`,
            localId: `local-${Date.now()}-${item.date}`,
            synced: false
          });
        }
        setMessage({ 
          type: 'success', 
          text: 'ইন্টারনেট কানেকশন নেই। ডাটাগুলো অফলাইনে সংরক্ষিত হয়েছে। ইন্টারনেট ফিরে আসলে অটো সিঙ্ক হবে।' 
        });
        checkOfflineQueue();
        setUserRecords(prev => [...addedTempRecords, ...prev]);

        setComment('');
        setReserveHoliday('');
        setAdjustShortLeave(false);
        setBulkDates([]);
        setBulkAdjustments([]);
        setShowAddLeaveModal(false);
      } catch {
        setMessage({ type: 'error', text: 'অফলাইনে ডাটা সেভ করার সময় সমস্যা হয়েছে।' });
      }
      setSubmitting(false);
      return;
    }

    try {
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

      const recordsToInsert = datesWithAdjustment.map(item => getRecordForDate(item.date, item.adjustment));
      const { error: insertError } = await supabase.from('chuti').insert(recordsToInsert);
      if (insertError) throw insertError;

      const targetRoles = bypassSupervisor 
        ? ['admins'] 
        : (selectedSupervisors.length > 0 
            ? [...selectedSupervisors, 'admins'] 
            : ['supervisors', 'admins']);
      const formattedDates = allDates.map(d => formatDate(d)).join(', ');

      sendPushNotification({
        userIds: targetRoles,
        title: 'নতুন ছুটির আবেদন 🔔',
        body: `${profile?.full_name || profile?.username || 'স্টাফ'} ${leaveType}-এর আবেদন করেছেন (তারিখ: ${formattedDates})`,
        url: '/'
      }).catch(err => console.error('Error triggering push notification:', err));

      setMessage({ type: 'success', text: 'আপনার ছুটির তথ্য সফলভাবে সাবমিট করা হয়েছে!' });
      fetchRecords();

      setComment('');
      setReserveHoliday('');
      setAdjustShortLeave(false);
      setBulkDates([]);
      setBulkAdjustments([]);
      setSelectedSupervisors([]);
      setShowAddLeaveModal(false);
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message || 'ডাটা সাবমিট করার সময় ত্রুটি ঘটেছে।' });
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!recordToDelete || !sessionUser) return;
    const record = recordToDelete;
    setDeletingRecord(true);
    
    try {
      if (record.id && typeof record.id === 'string' && record.id.startsWith('temp-')) {
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

      if (!isOnline) {
        if (record.id) {
          await saveOfflineDelete(record.id);
          setUserRecords(prev => prev.filter(r => r.id !== record.id));
          setAdminRecords(prev => prev.filter(r => r.id !== record.id));
          checkOfflineQueue();
          setMessage({ type: 'success', text: 'অফলাইনে রেকর্ডটি ডিলিট করার অনুরোধ জমা হয়েছে। অনলাইনে এলে সিঙ্ক হবে।' });
        }
        return;
      }

      const { data, error } = await supabase.from('chuti').delete().eq('id', record.id || '').select();
      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('রেকর্ডটি ডিলিট করার অনুমতি নেই অথবা রেকর্ডটি ডেটাবেজে খুঁজে পাওয়া যায়নি।');
      }
      
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

  // User submits revision for a revision-requested record
  const handleUserSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionRecord) return;
    setSubmitting(true);

    try {
      const isReserve = revisionLeaveType === 'Reserve';
      const isFullLeave = revisionLeaveType === 'Full Leave';

      const bypassSupervisor = 
        profile?.needs_supervisor_approval === false ||
        profile?.role === 'admin' ||
        profile?.role === 'supervisor';

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

  // Submit Revision Reason (Supervisors or Admins)
  const submitRevisionWithReason = async () => {
    const chutiId = revisionPromptChutiId;
    if (!chutiId) return;
    const reasonText = revisionPromptText.trim();
    if (!reasonText) {
      alert('সংশোধনের জন্য পাঠানোর পূর্বে কারণ/মন্তব্য লেখা আবশ্যক!');
      return;
    }
    
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

          const updates = { 
            status: 'needs_review',
            comment: updatedComment,
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

          setUserRecords(prev => prev.map(r => r.id === t.id ? { ...r, ...updates } : r));
          setAdminRecords(prev => prev.map(r => r.id === t.id ? { ...r, ...updates } : r));

          const { error } = await supabase
            .from('chuti')
            .update(updates)
            .eq('id', t.id);

          if (error) throw error;
        }));

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

  // Supervisor Approvals
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
        targets = adminRecords.filter(r => r.bulk_id === bulkId);
      } else {
        const target = (adminRecords.find(r => r.id === chutiId) || userRecords.find(r => r.id === chutiId)) as ChutiRecordWithProfile | undefined;
        if (target) targets = [target];
      }

      if (targets.length === 0) throw new Error('রেকর্ড খুঁজে পাওয়া যায়নি।');

      const supervisorName = profile?.full_name ? `সুপারভাইজার ${profile.full_name}` : 'সুপারভাইজার';
      const supervisorUsername = profile?.username || 'Supervisor';
      const user_id = targets[0].user_id;
      const leave_type = targets[0].leave_type;
      const formattedDates = targets.map(t => formatDate(t.date)).join(', ');

      await Promise.all(targets.map(async (t) => {
        const updatedCommentPrefix = `${supervisorUsername} Approved`;
        let updatedComment = t.comment || '';
        updatedComment = updatedComment ? `${updatedCommentPrefix} | ${updatedComment}` : updatedCommentPrefix;

        const updates = { 
          status: 'approved_by_supervisor',
          comment: updatedComment 
        };

        const { error } = await supabase
          .from('chuti')
          .update(updates)
          .eq('id', t.id);

        if (error) throw error;
      }));

      // Trigger Web Push Notification to Admins
      sendPushNotification({
        userIds: ['admins'],
        title: 'সুপারভাইজার অনুমোদিত আবেদন 🔔',
        body: `${supervisorName} ${targets[0].profiles?.username ? `@${targets[0].profiles.username.toUpperCase()}` : 'স্টাফ'}-এর (${leave_type}) আবেদনটি অনুমোদন করেছেন (তারিখ: ${formattedDates})`,
        url: '/'
      }).catch(err => console.error('Error triggering push notification for supervisor approval:', err));

      const updateLocalState = () => {
        targets.forEach(t => {
          const updatedCommentPrefix = `${supervisorUsername} Approved`;
          let updatedComment = t.comment || '';
          updatedComment = updatedComment ? `${updatedCommentPrefix} | ${updatedComment}` : updatedCommentPrefix;

          const updates = { 
            status: 'approved_by_supervisor',
            comment: updatedComment 
          };

          setUserRecords(prev => prev.map(r => r.id === t.id ? { ...r, ...updates } : r));
          setAdminRecords(prev => prev.map(r => r.id === t.id ? { ...r, ...updates } : r));
        });
        fetchRecords();
      };

      setApprovingIds(prev => { const s = new Set(prev); s.delete(chutiId); return s; });
      setApprovedIds(prev => new Set(prev).add(chutiId));
      setTimeout(() => {
        setApprovedIds(prev => { const s = new Set(prev); s.delete(chutiId); return s; });
        updateLocalState();
      }, 1500);

      setMessage({ type: 'success', text: 'ছুটির আবেদনটি সুপারভাইজার সফলভাবে অনুমোদন করেছেন।' });
    } catch (err) {
      setApprovingIds(prev => { const s = new Set(prev); s.delete(chutiId); return s; });
      alert('অনুমোদন করতে ব্যর্থ হয়েছে: ' + (err as Error).message);
    }
  };

  // Admin Approvals
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
        targets = adminRecords.filter(r => r.bulk_id === bulkId);
      } else {
        const target = (adminRecords.find(r => r.id === chutiId) || userRecords.find(r => r.id === chutiId)) as ChutiRecordWithProfile | undefined;
        if (target) targets = [target];
      }

      if (targets.length === 0) throw new Error('রেকর্ড খুঁজে পাওয়া যায়নি।');

      const adminName = profile?.full_name ? `অ্যাডমিন ${profile.full_name}` : 'অ্যাডমিন';
      const adminUsername = profile?.username || 'Admin';
      const user_id = targets[0].user_id;
      const leave_type = targets[0].leave_type;
      const formattedDates = targets.map(t => formatDate(t.date)).join(', ');

      await Promise.all(targets.map(async (t) => {
        const updatedCommentPrefix = `${adminUsername} Approved`;
        let updatedComment = t.comment || '';
        updatedComment = updatedComment ? `${updatedCommentPrefix} | ${updatedComment}` : updatedCommentPrefix;

        const newNotification = {
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
          type: 'approved',
          timestamp: new Date().toISOString(),
          title: 'ছুটির আবেদন অনুমোদিত ✅',
          body: `অ্যাডমিন আপনার (${formatDate(t.date)}) তারিখের ${t.leave_type} আবেদনটি অনুমোদন করেছেন।`
        };
        const existingNotifications = (t.admin_edit_request && typeof t.admin_edit_request === 'object' && 'notifications' in t.admin_edit_request)
          ? (t.admin_edit_request as { notifications?: any[] }).notifications || []
          : [];

        const updates = { 
          status: 'approved',
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

      if (user_id) {
        sendPushNotification({
          userIds: [user_id],
          title: 'ছুটির আবেদন অনুমোদিত ✅',
          body: `অ্যাডমিন আপনার ${leave_type} আবেদনটি অনুমোদন করেছেন (তারিখ: ${formattedDates})।`,
          url: '/'
        }).catch(err => console.error('Error sending push to staff:', err));
      }

      const updateLocalState = () => {
        targets.forEach(t => {
          const updatedCommentPrefix = `${adminUsername} Approved`;
          let updatedComment = t.comment || '';
          updatedComment = updatedComment ? `${updatedCommentPrefix} | ${updatedComment}` : updatedCommentPrefix;

          const newNotification = {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
            type: 'approved',
            timestamp: new Date().toISOString(),
            title: 'ছুটির আবেদন অনুমোদিত ✅',
            body: `অ্যাডমিন আপনার (${formatDate(t.date)}) তারিখের ${t.leave_type} আবেদনটি অনুমোদন করেছেন।`
          };
          const existingNotifications = (t.admin_edit_request && typeof t.admin_edit_request === 'object' && 'notifications' in t.admin_edit_request)
            ? (t.admin_edit_request as { notifications?: any[] }).notifications || []
            : [];

          const updates = { 
            status: 'approved',
            comment: updatedComment,
            admin_edit_request: {
              ...(t.admin_edit_request || {}),
              notifications: [...existingNotifications, newNotification]
            }
          };

          setUserRecords(prev => prev.map(r => r.id === t.id ? { ...r, ...updates } : r));
          setAdminRecords(prev => prev.map(r => r.id === t.id ? { ...r, ...updates } : r));
        });
        fetchRecords();
      };

      setApprovingIds(prev => { const s = new Set(prev); s.delete(chutiId); return s; });
      setApprovedIds(prev => new Set(prev).add(chutiId));
      setTimeout(() => {
        setApprovedIds(prev => { const s = new Set(prev); s.delete(chutiId); return s; });
        updateLocalState();
      }, 1500);

      setMessage({ type: 'success', text: 'ছুটির আবেদনটি অ্যাডমিন সফলভাবে অনুমোদন করেছেন।' });
    } catch (err) {
      setApprovingIds(prev => { const s = new Set(prev); s.delete(chutiId); return s; });
      alert('অনুমোদন করতে ব্যর্থ হয়েছে: ' + (err as Error).message);
    }
  };

  const triggerDeleteRecord = (record: ChutiRecord) => {
    setRecordToDelete(record);
    setShowDeleteModal(true);
  };

  return {
    triggerDeleteRecord,
    // states
    showAddLeaveModal,
    setShowAddLeaveModal,
    date,
    setDate,
    leaveType,
    setLeaveType,
    adjustment,
    setAdjustment,
    adjustShortLeave,
    setAdjustShortLeave,
    signInTime,
    setSignInTime,
    signOutTime,
    setSignOutTime,
    leaveHour,
    setLeaveHour,
    reserveHoliday,
    setReserveHoliday,
    comment,
    setComment,
    selectedSupervisors,
    setSelectedSupervisors,
    bulkDates,
    setBulkDates,
    bulkAdjustments,
    setBulkAdjustments,

    showUserRevisionModal,
    setShowUserRevisionModal,
    revisionRecord,
    setRevisionRecord,
    revisionDate,
    setRevisionDate,
    revisionLeaveType,
    setRevisionLeaveType,
    revisionAdjustment,
    setRevisionAdjustment,
    revisionAdjustShortLeave,
    setRevisionAdjustShortLeave,
    revisionSignInTime,
    setRevisionSignInTime,
    revisionSignOutTime,
    setRevisionSignOutTime,
    revisionLeaveHour,
    setRevisionLeaveHour,
    revisionReserveHoliday,
    setRevisionReserveHoliday,
    revisionComment,
    setRevisionComment,

    showDeleteModal,
    setShowDeleteModal,
    recordToDelete,
    setRecordToDelete,
    deletingRecord,

    showAdminEditModal,
    setShowAdminEditModal,
    adminEditRecord,
    setAdminEditRecord,
    adminEditDate,
    setAdminEditDate,
    adminEditLeaveType,
    setAdminEditLeaveType,
    adminEditAdjustment,
    setAdminEditAdjustment,
    adminEditSignInTime,
    setAdminEditSignInTime,
    adminEditSignOutTime,
    setAdminEditSignOutTime,
    adminEditLeaveHour,
    setAdminEditLeaveHour,
    adminEditReserveHoliday,
    setAdminEditReserveHoliday,
    adminEditComment,
    setAdminEditComment,
    adminEditAdjustShortLeave,
    setAdminEditAdjustShortLeave,

    showRevisionPromptModal,
    setShowRevisionPromptModal,
    revisionPromptText,
    setRevisionPromptText,
    revisionPromptChutiId,
    setRevisionPromptChutiId,
    revisionPromptIsSupervisor,
    setRevisionPromptIsSupervisor,
    submittingRevision,

    approvingIds,
    reviewingIds,
    approvedIds,

    // handlers
    handleAddBulkDate,
    handleUpdateBulkDate,
    handleUpdateBulkAdjustment,
    handleRemoveBulkDate,
    handleSubmit,
    handleConfirmDelete,
    handleUserSubmitRevision,
    handleAdminSaveEdit,
    submitRevisionWithReason,
    handleSupervisorApproveChuti,
    handleApproveChutiRequest,
  };
};
