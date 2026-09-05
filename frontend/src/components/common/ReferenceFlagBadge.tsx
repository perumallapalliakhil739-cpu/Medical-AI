import React from 'react';
import { ArrowUp, ArrowDown, Check, AlertCircle, HelpCircle } from 'lucide-react';

interface ReferenceFlagBadgeProps {
  flag?: 'normal' | 'low' | 'high' | 'critical' | 'unspecified' | string | null;
  className?: string;
}

export const ReferenceFlagBadge: React.FC<ReferenceFlagBadgeProps> = ({ flag, className = '' }) => {
  switch (flag) {
    case 'normal':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}>
          <Check className="w-3 h-3 text-emerald-600" />
          <span>NORMAL</span>
        </span>
      );
    case 'high':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}>
          <ArrowUp className="w-3 h-3 text-rose-600" />
          <span>HIGH</span>
        </span>
      );
    case 'low':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 ${className}`}>
          <ArrowDown className="w-3 h-3 text-amber-600" />
          <span>LOW</span>
        </span>
      );
    case 'critical':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300 animate-pulse ${className}`}>
          <AlertCircle className="w-3 h-3 text-purple-700" />
          <span>CRITICAL</span>
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 ${className}`}
          title="Reference range was not provided in source report"
        >
          <HelpCircle className="w-3 h-3 text-slate-400" />
          <span>UNCLASSIFIED</span>
        </span>
      );
  }
};
