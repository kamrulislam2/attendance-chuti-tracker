/**
 * Error Handler Utility
 * Centralized error management with user-friendly Bengali messages
 */

interface ErrorInfo {
  code: string;
  userMessage: string;
  technicalMessage?: string;
  severity: 'error' | 'warning' | 'info';
}


export const errorHandler = {
  // ত্রুটি বার্তা ম্যাপিং
  errorMessages: {
    // অথেন্টিকেশন ত্রুটি
    'auth_invalid_credentials': 'ব্যবহারকারী নাম বা পাসওয়ার্ড ভুল।',
    'auth_user_not_found': 'এই ব্যবহারকারী বিদ্যমান নেই।',
    'auth_invalid_token': 'সেশন মেয়াদ উত্তীর্ণ হয়েছে। আবার লগইন করুন।',
    'auth_email_exists': 'এই ইমেইল ইতিমধ্যে ব্যবহৃত হয়েছে।',
    'auth_weak_password': 'পাসওয়ার্ড খুব দুর্বল।',

    // ডাটাবেস ত্রুটি
    'db_duplicate_key': 'এই তথ্য ইতিমধ্যে বিদ্যমান।',
    'db_unique_violation': 'এই মান ইতিমধ্যে ব্যবহৃত হয়েছে।',
    'db_not_found': 'অনুরোধ করা ডাটা পাওয়া যায়নি।',
    'db_permission_denied': 'আপনার এই কাজ করার অনুমতি নেই।',

    // নেটওয়ার্ক ত্রুটি
    'network_timeout': 'সংযোগ সময় শেষ হয়েছে। আবার চেষ্টা করুন।',
    'network_offline': 'ইন্টারনেট সংযোগ নেই।',
    'network_error': 'নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।',

    // ভ্যালিডেশন ত্রুটি
    'validation_required': 'এই ফিল্ড প্রয়োজনীয়।',
    'validation_format': 'ফরম্যাট সঠিক নয়।',
    'validation_range': 'মান সীমার বাইরে।',

    // সার্ভার ত্রুটি
    'server_internal': 'সার্ভার ত্রুটি। পরে আবার চেষ্টা করুন।',
    'server_unavailable': 'সেবা এখন উপলব্ধ নয়।',
    'server_maintenance': 'রক্ষণাবেক্ষণের জন্য সেবা বন্ধ।',

    // সাধারণ ত্রুটি
    'unknown': 'কিছু ত্রুটি ঘটেছে। আবার চেষ্টা করুন।',
    'operation_failed': 'অপারেশন ব্যর্থ হয়েছে।',
  } as Record<string, string>,

  /**
   * Supabase error হ্যান্ডলিং
   */
  handleSupabaseError: (error: unknown): ErrorInfo => {
    const err = error as { code?: string | number; message?: string } | null | undefined;
    const technicalMessage = err?.message || (error ? String(error) : '');

    // Duplicate key error
    if (err?.code === '23505' || err?.message?.includes('duplicate')) {
      return {
        code: 'db_duplicate_key',
        userMessage: 'এই তথ্য ইতিমধ্যে বিদ্যমান।',
        technicalMessage,
        severity: 'error'
      };
    }

    // Permission denied
    if (err?.code === '42501' || err?.message?.includes('permission')) {
      return {
        code: 'db_permission_denied',
        userMessage: 'আপনার এই কাজ করার অনুমতি নেই।',
        technicalMessage,
        severity: 'error'
      };
    }

    // Foreign key constraint
    if (err?.code === '23503' || err?.message?.includes('foreign')) {
      return {
        code: 'db_not_found',
        userMessage: 'সংযুক্ত রেকর্ড খুঁজে পাওয়া যায়নি।',
        technicalMessage,
        severity: 'error'
      };
    }

    // Default Supabase error
    return {
      code: 'server_error',
      userMessage: err?.message || 'ডাটাবেস ত্রুটি ঘটেছে।',
      technicalMessage,
      severity: 'error'
    };
  },

  /**
   * নেটওয়ার্ক ত্রুটি হ্যান্ডলিং
   */
  handleNetworkError: (error: unknown): ErrorInfo => {
    const err = error as { code?: string | number; message?: string } | null | undefined;
    const message = err?.message || '';

    if (message.includes('timeout') || err?.code === 'ECONNABORTED') {
      return {
        code: 'network_timeout',
        userMessage: 'সংযোগ সময় শেষ হয়েছে। আবার চেষ্টা করুন।',
        technicalMessage: message,
        severity: 'error'
      };
    }

    if (!navigator.onLine) {
      return {
        code: 'network_offline',
        userMessage: 'ইন্টারনেট সংযোগ নেই।',
        technicalMessage: message,
        severity: 'error'
      };
    }

    return {
      code: 'network_error',
      userMessage: 'নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।',
      technicalMessage: message,
      severity: 'error'
    };
  },

  /**
   * যেকোনো ত্রুটি হ্যান্ডলিং
   */
  handleError: (error: unknown): ErrorInfo => {
    const err = error as { code?: string | number; message?: string } | null | undefined;
    
    // Supabase error
    if (err?.code && typeof err.code === 'string') {
      return errorHandler.handleSupabaseError(error);
    }

    // Network error
    if (err?.message?.includes('fetch') || !navigator.onLine) {
      return errorHandler.handleNetworkError(error);
    }

    // Known error message
    const message = err?.message || '';
    for (const [key, value] of Object.entries(errorHandler.errorMessages)) {
      if (message.toLowerCase().includes(key)) {
        return {
          code: key,
          userMessage: value,
          technicalMessage: message,
          severity: 'error'
        };
      }
    }

    // Default error
    return {
      code: 'unknown',
      userMessage: 'কিছু ত্রুটি ঘটেছে। আবার চেষ্টা করুন।',
      technicalMessage: message || JSON.stringify(error),
      severity: 'error'
    };
  },

  /**
   * ব্যবহারকারী-বান্ধব বার্তা পান
   */
  getUserMessage: (code: string): string => {
    return errorHandler.errorMessages[code] || errorHandler.errorMessages['unknown'];
  },

  /**
   * লগ করুন (ডেভেলপমেন্টে)
   */
  logError: (error: unknown, context?: string): void => {
    if (typeof window !== 'undefined' && (!process.env.NODE_ENV || process.env.NODE_ENV === 'development')) {
      console.error(`[Error] ${context || 'Unknown'}:`, error);
    }
  },

  /**
   * সফলতার বার্তা
   */
  getSuccessMessage: (action: string): string => {
    const messages: Record<string, string> = {
      'create': 'সফলভাবে তৈরি করা হয়েছে।',
      'update': 'সফলভাবে আপডেট করা হয়েছে।',
      'delete': 'সফলভাবে ডিলিট করা হয়েছে।',
      'approve': 'সফলভাবে অনুমোদন করা হয়েছে।',
      'reject': 'সফলভাবে প্রত্যাখ্যান করা হয়েছে।',
      'submit': 'সফলভাবে জমা দেওয়া হয়েছে।',
      'sync': 'সফলভাবে সিঙ্ক করা হয়েছে।',
      'export': 'সফলভাবে রপ্তানি করা হয়েছে।',
    };
    return messages[action] || 'সফলভাবে সম্পন্ন হয়েছে।';
  }
};
