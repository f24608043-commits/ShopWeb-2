import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

// PUT /api/reviews/[id]/approve - Admin toggle review approval status
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
    const approved = body.approved !== undefined ? Boolean(body.approved) : true;

    const updatedReview = await prisma.review.update({
      where: { id },
      data: { approved },
    });

    return NextResponse.json({
      message: `Review ${approved ? 'approved' : 'unapproved'} successfully`,
      review: updatedReview,
    });
  } catch (error) {
    console.error('PUT /api/reviews/[id]/approve error:', error);
    return NextResponse.json({ error: 'Failed to update review status' }, { status: 500 });
  }
}
