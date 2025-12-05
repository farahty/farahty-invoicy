import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getInvoice } from "@/actions/invoices";
import { getClients } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { getTranslations } from "next-intl/server";

interface EditInvoicePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInvoicePage({
  params,
}: EditInvoicePageProps) {
  const { id } = await params;
  const [invoice, clients] = await Promise.all([getInvoice(id), getClients()]);
  const t = await getTranslations("invoices");

  if (!invoice) {
    notFound();
  }

  // Only allow editing draft invoices
  if (invoice.status !== "draft") {
    redirect(`/invoices/${id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/invoices/${invoice.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("editInvoice")}
          </h1>
          <p className="text-muted-foreground">{invoice.invoiceNumber}</p>
        </div>
      </div>

      <InvoiceForm clients={clients} invoice={invoice} />
    </div>
  );
}
