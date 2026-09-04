import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { dealSchema } from '@/lib/validations/engagement';

// GET /api/deals - Fetch active bundle promotional deals
export async function GET() {
  try {
    const deals = await prisma.deal.findMany({
      where: {
        active: true,
      },
      include: {
        products: {
          include: {
            product: {
              include: {
                images: { take: 1 },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(deals);
  } catch (error) {
    console.error('GET /api/deals error:', error);
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 });
  }
}

// POST /api/deals - Admin create deal
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const validatedData = dealSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid deal data', details: validatedData.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { title, description, dealPrice, active, expiresAt, productIds } = validatedData.data;

    const newDeal = await prisma.deal.create({
      data: {
        title,
        description,
        dealPrice,
        active,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        products: {
          create: productIds.map((pid) => ({ productId: pid })),
        },
      },
      include: {
        products: { include: { product: true } },
      },
    });

    return NextResponse.json(newDeal, { status: 201 });
  } catch (error) {
    console.error('POST /api/deals error:', error);
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 });
  }
}
