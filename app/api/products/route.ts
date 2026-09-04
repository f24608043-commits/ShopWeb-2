import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { productSchema } from '@/lib/validations/product';
import { Prisma } from '@prisma/client';

// GET /api/products - Advanced Storefront Filtering, Search, & Pagination
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const categorySlug = searchParams.get('category');
    const brandSlug = searchParams.get('brand');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const featured = searchParams.get('featured');
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);

    const skip = (page - 1) * limit;

    // Construct Prisma dynamic where clause
    const where: Prisma.ProductWhereInput = {};

    if (categorySlug) {
      where.category = {
        OR: [
          { slug: categorySlug },
          { parentCategory: { slug: categorySlug } },
        ],
      };
    }

    if (brandSlug) {
      where.brand = { slug: brandSlug };
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { shortDescription: { contains: search } },
      ];
    }

    if (minPrice || maxPrice) {
      where.basePrice = {
        ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
        ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
      };
    }

    if (featured === 'true') {
      where.featured = true;
    }

    // Determine sorting
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };

    if (sort === 'price-asc') {
      orderBy = { basePrice: 'asc' };
    } else if (sort === 'price-desc') {
      orderBy = { basePrice: 'desc' };
    } else if (sort === 'name') {
      orderBy = { name: 'asc' };
    }

    // Execute queries concurrently
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: { orderBy: { order: 'asc' } },
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          variations: {
            select: { id: true, price: true, stock: true, sku: true },
          },
          reviews: {
            where: { approved: true },
            select: { rating: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Format products with average rating
    const formattedProducts = products.map((product) => {
      const avgRating =
        product.reviews.length > 0
          ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
          : 0;

      return {
        ...product,
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: product.reviews.length,
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      products: formattedProducts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('GET /api/products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST /api/products - Admin-protected Product Creation
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

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
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: 'A product with this slug already exists.' },
        { status: 409 }
      );
    }

    const newProduct = await prisma.product.create({
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
        images: {
          create: images.map((img, idx) => ({
            url: img.url,
            altText: img.altText || name,
            order: img.order || idx + 1,
          })),
        },
      },
      include: {
        images: true,
        category: true,
        brand: true,
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('POST /api/products error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
