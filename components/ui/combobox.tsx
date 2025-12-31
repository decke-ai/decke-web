"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ComboboxOption {
  label: string;
  value: string;
}

interface ComboboxProps {
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  options: ComboboxOption[];
  selectedValues?: string[];
  onSelect: (option: ComboboxOption) => void;
  onSearch?: (query: string) => void;
  onOpen?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  transformLabel?: (label: string) => string;
}

export function Combobox({
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  options,
  selectedValues = [],
  onSelect,
  onSearch,
  onOpen,
  isLoading,
  disabled,
  className,
  transformLabel,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setSearchValue("");
      onOpen?.();
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  const handleSelect = (option: ComboboxOption) => {
    onSelect(option);
    // Don't close the popover to allow multiple selections
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
          disabled={disabled}
        >
          <span className="truncate text-muted-foreground">{placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {isLoading && (
              <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
            )}
          </div>
          <CommandList>
            {!isLoading && options.length === 0 && (
              <CommandEmpty>{emptyText}</CommandEmpty>
            )}
            {options.length > 0 && (
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => handleSelect(option)}
                      className={cn(
                        "cursor-pointer",
                        isSelected && "opacity-50"
                      )}
                      disabled={isSelected}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {transformLabel ? transformLabel(option.label) : option.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
