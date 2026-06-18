import * as z from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "TEAM_MEMBER", "CLIENT"]),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  email: z.string().email("Invalid email address").optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "TEAM_MEMBER", "CLIENT"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
