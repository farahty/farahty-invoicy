import Link from "next/link";
import { getClients } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Users, Search, Phone, Mail, MapPin } from "lucide-react";
import { ClientSearch } from "@/components/clients/client-search";
import { ClientActions } from "@/components/clients/client-actions";

interface ClientsPageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const { search } = await searchParams;
  const clients = await getClients(search);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Clients
          </h1>
          <p className="text-slate-600 mt-1">Manage your client information</p>
        </div>
        <Link href="/clients/new">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
        </Link>
      </div>

      {/* Search */}
      <ClientSearch defaultValue={search} />

      {/* Client List */}
      {clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-slate-400" />
            </div>
            {search ? (
              <>
                <p className="text-slate-600 mb-2">
                  No clients found for &quot;{search}&quot;
                </p>
                <Link href="/clients">
                  <Button variant="outline">Clear search</Button>
                </Link>
              </>
            ) : (
              <>
                <p className="text-slate-600 mb-4">
                  You haven&apos;t added any clients yet
                </p>
                <Link href="/clients/new">
                  <Button>Add your first client</Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">
                      Phone
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">
                      Location
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="py-3 px-4">
                        <Link
                          href={`/clients/${client.id}`}
                          className="font-medium text-slate-900 hover:text-slate-600"
                        >
                          {client.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {client.email || "-"}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {client.phone || "-"}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
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
          <div className="md:hidden space-y-3">
            {clients.map((client) => (
              <Link key={client.id} href={`/clients/${client.id}`}>
                <Card className="hover:bg-slate-50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium text-slate-900">
                        {client.name}
                      </h3>
                      <ClientActions client={client} />
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                      {client.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      {(client.city || client.country) && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-400" />
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
