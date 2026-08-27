import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireCustomer } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { shortId } from "@/lib/ids";
import { formatDate } from "@/lib/utils";

export default async function CustomerProfilePage() {
  const session = await requireCustomer();
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", session.customerId!)
    .maybeSingle();

  if (!customer) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Profile" description="Your account information" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Customer ID:</span>
            <span className="font-mono">{shortId(customer.id)}</span>
            <Badge variant="neutral">{customer.customer_type}</Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Full Name</p>
              <p className="font-medium">{customer.name}</p>
            </div>
            {customer.company_name ? (
              <div>
                <p className="text-muted-foreground">Company</p>
                <p className="font-medium">{customer.company_name}</p>
              </div>
            ) : null}
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium">{customer.phone}</p>
            </div>
            {customer.alternative_phone ? (
              <div>
                <p className="text-muted-foreground">Alternative Phone</p>
                <p className="font-medium">{customer.alternative_phone}</p>
              </div>
            ) : null}
            {customer.email ? (
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{customer.email}</p>
              </div>
            ) : null}
            {customer.gstin ? (
              <div>
                <p className="text-muted-foreground">GSTIN</p>
                <p className="font-medium">{customer.gstin}</p>
              </div>
            ) : null}
            {customer.device_type ? (
              <div>
                <p className="text-muted-foreground">Device Type</p>
                <p className="font-medium">
                  {customer.device_type.charAt(0) +
                    customer.device_type.slice(1).toLowerCase()}
                </p>
              </div>
            ) : null}
            {customer.device_model ? (
              <div>
                <p className="text-muted-foreground">Model</p>
                <p className="font-medium">{customer.device_model}</p>
              </div>
            ) : null}
          </div>

          {[customer.address, customer.city, customer.state, customer.pincode].some(Boolean) ? (
            <div>
              <p className="text-muted-foreground">Address</p>
              <p className="font-medium">
                {[customer.address, customer.city, customer.state, customer.pincode]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          ) : null}

          <p className="text-muted-foreground">Member since {formatDate(customer.created_at)}</p>
        </CardContent>
      </Card>
    </div>
  );
}
