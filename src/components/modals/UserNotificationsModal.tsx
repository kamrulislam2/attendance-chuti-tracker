'use client';

import React from 'react';
import { Bell, Edit } from 'lucide-react';
import { Profile } from '@/types';
import { ChutiRecord } from '@/utils/offlineSync';

interface UserNotificationsModalProps {
  showUserNotificationsModal: boolean;
  setShowUserNotificationsModal: (val: boolean) => void;
  userNotificationsList: any[];
  adminActiveTab: 'user' | 'admin';
  setShowLeaveApprovalModal: (val: boolean) => void;
  setShowSupervisorApprovalModal: (val: boolean) => void;
  profile: Profile | null;
  setRevisionRecord: (val: ChutiRecord | null) => void;
  setRevisionDate: (val: string) => void;
  setRevisionLeaveType: (val: string) => void;
  setRevisionAdjustment: (val: boolean) => void;
  setRevisionAdjustShortLeave: (val: boolean) => void;
  setRevisionSignInTime: (val: string) => void;
  setRevisionSignOutTime: (val: string) => void;
  setRevisionLeaveHour: (val: string) => void;
  setRevisionReserveHoliday: (val: string) => void;
  setRevisionComment: (val: string) => void;
  setShowUserRevisionModal: (val: boolean) => void;
}

export function UserNotificationsModal({
  showUserNotificationsModal,
  setShowUserNotificationsModal,
  userNotificationsList,
  adminActiveTab,
  setShowLeaveApprovalModal,
  setShowSupervisorApprovalModal,
  profile,
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
}: UserNotificationsModalProps) {
  if (!showUserNotificationsModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-lg p-6 relative overflow-hidden font-sans">
        <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[80px] pointer-events-none" />
        
        <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 mb-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-400" /> ছুটির নোটিফিকেশনসমূহ
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
              <div key={n.id} className="p-4 bg-slate-955/60 border border-slate-855 rounded-xl flex flex-col gap-3 shadow-md">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500 font-mono font-medium">
                      {n.timestamp ? new Date(n.timestamp).toLocaleString('bn-BD', { hour12: true }) : ''}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold w-fit ${
                      n.record?.leave_type === 'Full Leave' 
                        ? 'bg-red-955 border border-red-900 text-red-400' 
                        : n.record?.leave_type === 'Reserve'
                        ? 'bg-purple-955 border border-purple-900 text-purple-400'
                        : n.record?.leave_type === 'Overtime'
                        ? 'bg-blue-955 border border-blue-900 text-blue-400'
                        : n.record?.leave_type === 'Short Leave'
                        ? 'bg-amber-955 border border-amber-900 text-amber-400'
                        : 'bg-slate-955 border border-slate-900 text-slate-400'
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
                      className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all border border-amber-700 shadow-md shrink-0 font-sans"
                    >
                      <Edit className="h-3.5 w-3.5" /> সংশোধন করুন
                    </button>
                  )}
                </div>

                <div className="p-3 bg-slate-900/60 border border-slate-800/80 text-slate-300 rounded-lg text-xs leading-relaxed font-sans">
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
  );
}
