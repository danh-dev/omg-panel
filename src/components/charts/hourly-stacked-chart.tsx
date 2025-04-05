"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Bar,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";

// Định nghĩa kiểu dữ liệu cho API response
interface HourlyByDateResponse {
  dates: string[];
  hourlyData: {
    date: string;
    hours: {
      hour: string;
      count: number;
    }[];
  }[];
}

// Định nghĩa kiểu dữ liệu cho stacked chart
interface StackedHourlyData {
  hour: string;
  [key: string]: string | number; // Các ngày sẽ là các key động
}

export function HourlyStackedChart() {
  const [data, setData] = useState<HourlyByDateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/stats/hourly");

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Lỗi không xác định");
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi không xác định");
        console.error("Error fetching hourly by date stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Xử lý dữ liệu cho stacked bar chart
  const chartData = useMemo(() => {
    if (!data) return [];

    // Lấy 5 ngày gần nhất để chart không quá rối
    const recentDates = [...data.dates].sort().slice(-5);

    // Tạo map để nhóm dữ liệu theo giờ và ngày
    const hourlyMap: Record<string, Record<string, number>> = {};

    // Khởi tạo giờ từ 0-23
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, "0");
      hourlyMap[hour] = {};

      // Khởi tạo giá trị 0 cho tất cả các ngày
      recentDates.forEach((date) => {
        const formattedDate = format(parseISO(date), "dd/MM");
        hourlyMap[hour][formattedDate] = 0;
      });
    }

    // Điền dữ liệu vào map
    data.hourlyData
      .filter((item) => recentDates.includes(item.date))
      .forEach((item) => {
        const formattedDate = format(parseISO(item.date), "dd/MM");

        item.hours.forEach((hourData) => {
          hourlyMap[hourData.hour][formattedDate] = hourData.count;
        });
      });

    // Chuyển đổi dữ liệu để phù hợp với format của recharts
    const result: StackedHourlyData[] = Object.keys(hourlyMap).map((hour) => {
      const hourData: StackedHourlyData = {
        hour: `${hour}:00`,
      };

      // Thêm dữ liệu của mỗi ngày
      recentDates.forEach((date) => {
        const formattedDate = format(parseISO(date), "dd/MM");
        hourData[formattedDate] = hourlyMap[hour][formattedDate] || 0;
      });

      return hourData;
    });

    // Sắp xếp theo giờ
    return result.sort((a, b) => {
      const hourA = parseInt(a.hour.split(":")[0]);
      const hourB = parseInt(b.hour.split(":")[0]);
      return hourA - hourB;
    });
  }, [data]);

  // Lấy danh sách các ngày để tạo các thanh trong stacked bar
  const days = useMemo(() => {
    if (!chartData.length) return [];

    // Lấy tất cả các key ngoại trừ 'hour'
    return Object.keys(chartData[0]).filter((key) => key !== "hour");
  }, [chartData]);

  // Danh sách màu cho các bar
  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe"];

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center text-red-500">
        <p>Không thể tải dữ liệu biểu đồ</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
        Chưa có dữ liệu người chơi
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 40,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="hour"
            angle={-45}
            textAnchor="end"
            height={60}
            label={{
              value: "Giờ trong ngày",
              position: "insideBottom",
              offset: -10,
            }}
          />
          <YAxis
            allowDecimals={false}
            label={{
              value: "Số người chơi",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip
            formatter={(value, name) => [`${value} người`, `Ngày ${name}`]}
            labelFormatter={(label) => `Thời gian: ${label}`}
          />
          <Legend verticalAlign="top" height={36} />
          {days.map((day, index) => (
            <Bar
              key={day}
              dataKey={day}
              name={`Ngày ${day}`}
              stackId="a"
              fill={colors[index % colors.length]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
