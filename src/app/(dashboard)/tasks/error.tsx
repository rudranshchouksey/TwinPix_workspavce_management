"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TasksError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Tasks Module Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-white rounded-3xl border border-stone-200">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-rose-500" />
      </div>
      <h2 className="text-xl font-semibold text-stone-800 mb-2">
        Something went wrong
      </h2>
      <p className="text-stone-500 max-w-md mb-8">
        We encountered an error while loading the tasks. This has been logged.
        Please try again or contact support if the problem persists.
      </p>
      <Button onClick={() => reset()} className="min-w-[140px]">
        Try again
      </Button>
    </div>
  );
}
