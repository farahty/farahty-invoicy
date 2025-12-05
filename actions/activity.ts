"use server";

import { db } from "@/db";
import {
  activityLogs,
  type ActivityAction,
  type ActivityEntity,
  users,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { desc, eq, and, gte, lte, sql } from "drizzle-orm";

interface LogActivityParams {
  entityType: ActivityEntity;
  entityId: string;
  entityName?: string;
  action: ActivityAction;
  details?: Record<string, unknown>;
  previousValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}

/**
 * Log an activity to the audit trail
 */
export async function logActivity(params: LogActivityParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || !session.session.activeOrganizationId) {
    return { error: "Unauthorized" };
  }

  const headersList = await headers();
  const ipAddress =
    headersList.get("x-forwarded-for")?.split(",")[0] ||
    headersList.get("x-real-ip") ||
    "unknown";
  const userAgent = headersList.get("user-agent") || "unknown";

  try {
    await db.insert(activityLogs).values({
      organizationId: session.session.activeOrganizationId,
      userId: session.user.id,
      entityType: params.entityType,
      entityId: params.entityId,
      entityName: params.entityName,
      action: params.action,
      details: params.details ? JSON.stringify(params.details) : null,
      previousValues: params.previousValues
        ? JSON.stringify(params.previousValues)
        : null,
      newValues: params.newValues ? JSON.stringify(params.newValues) : null,
      ipAddress,
      userAgent,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to log activity:", error);
    return { error: "Failed to log activity" };
  }
}

/**
 * Get activity logs with filtering options
 */
export async function getActivityLogs(options?: {
  entityType?: ActivityEntity;
  entityId?: string;
  action?: ActivityAction;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || !session.session.activeOrganizationId) {
    return { error: "Unauthorized" };
  }

  const organizationId = session.session.activeOrganizationId;
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  try {
    const conditions = [eq(activityLogs.organizationId, organizationId)];

    if (options?.entityType) {
      conditions.push(eq(activityLogs.entityType, options.entityType));
    }
    if (options?.entityId) {
      conditions.push(eq(activityLogs.entityId, options.entityId));
    }
    if (options?.action) {
      conditions.push(eq(activityLogs.action, options.action));
    }
    if (options?.userId) {
      conditions.push(eq(activityLogs.userId, options.userId));
    }
    if (options?.startDate) {
      conditions.push(gte(activityLogs.createdAt, options.startDate));
    }
    if (options?.endDate) {
      conditions.push(lte(activityLogs.createdAt, options.endDate));
    }

    const logs = await db.query.activityLogs.findMany({
      where: and(...conditions),
      with: {
        user: true,
      },
      orderBy: [desc(activityLogs.createdAt)],
      limit,
      offset,
    });

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(activityLogs)
      .where(and(...conditions));

    return {
      logs: logs.map((log) => ({
        ...log,
        details: log.details ? JSON.parse(log.details) : null,
        previousValues: log.previousValues
          ? JSON.parse(log.previousValues)
          : null,
        newValues: log.newValues ? JSON.parse(log.newValues) : null,
      })),
      total: Number(countResult[0]?.count ?? 0),
      limit,
      offset,
    };
  } catch (error) {
    console.error("Failed to get activity logs:", error);
    return { error: "Failed to get activity logs" };
  }
}

/**
 * Get activity logs for a specific entity
 */
export async function getEntityActivity(
  entityType: ActivityEntity,
  entityId: string
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || !session.session.activeOrganizationId) {
    return { error: "Unauthorized" };
  }

  try {
    const logs = await db.query.activityLogs.findMany({
      where: and(
        eq(activityLogs.organizationId, session.session.activeOrganizationId),
        eq(activityLogs.entityType, entityType),
        eq(activityLogs.entityId, entityId)
      ),
      with: {
        user: true,
      },
      orderBy: [desc(activityLogs.createdAt)],
    });

    return {
      logs: logs.map((log) => ({
        ...log,
        details: log.details ? JSON.parse(log.details) : null,
        previousValues: log.previousValues
          ? JSON.parse(log.previousValues)
          : null,
        newValues: log.newValues ? JSON.parse(log.newValues) : null,
      })),
    };
  } catch (error) {
    console.error("Failed to get entity activity:", error);
    return { error: "Failed to get entity activity" };
  }
}

/**
 * Get recent activity for dashboard
 */
export async function getRecentActivity(limit: number = 10) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || !session.session.activeOrganizationId) {
    return { error: "Unauthorized" };
  }

  try {
    const logs = await db.query.activityLogs.findMany({
      where: eq(
        activityLogs.organizationId,
        session.session.activeOrganizationId
      ),
      with: {
        user: true,
      },
      orderBy: [desc(activityLogs.createdAt)],
      limit,
    });

    return {
      logs: logs.map((log) => ({
        ...log,
        details: log.details ? JSON.parse(log.details) : null,
        previousValues: log.previousValues
          ? JSON.parse(log.previousValues)
          : null,
        newValues: log.newValues ? JSON.parse(log.newValues) : null,
      })),
    };
  } catch (error) {
    console.error("Failed to get recent activity:", error);
    return { error: "Failed to get recent activity" };
  }
}

/**
 * Get user activity summary
 */
export async function getUserActivitySummary(days: number = 30) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || !session.session.activeOrganizationId) {
    return { error: "Unauthorized" };
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    const summary = await db
      .select({
        userId: activityLogs.userId,
        userName: users.name,
        userEmail: users.email,
        actionCount: sql<number>`count(*)`,
      })
      .from(activityLogs)
      .innerJoin(users, eq(activityLogs.userId, users.id))
      .where(
        and(
          eq(activityLogs.organizationId, session.session.activeOrganizationId),
          gte(activityLogs.createdAt, startDate)
        )
      )
      .groupBy(activityLogs.userId, users.name, users.email)
      .orderBy(desc(sql`count(*)`));

    return { summary };
  } catch (error) {
    console.error("Failed to get user activity summary:", error);
    return { error: "Failed to get user activity summary" };
  }
}
