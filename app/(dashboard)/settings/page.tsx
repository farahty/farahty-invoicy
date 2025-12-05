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
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Building2, Settings } from "lucide-react";

export default async function SettingsPage() {
  const settings = await getSettings();
  const t = await getTranslations("settings");

  if (!settings) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex gap-2 border-b">
        <Link
          href="/settings"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 border-primary text-primary"
        >
          <Settings className="h-4 w-4" />
          {t("profile")}
        </Link>
        <Link
          href="/settings/organization"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <Building2 className="h-4 w-4" />
          {t("organization")}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("profile")}</CardTitle>
          <CardDescription>{t("business")}</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm settings={settings} />
        </CardContent>
      </Card>
    </div>
  );
}
