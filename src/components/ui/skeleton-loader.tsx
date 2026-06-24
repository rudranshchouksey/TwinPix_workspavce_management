import { cn } from "@/lib/utils"

export interface SkeletonLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "circular" | "rectangular" | "text" | "card";
}

export function SkeletonLoader({ className, variant = "rectangular", ...props }: SkeletonLoaderProps) {
  return (
    <div
      className={cn(
        "shimmer rounded-md",
        variant === "circular" && "rounded-full",
        variant === "text" && "h-4 w-full rounded",
        variant === "card" && "h-32 w-full rounded-2xl",
        className
      )}
      {...props}
    />
  )
}
