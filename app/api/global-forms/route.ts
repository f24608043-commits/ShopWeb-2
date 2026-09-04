import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { globalFormSchema } from '@/lib/validations/global-form';

// GET /api/global-forms - Fetch all global forms with their options and values
export async function GET() {
  try {
    const globalForms = await prisma.globalForm.findMany({
      include: {
        options: {
          include: {
            values: true,
          },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(globalForms);
  } catch (error) {
    console.error('GET /api/global-forms error:', error);
    return NextResponse.json({ error: 'Failed to fetch global forms' }, { status: 500 });
  }
}

// POST /api/global-forms - Admin creation of global reusable form
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const validatedData = globalFormSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid input fields', details: validatedData.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { name, description, active, options } = validatedData.data;

    // Create Global Form with nested options & option values
    const newGlobalForm = await prisma.globalForm.create({
      data: {
        name,
        description,
        active,
        options: {
          create: options.map((opt) => ({
            name: opt.name,
            inputType: opt.inputType,
            values: {
              create: opt.values.map((val) => ({
                value: val.value,
                priceAdjustment: val.priceAdjustment,
              })),
            },
          })),
        },
      },
      include: {
        options: {
          include: {
            values: true,
          },
        },
      },
    });

    return NextResponse.json(newGlobalForm, { status: 201 });
  } catch (error) {
    console.error('POST /api/global-forms error:', error);
    return NextResponse.json({ error: 'Failed to create global form' }, { status: 500 });
  }
}
