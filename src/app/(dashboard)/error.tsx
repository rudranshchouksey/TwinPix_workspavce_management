"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center p-4">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="mb-2 text-2xl font-semibold text-white">Something went wrong!</h2>
        <p className="mb-6 text-[var(--color-surface-400)]">
          {error.message || "An unexpected error occurred while loading this page. Please try again."}
        </p>
        <div className="flex gap-4">
          <Button onClick={() => reset()} variant="default">
            Try again
          </Button>
          <Button onClick={() => window.location.href = '/dashboard'} variant="outline">
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
