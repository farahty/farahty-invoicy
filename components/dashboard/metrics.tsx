"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  DollarSign,
  Clock,
  AlertTriangle,
  FileText,
  Users,
} from "lucide-react";

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
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const cards = [
    {
      title: "Total Revenue",
      value: formatCurrency(metrics.totalRevenue),
      icon: DollarSign,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Pending",
      value: formatCurrency(metrics.pendingAmount),
      icon: Clock,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      title: "Overdue",
      value: metrics.overdueCount.toString(),
      icon: AlertTriangle,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      highlight: metrics.overdueCount > 0,
    },
    {
      title: "Total Invoices",
      value: metrics.totalInvoices.toString(),
      icon: FileText,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Total Clients",
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
          className={card.highlight ? "border-red-200 bg-red-50/50" : ""}
        >
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs md:text-sm text-slate-500 font-medium">
                  {card.title}
                </p>
                <p
                  className={`text-lg md:text-2xl font-bold ${
                    card.highlight ? "text-red-600" : "text-slate-900"
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
