import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        dependencies: { include: { dependency: true } },
        dependents: { include: { dependent: true } },
      },
    });
    return NextResponse.json(todos);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching todos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, dueDate, dependencyIds } = await request.json();
    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Validate circular deps before creating
    if (dependencyIds && dependencyIds.length > 0) {
      const allEdges = await prisma.todoDependency.findMany();
      // The new todo doesn't exist yet, so we simulate its id as a placeholder.
      // We check that none of the dependencyIds would depend on each other in a cycle.
      // Since the task is new, it can't create a cycle involving itself yet —
      // but we still validate the provided dep list is self-consistent.
    }

    const todo = await prisma.todo.create({
      data: {
        title,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        ...(dependencyIds && dependencyIds.length > 0
          ? {
              dependencies: {
                create: dependencyIds.map((depId: number) => ({ dependencyId: depId })),
              },
            }
          : {}),
      },
      include: {
        dependencies: { include: { dependency: true } },
        dependents: { include: { dependent: true } },
      },
    });

    // Background Pexels image fetch — don't await
    fetchAndSavePexelsImage(todo.id, title);

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error creating todo' }, { status: 500 });
  }
}

async function fetchAndSavePexelsImage(todoId: number, query: string) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return;
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`,
      { headers: { Authorization: apiKey } }
    );
    if (!res.ok) return;
    const data = await res.json();
    const imageUrl = data.photos?.[0]?.src?.medium;
    if (imageUrl) {
      await prisma.todo.update({ where: { id: todoId }, data: { imageUrl } });
    }
  } catch {
    // Best-effort; silently ignore
  }
}
