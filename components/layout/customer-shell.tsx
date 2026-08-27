"use client";

import { useState } from "react";
import { CustomerSidebar } from "@/components/layout/customer-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import { AppShell } from "@/components/layout/app-shell";
import { logoutAction } from "@/server/actions/auth";

type Props = {
  userName: string;
  children: React.ReactNode;
};

export function CustomerShell({ userName, children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <AppShell
      sidebarOpen={open}
      onSidebarOpenChange={setOpen}
      sidebar={
        <CustomerSidebar
          open={open}
          onOpenChange={setOpen}
          logoutAction={logoutAction}
        />
      }
      topbar={
        <AdminTopbar
          title="Customer Portal"
          userName={userName}
          onMenuClick={() => setOpen(true)}
        />
      }
    >
      {children}
    </AppShell>
  );
}
