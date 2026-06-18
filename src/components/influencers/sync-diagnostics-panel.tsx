"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Code, Database, Activity, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SyncDiagnosticsPanel({ 
  influencer,
  rawApifyData = null,
  transformedData = null
}: { 
  influencer: any;
  rawApifyData?: any;
  transformedData?: any;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"database" | "apify" | "transformed">("database");

  if (process.env.NODE_ENV !== "development" && !isOpen) {
    // Only show the toggle button in dev by default, but allow forced open
  }

  return (
    <div className="mt-12 mb-8 rounded-xl border border-stone-800 bg-[#0c0c0c] overflow-hidden">
      {/* Header */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-[#111] hover:bg-[#1a1a1a] transition-colors border-b border-stone-800"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
            <Terminal className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="font-mono text-sm font-bold text-stone-200">Sync Diagnostics & Debug Panel</h3>
            <p className="text-xs text-stone-500 font-mono mt-0.5">Pipeline data verification (Local Dev Only)</p>
          </div>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-stone-500" /> : <ChevronDown className="w-5 h-5 text-stone-500" />}
      </button>

      {/* Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-stone-800"
          >
            {/* Tabs */}
            <div className="flex items-center gap-1 p-2 bg-[#111] border-b border-stone-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("database")}
                className={`font-mono text-xs ${activeTab === "database" ? "bg-stone-800 text-stone-100" : "text-stone-400 hover:text-stone-200"}`}
              >
                <Database className="w-3.5 h-3.5 mr-2" />
                Current DB State
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("apify")}
                className={`font-mono text-xs ${activeTab === "apify" ? "bg-stone-800 text-stone-100" : "text-stone-400 hover:text-stone-200"}`}
              >
                <Code className="w-3.5 h-3.5 mr-2" />
                Raw Apify
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("transformed")}
                className={`font-mono text-xs ${activeTab === "transformed" ? "bg-stone-800 text-stone-100" : "text-stone-400 hover:text-stone-200"}`}
              >
                <Activity className="w-3.5 h-3.5 mr-2" />
                Transformed DB Payload
              </Button>
            </div>

            {/* Editor Area */}
            <div className="p-4 bg-[#0a0a0a] max-h-[500px] overflow-y-auto">
              <pre className="font-mono text-[11px] leading-relaxed text-emerald-400">
                {activeTab === "database" && JSON.stringify(influencer, null, 2)}
                {activeTab === "apify" && (rawApifyData ? JSON.stringify(rawApifyData, null, 2) : "Raw Apify data not injected in this session.")}
                {activeTab === "transformed" && (transformedData ? JSON.stringify(transformedData, null, 2) : "Transformed data not injected in this session.")}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
