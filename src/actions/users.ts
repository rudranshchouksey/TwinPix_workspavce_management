"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db as prisma } from "@/lib/db";
import { requireAdmin, requireAuth, requireRole } from "@/lib/auth-utils";
import { CreateUserInput, createUserSchema, UpdateUserInput, updateUserSchema } from "@/lib/validations/user";
import { hasMinimumRole, Role } from "@/lib/rbac";

/**
 * Fetch all users (Admin/SuperAdmin only)
 */
export async function getUsersAction() {
  const currentUser = await requireAdmin();

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        jobTitle: true,
        department: true,
        createdAt: true,
      },
    });

    // Don't expose SUPER_ADMINs to regular ADMINs
    if (currentUser.role === "ADMIN") {
      return users.filter(u => u.role !== "SUPER_ADMIN" || u.id === currentUser.id);
    }

    return users;
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw new Error("Failed to fetch users");
  }
}

/**
 * Create a new user
 */
export async function createUserAction(input: CreateUserInput) {
  const currentUser = await requireAdmin();

  // Validate input
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const data = parsed.data;

  // RBAC: Admin cannot create SUPER_ADMIN
  if (data.role === "SUPER_ADMIN" && currentUser.role !== "SUPER_ADMIN") {
    throw new Error("You do not have permission to create a SUPER_ADMIN");
  }

  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new Error("A user with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user in transaction with audit log
    await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: data.role as Role,
          status: data.status as any,
          jobTitle: data.jobTitle,
          department: data.department,
          image: data.image,
          createdById: currentUser.id,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "USER_CREATED",
          entityType: "USER",
          entityId: newUser.id,
          adminId: currentUser.id,
          details: JSON.stringify({ email: newUser.email, role: newUser.role }),
        },
      });
    });

    revalidatePath("/team");
    return { success: true };
  } catch (error: any) {
    console.error("Create user error:", error);
    throw new Error(error.message || "Failed to create user");
  }
}

/**
 * Update a user
 */
export async function updateUserAction(userId: string, input: UpdateUserInput) {
  const currentUser = await requireAdmin();

  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const data = parsed.data;

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) throw new Error("User not found");

    // RBAC logic
    // 1. You cannot modify a SUPER_ADMIN unless you are a SUPER_ADMIN
    if (targetUser.role === "SUPER_ADMIN" && currentUser.role !== "SUPER_ADMIN") {
      throw new Error("You cannot modify a SUPER_ADMIN");
    }
    // 2. An ADMIN cannot grant SUPER_ADMIN
    if (data.role === "SUPER_ADMIN" && currentUser.role !== "SUPER_ADMIN") {
      throw new Error("You do not have permission to assign SUPER_ADMIN role");
    }

    const updateData: any = {
      name: data.name,
      email: data.email,
      role: data.role,
      status: data.status,
      jobTitle: data.jobTitle,
      department: data.department,
      image: data.image,
    };

    if (data.password && data.password !== "") {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: updateData,
      });

      await tx.auditLog.create({
        data: {
          action: "USER_UPDATED",
          entityType: "USER",
          entityId: userId,
          adminId: currentUser.id,
          details: JSON.stringify({ fields: Object.keys(data) }),
        },
      });
    });

    revalidatePath("/team");
    return { success: true };
  } catch (error: any) {
    console.error("Update user error:", error);
    throw new Error(error.message || "Failed to update user");
  }
}

/**
 * Delete a user
 */
export async function deleteUserAction(userId: string) {
  const currentUser = await requireAdmin();

  if (currentUser.id === userId) {
    throw new Error("You cannot delete yourself");
  }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) throw new Error("User not found");

    if (targetUser.role === "SUPER_ADMIN" && currentUser.role !== "SUPER_ADMIN") {
      throw new Error("You cannot delete a SUPER_ADMIN");
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.delete({
        where: { id: userId },
      });

      await tx.auditLog.create({
        data: {
          action: "USER_DELETED",
          entityType: "USER",
          entityId: userId,
          adminId: currentUser.id,
          details: JSON.stringify({ email: targetUser.email, role: targetUser.role }),
        },
      });
    });

    revalidatePath("/team");
    return { success: true };
  } catch (error: any) {
    console.error("Delete user error:", error);
    throw new Error(error.message || "Failed to delete user");
  }
}

/**
 * Update personal profile settings
 */
export async function updateProfileSettingsAction(input: { 
  name: string, 
  password?: string, 
  image?: string,
  jobTitle?: string,
  department?: string,
}) {
  const currentUser = await requireAuth();

  try {
    const updateData: any = {
      name: input.name,
    };

    if (input.image !== undefined) {
      updateData.image = input.image;
    }
    
    if (input.jobTitle !== undefined) {
      updateData.jobTitle = input.jobTitle;
    }
    
    if (input.department !== undefined) {
      updateData.department = input.department;
    }

    if (input.password && input.password.trim() !== "") {
      updateData.password = await bcrypt.hash(input.password, 10);
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: currentUser.id },
        data: updateData,
      });

      await tx.auditLog.create({
        data: {
          action: "PROFILE_UPDATED",
          entityType: "USER",
          entityId: currentUser.id,
          adminId: currentUser.id,
          details: JSON.stringify({ updatedFields: Object.keys(updateData) }),
        },
      });
    });

    revalidatePath("/settings");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Update profile error:", error);
    throw new Error(error.message || "Failed to update profile settings");
  }
}

/**
 * Fetch all users (Basic info for dropdowns, accessible by all authenticated users)
 */
export async function getAllUsersBasicAction() {
  await requireAuth();

  try {
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });
    return users;
  } catch (error) {
    console.error("Failed to fetch basic users:", error);
    return [];
  }
}

/**
 * Fetch current user's notification preferences
 */
export async function getUserNotificationPreferencesAction() {
  const currentUser = await requireAuth();

  try {
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        emailPreferences: true,
        whatsappPreferences: true,
        inAppPreferences: true,
        pushPreferences: true,
      }
    });

    return user;
  } catch (error) {
    console.error("Failed to fetch user preferences:", error);
    return null;
  }
}

/**
 * Update current user's notification preferences
 */
export async function updateUserNotificationPreferencesAction(input: {
  emailPreferences?: any;
  whatsappPreferences?: any;
  inAppPreferences?: any;
  pushPreferences?: any;
}) {
  const currentUser = await requireAuth();

  try {
    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        ...(input.emailPreferences !== undefined && { emailPreferences: input.emailPreferences }),
        ...(input.whatsappPreferences !== undefined && { whatsappPreferences: input.whatsappPreferences }),
        ...(input.inAppPreferences !== undefined && { inAppPreferences: input.inAppPreferences }),
        ...(input.pushPreferences !== undefined && { pushPreferences: input.pushPreferences }),
      }
    });

    revalidatePath("/settings/notifications");
    return { success: true };
  } catch (error) {
    console.error("Failed to update user preferences:", error);
    throw new Error("Failed to update preferences");
  }
}

/**
 * Fetch detailed profile of current logged-in user
 */
export async function getCurrentUserProfileAction() {
  const currentUser = await requireAuth();

  try {
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        status: true,
        jobTitle: true,
        department: true,
        createdAt: true,
        assignedTasks: {
          where: { status: { not: "DONE" } },
          take: 5,
          orderBy: { dueDate: "asc" },
        },
        activityLogs: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      }
    });
    
    return user;
  } catch (error) {
    console.error("Failed to fetch current user profile:", error);
    throw new Error("Failed to load profile");
  }
}
