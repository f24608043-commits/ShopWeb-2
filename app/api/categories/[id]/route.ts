import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { categorySchema } from '@/lib/validations/category-brand';

// GET /api/categories/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parentCategory: true,
        subcategories: true,
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('GET /api/categories/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
  }
}

// PUT /api/categories/[id] - Admin update
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
    const validatedData = categorySchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid input fields', details: validatedData.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { name, slug, description, heroBannerImageUrl, parentCategoryId } = validatedData.data;

    // Check slug collision with other categories
    const existingSlug = await prisma.category.findFirst({
      where: {
        slug,
        NOT: { id },
      },
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: 'Another category is already using this slug.' },
        { status: 409 }
      );
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        heroBannerImageUrl: heroBannerImageUrl || null,
        parentCategoryId: parentCategoryId || null,
      },
      include: {
        parentCategory: true,
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('PUT /api/categories/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE /api/categories/[id] - Admin delete
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

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/categories/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
