"use client";

import { useRef, useState, useTransition } from "react";
import { LogOut } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";

type LogoutButtonProps = {
  logoutAction: () => void | Promise<void>;
  className?: string;
};

export function LogoutButton({ logoutAction, className }: LogoutButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleConfirm() {
    startTransition(() => {
      formRef.current?.requestSubmit();
    });
  }

  return (
    <>
      <form ref={formRef} action={logoutAction} className="w-full">
        <Button
          type="button"
          variant="ghost"
          className={
            className ??
            "w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          }
          onClick={() => setOpen(true)}
          disabled={pending}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {pending ? "Logging out..." : "Logout"}
        </Button>
      </form>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Confirm logout?"
        description="Do you want to sign out of SR Tech Solutions?"
        confirmLabel="Yes"
        cancelLabel="No"
        variant="destructive"
        loading={pending}
        onConfirm={handleConfirm}
      />
    </>
  );
}
