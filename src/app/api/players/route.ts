import { NextRequest, NextResponse } from "next/server";
import { getPaginatedPlayerData } from "@/lib/googleSheetsService";

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    // Validate parameters
    if (isNaN(page) || page < 1 || isNaN(pageSize) || pageSize < 1) {
      return NextResponse.json(
        {
          success: false,
          error: "Tham số page và pageSize phải là số dương",
        },
        { status: 400 }
      );
    }

    // Get paginated data
    const { data, totalItems, totalPages } = await getPaginatedPlayerData(
      page,
      pageSize
    );

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching player data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Lỗi không xác định",
      },
      { status: 500 }
    );
  }
}
