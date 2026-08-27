import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";

// Request-scoped server client — used in Server Components, Server Actions,
// and Route Handlers. Runs as the logged-in user (auth.uid() is populated
// from the session cookie), so normal RLS policies apply. This is the client
// almost everything in server/actions/*.ts should use.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component render — proxy.ts refreshes the
            // session on every request, so this can be safely ignored.
          }
        },
      },
    },
  );
}
