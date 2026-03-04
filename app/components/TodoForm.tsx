"use client";
import { useState } from "react";
import { TodoWithRelations } from "../types";

interface Props {
  todos: TodoWithRelations[];
  onCreated: () => void;
}

export default function TodoForm({ todos, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedDepIds, setSelectedDepIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

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
        <input
          type="date"
          className="bg-transparent px-3 py-3 text-sm text-neutral-400 focus:outline-none focus:text-white transition-colors"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <div className="h-8 w-px bg-neutral-800 mx-1 flex-shrink-0" />
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="px-4 py-3 text-sm font-medium text-white hover:text-neutral-300 transition-colors disabled:text-neutral-700 disabled:cursor-not-allowed"
        >
          {loading ? "Adding…" : "Add"}
        </button>
      </div>

      {todos.length > 0 && (
        <div className="border-t border-neutral-800 px-4 py-2">
          <details className="group">
            <summary className="text-xs text-neutral-500 cursor-pointer select-none hover:text-neutral-300 transition-colors list-none flex items-center gap-1">
              <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Depends on
              {selectedDepIds.length > 0 && (
                <span className="ml-1 bg-neutral-800 text-neutral-300 rounded px-1.5 py-0.5 text-[10px]">
                  {selectedDepIds.length}
                </span>
              )}
            </summary>
            <div className="mt-2 flex flex-wrap gap-2 pb-1">
              {todos.map((t) => (
                <label key={t.id} className="flex items-center gap-1.5 cursor-pointer group/item">
                  <input
                    type="checkbox"
                    checked={selectedDepIds.includes(t.id)}
                    onChange={() => toggleDep(t.id)}
                    className="w-3.5 h-3.5 rounded border-neutral-700 bg-neutral-900 accent-white"
                  />
                  <span className="text-xs text-neutral-400 group-hover/item:text-neutral-200 transition-colors">{t.title}</span>
                </label>
              ))}
            </div>
          </details>
        </div>
      )}
    </form>
  );
}
