import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import vmRoutes from './routes/vms';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: [process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'],
    credentials: true,
  })
);

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.get('/api/v1', (c) => {
  return c.json({ message: 'Innozverse API v1' });
});
app.route('/', vmRoutes);

export default app;

// Start server only when this file is run directly (not imported)
if (require.main === module) {
  const port = parseInt(process.env.PORT || '3001');
  console.log(`🚀 API server running on http://localhost:${port}`);

  serve({
    fetch: app.fetch,
    port,
  });
}
