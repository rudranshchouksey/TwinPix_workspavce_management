"use client";

import React from "react";
import { useTimeTracking } from "@/providers/time-tracking-provider";
import { Play, Pause, Square, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function FloatingTimer() {
  const { activeTimer, elapsedSeconds, pauseTimer, resumeTimer, stopTimer } = useTimeTracking();
  const router = useRouter();

  if (!activeTimer) return null;

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const isPaused = activeTimer.isPaused;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 border border-[rgba(0,0,0,0.1)] shadow-xl rounded-full pl-6 pr-3 py-2 flex items-center gap-6">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => router.push(`/tasks/${activeTimer.taskId}`)}
        >
          <div className={`w-2.5 h-2.5 rounded-full ${isPaused ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`} />
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              {isPaused ? "Paused" : "Tracking Time"}
            </span>
            <span className="text-sm font-medium text-[var(--color-text-primary)] max-w-[200px] truncate group-hover:underline">
              {activeTimer.task?.title || "Unknown Task"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-lg font-mono font-bold tracking-tight w-[90px] text-center text-[var(--color-text-primary)]">
            {formattedTime}
          </div>
        </div>

        <div className="flex items-center gap-1 border-l border-[rgba(0,0,0,0.1)] pl-3">
          {isPaused ? (
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={resumeTimer}>
              <Play className="w-4 h-4 fill-current" />
            </Button>
          ) : (
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={pauseTimer}>
              <Pause className="w-4 h-4 fill-current" />
            </Button>
          )}
          
          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50" onClick={stopTimer}>
            <Square className="w-4 h-4 fill-current" />
          </Button>
        </div>
      </div>
    </div>
  );
}
