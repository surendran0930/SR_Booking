"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { SearchInput } from "@/components/shared/search-input";

type UrlSearchBarProps = {
  placeholder?: string;
  paramName?: string;
  className?: string;
};

export function UrlSearchBar({
  placeholder = "Search…",
  paramName = "q",
  className,
}: UrlSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [value, setValue] = useState(() => searchParams.get(paramName) ?? "");

  useEffect(() => {
    setValue(searchParams.get(paramName) ?? "");
  }, [searchParams, paramName]);

  function handleChange(next: string) {
    setValue(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next.trim()) {
      params.set(paramName, next.trim());
    } else {
      params.delete(paramName);
    }
    params.delete("page");
    startTransition(() => {
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  return (
    <SearchInput
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
    />
  );
}
