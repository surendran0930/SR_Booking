"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guards";
import { productSchema } from "@/lib/validations";

export type ActionResult = {
  success?: boolean;
  error?: string;
  id?: string;
};

function emptyToNull(value: string | null | undefined) {
  if (!value || value.trim() === "") return null;
  return value.trim();
}

export async function createProductAction(raw: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }
  const data = parsed.data;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      name: data.name.trim(),
      sku: emptyToNull(data.sku),
      brand: emptyToNull(data.brand),
      category: emptyToNull(data.category),
      description: emptyToNull(data.description),
      selling_price: data.sellingPrice,
      gst_percentage: data.gstPercentage,
      unit: data.unit.trim(),
      is_active: data.isActive,
    })
    .select()
    .single();

  if (error || !product) {
    return { error: error?.message ?? "Failed to create product" };
  }

  revalidatePath("/admin/products");
  return { success: true, id: product.id };
}

export async function updateProductAction(
  id: string,
  raw: unknown,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }
  const data = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({
      name: data.name.trim(),
      sku: emptyToNull(data.sku),
      brand: emptyToNull(data.brand),
      category: emptyToNull(data.category),
      description: emptyToNull(data.description),
      selling_price: data.sellingPrice,
      gst_percentage: data.gstPercentage,
      unit: data.unit.trim(),
      is_active: data.isActive,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  return { success: true, id };
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { count: used } = await supabase
    .from("invoice_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", id);

  if (used && used > 0) {
    await supabase.from("products").update({ is_active: false }).eq("id", id);
    revalidatePath("/admin/products");
    return { success: true, error: "Product is used in invoices — marked inactive" };
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    return { error: error.message };
  }
  revalidatePath("/admin/products");
  return { success: true };
}
