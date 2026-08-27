import Link from "next/link";
import { Suspense } from "react";
import { Download, Eye, FileText, Printer } from "lucide-react";

import { CreateInvoiceDialog } from "@/components/invoices/create-invoice-dialog";
import { InvoiceFilters } from "@/components/invoices/invoice-filters";
import {
  buildInvoiceListHref,
  InvoicePagination,
} from "@/components/invoices/invoice-pagination";
import { DataTableWrapper } from "@/components/shared/data-table-wrapper";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { PaymentStatusBadge } from "@/components/shared/payment-status-badge";
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
import { INVOICES_PAGE_SIZE } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { moneyNumber } from "@/lib/money";

type PageProps = {
  searchParams: Promise<{
    search?: string;
    type?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
};

function parsePage(value?: string) {
  const page = Number(value ?? "1");
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function endOfDay(dateStr: string) {
  const date = new Date(dateStr);
  date.setHours(23, 59, 59, 999);
  return date;
}

// Escape characters meaningful to PostgREST's .or()/.ilike() filter syntax.
function escapeFilterTerm(value: string) {
  return value.replace(/[%,()]/g, (char) => `\\${char}`);
}

export default async function InvoicesPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;

  const search = params.search ?? "";
  const type = params.type ?? "ALL";
  const status = params.status ?? "ALL";
  const dateFrom = params.dateFrom ?? "";
  const dateTo = params.dateTo ?? "";
  const page = parsePage(params.page);

  const filterQuery = {
    search: search || undefined,
    type: type !== "ALL" ? type : undefined,
    status: status !== "ALL" ? status : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };

  const supabase = await createClient();

  let request = supabase
    .from("invoices")
    .select("*, customer:customers(name, company_name)", { count: "exact" })
    .order("invoice_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range((page - 1) * INVOICES_PAGE_SIZE, page * INVOICES_PAGE_SIZE - 1);

  if (search.trim()) {
    const term = escapeFilterTerm(search.trim());
    // PostgREST's .or() can't cleanly mix a base-table ilike with an
    // embedded-table ilike, so resolve matching customers first and fold
    // them into an `in` filter alongside the invoice-number match.
    const { data: matchingCustomers } = await supabase
      .from("customers")
      .select("id")
      .or(`name.ilike.%${term}%,company_name.ilike.%${term}%`);
    const orParts = [`invoice_number.ilike.%${term}%`];
    if (matchingCustomers && matchingCustomers.length > 0) {
      orParts.push(`customer_id.in.(${matchingCustomers.map((c) => c.id).join(",")})`);
    }
    request = request.or(orParts.join(","));
  }

  if (type === "SALES" || type === "SERVICE") {
    request = request.eq("invoice_type", type);
  }

  if (status === "PAID" || status === "PARTIAL" || status === "PENDING") {
    request = request.eq("payment_status", status);
  }

  if (dateFrom) {
    request = request.gte("invoice_date", new Date(dateFrom).toISOString());
  }

  if (dateTo) {
    request = request.lte("invoice_date", endOfDay(dateTo).toISOString());
  }

  const { data: invoices, count: totalCount } = await request;
  const rows = invoices ?? [];
  const totalPages = Math.max(1, Math.ceil((totalCount ?? 0) / INVOICES_PAGE_SIZE));

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <RealtimeRefresher table="invoices" />

      <PageHeader
        title="Invoices"
        description="Manage sales and service invoices, payments, and PDF exports."
        actions={
          <CreateInvoiceDialog
            trigger={
              <Button>
                <FileText className="h-4 w-4" />
                + Create Invoice
              </Button>
            }
          />
        }
      />

      <Suspense fallback={null}>
        <InvoiceFilters
          defaultSearch={search}
          defaultType={type}
          defaultStatus={status}
          defaultDateFrom={dateFrom}
          defaultDateTo={dateTo}
        />
      </Suspense>

      {rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices found"
          description={
            (totalCount ?? 0) === 0 && !search && type === "ALL" && status === "ALL"
              ? "Create your first invoice to get started."
              : "Try adjusting your search or filters."
          }
          action={(totalCount ?? 0) === 0 && !search ? <CreateInvoiceDialog /> : undefined}
        />
      ) : (
        <DataTableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice No</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">GST</TableHead>
                <TableHead className="text-right">Grand Total</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>
                    <div>
                      <p>{invoice.customer?.name}</p>
                      {invoice.customer?.company_name ? (
                        <p className="text-xs text-muted-foreground">
                          {invoice.customer.company_name}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{invoice.invoice_type === "SALES" ? "Sales" : "Service"}</TableCell>
                  <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(moneyNumber(invoice.subtotal))}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(moneyNumber(invoice.gst_total))}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(moneyNumber(invoice.grand_total))}
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={invoice.payment_status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link
                          href={`/admin/invoices/${invoice.id}`}
                          aria-label={`View ${invoice.invoice_number}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link
                          href={`/admin/invoices/${invoice.id}?print=1`}
                          aria-label={`Print ${invoice.invoice_number}`}
                        >
                          <Printer className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <a
                          href={`/api/invoices/${invoice.id}/pdf`}
                          download={`${invoice.invoice_number}.pdf`}
                          aria-label={`Download PDF for ${invoice.invoice_number}`}
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <InvoicePagination
            currentPage={page}
            totalPages={totalPages}
            buildHref={(nextPage) => buildInvoiceListHref(filterQuery, nextPage)}
          />
        </DataTableWrapper>
      )}
    </div>
  );
}
