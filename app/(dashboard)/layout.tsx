import { requireAuth } from "@/lib/session";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }}
      />

      {/* Main Content */}
      <main className="lg:pl-64">
        {/* Mobile top padding for header */}
        <div className="pt-14 lg:pt-0">
          {/* Mobile bottom padding for navigation */}
          <div className="pb-16 lg:pb-0">
            <div className="p-4 md:p-6 lg:p-8">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
