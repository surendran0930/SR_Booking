import Link from "next/link";
import { FileText, IndianRupee, Receipt } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { DataTableWrapper } from "@/components/shared/data-table-wrapper";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCustomer } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate, greetingForNow } from "@/lib/utils";

export default async function CustomerDashboardPage() {
  const session = await requireCustomer();
  const customerId = session.customerId!;
  const supabase = await createClient();

  const [{ data: allInvoices }, { data: recentInvoices }] = await Promise.all([
    // RLS already scopes this to the caller's own customer_id, but we filter
    // explicitly too so the query intent is clear from the code alone.
    supabase
      .from("invoices")
      .select("id, grand_total, balance_due, payment_status")
      .eq("customer_id", customerId),
    supabase
      .from("invoices")
      .select("id, invoice_number, invoice_date, invoice_type, grand_total, payment_status")
      .eq("customer_id", customerId)
      .order("invoice_date", { ascending: false })
      .limit(5),
  ]);

  const invoices = allInvoices ?? [];
  const totalCount = invoices.length;
  const totalAmount = invoices.reduce((sum, i) => sum + Number(i.grand_total), 0);
  const pendingAmount = invoices
    .filter((i) => i.payment_status === "PENDING" || i.payment_status === "PARTIAL")
    .reduce((sum, i) => sum + Number(i.balance_due), 0);
  const lastInvoice = (recentInvoices ?? [])[0] ?? null;

  return (
    <div className="space-y-8">
      <RealtimeRefresher table="invoices" filter={`customer_id=eq.${customerId}`} />

      <PageHeader
        title={`${greetingForNow()}, ${session.name}`}
        description="Your invoices and account summary"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FileText} label="Total Invoices" value={totalCount} />
        <StatCard
          icon={IndianRupee}
          label="Total Amount"
          value={formatCurrency(totalAmount)}
        />
        <StatCard
          icon={Receipt}
          label="Pending Amount"
          value={formatCurrency(pendingAmount)}
        />
        <StatCard
          icon={FileText}
          label="Last Invoice"
          value={
            lastInvoice ? (
              <Link
                href={`/customer/invoices/${lastInvoice.id}`}
                className="text-primary hover:underline"
              >
                {lastInvoice.invoice_number}
              </Link>
            ) : (
              "—"
            )
          }
          hint={lastInvoice ? formatDate(lastInvoice.invoice_date) : undefined}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Invoices</CardTitle>
          <Button asChild variant="link" size="sm">
            <Link href="/customer/invoices">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <DataTableWrapper className="rounded-none border-0 shadow-none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!recentInvoices || recentInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No invoices yet
                    </TableCell>
                  </TableRow>
                ) : (
                  recentInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                      <TableCell>{invoice.invoice_type}</TableCell>
                      <TableCell>{formatCurrency(invoice.grand_total)}</TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={invoice.payment_status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="link" size="sm">
                          <Link href={`/customer/invoices/${invoice.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </DataTableWrapper>
        </CardContent>
      </Card>
    </div>
  );
}
