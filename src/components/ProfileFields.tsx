import React from 'react';

interface ProfileFieldsProps {
  fullName: string;
  setFullName: (val: string) => void;
  jobRole: string;
  setJobRole: (val: string) => void;
  workingHours: string;
  setWorkingHours: (val: string) => void;
  breakTime: string;
  setBreakTime: (val: string) => void;
  signInTime: string;
  setSignInTime: (val: string) => void;
  signOutTime: string;
  setSignOutTime: (val: string) => void;
  disabled?: boolean;
}

export const ProfileFields: React.FC<ProfileFieldsProps> = ({
  fullName,
  setFullName,
  jobRole,
  setJobRole,
  workingHours,
  setWorkingHours,
  breakTime,
  setBreakTime,
  signInTime,
  setSignInTime,
  signOutTime,
  setSignOutTime,
  disabled = false,
}) => {
  return (
    <>
      <div>
        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
          সম্পূর্ণ নাম (Full Name)
        </label>
        <input
          type="text"
          required
          placeholder="যেমন: কামরুল হাসান"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={disabled}
          className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
          জব রোল (Job Role)
        </label>
        <input
          type="text"
          required
          placeholder="যেমন: IT Officer"
          value={jobRole}
          onChange={(e) => setJobRole(e.target.value)}
          disabled={disabled}
          className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
            দৈনিক কর্মঘণ্টা
          </label>
          <select
            required
            value={workingHours}
            onChange={(e) => setWorkingHours(e.target.value)}
            disabled={disabled}
            className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="" disabled hidden>
              নির্বাচন করুন
            </option>
            <option value="7.5">৭ ঘণ্টা ৩০ মিনিট</option>
            <option value="8.0">৮ ঘণ্টা</option>
            <option value="8.5">৮ ঘণ্টা ৩০ মিনিট</option>
            <option value="9.0">৯ ঘণ্টা</option>
            <option value="9.5">৯ ঘণ্টা ৩০ মিনিট</option>
            <option value="10.0">১০ ঘণ্টা</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
            ব্রেক (মিনিট)
          </label>
          <input
            type="number"
            required
            min="0"
            value={breakTime}
            onChange={(e) => setBreakTime(e.target.value)}
            disabled={disabled}
            className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
            ডিফল্ট সাইন-ইন টাইম
          </label>
          <input
            type="time"
            required
            value={signInTime}
            onChange={(e) => setSignInTime(e.target.value)}
            disabled={disabled}
            className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
            ডিফল্ট সাইন-আউট টাইম
          </label>
          <input
            type="time"
            required
            value={signOutTime}
            onChange={(e) => setSignOutTime(e.target.value)}
            disabled={disabled}
            className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </>
  );
};
