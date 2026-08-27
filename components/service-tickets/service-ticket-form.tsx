"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createServiceTicketAction,
  updateServiceTicketAction,
} from "@/server/actions/service-tickets";
import { serviceTicketSchema, type ServiceTicketInput } from "@/lib/validations";

type ServiceTicketFormProps = {
  mode: "create" | "edit";
  ticketId?: string;
  defaultValues?: Partial<ServiceTicketInput>;
};

export function ServiceTicketForm({
  mode,
  ticketId,
  defaultValues,
}: ServiceTicketFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ServiceTicketInput>({
    resolver: zodResolver(serviceTicketSchema),
    defaultValues: {
      customerName: "",
      phoneNumber: "",
      printerBrand: "",
      printerModel: "",
      serialNumber: "",
      problemDescription: "",
      notes: "",
      ...defaultValues,
    },
  });

  async function onSubmit(data: ServiceTicketInput) {
    setSubmitting(true);
    try {
      const result =
        mode === "create"
          ? await createServiceTicketAction(data)
          : await updateServiceTicketAction(ticketId!, data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        mode === "create" ? "Printer received — ticket created" : "Ticket updated",
      );

      if (mode === "create" && result.id) {
        router.push(`/admin/service-tickets/${result.id}`);
      } else {
        router.push(`/admin/service-tickets/${ticketId}`);
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customerName">Customer Name *</Label>
          <Input id="customerName" {...form.register("customerName")} />
          {form.formState.errors.customerName ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.customerName.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number *</Label>
          <Input id="phoneNumber" {...form.register("phoneNumber")} />
          {form.formState.errors.phoneNumber ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.phoneNumber.message}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Links to an existing customer if this phone number matches one, or creates a new
              customer record automatically.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="printerBrand">Printer Brand *</Label>
          <Input
            id="printerBrand"
            placeholder="e.g. Epson"
            {...form.register("printerBrand")}
          />
          {form.formState.errors.printerBrand ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.printerBrand.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="printerModel">Printer Model *</Label>
          <Input
            id="printerModel"
            placeholder="e.g. L3250"
            {...form.register("printerModel")}
          />
          {form.formState.errors.printerModel ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.printerModel.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="serialNumber">Serial Number</Label>
          <Input id="serialNumber" {...form.register("serialNumber")} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="problemDescription">Problem / Complaint</Label>
          <Textarea
            id="problemDescription"
            rows={3}
            placeholder="What the customer says is wrong with the printer…"
            {...form.register("problemDescription")}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Internal Notes</Label>
          <Textarea
            id="notes"
            rows={2}
            placeholder="Anything only staff need to see"
            {...form.register("notes")}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : mode === "create" ? "Create Ticket" : "Save Changes"}
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
