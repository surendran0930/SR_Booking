import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export type SessionPayload = {
  userId: string;
  role: Role;
  name: string;
  email: string;
  customerId: string | null;
};

// Reads the current user via Supabase Auth (validated against the auth
// server, not just decoded from the cookie — this is the recommended check
// for anything server-side) and joins their app-level profile row.
export async function getSession(): Promise<SessionPayload | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email, role, customer_id")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    userId: user.id,
    role: profile.role,
    name: profile.name,
    email: profile.email,
    customerId: profile.customer_id,
  };
}
