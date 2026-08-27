"use client";

import { useEffect } from "react";

/**
 * Auto-triggers the browser print dialog shortly after mount. Drop this into
 * any `?print=1` page (acknowledgment slip, sticker, invoice, …) instead of
 * wiring up window.print() by hand on every one.
 */
export function PrintTrigger() {
  useEffect(() => {
    const timer = window.setTimeout(() => window.print(), 300);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
