import { Metadata } from "next";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardShell } from "@/components/dashboard/shell";
import { PlayersTable } from "@/components/players/players-table";

export const metadata: Metadata = {
  title: "Danh sách người chơi | DNA Game",
  description: "Danh sách người chơi game DNA",
};

export default function PlayersPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Danh sách người chơi"
        text="Quản lý và xem thông tin chi tiết người chơi"
      />
      <PlayersTable />
    </DashboardShell>
  );
}
