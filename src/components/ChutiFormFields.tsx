import React from 'react';
import { DateInput } from '@/components/DateInput';

interface ChutiFormFieldsProps {
  date: string;
  setDate: (val: string) => void;
  leaveType: string;
  setLeaveType: (val: string) => void;
  signInTime: string;
  setSignInTime: (val: string) => void;
  signOutTime: string;
  setSignOutTime: (val: string) => void;
  leaveHour: string;
  setLeaveHour: (val: string) => void;
  adjustment: boolean;
  setAdjustment: (val: boolean) => void;
  adjustShortLeave: boolean;
  setAdjustShortLeave: (val: boolean) => void;
  comment: string;
  setComment: (val: string) => void;
  allowOvertime: boolean;
}

export const ChutiFormFields: React.FC<ChutiFormFieldsProps> = ({
  date,
  setDate,
  leaveType,
  setLeaveType,
  signInTime,
  setSignInTime,
  signOutTime,
  setSignOutTime,
  leaveHour,
  setLeaveHour,
  adjustment,
  setAdjustment,
  adjustShortLeave,
  setAdjustShortLeave,
  comment,
  setComment,
  allowOvertime,
}) => {
  const isShortOrOvertime = leaveType !== 'Full Leave';
  const showAdjustmentSection = leaveType !== 'Full Leave';

  return (
    <>
      <div>
        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
          তারিখ
        </label>
        <div className="mt-1">
          <DateInput
            required
            value={date}
            onChange={setDate}
            className="bg-slate-955 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
          ছুটির ধরন
        </label>
        <select
          value={leaveType}
          onChange={(e) => setLeaveType(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="Short Leave">Short Leave</option>
          <option value="Full Leave">Full Leave</option>
          {(allowOvertime || leaveType === 'Overtime') && (
            <option value="Overtime">Overtime</option>
          )}
        </select>
      </div>

      {isShortOrOvertime && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                শুরুর সময়
              </label>
              <input
                type="time"
                required
                value={signInTime}
                onChange={(e) => setSignInTime(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                শেষের সময়
              </label>
              <input
                type="time"
                required
                value={signOutTime}
                onChange={(e) => setSignOutTime(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
              {leaveType === 'Overtime' ? 'মোট ওভারটাইম সময়' : 'মোট লিভ সময়'}
            </label>
            <input
              type="text"
              required
              placeholder="যেমন: 02:30"
              value={leaveHour}
              onChange={(e) => setLeaveHour(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-850 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
        </>
      )}

      {showAdjustmentSection && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-955/60 rounded-lg border border-slate-800/80">
            <div>
              <span className="block text-xs font-medium text-white font-semibold">
                অ্যাডজাস্টমেন্ট (Adjustment)
              </span>
              <span className="block text-[10px] text-slate-400">
                Yes দিলে মোট ছুটিতে যোগ হবে না
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const newAdj = !adjustment;
                setAdjustment(newAdj);
                if (!newAdj) {
                  setAdjustShortLeave(false);
                }
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                adjustment ? 'bg-blue-600' : 'bg-slate-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  adjustment ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {leaveType === 'Overtime' && adjustment && (
            <div className="flex items-center justify-between p-3 bg-slate-955/60 rounded-lg border border-slate-800/80 font-sans">
              <div>
                <span className="block text-xs font-medium text-white font-semibold">
                  Adjust with Short Leave?
                </span>
                <span className="block text-[10px] text-slate-400">
                  Yes দিলে শর্ট লিভ থেকে বিয়োগ হবে
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAdjustShortLeave(!adjustShortLeave)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  adjustShortLeave ? 'bg-emerald-600' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    adjustShortLeave ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
          মন্তব্য/কারণ
        </label>
        <textarea
          placeholder="ছুটির সংক্ষিপ্ত বিবরণ লিখুন..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
        />
      </div>
    </>
  );
};
