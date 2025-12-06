"use client";

import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import {
  User,
  FileText,
  CreditCard,
  Building2,
  Users,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Send,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityLog, User as UserType } from "@/db/schema";

interface ActivityLogWithUser
  extends Omit<ActivityLog, "details" | "previousValues" | "newValues"> {
  user: UserType;
  details: Record<string, unknown> | null;
  previousValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
}

interface ActivityLogListProps {
  logs: ActivityLogWithUser[];
  showEntity?: boolean;
}

const entityIcons = {
  client: User,
  invoice: FileText,
  payment: CreditCard,
  organization: Building2,
  member: Users,
};

const actionIcons = {
  created: Plus,
  updated: Pencil,
  deleted: Trash2,
  status_changed: RefreshCw,
  sent: Send,
  payment_recorded: DollarSign,
  payment_deleted: Trash2,
};

const actionColors = {
  created: "text-chart-2 bg-chart-2/15",
  updated: "text-chart-1 bg-chart-1/15",
  deleted: "text-destructive bg-destructive/10",
  status_changed: "text-chart-3 bg-chart-3/15",
  sent: "text-chart-4 bg-chart-4/15",
  payment_recorded: "text-chart-2 bg-chart-2/15",
  payment_deleted: "text-destructive bg-destructive/10",
};

export function ActivityLogList({
  logs,
  showEntity = true,
}: ActivityLogListProps) {
  const t = useTranslations("activity");
  const locale = useLocale();
  const dateLocale = locale === "ar" ? ar : enUS;

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t("noActivity")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => {
        const EntityIcon = entityIcons[log.entityType];
        const ActionIcon = actionIcons[log.action];
        const actionColor = actionColors[log.action];

        return (
          <div
            key={log.id}
            className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors items-start"
          >
            {/* Action Icon */}
            <div className={cn("p-2 rounded-full shrink-0 ", actionColor)}>
              <ActionIcon className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Main line */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">
                  {log.user?.name || "Unknown User"}
                </span>
                <span className="text-muted-foreground text-sm">
                  {t(`actions.${log.action}`)}
                </span>
                {showEntity && (
                  <>
                    <span className="inline-flex items-center gap-1 text-sm">
                      <EntityIcon className="h-3.5 w-3.5" />
                      {t(`entityTypes.${log.entityType}`)}
                    </span>
                    {log.entityName && (
                      <span className="font-medium text-sm truncate">
                        {log.entityName}
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Details */}
              {log.details && log.action === "status_changed" && (
                <div className="text-sm text-muted-foreground mt-1">
                  {(log.details as Record<string, string>).fromStatus} →{" "}
                  {(log.details as Record<string, string>).toStatus}
                </div>
              )}

              {log.action === "payment_recorded" && (
                <div className="text-sm text-muted-foreground mt-1">
                  ₪
                  {(
                    log.newValues as Record<string, number>
                  )?.amount?.toLocaleString()}{" "}
                  {(log.details as Record<string, string>)?.invoiceNumber && (
                    <>
                      • {(log.details as Record<string, string>).invoiceNumber}
                    </>
                  )}
                </div>
              )}

              {log.action === "payment_deleted" && (
                <div className="text-sm text-muted-foreground mt-1">
                  ₪
                  {parseFloat(
                    (log.previousValues as Record<string, string>)?.amount ||
                      "0"
                  ).toLocaleString()}{" "}
                  {(log.details as Record<string, string>)?.invoiceNumber && (
                    <>
                      • {(log.details as Record<string, string>).invoiceNumber}
                    </>
                  )}
                </div>
              )}

              {/* Timestamp */}
              <div className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(log.createdAt), {
                  addSuffix: true,
                  locale: dateLocale,
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
