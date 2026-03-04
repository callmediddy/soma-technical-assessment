"use client";
import { useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { TodoWithRelations } from "../types";
import DatePicker from "./DatePicker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  todos: TodoWithRelations[];
  onCreated: () => void;
}

export default function TodoForm({ todos, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedDepIds, setSelectedDepIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const isPastDate = dueDate
    ? (() => { const [y, m, d] = dueDate.split("-").map(Number); return new Date(y, m - 1, d) < new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()); })()
    : false;

  const toggleDep = (id: number) =>
    setSelectedDepIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), dueDate: dueDate || undefined, dependencyIds: selectedDepIds }),
      });
      setTitle("");
      setDueDate("");
      setSelectedDepIds([]);
      onCreated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-neutral-800 rounded-lg bg-neutral-950 overflow-hidden">
      <div className="flex items-center">
        <input
          type="text"
          className="flex-grow bg-transparent px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none"
          placeholder="Add a task…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="h-8 w-px bg-neutral-800 mx-1 flex-shrink-0" />
        <DatePicker value={dueDate} onChange={setDueDate} />
        {todos.length > 0 && (
          <>
            <div className="h-8 w-px bg-neutral-800 mx-1 flex-shrink-0" />
            <Popover>
              <PopoverTrigger className="px-3 py-3 text-sm text-neutral-500 hover:text-neutral-300 transition-colors flex items-center gap-1.5 flex-shrink-0">
                Depends on
                {selectedDepIds.length > 0 && (
                  <span className="bg-neutral-800 text-neutral-300 rounded px-1.5 py-0.5 text-[10px]">
                    {selectedDepIds.length}
                  </span>
                )}
              </PopoverTrigger>
              <PopoverContent align="start" className="w-48 p-1 border-neutral-800 bg-neutral-950">
                <div className="overflow-y-auto max-h-[175px]">
                  {todos.map((t) => {
                    const checked = selectedDepIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleDep(t.id)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-neutral-800 transition-colors text-left"
                      >
                        <span className={`flex-shrink-0 w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${
                          checked ? "border-neutral-500 bg-neutral-700" : "border-neutral-700 bg-transparent"
                        }`}>
                          {checked && <Check className="w-2.5 h-2.5 text-neutral-200" strokeWidth={3} />}
                        </span>
                        <span className={`text-xs truncate transition-colors ${checked ? "text-neutral-200" : "text-neutral-500"}`}>
                          {t.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}
        <div className="h-8 w-px bg-neutral-800 mx-1 flex-shrink-0" />
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="px-4 py-3 text-sm font-medium text-white hover:text-neutral-300 transition-colors disabled:text-neutral-700 disabled:cursor-not-allowed"
        >
          {loading ? "Adding…" : "Add"}
        </button>
      </div>

      {isPastDate && (
        <div className="border-t border-amber-900/50 bg-amber-950/40 px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
          <span className="text-xs text-amber-500">This due date is in the past.</span>
        </div>
      )}
    </form>
  );
}
