import Image from "next/image";
import { cn } from "@/lib/utils";
import { DEFAULT_LOGO_PATH } from "@/lib/constants";

type BrandLogoProps = {
  className?: string;
  size?: number;
  priority?: boolean;
  showText?: boolean;
  textClassName?: string;
};

export function BrandLogo({
  className,
  size = 40,
  priority = false,
  showText = false,
  textClassName,
}: BrandLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src={DEFAULT_LOGO_PATH}
        alt="SR Tech Solutions"
        width={size}
        height={size}
        priority={priority}
        className="rounded-full object-contain"
      />
      {showText ? (
        <span
          className={cn(
            "text-sm font-bold tracking-wide text-primary",
            textClassName,
          )}
        >
          SR TECH SOLUTIONS
        </span>
      ) : null}
    </span>
  );
}
