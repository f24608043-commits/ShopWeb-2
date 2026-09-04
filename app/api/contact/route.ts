import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { contactSchema } from '@/lib/validations/engagement';

// POST /api/contact - Submit contact message
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = contactSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid contact form input', details: validatedData.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { name, email, subject, message } = validatedData.data;

    const contactMsg = await prisma.contactMessage.create({
      data: { name, email, subject, message },
    });

    return NextResponse.json(
      { message: 'Thank you for reaching out! We have received your message.', contactMsg },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/contact error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
