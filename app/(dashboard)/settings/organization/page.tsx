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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrganizationSettingsForm } from "@/components/organizations/organization-settings-form";
import { MembersList } from "@/components/organizations/members-list";
import { InvitationsForm } from "@/components/organizations/invitations-form";
import { db } from "@/db";
import { organizations, members, invitations } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Building2, Settings } from "lucide-react";

export default async function OrganizationSettingsPage() {
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {tSettings("title")}
        </h1>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex gap-2 border-b">
        <Link
          href="/settings"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          {tSettings("profile")}
        </Link>
        <Link
          href="/settings/organization"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 border-primary text-primary"
        >
          <Building2 className="h-4 w-4" />
          {t("organization")}
        </Link>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">{tSettings("title")}</TabsTrigger>
          <TabsTrigger value="members">{t("members")}</TabsTrigger>
          {isOwnerOrAdmin && (
            <TabsTrigger value="invitations">{t("invitations")}</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="settings">
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
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>{t("members")}</CardTitle>
              <CardDescription>
                {orgMembers.length} {t("members").toLowerCase()}
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
        </TabsContent>

        {isOwnerOrAdmin && (
          <TabsContent value="invitations">
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
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
