import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your TwinPix Studio workspace.",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[var(--color-surface-950)]">
      {/* ── Animated background ───────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* Primary brand glow — animated pulse */}
        <div className="login-glow-primary absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[var(--color-brand-600)]/12 blur-[120px]" />
        {/* Secondary accent glow */}
        <div className="login-glow-secondary absolute -bottom-40 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-600/8 blur-[100px]" />
        {/* Tertiary accent — left side */}
        <div className="login-glow-tertiary absolute top-1/3 -left-20 h-[300px] w-[300px] rounded-full bg-blue-600/5 blur-[100px]" />

        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Horizontal scan line — subtle */}
        <div className="login-scanline absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-brand-500)]/20 to-transparent" />
      </div>

      {/* ── Login card ────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-[400px] px-5">
        <div className="login-card animate-fade-in-up rounded-2xl p-8 shadow-2xl shadow-black/50">
          {/* ── Gradient border shimmer (top edge) ──────── */}
          <div className="absolute inset-x-0 top-0 h-px overflow-hidden rounded-t-2xl">
            <div className="login-border-shimmer h-full w-full" />
          </div>

          {/* ── Brand mark ────────────────────────────────── */}
          <div className="mb-8 flex flex-col items-center gap-4">
            {/* Animated logo */}
            <div className="login-logo-wrapper relative flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-lg shadow-[var(--color-brand-500)]/20">
              <img
                src="/logo.png"
                alt="TwinPix Studio Logo"
                className="h-10 w-10 object-contain"
              />
              {/* Glow ring */}
              <div className="login-logo-ring absolute inset-0 rounded-xl ring-2 ring-[var(--color-brand-400)]/0" />
            </div>

            <div className="text-center">
              <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
                TwinPix Studio
              </h1>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Internal workspace — authorized access only
              </p>
            </div>
          </div>

          {/* ── Divider ────────────────────────────────────── */}
          <div className="mb-6 border-t border-[rgba(0,0,0,0.06)]" />

          {/* ── Form ───────────────────────────────────────── */}
          <LoginForm />

          {/* ── Footer note ────────────────────────────────── */}
          <p className="mt-6 text-center text-xs text-[var(--color-text-disabled)] leading-relaxed">
            Access is restricted to team members.
            <br />
            Contact an admin if you need an account.
          </p>
        </div>

        {/* ── External label ───────────────────────────────── */}
        <p className="mt-6 text-center text-xs text-[var(--color-text-disabled)]">
          © {new Date().getFullYear()} TwinPix Studio. All rights reserved.
        </p>
      </div>
    </div>
  );
}
