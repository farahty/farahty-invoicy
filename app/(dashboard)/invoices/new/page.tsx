import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { getClients } from "@/actions/clients";
import { getTranslations } from "next-intl/server";

interface NewInvoicePageProps {
  searchParams: Promise<{ clientId?: string }>;
}

export default async function NewInvoicePage({
  searchParams,
}: NewInvoicePageProps) {
  const { clientId } = await searchParams;
  const clients = await getClients();
  const t = await getTranslations("invoices");

  if (clients.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/invoices">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("newInvoice")}
            </h1>
          </div>
        </div>

        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">{t("needClientFirst")}</p>
          <Link href="/clients/new">
            <Button>{t("addFirstClient")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("newInvoice")}
          </h1>
          <p className="text-muted-foreground">{t("createNew")}</p>
        </div>
      </div>

      <InvoiceForm clients={clients} defaultClientId={clientId} />
    </div>
  );
}
