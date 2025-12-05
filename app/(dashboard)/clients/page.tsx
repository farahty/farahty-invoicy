import Link from "next/link";
import { getClients } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Users, Phone, Mail, MapPin } from "lucide-react";
import { ClientSearch } from "@/components/clients/client-search";
import { ClientActions } from "@/components/clients/client-actions";
import { getTranslations } from "next-intl/server";

interface ClientsPageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const { search } = await searchParams;
  const clients = await getClients(search);
  const t = await getTranslations("clients");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {t("title")}
          </h1>
        </div>
        <Link href="/clients/new">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            {t("newClient")}
          </Button>
        </Link>
      </div>

      {/* Search */}
      <ClientSearch defaultValue={search} />

      {/* Client List */}
      {clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            {search ? (
              <>
                <p className="text-muted-foreground mb-2">{t("noClients")}</p>
                <Link href="/clients">
                  <Button variant="outline">{t("searchPlaceholder")}</Button>
                </Link>
              </>
            ) : (
              <>
                <p className="text-muted-foreground mb-4">
                  {t("noClientsDescription")}
                </p>
                <Link href="/clients/new">
                  <Button>{t("newClient")}</Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <Card className="hidden md:block pt-0 overflow-hidden">
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-start py-3 px-4 text-sm font-medium text-muted-foreground">
                      {t("name")}
                    </th>
                    <th className="text-start py-3 px-4 text-sm font-medium text-muted-foreground">
                      {t("email")}
                    </th>
                    <th className="text-start py-3 px-4 text-sm font-medium text-muted-foreground">
                      {t("phone")}
                    </th>
                    <th className="text-start py-3 px-4 text-sm font-medium text-muted-foreground">
                      {t("location")}
                    </th>
                    <th className="text-end py-3 px-4 text-sm font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      className="border-b border-border/50 last:border-0 hover:bg-accent"
                    >
                      <td className="py-3 px-4">
                        <Link
                          href={`/clients/${client.id}`}
                          className="font-medium text-foreground hover:text-muted-foreground"
                        >
                          {client.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {client.email || "-"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {client.phone || "-"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {[client.city, client.country]
                          .filter(Boolean)
                          .join(", ") || "-"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <ClientActions client={client} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Mobile Card List */}
          <div className="md:hidden gap-4 flex flex-col">
            {clients.map((client) => (
              <Link key={client.id} href={`/clients/${client.id}`}>
                <Card className="hover:bg-accent transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium text-foreground">
                        {client.name}
                      </h3>
                      <ClientActions client={client} />
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {client.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      {(client.city || client.country) && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {[client.city, client.country]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
