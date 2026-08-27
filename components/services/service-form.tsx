"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createServiceAction,
  updateServiceAction,
} from "@/server/actions/services";
import { serviceSchema, type ServiceInput } from "@/lib/validations";

type ServiceFormProps = {
  mode: "create" | "edit";
  serviceId?: string;
  defaultValues?: Partial<ServiceInput>;
};

export function ServiceForm({
  mode,
  serviceId,
  defaultValues,
}: ServiceFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema) as Resolver<ServiceInput>,
    defaultValues: {
      name: "",
      serviceCode: "",
      description: "",
      serviceCharge: 0,
      gstPercentage: 18,
      isActive: true,
      ...defaultValues,
    },
  });

  async function onSubmit(data: ServiceInput) {
    setSubmitting(true);
    try {
      const result =
        mode === "create"
          ? await createServiceAction(data)
          : await updateServiceAction(serviceId!, data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        mode === "create"
          ? "Service created successfully"
          : "Service updated successfully",
      );

      if (mode === "create" && result.id) {
        router.push(`/admin/services/${result.id}`);
      } else {
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  const isActive = form.watch("isActive");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Service Name *</Label>
          <Input id="name" {...form.register("name")} />
          {form.formState.errors.name ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="serviceCode">Service Code</Label>
          <Input id="serviceCode" {...form.register("serviceCode")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="serviceCharge">Service Charge (₹) *</Label>
          <Input
            id="serviceCharge"
            type="number"
            step="0.01"
            min="0"
            {...form.register("serviceCharge")}
          />
          {form.formState.errors.serviceCharge ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.serviceCharge.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="gstPercentage">GST % *</Label>
          <Input
            id="gstPercentage"
            type="number"
            step="0.01"
            min="0"
            max="100"
            {...form.register("gstPercentage")}
          />
          {form.formState.errors.gstPercentage ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.gstPercentage.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={3} {...form.register("description")} />
        </div>

        <div className="flex items-center gap-2 sm:col-span-2">
          <Checkbox
            id="isActive"
            checked={isActive}
            onCheckedChange={(checked) =>
              form.setValue("isActive", checked === true)
            }
          />
          <Label htmlFor="isActive" className="font-normal">
            Active service
          </Label>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : mode === "create" ? "Create Service" : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
