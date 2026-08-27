import type { PaymentStatus } from "@/lib/types";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; variant: "paid" | "partial" | "pending" }
> = {
  PAID: { label: "Paid", variant: "paid" },
  PARTIAL: { label: "Partial", variant: "partial" },
  PENDING: { label: "Pending", variant: "pending" },
};

type PaymentStatusBadgeProps = {
  status: PaymentStatus;
  className?: string;
};

export function PaymentStatusBadge({
  status,
  className,
}: PaymentStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge variant={config.variant} className={cn(className)}>
      {config.label}
    </Badge>
  );
}
