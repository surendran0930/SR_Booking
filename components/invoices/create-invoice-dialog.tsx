"use client";

import { useRouter } from "next/navigation";
import { FileText, ShoppingCart, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type CreateInvoiceDialogProps = {
  trigger?: React.ReactNode;
};

export function CreateInvoiceDialog({ trigger }: CreateInvoiceDialogProps) {
  const router = useRouter();

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <FileText className="h-4 w-4" />
            + Create Invoice
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
          <DialogDescription>
            Choose the invoice type to continue. You can add line items on the
            next screen.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="h-auto justify-start gap-3 px-4 py-4"
            onClick={() => router.push("/admin/invoices/new?type=sales")}
          >
            <ShoppingCart className="h-5 w-5 shrink-0 text-primary" />
            <span className="text-left">
              <span className="block font-semibold">Sales Invoice</span>
              <span className="block text-xs font-normal text-muted-foreground">
                Products and parts sold to customers
              </span>
            </span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-auto justify-start gap-3 px-4 py-4"
            onClick={() => router.push("/admin/invoices/new?type=service")}
          >
            <Wrench className="h-5 w-5 shrink-0 text-primary" />
            <span className="text-left">
              <span className="block font-semibold">Service Invoice</span>
              <span className="block text-xs font-normal text-muted-foreground">
                Repair services with optional parts and printer details
              </span>
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
