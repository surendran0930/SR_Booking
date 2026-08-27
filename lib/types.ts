// Hand-written replacements for the Prisma-generated enum types.
// These mirror the Postgres enums created in supabase/migrations/00000000000001_init.sql.

export const Role = {
  ADMIN: "ADMIN",
  CUSTOMER: "CUSTOMER",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const CustomerType = {
  INDIVIDUAL: "INDIVIDUAL",
  BUSINESS: "BUSINESS",
} as const;
export type CustomerType = (typeof CustomerType)[keyof typeof CustomerType];

export const DeviceType = {
  PRINTER: "PRINTER",
  LAPTOP: "LAPTOP",
  COMPUTER: "COMPUTER",
  SCANNER: "SCANNER",
} as const;
export type DeviceType = (typeof DeviceType)[keyof typeof DeviceType];

export const InvoiceType = {
  SALES: "SALES",
  SERVICE: "SERVICE",
} as const;
export type InvoiceType = (typeof InvoiceType)[keyof typeof InvoiceType];

export const PaymentStatus = {
  PAID: "PAID",
  PARTIAL: "PARTIAL",
  PENDING: "PENDING",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentMethod = {
  CASH: "CASH",
  UPI: "UPI",
  BANK_TRANSFER: "BANK_TRANSFER",
  CARD: "CARD",
  OTHER: "OTHER",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const GstMode = {
  CGST_SGST: "CGST_SGST",
  IGST: "IGST",
  NONE: "NONE",
} as const;
export type GstMode = (typeof GstMode)[keyof typeof GstMode];

export const InvoiceItemType = {
  PRODUCT: "PRODUCT",
  SERVICE: "SERVICE",
} as const;
export type InvoiceItemType = (typeof InvoiceItemType)[keyof typeof InvoiceItemType];

export const ServiceTicketStatus = {
  RECEIVED: "RECEIVED",
  IN_PROGRESS: "IN_PROGRESS",
  READY: "READY",
  COLLECTED: "COLLECTED",
} as const;
export type ServiceTicketStatus =
  (typeof ServiceTicketStatus)[keyof typeof ServiceTicketStatus];
