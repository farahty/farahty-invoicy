import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { members, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

export const getSession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
});

export const requireAuth = async () => {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
};

// Check if user has any organizations, redirect to onboarding if not
export const requireOrgAuth = async () => {
  const session = await requireAuth();

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
};

export const requireGuest = async () => {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }
};
