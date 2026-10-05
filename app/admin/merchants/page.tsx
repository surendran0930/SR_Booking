import Link from "next/link";
import { Plus, Store } from "lucide-react";

import { MerchantDeleteButton } from "@/components/merchants/merchant-delete-button";
import { PageHeader } from "@/components/shared/page-header";
import { DataTableWrapper } from "@/components/shared/data-table-wrapper";
import { EmptyState } from "@/components/shared/empty-state";
import { RealtimeRefresher } from "@/components/shared/realtime-refresher";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export default async function AdminMerchantsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: merchants } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "MERCHANT")
    .order("created_at", { ascending: false });

  const rows = merchants ?? [];

  return (
    <div className="space-y-6">
      <RealtimeRefresher table="profiles" />

      <PageHeader
        title="Merchants"
        description="Friends and partners with their own login — each only sees the customers, tickets, invoices, and catalog items they add"
        actions={
          <Button asChild>
            <Link href="/admin/merchants/new">
              <Plus className="h-4 w-4" />
              New Merchant
            </Link>
          </Button>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No merchants yet"
          description="Give a friend or partner their own login to add customers, tickets, and invoices under themselves."
          action={
            <Button asChild>
              <Link href="/admin/merchants/new">Add Merchant</Link>
            </Button>
          }
        />
      ) : (
        <DataTableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((merchant) => (
                <TableRow key={merchant.id}>
                  <TableCell className="font-medium">{merchant.name}</TableCell>
                  <TableCell>{merchant.email}</TableCell>
                  <TableCell>{merchant.phone ?? "—"}</TableCell>
                  <TableCell>{formatDate(merchant.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <MerchantDeleteButton
                      merchantId={merchant.id}
                      merchantName={merchant.name}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableWrapper>
      )}
    </div>
  );
}
