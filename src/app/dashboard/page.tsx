import { Metadata } from "next";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardShell } from "@/components/dashboard/shell";
import { StatisticsCards } from "@/components/dashboard/statistics-cards";
import { DateBarChart } from "@/components/dashboard/date-bar-chart";
import { HourDistributionChart } from "@/components/dashboard/hour-distribution-chart";

export const metadata: Metadata = {
  title: "Dashboard | DNA Game Statistics",
  description: "Dashboard thống kê dữ liệu người chơi DNA Game",
};

export default function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dashboard"
        text="Tổng quan về dữ liệu người chơi DNA Game"
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatisticsCards />
      </div>
      <div className="grid gap-4 mt-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <DateBarChart />
        </div>
        <div className="col-span-3">
          <HourDistributionChart />
        </div>
      </div>
    </DashboardShell>
  );
}
