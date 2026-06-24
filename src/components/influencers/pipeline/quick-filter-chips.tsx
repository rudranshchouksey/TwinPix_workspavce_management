"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Flame, TrendingUp, Clock, Megaphone, Handshake } from "lucide-react";

interface QuickFilterChipsProps {
  categories: string[];
}

export function QuickFilterChips({ categories }: QuickFilterChipsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isActive = (key: string, value: string) => searchParams.get(key)?.split(",").includes(value) ?? false;
  const isFlagActive = (key: string) => searchParams.get(key) === "1";

  const toggleCategory = (cat: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.get("category")?.split(",").filter(Boolean) || [];
    const next = current.includes(cat) ? current.filter((c) => c !== cat) : [...current, cat];
    next.length ? params.set("category", next.join(",")) : params.delete("category");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const toggleFlag = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.get(key) === "1" ? params.delete(key) : params.set(key, "1");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const toggleStatus = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.get("status")?.split(",").filter(Boolean) || [];
    const next = current.includes(status) ? current.filter((s) => s !== status) : [...current, status];
    next.length ? params.set("status", next.join(",")) : params.delete("status");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const chipClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap transition-colors ${
      active
        ? "bg-[var(--color-brand-600)] text-white border-[var(--color-brand-600)]"
        : "bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-brand-300)]"
    }`;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {categories.slice(0, 5).map((cat) => (
        <button key={cat} onClick={() => toggleCategory(cat)} className={chipClass(isActive("category", cat))}>
          {cat}
        </button>
      ))}

      <button onClick={() => toggleFlag("followersMin50k")} className={chipClass(isFlagActive("followersMin50k"))}>
        <TrendingUp className="w-3 h-3" /> &gt; 50K Followers
      </button>

      <button onClick={() => toggleFlag("hot")} className={chipClass(isFlagActive("hot"))}>
        <Flame className="w-3 h-3" /> Hot Leads
      </button>

      <button onClick={() => toggleFlag("nf")} className={chipClass(isFlagActive("nf"))}>
        <Clock className="w-3 h-3" /> Needs Follow Up
      </button>

      <button onClick={() => toggleFlag("ac")} className={chipClass(isFlagActive("ac"))}>
        <Megaphone className="w-3 h-3" /> Active Campaign
      </button>

      <button onClick={() => toggleStatus("NEGOTIATING")} className={chipClass(isActive("status", "NEGOTIATING"))}>
        <Handshake className="w-3 h-3" /> Negotiating
      </button>
    </div>
  );
}
