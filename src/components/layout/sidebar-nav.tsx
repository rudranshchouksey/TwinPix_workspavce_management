"use client";

/**
 * components/layout/sidebar-nav.tsx
 *
 * Role-filtered navigation links for the sidebar.
 * Uses centralized NAV_CONFIG from lib/navigation.ts.
 * Animated active indicator with Framer Motion.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { getNavForRole, type NavItem } from "@/lib/navigation";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────

interface SidebarNavProps {
  isCollapsed: boolean;
  userRole?: string;
  onNavigate?: () => void;
}

// ─── Nav Link ─────────────────────────────────────────────────

function NavLink({
  item,
  isCollapsed,
  isActive,
  onNavigate,
}: {
  item: NavItem;
  isCollapsed: boolean;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      prefetch={true}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
        isActive
          ? "text-[var(--color-brand-700)]"
          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-800)] hover:text-[var(--color-text-primary)]",
        isCollapsed && "justify-center px-2"
      )}
    >
      {/* Active background (animated) */}
      {isActive && (
        <motion.span
          layoutId="sidebar-active-bg"
          className="absolute inset-0 rounded-lg bg-[var(--color-brand-50)]"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}

      {/* Active indicator bar */}
      {isActive && (
        <motion.span
          layoutId="sidebar-active-bar"
          className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-[var(--color-brand-600)]"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}

      <Icon
        className={cn(
          "relative z-10 h-4 w-4 shrink-0 transition-colors",
          isActive
            ? "text-[var(--color-brand-600)]"
            : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]"
        )}
      />

      {!isCollapsed && (
        <>
          <span className="relative z-10 truncate">{item.label}</span>
          {item.badge != null && item.badge > 0 && (
            <Badge
              variant="secondary"
              className="relative z-10 ml-auto h-5 min-w-5 rounded-full px-1.5 text-[10px] font-bold bg-[var(--color-brand-100)] text-[var(--color-brand-700)] border border-[var(--color-brand-200)]"
            >
              {item.badge}
            </Badge>
          )}
        </>
      )}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={<span />}>
          {link}
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.label}
          {item.badge != null && item.badge > 0 && (
            <span className="ml-1.5 rounded-full bg-[var(--color-brand-500)] px-1.5 py-0.5 text-[10px] text-white">
              {item.badge}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

// ─── Main Component ───────────────────────────────────────────

export function SidebarNav({ isCollapsed, userRole, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const sections = getNavForRole(userRole ?? "CLIENT");

  return (
    <nav className="flex flex-col gap-6 px-2">
      {sections.map((section) => (
        <div key={section.section}>
          {!isCollapsed && (
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-disabled)]">
              {section.section}
            </p>
          )}
          <ul className="space-y-0.5">
            {section.items.map((item) => (
              <li key={item.href}>
                <NavLink
                  item={item}
                  isCollapsed={isCollapsed}
                  isActive={isActive(item.href)}
                  onNavigate={onNavigate}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
