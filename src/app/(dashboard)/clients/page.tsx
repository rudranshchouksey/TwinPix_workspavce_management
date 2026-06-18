import { Metadata } from "next";
import { getClientsAction } from "@/actions/clients";
import { requireAuth } from "@/lib/auth-utils";
import { ClientTable } from "@/components/clients/client-table";
import { Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Clients",
  description: "Manage your brand clients and their information.",
};

export default async function ClientsPage() {
  // Ensure the user is authenticated (min role: ADMIN usually, but we check generically here)
  await requireAuth();

  // Fetch all clients (we can handle more advanced pagination via the action, but fetching all for the table is fine for now)
  const { clients } = await getClientsAction({ limit: 100 });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <Users className="w-6 h-6 text-[var(--color-brand-500)]" />
            Clients
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Manage your brand partnerships and their contact information.
          </p>
        </div>
      </div>

      {/* Data Table */}
      <ClientTable data={clients} />
    </div>
  );
}
