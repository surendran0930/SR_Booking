"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InvoiceType, PaymentStatus } from "@/lib/types";

type InvoiceFiltersProps = {
  defaultSearch?: string;
  defaultType?: string;
  defaultStatus?: string;
  defaultDateFrom?: string;
  defaultDateTo?: string;
};

export function InvoiceFilters({
  defaultSearch = "",
  defaultType = "ALL",
  defaultStatus = "ALL",
  defaultDateFrom = "",
  defaultDateTo = "",
}: InvoiceFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(defaultSearch);
  const [type, setType] = useState(defaultType);
  const [status, setStatus] = useState(defaultStatus);
  const [dateFrom, setDateFrom] = useState(defaultDateFrom);
  const [dateTo, setDateTo] = useState(defaultDateTo);

  useEffect(() => {
    setSearch(defaultSearch);
    setType(defaultType);
    setStatus(defaultStatus);
    setDateFrom(defaultDateFrom);
    setDateTo(defaultDateTo);
  }, [defaultSearch, defaultType, defaultStatus, defaultDateFrom, defaultDateTo]);

  function applyFilters(next?: {
    search?: string;
    type?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }) {
    const params = new URLSearchParams(searchParams.toString());

    const values = {
      search: next?.search ?? search,
      type: next?.type ?? type,
      status: next?.status ?? status,
      dateFrom: next?.dateFrom ?? dateFrom,
      dateTo: next?.dateTo ?? dateTo,
    };

    if (values.search.trim()) params.set("search", values.search.trim());
    else params.delete("search");

    if (values.type && values.type !== "ALL") params.set("type", values.type);
    else params.delete("type");

    if (values.status && values.status !== "ALL") params.set("status", values.status);
    else params.delete("status");

    if (values.dateFrom) params.set("dateFrom", values.dateFrom);
    else params.delete("dateFrom");

    if (values.dateTo) params.set("dateTo", values.dateTo);
    else params.delete("dateTo");

    params.delete("page");
    if (next?.page) params.set("page", next.page);

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function clearFilters() {
    setSearch("");
    setType("ALL");
    setStatus("ALL");
    setDateFrom("");
    setDateTo("");
    router.push(pathname);
  }

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto_auto] lg:items-end">
        <div className="space-y-2">
          <Label htmlFor="invoice-search">Search</Label>
          <SearchInput
            id="invoice-search"
            value={search}
            onChange={setSearch}
            placeholder="Invoice number or customer name…"
          />
        </div>

        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full min-w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="SALES">Sales</SelectItem>
              <SelectItem value="SERVICE">Service</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Payment Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full min-w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateFrom">From</Label>
          <Input
            id="dateFrom"
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateTo">To</Label>
          <Input
            id="dateTo"
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => applyFilters()}>
          Apply Filters
        </Button>
        <Button type="button" variant="outline" onClick={clearFilters}>
          Clear
        </Button>
      </div>
    </div>
  );
}

export type InvoiceListFilters = {
  search?: string;
  type?: InvoiceType | "ALL";
  status?: PaymentStatus | "ALL";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
};
