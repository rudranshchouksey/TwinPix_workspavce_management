import React from "react";
import { format, differenceInDays } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Briefcase, Calendar as CalendarIcon, CheckCircle2, AlertCircle, User as UserIcon, X } from "lucide-react";

export function StatusSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const statuses = [
    { value: "TODO", label: "To Do", color: "bg-gray-100 text-gray-700 border-gray-200" },
    { value: "IN_PROGRESS", label: "In Progress", color: "bg-blue-100 text-blue-700 border-blue-200" },
    { value: "REVIEW", label: "Review", color: "bg-amber-100 text-amber-700 border-amber-200" },
    { value: "DONE", label: "Done", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  ];
  
  const current = statuses.find(s => s.value === value) || statuses[0];

  return (
    <Popover>
      <PopoverTrigger className="w-full flex items-center justify-between p-3 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white hover:bg-[rgba(0,0,0,0.02)] transition-all focus:outline-none">
        <div className="flex items-center gap-3">
          <div className="text-xs text-[var(--color-text-muted)] uppercase font-semibold w-16 text-left shrink-0">Status</div>
          <Badge className={cn("rounded-md border shadow-none font-medium text-xs py-0.5", current.color)} variant="outline">
            {current.label}
          </Badge>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 rounded-xl" align="start">
        <Command>
          <CommandInput placeholder="Search status..." className="h-9 text-sm border-none ring-0 focus-visible:ring-0" />
          <CommandList>
            <CommandEmpty>No status found.</CommandEmpty>
            <CommandGroup>
              {statuses.map(s => (
                <CommandItem key={s.value} value={s.label} onSelect={() => onChange(s.value)} className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg mx-1 my-1">
                  <Badge className={cn("rounded-md border shadow-none text-xs py-0.5", s.color)} variant="outline">{s.label}</Badge>
                  {value === s.value && <CheckCircle2 className="w-4 h-4 ml-auto text-gray-400" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function PrioritySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const priorities = [
    { value: "LOW", label: "Low", icon: "🔽", color: "bg-gray-100 text-gray-700" },
    { value: "MEDIUM", label: "Medium", icon: "⏸", color: "bg-blue-100 text-blue-700" },
    { value: "HIGH", label: "High", icon: "🔼", color: "bg-amber-100 text-amber-700" },
    { value: "URGENT", label: "Urgent", icon: "⏫", color: "bg-rose-100 text-rose-700" },
  ];
  
  const current = priorities.find(p => p.value === value) || priorities[0];

  return (
    <Popover>
      <PopoverTrigger className="w-full flex items-center justify-between p-3 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white hover:bg-[rgba(0,0,0,0.02)] transition-all focus:outline-none">
        <div className="flex items-center gap-3">
          <div className="text-xs text-[var(--color-text-muted)] uppercase font-semibold w-16 text-left shrink-0">Priority</div>
          <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold", current.color)}>
            <span className="text-[10px]">{current.icon}</span>
            <span>{current.label}</span>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 rounded-xl" align="start">
        <Command>
          <CommandInput placeholder="Search priority..." className="h-9 text-sm border-none ring-0 focus-visible:ring-0" />
          <CommandList>
            <CommandEmpty>No priority found.</CommandEmpty>
            <CommandGroup>
              {priorities.map(p => (
                <CommandItem key={p.value} value={p.label} onSelect={() => onChange(p.value)} className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg mx-1 my-1">
                  <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold", p.color)}>
                    <span className="text-[10px]">{p.icon}</span>
                    <span>{p.label}</span>
                  </div>
                  {value === p.value && <CheckCircle2 className="w-4 h-4 ml-auto text-gray-400" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function UserSelect({ value, onChange, users, label }: { value: string; onChange: (v: string | null) => void; users: any[]; label: string }) {
  const current = users.find(u => u.id === value);

  return (
    <Popover>
      <PopoverTrigger className="w-full flex items-center justify-between p-3 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white hover:bg-[rgba(0,0,0,0.02)] transition-all focus:outline-none relative group">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="text-xs text-[var(--color-text-muted)] uppercase font-semibold w-16 text-left shrink-0">{label}</div>
          {current ? (
            <div className="flex items-center gap-2 truncate">
              <Avatar className="w-6 h-6 border">
                <AvatarImage src={current.image} />
                <AvatarFallback className="text-[10px]"><UserIcon className="w-3 h-3 text-gray-400" /></AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium truncate">{current.name || current.email}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
              <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center border border-dashed"><UserIcon className="w-3 h-3 text-gray-400" /></div>
              <span className="text-sm italic">Unassigned</span>
            </div>
          )}
        </div>
        {current && (
          <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(null); }} className="p-1 hover:bg-gray-100 rounded-full transition-colors z-10 relative hidden group-hover:block shrink-0">
            <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
          </div>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 rounded-xl" align="start">
        <Command>
          <CommandInput placeholder={`Search ${label}...`} className="h-9 text-sm border-none ring-0 focus-visible:ring-0" />
          <CommandList>
            <CommandEmpty>No user found.</CommandEmpty>
            <CommandGroup>
              <CommandItem onSelect={() => onChange(null)} className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg mx-1 my-1">
                 <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-dashed"><UserIcon className="w-4 h-4 text-gray-400" /></div>
                 <span className="text-sm italic text-gray-500">Unassigned</span>
              </CommandItem>
              {users.map(u => (
                <CommandItem key={u.id} value={`${u.name} ${u.email}`} onSelect={() => onChange(u.id)} className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg mx-1 my-1">
                  <Avatar className="w-8 h-8 border">
                    <AvatarImage src={u.image} />
                    <AvatarFallback><UserIcon className="w-4 h-4 text-gray-400" /></AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium truncate">{u.name || u.email}</span>
                    <span className="text-[10px] text-[var(--color-text-muted)] truncate uppercase font-semibold tracking-wider mt-0.5">{u.role || u.jobTitle || 'Member'}</span>
                  </div>
                  {value === u.id && <CheckCircle2 className="w-4 h-4 ml-auto text-[var(--color-brand-500)]" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function EntitySelect({ value, onChange, items, label, icon: Icon }: { value: string; onChange: (v: string | null) => void; items: any[]; label: string; icon: any }) {
  const current = items.find(i => i.id === value);

  return (
    <Popover>
      <PopoverTrigger className="w-full flex items-center justify-between p-3 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white hover:bg-[rgba(0,0,0,0.02)] transition-all focus:outline-none relative group">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="text-xs text-[var(--color-text-muted)] uppercase font-semibold w-16 text-left shrink-0">{label}</div>
          {current ? (
            <div className="flex items-center gap-2 truncate">
              <div className="w-6 h-6 rounded-md bg-[var(--color-brand-50)] flex items-center justify-center border border-[var(--color-brand-100)] shrink-0">
                <Icon className="w-3.5 h-3.5 text-[var(--color-brand-500)]" />
              </div>
              <span className="text-sm font-medium truncate">{current.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
              <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center border border-dashed shrink-0"><Icon className="w-3.5 h-3.5 text-gray-400" /></div>
              <span className="text-sm italic">None</span>
            </div>
          )}
        </div>
        {current && (
          <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(null); }} className="p-1 hover:bg-gray-100 rounded-full transition-colors z-10 relative hidden group-hover:block shrink-0">
            <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
          </div>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 rounded-xl" align="start">
        <Command>
          <CommandInput placeholder={`Search ${label}...`} className="h-9 text-sm border-none ring-0 focus-visible:ring-0" />
          <CommandList>
            <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
            <CommandGroup>
              <CommandItem onSelect={() => onChange(null)} className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg mx-1 my-1">
                 <div className="w-8 h-8 rounded-md bg-gray-50 flex items-center justify-center border border-dashed"><Icon className="w-4 h-4 text-gray-400" /></div>
                 <span className="text-sm italic text-gray-500">None</span>
              </CommandItem>
              {items.map(i => (
                <CommandItem key={i.id} value={i.name} onSelect={() => onChange(i.id)} className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg mx-1 my-1">
                  <div className="w-8 h-8 rounded-md bg-[var(--color-brand-50)] flex items-center justify-center border border-[var(--color-brand-100)] shrink-0">
                    <Icon className="w-4 h-4 text-[var(--color-brand-500)]" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium truncate">{i.name}</span>
                    {(i.client?.companyName || i.status) && (
                      <span className="text-[10px] text-[var(--color-text-muted)] truncate uppercase font-semibold tracking-wider mt-0.5">{i.client?.companyName || i.status}</span>
                    )}
                  </div>
                  {value === i.id && <CheckCircle2 className="w-4 h-4 ml-auto text-[var(--color-brand-500)] shrink-0" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function DatePickerPopover({ value, onChange }: { value: string; onChange: (v: string | null) => void }) {
  const dateValue = value ? new Date(value) : undefined;
  
  let relativeBadge = null;
  if (dateValue) {
    const days = differenceInDays(dateValue, new Date());
    if (days < 0) {
      relativeBadge = <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 shadow-none px-1.5 py-0 rounded-[4px] text-[10px] uppercase font-bold shrink-0 leading-none h-[18px]">Late</Badge>;
    } else if (days === 0) {
      relativeBadge = <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 shadow-none px-1.5 py-0 rounded-[4px] text-[10px] uppercase font-bold shrink-0 leading-none h-[18px]">Today</Badge>;
    } else {
      relativeBadge = <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase bg-gray-50 border px-1.5 rounded-[4px] shrink-0 leading-none h-[18px] flex items-center">in {days}d</span>;
    }
  }

  return (
    <Popover>
      <PopoverTrigger className="w-full flex items-center justify-between p-3 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white hover:bg-[rgba(0,0,0,0.02)] transition-all focus:outline-none relative group">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="text-xs text-[var(--color-text-muted)] uppercase font-semibold w-16 text-left shrink-0">Due Date</div>
          {dateValue ? (
            <div className="flex items-center gap-2 truncate">
              <span className="text-sm font-medium">{format(dateValue, "MMM d, yyyy")}</span>
              {relativeBadge}
            </div>
          ) : (
            <span className="text-sm italic text-[var(--color-text-muted)]">No date</span>
          )}
        </div>
        {dateValue && (
          <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(null); }} className="p-1 hover:bg-gray-100 rounded-full transition-colors z-10 relative hidden group-hover:block shrink-0">
            <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
          </div>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2 rounded-xl" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={(d) => {
            onChange(d ? format(d, "yyyy-MM-dd") : null);
          }}
          className="p-0 border-0"
        />
      </PopoverContent>
    </Popover>
  );
}
