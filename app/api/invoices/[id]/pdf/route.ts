import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { DEFAULT_LOGO_PATH } from "@/lib/constants";
import { moneyNumber } from "@/lib/money";
import { buildInvoicePdf } from "@/lib/pdf/invoice-pdf";
import { createClient } from "@/lib/supabase/server";
import { getBusinessSettings } from "@/server/actions/settings";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*, customer:customers(*), items:invoice_items(*)")
    .eq("id", id)
    .order("sort_order", { referencedTable: "invoice_items", ascending: true })
    .maybeSingle();

  if (error || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (session.role === "CUSTOMER") {
    if (!session.customerId || invoice.customer_id !== session.customerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getBusinessSettings();
  const businessSettings = settings ?? {
    business_name: "SR TECH SOLUTIONS",
    tagline: "All Types Printer Repair & Support",
    business_address: null,
    phone: null,
    email: null,
    gstin: null,
    terms_and_conditions: null,
    bank_details: null,
    upi_id: null,
    logo_url: DEFAULT_LOGO_PATH,
  };

  const pdfBytes = await buildInvoicePdf(
    {
      invoiceNumber: invoice.invoice_number,
      invoiceDate: new Date(invoice.invoice_date),
      invoiceType: invoice.invoice_type,
      paymentStatus: invoice.payment_status,
      subtotal: moneyNumber(invoice.subtotal),
      discount: moneyNumber(invoice.discount),
      cgst: moneyNumber(invoice.cgst),
      sgst: moneyNumber(invoice.sgst),
      igst: moneyNumber(invoice.igst),
      gstTotal: moneyNumber(invoice.gst_total),
      grandTotal: moneyNumber(invoice.grand_total),
      amountPaid: moneyNumber(invoice.amount_paid),
      balanceDue: moneyNumber(invoice.balance_due),
      notes: invoice.notes,
      printerBrand: invoice.printer_brand,
      printerModel: invoice.printer_model,
      printerSerial: invoice.printer_serial,
      customerComplaint: invoice.customer_complaint,
      customer: {
        name: invoice.customer.name,
        companyName: invoice.customer.company_name,
        phone: invoice.customer.phone,
        email: invoice.customer.email,
        address: invoice.customer.address,
        city: invoice.customer.city,
        state: invoice.customer.state,
        pincode: invoice.customer.pincode,
        gstin: invoice.customer.gstin,
      },
      items: (invoice.items ?? []).map((item) => ({
        description: item.description,
        quantity: moneyNumber(item.quantity),
        unitPrice: moneyNumber(item.unit_price),
        gstPercentage: moneyNumber(item.gst_percentage),
        totalAmount: moneyNumber(item.total_amount),
      })),
    },
    {
      businessName: businessSettings.business_name,
      tagline: businessSettings.tagline,
      businessAddress: businessSettings.business_address,
      phone: businessSettings.phone,
      email: businessSettings.email,
      gstin: businessSettings.gstin,
      termsAndConditions: businessSettings.terms_and_conditions,
      bankDetails: businessSettings.bank_details,
      upiId: businessSettings.upi_id,
      logoUrl: businessSettings.logo_url || DEFAULT_LOGO_PATH,
    },
  );

  const filename = `${invoice.invoice_number.replace(/[^\w.-]+/g, "_")}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-cache",
    },
  });
}
