import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function getUserIdFromToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    return decoded.userId;
  } catch (error) {
    return null;
  }
}