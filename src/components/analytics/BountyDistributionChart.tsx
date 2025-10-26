"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface BountyDistributionChartProps {
  data: {
    open: number;
    assigned: number;
    completed: number;
  };
}

const COLORS = {
  open: "#3b82f6",
  assigned: "#f59e0b",
  completed: "#10b981",
};

export function BountyDistributionChart({ data }: BountyDistributionChartProps) {
  const chartData = [
    { name: "Open", value: data.open, color: COLORS.open },
    { name: "Assigned", value: data.assigned, color: COLORS.assigned },
    { name: "Completed", value: data.completed, color: COLORS.completed },
  ].filter((item) => item.value > 0);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bounty Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-sm text-neutral-500">No bounty data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bounty Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
