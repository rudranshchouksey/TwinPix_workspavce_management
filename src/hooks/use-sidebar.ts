/**
 * hooks/use-sidebar.ts
 *
 * Convenience hook wrapping Zustand UI store for sidebar state.
 * Handles both desktop (collapse/expand) and mobile (overlay sheet).
 */

"use client";

import { useUIStore } from "@/store/ui-store";

export function useSidebar() {
  const {
    sidebarCollapsed,
    mobileSidebarOpen,
    toggleSidebar,
    setSidebarCollapsed,
    setMobileSidebarOpen,
    toggleMobileSidebar,
  } = useUIStore();

  return {
    // Desktop
    isCollapsed: sidebarCollapsed,
    toggle: toggleSidebar,
    collapse: () => setSidebarCollapsed(true),
    expand: () => setSidebarCollapsed(false),
    // Mobile
    isMobileOpen: mobileSidebarOpen,
    setMobileOpen: setMobileSidebarOpen,
    toggleMobile: toggleMobileSidebar,
    closeMobile: () => setMobileSidebarOpen(false),
    openMobile: () => setMobileSidebarOpen(true),
  };
}
