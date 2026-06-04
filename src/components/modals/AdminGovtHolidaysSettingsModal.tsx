'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, RefreshCw } from 'lucide-react';
import { GlobalSettings, formatDate } from '@/utils/dashboardHelpers';
import { DateInput } from '@/components/DateInput';
import { supabase } from '@/utils/supabase';

interface AdminGovtHolidaysSettingsModalProps {
  showModal: boolean;
  setShowModal: (val: boolean) => void;
  globalSettings: GlobalSettings;
  onSave: (settings: GlobalSettings) => Promise<boolean>;
}

export function AdminGovtHolidaysSettingsModal({
  showModal,
  setShowModal,
  globalSettings,
  onSave,
}: AdminGovtHolidaysSettingsModalProps) {
  const [govtHolidays, setGovtHolidays] = useState<{ date: string; name: string }[]>([]);
  const [newDate, setNewDate] = useState('');
  const [newName, setNewName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removedDates, setRemovedDates] = useState<string[]>([]);
  const [deleteConfirmInfo, setDeleteConfirmInfo] = useState<{ date: string; name: string } | null>(null);

  useEffect(() => {
    if (showModal) {
      const raw = globalSettings.govt_holidays || [];
      const parsed = raw.map((h: any) => {
        if (h && typeof h === 'object' && h.date) {
          return { date: h.date, name: h.name || 'সরকারি সাধারণ ছুটি' };
        }
        return { date: String(h), name: 'সরকারি সাধারণ ছুটি' };
      });
      setGovtHolidays(parsed);
      setError(null);
      setRemovedDates([]);
      setDeleteConfirmInfo(null);
      
      const today = new Date();
      const localDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
      setNewDate(localDate);
      setNewName('');
    }
  }, [showModal, globalSettings]);

  if (!showModal) return null;

  const handleAddDate = () => {
    if (!newDate) return;
    const nameVal = newName.trim() || 'সরকারি সাধারণ ছুটি';
    if (govtHolidays.some(h => h.date === newDate)) {
      setError('এই তারিখটি ইতিমধ্যে যোগ করা হয়েছে!');
      return;
    }
    setError(null);
    setGovtHolidays(prev => [...prev, { date: newDate, name: nameVal }].sort((a, b) => a.date.localeCompare(b.date)));
    setNewName('');
  };

  const handleRemoveDate = (dateToRemove: string, nameToRemove: string) => {
    setDeleteConfirmInfo({ date: dateToRemove, name: nameToRemove });
  };

  const executeRemoveDate = () => {
    if (!deleteConfirmInfo) return;
    const { date: dateToRemove } = deleteConfirmInfo;
    setError(null);
    setGovtHolidays(prev => prev.filter(h => h.date !== dateToRemove));
    setRemovedDates(prev => [...prev, dateToRemove]);
    setDeleteConfirmInfo(null);
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const activeDates = govtHolidays.map(h => h.date);
      if (activeDates.length === 0) {
        const { error: deleteError } = await supabase
          .from('govt_holiday_responses')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (deleteError) {
          console.error('Failed to delete all responses:', deleteError);
        }
      } else {
        const { error: deleteError } = await supabase
          .from('govt_holiday_responses')
          .delete()
          .not('holiday_date', 'in', `(${activeDates.join(',')})`);
        if (deleteError) {
          console.error('Failed to delete removed responses:', deleteError);
        }
      }

      const success = await onSave({
        ...globalSettings,
        govt_holidays: govtHolidays,
      });
      if (success) {
        setShowModal(false);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('সংরক্ষণ করতে সমস্যা হয়েছে!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-955/80 backdrop-blur-md p-4">
      <div className="flex min-h-full items-center justify-center">
        <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-6 relative overflow-hidden font-sans">
          <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[80px] pointer-events-none" />
          
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 mb-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" /> সরকারি ছুটির তালিকা
            </h3>
            <button 
              onClick={() => setShowModal(false)}
              className="text-slate-450 hover:text-white text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-950/50 border border-red-900/50 text-red-300 text-xs rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4 text-xs">
            {/* Add Date Picker & Name Input */}
            <div className="flex flex-col gap-2 bg-slate-955/60 p-3 rounded-lg border border-slate-850">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">ছুটির তারিখ</label>
                  <DateInput
                    value={newDate}
                    onChange={(val) => {
                      setNewDate(val);
                      setError(null);
                    }}
                    className="bg-slate-955"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">ছুটির নাম</label>
                  <input
                    type="text"
                    placeholder="যেমন: মে দিবস"
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      setError(null);
                    }}
                    className="w-full px-3 py-1.5 bg-slate-955 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 h-9"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddDate}
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all flex items-center justify-center cursor-pointer border border-blue-700 shadow-md h-9 text-xs font-bold gap-1"
              >
                <Plus className="h-4 w-4" /> তালিকায় যুক্ত করুন
              </button>
            </div>

            {/* List of dates */}
            <div>
              <label className="block text-slate-400 font-semibold mb-2">সরকারি ছুটির দিনসমূহ (সর্বমোট: {govtHolidays.length} দিন)</label>
              
              {govtHolidays.length === 0 ? (
                <div className="py-8 text-center text-slate-500 border border-dashed border-slate-850 rounded-xl bg-slate-955/20">
                  কোনো সরকারি ছুটি যোগ করা হয়নি।
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto border border-slate-850 rounded-xl bg-slate-955/20 divide-y divide-slate-850/60 font-mono">
                  {govtHolidays.map((h) => (
                    <div key={h.date} className="flex justify-between items-center px-4 py-2.5 hover:bg-slate-900/30 transition-all">
                      <div className="flex flex-col">
                        <span className="text-white font-semibold text-xs">{formatDate(h.date)}</span>
                        <span className="text-slate-400 text-[10px]">{h.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDate(h.date, h.name)}
                        className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-all cursor-pointer"
                        title="বাদ দিন"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 flex justify-center py-2 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 cursor-pointer transition-all"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={submitting}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
              >
                {submitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                সেভ করুন
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {deleteConfirmInfo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-955/90 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-850 shadow-2xl rounded-2xl w-full max-w-sm p-6 relative overflow-hidden font-sans text-center border-red-500/20">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-red-900/10 blur-[80px] pointer-events-none" />
            
            <div className="flex flex-col items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full">
                <Trash2 className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-white">ছুটি মুছে ফেলার নিশ্চিতকরণ ⚠️</h4>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed mb-6">
              এই সরকারি ছুটির দিনটি (<span className="text-red-400 font-semibold font-mono">{formatDate(deleteConfirmInfo.date)}</span> - <span className="text-white font-semibold">{deleteConfirmInfo.name}</span>) মুছে ফেললে সকল স্টাফের পছন্দ/রিজার্ভ রেকর্ড এবং রেসপন্স রিপোর্ট থেকেও এটি সম্পূর্ণ মুছে যাবে।
              <br /><br />
              <span className="text-amber-400 font-semibold">আপনি কি নিশ্চিতভাবে এটি মুছে ফেলতে চান?</span>
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmInfo(null)}
                className="flex-1 py-2 px-4 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-350 bg-slate-955 hover:bg-slate-900 cursor-pointer transition-all h-9"
              >
                না, বাতিল করুন
              </button>
              <button
                type="button"
                onClick={executeRemoveDate}
                className="flex-1 py-2 px-4 rounded-lg shadow-sm text-xs font-semibold text-white bg-red-600 hover:bg-red-500 cursor-pointer transition-all h-9"
              >
                হ্যাঁ, মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
