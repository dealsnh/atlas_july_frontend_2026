import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface AtlasSelectOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
  itemClassName?: string;
}

export interface AtlasSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: AtlasSelectOption[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  size?: "sm" | "default";
  disabled?: boolean;
  onTriggerClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function AtlasSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  className,
  triggerClassName,
  contentClassName,
  size = "default",
  disabled,
  onTriggerClick,
}: AtlasSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        size={size}
        className={cn(
          "atlas-select-trigger",
          "h-auto !pr-8",
          "[&_[data-slot=select-value]]:line-clamp-none",
          "[&_[data-slot=select-value]]:flex-1",
          "[&_[data-slot=select-value]]:min-w-0",
          "[&_[data-slot=select-value]]:overflow-visible",
          "[&_[data-slot=select-value]]:text-clip",
          className,
          triggerClassName,
        )}
        onClick={onTriggerClick}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={cn("atlas-select-content", contentClassName)} position="popper">
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className={cn("atlas-select-item", option.itemClassName)}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
