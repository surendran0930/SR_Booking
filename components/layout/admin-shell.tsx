"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import { AppShell } from "@/components/layout/app-shell";
import { logoutAction } from "@/server/actions/auth";
import type { Role } from "@/lib/types";

type Props = {
  userName: string;
  role: Role;
  children: React.ReactNode;
};

export function AdminShell({ userName, role, children }: Props) {
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
          role={role}
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
