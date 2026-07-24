"use client";

import { useState, useCallback, useEffect } from "react";
import { Check, Plus, Trash2, GripVertical, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateTaskAction } from "@/actions/tasks";
import { toast } from "sonner";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export function TaskChecklist({ taskId, initialChecklist = [] }: { taskId: string; initialChecklist?: any }) {
  const [items, setItems] = useState<ChecklistItem[]>(Array.isArray(initialChecklist) ? initialChecklist : []);
  const [newItemText, setNewItemText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const completedCount = items.filter(i => i.completed).length;
  const totalCount = items.length;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const saveChecklist = useCallback(async (newItems: ChecklistItem[]) => {
    setIsSaving(true);
    try {
      await updateTaskAction(taskId, { checklist: newItems as any });
      setItems(newItems);
    } catch (e) {
      toast.error("Failed to save checklist");
    } finally {
      setIsSaving(false);
    }
  }, [taskId]);

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    const newItem = { id: Date.now().toString(), text: newItemText.trim(), completed: false };
    const updated = [...items, newItem];
    setNewItemText("");
    saveChecklist(updated);
  };

  const handleToggle = (id: string) => {
    const updated = items.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
    saveChecklist(updated);
  };

  const handleDelete = (id: string) => {
    const updated = items.filter(item => item.id !== id);
    saveChecklist(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
          <CheckCircle2 className="w-4 h-4 text-[var(--color-brand-500)]" />
          <span>{completedCount} / {totalCount} completed</span>
        </div>
        <span className="text-xs font-bold text-[var(--color-text-primary)]">{progress}%</span>
      </div>
      
      {/* Progress bar */}
      <div className="h-1.5 w-full bg-[rgba(0,0,0,0.05)] rounded-full overflow-hidden mb-6">
        <div 
          className="h-full bg-[var(--color-brand-500)] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-2">
        {items.length === 0 && (
          <div className="text-center py-6 text-sm text-[var(--color-text-muted)] border border-dashed rounded-lg">
            No checklist items. Add one below.
          </div>
        )}
        
        {items.map((item) => (
          <div 
            key={item.id} 
            className={`group flex items-center gap-3 p-2 rounded-lg border transition-all ${
              item.completed 
                ? "bg-[rgba(0,0,0,0.02)] border-transparent" 
                : "bg-white border-[rgba(0,0,0,0.08)] shadow-sm"
            }`}
          >
            <button 
              onClick={() => handleToggle(item.id)}
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                item.completed 
                  ? "bg-[var(--color-brand-500)] border-[var(--color-brand-500)] text-white" 
                  : "border-gray-300 hover:border-[var(--color-brand-500)]"
              }`}
            >
              {item.completed && <Check className="w-3 h-3" />}
            </button>
            <span className={`flex-1 text-sm transition-all ${item.completed ? "line-through text-[var(--color-text-muted)]" : "text-[var(--color-text-primary)]"}`}>
              {item.text}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => handleDelete(item.id)}
              disabled={isSaving}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-4 pt-2">
        <Input 
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="Add an item..."
          className="text-sm bg-[rgba(0,0,0,0.02)] border-none focus-visible:ring-1"
          onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
        />
        <Button onClick={handleAddItem} disabled={!newItemText.trim() || isSaving} size="sm">
          Add
        </Button>
      </div>
    </div>
  );
}
