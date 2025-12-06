import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { members, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

// Helper to check if an error is a connection/database error
function isConnectionError(error: unknown): boolean {
  if (!error) return false;

  // Check for Better Auth APIError with INTERNAL_SERVER_ERROR (usually connection issues)
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    (error as { status?: string }).status === "INTERNAL_SERVER_ERROR"
  ) {
    return true;
  }

  // Check for APIError name
  if (
    error instanceof Error &&
    (error.name === "APIError" || error.name === "NeonDbError")
  ) {
    return true;
  }

  const errorString = String(error);
  const errorPatterns = [
    "ECONNREFUSED",
    "ETIMEDOUT",
    "ENOTFOUND",
    "ENETUNREACH",
    "EAI_AGAIN",
    "Failed query",
    "Failed to get session",
    "Connection",
    "connection",
    "network",
    "Network",
    "fetch failed",
    "Unable to connect",
    "ECONNRESET",
    "socket hang up",
    "timeout",
    "Timeout",
    "INTERNAL_SERVER_ERROR",
    "NeonDbError",
    "getaddrinfo",
  ];

  // Check error string representation
  if (errorPatterns.some((pattern) => errorString.includes(pattern))) {
    return true;
  }

  // Check error message if it's an Error object
  if (error instanceof Error) {
    if (errorPatterns.some((pattern) => error.message.includes(pattern))) {
      return true;
    }
    // Check cause recursively
    if (error.cause && isConnectionError(error.cause)) {
      return true;
    }
  }

  // Check nested properties for API errors
  if (error && typeof error === "object") {
    const err = error as Record<string, unknown>;
    if (err.body && typeof err.body === "object") {
      return true; // APIError with body is usually a server error
    }
    if (err.statusCode === 500) {
      return true;
    }
  }

  return false;
}

export const getSession = cache(async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session;
  } catch (error) {
    if (isConnectionError(error)) {
      redirect("/offline");
    }
    throw error;
  }
});

export const requireAuth = async () => {
  try {
    const session = await getSession();
    if (!session) {
      redirect("/login");
    }
    return session;
  } catch (error) {
    if (isConnectionError(error)) {
      redirect("/offline");
    }
    throw error;
  }
};

// Check if user has any organizations, redirect to onboarding if not
export const requireOrgAuth = async () => {
  const session = await requireAuth();

  try {
    // Check if user has any organization memberships
    const userMemberships = await db.query.members.findMany({
      where: eq(members.userId, session.user.id),
      with: {
        organization: true,
      },
    });

    if (userMemberships.length === 0) {
      redirect("/onboarding");
    }

    // Get active organization from session or use first org
    let activeOrg = null;
    const sessionData = session.session as { activeOrganizationId?: string };

    if (sessionData.activeOrganizationId) {
      activeOrg = await db.query.organizations.findFirst({
        where: eq(organizations.id, sessionData.activeOrganizationId),
      });
    }

    // If no active org or it doesn't exist, use first membership's org
    if (!activeOrg && userMemberships.length > 0) {
      activeOrg = userMemberships[0].organization;
    }

    return {
      ...session,
      activeOrganization: activeOrg,
      memberships: userMemberships,
    };
  } catch (error) {
    if (isConnectionError(error)) {
      redirect("/offline");
    }
    throw error;
  }
};

export const requireGuest = async () => {
  try {
    const session = await getSession();
    if (session) {
      redirect("/dashboard");
    }
  } catch (error) {
    if (isConnectionError(error)) {
      redirect("/offline");
    }
    throw error;
  }
};
