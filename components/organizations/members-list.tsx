"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreVertical, Trash2, Loader2 } from "lucide-react";
import { organization } from "@/lib/auth-client";

interface Member {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

interface MembersListProps {
  members: Member[];
  currentUserId: string;
  isOwnerOrAdmin: boolean;
}

export function MembersList({
  members,
  currentUserId,
  isOwnerOrAdmin,
}: MembersListProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const router = useRouter();
  const t = useTranslations("organizations");

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner":
        return "default";
      case "admin":
        return "secondary";
      default:
        return "outline";
    }
  };

  const handleRemoveMember = (member: Member) => {
    setMemberToRemove(member);
    setShowConfirm(true);
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;

    setRemovingId(memberToRemove.id);
    try {
      const result = await organization.removeMember({
        memberIdOrEmail: memberToRemove.userId,
      });

      if (result.error) {
        toast.error(result.error.message || t("removeMemberError"));
        return;
      }

      toast.success(t("memberRemoved"));
      router.refresh();
    } catch {
      toast.error(t("removeMemberError"));
    } finally {
      setRemovingId(null);
      setShowConfirm(false);
      setMemberToRemove(null);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {members.map((member) => {
          const initials = member.user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          const isCurrentUser = member.userId === currentUserId;
          const isOwner = member.role === "owner";
          const canRemove = isOwnerOrAdmin && !isCurrentUser && !isOwner;

          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{member.user.name}</p>
                    {isCurrentUser && (
                      <Badge variant="outline" className="text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {member.user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getRoleBadgeVariant(member.role)}>
                  {t(`roles.${member.role}`)}
                </Badge>
                {canRemove && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        {removingId === member.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreVertical className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="bottom">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleRemoveMember(member)}
                      >
                        <Trash2 className="me-2 h-4 w-4" />
                        {t("removeMember")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("removeMember")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("removeMemberConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("removeMember")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
