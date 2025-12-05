"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface InvoiceSearchProps {
  defaultValue?: string;
}

export function InvoiceSearch({ defaultValue }: InvoiceSearchProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(defaultValue || "");
  const t = useTranslations("invoices");

  useEffect(() => {
    const timeout = setTimeout(() => {
      startTransition(() => {
        const params = new URLSearchParams(window.location.search);
        if (search) {
          params.set("search", search);
        } else {
          params.delete("search");
        }
        router.push(`/invoices?${params.toString()}`);
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, router]);

  return (
    <div className="relative">
      <Search
        className={`absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${
          isPending ? "animate-pulse" : ""
        }`}
      />
      <Input
        type="search"
        placeholder={t("searchPlaceholder")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="ps-9 pe-9"
      />
      {search && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute end-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={() => setSearch("")}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
