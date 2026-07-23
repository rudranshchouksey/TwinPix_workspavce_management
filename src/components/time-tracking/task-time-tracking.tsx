"use client";

import React, { useState, useEffect } from "react";
import { useTimeTracking } from "@/providers/time-tracking-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Play, Pause, Square, Plus, Clock, FileText } from "lucide-react";
import { getTaskTimeEntriesAction, addManualTimeEntryAction } from "@/actions/time-tracking";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

interface TaskTimeTrackingProps {
  taskId: string;
  estimatedHours?: number | null;
  actualHours?: number | null;
}

export function TaskTimeTracking({ taskId, estimatedHours, actualHours }: TaskTimeTrackingProps) {
  const { activeTimer, elapsedSeconds, startTimer, pauseTimer, resumeTimer, stopTimer } = useTimeTracking();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Manual Entry Form
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualDuration, setManualDuration] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualDate, setManualDate] = useState(new Date().toISOString().slice(0, 16));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTimerActiveForThisTask = activeTimer?.taskId === taskId;

  const fetchEntries = async () => {
    try {
      const data = await getTaskTimeEntriesAction(taskId);
      setEntries(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [taskId]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDuration || isNaN(Number(manualDuration))) {
      toast.error("Please enter a valid duration in minutes");
      return;
    }
    setIsSubmitting(true);
    try {
      await addManualTimeEntryAction(taskId, Number(manualDuration), manualDescription, manualDate);
      toast.success("Time logged manually");
      setShowManualForm(false);
      setManualDuration("");
      setManualDescription("");
      fetchEntries();
    } catch (err: any) {
      toast.error(err.message || "Failed to log time");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercent = Math.min(100, estimatedHours && estimatedHours > 0 ? ((actualHours || 0) / estimatedHours) * 100 : 0);
  const isOverTime = estimatedHours && actualHours && actualHours > estimatedHours;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-[var(--color-brand-500)]" /> Time Tracking
        </h3>
        <Button variant="outline" size="sm" onClick={() => setShowManualForm(!showManualForm)}>
          <Plus className="w-4 h-4 mr-1" /> Manual Entry
        </Button>
      </div>

      {/* Timer Controls */}
      <div className="p-4 border rounded-xl bg-white shadow-sm flex items-center justify-between">
        <div>
          <h4 className="font-medium text-sm text-[var(--color-text-primary)]">Live Timer</h4>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {isTimerActiveForThisTask 
              ? activeTimer.isPaused ? "Timer is currently paused" : "Tracking time right now..." 
              : "Click to start tracking time for this task"}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {isTimerActiveForThisTask ? (
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-lg text-[var(--color-brand-600)] min-w-[80px] text-right">
                {Math.floor(elapsedSeconds / 3600).toString().padStart(2, '0')}:
                {Math.floor((elapsedSeconds % 3600) / 60).toString().padStart(2, '0')}:
                {(elapsedSeconds % 60).toString().padStart(2, '0')}
              </span>
              {activeTimer.isPaused ? (
                <Button size="icon" variant="outline" className="h-9 w-9 text-emerald-600" onClick={resumeTimer}>
                  <Play className="w-4 h-4 fill-current" />
                </Button>
              ) : (
                <Button size="icon" variant="outline" className="h-9 w-9 text-amber-600" onClick={pauseTimer}>
                  <Pause className="w-4 h-4 fill-current" />
                </Button>
              )}
              <Button size="icon" variant="destructive" className="h-9 w-9" onClick={stopTimer}>
                <Square className="w-4 h-4 fill-current" />
              </Button>
            </div>
          ) : (
            <Button onClick={() => startTimer(taskId)} className="bg-emerald-600 hover:bg-emerald-700">
              <Play className="w-4 h-4 mr-2" /> Start Timer
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {(estimatedHours || actualHours) && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>Progress: {((actualHours || 0)).toFixed(1)}h logged</span>
            {estimatedHours && <span>{estimatedHours.toFixed(1)}h estimated</span>}
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${isOverTime ? "bg-red-500" : "bg-emerald-500"}`} 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
          {isOverTime && (
            <p className="text-xs text-red-500 mt-1">This task has exceeded the estimated time!</p>
          )}
        </div>
      )}

      {/* Manual Entry Form */}
      {showManualForm && (
        <form onSubmit={handleManualSubmit} className="p-4 bg-[rgba(0,0,0,0.02)] border rounded-xl space-y-4">
          <h4 className="text-sm font-semibold">Log Time Manually</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Date & Time Started</label>
              <Input 
                type="datetime-local" 
                value={manualDate} 
                onChange={e => setManualDate(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Duration (minutes)</label>
              <Input 
                type="number" 
                placeholder="e.g. 120" 
                value={manualDuration} 
                onChange={e => setManualDuration(e.target.value)} 
                required 
                min="1"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Description (Optional)</label>
            <Textarea 
              placeholder="What did you work on?" 
              value={manualDescription} 
              onChange={e => setManualDescription(e.target.value)} 
              className="resize-none h-20"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setShowManualForm(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>Save Entry</Button>
          </div>
        </form>
      )}

      {/* Time Logs */}
      <div>
        <h4 className="text-sm font-semibold mb-4 text-[var(--color-text-secondary)] uppercase tracking-wide">Time Logs</h4>
        {loading ? (
          <p className="text-sm text-center py-4 text-muted-foreground">Loading logs...</p>
        ) : entries.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-xl bg-[rgba(0,0,0,0.01)] text-sm text-[var(--color-text-muted)] flex flex-col items-center">
            <FileText className="w-8 h-8 mb-2 opacity-20" />
            No time has been logged yet
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map(entry => (
              <div key={entry.id} className="flex gap-4 p-3 border rounded-lg hover:bg-[rgba(0,0,0,0.01)] transition-colors bg-white shadow-sm">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                  {entry.user.image ? (
                    <img src={entry.user.image} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold">{entry.user.name?.[0] || "?"}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                      {entry.user.name || entry.user.email}
                    </p>
                    <p className="text-sm font-mono font-medium text-[var(--color-brand-600)] shrink-0">
                      {(entry.durationMinutes / 60).toFixed(2)}h
                    </p>
                  </div>
                  {entry.description && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">
                      {entry.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[var(--color-text-muted)] font-medium">
                    <span>{format(new Date(entry.startTime), 'MMM d, h:mm a')}</span>
                    {entry.isManual && (
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">Manual Entry</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
