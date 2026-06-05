'use client';

import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { UserDashboardView } from '@/components/UserDashboardView';
import { AdminDashboardView } from '@/components/AdminDashboardView';
import { WelcomeModals } from '@/components/modals/WelcomeModals';
import { SupervisorApprovalModal } from '@/components/modals/SupervisorApprovalModal';
import { AddLeaveModal } from '@/components/modals/AddLeaveModal';
import { UserRevisionModal } from '@/components/modals/UserRevisionModal';
import { UserNotificationsModal } from '@/components/modals/UserNotificationsModal';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { AdjustmentModal } from '@/components/modals/AdjustmentModal';
import { AdminProfileSettingsModal } from '@/components/modals/AdminProfileSettingsModal';
import { AdminLeaveApprovalModal } from '@/components/modals/AdminLeaveApprovalModal';
import { AdminEditRecordModal } from '@/components/modals/AdminEditRecordModal';
import { AdminCancelAdjustmentModal } from '@/components/modals/AdminCancelAdjustmentModal';
import { AdminCreateUserModal } from '@/components/modals/AdminCreateUserModal';
import { AdminCredentialsModal } from '@/components/modals/AdminCredentialsModal';
import { AdminDeleteUserModal } from '@/components/modals/AdminDeleteUserModal';
import { AdminAddLeaveModal } from '@/components/modals/AdminAddLeaveModal';
import { 
  CheckCircle, 
  AlertTriangle
} from 'lucide-react';

import { useDashboardData } from '@/hooks/useDashboardData';
import { useChutiOperations } from '@/hooks/useChutiOperations';
import { useAdjustmentOperations } from '@/hooks/useAdjustmentOperations';
import { useAdminStaffOperations } from '@/hooks/useAdminStaffOperations';
import { useDerivedState } from '@/hooks/useDerivedState';
import { useExportOperations } from '@/hooks/useExportOperations';
import { useModalHandlers } from '@/hooks/useModalHandlers';


export default function Dashboard() {
  const router = useRouter();

  // Core Dashboard State & Real-time monitors
  const dashboardData = useDashboardData();
  const {
    sessionUser,
    profile,
    setProfile,
    isPushSubscribed,
    setIsPushSubscribed,
    isPushLoading,
    setIsPushLoading,
    loading,

    submitting,
    setSubmitting,
    isOnline,
    offlineCount,
    message,
    setMessage,
    userRecords,
    setUserRecords,
    adminRecords,
    setAdminRecords,
    profilesList,
    setProfilesList,
    adminActiveTab,
    setAdminActiveTab,
    viewingStaffId,
    setViewingStaffId,
    lastViewedTime,
    setLastViewedTime,
    theme,
    toggleTheme,
    showLeaveApprovalModal,
    setShowLeaveApprovalModal,
    showSupervisorApprovalModal,
    setShowSupervisorApprovalModal,
    showUserNotificationsModal,
    setShowUserNotificationsModal,
    approvingIds,
    setApprovingIds,
    reviewingIds,
    setReviewingIds,
    approvedIds,
    setApprovedIds,
    fetchRecords,
    checkOfflineQueue,
    handleManualSync,
    handleLogout,
    globalSettings,
    handleSaveGlobalSettings,
    holidayResponses,
    handleSaveHolidayResponse,
    initialFetchDone,
  } = dashboardData;

  // View Filter states
  const [filterType, setFilterType] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdminAddLeaveModal, setShowAdminAddLeaveModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('selectedYear') || new Date().getFullYear().toString();
    }
    return new Date().getFullYear().toString();
  });

  // Derived state (filtering, grouping, notifications, stats)
  const derivedState = useDerivedState({
    sessionUser,
    profile,
    userRecords,
    adminRecords,
    profilesList,
    selectedYear,
    filterType,
    filterStartDate,
    filterEndDate,
    viewingStaffId,
    lastViewedTime,
    holidayResponses,
    globalSettings,
    loading,
    initialFetchDone,
  });

  const {
    filteredUserRecords,
    getFilteredRecordsForUser,
    userStats,
    getUserSummaryStats,
    pendingProfileRequests,
    pendingReserveRequests,
    groupedSupervisorRequests,
    groupedChutiRequests,
    userNotificationsList,
    unreadUserNotificationsCount,
    staffProfile,
    individualRecords,
    staffStats,
    availableYears,
  } = derivedState;

  // Leave operations controller
  const chutiOps = useChutiOperations({
    sessionUser,
    profile,
    isOnline,
    fetchRecords,
    checkOfflineQueue,
    userRecords,
    setUserRecords,
    adminRecords,
    setAdminRecords,
    setMessage,
    submitting,
    setSubmitting,
    profilesList,
    approvingIds,
    setApprovingIds,
    reviewingIds,
    setReviewingIds,
    approvedIds,
    setApprovedIds,
    globalSettings,
  });

  const {
    // Add Leave
    showAddLeaveModal,
    setShowAddLeaveModal,
    date,
    setDate,
    leaveType,
    setLeaveType,
    adjustment,
    setAdjustment,
    adjustmentCategory,
    setAdjustmentCategory,
    adjustShortLeave,
    setAdjustShortLeave,
    signInTime,
    setSignInTime,
    signOutTime,
    setSignOutTime,
    leaveHour,
    setLeaveHour,
    comment,
    setComment,
    selectedSupervisors,
    setSelectedSupervisors,
    bulkDates,
    bulkAdjustments,
    handleAddBulkDate,
    handleUpdateBulkDate,
    handleUpdateBulkAdjustment,
    handleRemoveBulkDate,
    handleSubmit,

    // Delete
    showDeleteModal,
    setShowDeleteModal,
    recordToDelete,
    setRecordToDelete,
    deletingRecord,
    triggerDeleteRecord,
    handleConfirmDelete,

    // User Revision
    showUserRevisionModal,
    setShowUserRevisionModal,
    revisionRecord,
    setRevisionRecord,
    revisionDate,
    setRevisionDate,
    revisionLeaveType,
    setRevisionLeaveType,
    revisionAdjustment,
    setRevisionAdjustment,
    revisionAdjustShortLeave,
    setRevisionAdjustShortLeave,
    revisionSignInTime,
    setRevisionSignInTime,
    revisionSignOutTime,
    setRevisionSignOutTime,
    revisionLeaveHour,
    setRevisionLeaveHour,
    revisionComment,
    setRevisionComment,
    handleUserSubmitRevision,

    // Admin Edit
    showAdminEditModal,
    setShowAdminEditModal,
    adminEditRecord,
    adminEditDate,
    setAdminEditDate,
    adminEditLeaveType,
    setAdminEditLeaveType,
    adminEditSignInTime,
    setAdminEditSignInTime,
    adminEditSignOutTime,
    setAdminEditSignOutTime,
    adminEditLeaveHour,
    setAdminEditLeaveHour,
    adminEditAdjustment,
    setAdminEditAdjustment,
    adminEditAdjustShortLeave,
    setAdminEditAdjustShortLeave,
    adminEditComment,
    setAdminEditComment,
    handleAdminSaveEdit,

    // Approvals
    handleSupervisorApproveChuti,
    handleApproveChutiRequest,

    // Revision prompt
    showRevisionPromptModal,
    setShowRevisionPromptModal,
    submittingRevision,
    setRevisionPromptChutiId,
    revisionPromptText,
    setRevisionPromptText,
    submitRevisionWithReason,
  } = chutiOps;

  // Adjustment operations controller
  const adjustmentOps = useAdjustmentOperations({
    sessionUser,
    profile,
    adminActiveTab,
    isOnline,
    fetchRecords,
    setUserRecords,
    setAdminRecords,
    setMessage,
    submitting,
    setSubmitting,
    setApprovingIds,
    setApprovedIds,
  });

  const {
    showAdjustmentModal,
    setShowAdjustmentModal,
    adjustmentRecord,
    setAdjustmentRecord,
    adjustmentType,
    setAdjustmentType,
    partialAdjustmentTime,
    setPartialAdjustmentTime,
    setAdjustShortLeaveOption,
    showCancelAdjustmentModal,
    setShowCancelAdjustmentModal,
    cancelAdjustmentRecord,
    setCancelAdjustmentRecord,
    handleToggleAdjustmentClick,
    handleConfirmCancelAdjustment,
    handleSaveAdjustment,
    handleApproveReserveAdjustment,
  } = adjustmentOps;

  // Admin & Staff operations controller
  const adminStaffOps = useAdminStaffOperations({
    sessionUser,
    profile,
    setProfile,
    fetchRecords,
    profilesList,
    setProfilesList,
    setViewingStaffId,
    setMessage,
    isPushSubscribed,
    setIsPushSubscribed,
    isPushLoading,
    setIsPushLoading,
    adminActiveTab,
    setAdminActiveTab,
    handleLogout,
    router,
    setApprovingIds,
    setApprovedIds,
  });

  const {
    showWelcomePopup,
    setShowWelcomePopup,
    showFirstTimePasswordModal,
    firstTimePassword,
    setFirstTimePassword,
    firstTimeConfirmPassword,
    setFirstTimeConfirmPassword,
    firstTimePasswordSubmitting,
    firstTimePasswordError,

    handleFirstTimeSetupSubmit,

    setupFullName,
    setSetupFullName,
    setupUsername,
    setupWorkingHours,
    setSetupWorkingHours,
    setupBreakTime,
    setSetupBreakTime,
    setupJobRole,
    setSetupJobRole,
    setupSignInTime,
    setSetupSignInTime,
    setupSignOutTime,
    setSetupSignOutTime,
    setupSubmitting,
    setupError,
    handleSetupSubmit,

    showCreateUserModal,
    setShowCreateUserModal,
    newStaffPassword,
    setNewStaffPassword,
    newStaffConfirmPassword,
    setNewStaffConfirmPassword,
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
    handleCreateNewUser,

    showCredentialsModal,
    setShowCredentialsModal,
    credTargetUserId,
    setCredTargetUserId,
    credNewUsername,
    setCredNewUsername,
    credNewPassword,
    setCredNewPassword,
    credConfirmPassword,
    setCredConfirmPassword,
    updatingCredentials,
    handleUpdateCredentials,

    showDeleteUserModal,
    setShowDeleteUserModal,
    deleteTargetUser,
    setDeleteTargetUser,
    deletingUser,
    handleDeleteUser,

    showProfileSettingsModal,
    setShowProfileSettingsModal,
    editingStaffProfileId,
    setEditingStaffProfileId,
    isCodenameEditable,
    setIsCodenameEditable,
    editUsername,
    setEditUsername,
    editFullName,
    setEditFullName,
    editJobRole,
    setEditJobRole,
    editWorkingHours,
    setEditWorkingHours,
    editBreakTime,
    setEditBreakTime,
    profileSignInTime,
    setProfileSignInTime,
    profileSignOutTime,
    setProfileSignOutTime,
    editNeedsApproval,
    setEditNeedsApproval,
    editAllowReserve,
    setEditAllowReserve,
    editAllowOvertime,
    setEditAllowOvertime,
    editEligibleOfficeLeave,
    setEditEligibleOfficeLeave,
    editEligibleGovtHoliday,
    setEditEligibleGovtHoliday,
    isEditRequestMode,
    setIsEditRequestMode,
    editMaxFullLeaves,
    setEditMaxFullLeaves,
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

    handleUpdateSettings,
    handleApproveProfileChangeRequest,
    handleConvertShortLeaveToFullLeave,
  } = adminStaffOps;

  // Export operations
  const exportOps = useExportOperations({
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
  });

  const {
    handleExportIndividualCSV,
    handleExportIndividualExcel,
    handleExportIndividualPDF,
    handleExportSummaryCSV,
    handleExportSummaryExcel,
    handleExportSummaryPDF,
    handleExportHolidayResponsesCSV,
    handleExportHolidayResponsesExcel,
    handleExportHolidayResponsesPDF,
  } = exportOps;

  // Modal open/close handlers
  const modalHandlers = useModalHandlers({
    profile,
    adminActiveTab,
    setRevisionRecord,
    setRevisionDate,
    setRevisionLeaveType,
    setRevisionAdjustment,
    setRevisionAdjustShortLeave,
    setRevisionSignInTime,
    setRevisionSignOutTime,
    setRevisionLeaveHour,
    setRevisionComment,
    setShowUserRevisionModal,
    setAdminEditRecord: chutiOps.setAdminEditRecord,
    setAdminEditDate,
    setAdminEditLeaveType,
    setAdminEditAdjustment,
    setAdminEditAdjustShortLeave,
    setAdminEditSignInTime,
    setAdminEditSignOutTime,
    setAdminEditLeaveHour,
    setAdminEditComment,
    setShowAdminEditModal,
    setComment,
    setAdjustShortLeave,
    setDate,
    setShowAddLeaveModal,
    setSelectedSupervisors,
    setEditingStaffProfileId,
    setEditUsername,
    setIsCodenameEditable,
    setShowProfileSettingsModal,
    setIsEditRequestMode,
    setEditFullName,
    setEditWorkingHours,
    setProfileSignInTime,
    setProfileSignOutTime,
    setEditBreakTime,
    setEditJobRole,
    setEditNeedsApproval,
    setEditAllowReserve,
    setEditAllowOvertime,
    setEditEligibleOfficeLeave,
    setEditEligibleGovtHoliday,
    setEditMaxFullLeaves,
    setCredTargetUserId,
    setCredNewUsername,
    setCredNewPassword,
    setShowCredentialsModal,
    setDeleteTargetUser,
    setShowDeleteUserModal,
    setShowUserNotificationsModal,
    setShowLeaveApprovalModal,
    setShowSupervisorApprovalModal,
    setLastViewedTime,
    unreadUserNotificationsCount,
  });

  const {
    handleOpenAddLeaveModal,
    handleOpenRevisionModal,
    handleOpenAdminEditModal,
    handleOpenProfileSettingsForSelf,
    handleOpenProfileSettingsForStaff,
    handleOpenCredentialsModal,
    handleOpenDeleteUserModal,
    handleNotificationClick,
    handleResetFilters,
  } = modalHandlers;



  if (loading) {
    return (
      <div className="flex-1 min-h-screen flex flex-col bg-slate-950 items-center justify-center relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-20%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-violet-900/10 blur-[120px] pointer-events-none" />
        <div className="flex flex-col items-center gap-3 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          <span className="text-slate-400 text-xs font-semibold tracking-wider">লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen flex flex-col bg-slate-950 relative overflow-hidden pb-12">
      {/* Glow backgrounds */}
      <div className="absolute top-[-20%] right-[-20%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-violet-900/10 blur-[120px] pointer-events-none" />

      {/* 1. Header Bar */}
      <Navbar
        profile={profile}
        isOnline={isOnline}
        offlineCount={offlineCount}
        theme={theme}
        onThemeToggle={toggleTheme}
        onManualSync={handleManualSync}
        onLogout={handleLogout}
        onProfileSettingsClick={handleOpenProfileSettingsForSelf}
        onNotificationClick={handleNotificationClick}
        unreadUserNotificationsCount={unreadUserNotificationsCount}
        groupedSupervisorRequestsCount={groupedSupervisorRequests.length}
        groupedChutiRequestsCount={groupedChutiRequests.length}
        pendingReserveRequestsCount={pendingReserveRequests.length}
        pendingProfileRequestsCount={pendingProfileRequests.length}
        adminActiveTab={adminActiveTab}
      />

      {/* Alert Messages */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0f172a',
            color: '#cbd5e1',
            border: '1px solid #1e293b',
            fontSize: '12px',
            borderRadius: '12px',
            fontFamily: 'sans-serif',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#0f172a',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#0f172a',
            },
          },
        }}
      />

      {/* 2. Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 w-full z-10 flex-1 flex flex-col gap-6">
        
        {/* ================= STAFF VIEW ================= */}
        {profile?.has_changed_password !== false && (profile?.role === 'admin' || profile?.is_setup_completed !== false) && (profile?.role !== 'admin' || adminActiveTab === 'user') && (
          <UserDashboardView
            profile={profile}
            userStats={userStats}
            globalSettings={globalSettings}
            filteredUserRecords={filteredUserRecords}
            userRecords={userRecords}
            selectedYear={selectedYear}
            setSelectedYear={(val) => {
              setSelectedYear(val);
              sessionStorage.setItem('selectedYear', val);
            }}
            availableYears={availableYears}
            filterType={filterType}
            setFilterType={setFilterType}
            filterStartDate={filterStartDate}
            setFilterStartDate={setFilterStartDate}
            filterEndDate={filterEndDate}
            setFilterEndDate={setFilterEndDate}
            onResetFilters={() => handleResetFilters(setFilterType, setFilterStartDate, setFilterEndDate)}
            onExportCSV={(filtered, term) => handleExportIndividualCSV(sessionUser?.id || '', filtered, term)}
            onExportExcel={(filtered, term) => handleExportIndividualExcel(sessionUser?.id || '', filtered, term)}
            onExportPDF={(filtered, term) => handleExportIndividualPDF(sessionUser?.id || '', filtered, term)}
            onAddLeaveClick={handleOpenAddLeaveModal}
            onToggleAdjustment={handleToggleAdjustmentClick}
            onDeleteClick={triggerDeleteRecord}
            onRevisionClick={handleOpenRevisionModal}
            onConvertShortLeaveToFullLeave={handleConvertShortLeaveToFullLeave}
            holidayResponses={holidayResponses}
            onSaveHolidayResponse={handleSaveHolidayResponse}
            initialFetchDone={initialFetchDone}
          />
        )}

        {/* ================= ADMIN VIEW ================= */}
        {profile?.has_changed_password !== false && profile?.role === 'admin' && adminActiveTab === 'admin' && (
          <AdminDashboardView
            profilesList={profilesList}
            viewingStaffId={viewingStaffId}
            setViewingStaffId={setViewingStaffId}
            staffProfile={staffProfile}
            individualRecords={individualRecords}
            unfilteredStaffRecords={viewingStaffId ? adminRecords.filter(r => r.user_id === viewingStaffId) : []}
            staffStats={staffStats}
            filterType={filterType}
            setFilterType={setFilterType}
            filterStartDate={filterStartDate}
            setFilterStartDate={setFilterStartDate}
            filterEndDate={filterEndDate}
            setFilterEndDate={setFilterEndDate}
            onResetFilters={() => handleResetFilters(setFilterType, setFilterStartDate, setFilterEndDate)}
            onExportIndividualCSV={(filtered, term) => handleExportIndividualCSV(viewingStaffId || '', filtered, term)}
            onExportIndividualExcel={(filtered, term) => handleExportIndividualExcel(viewingStaffId || '', filtered, term)}
            onExportIndividualPDF={(filtered, term) => handleExportIndividualPDF(viewingStaffId || '', filtered, term)}
            onToggleAdjustment={handleToggleAdjustmentClick}
            onEditClick={handleOpenAdminEditModal}
            onDeleteClick={triggerDeleteRecord}
            selectedYear={selectedYear}
            setSelectedYear={(val) => {
              setSelectedYear(val);
              sessionStorage.setItem('selectedYear', val);
            }}
            availableYears={availableYears}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            getUserSummaryStats={getUserSummaryStats}
            onChangePasswordClick={handleOpenCredentialsModal}
            onEditProfileClick={handleOpenProfileSettingsForStaff}
            onDeleteUserClick={handleOpenDeleteUserModal}
            onAddStaffClick={() => setShowCreateUserModal(true)}
            onExportSummaryCSV={handleExportSummaryCSV}
            onExportSummaryExcel={handleExportSummaryExcel}
            onExportSummaryPDF={handleExportSummaryPDF}
            onAddLeaveClick={() => setShowAdminAddLeaveModal(true)}
            globalSettings={globalSettings}
            onSaveGlobalSettings={handleSaveGlobalSettings}
            onConvertShortLeaveToFullLeave={handleConvertShortLeaveToFullLeave}
            holidayResponses={holidayResponses}
            onExportHolidayResponsesCSV={handleExportHolidayResponsesCSV}
            onExportHolidayResponsesExcel={handleExportHolidayResponsesExcel}
            onExportHolidayResponsesPDF={handleExportHolidayResponsesPDF}
          />
        )}

      </main>
      
      {/* Welcome Modals (Onboarding & Password Reset) */}
      <WelcomeModals
        showWelcomePopup={showWelcomePopup}
        setShowWelcomePopup={setShowWelcomePopup}
        showFirstTimePasswordModal={showFirstTimePasswordModal}
        firstTimePasswordError={firstTimePasswordError || null}
        firstTimePassword={firstTimePassword}
        setFirstTimePassword={setFirstTimePassword}
        firstTimeConfirmPassword={firstTimeConfirmPassword}
        setFirstTimeConfirmPassword={setFirstTimeConfirmPassword}
        profile={profile}

        firstTimePasswordSubmitting={firstTimePasswordSubmitting}
        sessionUser={sessionUser}
        handleFirstTimeSetupSubmit={handleFirstTimeSetupSubmit}
        handleLogout={handleLogout}
        setupError={setupError || null}
        setupFullName={setupFullName}
        setSetupFullName={setSetupFullName}
        setupUsername={setupUsername}
        setupJobRole={setupJobRole}
        setSetupJobRole={setSetupJobRole}
        setupWorkingHours={setupWorkingHours}
        setSetupWorkingHours={setSetupWorkingHours}
        setupBreakTime={setupBreakTime}
        setSetupBreakTime={setSetupBreakTime}
        setupSignInTime={setupSignInTime}
        setSetupSignInTime={setSetupSignInTime}
        setupSignOutTime={setupSignOutTime}
        setSetupSignOutTime={setSetupSignOutTime}
        setupSubmitting={setupSubmitting}
        handleSetupSubmit={handleSetupSubmit}
      />

      {/* Admin Add Leave Modal */}
      <AdminAddLeaveModal
        showModal={showAdminAddLeaveModal}
        setShowModal={setShowAdminAddLeaveModal}
        staffProfile={staffProfile}
        onSuccess={fetchRecords}
        records={viewingStaffId ? adminRecords.filter(r => r.user_id === viewingStaffId) : []}
        globalSettings={globalSettings}
      />

      {/* User Leave & Personal Notifications Modals */}
      <AddLeaveModal
        showAddLeaveModal={showAddLeaveModal}
        setShowAddLeaveModal={setShowAddLeaveModal}
        date={date}
        setDate={setDate}
        leaveType={leaveType}
        setLeaveType={setLeaveType}
        adjustment={adjustment}
        setAdjustment={setAdjustment}
        adjustmentCategory={adjustmentCategory}
        setAdjustmentCategory={setAdjustmentCategory}
        adjustShortLeave={adjustShortLeave}
        setAdjustShortLeave={setAdjustShortLeave}
        signInTime={signInTime}
        setSignInTime={setSignInTime}
        signOutTime={signOutTime}
        setSignOutTime={setSignOutTime}
        leaveHour={leaveHour}
        setLeaveHour={setLeaveHour}
        comment={comment}
        setComment={setComment}
        bulkDates={bulkDates}
        bulkAdjustments={bulkAdjustments}
        handleAddBulkDate={handleAddBulkDate}
        handleUpdateBulkDate={handleUpdateBulkDate}
        handleUpdateBulkAdjustment={handleUpdateBulkAdjustment}
        handleRemoveBulkDate={handleRemoveBulkDate}
        profile={profile}
        submitting={submitting}
        handleSubmit={handleSubmit}
        records={userRecords}
        profilesList={profilesList}
        selectedSupervisors={selectedSupervisors}
        setSelectedSupervisors={setSelectedSupervisors}
        globalSettings={globalSettings}
      />

      <UserRevisionModal
        showUserRevisionModal={showUserRevisionModal}
        setShowUserRevisionModal={setShowUserRevisionModal}
        revisionRecord={revisionRecord}
        setRevisionRecord={setRevisionRecord}
        revisionDate={revisionDate}
        setRevisionDate={setRevisionDate}
        revisionLeaveType={revisionLeaveType}
        setRevisionLeaveType={setRevisionLeaveType}
        revisionAdjustment={revisionAdjustment}
        setRevisionAdjustment={setRevisionAdjustment}
        revisionAdjustShortLeave={revisionAdjustShortLeave}
        setRevisionAdjustShortLeave={setRevisionAdjustShortLeave}
        revisionSignInTime={revisionSignInTime}
        setRevisionSignInTime={setRevisionSignInTime}
        revisionSignOutTime={revisionSignOutTime}
        setRevisionSignOutTime={setRevisionSignOutTime}
        revisionLeaveHour={revisionLeaveHour}
        setRevisionLeaveHour={setRevisionLeaveHour}
        revisionComment={revisionComment}
        setRevisionComment={setRevisionComment}
        handleUserSubmitRevision={handleUserSubmitRevision}
        profile={profile}
        submitting={submitting}
      />

      <UserNotificationsModal
        showUserNotificationsModal={showUserNotificationsModal}
        setShowUserNotificationsModal={setShowUserNotificationsModal}
        userNotificationsList={userNotificationsList}
        adminActiveTab={adminActiveTab}
        setShowLeaveApprovalModal={setShowLeaveApprovalModal}
        setShowSupervisorApprovalModal={setShowSupervisorApprovalModal}
        profile={profile}
        setRevisionRecord={setRevisionRecord}
        setRevisionDate={setRevisionDate}
        setRevisionLeaveType={setRevisionLeaveType}
        setRevisionAdjustment={setRevisionAdjustment}
        setRevisionAdjustShortLeave={setRevisionAdjustShortLeave}
        setRevisionSignInTime={setRevisionSignInTime}
        setRevisionSignOutTime={setRevisionSignOutTime}
        setRevisionLeaveHour={setRevisionLeaveHour}
        setRevisionComment={setRevisionComment}
        setShowUserRevisionModal={setShowUserRevisionModal}
        onSaveHolidayResponse={handleSaveHolidayResponse}
      />

      <DeleteConfirmModal
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        recordToDelete={recordToDelete}
        setRecordToDelete={setRecordToDelete}
        deletingRecord={deletingRecord}
        handleConfirmDelete={handleConfirmDelete}
      />

      <AdjustmentModal
        showAdjustmentModal={showAdjustmentModal}
        setShowAdjustmentModal={setShowAdjustmentModal}
        adjustmentRecord={adjustmentRecord}
        setAdjustmentRecord={setAdjustmentRecord}
        adjustmentType={adjustmentType}
        setAdjustmentType={setAdjustmentType}
        partialAdjustmentTime={partialAdjustmentTime}
        setPartialAdjustmentTime={setPartialAdjustmentTime}
        setAdjustShortLeaveOption={setAdjustShortLeaveOption}
        handleSaveAdjustment={handleSaveAdjustment}
      />

      {/* Supervisor Approval & Revision Prompt Modals */}
      <SupervisorApprovalModal
        showSupervisorApprovalModal={showSupervisorApprovalModal}
        setShowSupervisorApprovalModal={setShowSupervisorApprovalModal}
        groupedSupervisorRequests={groupedSupervisorRequests}
        profilesList={profilesList}
        reviewingIds={reviewingIds}
        approvedIds={approvedIds}
        approvingIds={approvingIds}
        handleSupervisorApproveChuti={handleSupervisorApproveChuti}
        profile={profile}
        showRevisionPromptModal={showRevisionPromptModal}
        setShowRevisionPromptModal={setShowRevisionPromptModal}
        submittingRevision={submittingRevision}
        setRevisionPromptChutiId={setRevisionPromptChutiId}
        setRevisionPromptText={setRevisionPromptText}
        revisionPromptText={revisionPromptText}
        submitRevisionWithReason={submitRevisionWithReason}
      />

      {/* Admin Modals */}
      <AdminProfileSettingsModal
        showProfileSettingsModal={showProfileSettingsModal}
        setShowProfileSettingsModal={setShowProfileSettingsModal}
        profile={profile}
        editingStaffProfileId={editingStaffProfileId}
        sessionUser={sessionUser}
        isPushSubscribed={isPushSubscribed}
        setIsPushSubscribed={setIsPushSubscribed}
        isPushLoading={isPushLoading}
        setIsPushLoading={setIsPushLoading}
        adminActiveTab={adminActiveTab}
        setAdminActiveTab={setAdminActiveTab}
        setViewingStaffId={setViewingStaffId}
        isCodenameEditable={isCodenameEditable}
        setIsCodenameEditable={setIsCodenameEditable}
        editUsername={editUsername}
        setEditUsername={setEditUsername}
        editFullName={editFullName}
        setEditFullName={setEditFullName}
        editJobRole={editJobRole}
        setEditJobRole={setEditJobRole}
        editWorkingHours={editWorkingHours}
        setEditWorkingHours={setEditWorkingHours}
        editBreakTime={editBreakTime}
        setEditBreakTime={setEditBreakTime}
        profileSignInTime={profileSignInTime}
        setProfileSignInTime={setProfileSignInTime}
        profileSignOutTime={profileSignOutTime}
        setProfileSignOutTime={setProfileSignOutTime}
        editNeedsApproval={editNeedsApproval}
        setEditNeedsApproval={setEditNeedsApproval}
        editAllowReserve={editAllowReserve}
        setEditAllowReserve={setEditAllowReserve}
        editAllowOvertime={editAllowOvertime}
        setEditAllowOvertime={setEditAllowOvertime}
        editEligibleOfficeLeave={editEligibleOfficeLeave}
        setEditEligibleOfficeLeave={setEditEligibleOfficeLeave}
        editEligibleGovtHoliday={editEligibleGovtHoliday}
        setEditEligibleGovtHoliday={setEditEligibleGovtHoliday}
        isEditRequestMode={isEditRequestMode}
        setIsEditRequestMode={setIsEditRequestMode}
        setupSubmitting={setupSubmitting}
        handleUpdateSettings={handleUpdateSettings}
        editMaxFullLeaves={editMaxFullLeaves}
        setEditMaxFullLeaves={setEditMaxFullLeaves}
      />

      <AdminLeaveApprovalModal
        showLeaveApprovalModal={showLeaveApprovalModal}
        setShowLeaveApprovalModal={setShowLeaveApprovalModal}
        profile={profile}
        groupedChutiRequests={groupedChutiRequests}
        profilesList={profilesList}
        reviewingIds={reviewingIds}
        approvedIds={approvedIds}
        approvingIds={approvingIds}
        handleApproveChutiRequest={handleApproveChutiRequest}
        pendingReserveRequests={pendingReserveRequests}
        handleApproveReserveAdjustment={handleApproveReserveAdjustment}
        pendingProfileRequests={pendingProfileRequests}
        handleApproveProfileChangeRequest={handleApproveProfileChangeRequest}
      />

      <AdminEditRecordModal
        showAdminEditModal={showAdminEditModal}
        setShowAdminEditModal={setShowAdminEditModal}
        profile={profile}
        profilesList={profilesList}
        adminEditRecord={adminEditRecord}
        adminEditDate={adminEditDate}
        setAdminEditDate={setAdminEditDate}
        adminEditLeaveType={adminEditLeaveType}
        setAdminEditLeaveType={setAdminEditLeaveType}
        adminEditSignInTime={adminEditSignInTime}
        setAdminEditSignInTime={setAdminEditSignInTime}
        adminEditSignOutTime={adminEditSignOutTime}
        setAdminEditSignOutTime={setAdminEditSignOutTime}
        adminEditLeaveHour={adminEditLeaveHour}
        setAdminEditLeaveHour={setAdminEditLeaveHour}
        adminEditAdjustment={adminEditAdjustment}
        setAdminEditAdjustment={setAdminEditAdjustment}
        adminEditAdjustShortLeave={adminEditAdjustShortLeave}
        setAdminEditAdjustShortLeave={setAdminEditAdjustShortLeave}
        adminEditComment={adminEditComment}
        setAdminEditComment={setAdminEditComment}
        handleAdminSaveEdit={handleAdminSaveEdit}
      />

      <AdminCancelAdjustmentModal
        showCancelAdjustmentModal={showCancelAdjustmentModal}
        setShowCancelAdjustmentModal={setShowCancelAdjustmentModal}
        cancelAdjustmentRecord={cancelAdjustmentRecord}
        setCancelAdjustmentRecord={setCancelAdjustmentRecord}
        handleConfirmCancelAdjustment={handleConfirmCancelAdjustment}
        profile={profile}
        adminActiveTab={adminActiveTab}
      />

      <AdminCreateUserModal
        showCreateUserModal={showCreateUserModal}
        setShowCreateUserModal={setShowCreateUserModal}
        profile={profile}
        newStaffPassword={newStaffPassword}
        setNewStaffPassword={setNewStaffPassword}
        newStaffUsername={newStaffUsername}
        setNewStaffUsername={setNewStaffUsername}
        newStaffRole={newStaffRole}
        setNewStaffRole={setNewStaffRole}
        newStaffFullName={newStaffFullName}
        setNewStaffFullName={setNewStaffFullName}
        newStaffNeedsApproval={newStaffNeedsApproval}
        setNewStaffNeedsApproval={setNewStaffNeedsApproval}
        newStaffAllowReserve={newStaffAllowReserve}
        setNewStaffAllowReserve={setNewStaffAllowReserve}
        newStaffAllowOvertime={newStaffAllowOvertime}
        setNewStaffAllowOvertime={setNewStaffAllowOvertime}
        creatingUser={creatingUser}
        newStaffConfirmPassword={newStaffConfirmPassword}
        setNewStaffConfirmPassword={setNewStaffConfirmPassword}
        handleCreateNewUser={handleCreateNewUser}
        newStaffJobRole={newStaffJobRole}
        setNewStaffJobRole={setNewStaffJobRole}
        newStaffWorkingHours={newStaffWorkingHours}
        setNewStaffWorkingHours={setNewStaffWorkingHours}
        newStaffBreakTime={newStaffBreakTime}
        setNewStaffBreakTime={setNewStaffBreakTime}
        newStaffSignInTime={newStaffSignInTime}
        setNewStaffSignInTime={setNewStaffSignInTime}
        newStaffSignOutTime={newStaffSignOutTime}
        setNewStaffSignOutTime={setNewStaffSignOutTime}
        newStaffEligibleOfficeLeave={newStaffEligibleOfficeLeave}
        setNewStaffEligibleOfficeLeave={setNewStaffEligibleOfficeLeave}
        newStaffEligibleGovtHoliday={newStaffEligibleGovtHoliday}
        setNewStaffEligibleGovtHoliday={setNewStaffEligibleGovtHoliday}
      />

      <AdminCredentialsModal
        showCredentialsModal={showCredentialsModal}
        setShowCredentialsModal={setShowCredentialsModal}
        profile={profile}
        credTargetUserId={credTargetUserId}
        setCredTargetUserId={setCredTargetUserId}
        credNewUsername={credNewUsername}
        setCredNewUsername={setCredNewUsername}
        credNewPassword={credNewPassword}
        setCredNewPassword={setCredNewPassword}
        credConfirmPassword={credConfirmPassword}
        setCredConfirmPassword={setCredConfirmPassword}
        updatingCredentials={updatingCredentials}
        handleUpdateCredentials={handleUpdateCredentials}
      />

      <AdminDeleteUserModal
        showDeleteUserModal={showDeleteUserModal}
        setShowDeleteUserModal={setShowDeleteUserModal}
        deleteTargetUser={deleteTargetUser}
        setDeleteTargetUser={setDeleteTargetUser}
        deletingUser={deletingUser}
        handleDeleteUser={handleDeleteUser}
        profile={profile}
      />
    </div>
  );
}
