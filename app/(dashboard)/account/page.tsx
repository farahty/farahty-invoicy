import { requireAuth } from "@/lib/session";
import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserAccountForm } from "@/components/settings/user-account-form";

export default async function AccountPage() {
  const session = await requireAuth();
  const tSettings = await getTranslations("settings");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{tSettings("accountSettings")}</h1>

      {/* User Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{tSettings("personalInfo")}</CardTitle>
          <CardDescription>
            {tSettings("personalInfoDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserAccountForm
            user={{
              id: session.user.id,
              name: session.user.name,
              email: session.user.email,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
