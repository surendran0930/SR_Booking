import Link from "next/link";

import { CustomerForm } from "@/components/customers/customer-form";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/guards";

export default async function NewCustomerPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="New Customer"
        description="Add a new customer record"
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/customers">Back to list</Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
