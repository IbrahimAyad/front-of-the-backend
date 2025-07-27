import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { handleCacheInvalidation } from '@/lib/cache/invalidation';

export async function POST(request: NextRequest) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session || !['ADMIN', 'STAFF'].includes(session.user?.role || '')) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return handleCacheInvalidation(request);
}