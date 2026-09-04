import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      ),
    };
  }

  if (session.user.role !== 'ADMIN') {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true as const,
    user: session.user,
  };
}
