import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label,
  className,
  ...props
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)} {...props}>
      <Loader2 className={cn('animate-spin text-teal-600', sizes[size])} />
      {label && <p className="text-xs text-slate-500 font-medium">{label}</p>}
    </div>
  );
};

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200/80', className)}
      {...props}
    />
  );
};

export interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Loading clinical data...',
  children,
}) => {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center rounded-xl z-20 transition-all">
          <LoadingSpinner size="lg" label={message} />
        </div>
      )}
    </div>
  );
};
