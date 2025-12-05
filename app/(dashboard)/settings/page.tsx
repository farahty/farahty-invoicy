import { redirect } from "next/navigation";
import { getSettings } from "@/actions/settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const settings = await getSettings();

  if (!settings) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600">
          Manage your account and invoice settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>
            Update your personal and company information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm settings={settings} />
        </CardContent>
      </Card>
    </div>
  );
}
