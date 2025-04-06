import { NextRequest, NextResponse } from "next/server";
import { getGameSettings } from "@/lib/settingsService";

/**
 * Endpoint để xuất cài đặt theo định dạng chuẩn cho ứng dụng game
 * Format này phù hợp với công thức cấu hình mà game sử dụng
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch settings from Google Sheets
    const settings = await getGameSettings();

    // Format settings as expected by the game
    const formattedSettings = {
      numPairs: settings.numPairs,
      helixRadius: settings.helixRadius,
      radiusX: settings.radiusX,
      radiusY: settings.radiusY,
      helixHeight: settings.helixHeight,
      backboneWidth: settings.backboneWidth,
      twists: settings.twists,
      whitelistedPairs: settings.whitelistedPairs,
      gameTime: settings.gameTime,
      blinkCount: settings.blinkCount,
      blinkInterval: settings.blinkInterval,
      targetPairCount: settings.targetPairCount,
      maxSelections: settings.maxSelections,
      maxAttempts: settings.maxAttempts,
      winScreenTimer: settings.winScreenTimer,
      defaultCameraPosition: settings.defaultCameraPosition,
      rotationSpeed: settings.rotationSpeed,
      spin: settings.spin,
      spinSpeed: settings.spinSpeed,
      winTimeout: settings.winTimeout,
      lostTimeout: settings.lostTimeout,
      matchRatioThreshold: settings.matchRatioThreshold,
      backgroundImage: settings.backgroundImage,
      introVideo: settings.introVideo,
      winVideo: settings.winVideo,
      textureImage: settings.textureImage,
    };

    // Return with CORS headers to allow fetching from game domain
    return NextResponse.json(formattedSettings, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "max-age=300, s-maxage=300",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error exporting game settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Lỗi không xác định",
      },
      { status: 500 }
    );
  }
}
