import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminReportsPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Business analytics and exports"
      />

      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Reports coming in a future phase.
        </CardContent>
      </Card>
    </div>
  );
}
