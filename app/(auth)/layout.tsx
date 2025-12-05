import { requireGuest } from "@/lib/session";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireGuest();

  return <>{children}</>;
}
