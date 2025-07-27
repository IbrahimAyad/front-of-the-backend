import { NextResponse } from 'next/server';

export function createApiResponse<T>(
  data: T | null,
  error?: string,
  status: number = 200
): NextResponse {
  if (error || !data) {
    return NextResponse.json(
      {
        success: false,
        error: error || 'An error occurred',
        data: null
      },
      { status: status || 500 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data,
      error: null
    },
    { status }
  );
}