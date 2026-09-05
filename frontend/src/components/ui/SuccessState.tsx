import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SuccessStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  action?: React.ReactNode;
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  title = 'Action completed successfully',
  message,
  action,
  className,
  ...props
}) => {
  return (
    <div
      role="status"
      className={cn(
        'p-6 sm:p-8 rounded-2xl border border-emerald-200 bg-emerald-50/40 text-center flex flex-col items-center justify-center max-w-lg mx-auto',
        className
      )}
      {...props}
    >
      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
        <CheckCircle2 className="w-6 h-6" />
      </div>

      <h4 className="text-base font-semibold text-emerald-950">{title}</h4>
      {message && (
        <p className="text-sm text-slate-600 mt-1.5 mb-6 leading-relaxed max-w-sm">
          {message}
        </p>
      )}

      {action && <div>{action}</div>}
    </div>
  );
};
