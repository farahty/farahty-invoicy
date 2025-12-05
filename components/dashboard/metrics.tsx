"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  DollarSign,
  Clock,
  AlertTriangle,
  FileText,
  Users,
  CircleDashed,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface DashboardMetricsProps {
  metrics: {
    totalRevenue: number;
    pendingAmount: number;
    overdueCount: number;
    partialCount: number;
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
      iconBg: "bg-chart-2/15",
      iconColor: "text-chart-2",
    },
    {
      title: t("pendingAmount"),
      value: formatCurrency(metrics.pendingAmount),
      icon: Clock,
      iconBg: "bg-chart-3/15",
      iconColor: "text-chart-3",
    },
    {
      title: t("partiallyPaid"),
      value: metrics.partialCount.toString(),
      icon: CircleDashed,
      iconBg: "bg-chart-3/15",
      iconColor: "text-chart-3",
      highlight: metrics.partialCount > 0,
      highlightClass: "border-chart-3/50 bg-chart-3/5",
      textHighlight: "text-chart-3",
    },
    {
      title: t("overdueInvoices"),
      value: metrics.overdueCount.toString(),
      icon: AlertTriangle,
      iconBg: "bg-destructive/10",
      iconColor: "text-destructive",
      highlight: metrics.overdueCount > 0,
      highlightClass: "border-destructive/50 bg-destructive/5",
      textHighlight: "text-destructive",
    },
    {
      title: t("totalClients"),
      value: metrics.totalClients.toString(),
      icon: Users,
      iconBg: "bg-chart-4/15",
      iconColor: "text-chart-4",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className={card.highlight ? card.highlightClass || "" : ""}
        >
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs md:text-sm text-muted-foreground font-medium">
                  {card.title}
                </p>
                <p
                  className={`text-lg md:text-2xl font-bold ${
                    card.highlight
                      ? card.textHighlight || "text-foreground"
                      : "text-foreground"
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
