import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

// GET /api/global-forms/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const globalForm = await prisma.globalForm.findUnique({
      where: { id },
      include: {
        options: {
          include: {
            values: true,
          },
        },
        products: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!globalForm) {
      return NextResponse.json({ error: 'Global form not found' }, { status: 404 });
    }

    return NextResponse.json(globalForm);
  } catch (error) {
    console.error('GET /api/global-forms/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch global form' }, { status: 500 });
  }
}

// DELETE /api/global-forms/[id] - Admin delete
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await params;

    await prisma.globalForm.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Global form deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/global-forms/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete global form' }, { status: 500 });
  }
}
