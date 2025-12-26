"use client"

import * as React from "react"
import { format, subDays, subMonths, subYears, startOfDay, endOfDay } from "date-fns"
import { Calendar as CalendarIcon, ChevronDown, X } from "lucide-react"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  className?: string
  placeholder?: string
  align?: "start" | "center" | "end"
  showPresets?: boolean
}

const presets = [
  {
    label: "Today",
    getValue: () => {
      const today = new Date()
      return { from: startOfDay(today), to: endOfDay(today) }
    },
  },
  {
    label: "Last 7 days",
    getValue: () => {
      const today = new Date()
      return { from: subDays(today, 7), to: today }
    },
  },
  {
    label: "Last 30 days",
    getValue: () => {
      const today = new Date()
      return { from: subDays(today, 30), to: today }
    },
  },
  {
    label: "Last 3 months",
    getValue: () => {
      const today = new Date()
      return { from: subMonths(today, 3), to: today }
    },
  },
  {
    label: "Last year",
    getValue: () => {
      const today = new Date()
      return { from: subYears(today, 1), to: today }
    },
  },
  {
    label: "Last 5 years",
    getValue: () => {
      const today = new Date()
      return { from: subYears(today, 5), to: today }
    },
  },
]

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
  placeholder = "Select date range",
  align = "start",
  showPresets = true,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const handlePresetClick = (getValue: () => DateRange) => {
    onDateRangeChange(getValue())
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDateRangeChange(undefined)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date-range"
            variant="outline"
            size="sm"
            className={cn(
              "justify-start text-left font-normal h-9 min-w-[200px]",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "MMM d, yyyy")} -{" "}
                  {format(dateRange.to, "MMM d, yyyy")}
                </>
              ) : (
                format(dateRange.from, "MMM d, yyyy")
              )
            ) : (
              <span>{placeholder}</span>
            )}
            {dateRange ? (
              <X
                className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            ) : (
              <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <div className="flex">
            {showPresets && (
              <div className="flex flex-col gap-1 border-r p-3 min-w-[130px]">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Quick Select
                </p>
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className="justify-start h-8 text-xs"
                    onClick={() => handlePresetClick(preset.getValue)}
                  >
                    {preset.label}
                  </Button>
                ))}
                <div className="border-t my-2" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start h-8 text-xs text-muted-foreground"
                  onClick={() => onDateRangeChange(undefined)}
                >
                  All time
                </Button>
              </div>
            )}
            <div className="p-3">
              <Calendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={onDateRangeChange}
                numberOfMonths={2}
                disabled={{ after: new Date() }}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
