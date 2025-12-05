"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ClientSearchProps {
  defaultValue?: string;
}

export function ClientSearch({ defaultValue }: ClientSearchProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(defaultValue || "");

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
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <Input
        type="search"
        placeholder="Search clients..."
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
