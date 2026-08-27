"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guards";
import { businessSettingsSchema } from "@/lib/validations";

export type ActionResult = {
  success?: boolean;
  error?: string;
};

export async function updateBusinessSettingsAction(raw: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = businessSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("business_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from("business_settings").insert({
      business_name: data.businessName,
      invoice_prefix: data.invoicePrefix,
      invoice_starting_number: data.invoiceStartingNumber,
      next_invoice_number: data.invoiceStartingNumber,
      email: data.email || null,
      tagline: data.tagline || undefined,
      business_address: data.businessAddress || null,
      phone: data.phone || null,
      gstin: data.gstin || null,
      state: data.state || null,
      pincode: data.pincode || null,
      terms_and_conditions: data.termsAndConditions || null,
      bank_details: data.bankDetails || null,
      upi_id: data.upiId || null,
      logo_url: data.logoUrl || null,
    });
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("business_settings")
      .update({
        business_name: data.businessName,
        tagline: data.tagline || undefined,
        business_address: data.businessAddress || null,
        phone: data.phone || null,
        email: data.email || null,
        gstin: data.gstin || null,
        state: data.state || null,
        pincode: data.pincode || null,
        invoice_prefix: data.invoicePrefix,
        invoice_starting_number: data.invoiceStartingNumber,
        terms_and_conditions: data.termsAndConditions || null,
        bank_details: data.bankDetails || null,
        upi_id: data.upiId || null,
        logo_url: data.logoUrl || null,
        // Only bump next number if starting number increased beyond current
        ...(data.invoiceStartingNumber > existing.next_invoice_number
          ? { next_invoice_number: data.invoiceStartingNumber }
          : {}),
      })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/invoices");
  return { success: true };
}

export async function getBusinessSettings() {
  const supabase = await createClient();
  const { data } = await supabase.from("business_settings").select("*").limit(1).maybeSingle();
  return data;
}
