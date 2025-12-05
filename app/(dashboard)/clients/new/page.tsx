import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ClientForm } from "@/components/clients/client-form";

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add Client</h1>
          <p className="text-slate-600">Create a new client</p>
        </div>
      </div>

      <ClientForm />
    </div>
  );
}
