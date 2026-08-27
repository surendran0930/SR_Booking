"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateBusinessSettingsAction } from "@/server/actions/settings";
import {
  businessSettingsSchema,
  type BusinessSettingsInput,
} from "@/lib/validations";

type SettingsFormProps = {
  defaultValues: BusinessSettingsInput;
};

export function SettingsForm({ defaultValues }: SettingsFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<BusinessSettingsInput>({
    resolver: zodResolver(businessSettingsSchema) as Resolver<BusinessSettingsInput>,
    defaultValues,
  });

  async function onSubmit(data: BusinessSettingsInput) {
    setSubmitting(true);
    try {
      const result = await updateBusinessSettingsAction(data);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Settings saved successfully");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Business Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="businessName">Business Name *</Label>
            <Input id="businessName" {...form.register("businessName")} />
            {form.formState.errors.businessName ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.businessName.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input id="tagline" {...form.register("tagline")} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="businessAddress">Business Address</Label>
            <Textarea
              id="businessAddress"
              rows={2}
              {...form.register("businessAddress")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...form.register("phone")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
            {form.formState.errors.email ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gstin">GSTIN</Label>
            <Input id="gstin" {...form.register("gstin")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input id="state" {...form.register("state")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pincode">Pincode</Label>
            <Input id="pincode" {...form.register("pincode")} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <div className="flex flex-wrap items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.watch("logoUrl") || "/logo.png"}
                alt="Business logo preview"
                className="h-16 w-16 rounded-full border object-contain"
              />
              <Input
                id="logoUrl"
                className="max-w-md"
                placeholder="/logo.png"
                {...form.register("logoUrl")}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Default brand logo is stored at <code>/logo.png</code>
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Invoice Settings</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="invoicePrefix">Invoice Prefix *</Label>
            <Input id="invoicePrefix" {...form.register("invoicePrefix")} />
            {form.formState.errors.invoicePrefix ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.invoicePrefix.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoiceStartingNumber">Starting Number *</Label>
            <Input
              id="invoiceStartingNumber"
              type="number"
              min="1"
              {...form.register("invoiceStartingNumber")}
            />
            {form.formState.errors.invoiceStartingNumber ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.invoiceStartingNumber.message}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Payment & Terms</h2>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="bankDetails">Bank Details</Label>
            <Textarea
              id="bankDetails"
              rows={3}
              {...form.register("bankDetails")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="upiId">UPI ID</Label>
            <Input id="upiId" {...form.register("upiId")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="termsAndConditions">Terms & Conditions</Label>
            <Textarea
              id="termsAndConditions"
              rows={4}
              {...form.register("termsAndConditions")}
            />
          </div>
        </div>
      </section>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Save Settings"}
      </Button>
    </form>
  );
}
