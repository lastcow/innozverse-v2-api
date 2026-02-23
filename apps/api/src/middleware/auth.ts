import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { jwtVerify } from 'jose';
import type { JWTPayload, AuthContext } from '../types';
import type { Role } from '@repo/types';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    c.set('user', payload as unknown as JWTPayload);
    await next();
  } catch (error) {
    throw new HTTPException(401, { message: 'Invalid or expired token' });
  }
}

export function requireRole(allowedRoles: Role[]) {
  return async (c: Context<{ Variables: AuthContext }>, next: Next) => {
    const user = c.get('user');

    if (!user) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    if (!allowedRoles.includes(user.role)) {
      throw new HTTPException(403, { message: 'Insufficient permissions' });
    }

    await next();
  };
}
