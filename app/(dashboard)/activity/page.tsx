import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getActivityLogs } from "@/actions/activity";
import { ActivityLogList } from "@/components/activity/activity-log-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";
import type { ActivityLog, User } from "@/db/schema";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("activity");
  return {
    title: t("title"),
  };
}

interface ActivityLogWithUser
  extends Omit<ActivityLog, "details" | "previousValues" | "newValues"> {
  user: User;
  details: Record<string, unknown> | null;
  previousValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
}

export default async function ActivityPage() {
  const t = await getTranslations("activity");
  const result = await getActivityLogs({ limit: 100 });

  const logs = "logs" in result ? (result.logs as ActivityLogWithUser[]) : [];

  return (
    <div className="container py-6">
      <div className="flex items-center gap-3 mb-6">
        <History className="h-6 w-6" />
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("recentActivity")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityLogList logs={logs} />
        </CardContent>
      </Card>
    </div>
  );
}
