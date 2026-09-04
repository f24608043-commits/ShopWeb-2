import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { brandSchema } from '@/lib/validations/category-brand';

// GET /api/brands/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    return NextResponse.json(brand);
  } catch (error) {
    console.error('GET /api/brands/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch brand' }, { status: 500 });
  }
}

// PUT /api/brands/[id] - Admin update
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = brandSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid input fields', details: validatedData.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { name, slug } = validatedData.data;

    const existingSlug = await prisma.brand.findFirst({
      where: {
        slug,
        NOT: { id },
      },
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: 'Another brand is already using this slug.' },
        { status: 409 }
      );
    }

    const updatedBrand = await prisma.brand.update({
      where: { id },
      data: { name, slug },
    });

    return NextResponse.json(updatedBrand);
  } catch (error) {
    console.error('PUT /api/brands/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 });
  }
}

// DELETE /api/brands/[id] - Admin delete
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

    await prisma.brand.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/brands/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 });
  }
}
