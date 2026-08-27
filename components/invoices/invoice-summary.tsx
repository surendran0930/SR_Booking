"use client";

import { cn, formatCurrency } from "@/lib/utils";
import { moneyNumber } from "@/lib/money";
import type { GstMode } from "@/lib/types";
import type { Decimal } from "@/lib/money";

type MoneyValue = number | string | Decimal;

type InvoiceSummaryProps = {
  subtotal: MoneyValue;
  cgst: MoneyValue;
  sgst: MoneyValue;
  igst: MoneyValue;
  discount: MoneyValue;
  grandTotal: MoneyValue;
  amountPaid: MoneyValue;
  balanceDue: MoneyValue;
  gstMode: GstMode;
  className?: string;
};

function toAmount(value: MoneyValue) {
  return moneyNumber(value);
}

function SummaryRow({
  label,
  value,
  strong = false,
  muted = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 text-sm",
        strong && "text-base font-semibold",
        muted && "text-muted-foreground",
      )}
    >
      <span>{label}</span>
      <span className={cn(strong && "text-primary")}>{value}</span>
    </div>
  );
}

export function InvoiceSummary({
  subtotal,
  cgst,
  sgst,
  igst,
  discount,
  grandTotal,
  amountPaid,
  balanceDue,
  gstMode,
  className,
}: InvoiceSummaryProps) {
  return (
    <div
      className={cn(
        "space-y-2 rounded-xl border bg-muted/30 p-4",
        className,
      )}
    >
      <h3 className="text-sm font-semibold text-foreground">Invoice Summary</h3>
      <SummaryRow label="Subtotal" value={formatCurrency(toAmount(subtotal))} />
      {gstMode === "CGST_SGST" && toAmount(cgst) > 0 ? (
        <>
          <SummaryRow label="CGST" value={formatCurrency(toAmount(cgst))} />
          <SummaryRow label="SGST" value={formatCurrency(toAmount(sgst))} />
        </>
      ) : null}
      {gstMode === "IGST" && toAmount(igst) > 0 ? (
        <SummaryRow label="IGST" value={formatCurrency(toAmount(igst))} />
      ) : null}
      {toAmount(discount) > 0 ? (
        <SummaryRow
          label="Discount"
          value={`− ${formatCurrency(toAmount(discount))}`}
          muted
        />
      ) : null}
      <div className="border-t pt-2">
        <SummaryRow
          label="Grand Total"
          value={formatCurrency(toAmount(grandTotal))}
          strong
        />
      </div>
      <SummaryRow
        label="Amount Paid"
        value={formatCurrency(toAmount(amountPaid))}
      />
      <SummaryRow
        label="Balance Due"
        value={formatCurrency(toAmount(balanceDue))}
        strong
      />
    </div>
  );
}
