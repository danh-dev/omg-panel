import { NextRequest, NextResponse } from "next/server";
import { getAllPlayerData } from "@/lib/googleSheetsService";

export async function GET(request: NextRequest) {
  try {
    // Kiểm tra query param refresh để bỏ qua cache nếu cần
    const refresh = request.nextUrl.searchParams.get("refresh") === "true";
    const cacheKey = "hourly-by-date-stats";

    // Lấy tất cả dữ liệu người chơi
    const allPlayers = await getAllPlayerData();

    // Nhóm người chơi theo ngày và giờ
    const hourlyByDateMap = new Map<string, Map<string, number>>();

    allPlayers.forEach((player) => {
      if (!player.Timestamp) return;

      try {
        const date = new Date(player.Timestamp);
        if (isNaN(date.getTime())) return; // Skip invalid dates

        // Format ngày và giờ
        const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD
        const hour = date.getHours().toString().padStart(2, "0");

        // Khởi tạo map cho ngày nếu chưa có
        if (!hourlyByDateMap.has(dateString)) {
          const hourMap = new Map<string, number>();
          // Khởi tạo tất cả giờ là 0
          for (let i = 0; i < 24; i++) {
            hourMap.set(i.toString().padStart(2, "0"), 0);
          }
          hourlyByDateMap.set(dateString, hourMap);
        }

        // Lấy map giờ của ngày hiện tại
        const hourMap = hourlyByDateMap.get(dateString)!;

        // Tăng số người chơi trong giờ đó
        hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
      } catch (e) {
        // Skip invalid dates
      }
    });

    // Chuyển đổi thành mảng để response
    const result = {
      // Danh sách các ngày có dữ liệu
      dates: Array.from(hourlyByDateMap.keys()).sort(),
      // Dữ liệu giờ theo từng ngày
      hourlyData: Array.from(hourlyByDateMap.entries())
        .map(([date, hourMap]) => ({
          date,
          hours: Array.from(hourMap.entries())
            .map(([hour, count]) => ({
              hour,
              count,
            }))
            .sort((a, b) => a.hour.localeCompare(b.hour)),
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };

    return NextResponse.json({
      success: true,
      data: result,
      fromCache: false,
    });
  } catch (error) {
    console.error("Error fetching hourly stats by date:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Lỗi không xác định",
      },
      { status: 500 }
    );
  }
}
