import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: { id: string };
}

export async function DELETE(request: Request, { params }: Params) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }
  try {
    await prisma.todo.delete({ where: { id } });
    return NextResponse.json({ message: 'Todo deleted' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting todo' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }
  try {
    const { refreshImage } = await request.json();
    if (!refreshImage) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const todo = await prisma.todo.findUnique({ where: { id } });
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Pexels API key not configured' }, { status: 500 });
    }

    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(todo.title)}&per_page=1`,
      { headers: { Authorization: apiKey } }
    );
    if (!res.ok) {
      return NextResponse.json({ error: 'Pexels fetch failed' }, { status: 502 });
    }
    const data = await res.json();
    const imageUrl = data.photos?.[0]?.src?.medium ?? null;

    const updated = await prisma.todo.update({
      where: { id },
      data: { imageUrl },
      include: {
        dependencies: { include: { dependency: true } },
        dependents: { include: { dependent: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Error updating todo' }, { status: 500 });
  }
}
