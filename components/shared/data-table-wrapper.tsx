import { cn } from "@/lib/utils";

type DataTableWrapperProps = {
  children: React.ReactNode;
  className?: string;
};

export function DataTableWrapper({
  children,
  className,
}: DataTableWrapperProps) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-xl border bg-card shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
