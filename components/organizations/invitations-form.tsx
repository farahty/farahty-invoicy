"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Mail, Clock } from "lucide-react";
import { organization } from "@/lib/auth-client";

const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  role: z.enum(["admin", "member"]),
});

type InviteForm = z.infer<typeof inviteSchema>;

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date;
  organizationId: string;
}

interface InvitationsFormProps {
  pendingInvitations: Invitation[];
  organizationId: string;
}

export function InvitationsForm({ pendingInvitations }: InvitationsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations("organizations");

  const form = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const onSubmit = async (data: InviteForm) => {
    setIsLoading(true);
    try {
      const result = await organization.inviteMember({
        email: data.email,
        role: data.role,
      });

      if (result.error) {
        toast.error(result.error.message || t("invitationError"));
        return;
      }

      toast.success(t("invitationSent"));
      form.reset();
      router.refresh();
    } catch {
      toast.error(t("invitationError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    setCancellingId(invitationId);
    try {
      const result = await organization.cancelInvitation({
        invitationId,
      });

      if (result.error) {
        toast.error(result.error.message || t("cancelError"));
        return;
      }

      toast.success(t("invitationCancelled"));
      router.refresh();
    } catch {
      toast.error(t("cancelError"));
    } finally {
      setCancellingId(null);
    }
  };

  const pendingOnly = pendingInvitations.filter((i) => i.status === "pending");
  const now = new Date();

  const isExpired = (expiresAt: Date) => new Date(expiresAt) < now;

  return (
    <div className="space-y-6">
      {/* Invite Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>{t("inviteEmail")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t("inviteEmailPlaceholder")}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="w-32">
                  <FormLabel>{t("inviteRole")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">{t("roles.admin")}</SelectItem>
                      <SelectItem value="member">
                        {t("roles.member")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t("sendInvitation")}
          </Button>
        </form>
      </Form>

      {/* Pending Invitations */}
      {pendingOnly.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium">{t("pendingInvitations")}</h4>
          <div className="space-y-2">
            {pendingOnly.map((invitation) => {
              const expired = isExpired(invitation.expiresAt);
              return (
                <div
                  key={invitation.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    expired
                      ? "bg-destructive/5 border-destructive/20"
                      : "bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock
                          className={`h-3 w-3 ${
                            expired ? "text-destructive" : ""
                          }`}
                        />
                        <span className={expired ? "text-destructive" : ""}>
                          {expired
                            ? t("expired")
                            : `${t("expiresOn")} ${new Date(
                                invitation.expiresAt
                              ).toLocaleDateString()}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {expired ? (
                      <Badge variant="destructive">{t("expired")}</Badge>
                    ) : (
                      <Badge variant="outline">
                        {t(`roles.${invitation.role}`)}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCancelInvitation(invitation.id)}
                      disabled={cancellingId === invitation.id}
                    >
                      {cancellingId === invitation.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pendingOnly.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {t("noPendingInvitations")}
        </p>
      )}
    </div>
  );
}
