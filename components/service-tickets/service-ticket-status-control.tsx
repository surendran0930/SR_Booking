"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateServiceTicketStatusAction } from "@/server/actions/service-tickets";
import type { ServiceTicketStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: ServiceTicketStatus; label: string }[] = [
  { value: "RECEIVED", label: "Received" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "READY", label: "Ready for Pickup" },
  { value: "COLLECTED", label: "Collected" },
];

type ServiceTicketStatusControlProps = {
  ticketId: string;
  status: ServiceTicketStatus;
};

export function ServiceTicketStatusControl({
  ticketId,
  status,
}: ServiceTicketStatusControlProps) {
  const router = useRouter();
  const [value, setValue] = useState<ServiceTicketStatus>(status);
  const [submitting, setSubmitting] = useState(false);

  async function handleUpdate() {
    if (value === status) return;
    setSubmitting(true);
    try {
      const result = await updateServiceTicketStatusAction(ticketId, value);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        value === "READY"
          ? "Marked ready — don't forget to call the customer"
          : `Status updated to ${STATUS_OPTIONS.find((o) => o.value === value)?.label ?? value}`,
      );
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={value} onValueChange={(next: ServiceTicketStatus) => setValue(next)}>
        <SelectTrigger className="w-full min-w-[180px] sm:w-auto">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        size="sm"
        onClick={() => void handleUpdate()}
        disabled={submitting || value === status}
      >
        {submitting ? "Updating…" : "Update Status"}
      </Button>
    </div>
  );
}
