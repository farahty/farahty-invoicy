"use server";

import { db } from "@/db";
import { invitations, organizations, users } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";

export interface InvitationDetails {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  inviter: {
    id: string;
    name: string;
    email: string;
  };
}

export async function getInvitationDetails(
  invitationId: string
): Promise<
  { success: true; data: InvitationDetails } | { success: false; error: string }
> {
  try {
    const invitation = await db
      .select({
        id: invitations.id,
        email: invitations.email,
        role: invitations.role,
        status: invitations.status,
        expiresAt: invitations.expiresAt,
        organizationId: invitations.organizationId,
        organizationName: organizations.name,
        organizationSlug: organizations.slug,
        inviterId: invitations.inviterId,
        inviterName: users.name,
        inviterEmail: users.email,
      })
      .from(invitations)
      .innerJoin(
        organizations,
        eq(invitations.organizationId, organizations.id)
      )
      .innerJoin(users, eq(invitations.inviterId, users.id))
      .where(
        and(
          eq(invitations.id, invitationId),
          eq(invitations.status, "pending"),
          gt(invitations.expiresAt, new Date())
        )
      )
      .limit(1);

    if (invitation.length === 0) {
      return {
        success: false,
        error: "Invitation not found, expired, or already used",
      };
    }

    const inv = invitation[0];
    return {
      success: true,
      data: {
        id: inv.id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        expiresAt: inv.expiresAt,
        organization: {
          id: inv.organizationId,
          name: inv.organizationName,
          slug: inv.organizationSlug,
        },
        inviter: {
          id: inv.inviterId,
          name: inv.inviterName,
          email: inv.inviterEmail,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return { success: false, error: "Failed to fetch invitation details" };
  }
}
