"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface YearPickerProps {
  value?: number;
  onChange: (year: number | undefined) => void;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
  className?: string;
}

export function YearPicker({
  value,
  onChange,
  placeholder = "Year",
  minYear = 1900,
  maxYear = new Date().getFullYear(),
  className,
}: YearPickerProps) {
  const [inputValue, setInputValue] = React.useState(value?.toString() || "");

  // Sync input with value prop
  React.useEffect(() => {
    setInputValue(value?.toString() || "");
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;

    // Only allow digits
    if (rawValue && !/^\d*$/.test(rawValue)) {
      return;
    }

    setInputValue(rawValue);

    // Parse and validate
    if (!rawValue) {
      onChange(undefined);
      return;
    }

    const numValue = parseInt(rawValue, 10);

    // Only update if it's a valid 4-digit year
    if (rawValue.length === 4 && numValue >= minYear && numValue <= maxYear) {
      onChange(numValue);
    }
  };

  const handleBlur = () => {
    // On blur, validate and correct the value
    if (!inputValue) {
      onChange(undefined);
      return;
    }

    const numValue = parseInt(inputValue, 10);

    if (isNaN(numValue) || inputValue.length !== 4) {
      // Invalid input, reset to previous value or clear
      setInputValue(value?.toString() || "");
      return;
    }

    // Clamp to valid range
    const clampedValue = Math.max(minYear, Math.min(maxYear, numValue));
    onChange(clampedValue);
    setInputValue(clampedValue.toString());
  };

  const handleClear = () => {
    setInputValue("");
    onChange(undefined);
  };

  return (
    <div className={cn("relative", className)}>
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn(
          "h-9 pr-8",
          value && "pr-8"
        )}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
