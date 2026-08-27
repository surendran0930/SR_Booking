import { notFound } from "next/navigation";

import { InvoiceDetailActions } from "@/components/invoices/invoice-detail-actions";
import { InvoiceDocument } from "@/components/invoices/invoice-document";
import { InvoicePrintTrigger } from "@/components/invoices/invoice-print-trigger";
import { PageHeader } from "@/components/shared/page-header";
import { PaymentStatusBadge } from "@/components/shared/payment-status-badge";
import { requireAdmin } from "@/lib/auth/guards";
import { DEFAULT_LOGO_PATH } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { getBusinessSettings } from "@/server/actions/settings";
import { moneyNumber } from "@/lib/money";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
};

export default async function InvoiceDetailPage({ params, searchParams }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const { print } = await searchParams;
  const supabase = await createClient();

  const [{ data: invoice }, settings] = await Promise.all([
    supabase
      .from("invoices")
      .select("*, customer:customers(*), items:invoice_items(*), payments(*)")
      .eq("id", id)
      .order("sort_order", { referencedTable: "invoice_items", ascending: true })
      .order("payment_date", { referencedTable: "payments", ascending: false })
      .maybeSingle(),
    getBusinessSettings(),
  ]);

  if (!invoice) notFound();

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

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {print === "1" ? <InvoicePrintTrigger /> : null}

      <PageHeader
        title={invoice.invoice_number}
        description={`${invoice.invoice_type === "SALES" ? "Sales" : "Service"} invoice for ${invoice.customer.name}`}
        actions={
          <InvoiceDetailActions invoiceId={invoice.id} invoiceNumber={invoice.invoice_number} />
        }
      />

      <div className="no-print flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Payment status:</span>
        <PaymentStatusBadge status={invoice.payment_status} />
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm print:border-0 print:p-0 print:shadow-none">
        <InvoiceDocument
          invoice={{
            invoiceNumber: invoice.invoice_number,
            invoiceType: invoice.invoice_type,
            invoiceDate: invoice.invoice_date,
            dueDate: invoice.due_date,
            gstMode: invoice.gst_mode,
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
            items: invoice.items.map((item) => ({
              description: item.description,
              quantity: moneyNumber(item.quantity),
              unitPrice: moneyNumber(item.unit_price),
              gstPercentage: moneyNumber(item.gst_percentage),
              gstAmount: moneyNumber(item.gst_amount),
              totalAmount: moneyNumber(item.total_amount),
            })),
          }}
          settings={{
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
          }}
        />
      </div>
    </div>
  );
}
