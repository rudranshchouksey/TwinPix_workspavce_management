"use client";

import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useTheme } from "next-themes";

interface CampaignChartProps {
  data: {
    name: string;
    value: number;
  }[];
}

export function CampaignChart({ data }: CampaignChartProps) {
  const { theme } = useTheme();

  // Define a nice palette for the pie chart
  const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
  const emptyData = data.every(d => d.value === 0);

  const displayData = emptyData 
    ? [{ name: "No Data", value: 1 }] 
    : data;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length && !emptyData) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-foreground">{payload[0].name}</p>
          <p className="text-sm font-bold mt-1" style={{ color: payload[0].payload.fill }}>
            {payload[0].value} Campaigns
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="col-span-4 lg:col-span-2 rounded-xl border bg-card text-card-foreground shadow-sm p-6"
    >
      <div className="flex flex-col space-y-1.5 mb-2">
        <h3 className="font-semibold leading-none tracking-tight">Campaign Status</h3>
        <p className="text-sm text-muted-foreground">Distribution of campaigns</p>
      </div>
      
      <div className="h-[300px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={displayData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {displayData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={emptyData ? "hsl(var(--muted))" : COLORS[index % COLORS.length]} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {!emptyData && (
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
