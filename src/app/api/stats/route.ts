import { NextRequest, NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/googleSheetsService";

export async function GET(request: NextRequest) {
  try {
    const stats = await getDashboardStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Lỗi không xác định",
      },
      { status: 500 }
    );
  }
}
