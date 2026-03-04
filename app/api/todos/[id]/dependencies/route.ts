import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: { id: string };
}

// POST /api/todos/[id]/dependencies — add a dependency to a task
export async function POST(request: Request, { params }: Params) {
  const dependentId = parseInt(params.id);
  if (isNaN(dependentId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const { dependencyId } = await request.json();
  if (!dependencyId || isNaN(Number(dependencyId))) {
    return NextResponse.json({ error: 'dependencyId is required' }, { status: 400 });
  }

  if (dependentId === Number(dependencyId)) {
    return NextResponse.json({ error: 'A task cannot depend on itself' }, { status: 400 });
  }

  // Circular dependency check: BFS from dependencyId following dependency edges.
  // If we ever reach dependentId, adding this edge would create a cycle.
  const allEdges = await prisma.todoDependency.findMany();
  if (wouldBeCyclic(dependentId, Number(dependencyId), allEdges)) {
    return NextResponse.json({ error: 'Circular dependency detected' }, { status: 400 });
  }

  try {
    const dep = await prisma.todoDependency.create({
      data: { dependentId, dependencyId: Number(dependencyId) },
    });
    return NextResponse.json(dep, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Dependency already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error creating dependency' }, { status: 500 });
  }
}

function wouldBeCyclic(
  newDependentId: number,
  newDependencyId: number,
  allEdges: { dependentId: number; dependencyId: number }[]
): boolean {
  // BFS from newDependencyId following outgoing dependency edges.
  // If we reach newDependentId, adding the edge creates a cycle.
  const visited = new Set<number>();
  const queue = [newDependencyId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === newDependentId) return true;
    for (const edge of allEdges) {
      if (edge.dependentId === current && !visited.has(edge.dependencyId)) {
        visited.add(edge.dependencyId);
        queue.push(edge.dependencyId);
      }
    }
  }
  return false;
}
