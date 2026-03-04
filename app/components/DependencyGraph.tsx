"use client";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  MarkerType,
  Node,
} from "reactflow";
import "reactflow/dist/style.css";
import { TodoWithMeta } from "../types";

interface Props {
  todos: TodoWithMeta[];
}

export default function DependencyGraph({ todos }: Props) {
  if (todos.length === 0) return null;

  const nodeWidth = 180;
  const nodeHeight = 56;

  const depthMap = new Map<number, number>();
  const getDepth = (id: number): number => {
    if (depthMap.has(id)) return depthMap.get(id)!;
    const todo = todos.find((t) => t.id === id);
    if (!todo || todo.dependencies.length === 0) { depthMap.set(id, 0); return 0; }
    const depth = Math.max(...todo.dependencies.map((d) => getDepth(d.dependencyId) + 1));
    depthMap.set(id, depth);
    return depth;
  };
  todos.forEach((t) => getDepth(t.id));

  const byDepth = new Map<number, number[]>();
  Array.from(depthMap.entries()).forEach(([id, depth]) => {
    if (!byDepth.has(depth)) byDepth.set(depth, []);
    byDepth.get(depth)!.push(id);
  });

  const posMap = new Map<number, { x: number; y: number }>();
  Array.from(byDepth.entries()).forEach(([depth, ids]) => {
    ids.forEach((id: number, idx: number) => {
      posMap.set(id, { x: depth * (nodeWidth + 80), y: idx * (nodeHeight + 24) });
    });
  });

  const nodes: Node[] = todos.map((todo) => ({
    id: String(todo.id),
    position: posMap.get(todo.id) ?? { x: 0, y: 0 },
    data: {
      label: (
        <div style={{ lineHeight: 1.3 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: todo.isCritical ? "#fbbf24" : "#ededed", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {todo.title}
          </div>
          <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>
            Start · {todo.earliestStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
        </div>
      ),
    },
    style: {
      background: todo.isCritical ? "#1c1400" : "#0a0a0a",
      border: todo.isCritical ? "1px solid #78350f" : "1px solid #262626",
      borderRadius: 8,
      padding: "8px 12px",
      width: nodeWidth,
    },
  }));

  const edges: Edge[] = todos.flatMap((todo) =>
    todo.dependencies.map((d) => {
      const isCritical = todo.isCritical && todos.find((t) => t.id === d.dependencyId)?.isCritical;
      return {
        id: `${d.dependencyId}-${todo.id}`,
        source: String(d.dependencyId),
        target: String(todo.id),
        markerEnd: { type: MarkerType.ArrowClosed, color: isCritical ? "#78350f" : "#404040" },
        style: { stroke: isCritical ? "#92400e" : "#404040", strokeWidth: isCritical ? 2 : 1 },
        animated: !!isCritical,
      };
    })
  );

  return (
    <div style={{ width: "100%", height: "100%", minHeight: 300, background: "#000" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background variant={BackgroundVariant.Dots} color="#1a1a1a" gap={20} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
