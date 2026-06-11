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
          Full Name
        </label>
        <input
          type="text"
          required
          placeholder="e.g., Kamrul Islam"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={disabled}
          className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
          Job Role
        </label>
        <input
          type="text"
          required
          placeholder="e.g., IT Officer"
          value={jobRole}
          onChange={(e) => setJobRole(e.target.value)}
          disabled={disabled}
          className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
            Daily Working Hours
          </label>
          <select
            required
            value={workingHours}
            onChange={(e) => setWorkingHours(e.target.value)}
            disabled={disabled}
            className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="" disabled hidden>
              Select Hours
            </option>
            <option value="7.5">7 Hours 30 Mins</option>
            <option value="8.0">8 Hours</option>
            <option value="8.5">8 Hours 30 Mins</option>
            <option value="9.0">9 Hours</option>
            <option value="9.5">9 Hours 30 Mins</option>
            <option value="10.0">10 Hours</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
            Break (Minutes)
          </label>
          <input
            type="number"
            required
            min="0"
            value={breakTime}
            onChange={(e) => setBreakTime(e.target.value)}
            disabled={disabled}
            className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
            Default Sign-In Time
          </label>
          <input
            type="time"
            required
            value={signInTime}
            onChange={(e) => setSignInTime(e.target.value)}
            disabled={disabled}
            className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
            Default Sign-Out Time
          </label>
          <input
            type="time"
            required
            value={signOutTime}
            onChange={(e) => setSignOutTime(e.target.value)}
            disabled={disabled}
            className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </>
  );
};
