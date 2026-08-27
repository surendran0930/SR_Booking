import Link from "next/link";

import { ServiceForm } from "@/components/services/service-form";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/guards";

export default async function NewServicePage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="New Service"
        description="Add a service offering"
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/services">Back to list</Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Service Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
