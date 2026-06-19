import { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { getClientByIdAction, getClientNameAction } from "@/actions/clients";
import { ClientProfile } from "@/components/clients/client-profile";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BreadcrumbLabel } from "@/components/layout/breadcrumb-label";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const client = await getClientNameAction(id);

  return {
    title: client?.companyName ? `${client.companyName} | TwinPix` : "Client Profile | TwinPix",
    description: "View client details, notes, and activity.",
  };
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const resolvedParams = await params;

  let client;
  try {
    client = await getClientByIdAction(resolvedParams.id);
  } catch (error) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <BreadcrumbLabel label={client.companyName} />

      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.08)] pb-6">
        <Link
          href="/clients"
          className="flex items-center text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clients
        </Link>
        {/* We can add a simple client-side wrapper button to open the edit modal here if needed,
            for now we leave a placeholder as editing is mostly done from the table view,
            but this matches the influencer detail pattern. */}
      </div>

      <ClientProfile client={client} />
    </div>
  );
}
