"use client";

/**
 * Client component for the "Go Back" button on the unauthorized page.
 * Separated because it uses browser `history` API.
 */

import { ArrowLeft } from "lucide-react";

export function GoBackButton() {
  return (
    <button
      onClick={() => history.back()}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-[rgba(0,0,0,0.08)] bg-[rgba(0,0,0,0.03)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:bg-[rgba(0,0,0,0.06)] hover:text-[var(--color-text-primary)]"
    >
      <ArrowLeft className="h-4 w-4" />
      Go Back
    </button>
  );
}
