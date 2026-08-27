import { Suspense } from "react";
import Link from "next/link";
import { Plus, Wrench } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { DataTableWrapper } from "@/components/shared/data-table-wrapper";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { RealtimeRefresher } from "@/components/shared/realtime-refresher";
import { UrlSearchBar } from "@/components/shared/url-search-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { formatCurrency } from "@/lib/utils";

const PAGE_SIZE = 15;

type PageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

function escapeFilterTerm(value: string) {
  return value.replace(/[%,()]/g, (char) => `\\${char}`);
}

export default async function AdminServicesPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const query = q?.trim() ?? "";
  const supabase = await createClient();

  let request = supabase
    .from("services")
    .select("*", { count: "exact" })
    .order("name", { ascending: true })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (query) {
    const term = escapeFilterTerm(query);
    request = request.or(
      `name.ilike.%${term}%,service_code.ilike.%${term}%,description.ilike.%${term}%`,
    );
  }

  const { data: services, count: total } = await request;
  const rows = services ?? [];
  const totalPages = Math.max(1, Math.ceil((total ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <RealtimeRefresher table="services" />

      <PageHeader
        title="Services"
        description="Manage repair and support services"
        actions={
          <Button asChild>
            <Link href="/admin/services/new">
              <Plus className="h-4 w-4" />
              New Service
            </Link>
          </Button>
        }
      />

      <Suspense fallback={null}>
        <UrlSearchBar placeholder="Search name, code, or description…" className="max-w-md" />
      </Suspense>

      {rows.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title={query ? "No services found" : "No services yet"}
          description={query ? "Try a different search term" : "Add services to use in service invoices"}
          action={
            !query ? (
              <Button asChild>
                <Link href="/admin/services/new">Add Service</Link>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-right">Charge</TableHead>
                  <TableHead className="text-right">GST</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>{service.service_code ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(service.service_charge))}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(service.gst_percentage)}%
                    </TableCell>
                    <TableCell>
                      <Badge variant={service.is_active ? "success" : "neutral"}>
                        {service.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="link" size="sm">
                        <Link href={`/admin/services/${service.id}`}>Edit</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTableWrapper>

          <Pagination
            page={page}
            totalPages={totalPages}
            basePath="/admin/services"
            searchParams={{ q: query || undefined }}
          />
        </>
      )}
    </div>
  );
}
