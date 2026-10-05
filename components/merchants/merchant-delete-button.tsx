"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteMerchantAction } from "@/server/actions/merchants";

type MerchantDeleteButtonProps = {
  merchantId: string;
  merchantName: string;
};

export function MerchantDeleteButton({
  merchantId,
  merchantName,
}: MerchantDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteMerchantAction(merchantId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Merchant removed");
      router.refresh();
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="link"
        size="sm"
        className="text-destructive"
        onClick={() => setOpen(true)}
      >
        Remove
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Remove ${merchantName}?`}
        description="This deletes their login. Any customers, service tickets, invoices, or catalog items they added stay in the system and become visible to you (management) instead of being deleted."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="destructive"
        loading={pending}
        onConfirm={handleConfirm}
      />
    </>
  );
}
