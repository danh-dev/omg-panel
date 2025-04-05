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
  Eye,
} from "lucide-react";
import { UploadedFile } from "@/lib/r2Service";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DNAGameSettings } from "@/lib/settingsService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type MediaType = "image" | "video";
type MediaPurpose = "background" | "intro" | "win" | "texture";

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
  const [previewMedia, setPreviewMedia] = useState<UploadedFile | null>(null);
  // Khởi tạo selectedMedia từ settings và theo dõi URL thực tế để hiển thị
  const [selectedMedia, setSelectedMedia] = useState<{
    background?: string;
    intro?: string;
    win?: string;
    texture?: string;
  }>({
    background: settings.backgroundImage || undefined,
    intro: settings.introVideo || undefined,
    win: settings.winVideo || undefined,
    texture: settings.textureImage || undefined,
  });

  // State để lưu các URL hiển thị tương ứng với các keys đã chọn
  const [displayUrls, setDisplayUrls] = useState<{
    background?: string;
    intro?: string;
    win?: string;
    texture?: string;
  }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tải danh sách media và cập nhật displayUrls từ settings
  useEffect(() => {
    fetchMedia();
  }, []);

  // Cập nhật displayUrls mỗi khi media hoặc selectedMedia thay đổi
  useEffect(() => {
    const updatedUrls: typeof displayUrls = {};

    // Tìm URLs tương ứng cho mỗi key đã chọn
    Object.entries(selectedMedia).forEach(([purpose, key]) => {
      if (key) {
        // Tìm item trong danh sách media
        const item = media.find((item) => item.key === key);
        if (item) {
          updatedUrls[purpose as keyof typeof displayUrls] = item.url;
        } else if (key.startsWith("http")) {
          // Nếu key đã là URL (đối với dữ liệu cũ)
          updatedUrls[purpose as keyof typeof displayUrls] = key;
        }
      }
    });

    // Cập nhật displayUrls
    setDisplayUrls(updatedUrls);
  }, [media, selectedMedia]);

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
    purpose?: MediaPurpose
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
  const uploadFile = async (file: File, mediaPurpose?: MediaPurpose) => {
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
  const handleDelete = async (key: string, e: React.MouseEvent) => {
    e.stopPropagation();

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
      if (selectedMedia.texture === key) {
        setSelectedMedia((prev) => ({ ...prev, texture: undefined }));
        onMediaSelect("texture", "");
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
    purpose: MediaPurpose,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    setSelectedMedia((prev) => ({
      ...prev,
      [purpose]: key,
    }));

    // Cập nhật displayUrls với URL tương ứng
    setDisplayUrls((prev) => ({
      ...prev,
      [purpose]: url,
    }));

    // Gọi callback để cập nhật settings
    onMediaSelect(purpose, url);

    toast.success(`Đã chọn ${getPurposeLabel(purpose)}`, {
      description: `${getPurposeLabel(purpose)} sẽ được sử dụng cho game`,
    });
  };

  // Mở dialog preview
  const handlePreview = (item: UploadedFile) => {
    setPreviewMedia(item);
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
      case "texture":
        return "texture";
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

  // Kiểm tra xem URL đã tồn tại trong dữ liệu hiển thị chưa
  const hasSelectedBackground = !!displayUrls.background;
  const hasSelectedTexture = !!displayUrls.texture;
  const hasSelectedIntro = !!displayUrls.intro;
  const hasSelectedWin = !!displayUrls.win;

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
            Danh sách {activeTab === "image" ? "hình ảnh" : "video"}
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
                Chưa có {activeTab === "image" ? "hình ảnh" : "video"} nào được
                tải lên
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredMedia.map((item) => (
                <div
                  key={item.key}
                  className={`relative rounded-md overflow-hidden border group hover:shadow-md transition-all cursor-pointer aspect-square`}
                  onClick={() => handlePreview(item)}
                >
                  {activeTab === "image" ? (
                    <img
                      src={item.url}
                      alt={item.filename}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <video
                        src={item.url}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <FileVideo className="w-10 h-10 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Action buttons overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex flex-col gap-2 p-2">
                      {activeTab === "image" ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className=" border-white text-xs"
                            onClick={(e) =>
                              handleSelectMedia(
                                item.key,
                                item.url,
                                "background",
                                e
                              )
                            }
                          >
                            {selectedMedia.background === item.key ? (
                              <>
                                <Check className="w-3 h-3 mr-1" />
                                Hình nền
                              </>
                            ) : (
                              "Chọn làm hình nền"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className=" border-white text-xs"
                            onClick={(e) =>
                              handleSelectMedia(
                                item.key,
                                item.url,
                                "texture",
                                e
                              )
                            }
                          >
                            {selectedMedia.texture === item.key ? (
                              <>
                                <Check className="w-3 h-3 mr-1" />
                                Texture
                              </>
                            ) : (
                              "Chọn làm texture"
                            )}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className=" border-white text-xs"
                            onClick={(e) =>
                              handleSelectMedia(item.key, item.url, "intro", e)
                            }
                          >
                            {selectedMedia.intro === item.key ? (
                              <>
                                <Check className="w-3 h-3 mr-1" />
                                Video giới thiệu
                              </>
                            ) : (
                              "Chọn video giới thiệu"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className=" border-white text-xs"
                            onClick={(e) =>
                              handleSelectMedia(item.key, item.url, "win", e)
                            }
                          >
                            {selectedMedia.win === item.key ? (
                              <>
                                <Check className="w-3 h-3 mr-1" />
                                Video chiến thắng
                              </>
                            ) : (
                              "Chọn video chiến thắng"
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    className="absolute top-1 right-1 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => handleDelete(item.key, e)}
                    title="Xóa"
                  >
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>

                  {/* Preview button */}
                  <button
                    className="absolute bottom-1 right-1 bg-gray-800 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={() => handlePreview(item)}
                    title="Xem trước"
                  >
                    <Eye className="w-3 h-3 text-white" />
                  </button>

                  {/* Indicators for selected media */}
                  {(selectedMedia.background === item.key ||
                    selectedMedia.texture === item.key ||
                    selectedMedia.intro === item.key ||
                    selectedMedia.win === item.key) && (
                    <div className="absolute top-1 left-1 rounded-full p-1 z-10">
                      {selectedMedia.background === item.key && (
                        <div className="bg-primary rounded-full p-1">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {selectedMedia.texture === item.key && (
                        <div className="bg-orange-500 rounded-full p-1 mt-1">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {selectedMedia.intro === item.key && (
                        <div className="bg-purple-500 rounded-full p-1">
                          <Video className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {selectedMedia.win === item.key && (
                        <div className="bg-green-500 rounded-full p-1">
                          <Video className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-1 text-xs truncate bg-white/80 absolute bottom-0 left-0 right-0">
                    {item.filename.length > 15
                      ? item.filename.substring(0, 12) + "..."
                      : item.filename}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview Dialog */}
        <Dialog
          open={!!previewMedia}
          onOpenChange={() => setPreviewMedia(null)}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Xem trước</DialogTitle>
              <DialogDescription>{previewMedia?.filename}</DialogDescription>
            </DialogHeader>
            <div className="flex justify-center items-center max-h-[70vh] overflow-auto">
              {previewMedia?.mimeType.startsWith("image/") ? (
                <img
                  src={previewMedia.url}
                  alt={previewMedia.filename}
                  className="max-w-full max-h-[60vh] object-contain"
                />
              ) : (
                <video
                  src={previewMedia?.url}
                  controls
                  className="max-w-full max-h-[60vh]"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Selected Media Display */}
        {activeTab === "image" && (
          <div className="space-y-4 mt-6 border-t pt-4">
            <h3 className="text-lg font-semibold">Media đã chọn</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Background */}
              <div className="border rounded-md p-3">
                <h4 className="text-sm font-medium mb-2">Hình nền</h4>
                {hasSelectedBackground ? (
                  <div className="relative aspect-video border rounded-md overflow-hidden">
                    <img
                      src={displayUrls.background}
                      alt="Hình nền đã chọn"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                      <p className="text-xs text-white truncate">
                        Hình nền đã chọn
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-24 bg-gray-100 rounded-md">
                    <p className="text-sm text-gray-500">Chưa chọn hình nền</p>
                  </div>
                )}
              </div>

              {/* Texture */}
              <div className="border rounded-md p-3">
                <h4 className="text-sm font-medium mb-2">Texture</h4>
                {hasSelectedTexture ? (
                  <div className="relative aspect-video border rounded-md overflow-hidden">
                    <img
                      src={displayUrls.texture}
                      alt="Texture đã chọn"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                      <p className="text-xs text-white truncate">
                        Texture đã chọn
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-24 bg-gray-100 rounded-md">
                    <p className="text-sm text-gray-500">Chưa chọn texture</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "video" && (
          <div className="space-y-4 mt-6 border-t pt-4">
            <h3 className="text-lg font-semibold">Video đã chọn</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Intro Video */}
              <div className="border rounded-md p-3">
                <h4 className="text-sm font-medium mb-2">Video giới thiệu</h4>
                {hasSelectedIntro ? (
                  <div className="relative aspect-video border rounded-md overflow-hidden">
                    <video
                      src={displayUrls.intro}
                      controls
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                      <p className="text-xs text-white truncate">
                        Video giới thiệu đã chọn
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-24 bg-gray-100 rounded-md">
                    <p className="text-sm text-gray-500">
                      Chưa chọn video giới thiệu
                    </p>
                  </div>
                )}
              </div>

              {/* Win Video */}
              <div className="border rounded-md p-3">
                <h4 className="text-sm font-medium mb-2">Video chiến thắng</h4>
                {hasSelectedWin ? (
                  <div className="relative aspect-video border rounded-md overflow-hidden">
                    <video
                      src={displayUrls.win}
                      controls
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                      <p className="text-xs text-white truncate">
                        Video chiến thắng đã chọn
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-24 bg-gray-100 rounded-md">
                    <p className="text-sm text-gray-500">
                      Chưa chọn video chiến thắng
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Lưu ý: Các thay đổi sẽ được áp dụng vào game khi bạn lưu cài đặt.
        </p>
      </CardFooter>
    </Card>
  );
}
