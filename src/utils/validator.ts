/**
 * Input Validation Utilities
 * All validations return { isValid, errors } format
 */

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Helper to safely parse numbers
const parseNum = (val: string | number | undefined, defaultVal: number = 0): number => {
  if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? defaultVal : parsed;
  }
  return defaultVal;
};

export const validator = {
  // ছুটির ফর্ম ভ্যালিডেশন
  validateLeaveForm: (data: {
    date?: string;
    leaveType?: string;
    signInTime?: string;
    signOutTime?: string;
    leaveHour?: string;
    reserveHoliday?: string;
  }): ValidationResult => {
    const errors: string[] = [];

    if (!data.date) {
      errors.push('তারিখ নির্বাচন করুন।');
    } else {
      // Date format validation (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
        errors.push('সঠিক তারিখ ফরম্যাট ব্যবহার করুন (YYYY-MM-DD)।');
      }
      // Date should not be in future
      const selectedDate = new Date(data.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate > today) {
        errors.push('ভবিষ্যতের তারিখ নির্বাচন করা যায় না।');
      }
    }

    if (!data.leaveType) {
      errors.push('ছুটির ধরন নির্বাচন করুন।');
    } else {
      const validTypes = ['Full Leave', 'Short Leave', 'Overtime'];
      if (!validTypes.includes(data.leaveType)) {
        errors.push('অবৈধ ছুটির ধরন।');
      }
    }

    // Time validation only for Short Leave and Overtime
    if (
      data.leaveType === 'Short Leave' ||
      data.leaveType === 'Overtime'
    ) {
      if (!data.signInTime) {
        errors.push('সাইন-ইন সময় নির্বাচন করুন।');
      } else if (!/^\d{2}:\d{2}$/.test(data.signInTime)) {
        errors.push('সাইন-ইন সময় সঠিক ফরম্যাটে দিন (HH:MM)।');
      }

      if (!data.signOutTime) {
        errors.push('সাইন-আউট সময় নির্বাচন করুন।');
      } else if (!/^\d{2}:\d{2}$/.test(data.signOutTime)) {
        errors.push('সাইন-আউট সময় সঠিক ফরম্যাটে দিন (HH:MM)।');
      }

      // Check if sign out time is after sign in time
      if (data.signInTime && data.signOutTime) {
        const [inH, inM] = data.signInTime.split(':').map(Number);
        const [outH, outM] = data.signOutTime.split(':').map(Number);
        const inMins = inH * 60 + inM;
        const outMins = outH * 60 + outM;

        if (outMins <= inMins) {
          errors.push('সাইন-আউট সময় সাইন-ইন সময়ের চেয়ে বড় হতে হবে।');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // প্রোফাইল ফর্ম ভ্যালিডেশন
  validateProfileForm: (data: {
    fullName?: string;
    jobRole?: string;
    workingHours?: string | number;
    breakTime?: string | number;
    signInTime?: string;
    signOutTime?: string;
  }): ValidationResult => {
    const errors: string[] = [];

    if (!data.fullName || data.fullName.trim() === '') {
      errors.push('পূর্ণ নাম দিন।');
    } else if (data.fullName.length < 2) {
      errors.push('নাম কমপক্ষে ২ অক্ষরের হতে হবে।');
    } else if (data.fullName.length > 100) {
      errors.push('নাম সর্বোচ্চ ১০০ অক্ষরের হতে পারে।');
    }

    if (!data.jobRole || data.jobRole.trim() === '') {
      errors.push('চাকরির পদবি দিন।');
    }

    const workingHrs = parseNum(data.workingHours);
    if (isNaN(workingHrs) || workingHrs < 1 || workingHrs > 24) {
      errors.push('কর্মঘণ্টা ১ থেকে ২৪ ঘণ্টার মধ্যে হতে হবে।');
    }

    const breakHrs = parseNum(data.breakTime);
    if (isNaN(breakHrs) || breakHrs < 0 || breakHrs > 480) {
      errors.push('বিরতি ০ থেকে ৪৮০ মিনিটের মধ্যে হতে হবে।');
    }

    if (data.signInTime && !/^\d{2}:\d{2}$/.test(data.signInTime)) {
      errors.push('সাইন-ইন সময় সঠিক ফরম্যাটে দিন (HH:MM)।');
    }

    if (data.signOutTime && !/^\d{2}:\d{2}$/.test(data.signOutTime)) {
      errors.push('সাইন-আউট সময় সঠিক ফরম্যাটে দিন (HH:MM)।');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // ব্যবহারকারী তৈরির ফর্ম ভ্যালিডেশন
  validateCreateUserForm: (data: {
    email?: string;
    password?: string;
    confirmPassword?: string;
    username?: string;
    fullName?: string;
    role?: string;
  }): ValidationResult => {
    const errors: string[] = [];

    if (!data.email || data.email.trim() === '') {
      errors.push('ইমেইল দিন।');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('বৈধ ইমেইল দিন।');
    }

    if (!data.password || data.password.length === 0) {
      errors.push('পাসওয়ার্ড দিন।');
    } else if (data.password.length < 4) {
      errors.push('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
    }

    if (data.password !== data.confirmPassword) {
      errors.push('পাসওয়ার্ড মেলেনি।');
    }

    if (!data.username || data.username.trim() === '') {
      errors.push('ব্যবহারকারী নাম দিন।');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(data.username)) {
      errors.push('ব্যবহারকারী নাম শুধুমাত্র অক্ষর, সংখ্যা, - এবং _ ধারণ করতে পারে।');
    }

    if (!data.fullName || data.fullName.trim() === '') {
      errors.push('পূর্ণ নাম দিন।');
    }

    if (!data.role || !['admin', 'user', 'supervisor'].includes(data.role)) {
      errors.push('সঠিক ভূমিকা নির্বাচন করুন।');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // সাধারণ পাসওয়ার্ড ভ্যালিডেশন
  validatePassword: (password: string): ValidationResult => {
    const errors: string[] = [];

    if (!password) {
      errors.push('পাসওয়ার্ড দিন।');
    } else if (password.length < 4) {
      errors.push('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
    } else if (password.length > 128) {
      errors.push('পাসওয়ার্ড সর্বোচ্চ ১২৮ অক্ষরের হতে পারে।');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // সাধারণ username ভ্যালিডেশন
  validateUsername: (username: string): ValidationResult => {
    const errors: string[] = [];

    if (!username || username.trim() === '') {
      errors.push('ব্যবহারকারী নাম দিন।');
    } else if (username.length < 2) {
      errors.push('ব্যবহারকারী নাম কমপক্ষে ২ অক্ষরের হতে হবে।');
    } else if (username.length > 50) {
      errors.push('ব্যবহারকারী নাম সর্বোচ্চ ৫০ অক্ষরের হতে পারে।');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      errors.push('ব্যবহারকারী নাম শুধুমাত্র অক্ষর, সংখ্যা, - এবং _ ধারণ করতে পারে।');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // সময় ফরম্যাট ভ্যালিডেশন
  validateTimeFormat: (timeStr: string): ValidationResult => {
    const errors: string[] = [];

    if (!timeStr) {
      errors.push('সময় দিন।');
    } else if (!/^\d{2}:\d{2}$/.test(timeStr)) {
      errors.push('সঠিক সময় ফরম্যাট ব্যবহার করুন (HH:MM)।');
    } else {
      const [hours, minutes] = timeStr.split(':').map(Number);
      if (hours < 0 || hours > 23) {
        errors.push('ঘণ্টা ০-২৩ এর মধ্যে হতে হবে।');
      }
      if (minutes < 0 || minutes > 59) {
        errors.push('মিনিট ০-৫৯ এর মধ্যে হতে হবে।');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // তারিখ ফরম্যাট ভ্যালিডেশন
  validateDateFormat: (dateStr: string): ValidationResult => {
    const errors: string[] = [];

    if (!dateStr) {
      errors.push('তারিখ দিন।');
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      errors.push('সঠিক তারিখ ফরম্যাট ব্যবহার করুন (YYYY-MM-DD)।');
    } else {
      try {
        new Date(dateStr);
      } catch {
        errors.push('অবৈধ তারিখ।');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};
