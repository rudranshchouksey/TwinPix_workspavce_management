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
  { id: "qa8", icon: LayoutDashboard, title: "Open Dashboard", href: "/dashboard", color: "text-gray-500" },
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
      case "FILE": return <FileText className="w-4 h-4 text-gray-500" />;
      case "MESSAGE": return <MessageSquare className="w-4 h-4 text-sky-500" />;
      case "USER": return <Users className="w-4 h-4 text-purple-500" />;
      case "SETTING": return <Settings className="w-4 h-4 text-gray-500" />;
      default: return <ArrowRight className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEntityBadgeColor = (type: string) => {
    switch (type) {
      case "INFLUENCER": return "bg-pink-50 text-pink-500 border-pink-100";
      case "CAMPAIGN": return "bg-blue-50 text-blue-500 border-blue-100";
      case "CLIENT": return "bg-orange-50 text-orange-500 border-orange-100";
      case "PROJECT": return "bg-indigo-50 text-indigo-500 border-indigo-100";
      case "TASK": return "bg-green-50 text-green-500 border-green-100";
      case "FILE": return "bg-gray-50 text-gray-500 border-gray-100";
      case "MESSAGE": return "bg-sky-50 text-sky-500 border-sky-100";
      case "USER": return "bg-purple-50 text-purple-500 border-purple-100";
      case "SETTING": return "bg-gray-50 text-gray-500 border-gray-100";
      default: return "bg-gray-50 text-gray-500 border-gray-100";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent 
        className="max-w-[900px] w-[900px] h-[700px] p-0 overflow-hidden border border-gray-200 shadow-xl rounded-3xl bg-white/90 backdrop-blur-2xl"
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
          <div className="flex flex-col border-b border-gray-200">
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-xl border border-gray-200">
                  <Search className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 tracking-wide">Workspace Search</h2>
                  <p className="text-xs text-gray-500">Search influencers, campaigns, tasks, files and more</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-100 border border-gray-200 text-xs font-medium text-gray-500 tracking-widest">
                <span>⌘</span>
                <span>K</span>
              </div>
            </div>
            
            <div className="px-6 pb-5">
              <div className="relative group">
                <CommandPrimitive.Input 
                  className="w-full h-14 bg-white border border-gray-200 rounded-2xl pl-12 pr-4 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all shadow-sm"
                  placeholder="Search influencers, campaigns, files, tasks..."
                  value={query}
                  onValueChange={setQuery}
                  autoFocus
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
                {loading && (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-gray-400" />
                )}
              </div>
            </div>
          </div>

          {/* Main Body */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Pane: Results */}
            <div className={cn(
              "flex-1 overflow-y-auto no-scrollbar outline-none border-r border-gray-200",
              query.length > 0 ? "w-1/2 max-w-[50%]" : "w-full"
            )}>
              <CommandPrimitive.List className="p-2 outline-none h-full bg-white">
                
                {!loading && query && results.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mb-2">No results found</p>
                    <p className="text-sm text-gray-500 max-w-[250px]">Try searching by name, username, email, campaign, or task.</p>
                  </div>
                )}

                {!query && (
                  <div className="p-4 space-y-8 animate-in fade-in duration-300 bg-white">
                    {/* Quick Actions */}
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Quick Actions</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {QUICK_ACTIONS.map(action => (
                          <CommandPrimitive.Item
                            key={action.id}
                            value={action.id}
                            onSelect={() => onSelect(action.href)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer select-none transition-colors data-[selected=true]:bg-violet-50 hover:bg-gray-50"
                          >
                            <div className={cn("p-1.5 rounded-lg bg-gray-100", action.color)}>
                              <action.icon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{action.title}</span>
                          </CommandPrimitive.Item>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-8">
                      {/* Recent Searches */}
                      <div className="flex-1">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Recent Searches</h3>
                        <div className="space-y-1">
                          {RECENT_SEARCHES.map(item => (
                            <CommandPrimitive.Item
                              key={item.id}
                              value={item.id}
                              onSelect={() => onSelect(item.href)}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer select-none transition-colors data-[selected=true]:bg-violet-50 hover:bg-gray-50"
                            >
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">{item.title}</span>
                                <span className="text-xs text-gray-500">{item.type}</span>
                              </div>
                            </CommandPrimitive.Item>
                          ))}
                        </div>
                      </div>

                      {/* Pinned Items */}
                      <div className="flex-1">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Pinned Items</h3>
                        <div className="space-y-1">
                          {PINNED_ITEMS.map(item => (
                            <CommandPrimitive.Item
                              key={item.id}
                              value={item.id}
                              onSelect={() => onSelect(item.href)}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer select-none transition-colors data-[selected=true]:bg-violet-50 hover:bg-gray-50"
                            >
                              <Star className="w-3.5 h-3.5 text-yellow-500" />
                              <span className="text-sm font-medium text-gray-900">{item.title}</span>
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
                    heading={<span className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 block">{type}</span>}
                    className="mb-4 [&_[cmdk-group-heading]]:p-0"
                  >
                    {items.map(item => (
                      <CommandPrimitive.Item
                        key={item.id}
                        value={item.id}
                        onSelect={() => onSelect(item.href)}
                        className="group flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer select-none transition-colors data-[selected=true]:bg-violet-50 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {item.type === 'INFLUENCER' && item.metadata?.profileImage ? (
                            <img src={item.metadata.profileImage} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                              {getEntityIcon(item.type)}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-gray-900 truncate">{item.title}</span>
                            {item.subtitle && (
                              <span className="text-xs text-gray-500 truncate">{item.subtitle}</span>
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
              <div className="w-1/2 bg-gray-50/50 p-6 overflow-y-auto no-scrollbar relative flex flex-col border-l border-gray-200">
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
                        <img src={activeItem.metadata.profileImage} alt="" className="w-16 h-16 rounded-2xl object-cover shadow-sm border border-gray-200 shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                          {getEntityIcon(activeItem.type)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 mb-1 leading-tight truncate">{activeItem.title}</h3>
                        <p className="text-sm text-gray-500 truncate">{activeItem.subtitle}</p>
                      </div>
                    </div>

                    {/* Dynamic Details based on Type */}
                    <div className="space-y-4 mb-16">
                      {activeItem.type === "INFLUENCER" && activeItem.metadata && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                              <p className="text-xs text-gray-500 font-medium mb-1">Followers</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {activeItem.metadata.followers ? new Intl.NumberFormat().format(activeItem.metadata.followers) : "--"}
                              </p>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                              <p className="text-xs text-gray-500 font-medium mb-1">Engagement</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {activeItem.metadata.engagementRate ? `${activeItem.metadata.engagementRate}%` : "--"}
                              </p>
                            </div>
                          </div>
                          
                          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
                            {activeItem.metadata.category && (
                              <div className="flex justify-between items-center text-sm gap-4">
                                <span className="text-gray-500 shrink-0">Category</span>
                                <span className="text-gray-900 font-medium text-right truncate">{activeItem.metadata.category}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center text-sm gap-4">
                              <span className="text-gray-500 shrink-0">Status</span>
                              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase shrink-0", getEntityBadgeColor(activeItem.type))}>
                                {activeItem.metadata.status}
                              </span>
                            </div>
                            {activeItem.metadata.email && (
                              <div className="flex justify-between items-center text-sm gap-4">
                                <span className="text-gray-500 shrink-0">Email</span>
                                <span className="text-gray-900 text-right truncate">{activeItem.metadata.email}</span>
                              </div>
                            )}
                            {activeItem.metadata.phoneNumber && (
                              <div className="flex justify-between items-center text-sm gap-4">
                                <span className="text-gray-500 shrink-0">Phone</span>
                                <span className="text-gray-900 text-right truncate">{activeItem.metadata.phoneNumber}</span>
                              </div>
                            )}
                          </div>
                          
                          {activeItem.metadata.tags && activeItem.metadata.tags.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tags</p>
                              <div className="flex flex-wrap gap-1.5">
                                {activeItem.metadata.tags.map((tag: string) => (
                                  <span key={tag} className="px-2 py-1 bg-gray-100 rounded border border-gray-200 text-xs text-gray-700">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {activeItem.type === "CAMPAIGN" && activeItem.metadata && (
                        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Status</span>
                            <span className="text-gray-900 font-medium">{activeItem.metadata.status}</span>
                          </div>
                          {activeItem.metadata.budget !== null && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Budget</span>
                              <span className="text-gray-900 font-medium">${activeItem.metadata.budget?.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {activeItem.type === "TASK" && activeItem.metadata && (
                        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Status</span>
                            <span className="text-gray-900 font-medium">{activeItem.metadata.status}</span>
                          </div>
                          {activeItem.metadata.dueDate && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Due Date</span>
                              <span className="text-gray-900 font-medium">{new Date(activeItem.metadata.dueDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {activeItem.type === "FILE" && activeItem.metadata && (
                        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">File Type</span>
                            <span className="text-gray-900 font-medium truncate ml-4">{activeItem.metadata.mimeType || "Unknown"}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Uploaded</span>
                            <span className="text-gray-900 font-medium">{new Date(activeItem.metadata.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
                
                <div className="absolute bottom-6 left-6 right-6 mt-auto">
                  <button 
                    onClick={() => onSelect(activeItem.href)}
                    className="w-full py-2.5 bg-gray-900 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-sm"
                  >
                    Open {activeItem.type.charAt(0) + activeItem.type.slice(1).toLowerCase()}
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50/50 px-4 py-3 flex items-center justify-between text-xs text-gray-500 shrink-0">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 font-sans text-[10px] text-gray-900 shadow-sm">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 font-sans text-[10px] text-gray-900 shadow-sm">↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 font-sans text-[10px] text-gray-900 shadow-sm">↵</kbd>
                Open
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 font-sans text-[10px] text-gray-900 shadow-sm">Esc</kbd>
              Close
            </div>
          </div>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  );
}
