import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock } from "lucide-react";
import { HourlyStackedChart } from "@/components/charts/hourly-stacked-chart";

export default function HourlyChartPage() {
  return (
    <div className="space-y-4 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Biểu đồ theo giờ
          </h2>
          <p className="text-muted-foreground">
            Phân tích chi tiết số lượng người chơi theo từng giờ trong ngày
          </p>
        </div>
        <div className="flex items-center space-x-2"></div>
      </div>

      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Phân bố người chơi theo giờ
              </CardTitle>
              <CardDescription>
                Thống kê số lượng người chơi theo từng giờ trong ngày
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[500px]">
            <HourlyStackedChart />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Phân tích</h3>
            <p className="text-sm text-muted-foreground">
              Biểu đồ trên hiển thị số lượng người chơi theo từng giờ trong các
              ngày. Thông qua biểu đồ này, bạn có thể:
            </p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>Xác định giờ cao điểm có nhiều người chơi nhất</li>
              <li>Hiểu rõ hơn về thói quen của người dùng theo giờ</li>
              <li>So sánh lượng người chơi giữa buổi sáng, chiều và tối</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
