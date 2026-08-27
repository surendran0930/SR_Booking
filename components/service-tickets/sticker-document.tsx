import { formatDate } from "@/lib/utils";

export type StickerDocumentData = {
  ticketNumber: string;
  customerName: string;
  phoneNumber: string;
  printerBrand: string;
  printerModel: string;
  receivedAt: Date | string;
};

type StickerDocumentProps = {
  ticket: StickerDocumentData;
  businessName: string;
};

export function StickerDocument({ ticket, businessName }: StickerDocumentProps) {
  return (
    <div
      id="sticker-document"
      className="sticker-print-area mx-auto flex w-[265px] flex-col items-center justify-center gap-1 border-2 border-dashed border-border bg-white p-3 text-center text-[#101828] print:w-full print:border-0"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {businessName}
      </p>
      <p className="text-lg font-bold tracking-wide text-primary">{ticket.ticketNumber}</p>
      <p className="text-sm font-semibold leading-tight">{ticket.customerName}</p>
      <p className="text-sm leading-tight">{ticket.phoneNumber}</p>
      <p className="text-xs leading-tight text-muted-foreground">
        {ticket.printerBrand} {ticket.printerModel}
      </p>
      <p className="text-[10px] text-muted-foreground">{formatDate(ticket.receivedAt)}</p>
    </div>
  );
}
