import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin-auth';
import { categorySchema } from '@/lib/validations/category-brand';

// GET /api/categories - Public listing of top-level categories & subcategories
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: categories } = await supabase
      .from('categories')
      .select(`
        *,
        subcategories:categories(
          *,
          products:products(count)
        ),
        products:products(count)
      `)
      .is('parent_category_id', null)
      .order('name', { ascending: true });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('GET /api/categories error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Admin-protected category creation
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const supabase = await createClient();
    const body = await req.json();
    const validatedData = categorySchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid input fields', details: validatedData.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { name, slug, description, heroBannerImageUrl, parentCategoryId } = validatedData.data;

    // Check slug collision
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingCategory) {
      return NextResponse.json(
        { error: 'A category with this slug already exists.' },
        { status: 409 }
      );
    }

    const { data: newCategory, error } = await supabase
      .from('categories')
      .insert({
        name,
        slug,
        description,
        hero_banner_image_url: heroBannerImageUrl || null,
        parent_category_id: parentCategoryId || null,
      })
      .select(`
        *,
        parent:categories(*)
      `)
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 }
      );
    }

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('POST /api/categories error:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
