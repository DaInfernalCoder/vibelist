"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Sample data for charts
const weeklyData = [
  { name: "Mon", signups: 20, completions: 15 },
  { name: "Tue", signups: 35, completions: 28 },
  { name: "Wed", signups: 40, completions: 30 },
  { name: "Thu", signups: 25, completions: 20 },
  { name: "Fri", signups: 45, completions: 40 },
  { name: "Sat", signups: 30, completions: 25 },
  { name: "Sun", signups: 15, completions: 12 },
];

const monthlyData = [
  { name: "Jan", signups: 200, completions: 160 },
  { name: "Feb", signups: 300, completions: 240 },
  { name: "Mar", signups: 400, completions: 320 },
  { name: "Apr", signups: 500, completions: 400 },
  { name: "May", signups: 600, completions: 480 },
  { name: "Jun", signups: 700, completions: 560 },
];

const referralData = [
  { name: "Direct", value: 400 },
  { name: "Social", value: 300 },
  { name: "Email", value: 200 },
  { name: "Organic", value: 100 },
];

const conversionData = [
  { name: "Visit", value: 1000 },
  { name: "Signup Start", value: 500 },
  { name: "Submission", value: 300 },
  { name: "Verification", value: 200 },
];

export default function AnalyticsPage() {
  const [waitlist, setWaitlist] = useState("all");
  const [timeRange, setTimeRange] = useState("weekly");

  // Choose data based on selected time range
  const chartData = timeRange === "weekly" ? weeklyData : monthlyData;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Track and analyze your waitlist performance
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Tabs
            value={timeRange}
            onValueChange={setTimeRange}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Signups"
          value="1,248"
          change="+12.5%"
          trend="increase"
        />
        <MetricCard
          title="Conversion Rate"
          value="68.4%"
          change="+3.2%"
          trend="increase"
        />
        <MetricCard
          title="Avg. Time on Waitlist"
          value="14.2 days"
          change="-1.5 days"
          trend="decrease"
        />
        <MetricCard
          title="Waitlist Size"
          value="943"
          change="+22"
          trend="increase"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Signups & Completions</CardTitle>
            <CardDescription>
              Track signups and completed registrations over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="signups"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                    name="Signups"
                  />
                  <Line
                    type="monotone"
                    dataKey="completions"
                    stroke="#82ca9d"
                    name="Completions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Referral Sources</CardTitle>
            <CardDescription>
              See where your waitlist signups are coming from
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={referralData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" name="Signups" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>
            Track user journey through the waitlist process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={conversionData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#82ca9d" name="Users" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, change, trend }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p
          className={`mt-2 flex items-center text-sm ${
            trend === "increase" ? "text-green-600" : "text-red-600"
          }`}
        >
          {trend === "increase" ? "↑" : "↓"} {change}
        </p>
      </CardContent>
    </Card>
  );
}
