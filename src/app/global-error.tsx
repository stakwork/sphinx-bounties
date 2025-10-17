"use client";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex items-center justify-center min-h-screen p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertTitle>Critical error</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="text-sm mb-4">
                {error.message || "A critical error occurred. Please refresh the page."}
              </p>
              <Button onClick={reset} variant="outline" size="sm">
                Refresh
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </body>
    </html>
  );
}
