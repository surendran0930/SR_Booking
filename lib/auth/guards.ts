import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "@/lib/auth/session";

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "ADMIN") {
    redirect("/customer/dashboard");
  }
  return session;
}

export async function requireCustomer(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "CUSTOMER") {
    redirect("/admin/dashboard");
  }
  if (!session.customerId) {
    redirect("/login");
  }
  return session;
}
