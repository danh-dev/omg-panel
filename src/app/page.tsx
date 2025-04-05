import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "DNA Game Dashboard",
  description: "Bảng điều khiển và thống kê cho trò chơi DNA",
};

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-144px)] p-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight mb-6">
        Event Game Dashboard
      </h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
        Hệ thống quản lý và thống kê dữ liệu người chơi trò chơi Event
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/dashboard">
          <Button className="px-8 py-6 text-lg">Xem thống kê</Button>
        </Link>
        <Link href="/players">
          <Button variant="outline" className="px-8 py-6 text-lg">
            Danh sách người chơi
          </Button>
        </Link>
      </div>
    </div>
  );
}
