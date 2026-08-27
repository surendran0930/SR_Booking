"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";

// Browser-side client — used inside "use client" components, primarily for
// realtime subscriptions (supabase.channel(...).on("postgres_changes", ...)).
// Reads/writes still go through the anon key + RLS, exactly like the server client.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
