$dashboardPath = "src\app\(dashboard)"

$loadingContent = @"
import { Loader2 } from `"lucide-react`";

export default function Loading() {
  return (
    <div className=`"flex h-full w-full items-center justify-center p-8`">
      <div className=`"flex flex-col items-center gap-2 text-[var(--color-text-muted)]`">
        <Loader2 className=`"h-8 w-8 animate-spin`" />
        <p className=`"text-sm font-medium`">Loading...</p>
      </div>
    </div>
  );
}
"@

$errorContent = @"
`"use client`";

import { useEffect } from `"react`";
import { AlertTriangle } from `"lucide-react`";
import { Button } from `"@/components/ui/button`";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(`"Dashboard Module Error:`", error);
  }, [error]);

  return (
    <div className=`"flex h-[400px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-[rgba(0,0,0,0.1)] p-8 text-center`">
      <div className=`"mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100/10`">
        <AlertTriangle className=`"h-6 w-6 text-red-500`" />
      </div>
      <h2 className=`"mt-4 text-lg font-semibold text-[var(--color-text-primary)]`">Something went wrong!</h2>
      <p className=`"mt-2 mb-6 max-w-sm text-sm text-[var(--color-text-muted)]`">
        An unexpected error occurred while loading this module. Our team has been notified.
      </p>
      <Button 
        variant=`"outline`" 
        onClick={() => reset()}
      >
        Try again
      </Button>
    </div>
  );
}
"@

$dirs = Get-ChildItem -Path $dashboardPath -Directory

foreach ($dir in $dirs) {
    $loadingPath = Join-Path $dir.FullName "loading.tsx"
    $errorPath = Join-Path $dir.FullName "error.tsx"

    if (-not (Test-Path $loadingPath)) {
        Set-Content -Path $loadingPath -Value $loadingContent
        Write-Host "Created loading.tsx in $($dir.Name)"
    }

    if (-not (Test-Path $errorPath)) {
        Set-Content -Path $errorPath -Value $errorContent
        Write-Host "Created error.tsx in $($dir.Name)"
    }
}
Write-Host "Done generating boundaries."
