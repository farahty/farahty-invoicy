import { db, invoices, clients } from "@/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireOrgAuth } from "@/lib/session";
import { DashboardMetrics } from "@/components/dashboard/metrics";
import { RecentInvoices } from "@/components/dashboard/recent-invoices";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { getTranslations } from "next-intl/server";

export default async function DashboardPage() {
  const { user, activeOrganization } = await requireOrgAuth();
  const organizationId = activeOrganization!.id;
  const t = await getTranslations("dashboard");

  // Fetch dashboard data
  const [metricsData, recentInvoicesData, clientCount] = await Promise.all([
    // Metrics: total revenue (paid), pending amount, overdue count
    db
      .select({
        totalRevenue: sql<string>`COALESCE(SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END), 0)`,
        pendingAmount: sql<string>`COALESCE(SUM(CASE WHEN status IN ('sent', 'draft') THEN total ELSE 0 END), 0)`,
        overdueCount: sql<number>`COUNT(CASE WHEN status = 'overdue' THEN 1 END)`,
        totalInvoices: sql<number>`COUNT(*)`,
      })
      .from(invoices)
      .where(eq(invoices.organizationId, organizationId)),

    // Recent invoices with client info
    db.query.invoices.findMany({
      where: eq(invoices.organizationId, organizationId),
      with: {
        client: true,
      },
      orderBy: [desc(invoices.createdAt)],
      limit: 5,
    }),

    // Client count
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(clients)
      .where(eq(clients.organizationId, organizationId)),
  ]);

  const metrics = {
    totalRevenue: parseFloat(metricsData[0]?.totalRevenue || "0"),
    pendingAmount: parseFloat(metricsData[0]?.pendingAmount || "0"),
    overdueCount: metricsData[0]?.overdueCount || 0,
    totalInvoices: metricsData[0]?.totalInvoices || 0,
    totalClients: clientCount[0]?.count || 0,
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("welcome")}, {user.name.split(" ")[0]}!
        </p>
      </div>

      {/* Quick Actions - Mobile prominent */}
      <QuickActions />

      {/* Metrics Cards */}
      <DashboardMetrics metrics={metrics} />

      {/* Recent Invoices */}
      <RecentInvoices invoices={recentInvoicesData} />
    </div>
  );
}
