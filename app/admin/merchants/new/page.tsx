import Link from "next/link";

import { MerchantForm } from "@/components/merchants/merchant-form";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/guards";

export default async function NewMerchantPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="New Merchant"
        description="Give a friend or partner their own login"
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/merchants">Back to list</Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Merchant Details</CardTitle>
        </CardHeader>
        <CardContent>
          <MerchantForm />
        </CardContent>
      </Card>
    </div>
  );
}
