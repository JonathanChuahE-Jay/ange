"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "plain";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
};

const SIZES: Record<Size, string> = {
  sm: "min-h-9 px-4 text-sm",
  md: "min-h-11 px-6 text-[15px]",
  lg: "min-h-13 px-8 text-base",
};

/**
 * Buttons — hover: buttons/circle-drop (primary) / buttons/background-wipe (ghost),
 * press: buttons/tap-spring (global .tap-spring).
 */
export function Button({
  variant = "primary",
  size = "md",
  icon,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const base =
    "tap-spring inline-flex items-center justify-center gap-2 rounded-full font-semibold select-none transition-colors disabled:opacity-50";
  const variantClass =
    variant === "primary"
      ? "btn-circle-drop bg-rose text-white hover:bg-rosedeep"
      : variant === "ghost"
        ? "btn-wipe border border-rose bg-transparent text-rose"
        : "text-rose hover:bg-rosemist";

  return (
    <button className={`${base} ${SIZES[size]} ${variantClass} ${className}`} {...rest}>
      {icon}
      {children}
    </button>
  );
}
