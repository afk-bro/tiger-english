import { Lightbulb, Info, AlertTriangle } from "lucide-react";
import { clsx } from "clsx";

type Props = { variant: "tip" | "note" | "warning"; content: string };

const VARIANT_STYLES = {
  tip: {
    border: "border-primary-400 dark:border-primary-500",
    bg: "bg-primary-50 dark:bg-primary-900/20",
    text: "text-primary-800 dark:text-primary-300",
    icon: Lightbulb,
  },
  note: {
    border: "border-accent-400 dark:border-accent-500",
    bg: "bg-accent-50 dark:bg-accent-900/20",
    text: "text-accent-800 dark:text-accent-300",
    icon: Info,
  },
  warning: {
    border: "border-amber-400 dark:border-amber-500",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-800 dark:text-amber-300",
    icon: AlertTriangle,
  },
};

export default function CalloutBlock({ variant, content }: Props) {
  const style = VARIANT_STYLES[variant];
  const Icon = style.icon;
  return (
    <div className={clsx("flex items-start gap-3 rounded-lg border-l-4 p-4", style.border, style.bg)}>
      <Icon className={clsx("w-5 h-5 flex-shrink-0 mt-0.5", style.text)} aria-hidden="true" />
      <p className={clsx("text-sm", style.text)}>{content}</p>
    </div>
  );
}
