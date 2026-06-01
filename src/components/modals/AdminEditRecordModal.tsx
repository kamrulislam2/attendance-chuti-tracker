'use client';

import React from 'react';
import { Edit } from 'lucide-react';
import { DateInput } from '@/components/DateInput';
import { Profile } from '@/types';
import { ChutiRecord } from '@/utils/offlineSync';

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
  adminEditReserveHoliday: string;
  setAdminEditReserveHoliday: (val: string) => void;
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
  adminEditReserveHoliday,
  setAdminEditReserveHoliday,
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
              className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Short Leave">Short Leave</option>
              <option value="Full Leave">Full Leave</option>
              {(targetUserProfile?.allow_overtime || adminEditLeaveType === 'Overtime') && <option value="Overtime">Overtime</option>}
              {(targetUserProfile?.allow_reserve || adminEditLeaveType === 'Reserve') && <option value="Reserve">Reserve</option>}
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
                    className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">শেষের সময়</label>
                  <input
                    type="time"
                    required
                    value={adminEditSignOutTime}
                    onChange={(e) => setAdminEditSignOutTime(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-850 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-955/60 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="block text-xs font-medium text-white">অ্যাডজাস্টমেন্ট (Adjustment)</span>
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
                      <span className="block text-xs font-medium text-white">Adjust with Short Leave?</span>
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
                className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">মন্তব্য/কারণ</label>
            <textarea
              placeholder="ছুটির সংক্ষিপ্ত বিবরণ লিখুন..."
              value={adminEditComment}
              onChange={(e) => setAdminEditComment(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
            />
          </div>

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
