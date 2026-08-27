import { DEFAULT_LOGO_PATH } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export type AcknowledgmentDocumentSettings = {
  businessName: string;
  tagline?: string | null;
  businessAddress?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
};

export type AcknowledgmentDocumentData = {
  ticketNumber: string;
  receivedAt: Date | string;
  customerName: string;
  phoneNumber: string;
  printerBrand: string;
  printerModel: string;
  serialNumber?: string | null;
  problemDescription?: string | null;
};

type AcknowledgmentDocumentProps = {
  ticket: AcknowledgmentDocumentData;
  settings: AcknowledgmentDocumentSettings;
};

export function AcknowledgmentDocument({
  ticket,
  settings,
}: AcknowledgmentDocumentProps) {
  const logoSrc = settings.logoUrl || DEFAULT_LOGO_PATH;
  const officeLines = [
    settings.businessAddress,
    [settings.phone ? `Ph: ${settings.phone}` : null, settings.email]
      .filter(Boolean)
      .join(" · "),
  ].filter(Boolean);

  return (
    <article
      id="acknowledgment-document"
      className="invoice-print-area mx-auto max-w-[700px] bg-white px-8 py-10 text-[#101828] print:max-w-none print:px-6 print:py-4"
    >
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
            <p className="mt-0.5 text-xs text-muted-foreground">{settings.tagline}</p>
          ) : null}
          <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
            {officeLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-2xl font-bold tracking-wide text-primary">
            SERVICE ACKNOWLEDGMENT
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(ticket.receivedAt)}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {ticket.ticketNumber}
          </p>
        </div>
      </header>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-sm font-bold text-foreground">Customer Details</p>
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Name:</span> {ticket.customerName}
            </p>
            <p>
              <span className="font-medium text-foreground">Phone:</span> {ticket.phoneNumber}
            </p>
          </div>
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Device Details</p>
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Brand:</span> {ticket.printerBrand}
            </p>
            <p>
              <span className="font-medium text-foreground">Model:</span> {ticket.printerModel}
            </p>
            {ticket.serialNumber ? (
              <p>
                <span className="font-medium text-foreground">Serial No:</span>{" "}
                {ticket.serialNumber}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-bold text-foreground">Reported Problem</p>
        <p className="mt-2 min-h-[3rem] whitespace-pre-line rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
          {ticket.problemDescription || "—"}
        </p>
      </div>

      <div className="mt-6 rounded-md bg-primary/5 p-4 text-sm text-foreground">
        We will call you at <span className="font-semibold">{ticket.phoneNumber}</span> once your
        device is ready for pickup. Please bring this acknowledgment slip when collecting your
        device.
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Please retain this slip until your device is collected. Devices not collected within 30
        days of the ready-for-pickup call may be subject to storage charges as per shop policy.
      </p>

      <div className="mt-12 grid grid-cols-2 gap-6 text-xs text-muted-foreground">
        <div>
          <div className="h-10 border-b border-border" />
          <p className="mt-1">Customer Signature</p>
        </div>
        <div>
          <div className="h-10 border-b border-border" />
          <p className="mt-1">Received By</p>
        </div>
      </div>
    </article>
  );
}
