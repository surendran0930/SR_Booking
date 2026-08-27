"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteCustomerAction } from "@/server/actions/customers";

type CustomerDeleteButtonProps = {
  customerId: string;
  customerName: string;
  /** Where to send the user after a successful delete. Omit to stay put and refresh (list view). */
  redirectTo?: string;
  /** "link" matches the text-link row actions on the list page; "outline" matches the icon+label buttons on the detail page. */
  variant?: "link" | "outline";
};

export function CustomerDeleteButton({
  customerId,
  customerName,
  redirectTo,
  variant = "link",
}: CustomerDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteCustomerAction(customerId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Customer deleted");
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <>
      {variant === "link" ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="text-destructive"
          onClick={() => setOpen(true)}
        >
          Delete
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      )}

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Delete ${customerName}?`}
        description="This permanently removes the customer record (and their portal login, if any). Customers with existing invoices can't be deleted — remove or reassign those invoices first."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        loading={pending}
        onConfirm={handleConfirm}
      />
    </>
  );
}
