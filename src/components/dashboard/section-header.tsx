/**
 * components/dashboard/section-header.tsx
 *
 * Reusable section header for dashboard sections.
 * Uppercase label with optional "View all" link.
 */

interface SectionHeaderProps {
  label: string;
  description?: string;
  viewAllHref?: string;
}

export function SectionHeader({ label, description, viewAllHref }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
          {label}
        </h2>
        {description && (
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {description}
          </p>
        )}
      </div>
      {viewAllHref && (
        <a
          href={viewAllHref}
          className="text-xs font-medium text-[var(--color-brand-400)] hover:text-[var(--color-brand-300)] transition-colors"
        >
          View all →
        </a>
      )}
    </div>
  );
}
