import type { GstMode, InvoiceType, PaymentStatus } from "@/lib/types";
import { DEFAULT_LOGO_PATH } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";

export type InvoiceDocumentCustomer = {
  name: string;
  companyName?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  gstin?: string | null;
};

export type InvoiceDocumentItem = {
  description: string;
  quantity: number | string;
  unitPrice: number | string;
  gstPercentage: number | string;
  gstAmount?: number | string;
  totalAmount: number | string;
};

export type InvoiceDocumentData = {
  invoiceNumber: string;
  invoiceDate: Date | string;
  dueDate?: Date | string | null;
  invoiceType: InvoiceType;
  paymentStatus: PaymentStatus;
  gstMode: GstMode;
  subtotal: number | string;
  discount: number | string;
  cgst: number | string;
  sgst: number | string;
  igst: number | string;
  gstTotal: number | string;
  grandTotal: number | string;
  amountPaid: number | string;
  balanceDue: number | string;
  notes?: string | null;
  printerBrand?: string | null;
  printerModel?: string | null;
  printerSerial?: string | null;
  customerComplaint?: string | null;
  customer: InvoiceDocumentCustomer;
  items: InvoiceDocumentItem[];
};

export type InvoiceDocumentSettings = {
  businessName: string;
  tagline?: string | null;
  businessAddress?: string | null;
  phone?: string | null;
  email?: string | null;
  gstin?: string | null;
  termsAndConditions?: string | null;
  bankDetails?: string | null;
  upiId?: string | null;
  logoUrl?: string | null;
};

type InvoiceDocumentProps = {
  invoice: InvoiceDocumentData;
  settings: InvoiceDocumentSettings;
  className?: string;
};

function num(value: number | string) {
  return typeof value === "string" ? Number(value) : value;
}

export function InvoiceDocument({
  invoice,
  settings,
  className,
}: InvoiceDocumentProps) {
  const logoSrc = settings.logoUrl || DEFAULT_LOGO_PATH;
  const officeLines = [
    settings.businessAddress,
    [settings.phone ? `Ph: ${settings.phone}` : null, settings.email]
      .filter(Boolean)
      .join(" · "),
    settings.gstin ? `GSTIN: ${settings.gstin}` : null,
  ].filter(Boolean);

  const customerAddress = [
    invoice.customer.companyName,
    invoice.customer.address,
    [invoice.customer.city, invoice.customer.state, invoice.customer.pincode]
      .filter(Boolean)
      .join(", "),
    `Phone: ${invoice.customer.phone}`,
    invoice.customer.email ? `Email: ${invoice.customer.email}` : null,
    invoice.customer.gstin ? `GSTIN: ${invoice.customer.gstin}` : null,
  ].filter(Boolean);

  const serviceNote = [
    invoice.printerBrand
      ? `Device: ${invoice.printerBrand}${invoice.printerModel ? ` ${invoice.printerModel}` : ""}${invoice.printerSerial ? ` | S/N ${invoice.printerSerial}` : ""}`
      : null,
    invoice.customerComplaint
      ? `Complaint: ${invoice.customerComplaint}`
      : null,
    invoice.notes,
  ]
    .filter(Boolean)
    .join("\n");

  const taxLabel =
    invoice.gstMode === "IGST"
      ? "Tax (IGST)"
      : invoice.gstMode === "CGST_SGST"
        ? "Tax (CGST + SGST)"
        : "Tax";

  return (
    <article
      id="invoice-document"
      className={`invoice-print-area mx-auto max-w-[800px] bg-white px-8 py-10 text-[#101828] print:max-w-none print:px-6 print:py-4 ${className ?? ""}`}
    >
      {/* Header: logo + business | INVOICE + date */}
      <header className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt={settings.businessName}
            className="h-16 w-16 rounded-full object-contain"
          />
          <h1 className="mt-3 text-xl font-bold tracking-tight text-primary">
            {settings.businessName}
          </h1>
          {settings.tagline ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {settings.tagline}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 text-right">
          <p className="text-3xl font-bold tracking-wide text-primary">
            INVOICE
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(invoice.invoiceDate)}
          </p>
          <p className="mt-1 text-xs font-medium text-foreground">
            {invoice.invoiceNumber}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {invoice.invoiceType === "SALES" ? "Sales" : "Service"} ·{" "}
            {invoice.paymentStatus}
          </p>
        </div>
      </header>

      {/* Office Address | To */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-sm font-bold text-foreground">Office Address</p>
          <div className="mt-2 space-y-0.5 text-sm text-muted-foreground">
            {officeLines.length > 0 ? (
              officeLines.map((line) => <p key={line}>{line}</p>)
            ) : (
              <p>—</p>
            )}
          </div>
        </div>
        <div className="sm:text-right">
          <p className="text-sm font-bold text-foreground">To :</p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {invoice.customer.name}
          </p>
          <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
            {customerAddress.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="mt-8 overflow-hidden rounded-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                Items Description
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">
                Unit Price
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">
                Qty
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr
                key={`${item.description}-${index}`}
                className="border-b border-border/80"
              >
                <td className="px-4 py-4 align-top">
                  <p className="font-semibold text-foreground">
                    {item.description}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    GST {num(item.gstPercentage)}%
                    {num(item.gstAmount ?? 0) > 0
                      ? ` · Tax ${formatCurrency(num(item.gstAmount!))}`
                      : ""}
                  </p>
                </td>
                <td className="px-4 py-4 text-right align-top tabular-nums">
                  {formatCurrency(num(item.unitPrice))}
                </td>
                <td className="px-4 py-4 text-center align-top tabular-nums">
                  {num(item.quantity)}
                </td>
                <td className="px-4 py-4 text-right align-top font-medium tabular-nums">
                  {formatCurrency(num(item.totalAmount))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Note + totals */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-sm font-bold text-foreground">Note :</p>
          <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
            {serviceNote ||
              "Thank you for choosing SR Tech Solutions. Payment is due as per the terms below."}
          </p>
        </div>

        <div className="space-y-2 text-sm sm:justify-self-end sm:w-64">
          <div className="flex justify-between gap-6">
            <span className="font-medium uppercase tracking-wide text-muted-foreground">
              Subtotal :
            </span>
            <span className="tabular-nums">
              {formatCurrency(num(invoice.subtotal))}
            </span>
          </div>
          {num(invoice.gstTotal) > 0 ? (
            <div className="flex justify-between gap-6">
              <span className="font-medium uppercase tracking-wide text-muted-foreground">
                {taxLabel} :
              </span>
              <span className="tabular-nums">
                {formatCurrency(num(invoice.gstTotal))}
              </span>
            </div>
          ) : null}
          {num(invoice.cgst) > 0 ? (
            <div className="flex justify-between gap-6 text-xs text-muted-foreground">
              <span>CGST / SGST</span>
              <span className="tabular-nums">
                {formatCurrency(num(invoice.cgst))} /{" "}
                {formatCurrency(num(invoice.sgst))}
              </span>
            </div>
          ) : null}
          {num(invoice.discount) > 0 ? (
            <div className="flex justify-between gap-6">
              <span className="font-medium uppercase tracking-wide text-muted-foreground">
                Discount :
              </span>
              <span className="tabular-nums">
                {formatCurrency(num(invoice.discount))}
              </span>
            </div>
          ) : null}
          <div className="flex justify-between gap-6 rounded-sm bg-primary px-3 py-2.5 font-bold text-primary-foreground">
            <span className="uppercase tracking-wide">Total Due :</span>
            <span className="tabular-nums">
              {formatCurrency(num(invoice.balanceDue) > 0
                ? num(invoice.balanceDue)
                : num(invoice.grandTotal))}
            </span>
          </div>
          {num(invoice.amountPaid) > 0 ? (
            <div className="flex justify-between gap-6 text-xs text-muted-foreground">
              <span>Amount Paid</span>
              <span className="tabular-nums">
                {formatCurrency(num(invoice.amountPaid))}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <p className="mt-10 text-center text-base font-bold text-primary">
        Thank you for your Business
      </p>

      <hr className="my-6 border-border" />

      {/* Footer: Questions | Payment | Terms */}
      <footer className="grid gap-6 text-xs sm:grid-cols-3">
        <div>
          <p className="font-bold text-foreground">Questions?</p>
          <div className="mt-2 space-y-0.5 text-muted-foreground">
            {settings.email ? <p>{settings.email}</p> : null}
            {settings.phone ? <p>{settings.phone}</p> : null}
            {!settings.email && !settings.phone ? (
              <p>Contact your account manager</p>
            ) : null}
          </div>
        </div>
        <div>
          <p className="font-bold text-foreground">Payment Info</p>
          <div className="mt-2 space-y-0.5 whitespace-pre-line text-muted-foreground">
            {settings.bankDetails ? <p>{settings.bankDetails}</p> : null}
            {settings.upiId ? <p>UPI: {settings.upiId}</p> : null}
            {!settings.bankDetails && !settings.upiId ? (
              <p>Cash / UPI / Bank Transfer</p>
            ) : null}
          </div>
        </div>
        <div>
          <p className="font-bold text-foreground">Terms &amp; Conditions</p>
          <p className="mt-2 whitespace-pre-line text-muted-foreground">
            {settings.termsAndConditions ||
              "Goods once sold will not be taken back. Warranty as per manufacturer terms."}
          </p>
        </div>
      </footer>
    </article>
  );
}
