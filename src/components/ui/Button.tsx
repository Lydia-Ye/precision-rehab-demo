import clsx from "clsx";
import { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
}

const baseStyles =
  "inline-flex items-center justify-center rounded-full text-sm font-medium px-4 py-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-[var(--color-primary)] text-white hover:opacity-90",
  secondary: "bg-[var(--color-muted)] text-[var(--foreground)] hover:opacity-90",
  outline: "border border-[var(--color-border)] text-[var(--foreground)] hover:bg-[var(--color-muted)]",
  danger: "bg-red-500 text-white hover:bg-red-600",
  ghost: "text-[var(--foreground)] hover:bg-[var(--color-muted)]",
};

export default function Button({
  variant = "primary",
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}
