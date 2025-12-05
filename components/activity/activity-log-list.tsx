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
  created: "text-status-success-foreground bg-status-success-bg",
  updated: "text-status-info-foreground bg-status-info-bg",
  deleted: "text-destructive bg-destructive/10",
  status_changed: "text-status-warning-foreground bg-status-warning-bg",
  sent: "text-status-purple-foreground bg-status-purple-bg",
  payment_recorded: "text-status-success-foreground bg-status-success-bg",
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
            className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
          >
            {/* Action Icon */}
            <div className={cn("p-2 rounded-full shrink-0", actionColor)}>
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

              {log.details && log.action === "payment_recorded" && (
                <div className="text-sm text-muted-foreground mt-1">
                  ₪
                  {(
                    log.newValues as Record<string, number>
                  )?.amount?.toLocaleString()}{" "}
                  • {(log.details as Record<string, string>)?.invoiceNumber}
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
