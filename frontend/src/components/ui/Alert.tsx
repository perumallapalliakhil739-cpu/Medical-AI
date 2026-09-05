import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, ShieldAlert } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger' | 'clinical';
  title?: string;
  icon?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  icon,
  className,
  children,
  ...props
}) => {
  const variants = {
    info: {
      container: 'bg-blue-50/80 border-blue-200 text-blue-900',
      icon: <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />,
      titleColor: 'text-blue-950 font-semibold',
    },
    success: {
      container: 'bg-emerald-50/80 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
      titleColor: 'text-emerald-950 font-semibold',
    },
    warning: {
      container: 'bg-amber-50/80 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
      titleColor: 'text-amber-950 font-semibold',
    },
    danger: {
      container: 'bg-rose-50/80 border-rose-200 text-rose-900',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
      titleColor: 'text-rose-950 font-semibold',
    },
    clinical: {
      container: 'bg-teal-50/80 border-teal-200 text-teal-950',
      icon: <ShieldAlert className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />,
      titleColor: 'text-teal-950 font-semibold tracking-wide',
    },
  };

  const selected = variants[variant];

  return (
    <div
      role="alert"
      className={cn(
        'p-4 rounded-xl border flex items-start gap-3.5 text-sm transition-all shadow-xs',
        selected.container,
        className
      )}
      {...props}
    >
      {icon ?? selected.icon}
      <div className="flex-1 min-w-0">
        {title && <div className={cn('text-sm mb-1', selected.titleColor)}>{title}</div>}
        <div className="leading-relaxed opacity-90">{children}</div>
      </div>
    </div>
  );
};
