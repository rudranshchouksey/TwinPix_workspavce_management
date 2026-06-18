"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { globalSearchAction, SearchResultItem } from "@/actions/search";
import { useDebounce } from "@/hooks/use-debounce";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedQuery) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const data = await globalSearchAction(debouncedQuery);
        setResults(data);
      } catch (e) {
        console.error("Search error", e);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  const onSelect = useCallback((href: string) => {
    setOpen(false);
    router.push(href);
  }, [router]);

  // Expose an invisible trigger button for topbar if needed, 
  // or topbar can render its own button that updates window state
  // But standard pattern is to render CommandDialog globally 
  // and control it via an exposed state or just let the global shortcut handle it.
  // To let Topbar open it, we'll export a custom event listener approach.
  
  useEffect(() => {
    const handleOpenSearch = () => setOpen(true);
    window.addEventListener("open-global-search", handleOpenSearch);
    return () => window.removeEventListener("open-global-search", handleOpenSearch);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Type a command or search..." 
        value={query} 
        onValueChange={setQuery} 
      />
      <CommandList>
        {loading && (
          <div className="p-4 flex justify-center items-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {!loading && query && results.length === 0 && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}
        
        {!loading && !query && (
          <CommandEmpty>Start typing to search...</CommandEmpty>
        )}
        
        {!loading && results.length > 0 && (
          <CommandGroup heading="Search Results">
            {results.map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.title} ${item.subtitle} ${item.type}`} // cmdk uses value for its internal filtering if any
                onSelect={() => onSelect(item.href)}
                className="flex flex-col items-start gap-1 cursor-pointer py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-brand-500)]/10 text-[var(--color-brand-400)] uppercase">
                    {item.type}
                  </span>
                  <span className="font-medium text-sm text-[var(--color-text-primary)]">{item.title}</span>
                </div>
                {item.subtitle && (
                  <span className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {item.subtitle}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
