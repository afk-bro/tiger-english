// src/components/ui/Button.tsx
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";

type ButtonProps = {
  children: ReactNode;
  to?: string; // if present, renders a <Link>
  iconRight?: ReactNode;
  iconLeft?: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "outline" | "white" | "danger";
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  type?: "button" | "submit";
  fullWidth?: boolean;
  block?: boolean;
  align?: "left" | "center" | "right";
  disabled?: boolean;
  onClick?: () => void;
};

export default function Button({
  children,
  to,
  iconRight,
  variant = "primary",
  className = "",
  size = "md",
  type = "button",
  fullWidth,
  block,
  align,
  disabled = false,
  onClick,
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200";

  const styles = {
    primary:
      "bg-gradient-to-r from-accent-600 to-accent-400 hover:from-accent-800 hover:to-accent-300 text-gray-800 shadow-lg hover:shadow-xl transform hover:-translate-y-1 shadow-md hover:shadow-lg border border-gold-400",
    secondary:
      "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600",
    ghost:
      "text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300",
    outline:
      "border border-white text-white hover:text-white/80 hover:border-white/50",
    white:
      "bg-white text-primary-600 hover:bg-primary-50 shadow-lg hover:shadow-xl transform hover:-translate-y-1",
    danger:
      "bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700",
  };

  const sizeStyles = {
    xs: "px-2 py-1 text-xs",
    sm: "px-4 py-2 text-sm rounded-md",
    md: "px-6 py-3 text-base rounded-lg",
    lg: "px-8 py-4 text-lg rounded-xl",
  };

  const layoutStyles = clsx({
    "w-full": fullWidth,
    block: block,
    "text-left": align === "left",
    "text-center": align === "center",
    "text-right": align === "right",
  });

  const classes = clsx(
    base,
    styles[variant],
    sizeStyles[size ?? "md"],
    layoutStyles,
    className
  );

  const content = (
    <span className={classes}>
      {children}
      {iconRight}
    </span>
  );

  return to ? (
    <Link to={to}>{content}</Link>
  ) : (
    <button
      type={type}
      className={clsx(classes, disabled && "opacity-50 cursor-not-allowed")}
      onClick={onClick}
    >
      {children}
      {iconRight}
    </button>
  );
}
