'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ErrorCardProps {
  title?: string;
  message: string;
  code?: string;
  onRetry?: () => void;
  showDetails?: boolean;
  details?: Record<string, unknown>;
}

export function ErrorCard({
  title = 'Error',
  message,
  code,
  onRetry,
  showDetails = false,
  details,
}: ErrorCardProps) {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <div className="ml-2 flex-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm mt-1">{message}</p>
        {code && (
          <p className="text-xs text-muted-foreground mt-1">Code: {code}</p>
        )}
        {showDetails && details && (
          <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto max-h-40">
            {JSON.stringify(details, null, 2)}
          </pre>
        )}
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
    </Alert>
  );
}
