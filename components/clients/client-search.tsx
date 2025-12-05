"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface ClientSearchProps {
  defaultValue?: string;
}

export function ClientSearch({ defaultValue }: ClientSearchProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(defaultValue || "");
  const t = useTranslations("clients");

  useEffect(() => {
    const timeout = setTimeout(() => {
      startTransition(() => {
        if (search) {
          router.push(`/clients?search=${encodeURIComponent(search)}`);
        } else {
          router.push("/clients");
        }
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
