"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { getActiveTimerAction, startTimerAction, pauseTimerAction, resumeTimerAction, stopTimerAction } from "@/actions/time-tracking";
import { toast } from "sonner";

export interface ActiveTimerData {
  id: string;
  taskId: string;
  userId: string;
  startTime: string | Date;
  lastPingAt: string | Date;
  pausedTotalMinutes: number;
  isPaused: boolean;
  task?: {
    id: string;
    title: string;
    campaignId: string | null;
  };
}

interface TimeTrackingContextType {
  activeTimer: ActiveTimerData | null;
  elapsedSeconds: number;
  startTimer: (taskId: string) => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
  refreshTimer: () => Promise<void>;
}

const TimeTrackingContext = createContext<TimeTrackingContextType | undefined>(undefined);

export function TimeTrackingProvider({ children }: { children: React.ReactNode }) {
  const [activeTimer, setActiveTimer] = useState<ActiveTimerData | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTimer = async () => {
    try {
      const timer = await getActiveTimerAction();
      setActiveTimer(timer as any);
      updateElapsedSeconds(timer as any);
    } catch (e) {
      console.error("Failed to fetch timer", e);
    }
  };

  useEffect(() => {
    fetchTimer();
    // Poll every minute just to be safe across tabs
    const syncInterval = setInterval(fetchTimer, 60000);
    return () => clearInterval(syncInterval);
  }, []);

  const updateElapsedSeconds = (timer: ActiveTimerData | null) => {
    if (!timer) {
      setElapsedSeconds(0);
      return;
    }
    
    let endMs = new Date().getTime();
    if (timer.isPaused) {
      endMs = new Date(timer.lastPingAt).getTime();
    }
    const startMs = new Date(timer.startTime).getTime();
    const pausedMs = timer.pausedTotalMinutes * 60000;
    
    const totalMs = Math.max(0, endMs - startMs - pausedMs);
    setElapsedSeconds(Math.floor(totalMs / 1000));
  };

  useEffect(() => {
    if (activeTimer && !activeTimer.isPaused) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeTimer]);

  const startTimer = async (taskId: string) => {
    try {
      const timer = await startTimerAction(taskId);
      setActiveTimer(timer as any);
      updateElapsedSeconds(timer as any);
      toast.success("Timer started");
    } catch (error: any) {
      toast.error(error.message || "Failed to start timer");
    }
  };

  const pauseTimer = async () => {
    try {
      const timer = await pauseTimerAction();
      if (timer) {
        // Optimistic UI update
        setActiveTimer({ ...activeTimer, ...timer } as any);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to pause timer");
    }
  };

  const resumeTimer = async () => {
    try {
      const timer = await resumeTimerAction();
      if (timer) {
        // Optimistic UI update
        setActiveTimer({ ...activeTimer, ...timer } as any);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to resume timer");
    }
  };

  const stopTimer = async () => {
    try {
      await stopTimerAction();
      setActiveTimer(null);
      setElapsedSeconds(0);
      toast.success("Timer stopped & time logged");
    } catch (error: any) {
      toast.error(error.message || "Failed to stop timer");
    }
  };

  return (
    <TimeTrackingContext.Provider value={{
      activeTimer,
      elapsedSeconds,
      startTimer,
      pauseTimer,
      resumeTimer,
      stopTimer,
      refreshTimer: fetchTimer
    }}>
      {children}
    </TimeTrackingContext.Provider>
  );
}

export function useTimeTracking() {
  const context = useContext(TimeTrackingContext);
  if (context === undefined) {
    throw new Error("useTimeTracking must be used within a TimeTrackingProvider");
  }
  return context;
}
