import * as React from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import {
  DayButton,
  DayPicker,
  getDefaultClassNames,
  useDayPicker,
  type MonthCaptionProps,
} from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function useOnClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  handler: () => void,
  enabled: boolean,
) {
  React.useEffect(() => {
    if (!enabled) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (ref.current?.contains(target)) return;
      handler();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [ref, handler, enabled]);
}

function CalendarMonthCaption({ calendarMonth }: MonthCaptionProps) {
  const { goToMonth, dayPickerProps } = useDayPicker();
  const [monthMenuOpen, setMonthMenuOpen] = React.useState(false);
  const [yearMenuOpen, setYearMenuOpen] = React.useState(false);
  const monthMenuRef = React.useRef<HTMLDivElement>(null);
  const yearMenuRef = React.useRef<HTMLDivElement>(null);
  const yearListRef = React.useRef<HTMLDivElement>(null);

  const date = calendarMonth.date;
  const currentMonth = date.getMonth();
  const currentYear = date.getFullYear();

  const startYear =
    dayPickerProps.startMonth?.getFullYear() ?? currentYear - 100;
  const endYear = dayPickerProps.endMonth?.getFullYear() ?? currentYear;

  const years = React.useMemo(() => {
    const list: number[] = [];
    for (let year = endYear; year >= startYear; year -= 1) {
      list.push(year);
    }
    return list;
  }, [startYear, endYear]);

  useOnClickOutside(monthMenuRef, () => setMonthMenuOpen(false), monthMenuOpen);
  useOnClickOutside(yearMenuRef, () => setYearMenuOpen(false), yearMenuOpen);

  React.useEffect(() => {
    if (!yearMenuOpen || !yearListRef.current) return;
    yearListRef.current
      .querySelector('[data-selected="true"]')
      ?.scrollIntoView({ block: "center" });
  }, [yearMenuOpen, currentYear]);

  const goTo = (year: number, month: number) => {
    goToMonth(new Date(year, month, 1));
  };

  const pickerButtonClass =
    "inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

  const menuClass =
    "calendar-month-year-menu absolute top-full z-50 mt-1 min-w-[9rem] rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md";

  return (
    <div className="pointer-events-none relative flex h-(--cell-size) w-full items-center justify-center gap-1.5 px-(--cell-size)">
      <div className="pointer-events-auto relative" ref={monthMenuRef}>
        <button
          type="button"
          aria-expanded={monthMenuOpen}
          aria-haspopup="listbox"
          className={pickerButtonClass}
          onClick={() => {
            setYearMenuOpen(false);
            setMonthMenuOpen((open) => !open);
          }}
        >
          {MONTH_LABELS[currentMonth]}
          <ChevronDownIcon className="size-3.5 text-muted-foreground" />
        </button>
        {monthMenuOpen && (
          <div className={cn(menuClass, "left-0")} role="listbox">
            {MONTH_LABELS.map((label, monthIndex) => (
              <button
                key={label}
                type="button"
                role="option"
                aria-selected={monthIndex === currentMonth}
                data-selected={monthIndex === currentMonth ? "true" : undefined}
                className="calendar-month-year-menu__item w-full"
                onClick={() => {
                  goTo(currentYear, monthIndex);
                  setMonthMenuOpen(false);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pointer-events-auto relative" ref={yearMenuRef}>
        <button
          type="button"
          aria-expanded={yearMenuOpen}
          aria-haspopup="listbox"
          className={pickerButtonClass}
          onClick={() => {
            setMonthMenuOpen(false);
            setYearMenuOpen((open) => !open);
          }}
        >
          {currentYear}
          <ChevronDownIcon className="size-3.5 text-muted-foreground" />
        </button>
        {yearMenuOpen && (
          <div
            ref={yearListRef}
            className={cn(menuClass, "right-0 max-h-48 overflow-y-auto")}
            role="listbox"
          >
            {years.map((year) => (
              <button
                key={year}
                type="button"
                role="option"
                aria-selected={year === currentYear}
                data-selected={year === currentYear ? "true" : undefined}
                className="calendar-month-year-menu__item w-full"
                onClick={() => {
                  goTo(year, currentMonth);
                  setYearMenuOpen(false);
                }}
              >
                {year}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  startMonth,
  endMonth,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();
  const resolvedStartMonth = React.useMemo(
    () => startMonth ?? new Date(new Date().getFullYear() - 100, 0, 1),
    [startMonth],
  );
  const resolvedEndMonth = React.useMemo(
    () => endMonth ?? new Date(new Date().getFullYear(), 11, 31),
    [endMonth],
  );

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      startMonth={resolvedStartMonth}
      endMonth={resolvedEndMonth}
      className={cn(
        "bg-background group/calendar p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: date =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "flex gap-4 flex-col md:flex-row relative",
          defaultClassNames.months
        ),
        month: cn("flex flex-col w-full gap-4", defaultClassNames.month),
        nav: cn(
          "pointer-events-none z-30 flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "pointer-events-auto relative z-30 size-(--cell-size) aria-disabled:opacity-50 p-0 select-none",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "pointer-events-auto relative z-30 size-(--cell-size) aria-disabled:opacity-50 p-0 select-none",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex items-center justify-center h-(--cell-size) w-full px-(--cell-size)",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "w-full flex items-center text-sm font-medium justify-center h-(--cell-size) gap-1.5",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative has-focus:border-ring border border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] rounded-md",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute bg-popover inset-0 opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "select-none font-medium",
          captionLayout === "label"
            ? "text-sm"
            : "rounded-md pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-muted-foreground [&>svg]:size-3.5",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none",
          defaultClassNames.weekday
        ),
        week: cn("flex w-full mt-2", defaultClassNames.week),
        week_number_header: cn(
          "select-none w-(--cell-size)",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-[0.8rem] select-none text-muted-foreground",
          defaultClassNames.week_number
        ),
        day: cn(
          "relative w-full h-full p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none",
          defaultClassNames.day
        ),
        range_start: cn(
          "rounded-l-md bg-accent",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("rounded-r-md bg-accent", defaultClassNames.range_end),
        today: cn(
          "bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        MonthCaption: CalendarMonthCaption,
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          );
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            );
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            );
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          );
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
