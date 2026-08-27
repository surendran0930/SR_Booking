import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Pencil } from "lucide-react";

import { CustomerDeleteButton } from "@/components/customers/customer-delete-button";
import { CustomerForm } from "@/components/customers/customer-form";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { DataTableWrapper } from "@/components/shared/data-table-wrapper";
import { PaymentStatusBadge } from "@/components/shared/payment-status-badge";
import { RealtimeRefresher } from "@/components/shared/realtime-refresher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { shortId } from "@/lib/ids";
import { formatCurrency, formatDate } from "@/lib/utils";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
};

export default async function CustomerDetailPage({ params, searchParams }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const { edit } = await searchParams;
  const isEdit = edit === "true";
  const supabase = await createClient();

  const [{ data: customer }, { data: recentInvoices }, { data: allInvoices }] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("invoices")
      .select("*")
      .eq("customer_id", id)
      .order("invoice_date", { ascending: false })
      .limit(20),
    supabase.from("invoices").select("grand_total, balance_due").eq("customer_id", id),
  ]);

  if (!customer) notFound();

  const invoices = recentInvoices ?? [];
  const totalInvoices = allInvoices?.length ?? 0;
  const totalBilled = (allInvoices ?? []).reduce((sum, i) => sum + Number(i.grand_total), 0);
  const outstanding = (allInvoices ?? []).reduce((sum, i) => sum + Number(i.balance_due), 0);

  if (isEdit) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          title="Edit Customer"
          description={customer.name}
          actions={
            <Button asChild variant="outline">
              <Link href={`/admin/customers/${id}`}>Cancel</Link>
            </Button>
          }
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer Details</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerForm
              mode="edit"
              customerId={id}
              defaultValues={{
                customerType: customer.customer_type,
                name: customer.name,
                companyName: customer.company_name ?? "",
                phone: customer.phone,
                alternativePhone: customer.alternative_phone ?? "",
                email: customer.email ?? "",
                address: customer.address ?? "",
                city: customer.city ?? "",
                state: customer.state ?? "",
                pincode: customer.pincode ?? "",
                gstin: customer.gstin ?? "",
                notes: customer.notes ?? "",
                deviceType: customer.device_type,
                deviceModel: customer.device_model ?? "",
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RealtimeRefresher table="invoices" filter={`customer_id=eq.${id}`} />

      <PageHeader
        title={customer.name}
        description={
          customer.company_name ? `${customer.company_name} · ${customer.phone}` : customer.phone
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/customers/${id}?edit=true`}>
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/admin/invoices/new?type=sales&customerId=${id}`}>
                Sales Invoice
              </Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link href={`/admin/invoices/new?type=service&customerId=${id}`}>
                Service Invoice
              </Link>
            </Button>
            <CustomerDeleteButton
              customerId={id}
              customerName={customer.name}
              redirectTo="/admin/customers"
              variant="outline"
            />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={FileText} label="Total Invoices" value={totalInvoices} />
        <StatCard icon={FileText} label="Total Billed" value={formatCurrency(totalBilled)} />
        <StatCard icon={FileText} label="Outstanding" value={formatCurrency(outstanding)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">ID:</span>
              <span className="font-mono">{shortId(customer.id)}</span>
              <Badge variant="neutral">{customer.customer_type}</Badge>
            </div>
            {customer.company_name ? (
              <p>
                <span className="text-muted-foreground">Company:</span> {customer.company_name}
              </p>
            ) : null}
            <p>
              <span className="text-muted-foreground">Phone:</span> {customer.phone}
            </p>
            {customer.alternative_phone ? (
              <p>
                <span className="text-muted-foreground">Alt. Phone:</span>{" "}
                {customer.alternative_phone}
              </p>
            ) : null}
            {customer.email ? (
              <p>
                <span className="text-muted-foreground">Email:</span> {customer.email}
              </p>
            ) : null}
            {customer.gstin ? (
              <p>
                <span className="text-muted-foreground">GSTIN:</span> {customer.gstin}
              </p>
            ) : null}
            {customer.device_type ? (
              <p>
                <span className="text-muted-foreground">Device:</span>{" "}
                {customer.device_type.charAt(0) +
                  customer.device_type.slice(1).toLowerCase()}
                {customer.device_model ? ` · ${customer.device_model}` : ""}
              </p>
            ) : customer.device_model ? (
              <p>
                <span className="text-muted-foreground">Model:</span>{" "}
                {customer.device_model}
              </p>
            ) : null}
            {[customer.address, customer.city, customer.state, customer.pincode].filter(Boolean)
              .length > 0 ? (
              <p>
                <span className="text-muted-foreground">Address:</span>{" "}
                {[customer.address, customer.city, customer.state, customer.pincode]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            ) : null}
            {customer.notes ? (
              <p>
                <span className="text-muted-foreground">Notes:</span> {customer.notes}
              </p>
            ) : null}
            <p className="text-muted-foreground">
              Customer since {formatDate(customer.created_at)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTableWrapper className="rounded-none border-0 shadow-none">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No invoices yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                        <TableCell>{formatCurrency(invoice.grand_total)}</TableCell>
                        <TableCell>
                          <PaymentStatusBadge status={invoice.payment_status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="link" size="sm">
                            <Link href={`/admin/invoices/${invoice.id}`}>View</Link>
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
    </div>
  );
}
