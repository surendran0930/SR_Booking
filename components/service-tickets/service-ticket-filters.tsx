"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ServiceTicketFiltersProps = {
  defaultSearch?: string;
  defaultStatus?: string;
};

export function ServiceTicketFilters({
  defaultSearch = "",
  defaultStatus = "ALL",
}: ServiceTicketFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(defaultSearch);
  const [status, setStatus] = useState(defaultStatus);

  useEffect(() => {
    setSearch(defaultSearch);
    setStatus(defaultStatus);
  }, [defaultSearch, defaultStatus]);

  function applyFilters(next?: { search?: string; status?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    const values = {
      search: next?.search ?? search,
      status: next?.status ?? status,
    };

    if (values.search.trim()) params.set("search", values.search.trim());
    else params.delete("search");

    if (values.status && values.status !== "ALL") params.set("status", values.status);
    else params.delete("status");

    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function clearFilters() {
    setSearch("");
    setStatus("ALL");
    router.push(pathname);
  }

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="ticket-search">Search</Label>
          <SearchInput
            id="ticket-search"
            value={search}
            onChange={setSearch}
            placeholder="Ticket number, customer name, or phone…"
          />
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full min-w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="RECEIVED">Received</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="READY">Ready for Pickup</SelectItem>
              <SelectItem value="COLLECTED">Collected</SelectItem>
            </SelectContent>
          </Select>
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
