"use client";

import Link from "next/link";
import { ArrowLeft, Download, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

type InvoiceDetailActionsProps = {
  invoiceId: string;
  invoiceNumber: string;
};

export function InvoiceDetailActions({
  invoiceId,
  invoiceNumber,
}: InvoiceDetailActionsProps) {
  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <Button variant="outline" asChild>
        <Link href="/admin/invoices">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </Button>
      <Button type="button" variant="outline" onClick={() => window.print()}>
        <Printer className="h-4 w-4" />
        Print
      </Button>
      <Button variant="default" asChild>
        <a
          href={`/api/invoices/${invoiceId}/pdf`}
          download={`${invoiceNumber}.pdf`}
        >
          <Download className="h-4 w-4" />
          Download PDF
        </a>
      </Button>
    </div>
  );
}
