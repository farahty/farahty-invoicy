import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ClientForm } from "@/components/clients/client-form";
import { getTranslations } from "next-intl/server";

export default async function NewClientPage() {
  const t = await getTranslations("clients");

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
          <h1 className="text-2xl font-bold text-foreground">
            {t("addClient")}
          </h1>
          <p className="text-muted-foreground">{t("createClient")}</p>
        </div>
      </div>

      <ClientForm />
    </div>
  );
}
