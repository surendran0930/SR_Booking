"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMerchantAction } from "@/server/actions/merchants";
import { merchantSchema, type MerchantInput } from "@/lib/validations";

export function MerchantForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<MerchantInput>({
    resolver: zodResolver(merchantSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  async function onSubmit(data: MerchantInput) {
    setSubmitting(true);
    try {
      const result = await createMerchantAction(data);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Merchant login created");
      router.push("/admin/merchants");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" {...form.register("name")} />
          {form.formState.errors.name ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...form.register("phone")} />
          {form.formState.errors.phone ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.phone.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Login Email *</Label>
          <Input id="email" type="email" {...form.register("email")} />
          {form.formState.errors.email ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Login Password *</Label>
          <Input id="password" type="password" {...form.register("password")} />
          {form.formState.errors.password ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.password.message}
            </p>
          ) : null}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        They'll sign in at the same login page as you, with this email and
        password. Everything they add — customers, service tickets, invoices,
        products, services — stays scoped to them; you can see it all from
        your own login, they can only see their own.
      </p>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create Merchant Login"}
        </Button>
      </div>
    </form>
  );
}
