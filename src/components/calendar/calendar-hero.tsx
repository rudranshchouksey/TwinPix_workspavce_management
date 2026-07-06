"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Sparkles, Download, Search, X, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CalendarHero({ onCreateClick }: { onCreateClick: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") || "");

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (searchParams.get("q") || "")) {
        updateParams({ q: search || null });
      }
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="relative overflow-hidden rounded-3xl glass-card bg-gradient-to-br from-white via-white to-[var(--color-brand-50)]/40 p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--color-brand-200)]/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-[var(--color-brand-100)]/40 blur-3xl" />

      <div className="relative flex flex-col gap-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Calendar & Scheduling
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-[var(--color-text-secondary)] max-w-2xl">
            Manage meetings, campaign deadlines, influencer shoots, content publishing, follow-ups and team events.
          </p>
        </motion.div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={onCreateClick} className="shadow-lg shadow-[var(--color-brand-500)]/20">
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
            <Button
              variant="outline"
              className="border-[var(--color-brand-200)] text-[var(--color-brand-700)] hover:bg-[var(--color-brand-50)]"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              AI Schedule
            </Button>
            <Button variant="outline">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Today
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Calendar
            </Button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
            <Input
              placeholder="Search schedule..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 bg-white/60 backdrop-blur-sm border-[rgba(0,0,0,0.08)] rounded-xl"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
