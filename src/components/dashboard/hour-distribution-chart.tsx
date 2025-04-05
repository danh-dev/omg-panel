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
import { DashboardStats } from "@/lib/googleSheetsService";

export function HourDistributionChart() {
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

  // Format hours for better display
  const formatData = (data: { hour: string; count: number }[]) => {
    return data.map((item) => ({
      ...item,
      formattedHour: `${item.hour}:00`,
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Phân bố theo giờ</CardTitle>
          <CardDescription>
            Thống kê người chơi theo giờ trong ngày
          </CardDescription>
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
          <CardTitle>Phân bố theo giờ</CardTitle>
          <CardDescription>Lỗi: {error}</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center text-red-500">
          Không thể tải dữ liệu biểu đồ
        </CardContent>
      </Card>
    );
  }

  const chartData = stats ? formatData(stats.playersByHour) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phân bố theo giờ</CardTitle>
        <CardDescription>
          Thống kê người chơi theo giờ trong ngày
        </CardDescription>
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
                dataKey="formattedHour"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis allowDecimals={false} />
              <Tooltip
                formatter={(value) => [`${value} người`, "Số lượng"]}
                labelFormatter={(label) => `Thời gian: ${label}`}
              />
              <Bar
                dataKey="count"
                name="Số người chơi"
                fill="#82ca9d"
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
