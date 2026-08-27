"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guards";
import { serviceTicketSchema } from "@/lib/validations";
import type { ServiceTicketStatus } from "@/lib/types";

export type ActionResult = {
  success?: boolean;
  error?: string;
  id?: string;
};

function emptyToNull(value: string | null | undefined) {
  if (!value || value.trim() === "") return null;
  return value.trim();
}

type CustomerLinkInput = {
  customerName: string;
  phoneNumber: string;
  printerBrand: string;
  printerModel: string;
};

// Links to an existing customer record when the phone number matches one
// already on file; otherwise creates a new customer record right now, so
// every service ticket also shows up in Customers (with invoice history,
// outstanding balance, etc. ready to go) instead of only existing as a
// ticket. Shared by create and by the edit-time backfill below.
async function findOrCreateCustomerId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: CustomerLinkInput,
): Promise<{ customerId: string } | { error: string }> {
  const phone = data.phoneNumber.trim();

  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (existingCustomer) {
    return { customerId: existingCustomer.id };
  }

  const { data: newCustomer, error } = await supabase
    .from("customers")
    .insert({
      customer_type: "INDIVIDUAL",
      name: data.customerName.trim(),
      phone,
      device_type: "PRINTER",
      device_model: `${data.printerBrand.trim()} ${data.printerModel.trim()}`,
    })
    .select("id")
    .single();

  if (error || !newCustomer) {
    return { error: error?.message ?? "Failed to create customer record" };
  }

  return { customerId: newCustomer.id };
}

export async function createServiceTicketAction(raw: unknown): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = serviceTicketSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const linkResult = await findOrCreateCustomerId(supabase, data);
  if ("error" in linkResult) {
    return { error: linkResult.error };
  }

  const { data: ticket, error } = await supabase
    .from("service_tickets")
    .insert({
      customer_id: linkResult.customerId,
      customer_name: data.customerName.trim(),
      phone_number: data.phoneNumber.trim(),
      printer_brand: data.printerBrand.trim(),
      printer_model: data.printerModel.trim(),
      serial_number: emptyToNull(data.serialNumber),
      problem_description: emptyToNull(data.problemDescription),
      notes: emptyToNull(data.notes),
      created_by: session.userId,
    })
    .select()
    .single();

  if (error || !ticket) {
    return { error: error?.message ?? "Failed to create service ticket" };
  }

  revalidatePath("/admin/service-tickets");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/dashboard");
  return { success: true, id: ticket.id };
}

export async function updateServiceTicketAction(
  id: string,
  raw: unknown,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = serviceTicketSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { data: existingTicket } = await supabase
    .from("service_tickets")
    .select("customer_id")
    .eq("id", id)
    .maybeSingle();

  let customerId = existingTicket?.customer_id ?? null;

  // Backfill: tickets created before customer auto-linking existed have no
  // customer_id yet. Saving the ticket now (even with no fields changed)
  // links or creates one, same as a brand-new ticket would.
  if (!customerId) {
    const linkResult = await findOrCreateCustomerId(supabase, data);
    if ("error" in linkResult) {
      return { error: linkResult.error };
    }
    customerId = linkResult.customerId;
  }

  const { error } = await supabase
    .from("service_tickets")
    .update({
      customer_id: customerId,
      customer_name: data.customerName.trim(),
      phone_number: data.phoneNumber.trim(),
      printer_brand: data.printerBrand.trim(),
      printer_model: data.printerModel.trim(),
      serial_number: emptyToNull(data.serialNumber),
      problem_description: emptyToNull(data.problemDescription),
      notes: emptyToNull(data.notes),
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/service-tickets");
  revalidatePath(`/admin/service-tickets/${id}`);
  revalidatePath("/admin/customers");
  return { success: true, id };
}

export async function updateServiceTicketStatusAction(
  id: string,
  status: ServiceTicketStatus,
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("service_tickets")
    .update({ status })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/service-tickets");
  revalidatePath(`/admin/service-tickets/${id}`);
  revalidatePath("/admin/dashboard");
  return { success: true, id };
}
