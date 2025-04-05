"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, RefreshCw } from "lucide-react";
import { DNAGameSettings } from "@/lib/settingsService";
import { Separator } from "@/components/ui/separator";
import { MediaUpload } from "@/components/settings/media-upload";
import { toast } from "sonner";

export function SettingsForm() {
  const [settings, setSettings] = useState<DNAGameSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async (refresh = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const url = refresh ? "/api/settings?refresh=true" : "/api/settings";
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Lỗi không xác định");
      }

      setSettings(data.data);

      if (refresh) {
        toast("Cài đặt đã được cập nhật");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
      toast("Không thể tải dữ liệu cài đặt. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setIsSaving(true);

      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Lỗi không xác định");
      }

      setSettings(data.data);
      toast("Cài đặt đã được cập nhật thành công");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
      toast("Không thể lưu cài đặt. Vui lòng thử lại sau.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (key: keyof DNAGameSettings, value: any) => {
    if (!settings) return;

    setSettings((prev) => {
      if (!prev) return prev;

      // Special handling for nested objects
      if (key === "defaultCameraPosition") {
        if (typeof value === "object") {
          return { ...prev, [key]: value };
        }
        return prev;
      }

      // Handle whitelistedPairs special case
      if (key === "whitelistedPairs" && typeof value === "string") {
        try {
          // Kiểm tra xem đây có phải dạng JSON không
          if (value.trim().startsWith("[") && value.trim().endsWith("]")) {
            // Parse dạng JSON
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
              return { ...prev, [key]: parsed };
            }
          }

          // Nếu không phải JSON, xử lý dạng chuỗi phân cách bằng dấu phẩy
          const pairs = value
            .split(",")
            .map((item) => {
              const num = parseInt(item.trim());
              return isNaN(num) ? null : num;
            })
            .filter((item) => item !== null) as number[];

          return { ...prev, [key]: pairs };
        } catch (e) {
          // Fallback: nếu có lỗi, vẫn xử lý dạng chuỗi phân cách bằng dấu phẩy
          const pairs = value
            .split(",")
            .map((item) => {
              const num = parseInt(item.trim());
              return isNaN(num) ? null : num;
            })
            .filter((item) => item !== null) as number[];

          return { ...prev, [key]: pairs };
        }
      }

      // Handle boolean values
      if (key === "spin") {
        return { ...prev, [key]: Boolean(value) };
      }

      // Handle numeric values
      if (
        key === "numPairs" ||
        key === "helixRadius" ||
        key === "helixHeight" ||
        key === "backboneWidth" ||
        key === "twists" ||
        key === "gameTime" ||
        key === "blinkCount" ||
        key === "blinkInterval" ||
        key === "targetPairCount" ||
        key === "maxSelections" ||
        key === "maxAttempts" ||
        key === "winScreenTimer" ||
        key === "rotationSpeed" ||
        key === "spinSpeed" ||
        key === "winTimeout" ||
        key === "lostTimeout"
      ) {
        const numValue = parseFloat(value);
        return { ...prev, [key]: isNaN(numValue) ? 0 : numValue };
      }

      // Handle string values (đặc biệt là các đường dẫn media)
      if (
        key === "backgroundImage" ||
        key === "introVideo" ||
        key === "winVideo"
      ) {
        return { ...prev, [key]: value };
      }

      return { ...prev, [key]: value };
    });
  };

  const handleMediaSelect = (
    purpose: "background" | "intro" | "win",
    url: string
  ) => {
    if (!settings) return;

    switch (purpose) {
      case "background":
        handleInputChange("backgroundImage", url);
        break;
      case "intro":
        handleInputChange("introVideo", url);
        break;
      case "win":
        handleInputChange("winVideo", url);
        break;
    }
  };

  const formatWhitelistedPairs = (pairs: number[]): string => {
    return pairs.join(",");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2">Đang tải cài đặt...</span>
        </CardContent>
      </Card>
    );
  }

  if (error && !settings) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center h-64 text-red-500">
            <p>Không thể tải dữ liệu cài đặt</p>
            <p className="text-sm">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => fetchSettings(true)}
            >
              Thử lại
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!settings) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Cài đặt trò chơi DNA</CardTitle>
            <CardDescription>
              Cấu hình các thông số cho trò chơi DNA
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fetchSettings(true)}
              disabled={isLoading || isSaving}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Làm mới
            </Button>
            <Button onClick={saveSettings} disabled={isLoading || isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Lưu cài đặt
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="model">
          <TabsList className="mb-4">
            <TabsTrigger value="model">Mô hình DNA</TabsTrigger>
            <TabsTrigger value="game">Cấu hình trò chơi</TabsTrigger>
            <TabsTrigger value="animation">Hoạt ảnh & Hiệu ứng</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
          </TabsList>

          <TabsContent value="model" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="numPairs">Số lượng cặp (numPairs)</Label>
                <Input
                  id="numPairs"
                  type="number"
                  value={settings.numPairs}
                  onChange={(e) =>
                    handleInputChange("numPairs", e.target.value)
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Tổng số cặp base trong mô hình DNA
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="helixRadius">
                  Bán kính helix (helixRadius)
                </Label>
                <Input
                  id="helixRadius"
                  type="number"
                  step="0.1"
                  value={settings.helixRadius}
                  onChange={(e) =>
                    handleInputChange("helixRadius", e.target.value)
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Bán kính của mô hình helix
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="helixHeight">
                  Chiều cao helix (helixHeight)
                </Label>
                <Input
                  id="helixHeight"
                  type="number"
                  value={settings.helixHeight}
                  onChange={(e) =>
                    handleInputChange("helixHeight", e.target.value)
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Chiều cao của mô hình DNA
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backboneWidth">
                  Độ rộng xương sống (backboneWidth)
                </Label>
                <Input
                  id="backboneWidth"
                  type="number"
                  step="0.1"
                  value={settings.backboneWidth}
                  onChange={(e) =>
                    handleInputChange("backboneWidth", e.target.value)
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Độ rộng của các sợi xương sống trong mô hình
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="twists">Số vòng xoắn (twists)</Label>
                <Input
                  id="twists"
                  type="number"
                  value={settings.twists}
                  onChange={(e) => handleInputChange("twists", e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Số vòng xoắn trong cấu trúc DNA
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultCameraPositionZ">
                  Vị trí camera (Z)
                </Label>
                <Input
                  id="defaultCameraPositionZ"
                  type="number"
                  value={settings.defaultCameraPosition.z}
                  onChange={(e) =>
                    handleInputChange("defaultCameraPosition", {
                      ...settings.defaultCameraPosition,
                      z: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Vị trí camera theo trục Z
                </p>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <Label htmlFor="whitelistedPairs">
                Cặp được phép chọn (whitelistedPairs)
              </Label>
              <Input
                id="whitelistedPairs"
                defaultValue={
                  settings
                    ? formatWhitelistedPairs(settings.whitelistedPairs)
                    : ""
                }
                onBlur={(e) =>
                  handleInputChange("whitelistedPairs", e.target.value)
                }
              />
              <p className="text-sm text-muted-foreground">
                Danh sách các cặp base được phép chọn (nhập dạng số, cách nhau
                bởi dấu phẩy, ví dụ: 0,1,2,3,4)
              </p>
            </div>
          </TabsContent>

          <TabsContent value="game" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gameTime">Thời gian chơi (giây)</Label>
                <Input
                  id="gameTime"
                  type="number"
                  value={settings.gameTime}
                  onChange={(e) =>
                    handleInputChange("gameTime", e.target.value)
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Thời gian đếm ngược trong trò chơi (giây)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetPairCount">Số cặp đích cần nhớ</Label>
                <Input
                  id="targetPairCount"
                  type="number"
                  value={settings.targetPairCount}
                  onChange={(e) =>
                    handleInputChange("targetPairCount", e.target.value)
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Số lượng cặp đích người chơi cần nhớ
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxSelections">Số lượng chọn tối đa</Label>
                <Input
                  id="maxSelections"
                  type="number"
                  value={settings.maxSelections}
                  onChange={(e) =>
                    handleInputChange("maxSelections", e.target.value)
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Số lượng cặp tối đa người chơi có thể chọn
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxAttempts">Số lần thử tối đa</Label>
                <Input
                  id="maxAttempts"
                  type="number"
                  value={settings.maxAttempts}
                  onChange={(e) =>
                    handleInputChange("maxAttempts", e.target.value)
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Số lần thử tối đa người chơi có thể thực hiện
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="winScreenTimer">
                  Thời gian hiển thị màn hình thắng (ms)
                </Label>
                <Input
                  id="winScreenTimer"
                  type="number"
                  value={settings.winScreenTimer}
                  onChange={(e) =>
                    handleInputChange("winScreenTimer", e.target.value)
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Thời gian hiển thị màn hình thắng (mili giây)
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="animation" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="blinkCount">Số lần nháy (blinkCount)</Label>
                <Input
                  id="blinkCount"
                  type="number"
                  value={settings.blinkCount}
                  onChange={(e) =>
                    handleInputChange("blinkCount", e.target.value)
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Số lần nháy khi hiển thị cặp đích
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="blinkInterval">
                  Khoảng thời gian nháy (ms)
                </Label>
                <Input
                  id="blinkInterval"
                  type="number"
                  value={settings.blinkInterval}
                  onChange={(e) =>
                    handleInputChange("blinkInterval", e.target.value)
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Khoảng thời gian giữa các lần nháy (mili giây)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rotationSpeed">Tốc độ xoay tự động</Label>
                <Input
                  id="rotationSpeed"
                  type="number"
                  step="0.001"
                  value={settings.rotationSpeed}
                  onChange={(e) =>
                    handleInputChange("rotationSpeed", e.target.value)
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Tốc độ xoay tự động khi đang ở chế độ chờ
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="spin">Cho phép xoay khi nhấp nháy</Label>
                  <Switch
                    id="spin"
                    checked={settings.spin}
                    onCheckedChange={(checked) =>
                      handleInputChange("spin", checked)
                    }
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Bật/tắt xoay DNA khi đang hiển thị cặp đích
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="spinSpeed">Tốc độ xoay hiệu ứng</Label>
                <Input
                  id="spinSpeed"
                  type="number"
                  step="0.001"
                  value={settings.spinSpeed}
                  onChange={(e) =>
                    handleInputChange("spinSpeed", e.target.value)
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Tốc độ xoay khi hiệu ứng nhấp nháy được bật
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="winTimeout">
                  Thời gian hiển thị thắng (ms)
                </Label>
                <Input
                  id="winTimeout"
                  type="number"
                  value={settings.winTimeout}
                  onChange={(e) =>
                    handleInputChange("winTimeout", e.target.value)
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Thời gian hiển thị thông báo thắng (mili giây)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lostTimeout">
                  Thời gian hiển thị thua (ms)
                </Label>
                <Input
                  id="lostTimeout"
                  type="number"
                  value={settings.lostTimeout}
                  onChange={(e) =>
                    handleInputChange("lostTimeout", e.target.value)
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Thời gian hiển thị thông báo thua (mili giây)
                </p>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="media" className="space-y-4">
            <MediaUpload
              settings={settings}
              onMediaSelect={handleMediaSelect}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2 border-t pt-4">
        <Button
          variant="outline"
          onClick={() => fetchSettings(true)}
          disabled={isLoading || isSaving}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Làm mới
        </Button>
        <Button onClick={saveSettings} disabled={isLoading || isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Lưu cài đặt
        </Button>
      </CardFooter>
    </Card>
  );
}
