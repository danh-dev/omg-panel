"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Bar,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { format, parseISO, subDays } from "date-fns";
import { vi } from "date-fns/locale";
import { DashboardStats } from "@/lib/googleSheetsService";

export function DateBarChart() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/stats");

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Lỗi không xác định");
        }

        setStats(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi không xác định");
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Format date for the chart
  const formatData = (data: { date: string; count: number }[]) => {
    return data.map((item) => ({
      ...item,
      formattedDate: format(parseISO(item.date), "dd/MM/yyyy"),
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Số lượng người chơi theo ngày</CardTitle>
          <CardDescription>Phân bố người chơi theo thời gian</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="w-full h-48 bg-gray-200 animate-pulse rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Số lượng người chơi theo ngày</CardTitle>
          <CardDescription>Lỗi: {error}</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center text-red-500">
          Không thể tải dữ liệu biểu đồ
        </CardContent>
      </Card>
    );
  }

  const chartData = stats ? formatData(stats.playersByDate) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Số lượng người chơi theo ngày</CardTitle>
        <CardDescription>Phân bố người chơi theo thời gian</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="formattedDate"
                tickFormatter={(date) => date}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis allowDecimals={false} />
              <Tooltip
                formatter={(value) => [`${value} người`, "Số lượng"]}
                labelFormatter={(label) => `Ngày: ${label}`}
              />
              <Bar
                dataKey="count"
                name="Số người chơi"
                fill="#8884d8"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            Chưa có dữ liệu người chơi
          </div>
        )}
      </CardContent>
    </Card>
  );
}
