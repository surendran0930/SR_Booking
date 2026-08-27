import Link from "next/link";
import { Suspense } from "react";
import { ClipboardList, Eye, Printer, Tag } from "lucide-react";

import { ServiceTicketFilters } from "@/components/service-tickets/service-ticket-filters";
import { ServiceTicketStatusBadge } from "@/components/service-tickets/service-ticket-status-badge";
import { DataTableWrapper } from "@/components/shared/data-table-wrapper";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
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
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { ServiceTicketStatus, type ServiceTicketStatus as ServiceTicketStatusType } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type PageProps = {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
};

const STATUS_VALUES = Object.values(ServiceTicketStatus);

function isServiceTicketStatus(value: string): value is ServiceTicketStatusType {
  return (STATUS_VALUES as readonly string[]).includes(value);
}

function escapeFilterTerm(value: string) {
  return value.replace(/[%,()]/g, (char) => `\\${char}`);
}

function parsePage(value?: string) {
  const page = Number(value ?? "1");
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export default async function ServiceTicketsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;
  const search = params.search ?? "";
  const status = params.status ?? "ALL";
  const page = parsePage(params.page);
  const supabase = await createClient();

  let request = supabase
    .from("service_tickets")
    .select("*", { count: "exact" })
    .order("received_at", { ascending: false })
    .range((page - 1) * DEFAULT_PAGE_SIZE, page * DEFAULT_PAGE_SIZE - 1);

  if (search.trim()) {
    const term = escapeFilterTerm(search.trim());
    request = request.or(
      `ticket_number.ilike.%${term}%,customer_name.ilike.%${term}%,phone_number.ilike.%${term}%`,
    );
  }

  if (isServiceTicketStatus(status)) {
    request = request.eq("status", status);
  }

  const { data: tickets, count: total } = await request;
  const rows = tickets ?? [];
  const totalPages = Math.max(1, Math.ceil((total ?? 0) / DEFAULT_PAGE_SIZE));

  return (
    <div className="space-y-6">
      <RealtimeRefresher table="service_tickets" />

      <PageHeader
        title="Service Tickets"
        description="Printers and devices dropped off for service — track status and print the acknowledgment and sticker."
        actions={
          <Button asChild>
            <Link href="/admin/service-tickets/new">
              <ClipboardList className="h-4 w-4" />
              New Ticket
            </Link>
          </Button>
        }
      />

      <Suspense fallback={null}>
        <ServiceTicketFilters defaultSearch={search} defaultStatus={status} />
      </Suspense>

      {rows.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={search || status !== "ALL" ? "No tickets found" : "No service tickets yet"}
          description={
            search || status !== "ALL"
              ? "Try a different search term or status."
              : "Create a ticket when a customer drops off a printer for service."
          }
          action={
            !search && status === "ALL" ? (
              <Button asChild>
                <Link href="/admin/service-tickets/new">New Ticket</Link>
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
                  <TableHead>Ticket No</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Printer</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.ticket_number}</TableCell>
                    <TableCell>{ticket.customer_name}</TableCell>
                    <TableCell>{ticket.phone_number}</TableCell>
                    <TableCell>
                      {ticket.printer_brand} {ticket.printer_model}
                    </TableCell>
                    <TableCell>{formatDate(ticket.received_at)}</TableCell>
                    <TableCell>
                      <ServiceTicketStatusBadge status={ticket.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link
                            href={`/admin/service-tickets/${ticket.id}`}
                            aria-label={`View ${ticket.ticket_number}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link
                            href={`/admin/service-tickets/${ticket.id}/acknowledgment?print=1`}
                            aria-label={`Print acknowledgment for ${ticket.ticket_number}`}
                          >
                            <Printer className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link
                            href={`/admin/service-tickets/${ticket.id}/sticker?print=1`}
                            aria-label={`Print sticker for ${ticket.ticket_number}`}
                          >
                            <Tag className="h-4 w-4" />
                          </Link>
                        </Button>
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
            basePath="/admin/service-tickets"
            searchParams={{
              search: search || undefined,
              status: status !== "ALL" ? status : undefined,
            }}
          />
        </>
      )}
    </div>
  );
}
