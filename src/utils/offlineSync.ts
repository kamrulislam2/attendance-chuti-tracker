import { supabase } from './supabase';

export interface ChutiRecord {
  id?: string;
  localId?: string; // local temporary ID
  user_id: string;
  username?: string;
  date: string;
  leave_type: string;
  adjustment: boolean;
  adjusted_hour?: string | null;
  sign_in_time: string | null;
  sign_out_time: string | null;
  leave_hour: string | null;
  reserve_holiday: string | null;
  reserve_adjustment_status?: string;
  status?: string;
  admin_edit_request?: any;
  admin_edit_status?: string;
  is_edited?: boolean;
  adjust_short_leave?: boolean;
  comment: string | null;
  synced: boolean;
  action?: 'insert' | 'update' | 'delete';
  data?: Partial<Omit<ChutiRecord, 'localId' | 'synced'>>;
}

const DB_NAME = 'ChutiOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'pending_chuti';

// Secure context safe UUID generator helper
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Helper to open IndexedDB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'localId' });
      }
    };
  });
};

// Save a record to IndexedDB
export const saveOfflineRecord = async (record: Omit<ChutiRecord, 'localId' | 'synced'>): Promise<string> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const localId = generateUUID();
    const newRecord: ChutiRecord = {
      ...record,
      localId,
      synced: false,
      action: 'insert',
    };

    const request = store.add(newRecord);
    request.onsuccess = () => resolve(localId);
    request.onerror = () => reject(request.error);
  });
};

// Save an update record to IndexedDB
export const saveOfflineUpdate = async (id: string, updates: Partial<Omit<ChutiRecord, 'localId' | 'synced'>>): Promise<string> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const localId = generateUUID();
    const newRecord: ChutiRecord = {
      localId,
      id,
      user_id: '', // Dummy values to satisfy required fields
      date: '',
      leave_type: '',
      adjustment: false,
      sign_in_time: null,
      sign_out_time: null,
      leave_hour: null,
      reserve_holiday: null,
      comment: null,
      synced: false,
      action: 'update',
      data: updates,
    };

    const request = store.add(newRecord);
    request.onsuccess = () => resolve(localId);
    request.onerror = () => reject(request.error);
  });
};

// Retrieve all unsynced local records
export const getOfflineRecords = async (): Promise<ChutiRecord[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

// Delete a single record from IndexedDB
export const deleteOfflineRecord = async (localId: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(localId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Sync all local records to Supabase
export const syncOfflineData = async (onSyncSuccess?: (syncedCount: number) => void): Promise<{ success: boolean; syncedCount: number; error?: string }> => {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return { success: false, syncedCount: 0, error: 'Device is offline' };
  }

  try {
    const offlineRecords = await getOfflineRecords();
    if (offlineRecords.length === 0) {
      return { success: true, syncedCount: 0 };
    }

    let syncedCount = 0;
    for (const record of offlineRecords) {
      if (record.action === 'update' && record.id && record.data) {
        // Sync offline update
        const { error: updateError } = await supabase
          .from('chuti')
          .update(record.data)
          .eq('id', record.id);

        if (updateError) {
          console.error('Error syncing offline update:', updateError);
          continue; // Skip this one, try the next
        }
      } else {
        // Sync offline insert
        // Check if there is already a record for this user and date in the db (duplicate prevention)
        const { data: existing } = await supabase
          .from('chuti')
          .select('id')
          .eq('user_id', record.user_id)
          .eq('date', record.date)
          .maybeSingle();

        if (!existing) {
          // Insert record without the local metadata fields
          const { error: insertError } = await supabase.from('chuti').insert({
            user_id: record.user_id,
            date: record.date,
            leave_type: record.leave_type,
            adjustment: record.adjustment,
            sign_in_time: record.sign_in_time,
            sign_out_time: record.sign_out_time,
            leave_hour: record.leave_hour,
            reserve_holiday: record.reserve_holiday,
            comment: record.comment,
            status: record.status || 'pending_supervisor',
            adjust_short_leave: record.adjust_short_leave || false,
          });

          if (insertError) {
            console.error('Error syncing record:', insertError);
            continue; // Skip this one, try the next
          }
        }
      }

      // If synced successfully, delete from local DB
      if (record.localId) {
        await deleteOfflineRecord(record.localId);
        syncedCount++;
      }
    }

    if (syncedCount > 0 && onSyncSuccess) {
      onSyncSuccess(syncedCount);
    }

    return { success: true, syncedCount };
  } catch (err: any) {
    console.error('Offline sync failed:', err);
    return { success: false, syncedCount: 0, error: err.message || 'Sync error' };
  }
};
