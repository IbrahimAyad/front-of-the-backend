import { NextRequest } from 'next/server';
import { cacheService } from '@/lib/cache/cacheService';
import { getSession } from 'next-auth/react';

export async function GET(request: NextRequest) {
  const stats = cacheService.getStats();
  
  return Response.json({
    success: true,
    stats,
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  // Check authentication
  const session = await getSession();
  if (!session || session.user?.role !== 'ADMIN') {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  cacheService.resetStats();
  
  return Response.json({
    success: true,
    message: 'Cache statistics reset',
    timestamp: new Date().toISOString()
  });
}