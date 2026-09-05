import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label: React.FC<LabelProps> = ({ className, required, children, ...props }) => (
  <label className={cn('block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5', className)} {...props}>
    {children}
    {required && <span className="text-rose-500 ml-1" aria-hidden="true">*</span>}
  </label>
);

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full px-3.5 py-2 text-sm text-slate-900 bg-white border rounded-lg transition-colors duration-150',
          'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1',
          hasError
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
            : 'border-slate-300 focus:border-teal-500 focus:ring-teal-100',
          'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError, rows = 3, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          'w-full px-3.5 py-2 text-sm text-slate-900 bg-white border rounded-lg transition-colors duration-150 resize-y',
          'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1',
          hasError
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
            : 'border-slate-300 focus:border-teal-500 focus:ring-teal-100',
          'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, hasError, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'w-full px-3.5 py-2 text-sm text-slate-900 bg-white border rounded-lg transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          hasError
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
            : 'border-slate-300 focus:border-teal-500 focus:ring-teal-100',
          'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  id?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  hint,
  id,
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn('space-y-1', className)} {...props}>
      {label && (
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
      {error && <p className="text-xs text-rose-600 mt-1 font-medium">{error}</p>}
    </div>
  );
};
