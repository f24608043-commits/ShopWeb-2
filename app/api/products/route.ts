import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin-auth';
import { productSchema } from '@/lib/validations/product';

// GET /api/products - Advanced Storefront Filtering, Search, & Pagination
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);

    const categorySlug = searchParams.get('category');
    const brandSlug = searchParams.get('brand');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const featured = searchParams.get('featured');
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build Supabase query
    let query = supabase
      .from('products')
      .select(`
        *,
        images:product_images(*),
        category:categories(id, name, slug),
        brand:brands(id, name, slug),
        variations:product_variations(id, price, stock, sku),
        reviews:reviews(rating)
      `, { count: 'exact' });

    // Apply filters
    if (categorySlug) {
      query = query.or(`category.slug.eq.${categorySlug},category.parent_category.slug.eq.${categorySlug}`);
    }

    if (brandSlug) {
      query = query.eq('brand.slug', brandSlug);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,short_description.ilike.%${search}%`);
    }

    if (minPrice || maxPrice) {
      if (minPrice) query = query.gte('base_price', parseFloat(minPrice));
      if (maxPrice) query = query.lte('base_price', parseFloat(maxPrice));
    }

    if (featured === 'true') {
      query = query.eq('featured', true);
    }

    // Apply sorting
    if (sort === 'price-asc') {
      query = query.order('base_price', { ascending: true });
    } else if (sort === 'price-desc') {
      query = query.order('base_price', { ascending: false });
    } else if (sort === 'name') {
      query = query.order('name', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(from, to);

    const { data: products, count: totalCount, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    // Format products with average rating
    const formattedProducts = products?.map((product) => {
      const reviews = product.reviews || [];
      const avgRating =
        reviews.length > 0
          ? reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviews.length
          : 0;

      return {
        ...product,
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews.length,
      };
    }) || [];

    const totalPages = Math.ceil((totalCount || 0) / limit);

    return NextResponse.json({
      products: formattedProducts,
      pagination: {
        page,
        limit,
        totalCount: totalCount || 0,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('GET /api/products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST /api/products - Admin-protected Product Creation
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const supabase = await createClient();
    const body = await req.json();
    const validatedData = productSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid input fields', details: validatedData.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const {
      name,
      slug,
      description,
      shortDescription,
      basePrice,
      originalPrice,
      brandId,
      categoryId,
      featured,
      stock,
      productType,
      globalFormId,
      images,
    } = validatedData.data;

    // Check slug collision
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingProduct) {
      return NextResponse.json(
        { error: 'A product with this slug already exists.' },
        { status: 409 }
      );
    }

    // Create product
    const { data: newProduct, error: insertError } = await supabase
      .from('products')
      .insert({
        name,
        slug,
        description,
        short_description: shortDescription,
        base_price: basePrice,
        original_price: originalPrice || null,
        brand_id: brandId || null,
        category_id: categoryId || null,
        featured,
        stock: productType === 'SIMPLE' ? stock || 0 : null,
        product_type: productType,
        global_form_id: globalFormId || null,
      })
      .select(`
        *,
        images:product_images(*),
        category:categories(*),
        brand:brands(*)
      `)
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }

    // Create product images
    if (images && images.length > 0) {
      const imageInserts = images.map((img, idx) => ({
        url: img.url,
        alt_text: img.altText || name,
        order: img.order || idx + 1,
        product_id: newProduct.id,
      }));

      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(imageInserts);

      if (imagesError) {
        console.error('Failed to create product images:', imagesError);
      }
    }

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('POST /api/products error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
