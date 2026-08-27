import Link from "next/link";
import { notFound } from "next/navigation";

import { ServiceForm } from "@/components/services/service-form";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditServicePage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: service } = await supabase.from("services").select("*").eq("id", id).maybeSingle();
  if (!service) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Edit Service"
        description={service.name}
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
          <ServiceForm
            mode="edit"
            serviceId={id}
            defaultValues={{
              name: service.name,
              serviceCode: service.service_code ?? "",
              description: service.description ?? "",
              serviceCharge: Number(service.service_charge),
              gstPercentage: Number(service.gst_percentage),
              isActive: service.is_active,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
