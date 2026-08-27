import type { ServiceTicketStatus } from "@/lib/types";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  ServiceTicketStatus,
  { label: string; variant: "pending" | "partial" | "success" | "neutral" }
> = {
  RECEIVED: { label: "Received", variant: "pending" },
  IN_PROGRESS: { label: "In Progress", variant: "partial" },
  READY: { label: "Ready for Pickup", variant: "success" },
  COLLECTED: { label: "Collected", variant: "neutral" },
};

type ServiceTicketStatusBadgeProps = {
  status: ServiceTicketStatus;
  className?: string;
};

export function ServiceTicketStatusBadge({
  status,
  className,
}: ServiceTicketStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge variant={config.variant} className={cn(className)}>
      {config.label}
    </Badge>
  );
}
