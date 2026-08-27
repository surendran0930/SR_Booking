import Link from "next/link";
import { FileText } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { DataTableWrapper } from "@/components/shared/data-table-wrapper";
import { EmptyState } from "@/components/shared/empty-state";
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
import { requireCustomer } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function CustomerInvoicesPage() {
  const session = await requireCustomer();
  const customerId = session.customerId!;
  const supabase = await createClient();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("customer_id", customerId)
    .order("invoice_date", { ascending: false });

  const rows = invoices ?? [];

  return (
    <div className="space-y-6">
      <RealtimeRefresher table="invoices" filter={`customer_id=eq.${customerId}`} />

      <PageHeader title="Invoices" description="View and download your invoices" />

      {rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description="Your invoices will appear here once created"
        />
      ) : (
        <DataTableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                  <TableCell>{invoice.invoice_type}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(invoice.grand_total)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(invoice.balance_due)}
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={invoice.payment_status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="link" size="sm">
                      <Link href={`/customer/invoices/${invoice.id}`}>View</Link>
                    </Button>
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
