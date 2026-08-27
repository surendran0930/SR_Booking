import { formatInvoiceNumber } from "@/lib/invoice/calculations";

/**
 * Invoice numbers are allocated atomically by the `create_invoice` Postgres RPC.
 * This helper remains for display / formatting only.
 */
export { formatInvoiceNumber };
