"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Building2,
  Check,
  X,
  Mail,
  User,
  LogIn,
  UserPlus,
} from "lucide-react";
import { organization, useSession } from "@/lib/auth-client";
import { getInvitationDetails, InvitationDetails } from "@/actions/invitations";

interface AcceptInvitationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function AcceptInvitationPage({
  params,
}: AcceptInvitationPageProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [invitationId, setInvitationId] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const t = useTranslations("organizations");
  const { data: session, isPending: isSessionPending } = useSession();

  // Load invitation ID from params
  useEffect(() => {
    params.then((p) => setInvitationId(p.id));
  }, [params]);

  // Load invitation details when ID is available
  useEffect(() => {
    async function loadInvitation() {
      if (!invitationId) return;

      setIsLoading(true);
      const result = await getInvitationDetails(invitationId);

      if (result.success) {
        setInvitation(result.data);
      } else {
        setError(result.error);
      }
      setIsLoading(false);
    }

    loadInvitation();
  }, [invitationId]);

  const handleAccept = async () => {
    if (!invitationId) return;

    setIsAccepting(true);
    try {
      const result = await organization.acceptInvitation({
        invitationId,
      });

      if (result.error) {
        setError(result.error.message || t("invitationExpired"));
        return;
      }

      toast.success(t("invitationAccepted"));
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(t("invitationExpired"));
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!invitationId) return;

    setIsDeclining(true);
    try {
      const result = await organization.rejectInvitation({
        invitationId,
      });

      if (result.error) {
        toast.error(result.error.message || t("declineError"));
        return;
      }

      toast.success(t("invitationDeclined"));
      router.push(session ? "/dashboard" : "/login");
    } catch {
      toast.error(t("declineError"));
    } finally {
      setIsDeclining(false);
    }
  };

  // Loading state
  if (isLoading || isSessionPending || !invitationId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-2">
              <X className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-xl">{t("invalidInvitation")}</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button
              onClick={() => router.push(session ? "/dashboard" : "/login")}
            >
              {session ? t("goToDashboard") : t("goToLogin")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // User is logged in - show confirmation
  if (session && invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl">{t("acceptInvitation")}</CardTitle>
            <CardDescription>
              {t("invitedToJoin", {
                organization: invitation.organization.name,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("organization")}
                  </p>
                  <p className="font-medium">{invitation.organization.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("invitedBy")}
                  </p>
                  <p className="font-medium">{invitation.inviter.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("role")}</p>
                  <p className="font-medium capitalize">{invitation.role}</p>
                </div>
              </div>
            </div>

            {session.user.email !== invitation.email && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  {t("emailMismatchWarning", {
                    invitedEmail: invitation.email,
                    currentEmail: session.user.email,
                  })}
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDecline}
              disabled={isDeclining || isAccepting}
            >
              {isDeclining && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t("declineInvitation")}
            </Button>
            <Button
              className="flex-1"
              onClick={handleAccept}
              disabled={isAccepting || isDeclining}
            >
              {isAccepting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              <Check className="me-2 h-4 w-4" />
              {t("acceptInvitation")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // User is not logged in - show login/register options
  if (!session && invitation) {
    const loginUrl = `/login?invitationId=${invitationId}&email=${encodeURIComponent(
      invitation.email
    )}`;
    const registerUrl = `/register?invitationId=${invitationId}&email=${encodeURIComponent(
      invitation.email
    )}`;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl">{t("youreInvited")}</CardTitle>
            <CardDescription>
              {t("invitedToJoinDescription", {
                inviter: invitation.inviter.name,
                organization: invitation.organization.name,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("organization")}
                  </p>
                  <p className="font-medium">{invitation.organization.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("invitedAs")}
                  </p>
                  <p className="font-medium">{invitation.email}</p>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              {t("loginOrRegisterToAccept")}
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Link href={loginUrl} className="w-full">
              <Button className="w-full" variant="default">
                <LogIn className="me-2 h-4 w-4" />
                {t("loginToAccept")}
              </Button>
            </Link>
            <Link href={registerUrl} className="w-full">
              <Button className="w-full" variant="outline">
                <UserPlus className="me-2 h-4 w-4" />
                {t("createAccountToAccept")}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return null;
}
