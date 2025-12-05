import { redirect } from "next/navigation";
import { requireOrgAuth } from "@/lib/session";
import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OrganizationSettingsForm } from "@/components/organizations/organization-settings-form";
import { MembersList } from "@/components/organizations/members-list";
import { InvitationsForm } from "@/components/organizations/invitations-form";
import { db } from "@/db";
import { organizations, members, invitations } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function SettingsPage() {
  const { activeOrganization, user } = await requireOrgAuth();
  const t = await getTranslations("organizations");
  const tSettings = await getTranslations("settings");

  if (!activeOrganization) {
    redirect("/onboarding");
  }

  // Get organization details
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, activeOrganization.id),
  });

  if (!org) {
    redirect("/onboarding");
  }

  // Get members
  const orgMembers = await db.query.members.findMany({
    where: eq(members.organizationId, activeOrganization.id),
    with: {
      user: true,
    },
  });

  // Get pending invitations
  const pendingInvitations = await db.query.invitations.findMany({
    where: eq(invitations.organizationId, activeOrganization.id),
  });

  // Check if current user is owner/admin
  const currentMember = orgMembers.find((m) => m.userId === user.id);
  const isOwnerOrAdmin =
    currentMember?.role === "owner" || currentMember?.role === "admin";

  const settings = {
    name: org.name,
    slug: org.slug,
    address: org.address,
    phone: org.phone,
    email: org.email,
    taxId: org.taxId,
    logoUrl: org.logo,
    invoicePrefix: org.invoicePrefix,
    invoiceNextNumber: org.invoiceNextNumber,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{tSettings("organization")}</h1>

      {/* Organization Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{tSettings("companyInfo")}</CardTitle>
          <CardDescription>
            {tSettings("companyInfoDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationSettingsForm settings={settings} />
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle>{t("members")}</CardTitle>
          <CardDescription>
            {orgMembers.length} {t("membersCount")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MembersList
            members={orgMembers}
            currentUserId={user.id}
            isOwnerOrAdmin={isOwnerOrAdmin}
          />
        </CardContent>
      </Card>

      {/* Invitations - Only for owners/admins */}
      {isOwnerOrAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>{t("inviteMember")}</CardTitle>
            <CardDescription>{t("inviteDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <InvitationsForm
              pendingInvitations={pendingInvitations}
              organizationId={activeOrganization.id}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
