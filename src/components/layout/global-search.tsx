"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, Loader2, ArrowRight, Hash, Mail, Phone, Calendar, 
  FileText, CheckSquare, Briefcase, MessageSquare, Settings, Users,
  FolderDot, LayoutDashboard, PlusCircle, Link2, Star, Clock, User, ArrowUpRight
} from "lucide-react";
import { Command as CommandPrimitive } from "cmdk";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { globalSearchAction, SearchResultItem } from "@/actions/search";
import { useDebounce } from "@/hooks/use-debounce";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Type definition for quick actions
type QuickAction = {
  id: string;
  icon: any;
  title: string;
  href: string;
  color: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  { id: "qa1", icon: PlusCircle, title: "Create New Campaign", href: "/campaigns/new", color: "text-blue-500" },
  { id: "qa2", icon: Users, title: "Import Influencers", href: "/influencers/import", color: "text-purple-500" },
  { id: "qa3", icon: Briefcase, title: "Create Client", href: "/clients/new", color: "text-orange-500" },
  { id: "qa4", icon: FolderDot, title: "Create Project", href: "/projects/new", color: "text-indigo-500" },
  { id: "qa5", icon: Hash, title: "Sync Instagram", href: "/settings/integrations", color: "text-pink-500" },
  { id: "qa6", icon: User, title: "Add Team Member", href: "/settings/team", color: "text-green-500" },
  { id: "qa7", icon: LayoutDashboard, title: "Open Analytics", href: "/analytics", color: "text-blue-400" },
  { id: "qa8", icon: LayoutDashboard, title: "Open Dashboard", href: "/dashboard", color: "text-slate-400" },
];

const RECENT_SEARCHES = [
  { id: "rs1", title: "WanderWithDivyani", type: "INFLUENCER", href: "/influencers/1" },
  { id: "rs2", title: "Summer Campaign", type: "CAMPAIGN", href: "/campaigns/1" },
  { id: "rs3", title: "TwinPix Brand Kit", type: "FILE", href: "/files/1" },
];

const PINNED_ITEMS = [
  { id: "pi1", title: "Dashboard", href: "/dashboard" },
  { id: "pi2", title: "Analytics", href: "/analytics" },
  { id: "pi3", title: "Campaigns", href: "/campaigns" },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeValue, setActiveValue] = useState("");
  const router = useRouter();

  const debouncedQuery = useDebounce(query, 150);

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
    const handleOpenSearch = () => setOpen(true);
    window.addEventListener("open-global-search", handleOpenSearch);
    return () => window.removeEventListener("open-global-search", handleOpenSearch);
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
        if (data.length > 0) {
          setActiveValue(data[0].id);
        }
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
    setQuery("");
    router.push(href);
  }, [router]);

  const activeItem = useMemo(() => {
    return results.find((r) => r.id === activeValue);
  }, [results, activeValue]);

  // Grouping results
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResultItem[]> = {};
    results.forEach((item) => {
      if (!groups[item.type]) {
        groups[item.type] = [];
      }
      groups[item.type].push(item);
    });
    return groups;
  }, [results]);

  const getEntityIcon = (type: string) => {
    switch (type) {
      case "INFLUENCER": return <Hash className="w-4 h-4 text-pink-500" />;
      case "CAMPAIGN": return <CheckSquare className="w-4 h-4 text-blue-500" />;
      case "CLIENT": return <Briefcase className="w-4 h-4 text-orange-500" />;
      case "PROJECT": return <FolderDot className="w-4 h-4 text-indigo-500" />;
      case "TASK": return <CheckSquare className="w-4 h-4 text-green-500" />;
      case "FILE": return <FileText className="w-4 h-4 text-slate-500" />;
      case "MESSAGE": return <MessageSquare className="w-4 h-4 text-sky-500" />;
      case "USER": return <Users className="w-4 h-4 text-purple-500" />;
      case "SETTING": return <Settings className="w-4 h-4 text-zinc-500" />;
      default: return <ArrowRight className="w-4 h-4 text-slate-500" />;
    }
  };

  const getEntityBadgeColor = (type: string) => {
    switch (type) {
      case "INFLUENCER": return "bg-pink-500/10 text-pink-500 border-pink-500/20";
      case "CAMPAIGN": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "CLIENT": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "PROJECT": return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
      case "TASK": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "FILE": return "bg-slate-500/10 text-slate-500 border-slate-500/20";
      case "MESSAGE": return "bg-sky-500/10 text-sky-500 border-sky-500/20";
      case "USER": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "SETTING": return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent 
        className="max-w-[900px] w-[900px] h-[700px] p-0 overflow-hidden border border-white/10 shadow-2xl rounded-3xl bg-zinc-950/80 backdrop-blur-2xl"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Global Search</DialogTitle>
        <CommandPrimitive 
          className="flex flex-col h-full w-full outline-none"
          shouldFilter={false} // We do our own fuzzy searching via server
          value={activeValue}
          onValueChange={setActiveValue}
        >
          {/* Header & Search Bar */}
          <div className="flex flex-col border-b border-white/5">
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                  <Search className="w-5 h-5 text-white/70" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white tracking-wide">Workspace Search</h2>
                  <p className="text-xs text-zinc-400">Search influencers, campaigns, tasks, files and more</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10 text-xs font-medium text-zinc-400 tracking-widest">
                <span>⌘</span>
                <span>K</span>
              </div>
            </div>
            
            <div className="px-6 pb-5">
              <div className="relative group">
                <CommandPrimitive.Input 
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-base text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all shadow-inner"
                  placeholder="Search influencers, campaigns, files, tasks..."
                  value={query}
                  onValueChange={setQuery}
                  autoFocus
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-white transition-colors" />
                {loading && (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-zinc-400" />
                )}
              </div>
            </div>
          </div>

          {/* Main Body */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Pane: Results */}
            <div className={cn(
              "flex-1 overflow-y-auto no-scrollbar outline-none border-r border-white/5",
              query.length > 0 ? "w-1/2 max-w-[50%]" : "w-full"
            )}>
              <CommandPrimitive.List className="p-2 outline-none h-full">
                
                {!loading && query && results.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5">
                      <Search className="w-8 h-8 text-zinc-500" />
                    </div>
                    <p className="text-lg font-semibold text-white mb-2">No results found</p>
                    <p className="text-sm text-zinc-400 max-w-[250px]">Try searching by name, username, email, campaign, or task.</p>
                  </div>
                )}

                {!query && (
                  <div className="p-4 space-y-8 animate-in fade-in duration-300">
                    {/* Quick Actions */}
                    <div>
                      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-2">Quick Actions</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {QUICK_ACTIONS.map(action => (
                          <CommandPrimitive.Item
                            key={action.id}
                            value={action.id}
                            onSelect={() => onSelect(action.href)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer select-none transition-colors data-[selected=true]:bg-white/10 hover:bg-white/5"
                          >
                            <div className={cn("p-1.5 rounded-lg bg-white/5", action.color)}>
                              <action.icon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-zinc-200">{action.title}</span>
                          </CommandPrimitive.Item>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-8">
                      {/* Recent Searches */}
                      <div className="flex-1">
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-2">Recent Searches</h3>
                        <div className="space-y-1">
                          {RECENT_SEARCHES.map(item => (
                            <CommandPrimitive.Item
                              key={item.id}
                              value={item.id}
                              onSelect={() => onSelect(item.href)}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer select-none transition-colors data-[selected=true]:bg-white/10 hover:bg-white/5"
                            >
                              <Clock className="w-3.5 h-3.5 text-zinc-500" />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-zinc-200">{item.title}</span>
                                <span className="text-xs text-zinc-500">{item.type}</span>
                              </div>
                            </CommandPrimitive.Item>
                          ))}
                        </div>
                      </div>

                      {/* Pinned Items */}
                      <div className="flex-1">
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-2">Pinned Items</h3>
                        <div className="space-y-1">
                          {PINNED_ITEMS.map(item => (
                            <CommandPrimitive.Item
                              key={item.id}
                              value={item.id}
                              onSelect={() => onSelect(item.href)}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer select-none transition-colors data-[selected=true]:bg-white/10 hover:bg-white/5"
                            >
                              <Star className="w-3.5 h-3.5 text-yellow-500" />
                              <span className="text-sm font-medium text-zinc-200">{item.title}</span>
                            </CommandPrimitive.Item>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {query && Object.entries(groupedResults).map(([type, items]) => (
                  <CommandPrimitive.Group 
                    key={type} 
                    heading={<span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-3 py-2 block">{type}</span>}
                    className="mb-4 [&_[cmdk-group-heading]]:p-0"
                  >
                    {items.map(item => (
                      <CommandPrimitive.Item
                        key={item.id}
                        value={item.id}
                        onSelect={() => onSelect(item.href)}
                        className="group flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer select-none transition-colors data-[selected=true]:bg-white/10 hover:bg-white/5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {item.type === 'INFLUENCER' && item.metadata?.profileImage ? (
                            <img src={item.metadata.profileImage} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                              {getEntityIcon(item.type)}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-zinc-200 truncate">{item.title}</span>
                            {item.subtitle && (
                              <span className="text-xs text-zinc-500 truncate">{item.subtitle}</span>
                            )}
                          </div>
                        </div>
                        <span className={cn(
                          "shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider",
                          getEntityBadgeColor(item.type)
                        )}>
                          {item.type}
                        </span>
                      </CommandPrimitive.Item>
                    ))}
                  </CommandPrimitive.Group>
                ))}
              </CommandPrimitive.List>
            </div>

            {/* Right Pane: Preview */}
            {query.length > 0 && activeItem && (
              <div className="w-1/2 bg-white/[0.02] p-6 overflow-y-auto no-scrollbar relative flex flex-col">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeItem.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col flex-1"
                  >
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-6">
                      {activeItem.type === 'INFLUENCER' && activeItem.metadata?.profileImage ? (
                        <img src={activeItem.metadata.profileImage} alt="" className="w-16 h-16 rounded-2xl object-cover shadow-lg border border-white/10 shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-lg">
                          {getEntityIcon(activeItem.type)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="text-xl font-bold text-white mb-1 leading-tight truncate">{activeItem.title}</h3>
                        <p className="text-sm text-zinc-400 truncate">{activeItem.subtitle}</p>
                      </div>
                    </div>

                    {/* Dynamic Details based on Type */}
                    <div className="space-y-4 mb-16">
                      {activeItem.type === "INFLUENCER" && activeItem.metadata && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                              <p className="text-xs text-zinc-500 font-medium mb-1">Followers</p>
                              <p className="text-lg font-semibold text-white">
                                {activeItem.metadata.followers ? new Intl.NumberFormat().format(activeItem.metadata.followers) : "--"}
                              </p>
                            </div>
                            <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                              <p className="text-xs text-zinc-500 font-medium mb-1">Engagement</p>
                              <p className="text-lg font-semibold text-white">
                                {activeItem.metadata.engagementRate ? `${activeItem.metadata.engagementRate}%` : "--"}
                              </p>
                            </div>
                          </div>
                          
                          <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-3">
                            {activeItem.metadata.category && (
                              <div className="flex justify-between items-center text-sm gap-4">
                                <span className="text-zinc-500 shrink-0">Category</span>
                                <span className="text-zinc-200 font-medium text-right truncate">{activeItem.metadata.category}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center text-sm gap-4">
                              <span className="text-zinc-500 shrink-0">Status</span>
                              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase shrink-0", getEntityBadgeColor(activeItem.type))}>
                                {activeItem.metadata.status}
                              </span>
                            </div>
                            {activeItem.metadata.email && (
                              <div className="flex justify-between items-center text-sm gap-4">
                                <span className="text-zinc-500 shrink-0">Email</span>
                                <span className="text-zinc-200 text-right truncate">{activeItem.metadata.email}</span>
                              </div>
                            )}
                            {activeItem.metadata.phoneNumber && (
                              <div className="flex justify-between items-center text-sm gap-4">
                                <span className="text-zinc-500 shrink-0">Phone</span>
                                <span className="text-zinc-200 text-right truncate">{activeItem.metadata.phoneNumber}</span>
                              </div>
                            )}
                          </div>
                          
                          {activeItem.metadata.tags && activeItem.metadata.tags.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Tags</p>
                              <div className="flex flex-wrap gap-1.5">
                                {activeItem.metadata.tags.map((tag: string) => (
                                  <span key={tag} className="px-2 py-1 bg-white/10 rounded border border-white/5 text-xs text-zinc-300">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {activeItem.type === "CAMPAIGN" && activeItem.metadata && (
                        <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Status</span>
                            <span className="text-zinc-200 font-medium">{activeItem.metadata.status}</span>
                          </div>
                          {activeItem.metadata.budget !== null && (
                            <div className="flex justify-between text-sm">
                              <span className="text-zinc-500">Budget</span>
                              <span className="text-zinc-200 font-medium">${activeItem.metadata.budget?.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {activeItem.type === "TASK" && activeItem.metadata && (
                        <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Status</span>
                            <span className="text-zinc-200 font-medium">{activeItem.metadata.status}</span>
                          </div>
                          {activeItem.metadata.dueDate && (
                            <div className="flex justify-between text-sm">
                              <span className="text-zinc-500">Due Date</span>
                              <span className="text-zinc-200 font-medium">{new Date(activeItem.metadata.dueDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {activeItem.type === "FILE" && activeItem.metadata && (
                        <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">File Type</span>
                            <span className="text-zinc-200 font-medium truncate ml-4">{activeItem.metadata.mimeType || "Unknown"}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Uploaded</span>
                            <span className="text-zinc-200 font-medium">{new Date(activeItem.metadata.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
                
                <div className="absolute bottom-6 left-6 right-6 mt-auto">
                  <button 
                    onClick={() => onSelect(activeItem.href)}
                    className="w-full py-2.5 bg-white text-black font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors shadow-lg"
                  >
                    Open {activeItem.type.charAt(0) + activeItem.type.slice(1).toLowerCase()}
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="border-t border-white/5 bg-white/[0.01] px-4 py-3 flex items-center justify-between text-xs text-zinc-500 shrink-0">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 font-sans text-[10px]">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 font-sans text-[10px]">↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 font-sans text-[10px]">↵</kbd>
                Open
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 font-sans text-[10px]">Esc</kbd>
              Close
            </div>
          </div>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  );
}
