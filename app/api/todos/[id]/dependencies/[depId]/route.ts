import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: { id: string; depId: string };
}

// DELETE /api/todos/[id]/dependencies/[depId]
export async function DELETE(request: Request, { params }: Params) {
  const dependentId = parseInt(params.id);
  const dependencyId = parseInt(params.depId);

  if (isNaN(dependentId) || isNaN(dependencyId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    await prisma.todoDependency.delete({
      where: { dependentId_dependencyId: { dependentId, dependencyId } },
    });
    return NextResponse.json({ message: 'Dependency removed' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error removing dependency' }, { status: 500 });
  }
}
