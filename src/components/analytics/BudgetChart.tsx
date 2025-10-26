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
    },
    {
      name: "Available",
      amount: parseInt(data.available),
    },
    {
      name: "Reserved",
      amount: parseInt(data.reserved),
    },
    {
      name: "Paid",
      amount: parseInt(data.paid),
    },
    {
      name: "Allocated",
      amount: parseInt(data.allocated),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value: number) => `${value.toLocaleString()} sats`} />
            <Legend />
            <Bar dataKey="amount" fill="#3b82f6" name="Amount (sats)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
