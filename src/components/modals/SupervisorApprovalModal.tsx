'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, CheckCircle, Search } from 'lucide-react';
import { Profile, BulkRepresentative } from '@/types';

interface SupervisorApprovalModalProps {
  // Supervisor Approvals panel
  showSupervisorApprovalModal: boolean;
  setShowSupervisorApprovalModal: (val: boolean) => void;
  groupedSupervisorRequests: BulkRepresentative[];
  profilesList: Profile[];
  reviewingIds: Set<string>;
  approvedIds: Set<string>;
  approvingIds: Set<string>;
  handleSupervisorApproveChuti: (id: string, approve: boolean) => void;
  profile: Profile | null;

  // Custom Revision Prompt Modal
  showRevisionPromptModal: boolean;
  setShowRevisionPromptModal: (val: boolean) => void;
  submittingRevision: boolean;
  setRevisionPromptChutiId: (val: string | null) => void;
  setRevisionPromptText: (val: string) => void;
  revisionPromptText: string;
  submitRevisionWithReason: () => void;
}

// Helpers local to the component
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateString;
};

const formatTimeToAMPM = (timeStr: string | null) => {
  if (!timeStr) return '-';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');
  return `${formattedHours}:${minutes} ${ampm}`;
};

export const SupervisorApprovalModal: React.FC<SupervisorApprovalModalProps> = ({
  showSupervisorApprovalModal,
  setShowSupervisorApprovalModal,
  groupedSupervisorRequests,
  profilesList,
  reviewingIds,
  approvedIds,
  approvingIds,
  handleSupervisorApproveChuti,
  profile,

  showRevisionPromptModal,
  setShowRevisionPromptModal,
  submittingRevision,
  setRevisionPromptChutiId,
  setRevisionPromptText,
  revisionPromptText,
  submitRevisionWithReason,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [leaveTypeFilter, setLeaveTypeFilter] = React.useState('all');

  React.useEffect(() => {
    if (!showSupervisorApprovalModal) {
      setSearchQuery('');
      setLeaveTypeFilter('all');
    }
  }, [showSupervisorApprovalModal]);

  const filteredSupervisorRequests = React.useMemo(() => {
    return groupedSupervisorRequests.filter(r => {
      const user = profilesList.find(p => p.id === r.user_id);
      const name = (user?.full_name || '').toLowerCase();
      const username = (user?.username || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch = !query || name.includes(query) || username.includes(query);
      const matchesType = leaveTypeFilter === 'all' || r.leave_type === leaveTypeFilter;

      return matchesSearch && matchesType;
    });
  }, [groupedSupervisorRequests, profilesList, searchQuery, leaveTypeFilter]);

  return (
    <>
      {/* Supervisor Leave Approvals Modal */}
      {showSupervisorApprovalModal && profile?.role === 'supervisor' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-900/10 blur-[80px] pointer-events-none" />
            
            <div className="flex justify-between items-center border-b border-slate-800/80 p-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-indigo-400 animate-pulse" /> পেন্ডিং ভেরিফিকেশন প্যানেল (Supervisor) (পেন্ডিং: {filteredSupervisorRequests.length}টি)
              </h3>
              <button 
                onClick={() => setShowSupervisorApprovalModal(false)}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-955/20 border border-slate-800/60 relative font-sans">
                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider font-bold">স্টাফ খুঁজুন (নাম বা কোডনেম)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Search className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="স্টাফের নাম বা কোডনেম (@username) দিয়ে খুঁজুন..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer text-sm font-semibold"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider font-bold">ছুটির ধরন ফিল্টার</label>
                    <select
                      value={leaveTypeFilter}
                      onChange={(e) => setLeaveTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="all">সকল ক্যাটাগরি (All)</option>
                      <option value="Short Leave">Short Leave</option>
                      <option value="Full Leave">Full Leave</option>
                      <option value="Overtime">Overtime</option>
                    </select>
                  </div>
                  {(searchQuery || leaveTypeFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setLeaveTypeFilter('all');
                      }}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-800 rounded-lg cursor-pointer transition-all shrink-0 flex items-center justify-center h-[32px] w-[32px]"
                      title="রিসেট ফিল্টার"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {groupedSupervisorRequests.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm font-medium font-sans">
                  ভেরিফিকেশনের জন্য কোনো পেন্ডিং ছুটি নেই।
                </div>
              ) : filteredSupervisorRequests.length === 0 ? (
                <div className="text-center py-12 bg-slate-955/40 border border-slate-850 rounded-xl text-amber-500/80 text-xs font-medium font-sans flex items-center justify-center gap-1.5 bg-amber-955/10 border-amber-950/20">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> অনুসন্ধানের সাথে মিল পাওয়া যায়নি।
                </div>
              ) : (
                filteredSupervisorRequests.map(r => {
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
                        {r.leave_type !== 'Full Leave' && (
                          <p><span className="text-slate-500 font-medium">সময় ও ঘণ্টা:</span> <span className="font-mono text-slate-300">{formatTimeToAMPM(r.sign_in_time)} - {formatTimeToAMPM(r.sign_out_time)} ({r.leave_hour ? r.leave_hour.substring(0, 5) : '-'} ঘণ্টা)</span></p>
                        )}
                        <p>
                          <span className="text-slate-500 font-medium">সমন্বয় (Adjustment):</span>{' '}
                          <span className={`font-semibold ${r.adjustment ? 'text-blue-400 font-bold' : r.adjusted_hour ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}>
                            {r.adjustment ? 'হ্যাঁ' : r.adjusted_hour ? `আংশিক (${r.adjusted_hour.toString().split('.')[0].substring(0, 5)} ঘণ্টা)` : 'না'}
                          </span>
                        </p>
                        {r.leave_type === 'Overtime' && (
                          <p>
                            <span className="text-slate-500 font-medium">শর্ট লিভ থেকে সমন্বয় (Short Leave Adj):</span>{' '}
                            <span className={`font-semibold ${r.adjust_short_leave ? 'text-blue-400 font-bold' : 'text-slate-400'}`}>
                              {r.adjust_short_leave ? 'হ্যাঁ' : 'না'}
                            </span>
                          </p>
                        )}
                        <p><span className="text-slate-500 font-medium">কারণ/মন্তব্য:</span> <span className="italic text-slate-300 font-medium">{r.comment || '-'}</span></p>
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
                          className="px-3 py-1.5 border border-emerald-500/30 hover:border-emerald-500 bg-emerald-900/20 hover:bg-emerald-900/50 text-emerald-450 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-80 flex items-center gap-1.5"
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
      )}

      {/* Custom Revision Prompt Modal */}
      {showRevisionPromptModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-955/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-amber-900/10 blur-[80px] pointer-events-none" />
            
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" /> রিভিশনে পাঠানোর কারণ
              </h3>
              <button 
                disabled={submittingRevision}
                onClick={() => {
                  if (submittingRevision) return;
                  setShowRevisionPromptModal(false);
                  setRevisionPromptChutiId(null);
                  setRevisionPromptText('');
                }}
                className="text-slate-455 hover:text-white text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                এই ছুটির অনুরোধটি সংশোধনের জন্য ফেরত পাঠানোর কারণ বা মন্তব্যটি নিচে লিখুন। এটি ইউজারের সংশোধন পেজেড্যাশবোর্ডে প্রদর্শিত হবে:
              </p>
              
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 font-semibold">রিভিশন মন্তব্য/কারণ (Required)</label>
                <textarea
                  required
                  disabled={submittingRevision}
                  placeholder="যেমন: তারিখ পরিবর্তন করুন অথবা সঠিক ছুটির ধরন নির্বাচন করুন..."
                  value={revisionPromptText}
                  onChange={(e) => setRevisionPromptText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 h-24 resize-none font-sans disabled:opacity-50"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  disabled={submittingRevision}
                  onClick={() => {
                    setShowRevisionPromptModal(false);
                    setRevisionPromptChutiId(null);
                    setRevisionPromptText('');
                  }}
                  className="flex-1 flex justify-center py-2 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 cursor-pointer transition-all disabled:opacity-50"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={submittingRevision || !revisionPromptText.trim()}
                  onClick={submitRevisionWithReason}
                  className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingRevision && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  {submittingRevision ? 'দাখিল হচ্ছে...' : 'দাখিল করুন'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
