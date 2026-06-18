"use client";

import { motion } from "framer-motion";
import { Activity, Users, Video, Target, TrendingUp, TrendingDown } from "lucide-react";
import { InfluencerMetrics } from "./influencer-metrics";

interface PerformanceOverviewProps {
  influencer: any;
  analytics: any;
}

export function PerformanceOverview({ influencer, analytics }: PerformanceOverviewProps) {
  const formatNumber = (num?: number) => {
    if (!num) return "—";
    return new Intl.NumberFormat('en-US', {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1
    }).format(num);
  };

  const cards = [
    {
      title: "Audience Size",
      value: formatNumber(influencer.followers),
      trend: "+1.2%",
      isPositive: true,
      icon: Users,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "Avg Engagement",
      value: `${analytics?.avgEngagementRate?.toFixed(2) || "—"}%`,
      trend: "+0.4%",
      isPositive: true,
      icon: Activity,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      title: "Avg Reel Views",
      value: formatNumber(analytics?.avgReelViews),
      trend: "-2.1%",
      isPositive: false,
      icon: Video,
      color: "text-sky-600",
      bg: "bg-sky-50",
    },
    {
      title: "Total Campaigns",
      value: influencer.campaignCount || "0",
      trend: "Stable",
      isPositive: true,
      icon: Target,
      color: "text-rose-600",
      bg: "bg-rose-50",
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="col-span-12 md:col-span-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Performance Overview</h2>
      </div>
      
      <motion.div 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {cards.map((card, i) => (
          <motion.div 
            key={i}
            variants={item}
            className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            {/* Subtle Gradient background on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white to-stone-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl ${card.bg}`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${card.isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                  {card.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {card.trend}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-muted)] mb-1">
                  {card.title}
                </p>
                <p className="text-2xl font-black text-[var(--color-text-primary)]">
                  {card.value}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Chart Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="rounded-3xl border border-[var(--color-border)] bg-white shadow-sm overflow-hidden"
      >
         <InfluencerMetrics influencer={influencer} />
      </motion.div>
    </div>
  );
}
