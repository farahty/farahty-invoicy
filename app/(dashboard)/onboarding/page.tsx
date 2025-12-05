import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { CreateOrgForm } from "@/components/organizations/create-org-form";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function OnboardingPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Check if user already has organizations
  const orgs = await auth.api.listOrganizations({
    headers: await headers(),
  });

  // If user has organizations, redirect to dashboard
  if (orgs && orgs.length > 0) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <CreateOrgForm isOnboarding={true} />
    </div>
  );
}
