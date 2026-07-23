"use client";

import { useState, useRef, useEffect } from "react";
import { updateTaskAction } from "@/actions/tasks";
import { toast } from "sonner";
import { Loader2, Check, X, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface InlineEditProps {
  taskId: string;
  field: string;
  value: any;
  type?: "text" | "textarea" | "select" | "number" | "date";
  options?: { label: string; value: string }[];
  placeholder?: string;
  className?: string;
  displayValue?: React.ReactNode;
}

export function InlineEdit({
  taskId,
  field,
  value,
  type = "text",
  options = [],
  placeholder = "Empty",
  className = "",
  displayValue,
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<any>(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && type !== "select") {
      inputRef.current?.focus();
    }
  }, [isEditing, type]);

  const handleSave = async (newValue: any) => {
    if (newValue === value) {
      setIsEditing(false);
      return;
    }
    
    setIsSaving(true);
    try {
      await updateTaskAction(taskId, { [field]: newValue });
      toast.success("Updated successfully");
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update");
      setCurrentValue(value); // revert
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && type !== "textarea") {
      handleSave(currentValue);
    } else if (e.key === "Escape") {
      setCurrentValue(value);
      setIsEditing(false);
    }
  };

  if (isSaving) {
    return <div className="flex items-center text-sm text-[var(--color-text-muted)]"><Loader2 className="w-3 h-3 mr-2 animate-spin" /> Saving...</div>;
  }

  if (!isEditing) {
    return (
      <div 
        className={`group relative cursor-pointer rounded -mx-1.5 px-1.5 py-1 hover:bg-[rgba(0,0,0,0.03)] transition-colors ${className}`}
        onClick={() => setIsEditing(true)}
      >
        <div className={!value ? "text-[var(--color-text-muted)] italic" : ""}>
          {displayValue || currentValue || placeholder}
        </div>
        <Pencil className="w-3 h-3 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 absolute right-1.5 top-1/2 -translate-y-1/2 transition-opacity" />
      </div>
    );
  }

  if (type === "select") {
    return (
      <Select 
        value={currentValue || ""} 
        onValueChange={(val) => {
          setCurrentValue(val);
          handleSave(val);
        }}
        defaultOpen
        onOpenChange={(open) => {
          if (!open) setIsEditing(false);
        }}
      >
        <SelectTrigger className="h-8 text-sm">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (type === "textarea") {
    return (
      <div className="space-y-2">
        <Textarea
          ref={inputRef}
          value={currentValue || ""}
          onChange={(e) => setCurrentValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[100px] text-sm resize-none"
          placeholder={placeholder}
        />
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => { setCurrentValue(value); setIsEditing(false); }}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => handleSave(currentValue)}>
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Input
      ref={inputRef}
      type={type === "number" ? "number" : type === "date" ? "date" : "text"}
      value={currentValue || ""}
      onChange={(e) => setCurrentValue(type === "number" ? Number(e.target.value) : e.target.value)}
      onBlur={() => handleSave(currentValue)}
      onKeyDown={handleKeyDown}
      className="h-8 text-sm px-2 py-1"
      placeholder={placeholder}
    />
  );
}
