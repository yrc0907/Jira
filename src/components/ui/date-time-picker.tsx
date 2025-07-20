"use client";

import * as React from "react";
import { format, parse, isValid, set, getDate } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import type { SelectSingleEventHandler } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "./input";

interface DateTimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  className?: string;
}

export function DateTimePicker({ date, setDate, className }: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const [month, setMonth] = React.useState<Date>(date || new Date());

  const [time, setTime] = React.useState<string>(
    date
      ? format(date, "HH:mm")
      : ""
  );

  const [inputValue, setInputValue] = React.useState<string>(
    date ? format(date, "y-MM-dd HH:mm") : ""
  );

  React.useEffect(() => {
    if (date) {
      setInputValue(format(date, "y-MM-dd HH:mm"));
      setTime(format(date, "HH:mm"));
    } else {
      setInputValue("");
      setTime("");
    }
  }, [date]);


  const handleSelect: SelectSingleEventHandler = (day, selected) => {
    const newDate = set(selected, {
      hours: time ? parseInt(time.split(":")[0]) : 0,
      minutes: time ? parseInt(time.split(":")[1]) : 0,
    })
    setMonth(newDate);
    setDate(newDate);
    setOpen(false);
  };

  const handleTimeChange = (value: string) => {
    setTime(value);
    if (!date) {
      // if no date is set, but time is, create a new date
      const todayWithTime = set(new Date(), {
        hours: parseInt(value.split(":")[0]),
        minutes: parseInt(value.split(":")[1]),
      });
      setDate(todayWithTime);
      return;
    };
    const newDate = set(date, {
      hours: parseInt(value.split(":")[0]),
      minutes: parseInt(value.split(":")[1]),
    });
    setDate(newDate);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    const parsedDate = parse(val, "y-MM-dd HH:mm", new Date());
    if (isValid(parsedDate)) {
      setDate(parsedDate);
      setMonth(parsedDate);
    }
  };


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn("relative", className)}>
          <Input
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Pick a date"
            className="pr-10"
          />
          <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          month={month}
          onMonthChange={setMonth}
          initialFocus
          fixedWeeks
        />
        <div className="p-3 border-t border-border">
          <Input
            type="time"
            value={time}
            onChange={(e) => handleTimeChange(e.target.value)}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
} 