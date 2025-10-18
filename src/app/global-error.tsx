"use client";

import { ErrorCard } from "@/components/errors";

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
        <div className="container mx-auto py-10">
          <ErrorCard
            title="Critical Error"
            message={
              error.message ||
              "A critical error occurred. Please refresh the page."
            }
            code={error.digest}
            onRetry={reset}
          />
        </div>
      </body>
    </html>
  );
}
