import * as React from "react"
import { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-surface-700)] bg-[var(--color-surface-900)] p-8 text-center animate-in fade-in-50",
        className
      )}
      {...props}
    >
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-surface-800)]">
          <Icon className="h-10 w-10 text-[var(--color-surface-400)]" aria-hidden="true" />
        </div>
        <h2 className="mt-6 text-xl font-semibold text-white">{title}</h2>
        {description && (
          <p className="mt-2 text-center text-sm font-normal leading-6 text-[var(--color-surface-400)]">
            {description}
          </p>
        )}
        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  )
}
