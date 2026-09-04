import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

// Helper function to generate Cartesian Product of arrays
function cartesianProduct<T>(arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap((d) => curr.map((e) => [...d, e])),
    [[]]
  );
}

// POST /api/products/[id]/variations/generate - Automatically generate combinations
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const { id: productId } = await params;

    // Fetch product with linked options (direct or global form)
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        options: {
          include: { values: true },
        },
        globalForm: {
          include: {
            options: {
              include: { values: true },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Combine global form options and product-specific options
    const allOptionGroups = [
      ...(product.globalForm ? product.globalForm.options : []),
      ...product.options,
    ];

    if (allOptionGroups.length === 0) {
      return NextResponse.json(
        { error: 'No option groups found for this product. Attach a Global Form or Product Options first.' },
        { status: 400 }
      );
    }

    // Extract arrays of option values per group
    const valueArrays = allOptionGroups.map((group) => group.values);

    // Compute Cartesian product combinations
    const combinations = cartesianProduct(valueArrays);

    const basePrice = Number(product.basePrice);

    // Generate variation records in a database transaction
    const createdVariations = await prisma.$transaction(async (tx) => {
      // Clear old variations for clean generation
      await tx.productVariation.deleteMany({
        where: { productId },
      });

      const variations = [];

      for (let i = 0; i < combinations.length; i++) {
        const combo = combinations[i];
        
        // Sum total price adjustment from selected option values
        const totalAdjustment = combo.reduce((sum, val) => sum + Number(val.priceAdjustment), 0);
        const finalPrice = basePrice + totalAdjustment;

        // Construct SKU: e.g. BED-5FT-VEL-BLK-1
        const skuPrefix = combo.map((v) => v.value.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '')).join('-');
        const sku = `${product.slug.substring(0, 4).toUpperCase()}-${skuPrefix}-${i + 1}`;

        const variation = await tx.productVariation.create({
          data: {
            productId,
            sku,
            price: finalPrice,
            stock: 10, // Default starting stock
            values: {
              create: combo.map((val) => ({
                optionValueId: val.id,
              })),
            },
          },
          include: {
            values: {
              include: {
                optionValue: true,
              },
            },
          },
        });

        variations.push(variation);
      }

      // Update product type to VARIABLE
      await tx.product.update({
        where: { id: productId },
        data: { productType: 'VARIABLE', stock: null },
      });

      return variations;
    });

    return NextResponse.json(
      {
        message: `Successfully generated ${createdVariations.length} combinations`,
        totalGenerated: createdVariations.length,
        variations: createdVariations,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/products/[id]/variations/generate error:', error);
    return NextResponse.json({ error: 'Failed to generate product variations' }, { status: 500 });
  }
}
