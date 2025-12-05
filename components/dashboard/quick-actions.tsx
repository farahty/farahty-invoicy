"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";

export function QuickActions() {
  const t = useTranslations();

  return (
    <div className="flex flex-wrap gap-3">
      <Link href="/invoices/new">
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          <span>{t("invoices.newInvoice")}</span>
        </Button>
      </Link>
      <Link href="/clients/new">
        <Button variant="outline" className="gap-2">
          <UserPlus className="h-4 w-4" />
          <span>{t("clients.newClient")}</span>
        </Button>
      </Link>
    </div>
  );
}
