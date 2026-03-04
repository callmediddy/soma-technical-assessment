"use client";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { TodoWithMeta, TodoWithRelations } from "./types"; // TodoWithMeta used by sortTodos
import { enrichTodos, parseLocalDate } from "./lib/todos";
import Nav from "./components/Nav";
import TodoForm from "./components/TodoForm";
import TodoCard from "./components/TodoCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Sort ─────────────────────────────────────────────────────────────────────

type SortKey = "createdAt_desc" | "createdAt_asc" | "dueDate_asc" | "dueDate_desc";

function sortTodos(todos: TodoWithMeta[], key: SortKey): TodoWithMeta[] {
  return [...todos].sort((a, b) => {
    const [field, dir] = key.split("_") as [string, "asc" | "desc"];
    const mul = dir === "asc" ? 1 : -1;
    if (field === "createdAt") {
      return mul * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    // dueDate: nulls always last
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return mul * (parseLocalDate(a.dueDate).getTime() - parseLocalDate(b.dueDate).getTime());
  });
}

const PER_PAGE_OPTIONS = [5, 10, 20, 50, 100];
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "createdAt_desc", label: "Created: Newest" },
  { value: "createdAt_asc",  label: "Created: Oldest" },
  { value: "dueDate_asc",    label: "Due date: Earliest" },
  { value: "dueDate_desc",   label: "Due date: Latest" },
];
const CONTAINER_WIDTH = ["max-w-2xl", "max-w-4xl", "max-w-5xl", "max-w-6xl"];
const GRID_COLS = ["grid-cols-1", "grid-cols-2", "grid-cols-3", "grid-cols-4"];

// ─── Search / filter ──────────────────────────────────────────────────────────

const DATE_FILTER_RE = /^([><]=?|=)\s*(.+)$/;

function filterTodos(todos: TodoWithMeta[], query: string): TodoWithMeta[] {
  const q = query.trim();
  if (!q) return todos;

  const dateMatch = q.match(DATE_FILTER_RE);
  if (dateMatch) {
    const op = dateMatch[1];          // >, <, >=, <=, =
    const parsed = new Date(dateMatch[2].trim());
    if (isNaN(parsed.getTime())) return todos; // unparseable — show all
    const threshold = parsed.getTime();
    return todos.filter((t) => {
      if (!t.dueDate) return false;
      const due = parseLocalDate(t.dueDate).getTime();
      if (op === ">"  || op === "gt") return due > threshold;
      if (op === ">=" || op === "gte") return due >= threshold;
      if (op === "<"  || op === "lt") return due < threshold;
      if (op === "<=" || op === "lte") return due <= threshold;
      if (op === "=")  return due === threshold;
      return true;
    });
  }

  const lower = q.toLowerCase();
  return todos.filter((t) => t.title.toLowerCase().includes(lower));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [todos, setTodos] = useState<TodoWithRelations[]>([]);
  const [columns, setColumns] = useState(4);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt_desc");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTodos = useCallback(async () => {
    try {
      const res = await fetch("/api/todos");
      const data = await res.json();
      if (Array.isArray(data)) setTodos(data);
    } catch (err) {
      console.error("Failed to fetch todos:", err);
    }
  }, []);

  useEffect(() => { fetchTodos(); }, [fetchTodos]);

  const enriched = enrichTodos(todos);
  const filtered = filterTodos(enriched, searchQuery);
  const sorted = sortTodos(filtered, sortKey);
  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * perPage, safePage * perPage);

  const containerW = CONTAINER_WIDTH[columns - 1];

  const handleSortChange = (val: SortKey) => { setSortKey(val); setPage(1); };
  const handlePerPageChange = (val: string) => { setPerPage(Number(val)); setPage(1); };
  const handleSearchChange = (val: string) => { setSearchQuery(val); setPage(1); };

  return (
    <div className="min-h-screen bg-black">
      <Nav itemCount={todos.length} />

      <main className={`${containerW} mx-auto px-6 py-10 space-y-6 transition-all duration-300`}>
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Things to do</h1>
          <p className="text-neutral-500 text-sm mt-1">Track tasks, dependencies, and deadlines.</p>
        </div>

        <TodoForm todos={todos} onCreated={fetchTodos} />

        {todos.length === 0 ? (
          <div className="border border-dashed border-neutral-800 rounded-lg py-16 text-center text-neutral-600 text-sm">
            No tasks yet. Add one above.
          </div>
        ) : (
          <>
            {/* Controls bar */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Sort */}
              <Select value={sortKey} onValueChange={handleSortChange}>
                <SelectTrigger className="h-8 w-44 text-xs bg-neutral-950 border-neutral-800 text-neutral-300 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-neutral-800 bg-neutral-950 text-xs">
                  {SORT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Per page */}
              <Select value={String(perPage)} onValueChange={handlePerPageChange}>
                <SelectTrigger className="h-8 w-28 text-xs bg-neutral-950 border-neutral-800 text-neutral-300 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-neutral-800 bg-neutral-950">
                  {PER_PAGE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)} className="text-xs">{n} per page</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Search */}
              <div className="relative flex items-center">
                <Search className="absolute left-2 w-3.5 h-3.5 text-neutral-600 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search name or >2026-03-10"
                  className="h-8 w-56 pl-7 pr-7 text-xs rounded-md border border-neutral-800 bg-neutral-950 text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
                />
                {searchQuery && (
                  <button onClick={() => handleSearchChange("")} className="absolute right-2 text-neutral-600 hover:text-neutral-300 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Column toggle */}
              <div className="flex items-center border border-neutral-800 rounded-md overflow-hidden bg-neutral-950">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => setColumns(n)}
                    className={`w-8 h-8 flex items-center justify-center text-xs transition-colors ${
                      columns === n
                        ? "bg-neutral-800 text-white"
                        : "text-neutral-600 hover:text-neutral-300"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            {sorted.length === 0 ? (
              <div className="border border-dashed border-neutral-800 rounded-lg py-12 text-center text-neutral-600 text-sm">
                No tasks match <span className="text-neutral-400 font-mono">{searchQuery}</span>
              </div>
            ) : (
              <ul className={`grid gap-3 ${GRID_COLS[columns - 1]}`}>
                {paginated.map((todo) => (
                  <TodoCard key={todo.id} todo={todo} allTodos={todos} columns={columns} onRefresh={fetchTodos} />
                ))}
              </ul>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>
                  {(safePage - 1) * perPage + 1}–{Math.min(safePage * perPage, sorted.length)} of {sorted.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                    .reduce<(number | "…")[]>((acc, p, i, arr) => {
                      if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "…" ? (
                        <span key={`ellipsis-${i}`} className="w-7 h-7 flex items-center justify-center text-neutral-600">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p as number)}
                          className={`w-7 h-7 flex items-center justify-center rounded-md border transition-colors text-xs ${
                            safePage === p
                              ? "border-neutral-600 bg-neutral-800 text-white"
                              : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:bg-neutral-800"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="w-7 h-7 flex items-center justify-center rounded-md border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}
