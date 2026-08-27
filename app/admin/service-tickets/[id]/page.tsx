import Link from "next/link";
import { notFound } from "next/navigation";

import { ServiceTicketDetailActions } from "@/components/service-tickets/service-ticket-detail-actions";
import { ServiceTicketForm } from "@/components/service-tickets/service-ticket-form";
import { ServiceTicketStatusBadge } from "@/components/service-tickets/service-ticket-status-badge";
import { ServiceTicketStatusControl } from "@/components/service-tickets/service-ticket-status-control";
import { PageHeader } from "@/components/shared/page-header";
import { RealtimeRefresher } from "@/components/shared/realtime-refresher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
};

export default async function ServiceTicketDetailPage({ params, searchParams }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const { edit } = await searchParams;
  const isEdit = edit === "true";
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from("service_tickets")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!ticket) notFound();

  if (isEdit) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          title="Edit Service Ticket"
          description={ticket.ticket_number}
          actions={
            <Button asChild variant="outline">
              <Link href={`/admin/service-tickets/${id}`}>Cancel</Link>
            </Button>
          }
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Intake Details</CardTitle>
          </CardHeader>
          <CardContent>
            <ServiceTicketForm
              mode="edit"
              ticketId={id}
              defaultValues={{
                customerName: ticket.customer_name,
                phoneNumber: ticket.phone_number,
                printerBrand: ticket.printer_brand,
                printerModel: ticket.printer_model,
                serialNumber: ticket.serial_number ?? "",
                problemDescription: ticket.problem_description ?? "",
                notes: ticket.notes ?? "",
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RealtimeRefresher table="service_tickets" filter={`id=eq.${id}`} />

      <PageHeader
        title={ticket.ticket_number}
        description={`${ticket.customer_name} · ${ticket.phone_number}`}
        actions={<ServiceTicketDetailActions ticketId={id} />}
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">Status:</span>
        <ServiceTicketStatusBadge status={ticket.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Update Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceTicketStatusControl ticketId={id} status={ticket.status} />
          <p className="mt-2 text-xs text-muted-foreground">
            Mark this ticket &ldquo;Ready for Pickup&rdquo; once the device is fixed — that&rsquo;s
            your cue to call the customer.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Name:</span> {ticket.customer_name}
            </p>
            <p>
              <span className="text-muted-foreground">Phone:</span> {ticket.phone_number}
            </p>
            {ticket.customer_id ? (
              <p>
                <Link
                  href={`/admin/customers/${ticket.customer_id}`}
                  className="text-primary hover:underline"
                >
                  View customer record →
                </Link>
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Device</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Brand:</span> {ticket.printer_brand}
            </p>
            <p>
              <span className="text-muted-foreground">Model:</span> {ticket.printer_model}
            </p>
            {ticket.serial_number ? (
              <p>
                <span className="text-muted-foreground">Serial No:</span> {ticket.serial_number}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Problem / Complaint</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line text-sm text-muted-foreground">
            {ticket.problem_description || "—"}
          </p>
        </CardContent>
      </Card>

      {ticket.notes ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Internal Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{ticket.notes}</p>
          </CardContent>
        </Card>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Received {formatDate(ticket.received_at)}
        {ticket.ready_at ? ` · Ready ${formatDate(ticket.ready_at)}` : ""}
        {ticket.collected_at ? ` · Collected ${formatDate(ticket.collected_at)}` : ""}
      </p>
    </div>
  );
}
