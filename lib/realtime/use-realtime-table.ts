"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to Postgres Changes (insert/update/delete) on `table` via
 * Supabase Realtime and calls `router.refresh()` whenever a change arrives.
 *
 * Why refresh-on-change instead of patching client state: every list page
 * here is a Server Component that already owns pagination, search, filters,
 * and joined aggregates (outstanding balances, counts, etc). Re-running that
 * same server query on change keeps one source of truth for "what does this
 * page show" instead of duplicating that logic in the browser. For a
 * single-shop admin tool this is simpler and plenty fast; if a table gets
 * very high-frequency writes later, that's the point to switch to
 * client-side cache patching (e.g. via a query library) for that table only.
 *
 * RLS applies to realtime exactly like normal queries — a CUSTOMER-role
 * session only receives events for rows it's allowed to select (its own
 * customer record / own invoices), so this is safe to mount on customer
 * portal pages too.
 */
export function useRealtimeTable(table: string, filter?: string) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`realtime:${table}:${filter ?? "all"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, ...(filter ? { filter } : {}) },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter]);
}
