import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this section. Please try again.',
  onRetry
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-rose-50/40 rounded-2xl border border-rose-200/70 my-4">
      <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl mb-3 shadow-xs">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h4 className="text-base font-semibold text-rose-900 tracking-tight">{title}</h4>
      <p className="text-xs text-rose-700 max-w-sm mt-1 mb-4 leading-relaxed">{message}</p>
      {onRetry && (
        <Button size="sm" variant="danger" leftIcon={<RefreshCw className="w-3.5 h-3.5" />} onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};
