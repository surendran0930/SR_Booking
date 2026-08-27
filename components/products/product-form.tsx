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
  createProductAction,
  updateProductAction,
} from "@/server/actions/products";
import { productSchema, type ProductInput } from "@/lib/validations";

type ProductFormProps = {
  mode: "create" | "edit";
  productId?: string;
  defaultValues?: Partial<ProductInput>;
};

export function ProductForm({
  mode,
  productId,
  defaultValues,
}: ProductFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema) as Resolver<ProductInput>,
    defaultValues: {
      name: "",
      sku: "",
      brand: "",
      category: "",
      description: "",
      sellingPrice: 0,
      gstPercentage: 18,
      unit: "PCS",
      isActive: true,
      ...defaultValues,
    },
  });

  async function onSubmit(data: ProductInput) {
    setSubmitting(true);
    try {
      const result =
        mode === "create"
          ? await createProductAction(data)
          : await updateProductAction(productId!, data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        mode === "create"
          ? "Product created successfully"
          : "Product updated successfully",
      );

      if (mode === "create" && result.id) {
        router.push(`/admin/products/${result.id}`);
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
          <Label htmlFor="name">Product Name *</Label>
          <Input id="name" {...form.register("name")} />
          {form.formState.errors.name ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" {...form.register("sku")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand">Brand</Label>
          <Input id="brand" {...form.register("brand")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input id="category" {...form.register("category")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit">Unit *</Label>
          <Input id="unit" {...form.register("unit")} />
          {form.formState.errors.unit ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.unit.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sellingPrice">Selling Price (₹) *</Label>
          <Input
            id="sellingPrice"
            type="number"
            step="0.01"
            min="0"
            {...form.register("sellingPrice")}
          />
          {form.formState.errors.sellingPrice ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.sellingPrice.message}
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
            Active product
          </Label>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : mode === "create" ? "Create Product" : "Save Changes"}
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
