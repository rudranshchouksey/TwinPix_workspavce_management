import type { Metadata } from "next";
import { ShieldOff, Home } from "lucide-react";
import Link from "next/link";
import { GoBackButton } from "./go-back-button";

export const metadata: Metadata = {
  title: "Access Denied",
  description: "You do not have permission to access this page.",
};

export default function UnauthorizedPage() {
  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[var(--color-surface-950)]">
      {/* Background ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-red-600/8 blur-[120px]" />
        <div className="absolute -bottom-40 right-1/4 h-[400px] w-[400px] rounded-full bg-orange-600/6 blur-[100px]" />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md animate-fade-in-up px-4">
        <div className="glass-card rounded-2xl p-8 text-center shadow-2xl shadow-black/40">
          {/* Shield icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 ring-1 ring-red-500/20">
            <ShieldOff className="h-8 w-8 text-red-400" />
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Access Denied
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)] leading-relaxed">
            You don&apos;t have permission to access this page.
            <br />
            Contact an administrator if you believe this is an error.
          </p>

          {/* Error code badge */}
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-500/15 bg-red-500/8 px-3 py-1.5">
            <span className="text-xs font-mono font-semibold text-red-400">
              403
            </span>
            <span className="text-xs text-red-400/70">Forbidden</span>
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-[rgba(0,0,0,0.06)]" />

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-brand-500)] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[var(--color-brand-600)] hover:shadow-lg hover:shadow-[var(--color-brand-500)]/25 active:scale-[0.98]"
            >
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Link>
            <GoBackButton />
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-[var(--color-text-disabled)]">
          If you need access, ask a Super Admin or Admin to update your role.
        </p>
      </div>
    </div>
  );
}
