// Local development server that uses the same code as Vercel deployment
require('dotenv').config({ path: '../../.env' });
const { serve } = require('@hono/node-server');

// Import the Hono app from vercel-serverless
const { app } = require('./vercel-serverless.js');

const port = parseInt(process.env.PORT || '3001');

console.log(`🚀 API development server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
