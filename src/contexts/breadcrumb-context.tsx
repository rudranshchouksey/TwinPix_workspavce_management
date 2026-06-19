"use client";

/**
 * contexts/breadcrumb-context.tsx
 *
 * Lets a detail page (e.g. /influencers/[id]) register the entity's
 * display name for the current route, so the Topbar breadcrumb can show
 * "Wander With Divyani" instead of the raw database id in the URL.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

type BreadcrumbContextValue = {
  labels: Record<string, string>;
  setLabel: (path: string, label: string) => void;
};

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [labels, setLabels] = useState<Record<string, string>>({});

  const setLabel = useCallback((path: string, label: string) => {
    setLabels((prev) => (prev[path] === label ? prev : { ...prev, [path]: label }));
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ labels, setLabel }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbLabels(): Record<string, string> {
  const ctx = useContext(BreadcrumbContext);
  if (!ctx) throw new Error("useBreadcrumbLabels must be used within a BreadcrumbProvider");
  return ctx.labels;
}

/** Registers `label` as the breadcrumb text for the current route. */
export function useBreadcrumbLabel(label: string | null | undefined): void {
  const ctx = useContext(BreadcrumbContext);
  const pathname = usePathname();

  useEffect(() => {
    if (ctx && label) ctx.setLabel(pathname, label);
  }, [ctx, pathname, label]);
}
