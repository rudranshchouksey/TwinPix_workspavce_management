import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

interface PremiumCardProps extends HTMLMotionProps<"div"> {
  hoverEffect?: "lift" | "glow" | "none";
  glass?: boolean;
}

export const PremiumCard = React.forwardRef<HTMLDivElement, PremiumCardProps>(
  ({ className, hoverEffect = "lift", glass = true, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-2xl border border-[var(--color-surface-700)] bg-[var(--color-surface-950)] p-6 transition-all duration-300",
          glass && "glass-card bg-white/80",
          hoverEffect === "lift" && "hover:-translate-y-1 hover:shadow-executive-lg hover:border-[var(--color-brand-200)]",
          hoverEffect === "glow" && "hover:shadow-[0_0_24px_rgba(124,58,237,0.15)] hover:border-[var(--color-brand-300)]",
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
PremiumCard.displayName = "PremiumCard"
