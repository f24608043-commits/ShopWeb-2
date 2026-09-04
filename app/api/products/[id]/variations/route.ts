import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/products/[id]/variations - Fetch variations for a specific product
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const variations = await prisma.productVariation.findMany({
      where: { productId: id },
      include: {
        values: {
          include: {
            optionValue: {
              include: {
                option: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(variations);
  } catch (error) {
    console.error('GET /api/products/[id]/variations error:', error);
    return NextResponse.json({ error: 'Failed to fetch product variations' }, { status: 500 });
  }
}
