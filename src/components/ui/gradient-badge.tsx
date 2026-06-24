import { cn } from "@/lib/utils"

export interface GradientBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "brand" | "success" | "warning" | "danger" | "neutral";
  size?: "sm" | "md";
}

export function GradientBadge({ 
  className, 
  variant = "brand", 
  size = "md",
  children, 
  ...props 
}: GradientBadgeProps) {
  const variants = {
    brand: "bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-400)] text-white border-transparent",
    success: "bg-gradient-to-r from-[var(--color-success)] to-emerald-400 text-white border-transparent",
    warning: "bg-gradient-to-r from-[var(--color-warning)] to-amber-400 text-white border-transparent",
    danger: "bg-gradient-to-r from-[var(--color-danger)] to-rose-400 text-white border-transparent",
    neutral: "bg-gradient-to-r from-[var(--color-surface-700)] to-[var(--color-surface-600)] text-[var(--color-text-primary)] border-transparent",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        size === "sm" && "px-1.5 text-[10px] py-0",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
