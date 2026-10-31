"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function FilterMultiSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string[];
  options: string[];
  onChange: (value: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const matches = options.filter((option) =>
    option.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="od-field select-field">
      <Label htmlFor={id}>{label}</Label>
      <DropdownMenu onOpenChange={() => setSearch("")}>
        <DropdownMenuTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className="filter-multi-trigger"
            aria-label={`${label}: ${value.length ? `${value.length} selected` : "All"}`}
          >
            <span>
              {value.length === 1
                ? value[0]
                : value.length
                  ? `${value.length} selected`
                  : `All ${label.toLowerCase()}`}
            </span>
            <ChevronDown size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="bottom"
          align="start"
          avoidCollisions={false}
          collisionPadding={8}
          className="filter-multi-menu"
        >
          <div className="filter-multi-search">
            <Input
              aria-label={`Search ${label.toLowerCase()}`}
              placeholder={`Search ${label.toLowerCase()}…`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Escape" && event.key !== "Tab")
                  event.stopPropagation();
              }}
            />
          </div>
          <div className="filter-multi-options">
            {matches.map((option) => (
              <DropdownMenuCheckboxItem
                key={option}
                checked={value.includes(option)}
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={(checked) =>
                  onChange(
                    checked
                      ? [...value, option]
                      : value.filter((item) => item !== option),
                  )
                }
              >
                {option}
              </DropdownMenuCheckboxItem>
            ))}
            {!matches.length && (
              <p className="filter-multi-empty">No matches found.</p>
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!value.length}
            onSelect={(event) => {
              event.preventDefault();
              onChange([]);
            }}
          >
            Clear selection{value.length ? ` (${value.length})` : ""}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
