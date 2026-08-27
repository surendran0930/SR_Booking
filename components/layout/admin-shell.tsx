"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import { AppShell } from "@/components/layout/app-shell";
import { logoutAction } from "@/server/actions/auth";

type Props = {
  userName: string;
  children: React.ReactNode;
};

export function AdminShell({ userName, children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <AppShell
      sidebarOpen={open}
      onSidebarOpenChange={setOpen}
      sidebar={
        <AdminSidebar
          open={open}
          onOpenChange={setOpen}
          logoutAction={logoutAction}
        />
      }
      topbar={
        <AdminTopbar
          title="SR Tech Solutions"
          userName={userName}
          onMenuClick={() => setOpen(true)}
        />
      }
    >
      {children}
    </AppShell>
  );
}
