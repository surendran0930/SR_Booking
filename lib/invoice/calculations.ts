import { money, toDecimal, Decimal } from "@/lib/money";
import type { GstMode, PaymentStatus } from "@/lib/types";

export type CalcItemInput = {
  quantity: number | string;
  unitPrice: number | string;
  gstPercentage: number | string;
};

export type CalculatedItem = {
  lineSubtotal: Decimal;
  gstAmount: Decimal;
  totalAmount: Decimal;
};

export function calculateLineItem(item: CalcItemInput): CalculatedItem {
  const qty = toDecimal(item.quantity);
  const price = toDecimal(item.unitPrice);
  const gstPct = toDecimal(item.gstPercentage);
  const lineSubtotal = money(qty.mul(price));
  const gstAmount = money(lineSubtotal.mul(gstPct).div(100));
  const totalAmount = money(lineSubtotal.plus(gstAmount));
  return { lineSubtotal, gstAmount, totalAmount };
}

export function calculateInvoiceTotals(
  items: CalcItemInput[],
  discount: number | string,
  amountPaid: number | string,
  gstMode: GstMode,
) {
  let subtotal = toDecimal(0);
  let gstTotal = toDecimal(0);

  const calculatedItems = items.map((item) => {
    const calc = calculateLineItem(item);
    subtotal = subtotal.plus(calc.lineSubtotal);
    gstTotal = gstTotal.plus(calc.gstAmount);
    return calc;
  });

  subtotal = money(subtotal);
  gstTotal = money(gstTotal);
  const discountAmount = money(discount);
  const taxableAfterDiscount = money(Decimal.max(subtotal.minus(discountAmount), 0));

  // GST is computed per line; discount is applied to grand total (common SMB pattern)
  let cgst = money(0);
  let sgst = money(0);
  let igst = money(0);

  if (gstMode === "CGST_SGST") {
    cgst = money(gstTotal.div(2));
    sgst = money(gstTotal.minus(cgst));
  } else if (gstMode === "IGST") {
    igst = gstTotal;
  } else {
    gstTotal = money(0);
    cgst = money(0);
    sgst = money(0);
    igst = money(0);
  }

  const grandTotal =
    gstMode === "NONE"
      ? money(taxableAfterDiscount)
      : money(taxableAfterDiscount.plus(gstTotal));

  const paid = money(amountPaid);
  const balanceDue = money(Decimal.max(grandTotal.minus(paid), 0));

  let paymentStatus: PaymentStatus = "PENDING";
  if (paid.gte(grandTotal) && grandTotal.gte(0)) {
    paymentStatus = "PAID";
  } else if (paid.gt(0)) {
    paymentStatus = "PARTIAL";
  }

  return {
    items: calculatedItems,
    subtotal,
    discount: discountAmount,
    cgst,
    sgst,
    igst,
    gstTotal: gstMode === "NONE" ? money(0) : gstTotal,
    grandTotal,
    amountPaid: paid,
    balanceDue,
    paymentStatus,
  };
}

export function formatInvoiceNumber(prefix: string, number: number) {
  return `${prefix}${String(number).padStart(4, "0")}`;
}
