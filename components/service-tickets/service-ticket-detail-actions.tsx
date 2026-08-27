"use client";

import Link from "next/link";
import { ArrowLeft, Pencil, Printer, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";

type ServiceTicketDetailActionsProps = {
  ticketId: string;
};

export function ServiceTicketDetailActions({
  ticketId,
}: ServiceTicketDetailActionsProps) {
  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <Button variant="outline" asChild>
        <Link href="/admin/service-tickets">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href={`/admin/service-tickets/${ticketId}?edit=true`}>
          <Pencil className="h-4 w-4" />
          Edit
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href={`/admin/service-tickets/${ticketId}/acknowledgment?print=1`}>
          <Printer className="h-4 w-4" />
          Acknowledgment Copy
        </Link>
      </Button>
      <Button variant="default" asChild>
        <Link href={`/admin/service-tickets/${ticketId}/sticker?print=1`}>
          <Tag className="h-4 w-4" />
          Print Sticker
        </Link>
      </Button>
    </div>
  );
}
