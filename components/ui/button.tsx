import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

const base =
  "inline-flex items-center justify-center gap-2.5 rounded-xl font-semibold transition-all duration-300 ease-out";

const variants = {
  primary:
    "bg-green text-ink hover:bg-white hover:shadow-[0_0_36px_-6px_var(--color-green)]",
  outline:
    "border border-line text-text hover:border-green hover:text-green",
  ghost: "text-muted hover:text-text",
} as const;

const sizes = {
  md: "px-5 py-3 text-[0.92rem]",
  lg: "px-7 py-4 text-[1rem]",
} as const;

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
  external = false,
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
  external?: boolean;
}) {
  const classes = cn(base, variants[variant], sizes[size], className);

  if (external) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
