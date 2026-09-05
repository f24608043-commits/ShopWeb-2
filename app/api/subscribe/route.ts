import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { subscribeSchema } from '@/lib/validations/engagement';

// POST /api/subscribe - Join newsletter
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const validatedData = subscribeSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 422 }
      );
    }

    const { email, name } = validatedData.data;

    // Check duplicate
    const { data: existing } = await supabase
      .from('subscribers')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json(
        { message: 'You are already subscribed to our newsletter!' },
        { status: 200 }
      );
    }

    const { data: subscriber, error } = await supabase
      .from('subscribers')
      .insert({ email, name })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to process newsletter subscription' }, { status: 500 });
    }

    return NextResponse.json(
      { message: 'Thank you for subscribing to our newsletter!', subscriber },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/subscribe error:', error);
    return NextResponse.json({ error: 'Failed to process newsletter subscription' }, { status: 500 });
  }
}
