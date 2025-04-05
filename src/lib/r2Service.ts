import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

// Cấu hình S3 Client cho Cloudflare R2
const R2_ENDPOINT = `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
// Sử dụng CDN URL thay vì R2 trực tiếp
const PUBLIC_URL = "https://cdn.dainam.ph";

const s3Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "",
  },
});

export type UploadedFile = {
  key: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
};

/**
 * Upload a file to Cloudflare R2
 */
export async function uploadFileToR2(
  file: Buffer,
  mimeType: string,
  originalFilename: string,
  folderPrefix: string = "backgrounds/"
): Promise<UploadedFile> {
  try {
    // Tạo key duy nhất bằng UUID và giữ phần mở rộng của file
    const extension = originalFilename.split(".").pop() || "";
    const uniqueFilename = `${uuidv4()}${extension ? `.${extension}` : ""}`;

    // Tạo key theo cấu trúc thư mục
    const key = `${folderPrefix}${uniqueFilename}`;

    // Upload file lên R2
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: mimeType,
        Metadata: {
          originalFilename,
        },
      })
    );

    // Tạo URL công khai
    const url = `${PUBLIC_URL}/${key}`;

    // Trả về thông tin file đã upload
    return {
      key,
      url,
      filename: originalFilename,
      mimeType,
      size: file.length,
      uploadedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error uploading file to R2:", error);
    throw error;
  }
}

/**
 * Tạo URL presigned để upload trực tiếp file từ client
 */
export async function generatePresignedUploadUrl(
  filename: string,
  mimeType: string,
  folderPrefix: string = "backgrounds/"
): Promise<{ url: string; key: string }> {
  try {
    // Tạo key duy nhất
    const extension = filename.split(".").pop() || "";
    const uniqueFilename = `${uuidv4()}${extension ? `.${extension}` : ""}`;
    const key = `${folderPrefix}${uniqueFilename}`;

    // Tạo URL presigned
    const command = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
      ContentType: mimeType,
      Metadata: {
        originalFilename: filename,
      },
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 0 });

    return { url, key };
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw error;
  }
}

/**
 * Lấy danh sách tất cả file media (hình ảnh và video)
 */
export async function listBackgroundImages(): Promise<UploadedFile[]> {
  try {
    // Lấy danh sách hình ảnh
    const imageResult = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        Prefix: "backgrounds/",
      })
    );

    // Lấy danh sách video intro
    const videoIntroResult = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        Prefix: "videos/intro/",
      })
    );

    // Lấy danh sách video win
    const videoWinResult = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        Prefix: "videos/win/",
      })
    );

    // Lấy danh sách video khác
    const videoOtherResult = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        Prefix: "videos/other/",
      })
    );

    // Kết hợp danh sách
    const allContents = [
      ...(imageResult.Contents || []),
      ...(videoIntroResult.Contents || []),
      ...(videoWinResult.Contents || []),
      ...(videoOtherResult.Contents || []),
    ];

    if (!allContents.length) {
      return [];
    }

    return allContents.map((item) => {
      const key = item.Key || "";
      const filename = key.split("/").pop() || "";

      // Xác định mime type dựa trên extension
      let mimeType = "application/octet-stream";
      const extension = filename.split(".").pop()?.toLowerCase();

      if (extension) {
        if (["jpg", "jpeg"].includes(extension)) mimeType = "image/jpeg";
        else if (extension === "png") mimeType = "image/png";
        else if (extension === "gif") mimeType = "image/gif";
        else if (extension === "webp") mimeType = "image/webp";
        else if (extension === "mp4") mimeType = "video/mp4";
        else if (extension === "webm") mimeType = "video/webm";
        else if (extension === "ogg") mimeType = "video/ogg";
      }

      return {
        key,
        url: `${PUBLIC_URL}/${key}`,
        filename,
        mimeType,
        size: item.Size || 0,
        uploadedAt:
          item.LastModified?.toISOString() || new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error("Error listing media files:", error);
    throw error;
  }
}

/**
 * Xóa một file từ R2
 */
export async function deleteFileFromR2(key: string): Promise<boolean> {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        Key: key,
      })
    );

    return true;
  } catch (error) {
    console.error("Error deleting file from R2:", error);
    throw error;
  }
}
