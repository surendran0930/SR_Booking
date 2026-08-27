"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createCustomerAction,
  updateCustomerAction,
} from "@/server/actions/customers";
import { customerSchema, type CustomerInput } from "@/lib/validations";

type CustomerFormProps = {
  mode: "create" | "edit";
  customerId?: string;
  defaultValues?: Partial<CustomerInput>;
};

export function CustomerForm({
  mode,
  customerId,
  defaultValues,
}: CustomerFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [createLogin, setCreateLogin] = useState(
    defaultValues?.createLogin ?? false,
  );

  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customerType: "INDIVIDUAL",
      name: "",
      companyName: "",
      phone: "",
      alternativePhone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      gstin: "",
      notes: "",
      deviceType: null,
      deviceModel: "",
      createLogin: false,
      loginPassword: "",
      ...defaultValues,
    },
  });

  const customerType = form.watch("customerType");
  const deviceType = form.watch("deviceType");

  async function onSubmit(data: CustomerInput) {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        createLogin: mode === "create" ? createLogin : false,
        loginPassword:
          mode === "create" && createLogin ? data.loginPassword : null,
      };

      const result =
        mode === "create"
          ? await createCustomerAction(payload)
          : await updateCustomerAction(customerId!, payload);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        mode === "create"
          ? "Customer created successfully"
          : "Customer updated successfully",
      );

      if (mode === "create" && result.id) {
        router.push(`/admin/customers/${result.id}`);
      } else {
        router.push(`/admin/customers/${customerId}`);
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="customerType">Customer Type</Label>
          <Select
            value={customerType}
            onValueChange={(value: "INDIVIDUAL" | "BUSINESS") =>
              form.setValue("customerType", value)
            }
          >
            <SelectTrigger id="customerType">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INDIVIDUAL">Individual</SelectItem>
              <SelectItem value="BUSINESS">Business</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input id="name" {...form.register("name")} />
          {form.formState.errors.name ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name</Label>
          <Input id="companyName" {...form.register("companyName")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input id="phone" {...form.register("phone")} />
          {form.formState.errors.phone ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.phone.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="alternativePhone">Alternative Phone</Label>
          <Input id="alternativePhone" {...form.register("alternativePhone")} />
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
          {form.formState.errors.gstin ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.gstin.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Textarea id="address" rows={2} {...form.register("address")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" {...form.register("city")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input id="state" {...form.register("state")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pincode">Pincode</Label>
          <Input id="pincode" {...form.register("pincode")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="deviceType">Device Type</Label>
          <Select
            value={deviceType ?? undefined}
            onValueChange={(value: "PRINTER" | "LAPTOP" | "COMPUTER" | "SCANNER") =>
              form.setValue("deviceType", value)
            }
          >
            <SelectTrigger id="deviceType">
              <SelectValue placeholder="Select device" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PRINTER">Printer</SelectItem>
              <SelectItem value="LAPTOP">Laptop</SelectItem>
              <SelectItem value="COMPUTER">Computer</SelectItem>
              <SelectItem value="SCANNER">Scanner</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="deviceModel">Model</Label>
          <Input
            id="deviceModel"
            placeholder="e.g. Epson L3150"
            {...form.register("deviceModel")}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" rows={3} {...form.register("notes")} />
        </div>

        {mode === "create" ? (
          <>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Checkbox
                id="createLogin"
                checked={createLogin}
                onCheckedChange={(checked) =>
                  setCreateLogin(checked === true)
                }
              />
              <Label htmlFor="createLogin" className="font-normal">
                Create customer portal login
              </Label>
            </div>

            {createLogin ? (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="loginPassword">Login Password</Label>
                <Input
                  id="loginPassword"
                  type="password"
                  {...form.register("loginPassword")}
                />
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : mode === "create" ? "Create Customer" : "Save Changes"}
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
