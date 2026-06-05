import { ChutiRecord } from '@/utils/offlineSync';

export interface Profile {
  id: string;
  username: string;
  role: 'admin' | 'supervisor' | 'user';
  username_changes?: number;
  username_request_status?: 'none' | 'pending' | 'approved';
  full_name?: string | null;
  working_hours?: number;
  break_time?: number;
  is_setup_completed?: boolean;
  job_role?: string | null;
  requested_full_name?: string | null;
  requested_working_hours?: number | null;
  requested_break_time?: number | null;
  requested_job_role?: string | null;
  profile_change_status?: 'none' | 'pending' | 'approved' | 'rejected';
  default_sign_in?: string | null;
  default_sign_out?: string | null;
  requested_default_sign_in?: string | null;
  requested_default_sign_out?: string | null;
  needs_supervisor_approval?: boolean;
  allow_reserve?: boolean;
  allow_overtime?: boolean;
  has_edited_profile?: boolean;
  has_changed_password?: boolean;
  max_full_leaves?: number;
  max_short_leaves?: number;
  eligible_office_leave?: boolean;
  eligible_govt_holiday?: boolean;
  converted_short_leaves_days?: number;
  converted_short_leaves_hours?: number;
  global_settings?: any;
}

export interface ChutiRecordWithProfile extends ChutiRecord {
  id: string;
  profiles?: {
    username: string;
  } | null;
}

export interface BulkRepresentative extends ChutiRecordWithProfile {
  is_bulk?: boolean;
  all_bulk_dates?: string[];
  all_bulk_ids?: string[];
  all_bulk_records?: ChutiRecordWithProfile[];
  formatted_bulk_dates?: string;
}

export interface GovtHolidayResponse {
  id: string;
  user_id: string;
  holiday_date: string;
  holiday_name: string;
  response: 'paid' | 'reserve';
  created_at?: string;
  profiles?: {
    full_name: string | null;
    username: string;
  } | null;
}
