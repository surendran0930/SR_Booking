import Link from "next/link";
import {
  AlertCircle,
  ClipboardList,
  FileText,
  IndianRupee,
  Package,
  Plus,
  Users,
  Wrench,
} from "lucide-react";

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
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMonthBounds } from "@/lib/dates";
import { shortId } from "@/lib/ids";
import { formatCurrency, formatDate, greetingForNow } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  const { start, end } = getCurrentMonthBounds();
  const supabase = await createClient();

  const [
    { count: totalCustomers },
    { count: totalInvoices },
    { data: salesRows },
    { data: serviceRows },
    { data: pendingRows },
    { count: activeTickets },
    { count: readyTickets },
    { data: recentInvoices },
    { data: recentCustomers },
  ] = await Promise.all([
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase.from("invoices").select("id", { count: "exact", head: true }),
    supabase
      .from("invoices")
      .select("grand_total")
      .eq("invoice_type", "SALES")
      .gte("invoice_date", start.toISOString())
      .lte("invoice_date", end.toISOString()),
    supabase
      .from("invoices")
      .select("grand_total")
      .eq("invoice_type", "SERVICE")
      .gte("invoice_date", start.toISOString())
      .lte("invoice_date", end.toISOString()),
    supabase
      .from("invoices")
      .select("balance_due")
      .in("payment_status", ["PENDING", "PARTIAL"]),
    supabase
      .from("service_tickets")
      .select("id", { count: "exact", head: true })
      .in("status", ["RECEIVED", "IN_PROGRESS"]),
    supabase
      .from("service_tickets")
      .select("id", { count: "exact", head: true })
      .eq("status", "READY"),
    supabase
      .from("invoices")
      .select("id, invoice_number, invoice_date, grand_total, payment_status, customer:customers(name)")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("customers")
      .select("id, name, phone, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const salesThisMonth = (salesRows ?? []).reduce((sum, r) => sum + Number(r.grand_total), 0);
  const serviceRevenueThisMonth = (serviceRows ?? []).reduce((sum, r) => sum + Number(r.grand_total), 0);
  const pendingPayments = (pendingRows ?? []).reduce((sum, r) => sum + Number(r.balance_due), 0);

  return (
    <div className="space-y-8">
      {/* No UI — keeps this page's stats and lists live as invoices/customers change. */}
      <RealtimeRefresher table="invoices" />
      <RealtimeRefresher table="customers" />
      <RealtimeRefresher table="service_tickets" />

      <PageHeader
        title={`${greetingForNow()}, ${session.name}`}
        description="Overview of your business activity"
      />

      {(readyTickets ?? 0) > 0 ? (
        <Link
          href="/admin/service-tickets?status=READY"
          className="flex items-center justify-between gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success transition-colors hover:bg-success/15"
        >
          <span>
            {readyTickets} printer{readyTickets === 1 ? "" : "s"} ready for pickup — call{" "}
            {readyTickets === 1 ? "the customer" : "the customers"} to collect
          </span>
          <span className="shrink-0">View →</span>
        </Link>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard icon={Users} label="Total Customers" value={totalCustomers ?? 0} />
        <StatCard icon={FileText} label="Total Invoices" value={totalInvoices ?? 0} />
        <StatCard
          icon={IndianRupee}
          label="Sales This Month"
          value={formatCurrency(salesThisMonth)}
        />
        <StatCard
          icon={Wrench}
          label="Service Revenue"
          value={formatCurrency(serviceRevenueThisMonth)}
          hint="This month"
        />
        <StatCard
          icon={AlertCircle}
          label="Pending Payments"
          value={formatCurrency(pendingPayments)}
        />
        <StatCard
          icon={ClipboardList}
          label="Active Service Tickets"
          value={activeTickets ?? 0}
          hint={`${readyTickets ?? 0} ready for pickup`}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/admin/service-tickets/new">
              <ClipboardList className="h-4 w-4" />
              New Service Ticket
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/customers/new">
              <Plus className="h-4 w-4" />
              New Customer
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/invoices/new?type=sales">Sales Invoice</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/invoices/new?type=service">Service Invoice</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/products/new">
              <Package className="h-4 w-4" />
              New Product
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/services/new">
              <Wrench className="h-4 w-4" />
              New Service
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Invoices</h2>
            <Button asChild variant="link" size="sm">
              <Link href="/admin/invoices">View all</Link>
            </Button>
          </div>
          <DataTableWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
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
                      <TableCell>{invoice.customer?.name}</TableCell>
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
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Customers</h2>
            <Button asChild variant="link" size="sm">
              <Link href="/admin/customers">View all</Link>
            </Button>
          </div>
          <DataTableWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!recentCustomers || recentCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No customers yet
                    </TableCell>
                  </TableRow>
                ) : (
                  recentCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-mono text-xs">{shortId(customer.id)}</TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {customer.name}
                        </Link>
                      </TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{formatDate(customer.created_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </DataTableWrapper>
        </section>
      </div>
    </div>
  );
}
