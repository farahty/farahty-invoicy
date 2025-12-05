"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Loader2, Building2, Check, X } from "lucide-react";
import { organization, useSession } from "@/lib/auth-client";

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
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations("organizations");
  const { data: session, isPending } = useSession();

  useEffect(() => {
    params.then((p) => setInvitationId(p.id));
  }, [params]);

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
      router.push("/dashboard");
    } catch {
      toast.error(t("declineError"));
    } finally {
      setIsDeclining(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    // Redirect to login with return URL
    router.push(`/login?callbackUrl=/accept-invitation/${invitationId}`);
    return null;
  }

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
            <Button onClick={() => router.push("/dashboard")}>
              {t("goToDashboard")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl">{t("acceptInvitation")}</CardTitle>
          <CardDescription>{t("acceptInvitationDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            {t("acceptInvitationDescription")}
          </p>
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
            {t("acceptInvitation")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
