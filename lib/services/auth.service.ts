import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface AuthServiceConfig {
  jwtSecret: string;
  jwtExpiresIn?: string;
  saltRounds?: number;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role?: string;
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly saltRounds: number;

  constructor(config: AuthServiceConfig) {
    this.jwtSecret = config.jwtSecret;
    this.jwtExpiresIn = config.jwtExpiresIn || '7d';
    this.saltRounds = config.saltRounds || 10;
  }

  async hashPassword(password: string): Promise<string> {
    try {
      const hashedPassword = await bcrypt.hash(password, this.saltRounds);
      return hashedPassword;
    } catch (error) {
      throw new Error(`Failed to hash password: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const isValid = await bcrypt.compare(password, hashedPassword);
      return isValid;
    } catch (error) {
      throw new Error(`Failed to verify password: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  generateToken(payload: TokenPayload): string {
    try {
      const token = jwt.sign(payload, this.jwtSecret, {
        expiresIn: this.jwtExpiresIn,
      });
      return token;
    } catch (error) {
      throw new Error(`Failed to generate token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  verifyToken(token: string): DecodedToken {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as DecodedToken;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw new Error(`Failed to verify token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  isTokenExpired(token: string): boolean {
    try {
      this.verifyToken(token);
      return false;
    } catch (error) {
      return error instanceof Error && error.message === 'Token has expired';
    }
  }

  getTokenExpiration(token: string): Date | null {
    try {
      const decoded = this.verifyToken(token);
      return new Date(decoded.exp * 1000);
    } catch {
      return null;
    }
  }
}

export function createAuthService(config: AuthServiceConfig): AuthService {
  return new AuthService(config);
}