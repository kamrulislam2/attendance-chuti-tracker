'use client';

import React from 'react';
import { Bell, CheckCircle, RefreshCw } from 'lucide-react';
import { Profile, ChutiRecordWithProfile, BulkRepresentative } from '@/types';
import { formatDate, formatTimeToAMPM } from '@/utils/dashboardHelpers';

interface AdminLeaveApprovalModalProps {
  showLeaveApprovalModal: boolean;
  setShowLeaveApprovalModal: (val: boolean) => void;
  profile: Profile | null;
  groupedChutiRequests: BulkRepresentative[];
  profilesList: Profile[];
  reviewingIds: Set<string>;
  approvedIds: Set<string>;
  approvingIds: Set<string>;
  handleApproveChutiRequest: (id: string, approve: boolean) => void;
  pendingReserveRequests: ChutiRecordWithProfile[];
  handleApproveReserveAdjustment: (record: ChutiRecordWithProfile, approve: boolean) => void;
  pendingProfileRequests: Profile[];
  handleApproveProfileChangeRequest: (id: string, approve: boolean) => void;
}

export function AdminLeaveApprovalModal({
  showLeaveApprovalModal,
  setShowLeaveApprovalModal,
  profile,
  groupedChutiRequests,
  profilesList,
  reviewingIds,
  approvedIds,
  approvingIds,
  handleApproveChutiRequest,
  pendingReserveRequests,
  handleApproveReserveAdjustment,
  pendingProfileRequests,
  handleApproveProfileChangeRequest,
}: AdminLeaveApprovalModalProps) {
  if (!showLeaveApprovalModal || profile?.role !== 'admin') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col relative overflow-hidden font-sans">
        <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-amber-900/10 blur-[80px] pointer-events-none" />
        
        <div className="flex justify-between items-center border-b border-slate-800/80 p-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-400 font-semibold" /> নোটিফিকেশন প্যানেল (Admin)
          </h3>
          <button 
            onClick={() => setShowLeaveApprovalModal(false)}
            className="text-slate-450 hover:text-white text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="p-4 rounded-xl bg-slate-955/40 border border-slate-800/80 text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-amber-400">💡 তথ্য সংশোধনের নিয়মাবলী:</p>
            <p>সুপারভাইজার বা অ্যাডমিন সরাসরি ছুটির অনুরোধ প্রত্যাখ্যান (Reject) করতে পারবেন না। তথ্যে ভুল বা সংশোধন প্রয়োজন হলে <strong>'রিভিশন পাঠান (Needs Review)'</strong> বাটনে ক্লিক করে ইউজারের কাছে সংশোধনের জন্য পাঠানো যাবে। ইউজার তথ্য সংশোধন করে পুনরায় সাবমিট করলে তা পুনরায় সুপারভাইজারের অনুমোদন হয়ে অ্যাডমিনের কাছে আসবে।</p>
          </div>

          {/* Section 1: Leave Approvals */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> ছুটির অনুরোধসমূহ (Pending Admin Approval)
            </h4>
            {groupedChutiRequests.length === 0 ? (
              <div className="text-center py-6 bg-slate-955/40 border border-slate-850 rounded-xl text-slate-500 text-xs font-medium">
                অনুমোদনের জন্য কোনো পেন্ডিং ছুটি নেই।
              </div>
            ) : (
              <div className="space-y-3">
                {groupedChutiRequests.map(r => {
                  const user = profilesList.find(p => p.id === r.user_id);
                  return (
                    <div key={r.id} className="bg-slate-955/60 border border-slate-850 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4">
                      <div className="space-y-1 text-xs text-slate-355">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{user?.full_name || 'নাম নেই'}</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded text-slate-400 font-mono">@{(user?.username || '').toUpperCase()}</span>
                        </div>
                        <p><span className="text-slate-500 font-medium">তারিখ:</span> <span className="font-semibold text-slate-200">{r.is_bulk ? r.formatted_bulk_dates : formatDate(r.date)}</span></p>
                        <p><span className="text-slate-500 font-medium">ছুটির ধরন:</span> <span className="font-bold text-blue-400">{r.leave_type}</span></p>
                        {r.leave_type !== 'Reserve' && r.leave_type !== 'Full Leave' && (
                          <p><span className="text-slate-500 font-medium">সময় ও ঘণ্টা:</span> <span className="font-mono text-slate-300">{formatTimeToAMPM(r.sign_in_time)} - {formatTimeToAMPM(r.sign_out_time)} ({r.leave_hour ? r.leave_hour.substring(0, 5) : '-'} ঘণ্টা)</span></p>
                        )}
                        {r.leave_type === 'Reserve' && (
                          <p><span className="text-slate-500 font-medium">রিজার্ভ ছুটির দিন:</span> <span className="text-slate-200 font-semibold">{r.reserve_holiday || '-'}</span></p>
                        )}
                        <p>
                          <span className="text-slate-500 font-medium">সমন্বয় (Adjustment):</span>{' '}
                          <span className={`font-semibold ${r.adjustment ? 'text-blue-400 font-bold' : r.adjusted_hour ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}>
                            {r.adjustment ? 'হ্যাঁ' : r.adjusted_hour ? `আংশিক (${r.adjusted_hour.toString().split('.')[0].substring(0, 5)} ঘণ্টা)` : 'না'}
                          </span>
                        </p>
                        {r.leave_type === 'Overtime' && (
                          <p>
                            <span className="text-slate-500 font-medium">শর্ট লিভ থেকে সমন্বয় (Short Leave Adj):</span>{' '}
                            <span className={`font-semibold ${r.adjust_short_leave ? 'text-blue-400 font-bold' : 'text-slate-400'}`}>
                              {r.adjust_short_leave ? 'হ্যাঁ' : 'না'}
                            </span>
                          </p>
                        )}
                        <p><span className="text-slate-500 font-medium">কারণ/মন্তব্য:</span> <span className="italic text-slate-300 font-medium">{r.comment || '-'}</span></p>
                      </div>

                      <div className="flex md:flex-col justify-end items-end gap-2 shrink-0 font-sans">
                        <button
                          onClick={() => handleApproveChutiRequest(r.id, false)}
                          disabled={reviewingIds.has(r.id) || approvedIds.has(r.id)}
                          className="px-3 py-1.5 border border-amber-500/30 hover:border-amber-500 bg-amber-955/20 hover:bg-amber-955/50 text-amber-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                          {reviewingIds.has(r.id) && (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          )}
                          {reviewingIds.has(r.id) ? 'রিভিশন পাঠানো হচ্ছে...' : 'রিভিশন পাঠান (Needs Review)'}
                        </button>
                        <button
                          onClick={() => handleApproveChutiRequest(r.id, true)}
                          disabled={approvingIds.has(r.id) || approvedIds.has(r.id)}
                          className="px-3 py-1.5 border border-emerald-500/30 hover:border-emerald-500 bg-emerald-900/20 hover:bg-emerald-900/50 text-emerald-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-80 flex items-center gap-1.5"
                        >
                          {approvingIds.has(r.id) && (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          )}
                          {approvedIds.has(r.id) && (
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                          )}
                          {approvedIds.has(r.id) ? 'অনুমোদিত' : approvingIds.has(r.id) ? 'অনুমোদন হচ্ছে...' : 'অনুমোদন করুন (Approve)'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Reserve & Overtime Adjustments */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> রিজার্ভ, ওভারটাইম ও সমন্বয় অনুরোধসমূহ (Pending Requests & Adjustments)
            </h4>
            {pendingReserveRequests.length === 0 ? (
              <div className="text-center py-6 bg-slate-955/40 border border-slate-850 rounded-xl text-slate-500 text-xs font-medium">
                কোনো পেন্ডিং রিজার্ভ, ওভারটাইম বা সমন্বয় অনুরোধ নেই।
              </div>
            ) : (
              <div className="space-y-3">
                {pendingReserveRequests.map(r => {
                  const user = profilesList.find(p => p.id === r.user_id);
                  const isAdjustmentRequest = r.reserve_adjustment_status === 'pending';
                  return (
                    <div key={r.id} className="bg-slate-955/60 border border-slate-850 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4">
                      <div className="space-y-1 text-xs text-slate-355 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{user?.full_name || 'নাম নেই'}</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded text-slate-400 font-mono font-bold">@{(user?.username || '').toUpperCase()}</span>
                        </div>
                        <p><span className="text-slate-500 font-medium">তারিখ:</span> <span className="font-semibold text-slate-200">{formatDate(r.date)}</span></p>
                        <p>
                          <span className="text-slate-500 font-medium">ছুটির ধরন:</span>{' '}
                          <span className={`font-bold ${r.leave_type === 'Reserve' ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {r.leave_type}
                          </span>
                        </p>
                        
                        {r.leave_type === 'Reserve' && (
                          <p><span className="text-slate-500 font-medium">রিজার্ভ ছুটির দিন:</span> <span className="font-semibold text-slate-200">{r.reserve_holiday || '-'}</span></p>
                        )}

                        {(r.leave_type === 'Overtime' || r.leave_type === 'Short Leave') && (
                          <p><span className="text-slate-500 font-medium">সময় ও ঘণ্টা:</span> <span className="font-mono text-slate-300">{formatTimeToAMPM(r.sign_in_time)} - {formatTimeToAMPM(r.sign_out_time)} ({r.leave_hour ? r.leave_hour.substring(0, 5) : '-'} ঘণ্টা)</span></p>
                        )}

                        <p>
                          <span className="text-slate-500 font-medium">সমন্বয় (Adjustment):</span>{' '}
                          <span className={`font-semibold ${(r.adjustment || isAdjustmentRequest) ? 'text-blue-400 font-bold' : 'text-slate-400'}`}>
                            {(r.adjustment || isAdjustmentRequest) ? 'হ্যাঁ' : 'না'}
                          </span>
                        </p>

                        {r.leave_type === 'Overtime' && (
                          <p>
                            <span className="text-slate-500 font-medium">শর্ট লিভ থেকে সমন্বয় (Short Leave Adj):</span>{' '}
                            <span className={`font-semibold ${r.adjust_short_leave ? 'text-blue-400 font-bold' : 'text-slate-400'}`}>
                              {r.adjust_short_leave ? 'হ্যাঁ' : 'না'}
                            </span>
                          </p>
                        )}

                        {isAdjustmentRequest && r.admin_edit_request && (
                          <div className="mt-1.5 p-2 bg-blue-955/40 border border-blue-900/40 rounded-lg text-blue-300 text-xs flex flex-col gap-0.5">
                            <div>
                              <span className="font-bold text-white">অনুরোধকৃত সমন্বয়:</span>{' '}
                              {r.admin_edit_request.adjusted_hour ? (
                                <span className="font-semibold text-cyan-400">আংশিক সমন্বয় ({r.admin_edit_request.adjusted_hour.substring(0, 5)} ঘণ্টা)</span>
                              ) : r.admin_edit_request.adjustment === false ? (
                                <span className="font-semibold text-rose-400 font-bold">সমন্বয় বাতিল</span>
                              ) : (
                                <span className="font-semibold text-blue-400">পূর্ণ সমন্বয়</span>
                              )}
                              {r.admin_edit_request.adjust_short_leave && (
                                <span className="text-emerald-400"> (শর্ট লিভ থেকে সমন্বয়)</span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <p><span className="text-slate-500 font-medium">কারণ/মন্তব্য:</span> <span className="italic text-slate-300 font-medium">{r.comment || '-'}</span></p>
                      </div>

                      <div className="flex md:flex-col justify-end items-end gap-2 shrink-0 font-sans">
                        {isAdjustmentRequest ? (
                          <>
                            <button
                              onClick={() => handleApproveReserveAdjustment(r, false)}
                              disabled={approvingIds.has(r.id) || approvedIds.has(r.id)}
                              className="px-3 py-1.5 border border-red-500/30 hover:border-red-500 bg-red-955/20 hover:bg-red-955/50 text-red-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              প্রত্যাখ্যান (Reject)
                            </button>
                            <button
                              onClick={() => handleApproveReserveAdjustment(r, true)}
                              disabled={approvingIds.has(r.id) || approvedIds.has(r.id)}
                              className="px-3 py-1.5 border border-emerald-500/30 hover:border-emerald-500 bg-emerald-900/20 hover:bg-emerald-900/50 text-emerald-455 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-80 flex items-center gap-1.5"
                            >
                              {approvingIds.has(r.id) && (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              )}
                              {approvedIds.has(r.id) && (
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                              )}
                              {approvedIds.has(r.id) ? 'অনুমোদিত' : approvingIds.has(r.id) ? 'অনুমোদন হচ্ছে...' : 'অনুমোদন (Approve)'}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleApproveChutiRequest(r.id, false)}
                              disabled={reviewingIds.has(r.id) || approvedIds.has(r.id)}
                              className="px-3 py-1.5 border border-amber-500/30 hover:border-amber-500 bg-amber-955/20 hover:bg-amber-955/50 text-amber-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                              {reviewingIds.has(r.id) && (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              )}
                              {reviewingIds.has(r.id) ? 'রিভিশন পাঠানো হচ্ছে...' : 'রিভিশন পাঠান (Needs Review)'}
                            </button>
                            <button
                              onClick={() => handleApproveChutiRequest(r.id, true)}
                              disabled={approvingIds.has(r.id) || approvedIds.has(r.id)}
                              className="px-3 py-1.5 border border-emerald-500/30 hover:border-emerald-500 bg-emerald-905/20 hover:bg-emerald-905/50 text-emerald-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-80 flex items-center gap-1.5"
                            >
                              {approvingIds.has(r.id) && (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              )}
                              {approvedIds.has(r.id) && (
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                              )}
                              {approvedIds.has(r.id) ? 'অনুমোদিত' : approvingIds.has(r.id) ? 'অনুমোদন হচ্ছে...' : 'অনুমোদন করুন (Approve)'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Profile Approvals */}
          <div className="border-t border-slate-800/60 pt-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> প্রোফাইল পরিবর্তন অনুরোধসমূহ (Pending Profile Updates)
            </h4>
            {pendingProfileRequests.length === 0 ? (
              <div className="text-center py-6 bg-slate-955/40 border border-slate-850 rounded-xl text-slate-500 text-xs font-medium">
                কোনো পেন্ডিং প্রোফাইল পরিবর্তনের অনুরোধ নেই।
              </div>
            ) : (
              <div className="space-y-4 font-sans">
                {pendingProfileRequests.map(p => (
                  <div key={p.id} className="bg-slate-955/60 border border-slate-850 rounded-xl p-4 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{p.full_name || 'নাম নেই'}</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded text-slate-400 font-mono">@{(p.username || '').toUpperCase()}</span>
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">রোল: {p.job_role || '-'}</p>
                      </div>
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-955 border border-amber-800 text-amber-400">
                        Pending
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                      {/* Comparison Columns */}
                      <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-850">
                        <span className="block font-bold text-slate-400 mb-1.5 border-b border-slate-800 pb-1 font-semibold">বর্তমান তথ্য</span>
                        <div className="space-y-1 text-slate-355 font-medium">
                          <p><span className="text-slate-500">নাম:</span> {p.full_name || '-'}</p>
                          <p><span className="text-slate-500">জব রোল:</span> {p.job_role || '-'}</p>
                          <p><span className="text-slate-500">কর্মঘণ্টা:</span> {p.working_hours} ঘণ্টা</p>
                          <p><span className="text-slate-500">ব্রেক টাইম:</span> {p.break_time} মিনিট</p>
                          <p><span className="text-slate-500">সাইন-ইন টাইম:</span> {formatTimeToAMPM(p.default_sign_in || null) || '-'}</p>
                          <p><span className="text-slate-500">সাইন-আউট টাইম:</span> {formatTimeToAMPM(p.default_sign_out || null) || '-'}</p>
                        </div>
                      </div>

                      <div className="bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-900/30">
                        <span className="block font-bold text-indigo-400 mb-1.5 border-b border-indigo-900/30 pb-1 font-semibold">অনুরোধকৃত নতুন তথ্য</span>
                        <div className="space-y-1 text-slate-200 font-medium">
                          <p className={p.requested_full_name && p.requested_full_name !== p.full_name ? 'text-indigo-300 font-bold' : ''}>
                            <span className="text-slate-500">নাম:</span> {p.requested_full_name || p.full_name || '-'}
                          </p>
                          <p className={p.requested_job_role && p.requested_job_role !== p.job_role ? 'text-indigo-300 font-bold' : ''}>
                            <span className="text-slate-500">জব রোল:</span> {p.requested_job_role || p.job_role || '-'}
                          </p>
                          <p className={p.requested_working_hours && p.requested_working_hours !== p.working_hours ? 'text-indigo-300 font-bold' : ''}>
                            <span className="text-slate-500">কর্মঘণ্টা:</span> {p.requested_working_hours || p.working_hours} ঘণ্টা
                          </p>
                          <p className={p.requested_break_time && p.requested_break_time !== p.break_time ? 'text-indigo-300 font-bold' : ''}>
                            <span className="text-slate-500">ব্রেক টাইম:</span> {p.requested_break_time || p.break_time} মিনিট
                          </p>
                          <p className={p.requested_default_sign_in && p.requested_default_sign_in !== p.default_sign_in ? 'text-indigo-300 font-bold' : ''}>
                            <span className="text-slate-500">সাইন-ইন টাইম:</span> {formatTimeToAMPM(p.requested_default_sign_in || p.default_sign_in || null) || '-'}
                          </p>
                          <p className={p.requested_default_sign_out && p.requested_default_sign_out !== p.default_sign_out ? 'text-indigo-300 font-bold' : ''}>
                            <span className="text-slate-500">সাইন-আউট টাইম:</span> {formatTimeToAMPM(p.requested_default_sign_out || p.default_sign_out || null) || '-'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1 font-sans">
                      <button
                        onClick={() => handleApproveProfileChangeRequest(p.id, false)}
                        disabled={approvingIds.has(p.id) || approvedIds.has(p.id)}
                        className="px-3 py-1.5 border border-red-500/30 hover:border-red-500 bg-red-955/20 hover:bg-red-955/50 text-red-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        প্রত্যাখ্যান (Reject)
                      </button>
                      <button
                        onClick={() => handleApproveProfileChangeRequest(p.id, true)}
                        disabled={approvingIds.has(p.id) || approvedIds.has(p.id)}
                        className="px-3 py-1.5 border border-emerald-500/30 hover:border-emerald-500 bg-emerald-900/20 hover:bg-emerald-900/50 text-emerald-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-80 flex items-center gap-1.5"
                      >
                        {approvingIds.has(p.id) && (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        )}
                        {approvedIds.has(p.id) && (
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                        )}
                        {approvedIds.has(p.id) ? 'অনুমোদিত' : approvingIds.has(p.id) ? 'অনুমোদন হচ্ছে...' : 'অনুমোদন করুন (Approve)'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
