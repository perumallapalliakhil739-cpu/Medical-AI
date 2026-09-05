import React from 'react';
import { SourceLabel } from '../../types';
import { User, FileText, Sparkles, Calculator, CheckCircle2, Download } from 'lucide-react';

interface SourceTagProps {
  source: SourceLabel | string;
  className?: string;
  size?: 'sm' | 'md';
}

export const SourceTag: React.FC<SourceTagProps> = ({ source, className = '', size = 'sm' }) => {
  const getStyle = () => {
    switch (source) {
      case 'User Provided':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: User,
        };
      case 'Extracted from Report':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          icon: FileText,
        };
      case 'AI Generated':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: Sparkles,
        };
      case 'AI Calculated':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: Calculator,
        };
      case 'Human Verified':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2,
        };
      case 'Imported':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Download,
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-600 border-slate-200',
          icon: FileText,
        };
    }
  };

  const { bg, icon: Icon } = getStyle();
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-medium border ${bg} ${pad} ${className}`}
      title={`Information provenance source: ${source}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{source}</span>
    </span>
  );
};
