import React from 'react';
import { Edit, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { Profile } from '../types';
import { ChutiRecord } from '../utils/offlineSync';
import { DateInput } from './DateInput';

interface UserActionModalsProps {
  profile: Profile | null;

  // User Revision Modal Props
  showUserRevisionModal: boolean;
  setShowUserRevisionModal: (val: boolean) => void;
  revisionRecord: ChutiRecord | null;
  revisionDate: string;
  setRevisionDate: (val: string) => void;
  revisionLeaveType: string;
  setRevisionLeaveType: (val: string) => void;
  revisionSignInTime: string;
  setRevisionSignInTime: (val: string) => void;
  revisionSignOutTime: string;
  setRevisionSignOutTime: (val: string) => void;
  revisionLeaveHour: string;
  setRevisionLeaveHour: (val: string) => void;
  revisionAdjustment: boolean;
  setRevisionAdjustment: (val: boolean) => void;
  revisionAdjustShortLeave: boolean;
  setRevisionAdjustShortLeave: (val: boolean) => void;
  revisionReserveHoliday: string;
  setRevisionReserveHoliday: (val: string) => void;
  revisionComment: string;
  setRevisionComment: (val: string) => void;
  handleUserSubmitRevision: (e: React.FormEvent) => Promise<void>;
  submitting: boolean;
  getCleanComment: (comment: string | null | undefined) => string;

  // Custom Revision Prompt Modal Props
  showRevisionPromptModal: boolean;
  setShowRevisionPromptModal: (val: boolean) => void;
  revisionPromptText: string;
  setRevisionPromptText: (val: string) => void;
  revisionPromptIsSupervisor: boolean;
  setRevisionPromptChutiId: (val: string | null) => void;
  submitRevisionWithReason: () => Promise<void>;
  submittingRevision: boolean;

  // Delete Confirmation Modal Props
  showDeleteModal: boolean;
  setShowDeleteModal: (val: boolean) => void;
  recordToDelete: ChutiRecord | null;
  setRecordToDelete: (val: ChutiRecord | null) => void;
  handleConfirmDelete: () => Promise<void>;
  deletingRecord: boolean;
}

export const UserActionModals: React.FC<UserActionModalsProps> = ({
  profile,

  // User Revision
  showUserRevisionModal,
  setShowUserRevisionModal,
  revisionRecord,
  revisionDate,
  setRevisionDate,
  revisionLeaveType,
  setRevisionLeaveType,
  revisionSignInTime,
  setRevisionSignInTime,
  revisionSignOutTime,
  setRevisionSignOutTime,
  revisionLeaveHour,
  setRevisionLeaveHour,
  revisionAdjustment,
  setRevisionAdjustment,
  revisionAdjustShortLeave,
  setRevisionAdjustShortLeave,
  revisionReserveHoliday,
  setRevisionReserveHoliday,
  revisionComment,
  setRevisionComment,
  handleUserSubmitRevision,
  submitting,
  getCleanComment,

  // Custom Revision Prompt
  showRevisionPromptModal,
  setShowRevisionPromptModal,
  revisionPromptText,
  setRevisionPromptText,
  setRevisionPromptChutiId,
  submitRevisionWithReason,
  submittingRevision,

  // Delete Confirmation
  showDeleteModal,
  setShowDeleteModal,
  recordToDelete,
  setRecordToDelete,
  handleConfirmDelete,
  deletingRecord,
}) => {
  return (
    <>
      {/* User Revision Modal */}
      {showUserRevisionModal && revisionRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden">
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
                    className="bg-slate-955"
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
                        title="Yes দিলে ওভারটাইম সময়টি শর্ট লিভ থেকে বিয়োগ হবে"
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
                        title="Yes দিলে রিজার্ভ ছুটি ফুল লিভ থেকে বিয়োগ হবে"
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

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUserRevisionModal(false)}
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
                className="text-slate-450 hover:text-white text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                এই ছুটির অনুরোধটি সংশোধনের জন্য ফেরত পাঠানোর কারণ বা মন্তব্যটি নিচে লিখুন। এটি ইউজারের সংশোধন পেজে প্রদর্শিত হবে:
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
                  className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {submittingRevision && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  {submittingRevision ? 'দাখিল হচ্ছে...' : 'দাখিল করুন'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/85 backdrop-blur-md p-4">
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-red-900/10 blur-[80px] pointer-events-none" />
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-red-600/10 border border-red-500/20 text-red-400 rounded-2xl mb-3">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">রেকর্ড ডিলিট নিশ্চিতকরণ</h3>
              <p className="text-xs text-slate-400 mt-1">আপনি কি নিশ্চিতভাবে এই রেকর্ডটি ডিলিট করতে চান? এই কাজটি আর ফেরত নেওয়া যাবে না।</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={deletingRecord}
                onClick={() => {
                  setShowDeleteModal(false);
                  setRecordToDelete(null);
                }}
                className="flex-1 flex justify-center py-2.5 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200 disabled:opacity-50"
              >
                না, বাতিল করুন
              </button>
              <button
                type="button"
                disabled={deletingRecord}
                onClick={handleConfirmDelete}
                className="flex-1 flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-red-600 hover:bg-red-700 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {deletingRecord && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                {deletingRecord ? 'ডিলিট হচ্ছে...' : 'হ্যাঁ, ডিলিট করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
