import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  technicalDetails?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to load clinical information',
  message = 'A connection or server issue interrupted the request. Patient data integrity remains protected.',
  technicalDetails,
  onRetry,
  isRetrying = false,
  className,
  ...props
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      role="alert"
      className={cn(
        'p-6 sm:p-8 rounded-2xl border border-rose-200 bg-rose-50/40 text-center flex flex-col items-center justify-center max-w-lg mx-auto',
        className
      )}
      {...props}
    >
      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>

      <h4 className="text-base font-semibold text-rose-950">{title}</h4>
      <p className="text-sm text-slate-600 mt-1.5 mb-6 leading-relaxed max-w-sm">
        {message}
      </p>

      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          isLoading={isRetrying}
          leftIcon={<RefreshCw className="w-4 h-4" />}
          className="border-rose-300 text-rose-800 hover:bg-rose-100/50"
        >
          Retry Connection
        </Button>
      )}

      {technicalDetails && (
        <div className="w-full mt-5 pt-4 border-t border-rose-200/60 text-left">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full text-xs font-medium text-rose-800 hover:text-rose-950 focus:outline-none"
          >
            <span>Technical diagnostics</span>
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showDetails && (
            <pre className="mt-2 p-3 bg-white/90 rounded-lg text-xs font-mono text-slate-700 overflow-x-auto border border-rose-100">
              {technicalDetails}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};
