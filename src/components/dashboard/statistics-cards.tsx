"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Trophy, BarChart, Clock } from "lucide-react";
import { DashboardStats } from "@/lib/googleSheetsService";

export function StatisticsCards() {
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

  if (loading) {
    return <StatisticsCardsLoading />;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!stats) {
    return <div>Không có dữ liệu thống kê</div>;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Tổng người chơi</CardTitle>
          <Users className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalPlayers}</div>
          <p className="text-xs text-muted-foreground">
            Tổng số người tham gia trò chơi
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Tỷ lệ thắng</CardTitle>
          <Trophy className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            Phần trăm người chơi đạt kết quả thắng
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">
            Trung bình số lần thử
          </CardTitle>
          <BarChart className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.averageAttempts.toFixed(1)}
          </div>
          <p className="text-xs text-muted-foreground">
            Số lần thử trung bình cho mỗi người chơi
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">
            Phân bố theo giờ
          </CardTitle>
          <Clock className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {getMostActiveHour(stats.playersByHour)}
          </div>
          <p className="text-xs text-muted-foreground">
            Giờ có nhiều người chơi nhất
          </p>
        </CardContent>
      </Card>
    </>
  );
}

// Helper function to get the most active hour
function getMostActiveHour(
  hourData: { hour: string; count: number }[]
): string {
  if (!hourData || hourData.length === 0) return "N/A";

  const mostActive = hourData.reduce(
    (max, current) => (current.count > max.count ? current : max),
    hourData[0]
  );

  return `${mostActive.hour}:00 (${mostActive.count})`;
}

// Loading state component
function StatisticsCardsLoading() {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-4 w-4 bg-gray-200 animate-pulse rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mb-2"></div>
            <div className="h-3 w-32 bg-gray-200 animate-pulse rounded"></div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
