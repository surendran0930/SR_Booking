import Link from "next/link";

import { ServiceTicketForm } from "@/components/service-tickets/service-ticket-form";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/guards";

export default async function NewServiceTicketPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="New Service Ticket"
        description="Record a printer or device dropped off for service"
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/service-tickets">Back to list</Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Intake Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceTicketForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
