"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard Module Error:", error);
  }, [error]);

  return (
    <div className="flex h-[400px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-[rgba(0,0,0,0.1)] p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100/10">
        <AlertTriangle className="h-6 w-6 text-red-500" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-[var(--color-text-primary)]">Something went wrong!</h2>
      <p className="mt-2 mb-6 max-w-sm text-sm text-[var(--color-text-muted)]">
        An unexpected error occurred while loading this module. Our team has been notified.
      </p>
      <Button 
        variant="outline" 
        onClick={() => reset()}
      >
        Try again
      </Button>
    </div>
  );
}
