import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ClientForm } from "@/components/clients/client-form";

interface EditClientPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  const { id } = await params;
  const client = await getClient(id);

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href={`/clients/${client.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Client</h1>
          <p className="text-slate-600">{client.name}</p>
        </div>
      </div>

      <ClientForm client={client} />
    </div>
  );
}
