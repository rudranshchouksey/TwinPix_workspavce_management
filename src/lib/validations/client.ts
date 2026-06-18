import * as z from "zod";

export const clientStatusEnum = z.enum(["ACTIVE", "INACTIVE", "LEAD", "CLOSED"]);

export const clientSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  brandName: z.string().optional(),
  contactPerson: z.string().min(1, "Contact person is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
  status: clientStatusEnum.default("LEAD"),
  tags: z.array(z.string()).default([]),
});

export type ClientInput = z.infer<typeof clientSchema>;

export const updateClientSchema = clientSchema.partial();
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

export const clientNoteSchema = z.object({
  content: z.string().min(1, "Note content cannot be empty"),
  clientId: z.string().cuid("Invalid client ID"),
});

export type ClientNoteInput = z.infer<typeof clientNoteSchema>;
