"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ActivityLogList } from "./activity-log-list";
import { getEntityActivity } from "@/actions/activity";
import type { ActivityEntity, ActivityLog, User } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityLogWithUser
  extends Omit<ActivityLog, "details" | "previousValues" | "newValues"> {
  user: User;
  details: Record<string, unknown> | null;
  previousValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
}

interface EntityActivityProps {
  entityType: ActivityEntity;
  entityId: string;
  title?: string;
  initiallyExpanded?: boolean;
}

export function EntityActivity({
  entityType,
  entityId,
  title,
  initiallyExpanded = false,
}: EntityActivityProps) {
  const t = useTranslations("activity");
  const [logs, setLogs] = useState<ActivityLogWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(initiallyExpanded);

  useEffect(() => {
    async function loadActivity() {
      setLoading(true);
      const result = await getEntityActivity(entityType, entityId);
      if ("logs" in result) {
        setLogs(result.logs as ActivityLogWithUser[]);
      }
      setLoading(false);
    }
    loadActivity();
  }, [entityType, entityId]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            {title || t("title")}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ActivityLogList logs={logs} showEntity={false} />
          )}
        </CardContent>
      )}
    </Card>
  );
}
