"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type AppShellProps = {
  sidebar: React.ReactNode;
  topbar?: React.ReactNode;
  children: React.ReactNode;
  sidebarOpen: boolean;
  onSidebarOpenChange: (open: boolean) => void;
  className?: string;
};

export function AppShell({
  sidebar,
  topbar,
  children,
  sidebarOpen,
  onSidebarOpenChange,
  className,
}: AppShellProps) {
  return (
    <div className={cn("flex min-h-screen bg-muted/30", className)}>
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          aria-label="Close navigation menu"
          onClick={() => onSidebarOpenChange(false)}
        />
      ) : null}

      {sidebar}

      <div className="flex min-w-0 flex-1 flex-col">
        {topbar}
        <main
          data-main-content
          className="flex-1 overflow-y-auto p-4 lg:p-6"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
