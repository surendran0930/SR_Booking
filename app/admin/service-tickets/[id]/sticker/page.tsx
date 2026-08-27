import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { StickerDocument } from "@/components/service-tickets/sticker-document";
import { PageHeader } from "@/components/shared/page-header";
import { PrintButton } from "@/components/shared/print-button";
import { PrintTrigger } from "@/components/shared/print-trigger";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { getBusinessSettings } from "@/server/actions/settings";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
};

export default async function ServiceTicketStickerPage({ params, searchParams }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const { print } = await searchParams;
  const supabase = await createClient();

  const [{ data: ticket }, settings] = await Promise.all([
    supabase.from("service_tickets").select("*").eq("id", id).maybeSingle(),
    getBusinessSettings(),
  ]);

  if (!ticket) notFound();

  return (
    <div className="space-y-6">
      {print === "1" ? <PrintTrigger /> : null}

      {/* Default label size for a small thermal/label printer. If your label
          printer uses a different size, open the print dialog, pick your
          label printer, and set a custom paper size to match your labels. */}
      <style>{`
        @page {
          size: 70mm 40mm;
          margin: 0;
        }
        @media print {
          .sticker-print-area {
            width: 70mm !important;
            height: 40mm !important;
            border: none !important;
          }
        }
      `}</style>

      <PageHeader
        title="Printer Sticker"
        description={`${ticket.ticket_number} — paste this on the device`}
        actions={
          <div className="no-print flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/admin/service-tickets/${id}`}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            <PrintButton label="Print Sticker" />
          </div>
        }
      />

      <p className="no-print text-sm text-muted-foreground">
        Default size is 70mm × 40mm for a small label/thermal printer. If your labels are a
        different size, open the print dialog, choose your label printer, and set the paper size
        to match before printing.
      </p>

      <div className="flex justify-center py-6">
        <StickerDocument
          ticket={{
            ticketNumber: ticket.ticket_number,
            customerName: ticket.customer_name,
            phoneNumber: ticket.phone_number,
            printerBrand: ticket.printer_brand,
            printerModel: ticket.printer_model,
            receivedAt: ticket.received_at,
          }}
          businessName={settings?.business_name ?? "SR TECH SOLUTIONS"}
        />
      </div>
    </div>
  );
}
