// Vercel serverless entry point
// This file is copied to the serverless function and includes dependencies inline

const { Hono } = require('hono');
const { cors } = require('hono/cors');
const { logger } = require('hono/logger');

// Initialize Prisma Client with connection pooling for serverless
let prisma;
try {
  const { PrismaClient } = require('@prisma/client');

  // Singleton pattern for serverless - reuse connection across invocations
  const globalForPrisma = global;
  prisma = globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
  }
} catch (error) {
  console.error('Failed to initialize Prisma Client:', error.message);
  prisma = null;
}

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

// ============================================================
// Authentication Routes
// ============================================================

// POST /api/v1/auth/register - Register new user
app.post('/api/v1/auth/register', async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const body = await c.req.json();

    // Validate input
    const { email, password } = body;
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    if (password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters' }, 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return c.json({ error: 'User with this email already exists' }, 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        role: 'USER',
        oauthProvider: 'LOCAL',
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        role: true,
        oauthProvider: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return c.json({ error: 'Server configuration error' }, 500);
    }

    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return c.json({
      user,
      accessToken,
      message: 'Registration successful'
    }, 201);

  } catch (error) {
    console.error('Register error:', error);
    return c.json({ error: 'Registration failed', message: error.message }, 500);
  }
});

// POST /api/v1/auth/login - Login user
app.post('/api/v1/auth/login', async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const body = await c.req.json();

    // Validate input
    const { email, password } = body;
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user || !user.passwordHash) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return c.json({ error: 'Server configuration error' }, 500);
    }

    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user;

    return c.json({
      user: userWithoutPassword,
      accessToken,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed', message: error.message }, 500);
  }
});

// Test endpoints
app.get('/test/db', async (c) => {
  if (!prisma) {
    return c.json({
      status: 'error',
      message: 'Prisma Client not initialized',
      note: 'Make sure @prisma/client is installed and generated',
      timestamp: new Date().toISOString()
    }, 500);
  }

  try {
    // Test database connection by counting users
    const userCount = await prisma.user.count();
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, createdAt: true },
      take: 3
    });

    return c.json({
      status: 'ok',
      message: 'Database connection successful',
      userCount,
      sampleUsers: users,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
      hint: 'Check DATABASE_URL environment variable',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

app.get('/test/env', (c) => {
  return c.json({
    status: 'ok',
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? '✓ Set' : '✗ Missing',
      JWT_SECRET: process.env.JWT_SECRET ? '✓ Set' : '✗ Missing',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✓ Set' : '✗ Missing',
      NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL || 'Not set',
      NODE_ENV: process.env.NODE_ENV || 'Not set',
      VERCEL: process.env.VERCEL ? '✓ Running on Vercel' : '✗ Not on Vercel'
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/test/jwt', async (c) => {
  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
      return c.json({
        status: 'error',
        message: 'JWT_SECRET not configured'
      }, 500);
    }

    // Generate test token
    const testPayload = {
      userId: 'test-123',
      email: 'test@example.com',
      role: 'USER'
    };

    const token = jwt.sign(testPayload, JWT_SECRET, { expiresIn: '1h' });

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    return c.json({
      status: 'ok',
      message: 'JWT generation and verification successful',
      testToken: token,
      decoded,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      status: 'error',
      message: 'JWT test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Export handler for Vercel
module.exports = async (req, res) => {
  try {
    // Build full URL from Vercel request
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const url = `${protocol}://${host}${req.url}`;

    // Convert Node.js IncomingMessage to Web Request
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => headers.append(key, v));
      } else if (value) {
        headers.set(key, value);
      }
    });

    // Create request body if present
    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      body = Buffer.concat(chunks);
    }

    const request = new Request(url, {
      method: req.method,
      headers,
      body,
    });

    // Call Hono app
    const response = await app.fetch(request);

    // Set status and headers
    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Send response body
    const responseBody = await response.text();
    res.end(responseBody);
  } catch (error) {
    console.error('Serverless function error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }));
  }
};
