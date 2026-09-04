import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin-auth';
import { reviewSchema } from '@/lib/validations/engagement';

// GET /api/reviews - Admin list reviews for moderation
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const reviews = await prisma.review.findMany({
      include: {
        product: { select: { name: true, slug: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error('GET /api/reviews error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST /api/reviews - Authenticated Customer submits review
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Only authenticated users can submit reviews. Please sign in.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = reviewSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid review payload', details: validatedData.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { productId, rating, comment } = validatedData.data;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const newReview = await prisma.review.create({
      data: {
        productId,
        userId: session.user.id,
        rating,
        comment,
        approved: false, // Requires admin moderation before public display
      },
    });

    return NextResponse.json(
      {
        message: 'Review submitted successfully! It will be displayed after admin moderation.',
        review: newReview,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/reviews error:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
