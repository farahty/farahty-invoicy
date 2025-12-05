import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

export const getSession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
});

export const requireAuth = async () => {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
};

export const requireGuest = async () => {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }
};
