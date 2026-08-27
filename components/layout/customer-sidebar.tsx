"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutDashboard, User } from "lucide-react";

import { BrandLogo } from "@/components/shared/brand-logo";
import { LogoutButton } from "@/components/layout/logout-button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/customer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customer/profile", label: "Profile", icon: User },
  { href: "/customer/invoices", label: "Invoices", icon: FileText },
] as const;

type CustomerSidebarProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logoutAction: () => void | Promise<void>;
  className?: string;
};

export function CustomerSidebar({
  open,
  onOpenChange,
  logoutAction,
  className,
}: CustomerSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside
      data-customer-sidebar
      data-sidebar
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-card transition-transform duration-200 lg:static lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
        className,
      )}
    >
      <div className="flex h-16 items-center border-b px-4">
        <Link
          href="/customer/dashboard"
          className="flex min-w-0 items-center gap-2.5"
          onClick={() => onOpenChange(false)}
        >
          <BrandLogo size={40} />
          <span className="truncate text-sm font-bold tracking-wide text-primary">
            SR TECH SOLUTIONS
          </span>
        </Link>
      </div>

      <nav
        data-sidebar-nav
        className="flex flex-1 flex-col gap-1 overflow-y-auto p-4"
        aria-label="Customer navigation"
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => onOpenChange(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <Separator className="mb-4 lg:hidden" />
        <LogoutButton logoutAction={logoutAction} />
      </div>
    </aside>
  );
}
