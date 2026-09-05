import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { contactSchema } from '@/lib/validations/engagement';

// POST /api/contact - Submit contact message
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const validatedData = contactSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid contact form input', details: validatedData.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { name, email, subject, message } = validatedData.data;

    const { data: contactMsg, error } = await supabase
      .from('contact_messages')
      .insert({ name, email, subject, message })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json(
      { message: 'Thank you for reaching out! We have received your message.', contactMsg },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/contact error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
