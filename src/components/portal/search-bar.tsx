"use client";

import type { ReactNode } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SearchBar({
  value,
  onChange,
  label,
  placeholder,
  className,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("search-box", className)}>
      <Search size={20} aria-hidden="true" />
      <Input
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          <X />
        </Button>
      )}
      {children}
    </div>
  );
}
