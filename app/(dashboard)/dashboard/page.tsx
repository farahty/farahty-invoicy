import { db, invoices, clients, expenses } from "@/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireOrgAuth } from "@/lib/session";
import { DashboardMetrics } from "@/components/dashboard/metrics";
import { RecentInvoices } from "@/components/dashboard/recent-invoices";
import { RecentExpenses } from "@/components/dashboard/recent-expenses";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { getTranslations } from "next-intl/server";

export default async function DashboardPage() {
  const { user, activeOrganization } = await requireOrgAuth();
  const organizationId = activeOrganization!.id;
  const t = await getTranslations("dashboard");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Fetch dashboard data
  const [metricsData, recentInvoicesData, clientCount, expenseAggregates, thisMonthRevenueData, recentExpensesData] = await Promise.all([
    // Metrics: total revenue (paid + partial paid amounts), pending amount (balance due), overdue count
    db
      .select({
        totalRevenue: sql<string>`COALESCE(SUM(amount_paid), 0)`,
        pendingAmount: sql<string>`COALESCE(SUM(CASE WHEN status IN ('sent', 'partial', 'overdue') THEN balance_due ELSE 0 END), 0)`,
        overdueCount: sql<number>`COUNT(CASE WHEN status = 'overdue' THEN 1 END)`,
        partialCount: sql<number>`COUNT(CASE WHEN status = 'partial' THEN 1 END)`,
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

    // Expense aggregates
    db
      .select({
        totalExpenses: sql<string>`COALESCE(SUM(amount), 0)`,
        thisMonthExpenses: sql<string>`COALESCE(SUM(CASE WHEN date >= ${monthStart} THEN amount ELSE 0 END), 0)`,
      })
      .from(expenses)
      .where(eq(expenses.organizationId, organizationId)),

    // This month revenue (for profit subtitle)
    db
      .select({
        thisMonthRevenue: sql<string>`COALESCE(SUM(CASE WHEN created_at >= ${monthStart} THEN amount_paid ELSE 0 END), 0)`,
      })
      .from(invoices)
      .where(eq(invoices.organizationId, organizationId)),

    // Recent 5 expenses
    db.query.expenses.findMany({
      where: eq(expenses.organizationId, organizationId),
      with: { category: true },
      orderBy: [desc(expenses.date)],
      limit: 5,
    }),
  ]);

  const totalExpenses = parseFloat(expenseAggregates[0]?.totalExpenses || "0");
  const thisMonthExpenses = parseFloat(expenseAggregates[0]?.thisMonthExpenses || "0");
  const thisMonthRevenue = parseFloat(thisMonthRevenueData[0]?.thisMonthRevenue || "0");
  const totalRevenue = parseFloat(metricsData[0]?.totalRevenue || "0");

  const metrics = {
    totalRevenue,
    pendingAmount: parseFloat(metricsData[0]?.pendingAmount || "0"),
    overdueCount: metricsData[0]?.overdueCount || 0,
    partialCount: metricsData[0]?.partialCount || 0,
    totalInvoices: metricsData[0]?.totalInvoices || 0,
    totalClients: clientCount[0]?.count || 0,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    thisMonthProfit: thisMonthRevenue - thisMonthExpenses,
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

      {/* Recent Expenses */}
      <RecentExpenses expenses={recentExpensesData} />
    </div>
  );
}
