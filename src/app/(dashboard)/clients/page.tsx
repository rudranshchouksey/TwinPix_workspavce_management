import { Metadata } from "next";
import { getClientsAction } from "@/actions/clients";
import { requireAuth } from "@/lib/auth-utils";
import { ClientTable } from "@/components/clients/client-table";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Clients",
  description: "Manage your brand clients and their information.",
};

export default async function ClientsPage() {
  await requireAuth();

  const { clients } = await getClientsAction({ limit: 100 });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Clients" 
        description="Manage your brand partnerships and their contact information." 
      />
      <ClientTable data={clients} />
    </div>
  );
}
