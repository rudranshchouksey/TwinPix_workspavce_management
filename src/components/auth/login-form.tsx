"use client";

/**
 * components/auth/login-form.tsx
 *
 * Premium dark login form with Zod validation, Server Action,
 * animated transitions, and contextual error messages for
 * account status (suspended, inactive, invalid credentials).
 */

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { signInAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  AlertCircle,
  ShieldAlert,
  UserX,
} from "lucide-react";

type ErrorType = "credentials" | "suspended" | "inactive" | "generic";

function getErrorType(error: string): ErrorType {
  if (error.toLowerCase().includes("suspended")) return "suspended";
  if (error.toLowerCase().includes("inactive")) return "inactive";
  if (error.toLowerCase().includes("invalid")) return "credentials";
  return "generic";
}

const ERROR_CONFIG: Record<
  ErrorType,
  { icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string; borderColor: string }
> = {
  credentials: {
    icon: AlertCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
  suspended: {
    icon: ShieldAlert,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
  },
  inactive: {
    icon: UserX,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
  },
  generic: {
    icon: AlertCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
};

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit((data) => {
    setServerError(null);
    const formData = new FormData();
    formData.set("email", data.email);
    formData.set("password", data.password);

    startTransition(async () => {
      const result = await signInAction(formData);
      if (result && !result.success) {
        setServerError(result.error);
      }
    });
  });

  const errorType = serverError ? getErrorType(serverError) : null;
  const errorConfig = errorType ? ERROR_CONFIG[errorType] : null;
  const ErrorIcon = errorConfig?.icon ?? AlertCircle;

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {/* ── Server error ─────────────────────────────────── */}
      {serverError && errorConfig && (
        <div
          className={`login-error-animate flex items-start gap-2.5 rounded-xl border ${errorConfig.borderColor} ${errorConfig.bgColor} px-4 py-3 text-sm ${errorConfig.color}`}
        >
          <ErrorIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="leading-relaxed">{serverError}</span>
        </div>
      )}

      {/* ── Email ─────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label
          htmlFor="login-email"
          className="block text-sm font-medium text-[var(--color-text-secondary)]"
        >
          Email address
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="you@twinpix.studio"
          disabled={isPending}
          {...register("email")}
          className={`
            login-input w-full rounded-xl border
            bg-[var(--color-surface-700)] px-4 py-2.5
            text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]
            transition-all duration-200
            focus:border-[var(--color-brand-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]/20
            disabled:cursor-not-allowed disabled:opacity-50
            ${
              errors.email
                ? "border-red-500/40 focus:border-red-500 focus:ring-red-500/20"
                : "border-[rgba(0,0,0,0.08)] hover:border-[rgba(0,0,0,0.12)]"
            }
          `}
        />
        {errors.email && (
          <p className="flex items-center gap-1 text-xs text-red-400">
            <AlertCircle className="h-3 w-3" />
            {errors.email.message}
          </p>
        )}
      </div>

      {/* ── Password ──────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label
          htmlFor="login-password"
          className="block text-sm font-medium text-[var(--color-text-secondary)]"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            disabled={isPending}
            {...register("password")}
            className={`
              login-input w-full rounded-xl border
              bg-[var(--color-surface-700)] px-4 py-2.5 pr-11
              text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]
              transition-all duration-200
              focus:border-[var(--color-brand-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]/20
              disabled:cursor-not-allowed disabled:opacity-50
              ${
                errors.password
                  ? "border-red-500/40 focus:border-red-500 focus:ring-red-500/20"
                  : "border-[rgba(0,0,0,0.08)] hover:border-[rgba(0,0,0,0.12)]"
              }
            `}
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="flex items-center gap-1 text-xs text-red-400">
            <AlertCircle className="h-3 w-3" />
            {errors.password.message}
          </p>
        )}
      </div>

      {/* ── Submit ─────────────────────────────────────────── */}
      <Button
        type="submit"
        disabled={isPending}
        className="
          login-submit-btn w-full h-11 rounded-xl font-semibold text-sm
          bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-600)]
          hover:from-[var(--color-brand-600)] hover:to-[var(--color-brand-700)]
          text-white transition-all duration-250
          hover:shadow-lg hover:shadow-[var(--color-brand-500)]/30
          active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none
        "
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            Sign in to workspace
          </>
        )}
      </Button>
    </form>
  );
}
