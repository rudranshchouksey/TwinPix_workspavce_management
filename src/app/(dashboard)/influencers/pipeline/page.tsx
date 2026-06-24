import { Metadata } from "next";
import { Suspense } from "react";
import { requireAuth, checkRole } from "@/lib/auth-utils";
import {
  getPipelineInfluencersAction,
  getPipelineKanbanDataAction,
  getPriorityQueueAction,
  getPipelineCalendarDataAction,
  getPipelineCategoriesAction,
  PipelineFilters,
} from "@/actions/pipeline";
import { getAllUsersBasicAction } from "@/actions/users";
import { PipelineHero } from "@/components/influencers/pipeline/pipeline-hero";
import { PipelineKpiDashboard } from "@/components/influencers/pipeline/pipeline-kpi-dashboard";
import { PipelineInsightsSection } from "@/components/influencers/pipeline/pipeline-insights-section";
import { PipelineViewSwitcher } from "@/components/influencers/pipeline/pipeline-view-switcher";
import { PipelineSearchBar } from "@/components/influencers/pipeline/pipeline-search-bar";
import { QuickFilterChips } from "@/components/influencers/pipeline/quick-filter-chips";
import { PipelineTableView } from "@/components/influencers/pipeline/pipeline-table-view";
import { PipelineKanbanView } from "@/components/influencers/pipeline/pipeline-kanban-view";
import { PipelinePriorityQueue } from "@/components/influencers/pipeline/pipeline-priority-queue";
import { PipelineTimelineView } from "@/components/influencers/pipeline/pipeline-timeline-view";
import { PipelineCalendarView } from "@/components/influencers/pipeline/pipeline-calendar-view";
import { KpiDashboardSkeleton, InsightsSkeleton, ViewSkeleton } from "./loading";

export const metadata: Metadata = {
  title: "Creator Pipeline",
  description: "Manage creator relationships, outreach, negotiations, and campaign readiness.",
};

export const dynamic = "force-dynamic";

type SP = {
  view?: string;
  q?: string;
  status?: string;
  category?: string;
  followersMin?: string;
  engagementMin?: string;
  followersMin50k?: string;
  hot?: string;
  nf?: string;
  ac?: string;
  page?: string;
  sort?: string;
  order?: string;
};

function parseFilters(sp: SP): PipelineFilters {
  return {
    search: sp.q || undefined,
    statuses: sp.status ? sp.status.split(",").filter(Boolean) : undefined,
    categories: sp.category ? sp.category.split(",").filter(Boolean) : undefined,
    followersMin: sp.followersMin ? Number(sp.followersMin) : sp.followersMin50k === "1" ? 50_000 : undefined,
    engagementMin: sp.engagementMin ? Number(sp.engagementMin) : undefined,
    needsFollowUp: sp.nf === "1",
    hotLead: sp.hot === "1",
    activeCampaignOnly: sp.ac === "1",
  };
}

export default async function PipelinePage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAuth();
  const sp = await searchParams;

  const view = sp.view || "table";
  const page = sp.page ? Math.max(1, parseInt(sp.page, 10)) : 1;
  const sort = sp.sort || "createdAt";
  const order = sp.order || "desc";
  const filters = parseFilters(sp);

  const isAdmin = await checkRole("ADMIN");
  const categories = await getPipelineCategoriesAction();

  return (
    <div className="space-y-6 pb-16">
      <PipelineHero filters={filters} categories={categories} />

      <Suspense fallback={<KpiDashboardSkeleton />}>
        <PipelineKpiDashboard />
      </Suspense>

      <Suspense fallback={<InsightsSkeleton />}>
        <PipelineInsightsSection />
      </Suspense>

      <div className="space-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <PipelineViewSwitcher view={view} />
            <PipelineSearchBar />
          </div>
          <QuickFilterChips categories={categories} />
        </div>

        <Suspense key={JSON.stringify(sp)} fallback={<ViewSkeleton />}>
          <PipelineViewContent view={view} filters={filters} page={page} sort={sort} order={order} isAdmin={isAdmin} />
        </Suspense>
      </div>
    </div>
  );
}

async function PipelineViewContent({
  view,
  filters,
  page,
  sort,
  order,
  isAdmin,
}: {
  view: string;
  filters: PipelineFilters;
  page: number;
  sort: string;
  order: string;
  isAdmin: boolean;
}) {
  const rawManagers = await getAllUsersBasicAction();
  const managers = JSON.parse(JSON.stringify(rawManagers));

  if (view === "kanban") {
    const columns = JSON.parse(JSON.stringify(await getPipelineKanbanDataAction(filters)));
    return <PipelineKanbanView columns={columns} isAdmin={isAdmin} />;
  }

  if (view === "priority") {
    const items = JSON.parse(JSON.stringify(await getPriorityQueueAction()));
    return <PipelinePriorityQueue items={items} />;
  }

  if (view === "timeline") {
    const buildPageHref = (p: number) => {
      const params = new URLSearchParams();
      params.set("view", "timeline");
      params.set("page", String(p));
      return `/influencers/pipeline?${params.toString()}`;
    };
    return <PipelineTimelineView page={page} buildPageHref={buildPageHref} />;
  }

  if (view === "calendar") {
    const events = JSON.parse(JSON.stringify(await getPipelineCalendarDataAction()));
    return <PipelineCalendarView events={events} />;
  }

  const { influencers: rawInfluencers, total, totalPages } = await getPipelineInfluencersAction(filters, page, 50, sort, order);
  const influencers = JSON.parse(JSON.stringify(rawInfluencers));
  return (
    <PipelineTableView
      data={influencers}
      total={total}
      totalPages={totalPages}
      currentPage={page}
      currentSort={sort}
      currentOrder={order}
      isAdmin={isAdmin}
      managers={managers}
    />
  );
}
