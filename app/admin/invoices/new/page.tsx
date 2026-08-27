import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { InvoiceForm } from "@/components/invoices/invoice-form";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { moneyNumber } from "@/lib/money";
import type { InvoiceType } from "@/lib/types";

type PageProps = {
  searchParams: Promise<{
    type?: string;
    customerId?: string;
  }>;
};

function resolveInvoiceType(value?: string): InvoiceType {
  return value?.toLowerCase() === "service" ? "SERVICE" : "SALES";
}

export default async function NewInvoicePage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;
  const invoiceType = resolveInvoiceType(params.type);
  const supabase = await createClient();

  const [{ data: customers }, { data: products }, { data: services }] = await Promise.all([
    supabase
      .from("customers")
      .select("id, name, company_name, phone")
      .order("name", { ascending: true }),
    supabase
      .from("products")
      .select("id, name, selling_price, gst_percentage, unit")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("services")
      .select("id, name, service_charge, gst_percentage")
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);

  const title = invoiceType === "SALES" ? "Create Sales Invoice" : "Create Service Invoice";

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title={title}
        description={
          invoiceType === "SALES"
            ? "Add products sold to a customer. Totals are recalculated on save."
            : "Add services and optional parts. Include printer details if applicable."
        }
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/invoices">
              <ArrowLeft className="h-4 w-4" />
              Back to Invoices
            </Link>
          </Button>
        }
      />

      <InvoiceForm
        type={invoiceType}
        customers={(customers ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          companyName: c.company_name,
          phone: c.phone,
        }))}
        products={(products ?? []).map((product) => ({
          id: product.id,
          name: product.name,
          unit: product.unit,
          sellingPrice: moneyNumber(product.selling_price),
          gstPercentage: moneyNumber(product.gst_percentage),
        }))}
        services={(services ?? []).map((service) => ({
          id: service.id,
          name: service.name,
          serviceCharge: moneyNumber(service.service_charge),
          gstPercentage: moneyNumber(service.gst_percentage),
        }))}
        preselectedCustomerId={params.customerId}
      />
    </div>
  );
}
