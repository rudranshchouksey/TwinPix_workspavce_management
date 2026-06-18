"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CreatorInsightsProps {
  analytics: any;
}

export function CreatorInsights({ analytics }: CreatorInsightsProps) {
  const defaultInsights = [
    "Consistent posting schedule (3-4 times a week).",
    "Audience highly engaged with video content over static posts.",
    "Strongest performance on weekends.",
  ];

  const insights = analytics?.aiInsights?.length > 0 ? analytics.aiInsights : defaultInsights;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="col-span-12 md:col-span-4 flex flex-col gap-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">AI Insights</h2>
      </div>

      <div className="rounded-3xl border border-[var(--color-border)] bg-gradient-to-b from-stone-50 to-white shadow-sm p-6 flex-1 flex flex-col relative overflow-hidden">
        {/* Subtle decorative element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="p-2.5 rounded-xl bg-[var(--color-brand-100)] text-[var(--color-brand-600)]">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-[var(--color-text-primary)]">Intelligence Summary</h3>
        </div>

        <ul className="space-y-4 relative z-10 flex-1">
          {insights.map((insight: string, idx: number) => (
            <motion.li 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * idx }}
              className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow group"
            >
              <span className="text-[var(--color-brand-500)] mt-0.5">•</span>
              <p className="text-sm font-medium text-[var(--color-text-secondary)] leading-relaxed">
                {insight}
              </p>
            </motion.li>
          ))}
        </ul>

        <div className="mt-6 pt-6 border-t border-[var(--color-border)] relative z-10">
           <Button variant="ghost" className="w-full justify-between font-semibold text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] hover:bg-[var(--color-brand-50)]">
             Generate New Report
             <ArrowRight className="w-4 h-4 ml-2" />
           </Button>
        </div>
      </div>
    </motion.div>
  );
}
