import React from 'react';
import { AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';
import { Profile, BulkRepresentative } from '../types';

interface SupervisorApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  groupedSupervisorRequests: BulkRepresentative[];
  profilesList: Profile[];
  reviewingIds: Set<string>;
  approvedIds: Set<string>;
  approvingIds: Set<string>;
  handleSupervisorApproveChuti: (chutiId: string, approve: boolean) => Promise<void>;
  formatDate: (dateString: string) => string;
  formatTimeToAMPM: (time: string | null) => string;
}

export const SupervisorApprovalModal: React.FC<SupervisorApprovalModalProps> = ({
  isOpen,
  onClose,
  profile,
  groupedSupervisorRequests,
  profilesList,
  reviewingIds,
  approvedIds,
  approvingIds,
  handleSupervisorApproveChuti,
  formatDate,
  formatTimeToAMPM,
}) => {
  if (!isOpen || profile?.role !== 'supervisor') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-900/10 blur-[80px] pointer-events-none" />
        
        <div className="flex justify-between items-center border-b border-slate-800/80 p-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-indigo-400 animate-pulse" /> পেন্ডিং ভেরিফিকেশন প্যানেল (Supervisor)
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-450 hover:text-white text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="p-4 rounded-xl bg-slate-955/40 border border-slate-800/80 text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-amber-400">💡 তথ্য সংশোধনের নিয়মাবলী:</p>
            <p>সুপারভাইজার সরাসরি ছুটির অনুরোধ প্রত্যাখ্যান (Reject) করতে পারবেন না। কোনো সংশোধন প্রয়োজন হলে <strong>'রিভিশন পাঠান (Needs Review)'</strong> বাটনে ক্লিক করে ইউজারের কাছে সংশোধনের জন্য পাঠানো যাবে। ইউজার তথ্য সংশোধন করে পুনরায় সাবমিট করলে তা পুনরায় আপনার কাছে অনুমোদনের জন্য আসবে।</p>
          </div>
          {groupedSupervisorRequests.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              ভেরিফিকেশনের জন্য কোনো পেন্ডিং ছুটি নেই।
            </div>
          ) : (
            groupedSupervisorRequests.map(r => {
              const user = profilesList.find(p => p.id === r.user_id);
              return (
                <div key={r.id} className="bg-slate-955/60 border border-slate-850 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-1 text-xs text-slate-355">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{user?.full_name || 'নাম নেই'}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded text-slate-400 font-mono">@{(user?.username || '').toUpperCase()}</span>
                    </div>
                    <p><span className="text-slate-500">তারিখ:</span> <span className="font-semibold text-slate-200">{r.is_bulk ? r.formatted_bulk_dates : formatDate(r.date)}</span></p>
                    <p><span className="text-slate-500">ছুটির ধরন:</span> <span className="font-bold text-blue-400">{r.leave_type}</span></p>
                    {r.leave_type !== 'Reserve' && r.leave_type !== 'Full Leave' && (
                      <p><span className="text-slate-500">সময় ও ঘণ্টা:</span> <span className="font-mono text-slate-300">{formatTimeToAMPM(r.sign_in_time)} - {formatTimeToAMPM(r.sign_out_time)} ({r.leave_hour ? r.leave_hour.substring(0, 5) : '-'} ঘণ্টা)</span></p>
                    )}
                    {r.leave_type === 'Reserve' && (
                      <p><span className="text-slate-500">রিজার্ভ ছুটির দিন:</span> <span className="text-slate-200">{r.reserve_holiday || '-'}</span></p>
                    )}
                    <p>
                      <span className="text-slate-500">সমন্বয় (Adjustment):</span>{' '}
                      <span className={`font-semibold ${r.adjustment ? 'text-blue-400 font-bold' : r.adjusted_hour ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}>
                        {r.adjustment ? 'হ্যাঁ' : r.adjusted_hour ? `আংশিক (${r.adjusted_hour.toString().split('.')[0].substring(0, 5)} ঘণ্টা)` : 'না'}
                      </span>
                    </p>
                    {r.leave_type === 'Overtime' && (
                      <p>
                        <span className="text-slate-500">শর্ট লিভ থেকে সমন্বয় (Short Leave Adj):</span>{' '}
                        <span className={`font-semibold ${r.adjust_short_leave ? 'text-blue-400 font-bold' : 'text-slate-400'}`}>
                          {r.adjust_short_leave ? 'হ্যাঁ' : 'না'}
                        </span>
                      </p>
                    )}
                    <p><span className="text-slate-500">কারণ/মন্তব্য:</span> <span className="italic text-slate-300">{r.comment || '-'}</span></p>
                  </div>

                  <div className="flex md:flex-col justify-end items-end gap-2 shrink-0">
                    <button
                      onClick={() => handleSupervisorApproveChuti(r.id, false)}
                      disabled={reviewingIds.has(r.id) || approvedIds.has(r.id)}
                      className="px-3 py-1.5 border border-amber-500/30 hover:border-amber-500 bg-amber-955/20 hover:bg-amber-955/50 text-amber-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {reviewingIds.has(r.id) && (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      )}
                      {reviewingIds.has(r.id) ? 'রিভিশন পাঠানো হচ্ছে...' : 'রিভিশন পাঠান (Needs Review)'}
                    </button>
                    <button
                      onClick={() => handleSupervisorApproveChuti(r.id, true)}
                      disabled={approvingIds.has(r.id) || approvedIds.has(r.id)}
                      className="px-3 py-1.5 border border-emerald-500/30 hover:border-emerald-500 bg-emerald-950/20 hover:bg-emerald-950/50 text-emerald-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-80 flex items-center gap-1.5"
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
            })
          )}
        </div>
      </div>
    </div>
  );
};
