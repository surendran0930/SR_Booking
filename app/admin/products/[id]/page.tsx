import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/products/product-form";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Edit Product"
        description={product.name}
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/products">Back to list</Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            mode="edit"
            productId={id}
            defaultValues={{
              name: product.name,
              sku: product.sku ?? "",
              brand: product.brand ?? "",
              category: product.category ?? "",
              description: product.description ?? "",
              sellingPrice: Number(product.selling_price),
              gstPercentage: Number(product.gst_percentage),
              unit: product.unit,
              isActive: product.is_active,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
