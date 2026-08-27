import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InvoicePaginationProps = {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
  className?: string;
};

export function InvoicePagination({
  currentPage,
  totalPages,
  buildHref,
  className,
}: InvoicePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div
      className={cn(
        "no-print flex items-center justify-between gap-4 border-t px-4 py-3",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          asChild
          disabled={currentPage <= 1}
        >
          <Link
            href={buildHref(Math.max(1, currentPage - 1))}
            aria-disabled={currentPage <= 1}
            className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          asChild
          disabled={currentPage >= totalPages}
        >
          <Link
            href={buildHref(Math.min(totalPages, currentPage + 1))}
            aria-disabled={currentPage >= totalPages}
            className={
              currentPage >= totalPages ? "pointer-events-none opacity-50" : ""
            }
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function buildInvoicesQuery(
  params: Record<string, string | undefined>,
  page: number,
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `/admin/invoices?${query}` : "/admin/invoices";
}

export function buildInvoiceListHref(
  filters: Record<string, string | undefined>,
  page: number,
) {
  return buildInvoicesQuery(filters, page);
}
