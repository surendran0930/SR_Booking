"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guards";
import { serviceSchema } from "@/lib/validations";

export type ActionResult = {
  success?: boolean;
  error?: string;
  id?: string;
};

function emptyToNull(value: string | null | undefined) {
  if (!value || value.trim() === "") return null;
  return value.trim();
}

export async function createServiceAction(raw: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = serviceSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }
  const data = parsed.data;
  const supabase = await createClient();

  const { data: service, error } = await supabase
    .from("services")
    .insert({
      name: data.name.trim(),
      service_code: emptyToNull(data.serviceCode),
      description: emptyToNull(data.description),
      service_charge: data.serviceCharge,
      gst_percentage: data.gstPercentage,
      is_active: data.isActive,
    })
    .select()
    .single();

  if (error || !service) {
    return { error: error?.message ?? "Failed to create service" };
  }

  revalidatePath("/admin/services");
  return { success: true, id: service.id };
}

export async function updateServiceAction(
  id: string,
  raw: unknown,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = serviceSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }
  const data = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase
    .from("services")
    .update({
      name: data.name.trim(),
      service_code: emptyToNull(data.serviceCode),
      description: emptyToNull(data.description),
      service_charge: data.serviceCharge,
      gst_percentage: data.gstPercentage,
      is_active: data.isActive,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/services");
  revalidatePath(`/admin/services/${id}`);
  return { success: true, id };
}

export async function deleteServiceAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { count: used } = await supabase
    .from("invoice_items")
    .select("id", { count: "exact", head: true })
    .eq("service_id", id);

  if (used && used > 0) {
    await supabase.from("services").update({ is_active: false }).eq("id", id);
    revalidatePath("/admin/services");
    return { success: true, error: "Service is used in invoices — marked inactive" };
  }

  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) {
    return { error: error.message };
  }
  revalidatePath("/admin/services");
  return { success: true };
}
