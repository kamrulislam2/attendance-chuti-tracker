'use client';

import React from 'react';
import { Bell, CheckCircle, RefreshCw, Search } from 'lucide-react';
import { Profile, ChutiRecordWithProfile, BulkRepresentative } from '@/types';
import { formatDate, formatTimeToAMPM } from '@/utils/dashboardHelpers';
import { Modal } from '../Modal';
import { CustomSelect } from '../CustomSelect';

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
  adminHolidayNotifications?: any[];
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
  adminHolidayNotifications = [],
}: AdminLeaveApprovalModalProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [leaveTypeFilter, setLeaveTypeFilter] = React.useState('all');

  const leaveTypeOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'Short Leave', label: 'Short Leave' },
    { value: 'Full Leave', label: 'Full Leave' },
    { value: 'Overtime', label: 'Overtime' },
  ];

  React.useEffect(() => {
    if (!showLeaveApprovalModal) {
      setSearchQuery('');
      setLeaveTypeFilter('all');
    }
  }, [showLeaveApprovalModal]);

  const filteredChutiRequests = React.useMemo(() => {
    return groupedChutiRequests.filter(r => {
      const user = profilesList.find(p => p.id === r.user_id);
      const name = (user?.full_name || '').toLowerCase();
      const username = (user?.username || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch = !query || name.includes(query) || username.includes(query);
      const matchesType = leaveTypeFilter === 'all' || r.leave_type === leaveTypeFilter;

      return matchesSearch && matchesType;
    });
  }, [groupedChutiRequests, profilesList, searchQuery, leaveTypeFilter]);

  const filteredReserveRequests = React.useMemo(() => {
    return pendingReserveRequests.filter(r => {
      const user = profilesList.find(p => p.id === r.user_id);
      const name = (user?.full_name || '').toLowerCase();
      const username = (user?.username || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch = !query || name.includes(query) || username.includes(query);
      const matchesType = leaveTypeFilter === 'all' || r.leave_type === leaveTypeFilter;

      return matchesSearch && matchesType;
    });
  }, [pendingReserveRequests, profilesList, searchQuery, leaveTypeFilter]);

  const filteredProfileRequests = React.useMemo(() => {
    if (leaveTypeFilter !== 'all') return [];

    return pendingProfileRequests.filter(p => {
      const name = (p.full_name || '').toLowerCase();
      const username = (p.username || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      return !query || name.includes(query) || username.includes(query);
    });
  }, [pendingProfileRequests, searchQuery, leaveTypeFilter]);

  const filteredHolidayNotifications = React.useMemo(() => {
    if (leaveTypeFilter !== 'all') return [];
    const notifications = adminHolidayNotifications || [];
    const query = searchQuery.toLowerCase().trim();
    if (!query) return notifications;
    return notifications.filter(n =>
      n.title.toLowerCase().includes(query) ||
      n.body.toLowerCase().includes(query)
    );
  }, [adminHolidayNotifications, searchQuery, leaveTypeFilter]);

  if (profile?.role !== 'admin') return null;

  const handleClose = () => setShowLeaveApprovalModal(false);

  return (
    <Modal
      isOpen={showLeaveApprovalModal}
      onClose={handleClose}
      title="Notification Panel (Admin)"
      icon={<Bell className="h-5 w-5 text-amber-400 font-semibold" />}
      maxWidthClass="max-w-3xl"
      glowClass="bg-amber-900/10"
    >
      <div className="max-h-[70vh] overflow-y-auto space-y-6 pr-1 font-sans">
        <div className="p-4 rounded-xl bg-slate-955/40 border border-slate-800/80 text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-amber-400">💡 Guidelines for Modifying Information:</p>
          <p>Supervisors or Admins cannot directly reject a leave request. If there is an error or correction needed, click the <strong>'Needs Review'</strong> button to send it back to the user for correction. Once the user updates the information and resubmits, it will go back through the supervisor approval process and finally reach the admin.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-955/20 border border-slate-800/60 relative">
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Search Staff (Name or Codename)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="Search by Name or codename (@username)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-10 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs transition-all font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-350 transition-colors cursor-pointer text-sm font-semibold"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Filter Leave Type</label>
              <CustomSelect
                value={leaveTypeFilter}
                onChange={setLeaveTypeFilter}
                options={leaveTypeOptions}
                className="w-full"
              />
            </div>
            {(searchQuery || leaveTypeFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setLeaveTypeFilter('all');
                }}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-800 rounded-lg cursor-pointer transition-all shrink-0 flex items-center justify-center"
                title="Reset Filter"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Leave Requests (Pending: {filteredChutiRequests.length})
          </h4>
          {groupedChutiRequests.length === 0 ? (
            <div className="text-center py-6 bg-slate-955/40 border border-slate-850 rounded-xl text-slate-500 text-xs font-medium font-sans">
              No pending leaves for approval.
            </div>
          ) : filteredChutiRequests.length === 0 ? (
            <div className="text-center py-6 bg-slate-955/40 border border-slate-850 rounded-xl text-slate-500 text-xs font-medium font-sans">
              No matching records found.
            </div>
          ) : (
            <div className="space-y-3 font-sans">
              {filteredChutiRequests.map(r => {
                const user = profilesList.find(p => p.id === r.user_id);
                return (
                  <div key={r.id} className="bg-slate-955/60 border border-slate-850 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-1 text-xs text-slate-355">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{user?.full_name || 'No Name'}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded text-slate-400 font-mono">@{(user?.username || '').toUpperCase()}</span>
                      </div>
                      <p><span className="text-slate-500 font-medium">Date:</span> <span className="font-semibold text-slate-200">{r.is_bulk ? r.formatted_bulk_dates : formatDate(r.date)}</span></p>
                      <p><span className="text-slate-500 font-medium">Leave Type:</span> <span className="font-bold text-orange-400">{r.leave_type}</span></p>
                      {r.leave_type !== 'Full Leave' && (
                        <p><span className="text-slate-500 font-medium">Time & Hours:</span> <span className="font-mono text-slate-300">{formatTimeToAMPM(r.sign_in_time)} - {formatTimeToAMPM(r.sign_out_time)} ({r.leave_hour ? r.leave_hour.substring(0, 5) : '-'} hrs)</span></p>
                      )}
                      <p>
                        <span className="text-slate-500 font-medium">Adjustment:</span>{' '}
                        <span className={`font-semibold ${r.adjustment ? 'text-orange-400 font-bold' : r.adjusted_hour ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}>
                          {r.adjustment ? 'Yes' : r.adjusted_hour ? `Partial (${r.adjusted_hour.toString().split('.')[0].substring(0, 5)} hrs)` : 'No'}
                        </span>
                      </p>
                      {r.leave_type === 'Overtime' && (
                        <p>
                          <span className="text-slate-500 font-medium">Short Leave Adj:</span>{' '}
                          <span className={`font-semibold ${r.adjust_short_leave ? 'text-orange-400 font-bold' : 'text-slate-400'}`}>
                            {r.adjust_short_leave ? 'Yes' : 'No'}
                          </span>
                        </p>
                      )}
                      <p><span className="text-slate-500 font-medium">Reason/Comment:</span> <span className="italic text-slate-300 font-medium">{r.comment || '-'}</span></p>
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
                        {reviewingIds.has(r.id) ? 'Sending revision...' : 'Needs Review'}
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
                        {approvedIds.has(r.id) ? 'Approved' : approvingIds.has(r.id) ? 'Approving...' : 'Approve'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 4: Govt Holiday Responses */}
        {leaveTypeFilter === 'all' && (
          <div className="border-t border-slate-800/60 pt-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span> Staff Govt Holiday Responses (Total: {filteredHolidayNotifications.length})
            </h4>
            {filteredHolidayNotifications.length === 0 ? (
              <div className="text-center py-6 bg-slate-955/40 border border-slate-850 rounded-xl text-slate-500 text-xs font-medium font-sans">
                No government holiday responses from staff.
              </div>
            ) : (
              <div className="space-y-3 font-sans max-h-60 overflow-y-auto pr-1">
                {filteredHolidayNotifications.map(n => (
                  <div key={n.id} className="bg-slate-955/60 border border-slate-850 rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-1 text-xs text-slate-355 font-medium">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-white text-[13px]">{n.title}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {n.timestamp ? new Date(n.timestamp).toLocaleString('en-US', { hour12: true }) : ''}
                        </span>
                      </div>
                      <p className="text-slate-300 font-normal leading-relaxed">{n.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="border-t border-slate-800/60 pt-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Reserve, Overtime & Adjustment Requests (Pending: {filteredReserveRequests.length})
          </h4>
          {pendingReserveRequests.length === 0 ? (
            <div className="text-center py-6 bg-slate-955/40 border border-slate-850 rounded-xl text-slate-500 text-xs font-medium font-sans">
              No pending reserve, overtime, or adjustment requests.
            </div>
          ) : filteredReserveRequests.length === 0 ? (
            <div className="text-center py-6 bg-slate-955/40 border border-slate-850 rounded-xl text-slate-500 text-xs font-medium font-sans">
              No matching records found.
            </div>
          ) : (
            <div className="space-y-3 font-sans">
              {filteredReserveRequests.map(r => {
                const user = profilesList.find(p => p.id === r.user_id);
                const isAdjustmentRequest = r.reserve_adjustment_status === 'pending';
                return (
                  <div key={r.id} className="bg-slate-955/60 border border-slate-850 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-1 text-xs text-slate-355 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{user?.full_name || 'No Name'}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded text-slate-400 font-mono font-bold">@{(user?.username || '').toUpperCase()}</span>
                      </div>
                      <p><span className="text-slate-500 font-medium">Date:</span> <span className="font-semibold text-slate-200">{formatDate(r.date)}</span></p>
                      <p>
                        <span className="text-slate-500 font-medium">Leave Type:</span>{' '}
                        <span className="font-bold text-emerald-500">
                          {r.leave_type}
                        </span>
                      </p>

                      {(r.leave_type === 'Overtime' || r.leave_type === 'Short Leave') && (
                        <p><span className="text-slate-500 font-medium">Time & Hours:</span> <span className="font-mono text-slate-300">{formatTimeToAMPM(r.sign_in_time)} - {formatTimeToAMPM(r.sign_out_time)} ({r.leave_hour ? r.leave_hour.substring(0, 5) : '-'} hrs)</span></p>
                      )}

                      <p>
                        <span className="text-slate-500 font-medium">Adjustment:</span>{' '}
                        <span className={`font-semibold ${(r.adjustment || isAdjustmentRequest) ? 'text-orange-400 font-bold' : 'text-slate-400'}`}>
                          {(r.adjustment || isAdjustmentRequest) ? 'Yes' : 'No'}
                        </span>
                      </p>

                      {r.leave_type === 'Overtime' && (
                        <p>
                          <span className="text-slate-500 font-medium">Short Leave Adj:</span>{' '}
                          <span className={`font-semibold ${r.adjust_short_leave ? 'text-orange-400 font-bold' : 'text-slate-400'}`}>
                            {r.adjust_short_leave ? 'Yes' : 'No'}
                          </span>
                        </p>
                      )}

                      {isAdjustmentRequest && r.admin_edit_request && (
                        <div className="mt-1.5 p-2 bg-orange-955/40 border border-orange-900/40 rounded-lg text-orange-300 text-xs flex flex-col gap-0.5">
                          <div>
                            <span className="font-bold text-white">Requested Adjustment:</span>{' '}
                            {r.admin_edit_request.adjusted_hour ? (
                              <span className="font-semibold text-cyan-400">Partial Adjustment ({r.admin_edit_request.adjusted_hour.substring(0, 5)} hrs)</span>
                            ) : r.admin_edit_request.adjustment === false ? (
                              <span className="font-semibold text-rose-400 font-bold">Cancel Adjustment</span>
                            ) : (
                              <span className="font-semibold text-orange-400">Full Adjustment</span>
                            )}
                            {r.admin_edit_request.adjust_short_leave && (
                              <span className="text-emerald-400"> (From Short Leave)</span>
                            )}
                          </div>
                        </div>
                      )}

                      <p><span className="text-slate-500 font-medium">Reason/Comment:</span> <span className="italic text-slate-300 font-medium">{r.comment || '-'}</span></p>
                    </div>

                    <div className="flex md:flex-col justify-end items-end gap-2 shrink-0 font-sans">
                      {isAdjustmentRequest ? (
                        <>
                          <button
                            onClick={() => handleApproveReserveAdjustment(r, false)}
                            disabled={approvingIds.has(r.id) || approvedIds.has(r.id)}
                            className="px-3 py-1.5 border border-red-500/30 hover:border-red-500 bg-red-955/20 hover:bg-red-955/50 text-red-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Reject
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
                            {approvedIds.has(r.id) ? 'Approved' : approvingIds.has(r.id) ? 'Approving...' : 'Approve'}
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
                            {reviewingIds.has(r.id) ? 'Sending revision...' : 'Needs Review'}
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
                            {approvedIds.has(r.id) ? 'Approved' : approvingIds.has(r.id) ? 'Approving...' : 'Approve'}
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
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Profile Change Requests (Pending: {filteredProfileRequests.length})
          </h4>
          {pendingProfileRequests.length === 0 ? (
            <div className="text-center py-6 bg-slate-955/40 border border-slate-850 rounded-xl text-slate-500 text-xs font-medium font-sans">
              No pending profile change requests.
            </div>
          ) : filteredProfileRequests.length === 0 ? (
            <div className="text-center py-6 bg-slate-955/40 border border-slate-850 rounded-xl text-slate-500 text-xs font-medium font-sans">
              No matching records found.
            </div>
          ) : (
            <div className="space-y-4 font-sans">
              {filteredProfileRequests.map(p => (
                <div key={p.id} className="bg-slate-955/60 border border-slate-850 rounded-xl p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{p.full_name || 'No Name'}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded text-slate-400 font-mono">@{(p.username || '').toUpperCase()}</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Role: {p.job_role || '-'}</p>
                    </div>
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-955 border border-amber-800 text-amber-400">
                      Pending
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                    {/* Comparison Columns */}
                    <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-850">
                      <span className="block font-bold text-slate-400 mb-1.5 border-b border-slate-800 pb-1 font-semibold">Current Information</span>
                      <div className="space-y-1 text-slate-355 font-medium">
                        <p><span className="text-slate-500">Name:</span> {p.full_name || '-'}</p>
                        <p><span className="text-slate-500">Job Role:</span> {p.job_role || '-'}</p>
                        <p><span className="text-slate-500">Working Hours:</span> {p.working_hours} hrs</p>
                        <p><span className="text-slate-500">Break Time:</span> {p.break_time} mins</p>
                        <p><span className="text-slate-500">Sign-In Time:</span> {formatTimeToAMPM(p.default_sign_in || null) || '-'}</p>
                        <p><span className="text-slate-500">Sign-Out Time:</span> {formatTimeToAMPM(p.default_sign_out || null) || '-'}</p>
                      </div>
                    </div>

                    <div className="bg-orange-955/20 p-2.5 rounded-lg border border-orange-900/30">
                      <span className="block font-bold text-orange-400 mb-1.5 border-b border-orange-900/30 pb-1 font-semibold">Requested New Information</span>
                      <div className="space-y-1 text-slate-200 font-medium">
                        <p className={p.requested_full_name && p.requested_full_name !== p.full_name ? 'text-orange-300 font-bold' : ''}>
                          <span className="text-slate-500">Name:</span> {p.requested_full_name || p.full_name || '-'}
                        </p>
                        <p className={p.requested_job_role && p.requested_job_role !== p.job_role ? 'text-orange-300 font-bold' : ''}>
                          <span className="text-slate-500">Job Role:</span> {p.requested_job_role || p.job_role || '-'}
                        </p>
                        <p className={p.requested_working_hours && p.requested_working_hours !== p.working_hours ? 'text-orange-300 font-bold' : ''}>
                          <span className="text-slate-500">Working Hours:</span> {p.requested_working_hours || p.working_hours} hrs
                        </p>
                        <p className={p.requested_break_time && p.requested_break_time !== p.break_time ? 'text-orange-300 font-bold' : ''}>
                          <span className="text-slate-500">Break Time:</span> {p.requested_break_time || p.break_time} mins
                        </p>
                        <p className={p.requested_default_sign_in && p.requested_default_sign_in !== p.default_sign_in ? 'text-orange-300 font-bold' : ''}>
                          <span className="text-slate-500">Sign-In Time:</span> {formatTimeToAMPM(p.requested_default_sign_in || p.default_sign_in || null) || '-'}
                        </p>
                        <p className={p.requested_default_sign_out && p.requested_default_sign_out !== p.default_sign_out ? 'text-orange-300 font-bold' : ''}>
                          <span className="text-slate-500">Sign-Out Time:</span> {formatTimeToAMPM(p.requested_default_sign_out || p.default_sign_out || null) || '-'}
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
                      Reject
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
                      {approvedIds.has(p.id) ? 'Approved' : approvingIds.has(p.id) ? 'Approving...' : 'Approve'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Modal>
  );
}
