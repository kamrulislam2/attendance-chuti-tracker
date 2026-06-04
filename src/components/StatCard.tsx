import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  variant?: 'large' | 'small';
  icon: LucideIcon;
  iconBgClass?: string;
  iconColorClass?: string;
  iconBorderClass?: string;
  title: string;
  value: string | number;
  subtitle?: string | number;
  action?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  variant = 'large',
  icon: Icon,
  iconBgClass = '',
  iconColorClass = '',
  iconBorderClass = '',
  title,
  value,
  subtitle,
  action,
  className = '',
}) => {
  if (variant === 'small') {
    return (
      <div className={`flex-1 min-w-[220px] max-w-[280px] bg-slate-900/20 border border-slate-900/80 rounded-xl p-4 flex items-center gap-3 ${className}`}>
        <Icon className={`h-5 w-5 shrink-0 ${iconColorClass}`} />
        <div>
          <span className="block text-[11px] text-slate-400">{title}</span>
          <span className="block text-lg font-bold text-white font-mono">{value}</span>
        </div>
      </div>
    );
  }

  // Large Variant
  return (
    <div className={`flex-1 min-w-[250px] max-w-[350px] bg-slate-900/40 border border-slate-900 rounded-2xl p-5 flex items-center justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl border shrink-0 ${iconBgClass} ${iconColorClass} ${iconBorderClass}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <span className="block text-xs text-slate-400 font-semibold">{title}</span>
          <span className="block text-2xl font-bold text-white mt-0.5">{value}</span>
          {subtitle && (
            <span className="block text-[10px] text-slate-500 mt-0.5">{subtitle}</span>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
