import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { categorySchema } from '@/lib/validations/category-brand';

// GET /api/categories - Public listing of top-level categories & subcategories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: {
        parentCategoryId: null, // Fetch root categories
      },
      include: {
        subcategories: {
          include: {
            _count: {
              select: { products: true },
            },
          },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('GET /api/categories error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Admin-protected category creation
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const validatedData = categorySchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid input fields', details: validatedData.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { name, slug, description, heroBannerImageUrl, parentCategoryId } = validatedData.data;

    // Check slug collision
    const existingCategory = await prisma.category.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'A category with this slug already exists.' },
        { status: 409 }
      );
    }

    const newCategory = await prisma.category.create({
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

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('POST /api/categories error:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
