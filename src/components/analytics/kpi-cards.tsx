"use client";

import { motion, Variants } from "framer-motion";
import { Users, Building2, Megaphone, DollarSign, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumCard } from "@/components/ui/premium-card";

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
      accent: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Active Campaigns",
      value: data.activeCampaigns.toString(),
      icon: Megaphone,
      trend: "+4.1%",
      trendUp: true,
      accent: "bg-blue-50 text-blue-600",
    },
    {
      title: "Influencers",
      value: data.totalInfluencers.toString(),
      icon: Users,
      trend: "+21.2%",
      trendUp: true,
      accent: "bg-violet-50 text-violet-600",
    },
    {
      title: "Team Productivity",
      value: `${data.productivity}%`,
      icon: Activity,
      trend: "+5.4%",
      trendUp: true,
      accent: "bg-amber-50 text-amber-600",
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
        <motion.div key={index} variants={item}>
          <PremiumCard hoverEffect="lift" className="h-full flex flex-col justify-between overflow-hidden relative group p-6 border-[rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between relative z-10">
              <h3 className="text-xs font-semibold text-[var(--color-text-muted)] tracking-wide uppercase">{card.title}</h3>
              <div className={cn("p-2 rounded-xl shadow-sm transition-colors", card.accent)}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 relative z-10">
              <div className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">{card.value}</div>
              <p className="text-xs font-medium text-[var(--color-text-muted)] mt-2 flex items-center">
                <span className={cn("mr-1.5 px-1.5 py-0.5 rounded-full inline-flex items-center text-[10px]", card.trendUp ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                  {card.trend}
                </span>
                vs last month
              </p>
            </div>
          </PremiumCard>
        </motion.div>
      ))}
    </motion.div>
  );
}
