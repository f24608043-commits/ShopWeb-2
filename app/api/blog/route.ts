import { NextResponse } from 'next/server';

// GET /api/blog - Public listing of published blog posts
export async function GET() {
  try {
    // Fetch blog posts from database (using Subscriber/ContactMessage schema extensions if needed)
    return NextResponse.json([
      {
        id: '1',
        title: 'Choosing the Perfect Bed for Your Master Bedroom',
        slug: 'choosing-the-perfect-bed',
        excerpt: 'Discover essential guidelines on mattress ergonomics, frame fabrics, and room space planning.',
        content: 'When selecting a bed frame, fabric selection plays a major role in comfort and aesthetics. Velvet offers plush luxury while Linen provides breathable modern minimalism...',
        coverImage: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=800',
        published: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Orthopedic vs Memory Foam: Which Mattress is Right for You?',
        slug: 'orthopedic-vs-memory-foam-mattress',
        excerpt: 'Understand the key spinal support differences between pocket spring orthopedic mattresses and memory foam.',
        content: 'Spinal alignment during sleep is critical for long-term lumbar health. Pocket sprung orthopedic mattresses distribute body weight evenly...',
        coverImage: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=800',
        published: true,
        createdAt: new Date().toISOString(),
      },
    ]);
  } catch (error) {
    console.error('GET /api/blog error:', error);
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
  }
}
