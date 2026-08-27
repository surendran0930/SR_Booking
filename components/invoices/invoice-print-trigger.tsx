"use client";

import { useEffect } from "react";

export function InvoicePrintTrigger() {
  useEffect(() => {
    const timer = window.setTimeout(() => window.print(), 300);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
