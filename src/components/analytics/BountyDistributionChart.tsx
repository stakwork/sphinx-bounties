"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Target } from "lucide-react";

interface BountyDistributionChartProps {
  data: {
    open: number;
    assigned: number;
    completed: number;
  };
}

// Vibrant gradient colors for liquid glassy theme
const COLORS = {
  open: "#3b82f6", // Bright blue
  assigned: "#f59e0b", // Vibrant amber
  completed: "#10b981", // Fresh emerald
};

export function BountyDistributionChart({ data }: BountyDistributionChartProps) {
  const chartData = [
    { name: "Open", value: data.open, color: COLORS.open },
    { name: "Assigned", value: data.assigned, color: COLORS.assigned },
    { name: "Completed", value: data.completed, color: COLORS.completed },
  ].filter((item) => item.value > 0);

  if (chartData.length === 0) {
    return (
      <Card className="group relative overflow-hidden border-neutral-200/50 backdrop-blur-sm bg-gradient-to-br from-blue-50/30 via-purple-50/30 to-pink-50/30 hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-400 to-purple-600">
              <Target className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="bg-gradient-to-r from-neutral-900 to-neutral-700 bg-clip-text text-transparent">
              Bounty Distribution
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-sm text-neutral-500">No bounty data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group relative overflow-hidden border-neutral-200/50 backdrop-blur-sm bg-gradient-to-br from-blue-50/30 via-purple-50/30 to-pink-50/30 hover:shadow-xl transition-all duration-300">
      {/* Animated glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardHeader className="relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-400 to-purple-600 transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
            <Target className="h-4 w-4 text-white drop-shadow-lg" />
          </div>
          <CardTitle className="bg-gradient-to-r from-neutral-900 to-neutral-700 bg-clip-text text-transparent">
            Bounty Distribution
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={90}
              innerRadius={50}
              fill="#8884d8"
              dataKey="value"
              strokeWidth={2}
              stroke="#fff"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} className="drop-shadow-lg" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid rgba(0, 0, 0, 0.1)",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
