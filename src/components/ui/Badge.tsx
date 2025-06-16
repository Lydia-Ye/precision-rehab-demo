import clsx from "clsx";
import { HTMLAttributes, ReactNode } from "react";

export type BadgeVariant = "default" | "active" | "past" | "highlight" | "neutral";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const baseStyles =
  "inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium transition-colors";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-[var(--color-muted)] text-[var(--foreground)]",
  active: "bg-lime-200 text-green-800",
  past: "bg-rose-100 text-rose-800",
  highlight: "bg-[var(--color-primary)] text-white",
  neutral: "bg-gray-200 text-gray-700",
};

export default function Badge({
  variant = "default",
  children,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={clsx(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
} 
