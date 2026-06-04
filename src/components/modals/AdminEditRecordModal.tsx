'use client';

import React from 'react';
import { Edit } from 'lucide-react';
import { Profile } from '@/types';
import { ChutiRecord } from '@/utils/offlineSync';
import { ChutiFormFields } from '../ChutiFormFields';

interface AdminEditRecordModalProps {
  showAdminEditModal: boolean;
  setShowAdminEditModal: (val: boolean) => void;
  profile: Profile | null;
  profilesList: Profile[];
  adminEditRecord: ChutiRecord | null;
  adminEditDate: string;
  setAdminEditDate: (val: string) => void;
  adminEditLeaveType: string;
  setAdminEditLeaveType: (val: string) => void;
  adminEditSignInTime: string;
  setAdminEditSignInTime: (val: string) => void;
  adminEditSignOutTime: string;
  setAdminEditSignOutTime: (val: string) => void;
  adminEditLeaveHour: string;
  setAdminEditLeaveHour: (val: string) => void;
  adminEditAdjustment: boolean;
  setAdminEditAdjustment: (val: boolean) => void;
  adminEditAdjustShortLeave: boolean;
  setAdminEditAdjustShortLeave: (val: boolean) => void;
  adminEditComment: string;
  setAdminEditComment: (val: string) => void;
  handleAdminSaveEdit: (e: React.FormEvent) => void;
}

export function AdminEditRecordModal({
  showAdminEditModal,
  setShowAdminEditModal,
  profile,
  profilesList,
  adminEditRecord,
  adminEditDate,
  setAdminEditDate,
  adminEditLeaveType,
  setAdminEditLeaveType,
  adminEditSignInTime,
  setAdminEditSignInTime,
  adminEditSignOutTime,
  setAdminEditSignOutTime,
  adminEditLeaveHour,
  setAdminEditLeaveHour,
  adminEditAdjustment,
  setAdminEditAdjustment,
  adminEditAdjustShortLeave,
  setAdminEditAdjustShortLeave,
  adminEditComment,
  setAdminEditComment,
  handleAdminSaveEdit,
}: AdminEditRecordModalProps) {
  if (!showAdminEditModal || profile?.role !== 'admin' || !adminEditRecord) return null;

  const targetUserProfile = profilesList.find(p => p.id === adminEditRecord.user_id);

  return (
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

        <form onSubmit={handleAdminSaveEdit} className="space-y-4 font-sans">
          <ChutiFormFields
            date={adminEditDate}
            setDate={setAdminEditDate}
            leaveType={adminEditLeaveType}
            setLeaveType={setAdminEditLeaveType}
            signInTime={adminEditSignInTime}
            setSignInTime={setAdminEditSignInTime}
            signOutTime={adminEditSignOutTime}
            setSignOutTime={setAdminEditSignOutTime}
            leaveHour={adminEditLeaveHour}
            setLeaveHour={setAdminEditLeaveHour}
            adjustment={adminEditAdjustment}
            setAdjustment={setAdminEditAdjustment}
            adjustShortLeave={adminEditAdjustShortLeave}
            setAdjustShortLeave={setAdminEditAdjustShortLeave}
            comment={adminEditComment}
            setComment={setAdminEditComment}
            allowOvertime={targetUserProfile?.allow_overtime || adminEditLeaveType === 'Overtime'}
          />

          <div className="flex gap-3 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setShowAdminEditModal(false)}
              className="flex-1 flex justify-center py-2 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 cursor-pointer transition-all"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 cursor-pointer transition-all"
            >
              সংশোধন সেভ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
