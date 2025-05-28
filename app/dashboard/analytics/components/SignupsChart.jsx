"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const SignupsChart = ({ data, isLoading = false }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Format data for the chart
  const chartData =
    data?.map((item) => ({
      name: new Date(item.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      signups: item.signups,
      day: item.day,
    })) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Signups</CardTitle>
        <CardDescription>Signup trends over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    const dataPoint = payload[0].payload;
                    return `${dataPoint.day}, ${label}`;
                  }
                  return label;
                }}
                formatter={(value) => [value, "Signups"]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="signups"
                stroke="#3b82f6"
                strokeWidth={2}
                activeDot={{ r: 6 }}
                name="Daily Signups"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignupsChart;
