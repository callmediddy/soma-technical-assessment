"use client";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { TodoWithRelations } from "../types";
import { enrichTodos } from "../lib/todos";
import Nav from "../components/Nav";

const DependencyGraph = dynamic(() => import("../components/DependencyGraph"), { ssr: false });

export default function GraphPage() {
  const [todos, setTodos] = useState<TodoWithRelations[]>([]);

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
    <div className="min-h-screen bg-black flex flex-col">
      <Nav itemCount={todos.length} />

      <main className="flex-1 flex flex-col max-w-6xl w-full mx-auto px-6 py-10 gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Dependency Graph</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Visualise task dependencies and the critical path.
          </p>
        </div>

        {!hasDeps ? (
          <div className="border border-dashed border-neutral-800 rounded-lg flex items-center justify-center text-neutral-600 text-sm" style={{ height: "calc(100vh - 280px)" }}>
            No dependencies yet. Add some from the Tasks page.
          </div>
        ) : (
          <div className="border border-neutral-800 rounded-lg overflow-hidden" style={{ height: "calc(100vh - 280px)" }}>
            <DependencyGraph todos={enriched} />
          </div>
        )}

        {/* Legend */}
        {hasDeps && (
          <div className="flex items-center gap-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm border border-neutral-700 bg-neutral-900 inline-block" />
              Task
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm border border-amber-800 bg-amber-950 inline-block" />
              Critical path
            </span>
          </div>
        )}
      </main>
    </div>
  );
}
