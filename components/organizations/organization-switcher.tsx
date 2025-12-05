"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  Check,
  ChevronsUpDown,
  Plus,
  Settings,
  Loader2,
} from "lucide-react";
import {
  useActiveOrganization,
  useListOrganizations,
  organization,
} from "@/lib/auth-client";
import { CreateOrgForm } from "./create-org-form";

export function OrganizationSwitcher() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const router = useRouter();
  const t = useTranslations("organizations");

  const { data: activeOrg, isPending: isLoadingActive } =
    useActiveOrganization();
  const { data: orgList, isPending: isLoadingList } = useListOrganizations();

  // Set active organization on mount if none is set
  useEffect(() => {
    async function setInitialOrg() {
      if (
        !isLoadingActive &&
        !isLoadingList &&
        !activeOrg &&
        orgList &&
        orgList.length > 0
      ) {
        try {
          await organization.setActive({
            organizationId: orgList[0].id,
          });
          router.refresh();
        } catch {
          console.error("Failed to set initial organization");
        }
      }
    }
    setInitialOrg();
  }, [activeOrg, orgList, isLoadingActive, isLoadingList, router]);

  const handleSwitchOrganization = async (orgId: string) => {
    if (orgId === activeOrg?.id) return;

    setIsSwitching(true);
    try {
      await organization.setActive({
        organizationId: orgId,
      });
      toast.success(t("switchedOrg"));
      router.refresh();
    } catch {
      toast.error(t("switchError"));
    } finally {
      setIsSwitching(false);
    }
  };

  const isLoading = isLoadingActive || isLoadingList;

  if (isLoading) {
    return (
      <Button variant="ghost" className="w-full justify-between" disabled>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-muted-foreground">{t("loading")}</span>
        </div>
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between px-2 py-6"
            disabled={isSwitching}
          >
            <div className="flex items-center gap-2 truncate">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="flex flex-col items-start truncate">
                <span className="truncate font-medium">
                  {activeOrg?.name || t("selectOrganization")}
                </span>
                {activeOrg?.slug && (
                  <span className="text-xs text-muted-foreground truncate">
                    {activeOrg.slug}
                  </span>
                )}
              </div>
            </div>
            {isSwitching ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[240px]">
          <DropdownMenuLabel>{t("organizations")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {orgList?.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => handleSwitchOrganization(org.id)}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-2 flex-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted">
                  <Building2 className="h-3 w-3" />
                </div>
                <span className="truncate">{org.name}</span>
              </div>
              {org.id === activeOrg?.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowCreateDialog(true)}
            className="cursor-pointer"
          >
            <Plus className="me-2 h-4 w-4" />
            {t("createOrganization")}
          </DropdownMenuItem>
          {activeOrg && (
            <DropdownMenuItem
              onClick={() => router.push("/settings/organization")}
              className="cursor-pointer"
            >
              <Settings className="me-2 h-4 w-4" />
              {t("organizationSettings")}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("createOrganization")}</DialogTitle>
          </DialogHeader>
          <CreateOrgForm
            onSuccess={() => {
              setShowCreateDialog(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
