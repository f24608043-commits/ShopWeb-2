import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
    const supabase = await createClient();
    const body = await req.json();
    const approved = body.approved !== undefined ? Boolean(body.approved) : true;

    const { data: updatedReview, error } = await supabase
      .from('reviews')
      .update({ approved })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: 'Failed to update review status' }, { status: 500 });
    }

    return NextResponse.json({
      message: `Review ${approved ? 'approved' : 'unapproved'} successfully`,
      review: updatedReview,
    });
  } catch (error) {
    console.error('PUT /api/reviews/[id]/approve error:', error);
    return NextResponse.json({ error: 'Failed to update review status' }, { status: 500 });
  }
}
