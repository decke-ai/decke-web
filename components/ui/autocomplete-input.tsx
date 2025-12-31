"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface AutocompleteOption {
  label: string;
  value: string;
}

interface AutocompleteInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSelect: (option: AutocompleteOption) => void;
  options: AutocompleteOption[];
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function AutocompleteInput({
  placeholder,
  value: controlledValue,
  onChange,
  onSelect,
  options,
  isLoading,
  disabled,
  className,
}: AutocompleteInputProps) {
  const [inputValue, setInputValue] = useState(controlledValue || "");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (controlledValue !== undefined) {
      setInputValue(controlledValue);
    }
  }, [controlledValue]);

  useEffect(() => {
    if (options.length > 0 && inputValue.length >= 2) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [options, inputValue]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      setHighlightedIndex(-1);
      onChange?.(newValue);
    },
    [onChange]
  );

  const handleSelect = useCallback(
    (option: AutocompleteOption) => {
      onSelect(option);
      setInputValue("");
      setIsOpen(false);
      onChange?.("");
    },
    [onSelect, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          e.preventDefault();
          if (highlightedIndex >= 0 && options[highlightedIndex]) {
            handleSelect(options[highlightedIndex]);
          }
          break;
        case "Escape":
          setIsOpen(false);
          break;
      }
    },
    [isOpen, options, highlightedIndex, handleSelect]
  );

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  }, []);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => options.length > 0 && setIsOpen(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-8"
        />
        {isLoading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {isOpen && options.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md"
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              className={cn(
                "cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none",
                highlightedIndex === index
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
              onClick={() => handleSelect(option)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
