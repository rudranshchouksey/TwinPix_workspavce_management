"use client";

/**
 * components/layout/topbar.tsx
 *
 * Top navigation bar with:
 * - Breadcrumb navigation
 * - Mobile menu hamburger (opens sidebar overlay)
 * - Notification dropdown with mock data
 * - User profile dropdown with sign out
 */

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOutAction } from "@/actions/auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  LogOut,
  Settings,
  User,
  Bell,
  Menu,
  CheckCircle2,
  MessageSquare,
  FolderKanban,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getRoleLabel } from "@/lib/rbac";
import { GlobalSearch } from "./global-search";

import { NotificationsDropdown } from "@/components/layout/notifications-dropdown";

// ─── Helpers ─────────────────────────────────────────────────

function pathToBreadcrumbs(pathname: string): string[] {
  if (pathname === "/") return ["Dashboard"];
  return pathname
    .split("/")
    .filter(Boolean)
    .map(
      (seg) =>
        seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ")
    );
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name)
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  return (email?.[0] ?? "U").toUpperCase();
}

// ─── Component ───────────────────────────────────────────────

export function Topbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { openMobile } = useSidebar();
  const breadcrumbs = pathToBreadcrumbs(pathname);
  const user = session?.user;

  return (
    <header
      className={cn(
        "flex h-[var(--topbar-height)] shrink-0 items-center justify-between",
        "border-b border-[var(--color-border)] bg-[var(--color-surface-950)]/80",
        "px-4 sm:px-5 backdrop-blur-sm z-10"
      )}
    >
      {/* Left: Mobile menu + Breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={openMobile}
          aria-label="Open menu"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-900)] hover:text-[var(--color-text-primary)] transition-colors lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-[var(--color-text-disabled)]" />
              )}
              <span
                className={cn(
                  "text-sm font-semibold",
                  i === breadcrumbs.length - 1
                    ? "text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                )}
              >
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {/* Center: Global Search (Desktop) */}
      <div className="hidden flex-1 px-8 lg:flex lg:max-w-xl">
        <button
          onClick={() => window.dispatchEvent(new Event("open-global-search"))}
          className="relative flex w-full items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-900)] px-3 py-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-800)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-400)] shadow-sm"
        >
          <Search className="h-4 w-4" />
          <span>Search...</span>
          <kbd className="pointer-events-none absolute right-2 top-1.5 hidden h-5 select-none items-center gap-1 rounded border border-[var(--color-border)] bg-[var(--color-surface-950)] px-1.5 font-mono text-[10px] font-bold text-[var(--color-text-secondary)] sm:flex shadow-sm">
            <span className="text-[10px]">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right: Notifications + User */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* ── Mobile Search Toggle ───────────────────────── */}
        <button
          onClick={() => window.dispatchEvent(new Event("open-global-search"))}
          aria-label="Search"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-900)] hover:text-[var(--color-text-primary)] transition-colors lg:hidden"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* ── Global Search Component ──────────────────── */}
        <GlobalSearch />

        {/* ── Notification dropdown ────────────────────── */}
        <NotificationsDropdown />

        {/* Divider */}
        <div className="hidden h-5 w-px bg-[var(--color-border)] sm:block mx-1" />

        {/* ── User dropdown ───────────────────────────── */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                aria-label="User menu"
                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--color-surface-900)] focus:outline-none"
              >
                <Avatar className="h-8 w-8 ring-1 ring-[var(--color-border)] shadow-sm">
                  <AvatarImage src={user?.image ?? undefined} />
                  <AvatarFallback className="bg-[var(--color-brand-100)] text-[var(--color-brand-700)] text-xs font-bold">
                    {getInitials(user?.name, user?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden flex-col items-start sm:flex">
                  <span className="text-xs font-bold text-[var(--color-text-primary)] leading-tight">
                    {user?.name ?? user?.email}
                  </span>
                  <Badge
                    variant="secondary"
                    className="mt-0.5 h-4 rounded px-1.5 text-[9px] font-bold uppercase tracking-wider bg-[var(--color-brand-100)] text-[var(--color-brand-700)] border border-[var(--color-brand-200)]"
                  >
                    {getRoleLabel(user?.role ?? "")}
                  </Badge>
                </div>
              </button>
            }
          />

          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-56 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-950)] p-1.5 shadow-executive-lg"
          >
            <DropdownMenuLabel className="px-2 py-1.5">
              <p className="text-sm font-bold text-[var(--color-text-primary)]">
                {user?.name ?? "Team Member"}
              </p>
              <p className="truncate text-xs text-[var(--color-text-muted)] font-medium">
                {user?.email}
              </p>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="my-1 bg-[var(--color-border)]" />

            <DropdownMenuItem className="cursor-pointer rounded-lg px-2 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-900)] hover:text-[var(--color-text-primary)]">
              <a href="/profile" className="flex w-full items-center gap-2.5">
                <User className="h-4 w-4 text-[var(--color-text-muted)]" />
                Profile
              </a>
            </DropdownMenuItem>

            <DropdownMenuItem className="cursor-pointer rounded-lg px-2 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-900)] hover:text-[var(--color-text-primary)]">
              <a href="/settings" className="flex w-full items-center gap-2.5">
                <Settings className="h-4 w-4 text-[var(--color-text-muted)]" />
                Settings
              </a>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1 bg-[var(--color-border)]" />

            <DropdownMenuItem className="cursor-pointer rounded-lg px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700">
              <form action={signOutAction} className="w-full">
                <button type="submit" className="flex w-full items-center gap-2.5">
                  <LogOut className="h-4 w-4 text-red-500" />
                  Sign out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
