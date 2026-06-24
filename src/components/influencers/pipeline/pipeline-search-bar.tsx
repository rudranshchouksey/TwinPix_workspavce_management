"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function PipelineSearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") || "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setValue(searchParams.get("q") || ""), [searchParams]);

  const handleChange = useCallback(
    (v: string) => {
      setValue(v);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        v ? params.set("q", v) : params.delete("q");
        params.delete("page");
        router.push(`${pathname}?${params.toString()}`);
      }, 350);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
      <Input
        placeholder="Search by name, handle, campaign, or status..."
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="pl-9 h-10 bg-white shadow-sm"
      />
    </div>
  );
}
