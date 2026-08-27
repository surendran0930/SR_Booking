"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/guards";
import { customerSchema } from "@/lib/validations";

export type ActionResult = {
  success?: boolean;
  error?: string;
  id?: string;
};

function emptyToNull(value: string | null | undefined) {
  if (!value || value.trim() === "") return null;
  return value.trim();
}

export async function createCustomerAction(raw: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = customerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { data: customer, error } = await supabase
    .from("customers")
    .insert({
      customer_type: data.customerType,
      name: data.name.trim(),
      company_name: emptyToNull(data.companyName),
      phone: data.phone.trim(),
      alternative_phone: emptyToNull(data.alternativePhone),
      email: emptyToNull(data.email)?.toLowerCase() ?? null,
      address: emptyToNull(data.address),
      city: emptyToNull(data.city),
      state: emptyToNull(data.state),
      pincode: emptyToNull(data.pincode),
      gstin: emptyToNull(data.gstin)?.toUpperCase() ?? null,
      notes: emptyToNull(data.notes),
      device_type: data.deviceType ?? null,
      device_model: emptyToNull(data.deviceModel),
    })
    .select()
    .single();

  if (error || !customer) {
    return { error: error?.message ?? "Failed to create customer" };
  }

  if (data.createLogin && data.email && data.loginPassword) {
    // Creating an auth user requires the service-role (admin) client — RLS
    // and normal signup rules don't apply, this is the admin provisioning
    // a login on the customer's behalf. handle_new_auth_user() (a DB
    // trigger) creates the matching public.profiles row automatically.
    const admin = createAdminClient();
    const { error: authError } = await admin.auth.admin.createUser({
      email: customer.email!,
      password: data.loginPassword,
      email_confirm: true,
      user_metadata: {
        name: customer.name,
        phone: customer.phone,
        role: "CUSTOMER",
        customer_id: customer.id,
      },
    });
    if (authError) {
      // Customer record was created; surface the login failure separately
      // so the admin can retry granting access without duplicating the customer.
      return {
        success: true,
        id: customer.id,
        error: `Customer saved, but login creation failed: ${authError.message}`,
      };
    }
  }

  revalidatePath("/admin/customers");
  revalidatePath("/admin/dashboard");
  return { success: true, id: customer.id };
}

export async function updateCustomerAction(
  id: string,
  raw: unknown,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = customerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase
    .from("customers")
    .update({
      customer_type: data.customerType,
      name: data.name.trim(),
      company_name: emptyToNull(data.companyName),
      phone: data.phone.trim(),
      alternative_phone: emptyToNull(data.alternativePhone),
      email: emptyToNull(data.email)?.toLowerCase() ?? null,
      address: emptyToNull(data.address),
      city: emptyToNull(data.city),
      state: emptyToNull(data.state),
      pincode: emptyToNull(data.pincode),
      gstin: emptyToNull(data.gstin)?.toUpperCase() ?? null,
      notes: emptyToNull(data.notes),
      device_type: data.deviceType ?? null,
      device_model: emptyToNull(data.deviceModel),
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${id}`);
  return { success: true, id };
}

export async function deleteCustomerAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { count: invoiceCount } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", id);

  if (invoiceCount && invoiceCount > 0) {
    return { error: "Cannot delete customer with existing invoices" };
  }

  // Remove any login linked to this customer first (admin API — cascades to
  // the profiles row via the auth.users FK), then the customer record.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("customer_id", id)
    .maybeSingle();

  if (profile) {
    const admin = createAdminClient();
    await admin.auth.admin.deleteUser(profile.id);
  }

  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/customers");
  return { success: true };
}
