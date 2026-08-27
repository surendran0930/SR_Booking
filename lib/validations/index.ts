import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or mobile is required"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

export const customerSchema = z.object({
  customerType: z.enum(["INDIVIDUAL", "BUSINESS"]),
  name: z.string().min(2, "Full name is required"),
  companyName: z.string().optional().nullable(),
  phone: z
    .string()
    .min(10, "Phone number is required")
    .regex(/^[0-9+\-\s()]{10,15}$/, "Enter a valid phone number"),
  alternativePhone: z.string().optional().nullable(),
  email: z
    .string()
    .email("Enter a valid email")
    .optional()
    .or(z.literal(""))
    .nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  gstin: z
    .string()
    .optional()
    .nullable()
    .refine(
      (v) => !v || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(v),
      "GSTIN is invalid",
    ),
  notes: z.string().optional().nullable(),
  deviceType: z.enum(["PRINTER", "LAPTOP", "COMPUTER", "SCANNER"]).optional().nullable(),
  deviceModel: z.string().optional().nullable(),
  createLogin: z.boolean().optional(),
  loginPassword: z.string().optional().nullable(),
});

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  sellingPrice: z.coerce.number().min(0, "Selling price must be 0 or more"),
  gstPercentage: z.coerce.number().min(0).max(100, "GST must be between 0 and 100"),
  unit: z.string().min(1, "Unit is required"),
  isActive: z.boolean(),
});

export const serviceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  serviceCode: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  serviceCharge: z.coerce.number().min(0, "Service charge must be 0 or more"),
  gstPercentage: z.coerce.number().min(0).max(100),
  isActive: z.boolean(),
});

export const invoiceItemSchema = z.object({
  itemType: z.enum(["PRODUCT", "SERVICE"]),
  productId: z.string().optional().nullable(),
  serviceId: z.string().optional().nullable(),
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().gt(0, "Quantity must be greater than 0"),
  unitPrice: z.coerce.number().min(0, "Unit price must be 0 or more"),
  gstPercentage: z.coerce.number().min(0).max(100),
});

export const invoiceSchema = z.object({
  invoiceType: z.enum(["SALES", "SERVICE"]),
  customerId: z.string().min(1, "Select a customer"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  dueDate: z.string().optional().nullable(),
  gstMode: z.enum(["CGST_SGST", "IGST", "NONE"]),
  discount: z.coerce.number().min(0).default(0),
  amountPaid: z.coerce.number().min(0).default(0),
  paymentMethod: z
    .enum(["CASH", "UPI", "BANK_TRANSFER", "CARD", "OTHER"])
    .optional(),
  notes: z.string().optional().nullable(),
  printerBrand: z.string().optional().nullable(),
  printerModel: z.string().optional().nullable(),
  printerSerial: z.string().optional().nullable(),
  customerComplaint: z.string().optional().nullable(),
  items: z.array(invoiceItemSchema).min(1, "Add at least one line item"),
});

export const businessSettingsSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  tagline: z.string().optional().nullable(),
  businessAddress: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  gstin: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  invoicePrefix: z.string().min(1, "Invoice prefix is required"),
  invoiceStartingNumber: z.coerce.number().int().min(1),
  termsAndConditions: z.string().optional().nullable(),
  bankDetails: z.string().optional().nullable(),
  upiId: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
});

export const serviceTicketSchema = z.object({
  customerName: z.string().min(2, "Customer name is required"),
  phoneNumber: z
    .string()
    .min(10, "Phone number is required")
    .regex(/^[0-9+\-\s()]{10,15}$/, "Enter a valid phone number"),
  printerBrand: z.string().min(1, "Printer brand is required"),
  printerModel: z.string().min(1, "Printer model is required"),
  serialNumber: z.string().optional().nullable(),
  problemDescription: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const serviceTicketStatusSchema = z.object({
  status: z.enum(["RECEIVED", "IN_PROGRESS", "READY", "COLLECTED"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>;
export type ServiceTicketInput = z.infer<typeof serviceTicketSchema>;
export type ServiceTicketStatusInput = z.infer<typeof serviceTicketStatusSchema>;
