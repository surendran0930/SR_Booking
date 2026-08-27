import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";

import { InvoiceDocument } from "@/components/invoices/invoice-document";
import { PrintInvoiceButton } from "@/components/invoices/print-invoice-button";
import { PageHeader } from "@/components/shared/page-header";
import { PaymentStatusBadge } from "@/components/shared/payment-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireCustomer } from "@/lib/auth/guards";
import { DEFAULT_LOGO_PATH } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { getBusinessSettings } from "@/server/actions/settings";
import { formatDate } from "@/lib/utils";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerInvoiceDetailPage({ params }: PageProps) {
  const session = await requireCustomer();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: invoice }, settings] = await Promise.all([
    supabase
      .from("invoices")
      .select("*, customer:customers(*), items:invoice_items(*)")
      .eq("id", id)
      .eq("customer_id", session.customerId!)
      .order("sort_order", { referencedTable: "invoice_items", ascending: true })
      .maybeSingle(),
    getBusinessSettings(),
  ]);

  if (!invoice) notFound();

  const businessSettings = {
    businessName: settings?.business_name ?? "SR TECH SOLUTIONS",
    tagline: settings?.tagline,
    businessAddress: settings?.business_address,
    phone: settings?.phone,
    email: settings?.email,
    gstin: settings?.gstin,
    termsAndConditions: settings?.terms_and_conditions,
    bankDetails: settings?.bank_details,
    upiId: settings?.upi_id,
    logoUrl: settings?.logo_url || DEFAULT_LOGO_PATH,
  };

  return (
    <div className="space-y-6">
      <div className="no-print">
        <PageHeader
          title={invoice.invoice_number}
          description={`Issued on ${formatDate(invoice.invoice_date)} · ${invoice.invoice_type} invoice`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <PaymentStatusBadge status={invoice.payment_status} />
              <Button asChild variant="outline" size="sm">
                <Link href={`/api/invoices/${invoice.id}/pdf`} target="_blank">
                  <Download className="h-4 w-4" />
                  Download PDF
                </Link>
              </Button>
              <PrintInvoiceButton />
              <Button asChild variant="ghost" size="sm">
                <Link href="/customer/invoices">Back</Link>
              </Button>
            </div>
          }
        />
      </div>

      <Card className="print:border-0 print:shadow-none">
        <CardContent className="p-6 print:p-0">
          <InvoiceDocument
            invoice={{
              invoiceNumber: invoice.invoice_number,
              invoiceDate: invoice.invoice_date,
              invoiceType: invoice.invoice_type,
              paymentStatus: invoice.payment_status,
              gstMode: invoice.gst_mode,
              subtotal: String(invoice.subtotal),
              discount: String(invoice.discount),
              cgst: String(invoice.cgst),
              sgst: String(invoice.sgst),
              igst: String(invoice.igst),
              gstTotal: String(invoice.gst_total),
              grandTotal: String(invoice.grand_total),
              amountPaid: String(invoice.amount_paid),
              balanceDue: String(invoice.balance_due),
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
                quantity: String(item.quantity),
                unitPrice: String(item.unit_price),
                gstPercentage: String(item.gst_percentage),
                totalAmount: String(item.total_amount),
              })),
            }}
            settings={businessSettings}
          />
        </CardContent>
      </Card>
    </div>
  );
}
