"use client";

import { useBreadcrumbLabel } from "@/contexts/breadcrumb-context";

/** Renders nothing — registers `label` as the breadcrumb text for this route. */
export function BreadcrumbLabel({ label }: { label: string | null | undefined }) {
  useBreadcrumbLabel(label);
  return null;
}
