import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";

type ButtonProps = {
  children: ReactNode;
  to?: string;
  iconRight?: ReactNode;
  iconLeft?: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "outline" | "white" | "danger";
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  type?: "button" | "submit";
  fullWidth?: boolean;
  block?: boolean;
  align?: "left" | "center" | "right";
  disabled?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
};

export default function Button({
  children,
  to,
  iconRight,
  iconLeft,
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
    "inline-flex items-center justify-center gap-2 font-semibold rounded-xl " +
    "transition-all duration-200 ease-out " +
    "active:scale-95 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40";

  const styles = {
    primary:
      "bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white shadow-sm hover:shadow-md",
    secondary:
      "bg-white hover:bg-semantic-surface-2 text-semantic-text dark:bg-semantic-surface dark:hover:bg-semantic-surface-2 dark:text-semantic-text border border-semantic-border",
    ghost:
      "text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300",
    outline:
      "border border-white text-white hover:text-white/80 hover:border-white/50",
    white:
      "bg-white text-primary-600 hover:bg-primary-50 shadow-sm hover:shadow-md",
    danger:
      "bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700",
  };

  const sizeStyles = {
    xs: "px-2 py-1 text-xs rounded-md",
    sm: "px-4 py-2 text-sm rounded-lg",
    md: "px-6 py-3 text-base rounded-xl",
    lg: "px-8 py-4 text-lg rounded-xl",
  };

  const layoutStyles = clsx({
    "w-full": fullWidth,
    block: block,
    "text-left": align === "left",
    "text-center": align === "center",
    "text-right": align === "right",
  });

  const classes = clsx(base, styles[variant], sizeStyles[size ?? "md"], layoutStyles, className);

  if (to) {
    if (disabled) {
      return (
        <span className={clsx(classes, "opacity-50 cursor-not-allowed")}>
          {iconLeft}
          {children}
          {iconRight}
        </span>
      );
    }
    return (
      <Link to={to} className={classes}>
        {iconLeft}
        {children}
        {iconRight}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={clsx(classes, disabled && "opacity-50 cursor-not-allowed")}
      disabled={disabled}
      onClick={onClick}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
