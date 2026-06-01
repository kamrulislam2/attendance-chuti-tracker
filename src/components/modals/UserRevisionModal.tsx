'use client';

import React from 'react';
import { Edit, AlertTriangle, RefreshCw } from 'lucide-react';
import { DateInput } from '@/components/DateInput';
import { Profile } from '@/types';
import { ChutiRecord } from '@/utils/offlineSync';
import { getCleanComment } from '@/utils/dashboardHelpers';

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
  revisionReserveHoliday: string;
  setRevisionReserveHoliday: (val: string) => void;
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
  revisionReserveHoliday,
  setRevisionReserveHoliday,
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
              className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">শেষের সময়</label>
                <input
                  type="time"
                  required
                  value={revisionSignOutTime}
                  onChange={(e) => setRevisionSignOutTime(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
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
                className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">মন্তব্য/কারণ</label>
            <textarea
              placeholder="সংশোধনের কারণ..."
              value={revisionComment}
              onChange={(e) => setRevisionComment(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
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
