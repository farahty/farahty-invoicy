"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  DollarSign,
  Clock,
  AlertTriangle,
  FileText,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface DashboardMetricsProps {
  metrics: {
    totalRevenue: number;
    pendingAmount: number;
    overdueCount: number;
    totalInvoices: number;
    totalClients: number;
  };
}

export function DashboardMetrics({ metrics }: DashboardMetricsProps) {
  const t = useTranslations("dashboard");

  const formatCurrency = (amount: number) => {
    const formatted = amount.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${formatted} ₪`;
  };

  const cards = [
    {
      title: t("totalRevenue"),
      value: formatCurrency(metrics.totalRevenue),
      icon: DollarSign,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: t("pendingAmount"),
      value: formatCurrency(metrics.pendingAmount),
      icon: Clock,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      title: t("overdueInvoices"),
      value: metrics.overdueCount.toString(),
      icon: AlertTriangle,
      iconBg: "bg-destructive/10",
      iconColor: "text-destructive",
      highlight: metrics.overdueCount > 0,
    },
    {
      title: t("paidInvoices"),
      value: metrics.totalInvoices.toString(),
      icon: FileText,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: t("totalClients"),
      value: metrics.totalClients.toString(),
      icon: Users,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className={
            card.highlight ? "border-destructive/50 bg-destructive/5" : ""
          }
        >
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs md:text-sm text-muted-foreground font-medium">
                  {card.title}
                </p>
                <p
                  className={`text-lg md:text-2xl font-bold ${
                    card.highlight ? "text-destructive" : "text-foreground"
                  }`}
                >
                  {card.value}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${card.iconBg} hidden sm:block`}>
                <card.icon
                  className={`h-4 w-4 md:h-5 md:w-5 ${card.iconColor}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
