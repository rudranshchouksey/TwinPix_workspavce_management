"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { ClientInput, clientSchema, ClientNoteInput, clientNoteSchema, UpdateClientInput, updateClientSchema } from "@/lib/validations/client";

// Helper to log activities
async function logActivity(clientId: string, type: string, details: string, metadata?: object) {
  const user = await requireAuth();
  await db.clientActivity.create({
    data: {
      clientId,
      type,
      details,
      userId: user?.id,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

// Helper to log audit
async function logAudit(action: string, entityId: string, details?: string) {
  const user = await requireAuth();
  await db.auditLog.create({
    data: {
      action,
      entityType: "CLIENT",
      entityId,
      adminId: user?.id,
      details,
    },
  });
}

export async function getClientsAction(params: {
  query?: string;
  status?: string;
  industry?: string;
  page?: number;
  limit?: number;
}) {
  await requireAuth();

  const { query, status, industry, page = 1, limit = 10 } = params;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (query) {
    where.OR = [
      { companyName: { contains: query, mode: "insensitive" } },
      { brandName: { contains: query, mode: "insensitive" } },
      { contactPerson: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (industry) {
    where.industry = industry;
  }

  const [clients, total] = await Promise.all([
    db.client.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    db.client.count({ where }),
  ]);

  return {
    clients,
    total,
    pages: Math.ceil(total / limit),
  };
}

// Lightweight name-only lookup for page titles/breadcrumbs (avoids the heavy includes below)
export async function getClientNameAction(id: string) {
  await requireAuth();
  return db.client.findUnique({
    where: { id },
    select: { companyName: true },
  });
}

export async function getClientByIdAction(id: string) {
  await requireAuth();

  const client = await db.client.findUnique({
    where: { id },
    include: {
      clientNotes: {
        orderBy: { createdAt: "desc" },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!client) {
    throw new Error("Client not found");
  }

  return client;
}

export async function createClientAction(input: ClientInput) {
  const user = await requireAuth();

  const validatedData = clientSchema.parse(input);

  // Check for existing email
  const existingClient = await db.client.findUnique({
    where: { email: validatedData.email },
  });

  if (existingClient) {
    throw new Error("A client with this email already exists");
  }

  const newClient = await db.client.create({
    data: validatedData,
  });

  await logAudit("CLIENT_CREATED", newClient.id, `Created client ${newClient.companyName}`);
  await logActivity(newClient.id, "CLIENT_CREATED", `Client created by ${user?.name || "Unknown"}`);

  revalidatePath("/clients");
  return newClient;
}

export async function updateClientAction(id: string, input: UpdateClientInput) {
  const user = await requireAuth();

  const validatedData = updateClientSchema.parse(input);

  const existingClient = await db.client.findUnique({
    where: { id },
  });

  if (!existingClient) {
    throw new Error("Client not found");
  }

  // Check email uniqueness if changing email
  if (validatedData.email && validatedData.email !== existingClient.email) {
    const emailCheck = await db.client.findUnique({
      where: { email: validatedData.email },
    });
    if (emailCheck) {
      throw new Error("A client with this email already exists");
    }
  }

  const updatedClient = await db.client.update({
    where: { id },
    data: validatedData,
  });

  await logAudit("CLIENT_UPDATED", id, `Updated client ${updatedClient.companyName}`);
  
  if (validatedData.status && validatedData.status !== existingClient.status) {
    await logActivity(id, "STATUS_CHANGED", `Status changed from ${existingClient.status} to ${validatedData.status}`);
  } else {
    await logActivity(id, "CLIENT_UPDATED", `Client details updated by ${user?.name || "Unknown"}`);
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  return updatedClient;
}

export async function deleteClientAction(id: string) {
  await requireAuth();

  const client = await db.client.findUnique({
    where: { id },
  });

  if (!client) {
    throw new Error("Client not found");
  }

  await db.client.delete({
    where: { id },
  });

  await logAudit("CLIENT_DELETED", id, `Deleted client ${client.companyName}`);

  revalidatePath("/clients");
}

export async function addClientNoteAction(input: ClientNoteInput) {
  const user = await requireAuth();

  const validatedData = clientNoteSchema.parse(input);

  const note = await db.clientNote.create({
    data: {
      content: validatedData.content,
      clientId: validatedData.clientId,
      authorId: user.id,
    },
  });

  await logActivity(validatedData.clientId, "NOTE_ADDED", `Note added by ${user.name || "Unknown"}`);

  revalidatePath(`/clients/${validatedData.clientId}`);
  return note;
}

export async function deleteClientNoteAction(id: string, clientId: string) {
  await requireAuth();

  await db.clientNote.delete({
    where: { id },
  });

  revalidatePath(`/clients/${clientId}`);
}

export async function getClientStatsAction() {
  await requireAuth();

  const [total, active, lead, recentActivities] = await Promise.all([
    db.client.count(),
    db.client.count({ where: { status: "ACTIVE" } }),
    db.client.count({ where: { status: "LEAD" } }),
    db.clientActivity.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        client: {
          select: { companyName: true },
        },
      },
    }),
  ]);

  return {
    total,
    active,
    lead,
    recentActivities,
  };
}

export async function getClientActivitiesAction(clientId: string, page = 1, limit = 20) {
  await requireAuth();
  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    db.clientActivity.findMany({
      where: { clientId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    db.clientActivity.count({ where: { clientId } }),
  ]);

  return {
    activities,
    total,
    pages: Math.ceil(total / limit),
  };
}
