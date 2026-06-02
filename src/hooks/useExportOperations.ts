import { useCallback } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Profile } from '@/types';
import { ChutiRecord } from '@/utils/offlineSync';
import { exportHelper } from '@/utils/exportHelper';

interface UseExportOperationsParams {
  profilesList: Profile[];
  sessionUser: SupabaseUser | null;
  profile: Profile | null;
  selectedYear: string;
  filterType: string;
  filterStartDate: string;
  filterEndDate: string;
  searchQuery: string;
  setMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void;
  getFilteredRecordsForUser: (userId: string) => ChutiRecord[];
  getUserSummaryStats: (userId: string) => { full: number; short: string; reserve: number; overtime: string };
}

export function useExportOperations({
  profilesList,
  sessionUser,
  profile,
  selectedYear,
  filterType,
  filterStartDate,
  filterEndDate,
  searchQuery,
  setMessage,
  getFilteredRecordsForUser,
  getUserSummaryStats,
}: UseExportOperationsParams) {

  const handleExportIndividualCSV = useCallback((userId: string, recordsToExport?: ChutiRecord[], searchTerm?: string) => {
    const staffProfile = profilesList.find(p => p.id === userId) || (userId === sessionUser?.id ? profile : null);
    const finalRecords = recordsToExport || getFilteredRecordsForUser(userId);
    
    exportHelper.exportIndividualCSV(
      userId,
      finalRecords,
      staffProfile,
      sessionUser,
      profile,
      {
        selectedYear,
        filterType,
        filterStartDate,
        filterEndDate,
        searchTerm: searchTerm || '',
      },
      () => {},
      (msg) => {
        setMessage({ type: 'error', text: msg });
      }
    );
  }, [profilesList, sessionUser, profile, selectedYear, filterType, filterStartDate, filterEndDate, setMessage, getFilteredRecordsForUser]);

  const handleExportIndividualExcel = useCallback((userId: string, recordsToExport?: ChutiRecord[], searchTerm?: string) => {
    const staffProfile = profilesList.find(p => p.id === userId) || (userId === sessionUser?.id ? profile : null);
    const finalRecords = recordsToExport || getFilteredRecordsForUser(userId);
    
    exportHelper.exportIndividualExcel(
      userId,
      finalRecords,
      staffProfile,
      sessionUser,
      profile,
      {
        selectedYear,
        filterType,
        filterStartDate,
        filterEndDate,
        searchTerm: searchTerm || '',
      },
      () => {},
      (msg) => {
        setMessage({ type: 'error', text: msg });
      }
    );
  }, [profilesList, sessionUser, profile, selectedYear, filterType, filterStartDate, filterEndDate, setMessage, getFilteredRecordsForUser]);

  const handleExportSummaryCSV = useCallback(() => {
    const staffProfiles = searchQuery.trim() 
      ? profilesList.filter(p => 
          (p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
          (p.username || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
      : profilesList;

    exportHelper.exportSummaryCSV(
      staffProfiles,
      getUserSummaryStats,
      {
        selectedYear,
        filterType,
        filterStartDate,
        filterEndDate,
        searchQuery,
      },
      () => {},
      (msg) => {
        setMessage({ type: 'error', text: msg });
      }
    );
  }, [profilesList, searchQuery, selectedYear, filterType, filterStartDate, filterEndDate, setMessage, getUserSummaryStats]);

  const handleExportSummaryExcel = useCallback(() => {
    const staffProfiles = searchQuery.trim() 
      ? profilesList.filter(p => 
          (p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
          (p.username || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
      : profilesList;

    exportHelper.exportSummaryExcel(
      staffProfiles,
      getUserSummaryStats,
      {
        selectedYear,
        filterType,
        filterStartDate,
        filterEndDate,
        searchQuery,
      },
      () => {},
      (msg) => {
        setMessage({ type: 'error', text: msg });
      }
    );
  }, [profilesList, searchQuery, selectedYear, filterType, filterStartDate, filterEndDate, setMessage, getUserSummaryStats]);

  const handleExportIndividualPDF = useCallback((userId: string, recordsToExport?: ChutiRecord[], searchTerm?: string) => {
    const staffProfile = profilesList.find(p => p.id === userId) || (userId === sessionUser?.id ? profile : null);
    const finalRecords = recordsToExport || getFilteredRecordsForUser(userId);
    
    exportHelper.exportIndividualPDF(
      userId,
      finalRecords,
      staffProfile,
      sessionUser,
      profile,
      {
        selectedYear,
        filterType,
        filterStartDate,
        filterEndDate,
        searchTerm: searchTerm || '',
      }
    );
  }, [profilesList, sessionUser, profile, selectedYear, filterType, filterStartDate, filterEndDate, getFilteredRecordsForUser]);

  const handleExportSummaryPDF = useCallback(() => {
    const staffProfiles = searchQuery.trim() 
      ? profilesList.filter(p => 
          (p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
          (p.username || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
      : profilesList;

    exportHelper.exportSummaryPDF(
      staffProfiles,
      getUserSummaryStats,
      {
        selectedYear,
        filterType,
        filterStartDate,
        filterEndDate,
        searchQuery,
      }
    );
  }, [profilesList, searchQuery, selectedYear, filterType, filterStartDate, filterEndDate, getUserSummaryStats]);

  return {
    handleExportIndividualCSV,
    handleExportIndividualExcel,
    handleExportIndividualPDF,
    handleExportSummaryCSV,
    handleExportSummaryExcel,
    handleExportSummaryPDF,
  };
}
