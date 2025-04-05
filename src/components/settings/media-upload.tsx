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
  Video,
  FileVideo,
} from "lucide-react";
import { UploadedFile } from "@/lib/r2Service";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DNAGameSettings } from "@/lib/settingsService";

type MediaType = "image" | "video";
type MediaPurpose = "background" | "intro" | "win";

interface MediaUploadProps {
  settings: DNAGameSettings;
  onMediaSelect: (purpose: MediaPurpose, url: string) => void;
}

export function MediaUpload({ settings, onMediaSelect }: MediaUploadProps) {
  const [activeTab, setActiveTab] = useState<MediaType>("image");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [media, setMedia] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<{
    background?: string;
    intro?: string;
    win?: string;
  }>({
    background: settings.backgroundImage || undefined,
    intro: settings.introVideo || undefined,
    win: settings.winVideo || undefined,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tải danh sách media
  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
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

      setMedia(data.data);
    } catch (error) {
      console.error("Error fetching media:", error);
      toast.error("Không thể tải danh sách media", {
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
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    purpose?: "background" | "intro" | "win"
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0], purpose);
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
  const uploadFile = async (
    file: File,
    mediaPurpose?: "background" | "intro" | "win"
  ) => {
    // Kiểm tra loại file dựa vào tab đang active
    if (activeTab === "image" && !file.type.startsWith("image/")) {
      toast.error("Loại file không hợp lệ", {
        description: "Chỉ chấp nhận file hình ảnh",
      });
      return;
    } else if (activeTab === "video" && !file.type.startsWith("video/")) {
      toast.error("Loại file không hợp lệ", {
        description: "Chỉ chấp nhận file video",
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

    // Xác định mục đích sử dụng
    const purpose =
      mediaPurpose || (activeTab === "image" ? "background" : "intro");

    try {
      setIsUploading(true);

      // Tạo FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("purpose", purpose);

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
      setMedia((prev) => [result.data, ...prev]);

      toast.success("Upload thành công", {
        description: `File ${
          activeTab === "image" ? "hình ảnh" : "video"
        } đã được tải lên thành công`,
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
      setMedia((prev) => prev.filter((item) => item.key !== key));

      // Cập nhật lại selected nếu đang chọn file này
      if (selectedMedia.background === key) {
        setSelectedMedia((prev) => ({ ...prev, background: undefined }));
        onMediaSelect("background", "");
      }
      if (selectedMedia.intro === key) {
        setSelectedMedia((prev) => ({ ...prev, intro: undefined }));
        onMediaSelect("intro", "");
      }
      if (selectedMedia.win === key) {
        setSelectedMedia((prev) => ({ ...prev, win: undefined }));
        onMediaSelect("win", "");
      }

      toast.success("Xóa thành công", {
        description: "File đã được xóa thành công",
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Lỗi xóa file", {
        description:
          error instanceof Error ? error.message : "Lỗi không xác định",
      });
    }
  };

  // Xử lý chọn media
  const handleSelectMedia = (
    key: string,
    url: string,
    purpose: MediaPurpose
  ) => {
    setSelectedMedia((prev) => ({
      ...prev,
      [purpose]: key,
    }));

    // Gọi callback để cập nhật settings
    onMediaSelect(purpose, url);

    toast.success(`Đã chọn ${getPurposeLabel(purpose)}`, {
      description: `${getPurposeLabel(purpose)} sẽ được sử dụng cho game`,
    });
  };

  // Helper function to get user-friendly purpose label
  const getPurposeLabel = (purpose: MediaPurpose): string => {
    switch (purpose) {
      case "background":
        return "hình nền";
      case "intro":
        return "video giới thiệu";
      case "win":
        return "video chiến thắng";
      default:
        return purpose;
    }
  };

  // Filter media based on active tab
  const filteredMedia = media.filter((item) => {
    if (activeTab === "image") {
      return item.mimeType.startsWith("image/");
    } else {
      return item.mimeType.startsWith("video/");
    }
  });

  return (
    <Card>
      <CardHeader>
        <Tabs
          defaultValue="image"
          onValueChange={(value) => setActiveTab(value as MediaType)}
        >
          <div className="flex justify-between items-center">
            <CardTitle>Quản lý Media</CardTitle>
            <TabsList>
              <TabsTrigger value="image">Hình nền</TabsTrigger>
              <TabsTrigger value="video">Video</TabsTrigger>
            </TabsList>
          </div>
          <CardDescription>
            {activeTab === "image"
              ? "Upload và quản lý hình nền cho trò chơi DNA"
              : "Upload và quản lý video giới thiệu và video chiến thắng"}
          </CardDescription>
        </Tabs>
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
                Kéo thả {activeTab === "image" ? "hình ảnh" : "video"} vào đây
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
              accept={activeTab === "image" ? "image/*" : "video/*"}
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <p className="text-xs text-muted-foreground">
              {activeTab === "image"
                ? "JPG, PNG, WebP hoặc GIF. Tối đa 20MB."
                : "MP4, WebM, OGG. Tối đa 20MB."}
            </p>
          </div>
        </div>

        {/* Media gallery */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Danh sách {activeTab === "image" ? "hình nền" : "video"}
          </h3>

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="text-center py-8 border rounded-lg">
              {activeTab === "image" ? (
                <ImageIcon className="w-10 h-10 mx-auto text-gray-400 mb-2" />
              ) : (
                <FileVideo className="w-10 h-10 mx-auto text-gray-400 mb-2" />
              )}
              <p className="text-muted-foreground">
                Chưa có {activeTab === "image" ? "hình nền" : "video"} nào được
                tải lên
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredMedia.map((item) => (
                <div
                  key={item.key}
                  className={`relative rounded-lg overflow-hidden border group hover:shadow-md transition-all`}
                >
                  {activeTab === "image" ? (
                    <img
                      src={item.url}
                      alt={item.filename}
                      className="w-full h-32 object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                      <video
                        src={item.url}
                        className="w-full h-full object-cover"
                        controls
                      />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    {activeTab === "image" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-white border-white w-full"
                        onClick={() =>
                          handleSelectMedia(item.key, item.url, "background")
                        }
                      >
                        {selectedMedia.background === item.key ? (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Đã chọn làm hình nền
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Chọn làm hình nền
                          </>
                        )}
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-white border-white w-full"
                          onClick={() =>
                            handleSelectMedia(item.key, item.url, "intro")
                          }
                        >
                          {selectedMedia.intro === item.key ? (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              Đã chọn làm video giới thiệu
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              Chọn làm video giới thiệu
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-white border-white w-full"
                          onClick={() =>
                            handleSelectMedia(item.key, item.url, "win")
                          }
                        >
                          {selectedMedia.win === item.key ? (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              Đã chọn làm video chiến thắng
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              Chọn làm video chiến thắng
                            </>
                          )}
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleDelete(item.key)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Xóa
                    </Button>
                  </div>

                  {/* Indicators for selected media */}
                  {selectedMedia.background === item.key && (
                    <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {selectedMedia.intro === item.key && (
                    <div className="absolute top-2 right-2 bg-purple-500 rounded-full p-1">
                      <Video className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {selectedMedia.win === item.key && (
                    <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                      <Video className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* Indicators for media type based on folder path */}
                  {!selectedMedia.intro &&
                    !selectedMedia.win &&
                    item.key.includes("videos/intro/") && (
                      <div className="absolute top-2 left-2 bg-purple-500/70 rounded-full p-1">
                        <Video className="w-4 h-4 text-white" />
                      </div>
                    )}
                  {!selectedMedia.intro &&
                    !selectedMedia.win &&
                    item.key.includes("videos/win/") && (
                      <div className="absolute top-2 left-2 bg-green-500/70 rounded-full p-1">
                        <Video className="w-4 h-4 text-white" />
                      </div>
                    )}

                  <div className="p-2 text-xs truncate">{item.filename}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Lưu ý: Các thay đổi sẽ được áp dụng vào game khi bạn lưu cài đặt.
        </p>
      </CardFooter>
    </Card>
  );
}
