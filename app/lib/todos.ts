import { TodoWithMeta, TodoWithRelations } from "../types";

export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function computeEarliestStart(todo: TodoWithRelations, allMap: Map<number, TodoWithRelations>): Date {
  if (todo.dependencies.length === 0) return new Date();
  const dates = todo.dependencies.map((d) => {
    const dep = allMap.get(d.dependencyId);
    return dep?.dueDate ? parseLocalDate(dep.dueDate) : new Date();
  });
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}

function computeDepth(id: number, allMap: Map<number, TodoWithRelations>, cache: Map<number, number>): number {
  if (cache.has(id)) return cache.get(id)!;
  const todo = allMap.get(id);
  if (!todo || todo.dependencies.length === 0) { cache.set(id, 0); return 0; }
  const depth = Math.max(...todo.dependencies.map((d) => computeDepth(d.dependencyId, allMap, cache) + 1));
  cache.set(id, depth);
  return depth;
}

function computeHeight(id: number, allMap: Map<number, TodoWithRelations>, cache: Map<number, number>): number {
  if (cache.has(id)) return cache.get(id)!;
  const todo = allMap.get(id);
  if (!todo || todo.dependents.length === 0) { cache.set(id, 0); return 0; }
  const height = Math.max(...todo.dependents.map((d) => computeHeight(d.dependentId, allMap, cache) + 1));
  cache.set(id, height);
  return height;
}

export function enrichTodos(todos: TodoWithRelations[]): TodoWithMeta[] {
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
