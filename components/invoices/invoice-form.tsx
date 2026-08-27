"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { InvoiceSummary } from "@/components/invoices/invoice-summary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { calculateInvoiceTotals } from "@/lib/invoice/calculations";
import { createInvoiceAction } from "@/server/actions/invoices";
import { invoiceSchema } from "@/lib/validations";
import { formatCurrency } from "@/lib/utils";
import type { GstMode, InvoiceType, PaymentMethod } from "@/lib/types";

export type InvoiceFormCustomer = {
  id: string;
  name: string;
  companyName: string | null;
  phone: string;
};

export type InvoiceFormProduct = {
  id: string;
  name: string;
  sellingPrice: number;
  gstPercentage: number;
  unit: string;
};

export type InvoiceFormService = {
  id: string;
  name: string;
  serviceCharge: number;
  gstPercentage: number;
};

type LineItem = {
  key: string;
  itemType: "PRODUCT" | "SERVICE";
  productId: string | null;
  serviceId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  gstPercentage: number;
};

type InvoiceFormProps = {
  type: InvoiceType;
  customers: InvoiceFormCustomer[];
  products: InvoiceFormProduct[];
  services: InvoiceFormService[];
  preselectedCustomerId?: string;
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function createEmptyLine(itemType: "PRODUCT" | "SERVICE"): LineItem {
  return {
    key: crypto.randomUUID(),
    itemType,
    productId: null,
    serviceId: null,
    description: "",
    quantity: 1,
    unitPrice: 0,
    gstPercentage: 18,
  };
}

function CustomerSelect({
  customers,
  value,
  onChange,
  error,
}: {
  customers: InvoiceFormCustomer[];
  value: string;
  onChange: (id: string) => void;
  error?: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.companyName?.toLowerCase().includes(q) ?? false),
    );
  }, [customers, query]);

  const selected = customers.find((c) => c.id === value);

  return (
    <div className="space-y-2">
      <Label htmlFor="customer-search">Customer *</Label>
      <Input
        id="customer-search"
        placeholder="Search by name, company, or phone…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger aria-invalid={Boolean(error)}>
          <SelectValue
            placeholder="Select a customer"
            aria-label={selected?.name ?? "Select a customer"}
          />
        </SelectTrigger>
        <SelectContent>
          {filtered.length === 0 ? (
            <SelectItem value="__none__" disabled>
              No customers match your search
            </SelectItem>
          ) : (
            filtered.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
                {customer.companyName ? ` · ${customer.companyName}` : ""} ·{" "}
                {customer.phone}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Customer not listed?{" "}
        <Link href="/admin/customers/new" className="text-primary hover:underline">
          Add a new customer
        </Link>
      </p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export function InvoiceForm({
  type,
  customers,
  products,
  services,
  preselectedCustomerId,
}: InvoiceFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [customerId, setCustomerId] = useState(preselectedCustomerId ?? "");
  const [invoiceDate, setInvoiceDate] = useState(todayIsoDate());
  const [dueDate, setDueDate] = useState("");
  const [gstMode, setGstMode] = useState<GstMode>("CGST_SGST");
  const [discount, setDiscount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [notes, setNotes] = useState("");
  const [printerBrand, setPrinterBrand] = useState("");
  const [printerModel, setPrinterModel] = useState("");
  const [printerSerial, setPrinterSerial] = useState("");
  const [customerComplaint, setCustomerComplaint] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    createEmptyLine(type === "SALES" ? "PRODUCT" : "SERVICE"),
  ]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const totals = useMemo(
    () =>
      calculateInvoiceTotals(
        items.map((item) => ({
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          gstPercentage: item.gstPercentage,
        })),
        discount,
        amountPaid,
        gstMode,
      ),
    [items, discount, amountPaid, gstMode],
  );

  function updateItem(key: string, patch: Partial<LineItem>) {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }

  function removeItem(key: string) {
    setItems((current) =>
      current.length <= 1 ? current : current.filter((item) => item.key !== key),
    );
  }

  function addProductLine() {
    setItems((current) => [...current, createEmptyLine("PRODUCT")]);
  }

  function addServiceLine() {
    setItems((current) => [...current, createEmptyLine("SERVICE")]);
  }

  function applyProduct(key: string, productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    updateItem(key, {
      itemType: "PRODUCT",
      productId,
      serviceId: null,
      description: product.name,
      unitPrice: product.sellingPrice,
      gstPercentage: product.gstPercentage,
      quantity: 1,
    });
  }

  function applyService(key: string, serviceId: string) {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;
    updateItem(key, {
      itemType: "SERVICE",
      serviceId,
      productId: null,
      description: service.name,
      unitPrice: service.serviceCharge,
      gstPercentage: service.gstPercentage,
      quantity: 1,
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const payload = {
      invoiceType: type,
      customerId,
      invoiceDate,
      dueDate: dueDate || null,
      gstMode,
      discount,
      amountPaid,
      paymentMethod: amountPaid > 0 ? paymentMethod : undefined,
      notes: notes || null,
      printerBrand: type === "SERVICE" ? printerBrand || null : null,
      printerModel: type === "SERVICE" ? printerModel || null : null,
      printerSerial: type === "SERVICE" ? printerSerial || null : null,
      customerComplaint:
        type === "SERVICE" ? customerComplaint || null : null,
      items: items.map((item) => ({
        itemType: item.itemType,
        productId: item.productId,
        serviceId: item.serviceId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        gstPercentage: item.gstPercentage,
      })),
    };

    const parsed = invoiceSchema.safeParse(payload);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".") || "form";
        if (!errors[path]) errors[path] = issue.message;
      }
      setFieldErrors(errors);
      setFormError("Please fix the highlighted fields before submitting.");
      return;
    }

    startTransition(async () => {
      const result = await createInvoiceAction(parsed.data);
      if (result.error) {
        setFormError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Invoice created successfully");
      router.push(`/admin/invoices/${result.id}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Customer &amp; Dates</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <CustomerSelect
                  customers={customers}
                  value={customerId}
                  onChange={setCustomerId}
                  error={fieldErrors.customerId}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceDate">Invoice Date *</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={invoiceDate}
                  onChange={(event) => setInvoiceDate(event.target.value)}
                  required
                />
                {fieldErrors.invoiceDate ? (
                  <p className="text-sm text-destructive">{fieldErrors.invoiceDate}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </div>
            </div>
          </div>

          {type === "SERVICE" ? (
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Printer Details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="printerBrand">Brand</Label>
                  <Input
                    id="printerBrand"
                    value={printerBrand}
                    onChange={(event) => setPrinterBrand(event.target.value)}
                    placeholder="HP, Canon, Epson…"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="printerModel">Model</Label>
                  <Input
                    id="printerModel"
                    value={printerModel}
                    onChange={(event) => setPrinterModel(event.target.value)}
                    placeholder="Model number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="printerSerial">Serial Number</Label>
                  <Input
                    id="printerSerial"
                    value={printerSerial}
                    onChange={(event) => setPrinterSerial(event.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="customerComplaint">Customer Complaint</Label>
                  <Textarea
                    id="customerComplaint"
                    value={customerComplaint}
                    onChange={(event) => setCustomerComplaint(event.target.value)}
                    placeholder="Describe the reported issue…"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Line Items</h2>
              <div className="flex flex-wrap gap-2">
                {type === "SALES" ? (
                  <Button type="button" variant="outline" size="sm" onClick={addProductLine}>
                    <Plus className="h-4 w-4" />
                    Add Product
                  </Button>
                ) : (
                  <>
                    <Button type="button" variant="outline" size="sm" onClick={addServiceLine}>
                      <Plus className="h-4 w-4" />
                      Add Service
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={addProductLine}>
                      <Plus className="h-4 w-4" />
                      Add Part / Product
                    </Button>
                  </>
                )}
              </div>
            </div>

            {fieldErrors.items ? (
              <p className="mb-4 text-sm text-destructive">{fieldErrors.items}</p>
            ) : null}

            <div className="space-y-4">
              {items.map((item, index) => {
                const calc = totals.items[index];
                const isProductRow = item.itemType === "PRODUCT";

                return (
                  <div
                    key={item.key}
                    className="rounded-lg border bg-muted/20 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Item {index + 1} · {isProductRow ? "Product" : "Service"}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeItem(item.key)}
                        disabled={items.length <= 1}
                        aria-label="Remove line item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                      <div className="space-y-2 sm:col-span-2 lg:col-span-2">
                        <Label>
                          {isProductRow ? "Product" : "Service"}
                        </Label>
                        {isProductRow ? (
                          <Select
                            value={item.productId ?? undefined}
                            onValueChange={(value) => applyProduct(item.key, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} · {formatCurrency(product.sellingPrice)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Select
                            value={item.serviceId ?? undefined}
                            onValueChange={(value) => applyService(item.key, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select service" />
                            </SelectTrigger>
                            <SelectContent>
                              {services.map((service) => (
                                <SelectItem key={service.id} value={service.id}>
                                  {service.name} · {formatCurrency(service.serviceCharge)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      <div className="space-y-2 sm:col-span-2 lg:col-span-2">
                        <Label>Description *</Label>
                        <Input
                          value={item.description}
                          onChange={(event) =>
                            updateItem(item.key, { description: event.target.value })
                          }
                          placeholder="Line item description"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Qty</Label>
                        <Input
                          type="number"
                          min={0.001}
                          step="any"
                          value={item.quantity}
                          onChange={(event) =>
                            updateItem(item.key, {
                              quantity: Number(event.target.value) || 0,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Unit Price</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(event) =>
                            updateItem(item.key, {
                              unitPrice: Number(event.target.value) || 0,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>GST %</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          value={item.gstPercentage}
                          onChange={(event) =>
                            updateItem(item.key, {
                              gstPercentage: Number(event.target.value) || 0,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                        <p className="text-xs text-muted-foreground">GST Amount</p>
                        <p className="text-sm font-medium">
                          {formatCurrency(calc.gstAmount.toNumber())}
                        </p>
                      </div>
                      <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                        <p className="text-xs text-muted-foreground">Line Total</p>
                        <p className="text-sm font-semibold text-primary">
                          {formatCurrency(calc.totalAmount.toNumber())}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Payment &amp; Notes</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gstMode">GST Mode</Label>
                <Select
                  value={gstMode}
                  onValueChange={(value) => setGstMode(value as GstMode)}
                >
                  <SelectTrigger id="gstMode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CGST_SGST">CGST + SGST</SelectItem>
                    <SelectItem value="IGST">IGST</SelectItem>
                    <SelectItem value="NONE">No GST</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Discount (₹)</Label>
                <Input
                  id="discount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={discount}
                  onChange={(event) =>
                    setDiscount(Number(event.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amountPaid">Amount Paid (₹)</Label>
                <Input
                  id="amountPaid"
                  type="number"
                  min={0}
                  step="0.01"
                  value={amountPaid}
                  onChange={(event) =>
                    setAmountPaid(Number(event.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value) =>
                    setPaymentMethod(value as PaymentMethod)
                  }
                  disabled={amountPaid <= 0}
                >
                  <SelectTrigger id="paymentMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <InvoiceSummary
            subtotal={totals.subtotal}
            cgst={totals.cgst}
            sgst={totals.sgst}
            igst={totals.igst}
            discount={totals.discount}
            grandTotal={totals.grandTotal}
            amountPaid={totals.amountPaid}
            balanceDue={totals.balanceDue}
            gstMode={gstMode}
          />

          {formError ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Creating…" : "Create Invoice"}
            </Button>
            <Button type="button" variant="outline" className="w-full" asChild>
              <Link href="/admin/invoices">Cancel</Link>
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
