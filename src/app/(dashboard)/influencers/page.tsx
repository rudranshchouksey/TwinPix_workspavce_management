import { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { getInfluencersAction } from "@/actions/influencers";
import { InfluencerTable } from "@/components/influencers/influencer-table";
import { SectionHeader } from "@/components/dashboard/section-header";
import { CreateInfluencerDialog } from "@/components/influencers/create-influencer-dialog";

export const metadata: Metadata = {
  title: "Influencers",
  description: "Manage influencers and track campaign prospects.",
};

export default async function InfluencersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; status?: string; page?: string }>;
}) {
  await requireAuth();

  const resolvedSearchParams = await searchParams;
  const search = resolvedSearchParams.search;
  const category = resolvedSearchParams.category;
  const status = resolvedSearchParams.status;
  const page = resolvedSearchParams.page ? parseInt(resolvedSearchParams.page, 10) : 1;

  // Fetch influencers
  const { influencers: rawInfluencers, totalPages, total } = await getInfluencersAction(
    search,
    category,
    status,
    page
  );
  
  const influencers = JSON.parse(JSON.stringify(rawInfluencers));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Influencers
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Browse, manage, and analyze potential creator collaborations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CreateInfluencerDialog />
        </div>
      </div>

      <section aria-label="Influencers Listing">
        <InfluencerTable data={influencers} />
      </section>
    </div>
  );
}
