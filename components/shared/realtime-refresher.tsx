"use client";

import { useRealtimeTable } from "@/lib/realtime/use-realtime-table";

type RealtimeRefresherProps = {
  /** Table name to watch (e.g. "invoices", "customers"). */
  table: string;
  /** Optional Postgres Changes filter, e.g. `customer_id=eq.${id}`. */
  filter?: string;
};

/**
 * Zero-UI client component: drop this into a Server Component page to make
 * it live-update. It renders nothing — it just watches `table` and calls
 * router.refresh() on any insert/update/delete the current session is
 * allowed to see (RLS-scoped), which re-runs the page's server data fetch.
 *
 * Usage: <RealtimeRefresher table="invoices" />
 */
export function RealtimeRefresher({ table, filter }: RealtimeRefresherProps) {
  useRealtimeTable(table, filter);
  return null;
}
