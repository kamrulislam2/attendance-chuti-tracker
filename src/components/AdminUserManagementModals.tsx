import React from 'react';
import { Plus, Edit, AlertTriangle, RefreshCw } from 'lucide-react';
import { Profile } from '../types';

interface AdminUserManagementModalsProps {
  profile: Profile | null;
  
  // Create User Modal States & Handlers
  showCreateUserModal: boolean;
  setShowCreateUserModal: (val: boolean) => void;
  newStaffFullName: string;
  setNewStaffFullName: (val: string) => void;
  newStaffUsername: string;
  setNewStaffUsername: (val: string) => void;
  newStaffEmail: string;
  setNewStaffEmail: (val: string) => void;
  newStaffPassword: string;
  setNewStaffPassword: (val: string) => void;
  newStaffConfirmPassword: string;
  setNewStaffConfirmPassword: (val: string) => void;
  newStaffRole: string;
  setNewStaffRole: (val: string) => void;
  newStaffNeedsApproval: boolean;
  setNewStaffNeedsApproval: (val: boolean) => void;
  newStaffAllowReserve: boolean;
  setNewStaffAllowReserve: (val: boolean) => void;
  newStaffAllowOvertime: boolean;
  setNewStaffAllowOvertime: (val: boolean) => void;
  creatingUser: boolean;
  handleCreateNewUser: () => Promise<void>;

  // Credentials Modal States & Handlers
  showCredentialsModal: boolean;
  setShowCredentialsModal: (val: boolean) => void;
  credNewUsername: string;
  setCredNewUsername: (val: string) => void;
  credNewPassword: string;
  setCredNewPassword: (val: string) => void;
  credConfirmPassword: string;
  setCredConfirmPassword: (val: string) => void;
  setCredTargetUserId: (val: string | null) => void;
  updatingCredentials: boolean;
  handleUpdateCredentials: () => Promise<void>;

  // Delete User Modal States & Handlers
  showDeleteUserModal: boolean;
  setShowDeleteUserModal: (val: boolean) => void;
  deleteTargetUser: Profile | null;
  setDeleteTargetUser: (val: Profile | null) => void;
  deletingUser: boolean;
  handleDeleteUser: () => Promise<void>;

  // Helper
  getPasswordMatchIndicator: (pass: string, conf: string) => React.ReactNode;
}

export const AdminUserManagementModals: React.FC<AdminUserManagementModalsProps> = ({
  profile,
  
  // Create User
  showCreateUserModal,
  setShowCreateUserModal,
  newStaffFullName,
  setNewStaffFullName,
  newStaffUsername,
  setNewStaffUsername,
  newStaffEmail,
  setNewStaffEmail,
  newStaffPassword,
  setNewStaffPassword,
  newStaffConfirmPassword,
  setNewStaffConfirmPassword,
  newStaffRole,
  setNewStaffRole,
  newStaffNeedsApproval,
  setNewStaffNeedsApproval,
  newStaffAllowReserve,
  setNewStaffAllowReserve,
  newStaffAllowOvertime,
  setNewStaffAllowOvertime,
  creatingUser,
  handleCreateNewUser,

  // Credentials
  showCredentialsModal,
  setShowCredentialsModal,
  credNewUsername,
  setCredNewUsername,
  credNewPassword,
  setCredNewPassword,
  credConfirmPassword,
  setCredConfirmPassword,
  setCredTargetUserId,
  updatingCredentials,
  handleUpdateCredentials,

  // Delete User
  showDeleteUserModal,
  setShowDeleteUserModal,
  deleteTargetUser,
  setDeleteTargetUser,
  deletingUser,
  handleDeleteUser,

  // Helpers
  getPasswordMatchIndicator,
}) => {
  if (profile?.role !== 'admin') return null;

  return (
    <>
      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-955/80 backdrop-blur-md p-4">
          <div className="flex min-h-full items-center justify-center">
            <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden my-8">
              <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-purple-900/10 blur-[80px] pointer-events-none" />
              
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 mb-5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Plus className="h-5 w-5 text-purple-500" /> নতুন স্টাফ যুক্ত করুন
                </h3>
                <button 
                  onClick={() => {
                    setShowCreateUserModal(false);
                    setNewStaffEmail('');
                    setNewStaffPassword('');
                    setNewStaffConfirmPassword('');
                    setNewStaffUsername('');
                    setNewStaffFullName('');
                    setNewStaffRole('user');
                  }}
                  className="text-slate-455 hover:text-white text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">স্টাফ নাম (Full Name)</label>
                  <input
                    type="text"
                    placeholder="যেমন: Kamrul Islam"
                    value={newStaffFullName}
                    onChange={(e) => setNewStaffFullName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">কোডনেম (Codename / Username)</label>
                  <input
                    type="text"
                    placeholder="যেমন: KI1024"
                    value={newStaffUsername}
                    onChange={(e) => setNewStaffUsername(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">ইউজার আইডি (User ID)</label>
                  <input
                    type="email"
                    placeholder="যেমন: ki1024"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">পাসওয়ার্ড (Password)</label>
                  <input
                    type="password"
                    placeholder="কমপক্ষে 4-6টি ক্যারেক্টার"
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">পাসওয়ার্ড নিশ্চিত করুন (Confirm Password)</label>
                  <input
                    type="password"
                    placeholder="পাসওয়ার্ডটি আবার লিখুন"
                    value={newStaffConfirmPassword}
                    onChange={(e) => setNewStaffConfirmPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {getPasswordMatchIndicator(newStaffPassword, newStaffConfirmPassword)}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">রোল (Role)</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="user">Staff / User</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* Needs Supervisor Approval Toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="block text-sm font-medium text-white font-semibold">Supervisor Approval?</span>
                    <span className="block text-[11px] text-slate-400">Yes দিলে ছুটির জন্য সুপারভাইজার অ্যাপ্রুভাল লাগবে</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewStaffNeedsApproval(!newStaffNeedsApproval)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      newStaffNeedsApproval ? 'bg-purple-600' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        newStaffNeedsApproval ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Allow Reserve Toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="block text-sm font-medium text-white font-semibold">Reserve Holiday?</span>
                    <span className="block text-[11px] text-slate-400">Yes দিলে রিজার্ভ ছুটির ক্যাটাগরি চালু হবে</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewStaffAllowReserve(!newStaffAllowReserve)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      newStaffAllowReserve ? 'bg-purple-600' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        newStaffAllowReserve ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Allow Overtime Toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="block text-sm font-medium text-white font-semibold">Overtime Category?</span>
                    <span className="block text-[11px] text-slate-400">Yes দিলে ওভারটাইমের ক্যাটাগরি চালু হবে</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewStaffAllowOvertime(!newStaffAllowOvertime)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      newStaffAllowOvertime ? 'bg-purple-600' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        newStaffAllowOvertime ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateUserModal(false);
                      setNewStaffEmail('');
                      setNewStaffPassword('');
                      setNewStaffConfirmPassword('');
                      setNewStaffUsername('');
                      setNewStaffFullName('');
                      setNewStaffRole('user');
                      setNewStaffNeedsApproval(false);
                    }}
                    className="flex-1 flex justify-center py-2 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 cursor-pointer transition-all"
                  >
                    বাতিল
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateNewUser}
                    disabled={creatingUser || !newStaffPassword || newStaffPassword !== newStaffConfirmPassword || newStaffPassword.length < 4}
                    className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {creatingUser && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                    {creatingUser ? 'তৈরি হচ্ছে...' : 'স্টাফ তৈরি করুন'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Edit Modal */}
      {showCredentialsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-955/80 backdrop-blur-md p-4">
          <div className="flex min-h-full items-center justify-center">
            <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden my-8">
              <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[80px] pointer-events-none" />
              
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 mb-5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit className="h-5 w-5 text-blue-500" /> Change Password প্যানেল
                </h3>
                <button 
                  onClick={() => {
                    setShowCredentialsModal(false);
                    setCredTargetUserId(null);
                    setCredNewUsername('');
                    setCredNewPassword('');
                    setCredConfirmPassword('');
                  }}
                  className="text-slate-455 hover:text-white text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-blue-955/20 border border-blue-900/30 rounded-xl text-xs text-blue-300">
                  <p>💡 এখানে আপনি এই স্টাফের জন্য নতুন <strong>কোডনেম (Username)</strong> অথবা নতুন <strong>পাসওয়ার্ড</strong> সেট করতে পারবেন। পাসওয়ার্ড পরিবর্তন করলে স্টাফকে পরের বার নতুন পাসওয়ার্ড দিয়ে লগইন করতে হবে।</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">নতুন কোডনেম (Username)</label>
                  <input
                    type="text"
                    placeholder="যেমন: KMH"
                    value={credNewUsername}
                    onChange={(e) => setCredNewUsername(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">নতুন পাসওয়ার্ড (Password)</label>
                  <input
                    type="password"
                    placeholder="পরিবর্তন না করতে চাইলে ফাঁকা রাখুন"
                    value={credNewPassword}
                    onChange={(e) => setCredNewPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">নতুন পাসওয়ার্ড নিশ্চিত করুন (Confirm Password)</label>
                  <input
                    type="password"
                    placeholder="নতুন পাসওয়ার্ডটি আবার লিখুন"
                    value={credConfirmPassword}
                    onChange={(e) => setCredConfirmPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {getPasswordMatchIndicator(credNewPassword, credConfirmPassword)}
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCredentialsModal(false);
                      setCredTargetUserId(null);
                      setCredNewUsername('');
                      setCredNewPassword('');
                      setCredConfirmPassword('');
                    }}
                    className="flex-1 flex justify-center py-2 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 cursor-pointer transition-all"
                  >
                    বাতিল
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateCredentials}
                    disabled={updatingCredentials || (credNewPassword ? (credNewPassword !== credConfirmPassword || credNewPassword.length < 4) : false)}
                    className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {updatingCredentials && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                    {updatingCredentials ? 'সেভ হচ্ছে...' : 'আপডেট করুন'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteUserModal && deleteTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-red-900/10 blur-[80px] pointer-events-none" />
            
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-red-600/10 border border-red-500/20 text-red-400 rounded-2xl mb-3">
                <AlertTriangle className="h-6 w-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white">স্টাফ অ্যাকাউন্ট মুছে ফেলা নিশ্চিতকরণ</h3>
              <p className="text-xs text-slate-350 mt-2">
                আপনি কি নিশ্চিতভাবে স্টাফ <strong className="text-white">"{deleteTargetUser.full_name || deleteTargetUser.username}"</strong>-কে মুছে ফেলতে চান?
              </p>
              <p className="text-xs text-red-400 mt-2 font-semibold">
                ⚠️ সতর্কীকরণ: অ্যাকাউন্টটি মুছে ফেললে তার বাৎসরিক সমস্ত ছুটির রেকর্ডও স্থায়ীভাবে মুছে যাবে এবং এটি আর ফিরে পাওয়া সম্ভব নয়।
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteUserModal(false);
                  setDeleteTargetUser(null);
                }}
                className="flex-1 flex justify-center py-2 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 cursor-pointer transition-all"
              >
                না, বাতিল করুন
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deletingUser}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-red-600 hover:bg-red-700 cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deletingUser && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                {deletingUser ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, স্টাফ মুছে ফেলুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
