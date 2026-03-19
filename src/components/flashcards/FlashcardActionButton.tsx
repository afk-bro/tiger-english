// src/components/flashcards/FlashcardActionButton.tsx
import { type ReactNode } from "react";
import { IconButton } from "@/components/ui/IconButton";
import clsx from "clsx";

export interface FlashcardActionButtonProps {
  icon: ReactNode;
  label?: string;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean; // For toggle states like study mode
  showLabel?: boolean; // Control label visibility on mobile
  className?: string;
}

export function FlashcardActionButton({
  icon,
  label,
  tooltip,
  onClick,
  disabled = false,
  active = false,
  showLabel = true,
  className = ""
}: FlashcardActionButtonProps) {
  return (
    <div className={clsx("flex flex-col items-center gap-1", className)}>
      <IconButton
        icon={icon}
        onClick={onClick}
        disabled={disabled}
        aria-label={tooltip}
        className={clsx(
          "transition-all duration-200",
          active && "bg-primary-100 text-primary-700 border-primary-300",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />
      
      {label && showLabel && (
        <span 
          className={clsx(
            "text-xs font-medium text-center transition-colors duration-200",
            "hidden sm:block", // Hide on mobile by default
            active ? "text-primary-700" : "text-gray-600",
            disabled && "text-gray-400"
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}
