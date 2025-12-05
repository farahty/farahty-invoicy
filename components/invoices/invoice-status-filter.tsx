"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InvoiceStatus } from "@/db/schema";
import { useTranslations } from "next-intl";

interface InvoiceStatusFilterProps {
  currentStatus?: InvoiceStatus;
}

export function InvoiceStatusFilter({
  currentStatus,
}: InvoiceStatusFilterProps) {
  const router = useRouter();
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");

  const statuses: { value: string; label: string }[] = [
    { value: "all", label: tCommon("all") },
    { value: "draft", label: t("statuses.draft") },
    { value: "sent", label: t("statuses.sent") },
    { value: "paid", label: t("statuses.paid") },
    { value: "overdue", label: t("statuses.overdue") },
    { value: "cancelled", label: t("statuses.cancelled") },
  ];

  const handleChange = (value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    router.push(`/invoices?${params.toString()}`);
  };

  return (
    <Select value={currentStatus || "all"} onValueChange={handleChange}>
      <SelectTrigger className="w-full sm:w-40">
        <SelectValue placeholder={t("filterByStatus")} />
      </SelectTrigger>
      <SelectContent>
        {statuses.map((status) => (
          <SelectItem key={status.value} value={status.value}>
            {status.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
