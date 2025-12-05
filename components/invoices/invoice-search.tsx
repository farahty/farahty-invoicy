"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface InvoiceSearchProps {
  defaultValue?: string;
}

export function InvoiceSearch({ defaultValue }: InvoiceSearchProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(defaultValue || "");

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
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <Input
        type="search"
        placeholder="Search invoices..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="pl-9 pr-9"
      />
      {search && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={() => setSearch("")}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
