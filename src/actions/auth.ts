"use server";

/**
 * actions/auth.ts
 *
 * Server Actions for authentication.
 * These run exclusively on the server — safe to call from
 * Client Components via form actions or event handlers.
 */

import { signIn, signOut } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import type { ActionResponse } from "@/types";

/**
 * Account status error messages — shown to users when their account
 * is suspended or deactivated. Matches the error codes thrown
 * in the Credentials authorize() function.
 */
const ACCOUNT_ERROR_MESSAGES: Record<string, string> = {
  ACCOUNT_SUSPENDED:
    "Your account has been suspended. Please contact an administrator.",
  ACCOUNT_INACTIVE:
    "Your account is inactive. Please contact an administrator to reactivate.",
};

/**
 * Sign in with email + password credentials.
 */
export async function signInAction(
  formData: FormData
): Promise<ActionResponse> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  // Validate inputs
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Check for account status errors embedded in the cause chain
      const errorMessage = error.message || "";
      const causeMessage =
        error.cause && typeof error.cause === "object" && "err" in error.cause
          ? String((error.cause as { err?: { message?: string } }).err?.message ?? "")
          : "";

      // Check both direct message and cause for account status errors
      for (const [code, message] of Object.entries(ACCOUNT_ERROR_MESSAGES)) {
        if (errorMessage.includes(code) || causeMessage.includes(code)) {
          return { success: false, error: message };
        }
      }

      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Invalid email or password." };
        default:
          return {
            success: false,
            error: "Something went wrong. Please try again.",
          };
      }
    }
    throw error;
  }

  redirect("/");
}

/**
 * Sign out and redirect to login.
 */
export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
