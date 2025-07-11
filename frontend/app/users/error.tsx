'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="flex items-center space-x-2 text-red-600">
        <AlertCircle className="w-6 h-6" />
        <h2 className="text-xl font-semibold">Something went wrong!</h2>
      </div>
      <p className="text-gray-600 text-center max-w-md">
        We encountered an error while loading the users. Please try again.
      </p>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          onClick={() => window.location.href = '/admin'}
        >
          Go to Dashboard
        </Button>
        <Button onClick={reset}>
          Try Again
        </Button>
      </div>
    </div>
  );
}