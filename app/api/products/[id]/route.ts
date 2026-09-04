import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { productSchema } from '@/lib/validations/product';

// GET /api/products/[id] - Fetch single product by ID or Slug
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        images: { orderBy: { order: 'asc' } },
        category: true,
        brand: true,
        globalForm: {
          include: {
            options: {
              include: { values: true },
            },
          },
        },
        options: {
          include: { values: true },
        },
        variations: {
          include: {
            values: {
              include: {
                optionValue: {
                  include: { option: true },
                },
              },
            },
          },
        },
        reviews: {
          where: { approved: true },
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const avgRating =
      product.reviews.length > 0
        ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
        : 0;

    return NextResponse.json({
      ...product,
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: product.reviews.length,
    });
  } catch (error) {
    console.error('GET /api/products/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

// PUT /api/products/[id] - Admin-protected update
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
    const validatedData = productSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid input fields', details: validatedData.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const {
      name,
      slug,
      description,
      shortDescription,
      basePrice,
      originalPrice,
      brandId,
      categoryId,
      featured,
      stock,
      productType,
      globalFormId,
      images,
    } = validatedData.data;

    // Check slug collision
    const existingSlug = await prisma.product.findFirst({
      where: {
        slug,
        NOT: { id },
      },
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: 'Another product is already using this slug.' },
        { status: 409 }
      );
    }

    // Update product & images in transaction
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // Replace existing images if new images array supplied
      if (images && images.length > 0) {
        await tx.productImage.deleteMany({
          where: { productId: id },
        });
      }

      return tx.product.update({
        where: { id },
        data: {
          name,
          slug,
          description,
          shortDescription,
          basePrice,
          originalPrice: originalPrice || null,
          brandId: brandId || null,
          categoryId: categoryId || null,
          featured,
          stock: productType === 'SIMPLE' ? stock || 0 : null,
          productType,
          globalFormId: globalFormId || null,
          ...(images && images.length > 0
            ? {
                images: {
                  create: images.map((img, idx) => ({
                    url: img.url,
                    altText: img.altText || name,
                    order: img.order || idx + 1,
                  })),
                },
              }
            : {}),
        },
        include: {
          images: true,
          category: true,
          brand: true,
        },
      });
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('PUT /api/products/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE /api/products/[id] - Admin-protected deletion
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

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/products/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
