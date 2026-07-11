"use client";

import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DateRangePickerProps = {
  dateFrom?: string;
  dateTo?: string;
  onChange: (from?: string, to?: string) => void;
  placeholder?: string;
  className?: string;
};

function parseDate(value?: string) {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
}

export function DateRangePicker({
  dateFrom,
  dateTo,
  onChange,
  placeholder = "Período",
  className,
}: DateRangePickerProps) {
  const range: DateRange | undefined =
    dateFrom || dateTo
      ? { from: parseDate(dateFrom), to: parseDate(dateTo) }
      : undefined;

  const label = range?.from
    ? range.to
      ? `${format(range.from, "dd/MM/yyyy", { locale: ptBR })} – ${format(range.to, "dd/MM/yyyy", { locale: ptBR })}`
      : `${format(range.from, "dd/MM/yyyy", { locale: ptBR })} – ...`
    : placeholder;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={cn(
              "collaborator-filter-date h-9 w-full justify-start gap-2 px-3 font-normal",
              className
            )}
          >
            <CalendarIcon className="h-4 w-4 shrink-0 text-slate-400" />
            <span className={cn("truncate text-left text-sm", !range?.from && "text-slate-400")}>
              {label}
            </span>
          </Button>
        }
      />
      <PopoverContent className="w-auto border-slate-200 p-0 shadow-lg" align="start">
        <Calendar
          mode="range"
          selected={range}
          onSelect={(next) => {
            onChange(
              next?.from ? format(next.from, "yyyy-MM-dd") : undefined,
              next?.to ? format(next.to, "yyyy-MM-dd") : undefined
            );
          }}
          numberOfMonths={2}
          locale={ptBR}
          defaultMonth={range?.from ?? new Date()}
        />
      </PopoverContent>
    </Popover>
  );
}
