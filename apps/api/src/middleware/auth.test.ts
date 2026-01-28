import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import jwt from 'jsonwebtoken';
import { authMiddleware, requireRole } from './auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

describe('authMiddleware', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.use('/protected/*', authMiddleware);
    app.get('/protected/test', (c) => c.json({ message: 'success' }));
  });

  it('should reject requests without Authorization header', async () => {
    const res = await app.request('/protected/test');
    expect(res.status).toBe(401);
  });

  it('should reject requests with invalid token', async () => {
    const res = await app.request('/protected/test', {
      headers: { Authorization: 'Bearer invalid-token' },
    });
    expect(res.status).toBe(401);
  });

  it('should allow requests with valid token', async () => {
    const token = jwt.sign({ userId: '123', email: 'test@test.com', role: 'USER' }, JWT_SECRET);
    const res = await app.request('/protected/test', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toBe('success');
  });
});

describe('requireRole', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.use('/admin/*', authMiddleware);
    app.use('/admin/*', requireRole(['ADMIN']));
    app.get('/admin/test', (c) => c.json({ message: 'admin success' }));
  });

  it('should reject USER role accessing ADMIN endpoint', async () => {
    const token = jwt.sign({ userId: '123', email: 'user@test.com', role: 'USER' }, JWT_SECRET);
    const res = await app.request('/admin/test', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
  });

  it('should allow ADMIN role accessing ADMIN endpoint', async () => {
    const token = jwt.sign({ userId: '456', email: 'admin@test.com', role: 'ADMIN' }, JWT_SECRET);
    const res = await app.request('/admin/test', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
  });
});
