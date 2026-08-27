import { SettingsForm } from "@/components/settings/settings-form";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/guards";
import { DEFAULT_LOGO_PATH } from "@/lib/constants";
import { getBusinessSettings } from "@/server/actions/settings";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getBusinessSettings();

  const defaultValues = {
    businessName: settings?.business_name ?? "SR TECH SOLUTIONS",
    tagline: settings?.tagline ?? "",
    businessAddress: settings?.business_address ?? "",
    phone: settings?.phone ?? "",
    email: settings?.email ?? "",
    gstin: settings?.gstin ?? "",
    state: settings?.state ?? "",
    pincode: settings?.pincode ?? "",
    invoicePrefix: settings?.invoice_prefix ?? "INV-",
    invoiceStartingNumber: settings?.invoice_starting_number ?? 1,
    termsAndConditions: settings?.terms_and_conditions ?? "",
    bankDetails: settings?.bank_details ?? "",
    upiId: settings?.upi_id ?? "",
    logoUrl: settings?.logo_url || DEFAULT_LOGO_PATH,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Settings"
        description="Business profile, invoice, and payment settings"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm defaultValues={defaultValues} />
        </CardContent>
      </Card>
    </div>
  );
}
