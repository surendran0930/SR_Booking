import { requireStaff } from "@/lib/auth/guards";
import { AdminShell } from "@/components/layout/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStaff();
  return (
    <AdminShell userName={session.name} role={session.role}>
      {children}
    </AdminShell>
  );
}
