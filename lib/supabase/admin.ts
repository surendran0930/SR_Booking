import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

// Service-role client — bypasses RLS entirely. NEVER import this from a
// client component or expose SUPABASE_SERVICE_ROLE_KEY to the browser.
// Only use it for operations RLS genuinely can't express as the logged-in
// user, e.g. supabase.auth.admin.createUser() when an admin provisions a
// customer login from server/actions/customers.ts.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase admin client is missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
