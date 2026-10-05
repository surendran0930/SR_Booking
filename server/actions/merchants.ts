"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/guards";
import { merchantSchema } from "@/lib/validations";

export type ActionResult = {
  success?: boolean;
  error?: string;
  id?: string;
};

// Management-only: creating and removing merchant logins is deliberately
// NOT available to merchants themselves (requireAdmin, not requireStaff).

export async function createMerchantAction(raw: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = merchantSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }
  const data = parsed.data;

  // Creating an auth user requires the service-role (admin) client — RLS and
  // normal signup rules don't apply, this is the admin provisioning a login
  // on the merchant's behalf. handle_new_auth_user() (a DB trigger) creates
  // the matching public.profiles row automatically with role: MERCHANT.
  const admin = createAdminClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email: data.email.toLowerCase(),
    password: data.password,
    email_confirm: true,
    user_metadata: {
      name: data.name,
      phone: data.phone || null,
      role: "MERCHANT",
    },
  });

  if (error || !created.user) {
    return { error: error?.message ?? "Failed to create merchant login" };
  }

  revalidatePath("/admin/merchants");
  return { success: true, id: created.user.id };
}

export async function deleteMerchantAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", id)
    .maybeSingle();

  if (!profile || profile.role !== "MERCHANT") {
    return { error: "Merchant not found" };
  }

  // Deletes the auth user (cascades to the profiles row via the auth.users
  // FK). Customers/service tickets/invoices/products/services this merchant
  // owned are NOT deleted — merchant_id references profiles with
  // ON DELETE SET NULL, so those rows just fall back to management's view
  // instead of disappearing or being orphaned.
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/merchants");
  return { success: true };
}
