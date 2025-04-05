import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DNA Game Dashboard",
  description: "Bảng điều khiển và thống kê cho trò chơi DNA",
};

const sidebarItems = [
  {
    title: "Tổng quan",
    href: "/dashboard",
    icon: "dashboard",
  },
  {
    title: "Người chơi",
    href: "/players",
    icon: "users",
  },
  {
    title: "Biểu đồ theo giờ",
    href: "/charts/hourly",
    icon: "clock",
  },
  {
    title: "Cài đặt",
    href: "/settings",
    icon: "settings",
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="flex min-h-screen">
          <Sidebar items={sidebarItems} className="hidden md:block" />
          <div className="flex flex-col flex-1 justify-between">
            <main className="min-h-auto">{children}</main>
            <footer className="border-t py-2 px-8 h-min">
              <p className="text-center text-xs text-muted-foreground md:text-left">
                &copy; {new Date().getFullYear()} Event Game. Boostech All
                rights reserved.
              </p>
            </footer>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
