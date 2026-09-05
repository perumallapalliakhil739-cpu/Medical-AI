import React from 'react';
import { FileQuestion } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50',
        className
      )}
      {...props}
    >
      <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-400 mb-4">
        {icon ?? <FileQuestion className="w-6 h-6 text-slate-400" />}
      </div>
      <h4 className="text-base font-semibold text-slate-800 tracking-tight">{title}</h4>
      <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};
