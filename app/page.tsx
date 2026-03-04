"use client";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { TodoWithMeta, TodoWithRelations } from "./types";
import TodoForm from "./components/TodoForm";
import TodoCard from "./components/TodoCard";

const DependencyGraph = dynamic(() => import("./components/DependencyGraph"), {
  ssr: false,
});

// ─── Critical-path helpers ────────────────────────────────────────────────────

function computeEarliestStart(
  todo: TodoWithRelations,
  allMap: Map<number, TodoWithRelations>
): Date {
  if (todo.dependencies.length === 0) return new Date();
  const depDueDates = todo.dependencies.map((d) => {
    const dep = allMap.get(d.dependencyId);
    return dep?.dueDate ? new Date(dep.dueDate) : new Date();
  });
  return new Date(Math.max(...depDueDates.map((d) => d.getTime())));
}

function computeDepth(
  id: number,
  allMap: Map<number, TodoWithRelations>,
  cache: Map<number, number>
): number {
  if (cache.has(id)) return cache.get(id)!;
  const todo = allMap.get(id);
  if (!todo || todo.dependencies.length === 0) { cache.set(id, 0); return 0; }
  const depth = Math.max(...todo.dependencies.map((d) => computeDepth(d.dependencyId, allMap, cache) + 1));
  cache.set(id, depth);
  return depth;
}

function computeHeight(
  id: number,
  allMap: Map<number, TodoWithRelations>,
  cache: Map<number, number>
): number {
  if (cache.has(id)) return cache.get(id)!;
  const todo = allMap.get(id);
  if (!todo || todo.dependents.length === 0) { cache.set(id, 0); return 0; }
  const height = Math.max(...todo.dependents.map((d) => computeHeight(d.dependentId, allMap, cache) + 1));
  cache.set(id, height);
  return height;
}

function enrichTodos(todos: TodoWithRelations[]): TodoWithMeta[] {
  const allMap = new Map(todos.map((t) => [t.id, t]));
  const depthCache = new Map<number, number>();
  const heightCache = new Map<number, number>();
  todos.forEach((t) => { computeDepth(t.id, allMap, depthCache); computeHeight(t.id, allMap, heightCache); });
  const maxDepth = Math.max(0, ...Array.from(depthCache.values()));
  return todos.map((t) => {
    const depth = depthCache.get(t.id) ?? 0;
    const height = heightCache.get(t.id) ?? 0;
    return { ...t, earliestStart: computeEarliestStart(t, allMap), isCritical: maxDepth > 0 && depth + height === maxDepth };
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [todos, setTodos] = useState<TodoWithRelations[]>([]);
  const [showGraph, setShowGraph] = useState(false);

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
  const hasDeps = todos.some((t) => t.dependencies.length > 0);

  return (
    <div className="min-h-screen bg-black">
      {/* Top nav */}
      <header className="border-b border-neutral-800">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 76 65" fill="white">
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
            </svg>
            <span className="text-white font-semibold text-sm">Tasks</span>
          </div>
          <span className="text-neutral-500 text-xs">{todos.length} item{todos.length !== 1 ? "s" : ""}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Things to do</h1>
          <p className="text-neutral-500 text-sm mt-1">Track tasks, dependencies, and deadlines.</p>
        </div>

        <TodoForm todos={todos} onCreated={fetchTodos} />

        {enriched.length > 0 && (
          <ul className="space-y-3">
            {enriched.map((todo) => (
              <TodoCard key={todo.id} todo={todo} allTodos={todos} onRefresh={fetchTodos} />
            ))}
          </ul>
        )}

        {todos.length === 0 && (
          <div className="border border-dashed border-neutral-800 rounded-lg py-16 text-center text-neutral-600 text-sm">
            No tasks yet. Add one above.
          </div>
        )}

        {hasDeps && (
          <div className="border border-neutral-800 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowGraph((v) => !v)}
              className="w-full px-4 py-3 flex justify-between items-center text-neutral-300 text-sm font-medium hover:bg-neutral-900 transition"
            >
              <span>Dependency Graph</span>
              <svg
                className={`w-4 h-4 text-neutral-500 transition-transform ${showGraph ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showGraph && (
              <div className="border-t border-neutral-800">
                <DependencyGraph todos={enriched} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
