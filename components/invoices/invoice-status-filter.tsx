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

interface InvoiceStatusFilterProps {
  currentStatus?: InvoiceStatus;
}

const statuses: { value: string; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

export function InvoiceStatusFilter({
  currentStatus,
}: InvoiceStatusFilterProps) {
  const router = useRouter();

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
        <SelectValue placeholder="Filter by status" />
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
