import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { GitBranch } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getPipelineTimelineAction } from "@/actions/pipeline";

const ACTION_LABELS: Record<string, string> = {
  INFLUENCER_CREATED: "was added as a lead",
  INFLUENCER_UPDATED: "profile updated",
  INFLUENCER_STATUS_CHANGED: "pipeline stage changed",
  INFLUENCER_IMPORTED: "imported from Instagram",
  INFLUENCER_DELETED: "removed",
};

export async function PipelineTimelineView({ page, buildPageHref }: { page: number; buildPageHref: (p: number) => string }) {
  const { items, total, totalPages } = await getPipelineTimelineAction(page, 30);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={GitBranch}
        title="No activity yet"
        description="As creators move through your pipeline — outreach, replies, negotiations — their journey will show up here."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative pl-6">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[var(--color-border)]" />
        <div className="space-y-5">
          {items.map((log: any) => (
            <div key={log.id} className="relative">
              <span className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-[var(--color-brand-500)] shadow-sm" />
              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {log.influencer ? (
                      <Link href={`/influencers/${log.influencer.id}`} className="font-bold text-[var(--color-text-primary)] hover:text-[var(--color-brand-600)] hover:underline">
                        {log.influencer.influencerName || `@${log.influencer.instagramHandle}`}
                      </Link>
                    ) : (
                      <span className="font-bold text-[var(--color-text-primary)]">A creator</span>
                    )}{" "}
                    {ACTION_LABELS[log.action] || log.action.toLowerCase().replace(/_/g, " ")}
                  </p>
                  <span className="text-[11px] font-medium text-[var(--color-text-disabled)] shrink-0">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </span>
                </div>
                {log.details && <p className="mt-1 text-xs text-[var(--color-text-muted)] leading-relaxed">{log.details}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs font-medium text-[var(--color-text-muted)]">
            Page {page} of {totalPages} · {total} events
          </p>
          <div className="flex items-center gap-2">
            {page <= 1 ? (
              <Button variant="outline" size="sm" disabled className="rounded-full font-bold">
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
              </Button>
            ) : (
              <Link href={buildPageHref(page - 1)} className={buttonVariants({ variant: "outline", size: "sm", className: "rounded-full font-bold" })}>
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
              </Link>
            )}
            {page >= totalPages ? (
              <Button variant="outline" size="sm" disabled className="rounded-full font-bold">
                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            ) : (
              <Link href={buildPageHref(page + 1)} className={buttonVariants({ variant: "outline", size: "sm", className: "rounded-full font-bold" })}>
                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
