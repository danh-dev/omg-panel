"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, BarChart, Clock, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  items: {
    href: string;
    title: string;
    icon: string;
  }[];
}

export function Sidebar({ className, items, ...props }: SidebarProps) {
  const pathname = usePathname();

  // Map icon names to components
  const getIcon = (icon: string) => {
    switch (icon) {
      case "dashboard":
        return <LayoutDashboard className="h-5 w-5" />;
      case "users":
        return <Users className="h-5 w-5" />;
      case "chart":
        return <BarChart className="h-5 w-5" />;
      case "clock":
        return <Clock className="h-5 w-5" />;
      default:
        return <LayoutDashboard className="h-5 w-5" />;
    }
  };

  return (
    <div
      className={cn("pb-12 border-r min-h-screen w-64", className)}
      {...props}
    >
      <div className="space-y-4 py-4">
        <div className="px-6 py-2">
          <Link href="/" className="flex items-center gap-2">
            <Home className="h-6 w-6" />
            <h2 className="text-lg font-semibold">Event Game</h2>
          </Link>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-sm font-semibold tracking-tight text-muted-foreground">
            Dashboard
          </h2>
          <div className="space-y-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                )}
              >
                {getIcon(item.icon)}
                <span>{item.title}</span>
              </Link>
            ))}
          </div>
        </div>
        {/* <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-sm font-semibold tracking-tight text-muted-foreground">
            Hỗ trợ
          </h2>
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-sm font-medium px-3 py-2"
            >
              <Link href="/help" className="flex items-center gap-3">
                <div className="h-5 w-5 flex items-center justify-center text-muted-foreground">
                  ?
                </div>
                <span>Trợ giúp</span>
              </Link>
            </Button>
          </div>
        </div> */}
      </div>
    </div>
  );
}
