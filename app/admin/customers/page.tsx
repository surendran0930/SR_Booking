import { Suspense } from "react";
import Link from "next/link";
import { Plus, Users } from "lucide-react";

import { CustomerDeleteButton } from "@/components/customers/customer-delete-button";
import { PageHeader } from "@/components/shared/page-header";
import { DataTableWrapper } from "@/components/shared/data-table-wrapper";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { RealtimeRefresher } from "@/components/shared/realtime-refresher";
import { UrlSearchBar } from "@/components/shared/url-search-bar";
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
import { shortId } from "@/lib/ids";
import { formatCurrency } from "@/lib/utils";

const PAGE_SIZE = 15;

type PageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

// Escape characters that are meaningful inside a PostgREST `.or()` filter
// string so a search term like "O'Brien, Inc" can't break the filter syntax.
function escapeOrTerm(value: string) {
  return value.replace(/[%,()]/g, (char) => `\\${char}`);
}

export default async function AdminCustomersPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const query = q?.trim() ?? "";
  const supabase = await createClient();

  let request = supabase
    .from("customers")
    .select("*, invoice_count:invoices(count)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (query) {
    const term = escapeOrTerm(query);
    request = request.or(
      `name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%,gstin.ilike.%${term}%`,
    );
  }

  const { data: customers, count: total } = await request;
  const rows = customers ?? [];

  const customerIds = rows.map((c) => c.id);
  const { data: outstandingRows } =
    customerIds.length > 0
      ? await supabase.rpc("customer_outstanding_totals", { customer_ids: customerIds })
      : { data: [] as { customer_id: string; total_balance_due: number }[] };

  const outstandingMap = new Map(
    (outstandingRows ?? []).map((row) => [row.customer_id, Number(row.total_balance_due)]),
  );

  const totalPages = Math.max(1, Math.ceil((total ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <RealtimeRefresher table="customers" />
      <RealtimeRefresher table="invoices" />

      <PageHeader
        title="Customers"
        description="Manage customer records and billing"
        actions={
          <Button asChild>
            <Link href="/admin/customers/new">
              <Plus className="h-4 w-4" />
              New Customer
            </Link>
          </Button>
        }
      />

      <Suspense fallback={null}>
        <UrlSearchBar
          placeholder="Search name, phone, email, or GSTIN…"
          className="max-w-md"
        />
      </Suspense>

      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title={query ? "No customers found" : "No customers yet"}
          description={
            query ? "Try a different search term" : "Add your first customer to get started"
          }
          action={
            !query ? (
              <Button asChild>
                <Link href="/admin/customers/new">Add Customer</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <DataTableWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead className="text-right">Invoices</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-mono text-xs">{shortId(customer.id)}</TableCell>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.company_name ?? "—"}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.email ?? "—"}</TableCell>
                    <TableCell>{customer.gstin ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {customer.invoice_count?.[0]?.count ?? 0}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(outstandingMap.get(customer.id) ?? 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="link" size="sm">
                          <Link href={`/admin/customers/${customer.id}`}>View</Link>
                        </Button>
                        <Button asChild variant="link" size="sm">
                          <Link href={`/admin/customers/${customer.id}?edit=true`}>Edit</Link>
                        </Button>
                        <Button asChild variant="link" size="sm">
                          <Link href={`/admin/invoices/new?customerId=${customer.id}`}>
                            Invoice
                          </Link>
                        </Button>
                        <CustomerDeleteButton
                          customerId={customer.id}
                          customerName={customer.name}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTableWrapper>

          <Pagination
            page={page}
            totalPages={totalPages}
            basePath="/admin/customers"
            searchParams={{ q: query || undefined }}
          />
        </>
      )}
    </div>
  );
}
