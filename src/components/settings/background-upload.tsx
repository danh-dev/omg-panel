"use client";

import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  UploadCloud,
  Loader2,
  Trash2,
  Image as ImageIcon,
  Check,
  X,
} from "lucide-react";
import { UploadedFile } from "@/lib/r2Service";
import { toast } from "sonner";

export function BackgroundUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [backgrounds, setBackgrounds] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tải danh sách backgrounds
  useEffect(() => {
    fetchBackgrounds();
  }, []);

  const fetchBackgrounds = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/upload");

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Lỗi không xác định");
      }

      setBackgrounds(data.data);
    } catch (error) {
      console.error("Error fetching backgrounds:", error);
      toast.error("Không thể tải danh sách hình nền", {
        description:
          error instanceof Error ? error.message : "Lỗi không xác định",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý khi click nút upload
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Xử lý khi chọn file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  // Xử lý kéo thả file
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  // Xử lý upload file
  const uploadFile = async (file: File) => {
    // Kiểm tra loại file
    if (!file.type.startsWith("image/")) {
      toast.error("Loại file không hợp lệ", {
        description: "Chỉ chấp nhận file hình ảnh",
      });
      return;
    }

    // Kiểm tra kích thước file (20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File quá lớn", {
        description: "Kích thước file tối đa là 20MB",
      });
      return;
    }

    try {
      setIsUploading(true);

      // Tạo FormData
      const formData = new FormData();
      formData.append("file", file);

      // Gửi request
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Lỗi upload");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Lỗi không xác định");
      }

      // Cập nhật danh sách
      setBackgrounds((prev) => [result.data, ...prev]);

      toast.success("Upload thành công", {
        description: "Hình nền đã được tải lên thành công",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Lỗi upload", {
        description:
          error instanceof Error ? error.message : "Lỗi không xác định",
      });
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Xử lý xóa file
  const handleDelete = async (key: string) => {
    try {
      const response = await fetch("/api/upload", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Lỗi xóa file");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Lỗi không xác định");
      }

      // Cập nhật danh sách
      setBackgrounds((prev) => prev.filter((bg) => bg.key !== key));

      // Nếu đang chọn ảnh này, bỏ chọn
      if (selectedImage === key) {
        setSelectedImage(null);
      }

      toast.success("Xóa thành công", {
        description: "Hình nền đã được xóa thành công",
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Lỗi xóa file", {
        description:
          error instanceof Error ? error.message : "Lỗi không xác định",
      });
    }
  };

  // Xử lý chọn ảnh
  const handleSelectImage = (key: string, url: string) => {
    setSelectedImage(key);

    // Lưu vào localStorage hoặc settings
    localStorage.setItem("selectedBackground", url);

    toast.success("Đã chọn hình nền", {
      description: "Hình nền sẽ được sử dụng cho game",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quản lý hình nền</CardTitle>
        <CardDescription>
          Upload và quản lý hình nền cho trò chơi DNA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            isDragging ? "border-primary bg-primary/10" : "border-gray-300"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <UploadCloud className="h-10 w-10 text-gray-400" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                Kéo thả hình ảnh vào đây
              </h3>
              <p className="text-sm text-muted-foreground">
                Hoặc click để chọn file từ thiết bị của bạn
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={handleUploadClick}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tải lên...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Chọn file
                </>
              )}
            </Button>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WebP hoặc GIF. Tối đa 20MB.
            </p>
          </div>
        </div>

        {/* Image gallery */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Danh sách hình nền</h3>

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : backgrounds.length === 0 ? (
            <div className="text-center py-8 border rounded-lg">
              <ImageIcon className="w-10 h-10 mx-auto text-gray-400 mb-2" />
              <p className="text-muted-foreground">
                Chưa có hình nền nào được tải lên
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {backgrounds.map((background) => (
                <div
                  key={background.key}
                  className={`relative rounded-lg overflow-hidden border group hover:shadow-md transition-all ${
                    selectedImage === background.key
                      ? "ring-2 ring-primary"
                      : ""
                  }`}
                >
                  <img
                    src={background.url}
                    alt={background.filename}
                    className="w-full h-32 object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {selectedImage === background.key ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-white border-white"
                        onClick={() => setSelectedImage(null)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Bỏ chọn
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-white border-white"
                        onClick={() =>
                          handleSelectImage(background.key, background.url)
                        }
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Chọn
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(background.key)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {selectedImage === background.key && (
                    <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="p-2 text-xs truncate">
                    {background.filename}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Lưu ý: Hình nền sẽ được áp dụng vào game khi bạn chọn và lưu cài đặt.
        </p>
      </CardFooter>
    </Card>
  );
}
