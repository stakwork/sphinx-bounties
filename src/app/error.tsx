"use client";

import { useEffect } from "react";
import { ErrorCard } from "@/components/errors";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="container mx-auto py-10">
      <ErrorCard
        title="Something went wrong"
        message={error.message || "An unexpected error occurred"}
        code={error.digest}
        onRetry={reset}
      />
    </div>
  );
}
