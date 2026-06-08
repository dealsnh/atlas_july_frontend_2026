import * as React from "react";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDateString, formatDisplayDate, parseDateString } from "@/components/atlas/dateUtils";

export interface AtlasDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
}

export function AtlasDatePicker({
  value,
  onChange,
  className,
  placeholder = "Pick date",
  disabled,
  min,
  max,
}: AtlasDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = parseDateString(value);

  const isDisabled = (date: Date) => {
    const iso = formatDateString(date);
    if (min && iso < min) return true;
    if (max && iso > max) return true;
    return false;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn("atlas-date-trigger", !value && "atlas-date-trigger--empty", className)}
        >
          <CalendarIcon className="atlas-date-trigger__icon" />
          <span className="atlas-date-trigger__label">
            {value ? formatDisplayDate(value) : placeholder}
          </span>
          <ChevronDown className="atlas-date-trigger__chevron" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="atlas-date-popover" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (!date) return;
            onChange(formatDateString(date));
            setOpen(false);
          }}
          disabled={isDisabled}
          defaultMonth={selected}
          className="atlas-calendar"
          classNames={{
            button_previous: "atlas-calendar-nav",
            button_next: "atlas-calendar-nav",
            caption_label: "atlas-calendar-caption",
            weekday: "atlas-calendar-weekday",
            day: "atlas-calendar-day",
            today: "atlas-calendar-today",
            outside: "atlas-calendar-outside",
            disabled: "atlas-calendar-disabled",
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
