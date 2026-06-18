"use client";

import { motion, Variants } from "framer-motion";
import { Users, Building2, Megaphone, DollarSign, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardsProps {
  data: {
    totalInfluencers: number;
    totalClients: number;
    activeCampaigns: number;
    totalRevenue: number;
    productivity: number;
  };
}

export function KPICards({ data }: KPICardsProps) {
  const cards = [
    {
      title: "Total Revenue",
      value: `$${data.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      trend: "+12.5%",
      trendUp: true,
      accent: "bg-emerald-500/10 text-emerald-500",
    },
    {
      title: "Active Campaigns",
      value: data.activeCampaigns.toString(),
      icon: Megaphone,
      trend: "+4.1%",
      trendUp: true,
      accent: "bg-blue-500/10 text-blue-500",
    },
    {
      title: "Influencers",
      value: data.totalInfluencers.toString(),
      icon: Users,
      trend: "+21.2%",
      trendUp: true,
      accent: "bg-violet-500/10 text-violet-500",
    },
    {
      title: "Team Productivity",
      value: `${data.productivity}%`,
      icon: Activity,
      trend: "+5.4%",
      trendUp: true,
      accent: "bg-orange-500/10 text-orange-500",
    },
  ];

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
    >
      {cards.map((card, index) => (
        <motion.div
          key={index}
          variants={item}
          className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-between overflow-hidden relative group"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">{card.title}</h3>
            <div className={cn("p-2 rounded-lg transition-colors", card.accent)}>
              <card.icon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <span className={cn("mr-1 font-medium", card.trendUp ? "text-emerald-500" : "text-red-500")}>
                {card.trend}
              </span>
              from last month
            </p>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 dark:to-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </motion.div>
      ))}
    </motion.div>
  );
}
