export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'USER';

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
  name?: string | null;
} 