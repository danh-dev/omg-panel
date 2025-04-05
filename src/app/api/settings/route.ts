import { NextRequest, NextResponse } from "next/server";
import { getGameSettings, updateGameSettings } from "@/lib/settingsService";

// GET endpoint to fetch all settings
export async function GET(request: NextRequest) {
  try {
    // Fetch settings from Google Sheets
    const settings = await getGameSettings();

    // Cache for 10 minutes

    return NextResponse.json({
      success: true,
      data: settings,
      fromCache: false,
    });
  } catch (error) {
    console.error("Error fetching game settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Lỗi không xác định",
      },
      { status: 500 }
    );
  }
}

// POST endpoint to update settings
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: "Body must be a valid JSON object",
        },
        { status: 400 }
      );
    }

    // Update settings in Google Sheets
    const updatedSettings = await updateGameSettings(body);

    return NextResponse.json({
      success: true,
      data: updatedSettings,
    });
  } catch (error) {
    console.error("Error updating game settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Lỗi không xác định",
      },
      { status: 500 }
    );
  }
}
