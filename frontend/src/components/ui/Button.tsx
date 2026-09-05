import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

    const variants = {
      primary:
        'bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 focus:ring-teal-500 shadow-sm border border-transparent',
      secondary:
        'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 focus:ring-slate-400 border border-slate-200',
      outline:
        'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 focus:ring-teal-500 shadow-sm',
      ghost:
        'text-slate-700 hover:bg-slate-100 active:bg-slate-200 focus:ring-slate-400 border border-transparent',
      danger:
        'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus:ring-rose-500 shadow-sm border border-transparent',
      success:
        'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 focus:ring-emerald-500 shadow-sm border border-transparent',
    };

    const sizes = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-5 py-2.5 gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {!isLoading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
