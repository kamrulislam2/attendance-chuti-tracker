'use client';

import React from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { PasswordMatchIndicator } from '@/components/PasswordMatchIndicator';
import { Profile } from '@/types';
import { ProfileFields } from '@/components/ProfileFields';

import { Modal } from '../Modal';

interface AdminCreateUserModalProps {
  showCreateUserModal: boolean;
  setShowCreateUserModal: (val: boolean) => void;
  profile: Profile | null;
  newStaffPassword: string;
  setNewStaffPassword: (val: string) => void;
  newStaffUsername: string;
  setNewStaffUsername: (val: string) => void;
  newStaffRole: string;
  setNewStaffRole: (val: string) => void;
  newStaffFullName: string;
  setNewStaffFullName: (val: string) => void;
  newStaffNeedsApproval: boolean;
  setNewStaffNeedsApproval: (val: boolean) => void;
  newStaffAllowReserve: boolean;
  setNewStaffAllowReserve: (val: boolean) => void;
  newStaffAllowOvertime: boolean;
  setNewStaffAllowOvertime: (val: boolean) => void;
  creatingUser: boolean;
  newStaffConfirmPassword: string;
  setNewStaffConfirmPassword: (val: string) => void;
  handleCreateNewUser: () => void;
  newStaffJobRole: string;
  setNewStaffJobRole: (val: string) => void;
  newStaffWorkingHours: string;
  setNewStaffWorkingHours: (val: string) => void;
  newStaffBreakTime: string;
  setNewStaffBreakTime: (val: string) => void;
  newStaffSignInTime: string;
  setNewStaffSignInTime: (val: string) => void;
  newStaffSignOutTime: string;
  setNewStaffSignOutTime: (val: string) => void;
  newStaffEligibleOfficeLeave: boolean;
  setNewStaffEligibleOfficeLeave: (val: boolean) => void;
  newStaffEligibleGovtHoliday: boolean;
  setNewStaffEligibleGovtHoliday: (val: boolean) => void;
}

export function AdminCreateUserModal({
  showCreateUserModal,
  setShowCreateUserModal,
  profile,
  newStaffPassword,
  setNewStaffPassword,
  newStaffUsername,
  setNewStaffUsername,
  newStaffRole,
  setNewStaffRole,
  newStaffFullName,
  setNewStaffFullName,
  newStaffNeedsApproval,
  setNewStaffNeedsApproval,
  newStaffAllowReserve,
  setNewStaffAllowReserve,
  newStaffAllowOvertime,
  setNewStaffAllowOvertime,
  creatingUser,
  newStaffConfirmPassword,
  setNewStaffConfirmPassword,
  handleCreateNewUser,
  newStaffJobRole,
  setNewStaffJobRole,
  newStaffWorkingHours,
  setNewStaffWorkingHours,
  newStaffBreakTime,
  setNewStaffBreakTime,
  newStaffSignInTime,
  setNewStaffSignInTime,
  newStaffSignOutTime,
  setNewStaffSignOutTime,
  newStaffEligibleOfficeLeave,
  setNewStaffEligibleOfficeLeave,
  newStaffEligibleGovtHoliday,
  setNewStaffEligibleGovtHoliday,
}: AdminCreateUserModalProps) {
  const handleClose = () => {
    setShowCreateUserModal(false);
    setNewStaffPassword('1234');
    setNewStaffConfirmPassword('1234');
    setNewStaffUsername('');
    setNewStaffFullName('');
    setNewStaffRole('user');
    setNewStaffNeedsApproval(false);
    setNewStaffAllowReserve(false);
  };

  return (
    <Modal
      isOpen={showCreateUserModal && profile?.role === 'admin'}
      onClose={handleClose}
      title="Add New Staff"
      icon={<Plus className="h-5 w-5 text-orange-500" />}
      glowClass="bg-orange-900/10"
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Codename (Username)</label>
          <input
            type="text"
            placeholder="e.g., KI1024"
            value={newStaffUsername}
            onChange={(e) => setNewStaffUsername(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase font-mono"
          />
        </div>


        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Role</label>
          <select
            value={newStaffRole}
            onChange={(e) => setNewStaffRole(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="user">Staff / User</option>
            <option value="supervisor">Supervisor</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Checkboxes Grid */}
        <div className="grid grid-cols-1 gap-2.5 pt-2">
          <label className="flex items-center gap-3 p-3 bg-slate-955/60 rounded-lg border border-slate-800/80 cursor-pointer hover:bg-slate-900 transition-colors">
            <input
              type="checkbox"
              checked={newStaffNeedsApproval}
              onChange={(e) => setNewStaffNeedsApproval(e.target.checked)}
              className="h-4.5 w-4.5 rounded border-slate-800 bg-slate-955 text-orange-600 accent-orange-600 focus:ring-orange-550 focus:ring-offset-slate-900 focus:ring-2 cursor-pointer"
            />
            <div>
              <span className="block text-xs font-semibold text-white">Supervisor Approval?</span>
              <span className="block text-[10px] text-slate-400">If checked, leaves will require supervisor approval</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-955/60 rounded-lg border border-slate-800/80 cursor-pointer hover:bg-slate-900 transition-colors">
            <input
              type="checkbox"
              checked={newStaffEligibleOfficeLeave}
              onChange={(e) => setNewStaffEligibleOfficeLeave(e.target.checked)}
              className="h-4.5 w-4.5 rounded border-slate-800 bg-slate-950 text-orange-600 accent-orange-600 focus:ring-orange-550 focus:ring-offset-slate-900 focus:ring-2 cursor-pointer"
            />
            <div>
              <span className="block text-xs font-semibold text-white">Office Leave Eligible?</span>
              <span className="block text-[10px] text-slate-400">If enabled, eligible for annual office leaves and Eid holidays</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-955/60 rounded-lg border border-slate-800/80 cursor-pointer hover:bg-slate-900 transition-colors">
            <input
              type="checkbox"
              checked={newStaffEligibleGovtHoliday}
              onChange={(e) => setNewStaffEligibleGovtHoliday(e.target.checked)}
              className="h-4.5 w-4.5 rounded border-slate-800 bg-slate-955 text-orange-600 accent-orange-600 focus:ring-orange-550 focus:ring-offset-slate-900 focus:ring-2 cursor-pointer"
            />
            <div>
              <span className="block text-xs font-semibold text-white">Govt Holiday Eligible?</span>
              <span className="block text-[10px] text-slate-400">If enabled, eligible for leaves according to the government holiday list</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-955/60 rounded-lg border border-slate-800/80 cursor-pointer hover:bg-slate-900 transition-colors">
            <input
              type="checkbox"
              checked={newStaffAllowReserve}
              onChange={(e) => setNewStaffAllowReserve(e.target.checked)}
              className="h-4.5 w-4.5 rounded border-slate-800 bg-slate-955 text-orange-600 accent-orange-600 focus:ring-orange-550 focus:ring-offset-slate-900 focus:ring-2 cursor-pointer"
            />
            <div>
              <span className="block text-xs font-semibold text-white">Reserve Govt Holiday?</span>
              <span className="block text-[10px] text-slate-400">If checked, will have option to reserve government holidays</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-955/60 rounded-lg border border-slate-800/80 cursor-pointer hover:bg-slate-900 transition-colors">
            <input
              type="checkbox"
              checked={newStaffAllowOvertime}
              onChange={(e) => setNewStaffAllowOvertime(e.target.checked)}
              className="h-4.5 w-4.5 rounded border-slate-800 bg-slate-955 text-orange-600 accent-orange-600 focus:ring-orange-550 focus:ring-offset-slate-900 focus:ring-2 cursor-pointer"
            />
            <div>
              <span className="block text-xs font-semibold text-white">Overtime Category?</span>
              <span className="block text-[10px] text-slate-400">If checked, overtime leave category will be enabled</span>
            </div>
          </label>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 flex justify-center py-2 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-355 bg-slate-955 hover:bg-slate-900 cursor-pointer transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateNewUser}
            disabled={creatingUser || !newStaffUsername}
            className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {creatingUser && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
            {creatingUser ? 'Creating...' : 'Create Staff'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
