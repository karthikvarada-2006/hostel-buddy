import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface DateTimePickerProps {
  label: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  minDate?: Date;
  error?: string;
  id?: string;
}

export function DateTimePicker({
  label,
  value,
  onChange,
  minDate,
  error,
  id,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange(undefined);
      return;
    }
    
    const now = new Date();
    // Preserve time if already set, otherwise default to current time (rounded up to next 15 min)
    let currentHours = value?.getHours() ?? now.getHours();
    let currentMinutes = value?.getMinutes() ?? Math.ceil(now.getMinutes() / 15) * 15;
    
    // Handle minute overflow
    if (currentMinutes >= 60) {
      currentMinutes = 0;
      currentHours = (currentHours + 1) % 24;
    }
    
    const newDate = new Date(date);
    newDate.setHours(currentHours, currentMinutes, 0, 0);
    onChange(newDate);
  };

  const handleTimeChange = (type: "hours" | "minutes", val: string) => {
    if (!value) {
      // If no date selected, use today
      const today = new Date();
      today.setHours(
        type === "hours" ? parseInt(val) : 9,
        type === "minutes" ? parseInt(val) : 0,
        0,
        0
      );
      onChange(today);
      return;
    }

    const newDate = new Date(value);
    if (type === "hours") {
      newDate.setHours(parseInt(val));
    } else {
      newDate.setMinutes(parseInt(val));
    }
    onChange(newDate);
  };

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              error && "border-destructive"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? (
              format(value, "MMM d, yyyy 'at' h:mm a")
            ) : (
              <span>Select date and time</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            disabled={(date) => {
              if (minDate) {
                const minDateOnly = new Date(minDate);
                minDateOnly.setHours(0, 0, 0, 0);
                const dateOnly = new Date(date);
                dateOnly.setHours(0, 0, 0, 0);
                return dateOnly < minDateOnly;
              }
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return date < today;
            }}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
          <div className="border-t p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Select
                value={value?.getHours()?.toString() ?? ""}
                onValueChange={(val) => handleTimeChange("hours", val)}
              >
                <SelectTrigger className="w-[110px]">
                  <SelectValue placeholder="Hour" />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((hour) => (
                    <SelectItem key={hour} value={hour.toString()}>
                      {formatHour(hour)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">:</span>
              <Select
                value={value?.getMinutes()?.toString() ?? ""}
                onValueChange={(val) => handleTimeChange("minutes", val)}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue placeholder="Min" />
                </SelectTrigger>
                <SelectContent>
                  {minutes.map((min) => (
                    <SelectItem key={min} value={min.toString()}>
                      {min.toString().padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="border-t p-2">
            <Button
              size="sm"
              className="w-full"
              onClick={() => setIsOpen(false)}
            >
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
