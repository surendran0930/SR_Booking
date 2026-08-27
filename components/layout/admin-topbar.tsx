"use client";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminTopbarProps = {
  title?: string;
  userName?: string;
  onMenuClick: () => void;
  className?: string;
};

export function AdminTopbar({
  title,
  userName,
  onMenuClick,
  className,
}: AdminTopbarProps) {
  return (
    <header
      data-topbar
      className={cn(
        "no-print sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-6",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="min-w-0 flex-1">
        {title ? (
          <h1 className="truncate text-lg font-semibold text-foreground">
            {title}
          </h1>
        ) : null}
      </div>

      {userName ? (
        <p className="hidden truncate text-sm text-muted-foreground sm:block">
          {userName}
        </p>
      ) : null}
    </header>
  );
}
