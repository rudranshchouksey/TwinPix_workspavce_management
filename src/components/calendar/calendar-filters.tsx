"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export const EVENT_TYPES = [
  { id: "MEETING", label: "Meetings", color: "bg-blue-500" },
  { id: "TASK", label: "Tasks", color: "bg-emerald-500" },
  { id: "CAMPAIGN", label: "Campaigns", color: "bg-amber-500" },
  { id: "CONTENT_POST", label: "Content Posts", color: "bg-violet-500" },
  { id: "DEADLINE", label: "Deadlines", color: "bg-red-500" },
];

interface CalendarFiltersProps {
  selectedTypes: string[];
  onChange: (types: string[]) => void;
}

export function CalendarFilters({ selectedTypes, onChange }: CalendarFiltersProps) {
  const toggleType = (typeId: string) => {
    if (selectedTypes.includes(typeId)) {
      onChange(selectedTypes.filter((t) => t !== typeId));
    } else {
      onChange([...selectedTypes, typeId]);
    }
  };

  return (
    <div className="bg-card border rounded-xl p-4 space-y-4">
      <h3 className="font-semibold text-sm">Filters</h3>
      <div className="space-y-3">
        {EVENT_TYPES.map((type) => (
          <div key={type.id} className="flex items-center space-x-2">
            <Checkbox
              id={`filter-${type.id}`}
              checked={selectedTypes.includes(type.id)}
              onCheckedChange={() => toggleType(type.id)}
            />
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${type.color}`} />
              <Label htmlFor={`filter-${type.id}`} className="text-sm cursor-pointer">
                {type.label}
              </Label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
