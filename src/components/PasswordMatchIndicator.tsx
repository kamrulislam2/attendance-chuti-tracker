import { CheckCircle, AlertTriangle } from 'lucide-react';

interface PasswordMatchIndicatorProps {
  password: string;
  confirmPassword: string;
}

export function PasswordMatchIndicator({ password, confirmPassword }: PasswordMatchIndicatorProps) {
  if (!confirmPassword) return null;
  if (password !== confirmPassword) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-500 mt-1 font-medium">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        <span>পাসওয়ার্ড মেলেনি!</span>
      </div>
    );
  }
  if (password.length < 4) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-500 mt-1 font-medium">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        <span>পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে!</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-xs text-emerald-500 mt-1 font-medium">
      <CheckCircle className="h-3.5 w-3.5 shrink-0" />
      <span>পাসওয়ার্ড মিলেছে</span>
    </div>
  );
}
