"use client";
import { useState } from "react";
import { TodoWithMeta, TodoWithRelations } from "../types";

interface Props {
  todo: TodoWithMeta;
  allTodos: TodoWithRelations[];
  onRefresh: () => void;
}

export default function TodoCard({ todo, allTodos, onRefresh }: Props) {
  const [imgLoading, setImgLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [addingDep, setAddingDep] = useState(false);

  const now = new Date();
  const isOverdue = todo.dueDate ? new Date(todo.dueDate) < now : false;

  const handleDelete = async () => {
    await fetch(`/api/todos/${todo.id}`, { method: "DELETE" });
    onRefresh();
  };

  const handleReloadImage = async () => {
    setReloading(true);
    await fetch(`/api/todos/${todo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshImage: true }),
    });
    setReloading(false);
    onRefresh();
  };

  const handleRemoveDep = async (dependencyId: number) => {
    await fetch(`/api/todos/${todo.id}/dependencies/${dependencyId}`, { method: "DELETE" });
    onRefresh();
  };

  const handleAddDep = async (depId: number) => {
    const res = await fetch(`/api/todos/${todo.id}/dependencies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dependencyId: depId }),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error ?? "Failed to add dependency");
    }
    onRefresh();
  };

  const existingDepIds = new Set(todo.dependencies.map((d) => d.dependencyId));
  const available = allTodos.filter((t) => t.id !== todo.id && !existingDepIds.has(t.id));

  return (
    <li className="border border-neutral-800 rounded-lg bg-neutral-950 overflow-hidden group">
      <div className="flex gap-4 p-4">
        {/* Image thumbnail */}
        <div className="relative flex-shrink-0 w-24 h-16 rounded-md overflow-hidden bg-neutral-900">
          {todo.imageUrl ? (
            <>
              {imgLoading && <div className="absolute inset-0 animate-pulse bg-neutral-800" />}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={todo.imageUrl}
                alt={todo.title}
                className="w-full h-full object-cover"
                onLoad={() => setImgLoading(false)}
              />
            </>
          ) : (
            <div className="absolute inset-0 animate-pulse bg-neutral-800" />
          )}
          <button
            onClick={handleReloadImage}
            disabled={reloading}
            title="Reload image"
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-60 transition-all opacity-0 group-hover:opacity-100"
          >
            <svg
              className={`w-4 h-4 text-white ${reloading ? "animate-spin" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow min-w-0 space-y-2">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium text-white leading-snug">{todo.title}</span>
            <button
              onClick={handleDelete}
              className="flex-shrink-0 text-neutral-700 hover:text-red-500 transition-colors mt-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5">
            {todo.dueDate && (
              <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium ${
                isOverdue
                  ? "bg-red-950 text-red-400 border border-red-900"
                  : "bg-neutral-900 text-neutral-400 border border-neutral-800"
              }`}>
                {isOverdue && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                )}
                {isOverdue ? "Overdue · " : "Due · "}
                {new Date(todo.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            )}
            <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-md bg-neutral-900 text-neutral-500 border border-neutral-800">
              Start · {todo.earliestStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
            {todo.isCritical && (
              <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-md bg-amber-950 text-amber-400 border border-amber-900 font-medium">
                Critical path
              </span>
            )}
          </div>

          {/* Dependencies */}
          {(todo.dependencies.length > 0 || available.length > 0) && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {todo.dependencies.map((d) => (
                <span
                  key={d.dependencyId}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-neutral-900 text-neutral-400 border border-neutral-800"
                >
                  {d.dependency.title}
                  <button
                    onClick={() => handleRemoveDep(d.dependencyId)}
                    className="text-neutral-600 hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
              {available.length > 0 && (
                addingDep ? (
                  <select
                    autoFocus
                    defaultValue=""
                    onChange={(e) => { if (e.target.value) handleAddDep(Number(e.target.value)); setAddingDep(false); }}
                    onBlur={() => setAddingDep(false)}
                    className="text-[11px] bg-neutral-900 border border-neutral-700 rounded-md px-2 py-0.5 text-neutral-300 focus:outline-none focus:border-neutral-500"
                  >
                    <option value="" disabled>Pick a task…</option>
                    {available.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                  </select>
                ) : (
                  <button
                    onClick={() => setAddingDep(true)}
                    className="text-[11px] text-neutral-600 hover:text-neutral-300 transition-colors"
                  >
                    + depends on
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
