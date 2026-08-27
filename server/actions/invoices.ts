"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireCustomer } from "@/lib/auth/guards";
import { invoiceSchema } from "@/lib/validations";
import { calculateInvoiceTotals } from "@/lib/invoice/calculations";
import { moneyNumber } from "@/lib/money";

export type ActionResult = {
  success?: boolean;
  error?: string;
  id?: string;
};

export async function createInvoiceAction(raw: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = invoiceSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("id", data.customerId)
    .maybeSingle();
  if (!customer) {
    return { error: "Customer not found" };
  }

  // Validate referenced products/services exist
  for (const item of data.items) {
    if (item.itemType === "PRODUCT" && item.productId) {
      const { data: product } = await supabase
        .from("products")
        .select("id")
        .eq("id", item.productId)
        .maybeSingle();
      if (!product) return { error: `Product not found: ${item.description}` };
    }
    if (item.itemType === "SERVICE" && item.serviceId) {
      const { data: service } = await supabase
        .from("services")
        .select("id")
        .eq("id", item.serviceId)
        .maybeSingle();
      if (!service) return { error: `Service not found: ${item.description}` };
    }
  }

  // Totals are still computed here with decimal.js — never trust client math.
  // The create_invoice() RPC just persists these numbers atomically along
  // with a gap-free invoice number allocation.
  const totals = calculateInvoiceTotals(
    data.items,
    data.discount,
    data.amountPaid,
    data.gstMode,
  );

  const payload = {
    invoiceType: data.invoiceType,
    customerId: data.customerId,
    invoiceDate: new Date(data.invoiceDate).toISOString(),
    dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
    gstMode: data.gstMode,
    subtotal: moneyNumber(totals.subtotal),
    discount: moneyNumber(totals.discount),
    cgst: moneyNumber(totals.cgst),
    sgst: moneyNumber(totals.sgst),
    igst: moneyNumber(totals.igst),
    gstTotal: moneyNumber(totals.gstTotal),
    grandTotal: moneyNumber(totals.grandTotal),
    amountPaid: moneyNumber(totals.amountPaid),
    balanceDue: moneyNumber(totals.balanceDue),
    paymentStatus: totals.paymentStatus,
    notes: data.notes || null,
    printerBrand: data.printerBrand || null,
    printerModel: data.printerModel || null,
    printerSerial: data.printerSerial || null,
    customerComplaint: data.customerComplaint || null,
    paymentMethod: data.paymentMethod ?? "CASH",
    items: data.items.map((item, index) => {
      const calc = totals.items[index];
      return {
        itemType: item.itemType,
        productId: item.productId || null,
        serviceId: item.serviceId || null,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        gstPercentage: item.gstPercentage,
        gstAmount: moneyNumber(calc.gstAmount),
        totalAmount: moneyNumber(calc.totalAmount),
        sortOrder: index,
      };
    }),
  };

  const { data: invoice, error } = await supabase.rpc("create_invoice", {
    payload,
  });

  if (error || !invoice) {
    console.error(error);
    return { error: "Failed to generate invoice. Please try again." };
  }

  revalidatePath("/admin/invoices");
  revalidatePath("/admin/dashboard");
  revalidatePath(`/admin/customers/${data.customerId}`);
  return { success: true, id: invoice.id };
}

export async function getInvoiceForCustomer(invoiceId: string) {
  const session = await requireCustomer();
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select(
      "*, customer:customers(*), items:invoice_items(*), payments(*)",
    )
    .eq("id", invoiceId)
    .eq("customer_id", session.customerId!)
    .maybeSingle();

  return invoice;
}
