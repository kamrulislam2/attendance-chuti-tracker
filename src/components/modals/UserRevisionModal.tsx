'use client';

import React from 'react';
import { Edit, AlertTriangle, RefreshCw } from 'lucide-react';
import { Profile } from '@/types';
import { ChutiRecord } from '@/utils/offlineSync';
import { getCleanComment } from '@/utils/dashboardHelpers';
import { ChutiFormFields } from '../ChutiFormFields';

interface UserRevisionModalProps {
  showUserRevisionModal: boolean;
  setShowUserRevisionModal: (val: boolean) => void;
  revisionRecord: ChutiRecord | null;
  setRevisionRecord: (val: ChutiRecord | null) => void;
  revisionDate: string;
  setRevisionDate: (val: string) => void;
  revisionLeaveType: string;
  setRevisionLeaveType: (val: string) => void;
  revisionAdjustment: boolean;
  setRevisionAdjustment: (val: boolean) => void;
  revisionAdjustShortLeave: boolean;
  setRevisionAdjustShortLeave: (val: boolean) => void;
  revisionSignInTime: string;
  setRevisionSignInTime: (val: string) => void;
  revisionSignOutTime: string;
  setRevisionSignOutTime: (val: string) => void;
  revisionLeaveHour: string;
  setRevisionLeaveHour: (val: string) => void;
  revisionComment: string;
  setRevisionComment: (val: string) => void;
  handleUserSubmitRevision: (e: React.FormEvent) => void;
  profile: Profile | null;
  submitting: boolean;
}

export function UserRevisionModal({
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
  revisionComment,
  setRevisionComment,
  handleUserSubmitRevision,
  profile,
  submitting,
}: UserRevisionModalProps) {
  if (!showUserRevisionModal || !revisionRecord) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden font-sans">
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
          <ChutiFormFields
            date={revisionDate}
            setDate={setRevisionDate}
            leaveType={revisionLeaveType}
            setLeaveType={setRevisionLeaveType}
            signInTime={revisionSignInTime}
            setSignInTime={setRevisionSignInTime}
            signOutTime={revisionSignOutTime}
            setSignOutTime={setRevisionSignOutTime}
            leaveHour={revisionLeaveHour}
            setLeaveHour={setRevisionLeaveHour}
            adjustment={revisionAdjustment}
            setAdjustment={setRevisionAdjustment}
            adjustShortLeave={revisionAdjustShortLeave}
            setAdjustShortLeave={setRevisionAdjustShortLeave}
            comment={revisionComment}
            setComment={setRevisionComment}
            allowOvertime={profile?.allow_overtime || revisionLeaveType === 'Overtime'}
          />

          {revisionRecord.comment && (
            <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs leading-relaxed">
              <div className="font-semibold flex items-center gap-1.5 mb-1">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> রিভিশন নির্দেশনা (Supervisor/Admin Remark):
              </div>
              <p className="text-slate-350">{getCleanComment(revisionRecord.comment)}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                setShowUserRevisionModal(false);
                setRevisionRecord(null);
              }}
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
  );
}
