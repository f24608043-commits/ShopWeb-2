import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { updateVariationSchema } from '@/lib/validations/global-form';

// PUT /api/products/[id]/variations/[variationId] - Update variation SKU, price, stock
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; variationId: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const { variationId } = await params;
    const body = await req.json();
    const validatedData = updateVariationSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid input fields', details: validatedData.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { sku, price, stock } = validatedData.data;

    // Check unique SKU collision if updated
    if (sku) {
      const existingSku = await prisma.productVariation.findFirst({
        where: {
          sku,
          NOT: { id: variationId },
        },
      });

      if (existingSku) {
        return NextResponse.json(
          { error: 'Another variation is already using this SKU.' },
          { status: 409 }
        );
      }
    }

    const updatedVariation = await prisma.productVariation.update({
      where: { id: variationId },
      data: {
        ...(sku !== undefined && { sku }),
        ...(price !== undefined && { price }),
        ...(stock !== undefined && { stock }),
      },
      include: {
        values: {
          include: {
            optionValue: true,
          },
        },
      },
    });

    return NextResponse.json(updatedVariation);
  } catch (error) {
    console.error('PUT /api/products/[id]/variations/[variationId] error:', error);
    return NextResponse.json({ error: 'Failed to update variation' }, { status: 500 });
  }
}
