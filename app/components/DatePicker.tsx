"use client";
import { useState } from "react";
import { CalendarIcon, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface Props {
  value: string; // YYYY-MM-DD or ""
  onChange: (value: string) => void;
}

function parseLocal(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function DatePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseLocal(value) : undefined;

  const handleSelect = (date: Date | undefined) => {
    onChange(date ? toYMD(date) : "");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-full rounded-none px-3 text-sm font-normal text-muted-foreground hover:text-foreground hover:bg-transparent gap-1.5"
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          {selected
            ? selected.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "Due date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-neutral-800 bg-neutral-950" align="start">
        <div className="flex items-center justify-between px-3 pt-3">
          <span className="text-xs text-muted-foreground font-medium">Due date</span>
          {selected && (
            <button
              onClick={() => { onChange(""); setOpen(false); }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
