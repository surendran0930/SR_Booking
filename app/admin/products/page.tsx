import { Suspense } from "react";
import Link from "next/link";
import { Package, Plus } from "lucide-react";

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

export default async function AdminProductsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const query = q?.trim() ?? "";
  const supabase = await createClient();

  let request = supabase
    .from("products")
    .select("*", { count: "exact" })
    .order("name", { ascending: true })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (query) {
    const term = escapeFilterTerm(query);
    request = request.or(
      `name.ilike.%${term}%,sku.ilike.%${term}%,brand.ilike.%${term}%,category.ilike.%${term}%`,
    );
  }

  const { data: products, count: total } = await request;
  const rows = products ?? [];
  const totalPages = Math.max(1, Math.ceil((total ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <RealtimeRefresher table="products" />

      <PageHeader
        title="Products"
        description="Manage product catalog and pricing"
        actions={
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="h-4 w-4" />
              New Product
            </Link>
          </Button>
        }
      />

      <Suspense fallback={null}>
        <UrlSearchBar
          placeholder="Search name, SKU, brand, or category…"
          className="max-w-md"
        />
      </Suspense>

      {rows.length === 0 ? (
        <EmptyState
          icon={Package}
          title={query ? "No products found" : "No products yet"}
          description={query ? "Try a different search term" : "Add products to use in sales invoices"}
          action={
            !query ? (
              <Button asChild>
                <Link href="/admin/products/new">Add Product</Link>
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
                  <TableHead>SKU</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">GST</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.sku ?? "—"}</TableCell>
                    <TableCell>{product.brand ?? "—"}</TableCell>
                    <TableCell>{product.category ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(product.selling_price))}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(product.gst_percentage)}%
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.is_active ? "success" : "neutral"}>
                        {product.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="link" size="sm">
                        <Link href={`/admin/products/${product.id}`}>Edit</Link>
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
            basePath="/admin/products"
            searchParams={{ q: query || undefined }}
          />
        </>
      )}
    </div>
  );
}
