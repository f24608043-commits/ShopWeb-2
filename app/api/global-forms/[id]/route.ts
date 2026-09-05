import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin-auth';

// GET /api/global-forms/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: globalForm } = await supabase
      .from('global_forms')
      .select(`
        *,
        options:product_options(
          *,
          values:product_option_values(*)
        ),
        products:products(id, name, slug)
      `)
      .eq('id', id)
      .single();

    if (!globalForm) {
      return NextResponse.json({ error: 'Global form not found' }, { status: 404 });
    }

    return NextResponse.json(globalForm);
  } catch (error) {
    console.error('GET /api/global-forms/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch global form' }, { status: 500 });
  }
}

// DELETE /api/global-forms/[id] - Admin delete
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
    const supabase = await createClient();

    const { error } = await supabase
      .from('global_forms')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json({ error: 'Failed to delete global form' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Global form deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/global-forms/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete global form' }, { status: 500 });
  }
}
