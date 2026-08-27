import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AcknowledgmentDocument } from "@/components/service-tickets/acknowledgment-document";
import { PageHeader } from "@/components/shared/page-header";
import { PrintButton } from "@/components/shared/print-button";
import { PrintTrigger } from "@/components/shared/print-trigger";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/guards";
import { DEFAULT_LOGO_PATH } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { getBusinessSettings } from "@/server/actions/settings";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
};

export default async function ServiceTicketAcknowledgmentPage({
  params,
  searchParams,
}: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const { print } = await searchParams;
  const supabase = await createClient();

  const [{ data: ticket }, settings] = await Promise.all([
    supabase.from("service_tickets").select("*").eq("id", id).maybeSingle(),
    getBusinessSettings(),
  ]);

  if (!ticket) notFound();

  const businessSettings = settings ?? {
    business_name: "SR TECH SOLUTIONS",
    tagline: "All Types Printer Repair & Support",
    business_address: null,
    phone: null,
    email: null,
    logo_url: DEFAULT_LOGO_PATH,
  };

  return (
    <div className="space-y-6">
      {print === "1" ? <PrintTrigger /> : null}

      <PageHeader
        title="Acknowledgment Copy"
        description={ticket.ticket_number}
        actions={
          <div className="no-print flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/admin/service-tickets/${id}`}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            <PrintButton label="Print Acknowledgment" />
          </div>
        }
      />

      <div className="rounded-xl border bg-card p-6 shadow-sm print:border-0 print:p-0 print:shadow-none">
        <AcknowledgmentDocument
          ticket={{
            ticketNumber: ticket.ticket_number,
            receivedAt: ticket.received_at,
            customerName: ticket.customer_name,
            phoneNumber: ticket.phone_number,
            printerBrand: ticket.printer_brand,
            printerModel: ticket.printer_model,
            serialNumber: ticket.serial_number,
            problemDescription: ticket.problem_description,
          }}
          settings={{
            businessName: businessSettings.business_name,
            tagline: businessSettings.tagline,
            businessAddress: businessSettings.business_address,
            phone: businessSettings.phone,
            email: businessSettings.email,
            logoUrl: businessSettings.logo_url || DEFAULT_LOGO_PATH,
          }}
        />
      </div>
    </div>
  );
}
