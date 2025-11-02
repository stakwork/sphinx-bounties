"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Wallet } from "lucide-react";

interface BudgetChartProps {
  data: {
    total: string;
    available: string;
    reserved: string;
    paid: string;
    allocated: string;
  };
}

export function BudgetChart({ data }: BudgetChartProps) {
  const chartData = [
    {
      name: "Total",
      amount: parseInt(data.total),
      fill: "url(#gradientTotal)",
    },
    {
      name: "Available",
      amount: parseInt(data.available),
      fill: "url(#gradientAvailable)",
    },
    {
      name: "Reserved",
      amount: parseInt(data.reserved),
      fill: "url(#gradientReserved)",
    },
    {
      name: "Paid",
      amount: parseInt(data.paid),
      fill: "url(#gradientPaid)",
    },
    {
      name: "Allocated",
      amount: parseInt(data.allocated),
      fill: "url(#gradientAllocated)",
    },
  ];

  return (
    <Card className="group relative overflow-hidden border-neutral-200/50 backdrop-blur-sm bg-gradient-to-br from-emerald-50/30 via-teal-50/30 to-cyan-50/30 hover:shadow-xl transition-all duration-300">
      {/* Animated glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardHeader className="relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
            <Wallet className="h-4 w-4 text-white drop-shadow-lg" />
          </div>
          <CardTitle className="bg-gradient-to-r from-neutral-900 to-neutral-700 bg-clip-text text-transparent">
            Budget Overview
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <defs>
              <linearGradient id="gradientTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="gradientAvailable" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="gradientReserved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="gradientPaid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="gradientAllocated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ec4899" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#d946ef" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              axisLine={{ stroke: "rgba(0,0,0,0.1)" }}
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 12 }}
              axisLine={{ stroke: "rgba(0,0,0,0.1)" }}
            />
            <Tooltip
              formatter={(value: number) => `${value.toLocaleString()} sats`}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid rgba(0, 0, 0, 0.1)",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            <Bar
              dataKey="amount"
              name="Amount (sats)"
              radius={[8, 8, 0, 0]}
              fill="url(#gradient)"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
