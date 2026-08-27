import { requireCustomer } from "@/lib/auth/guards";
import { CustomerShell } from "@/components/layout/customer-shell";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireCustomer();
  return <CustomerShell userName={session.name}>{children}</CustomerShell>;
}
