import { SettingsForm } from "@/components/settings/settings-form";

export default function SettingsPage() {
  return (
    <div className="space-y-4 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Cài đặt trò chơi
          </h2>
          <p className="text-muted-foreground">
            Quản lý cấu hình và thông số cho trò chơi DNA
          </p>
        </div>
      </div>

      <SettingsForm />
    </div>
  );
}
