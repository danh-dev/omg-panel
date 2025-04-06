import { NextRequest, NextResponse } from "next/server";
import {
  uploadFileToR2,
  listBackgroundImages,
  deleteFileFromR2,
} from "@/lib/r2Service";

// Kích thước tệp tối đa (20MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Các loại MIME được phép
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/ogg",
];

/**
 * POST endpoint để upload một file
 */
export async function POST(request: NextRequest) {
  try {
    // Nhận formData từ request
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    // Kiểm tra file tồn tại
    if (!file) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy file" },
        { status: 400 }
      );
    }

    // Kiểm tra kích thước file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `Kích thước file vượt quá giới hạn ${
            MAX_FILE_SIZE / (1024 * 1024)
          }MB`,
        },
        { status: 400 }
      );
    }

    // Kiểm tra loại file
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Loại file không được hỗ trợ" },
        { status: 400 }
      );
    }

    // Chuyển File thành Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Xác định thư mục lưu trữ dựa vào loại file
    let folderPrefix = "";

    // Lấy purpose từ formData (nếu có)
    const purpose = (formData.get("purpose") as string) || "background";

    if (file.type.startsWith("image/")) {
      folderPrefix = "backgrounds/";
    } else if (file.type.startsWith("video/")) {
      // Phân loại video theo mục đích sử dụng
      if (purpose === "intro") {
        folderPrefix = "videos/intro/";
      } else if (purpose === "win") {
        folderPrefix = "videos/win/";
      } else {
        folderPrefix = "videos/other/";
      }
    }

    // Upload lên R2
    const uploadedFile = await uploadFileToR2(
      buffer,
      file.type,
      file.name,
      folderPrefix
    );

    return NextResponse.json({
      success: true,
      data: uploadedFile,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Lỗi không xác định",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint để lấy danh sách các media đã upload
 */
export async function GET() {
  try {
    const media = await listBackgroundImages();

    return NextResponse.json({
      success: true,
      data: media,
    });
  } catch (error) {
    console.error("Error listing media:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Lỗi không xác định",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE endpoint để xóa một file
 */
export async function DELETE(request: NextRequest) {
  try {
    const { key } = await request.json();

    if (!key) {
      return NextResponse.json(
        { success: false, error: "Thiếu key file cần xóa" },
        { status: 400 }
      );
    }

    await deleteFileFromR2(key);

    return NextResponse.json({
      success: true,
      message: "Xóa file thành công",
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Lỗi không xác định",
      },
      { status: 500 }
    );
  }
}
