import type { Role } from '@repo/types';

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface AuthContext {
  user: JWTPayload;
}
