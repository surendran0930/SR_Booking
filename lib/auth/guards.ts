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

// Staff = ADMIN (management, sees everything) or MERCHANT (a friend/partner
// running their own book of clients under the same app — sees only the
// customers/tickets/invoices/catalog rows they own, enforced by RLS via
// merchant_id, not by this guard). Use this for the shared /admin/* pages
// and actions; use requireAdmin() only for truly management-only things
// (business settings, creating/removing merchant accounts).
export async function requireStaff(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "ADMIN" && session.role !== "MERCHANT") {
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
