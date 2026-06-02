'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Profile, ChutiRecordWithProfile } from '@/types';
import { ChutiRecord, saveOfflineUpdate } from '@/utils/offlineSync';
import { formatDate, formatTimeToAMPM, getDetailedLeaveLabel } from '@/utils/dashboardHelpers';
import { sendPushNotification } from '@/utils/webPushHelper';

interface useAdjustmentOperationsParams {
  profile: Profile | null;
  adminActiveTab: 'user' | 'admin';
  sessionUser: any;
  isOnline: boolean;
  fetchRecords: () => Promise<void>;
  setUserRecords: React.Dispatch<React.SetStateAction<ChutiRecord[]>>;
  setAdminRecords: React.Dispatch<React.SetStateAction<ChutiRecordWithProfile[]>>;
  setMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void;
  submitting: boolean;
  setSubmitting: (val: boolean) => void;
  setApprovingIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setApprovedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export const useAdjustmentOperations = ({
  profile,
  adminActiveTab,
  sessionUser,
  isOnline,
  fetchRecords,
  setUserRecords,
  setAdminRecords,
  setMessage,
  submitting,
  setSubmitting,
  setApprovingIds,
  setApprovedIds,
}: useAdjustmentOperationsParams) => {
  // --- Adjustment activation states ---
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentRecord, setAdjustmentRecord] = useState<ChutiRecord | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'full' | 'partial'>('full');
  const [partialAdjustmentTime, setPartialAdjustmentTime] = useState('02:00');
  const [adjustShortLeaveOption, setAdjustShortLeaveOption] = useState(false);

  // --- Adjustment cancel states ---
  const [showCancelAdjustmentModal, setShowCancelAdjustmentModal] = useState(false);
  const [cancelAdjustmentRecord, setCancelAdjustmentRecord] = useState<ChutiRecord | null>(null);

  // Toggle Adjustment Status click trigger
  const handleToggleAdjustmentClick = (record: ChutiRecord) => {
    if (record.adjustment || record.adjusted_hour || record.reserve_adjustment_status === 'pending') {
      setCancelAdjustmentRecord(record);
      setShowCancelAdjustmentModal(true);
    } else {
      setAdjustmentRecord(record);
      setAdjustShortLeaveOption(record.adjust_short_leave === true);
      if (record.leave_type === 'Short Leave') {
        setAdjustmentType('full');
        setPartialAdjustmentTime(record.leave_hour ? record.leave_hour.toString().split('.')[0].substring(0, 5) : '02:00');
      }
      setShowAdjustmentModal(true);
    }
  };

  // Confirm cancel adjustment request
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

  // Save Adjustment details
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
        requestedUpdates = { adjustment: true, adjusted_hour: null, adjust_short_leave: false };
      }

      let updates: Record<string, unknown> = {};
      const existingNotifications = (record.admin_edit_request && typeof record.admin_edit_request === 'object' && 'notifications' in record.admin_edit_request)
        ? (record.admin_edit_request as { notifications?: any[] }).notifications || []
        : [];

      if (isAdmin) {
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

  // Approve Reserve/Overtime Adjustment Request
  const handleApproveReserveAdjustment = async (record: ChutiRecordWithProfile, approve: boolean) => {
    setApprovingIds(prev => new Set(prev).add(record.id));
    try {
      const isCancelRequest = record.admin_edit_request && typeof record.admin_edit_request === 'object' && record.admin_edit_request.adjustment === false;
      const updates: Record<string, unknown> = {};

      if (isCancelRequest) {
        if (approve) {
          updates.reserve_adjustment_status = 'none';
          updates.adjustment = false;
          updates.adjusted_hour = null;
          updates.adjust_short_leave = false;
        } else {
          updates.reserve_adjustment_status = 'approved';
        }
      } else {
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

      const { error } = await supabase
        .from('chuti')
        .update(updates)
        .eq('id', record.id || '');
      
      if (error) throw error;

      if (record?.user_id) {
        sendPushNotification({
          userIds: [record.user_id],
          title: `${titleLabel} ${approve ? 'অনুমোদিত ✅' : 'প্রত্যাখ্যাত ❌'}`,
          body: bodyText,
          url: '/'
        }).catch(err => console.error('Error sending adjustment response push:', err));
      }
      
      const updateLocalState = () => {
        setUserRecords(prev => prev.map(r => r.id === record.id ? { ...r, ...updates } : r));
        setAdminRecords(prev => prev.map(r => r.id === record.id ? { ...r, ...updates } : r));
        fetchRecords();
      };

      setApprovingIds(prev => { const s = new Set(prev); s.delete(record.id); return s; });
      if (approve) {
        setApprovedIds(prev => new Set(prev).add(record.id));
        setTimeout(() => {
          setApprovedIds(prev => { const s = new Set(prev); s.delete(record.id); return s; });
          updateLocalState();
        }, 1500);
      } else {
        updateLocalState();
      }

      setMessage({ type: 'success', text: approve ? 'সমন্বয় অনুমোদন করা হয়েছে।' : 'অনুরোধ প্রত্যাখ্যান করা হয়েছে।' });
    } catch (err) {
      setApprovingIds(prev => { const s = new Set(prev); s.delete(record.id); return s; });
      alert('অ্যাকশন সম্পন্ন করতে ব্যর্থ হয়েছে: ' + (err as Error).message);
    }
  };

  return {
    showAdjustmentModal,
    setShowAdjustmentModal,
    adjustmentRecord,
    setAdjustmentRecord,
    adjustmentType,
    setAdjustmentType,
    partialAdjustmentTime,
    setPartialAdjustmentTime,
    adjustShortLeaveOption,
    setAdjustShortLeaveOption,
    showCancelAdjustmentModal,
    setShowCancelAdjustmentModal,
    cancelAdjustmentRecord,
    setCancelAdjustmentRecord,

    handleToggleAdjustmentClick,
    handleConfirmCancelAdjustment,
    handleSaveAdjustment,
    handleApproveReserveAdjustment,
  };
};
