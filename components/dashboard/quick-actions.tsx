import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus } from "lucide-react";

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <Link href="/invoices/new">
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          <span>New Invoice</span>
        </Button>
      </Link>
      <Link href="/clients/new">
        <Button variant="outline" className="gap-2">
          <UserPlus className="h-4 w-4" />
          <span>Add Client</span>
        </Button>
      </Link>
    </div>
  );
}
