"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  DollarSign,
  Clock,
  AlertTriangle,
  Users,
  CircleDashed,
  Receipt,
  TrendingUp,
  TrendingDown,
  type LucideIcon,
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
    totalExpenses: number;
    netProfit: number;
    thisMonthProfit: number;
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

  const cards: {
    title: string;
    value: string;
    subtitle?: string;
    icon: LucideIcon;
    iconBg: string;
    iconColor: string;
    highlight?: boolean;
    highlightClass?: string;
    textHighlight?: string;
  }[] = [
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
    {
      title: t("totalExpenses"),
      value: formatCurrency(metrics.totalExpenses),
      icon: Receipt,
      iconBg: "bg-chart-3/15",
      iconColor: "text-chart-3",
    },
    {
      title: t("netProfit"),
      value: formatCurrency(metrics.netProfit),
      subtitle: `${t("thisMonth")}: ${metrics.thisMonthProfit >= 0 ? "" : "−"}${formatCurrency(Math.abs(metrics.thisMonthProfit))}`,
      icon: metrics.netProfit >= 0 ? TrendingUp : TrendingDown,
      iconBg: metrics.netProfit >= 0 ? "bg-chart-2/15" : "bg-destructive/10",
      iconColor: metrics.netProfit >= 0 ? "text-chart-2" : "text-destructive",
      highlight: metrics.netProfit < 0,
      highlightClass: "border-destructive/50 bg-destructive/5",
      textHighlight: "text-destructive",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
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
                {card.subtitle && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {card.subtitle}
                  </p>
                )}
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
