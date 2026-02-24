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

// Initialize Stripe for refunds
let stripe;
try {
  const Stripe = require('stripe');
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
} catch (error) {
  console.error('Failed to initialize Stripe:', error.message);
  stripe = null;
}

/**
 * Issue a full refund for an order via Stripe.
 * Requires the order to have a stripePaymentIntentId.
 * Returns { success, error? } — does not throw.
 */
async function refundOrder(order) {
  if (!stripe) {
    console.warn('Stripe not initialized — skipping refund for order', order.id);
    return { success: false, error: 'Stripe not configured' };
  }
  if (!order.stripePaymentIntentId) {
    console.warn('No payment intent ID on order', order.id, '— skipping refund');
    return { success: false, error: 'No payment intent associated with order' };
  }
  try {
    await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
    });
    console.log('Refund issued for order', order.id, 'payment_intent', order.stripePaymentIntentId);
    return { success: true };
  } catch (err) {
    console.error('Stripe refund failed for order', order.id, ':', err.message);
    return { success: false, error: err.message };
  }
}

const app = new Hono();

// ============================================================
// Authentication Middleware
// ============================================================

// Middleware to verify JWT and attach user to context
const authMiddleware = async (c, next) => {
  const jwt = require('jsonwebtoken');
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header' }, 401);
  }

  const token = authHeader.substring(7);
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    return c.json({ error: 'Server configuration error' }, 500);
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
};

// Optional auth middleware - sets user if token present, but doesn't require it
const optionalAuthMiddleware = async (c, next) => {
  const jwt = require('jsonwebtoken');
  const authHeader = c.req.header('Authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const JWT_SECRET = process.env.JWT_SECRET;

    if (JWT_SECRET) {
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        c.set('user', payload);
      } catch (error) {
        // Token invalid, but continue anyway (optional auth)
      }
    }
  }

  await next();
};

// Middleware to require specific role
const requireRole = (...roles) => {
  return async (c, next) => {
    const user = c.get('user');

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!roles.includes(user.role)) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    await next();
  };
};

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: (origin) => {
      const allowed = [
        process.env.NEXT_PUBLIC_WEB_URL,
        'https://www.innozverse.com',
        'https://innozverse.com',
        'http://localhost:3000',
      ].filter(Boolean);
      return allowed.includes(origin) ? origin : allowed[0];
    },
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

    // Block soft-deleted users
    if (user.deletedAt) {
      return c.json({ error: 'AccountDeactivated' }, 403);
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

// ============================================================
// Product Routes
// ============================================================

// GET /api/v1/products - List products with filtering
app.get('/api/v1/products', async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const { type, search, active, page = '1', limit = '20' } = c.req.query();

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const where = {};

    if (type) {
      where.type = type;
    }

    if (active !== undefined) {
      where.active = active === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const now = new Date();

    // Get products, total count, and active event discounts
    const [products, total, activeEventDiscounts] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where }),
      prisma.eventDiscount.findMany({
        where: {
          active: true,
          startDate: { lte: now },
          endDate: { gte: now },
        },
        orderBy: { percentage: 'desc' },
      }),
    ]);

    return c.json({
      products,
      activeEventDiscounts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    return c.json({ error: 'Failed to fetch products', message: error.message }, 500);
  }
});

// GET /api/v1/products/:id - Get single product
app.get('/api/v1/products/:id', async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const { id } = c.req.param();

    const now = new Date();
    const [product, activeEventDiscounts] = await Promise.all([
      prisma.product.findUnique({ where: { id } }),
      prisma.eventDiscount.findMany({
        where: {
          active: true,
          startDate: { lte: now },
          endDate: { gte: now },
        },
        orderBy: { percentage: 'desc' },
      }),
    ]);

    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    return c.json({ product, activeEventDiscounts });

  } catch (error) {
    console.error('Get product error:', error);
    return c.json({ error: 'Failed to fetch product', message: error.message }, 500);
  }
});

// POST /api/v1/products - Create product (admin only)
app.post('/api/v1/products', authMiddleware, requireRole('ADMIN'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const body = await c.req.json();
    const { name, description, basePrice, type, imageUrls, properties, stock = 0, active = true, studentDiscountPercentage, upc } = body;

    // Validate required fields
    if (!name || !description || basePrice === undefined || !type) {
      return c.json({ error: 'Missing required fields: name, description, basePrice, type' }, 400);
    }

    // Validate price
    if (basePrice < 0) {
      return c.json({ error: 'Base price must be non-negative' }, 400);
    }

    // Validate stock
    if (stock < 0) {
      return c.json({ error: 'Stock must be non-negative' }, 400);
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        description,
        basePrice,
        type,
        imageUrls: imageUrls || [],
        properties: properties || {},
        stock,
        active,
        studentDiscountPercentage: studentDiscountPercentage ?? null,
        upc: upc || '',
      }
    });

    return c.json({ product, message: 'Product created successfully' }, 201);

  } catch (error) {
    console.error('Create product error:', error);
    return c.json({ error: 'Failed to create product', message: error.message }, 500);
  }
});

// PUT /api/v1/products/:id - Update product (admin only)
app.put('/api/v1/products/:id', authMiddleware, requireRole('ADMIN'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const { name, description, basePrice, type, imageUrls, properties, stock, active, studentDiscountPercentage, upc } = body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return c.json({ error: 'Product not found' }, 404);
    }

    // Build update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (basePrice !== undefined) {
      if (basePrice < 0) {
        return c.json({ error: 'Base price must be non-negative' }, 400);
      }
      updateData.basePrice = basePrice;
    }
    if (type !== undefined) updateData.type = type;
    if (imageUrls !== undefined) updateData.imageUrls = imageUrls;
    if (properties !== undefined) updateData.properties = properties;
    if (stock !== undefined) {
      if (stock < 0) {
        return c.json({ error: 'Stock must be non-negative' }, 400);
      }
      updateData.stock = stock;
    }
    if (active !== undefined) updateData.active = active;
    if (studentDiscountPercentage !== undefined) updateData.studentDiscountPercentage = studentDiscountPercentage;
    if (upc !== undefined) updateData.upc = upc;

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: updateData
    });

    return c.json({ product, message: 'Product updated successfully' });

  } catch (error) {
    console.error('Update product error:', error);
    return c.json({ error: 'Failed to update product', message: error.message }, 500);
  }
});

// DELETE /api/v1/products/:id - Delete product (admin only)
app.delete('/api/v1/products/:id', authMiddleware, requireRole('ADMIN'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const { id } = c.req.param();

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return c.json({ error: 'Product not found' }, 404);
    }

    // Delete product
    await prisma.product.delete({
      where: { id }
    });

    return c.json({ message: 'Product deleted successfully' });

  } catch (error) {
    console.error('Delete product error:', error);
    return c.json({ error: 'Failed to delete product', message: error.message }, 500);
  }
});

// ============================================================
// Discount Routes
// ============================================================

// GET /api/v1/discounts/active - Public: list currently active discounts
app.get('/api/v1/discounts/active', async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const now = new Date();
    const discounts = await prisma.eventDiscount.findMany({
      where: {
        active: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { percentage: 'desc' },
    });

    return c.json({ discounts });
  } catch (error) {
    console.error('Get active discounts error:', error);
    return c.json({ error: 'Failed to fetch discounts', message: error.message }, 500);
  }
});

// GET /api/v1/discounts - List all discounts (admin, auth required)
app.get('/api/v1/discounts', authMiddleware, requireRole('ADMIN'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const discounts = await prisma.eventDiscount.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return c.json({ discounts });

  } catch (error) {
    console.error('Get discounts error:', error);
    return c.json({ error: 'Failed to fetch discounts', message: error.message }, 500);
  }
});

// POST /api/v1/discounts - Create discount (admin only)
app.post('/api/v1/discounts', authMiddleware, requireRole('ADMIN'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const body = await c.req.json();
    const { name, description, percentage, startDate, endDate, active = true } = body;

    if (!name || percentage === undefined || !startDate || !endDate) {
      return c.json({ error: 'Missing required fields: name, percentage, startDate, endDate' }, 400);
    }

    if (percentage < 0 || percentage > 100) {
      return c.json({ error: 'Percentage must be between 0 and 100' }, 400);
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return c.json({ error: 'End date must be after start date' }, 400);
    }

    const discount = await prisma.eventDiscount.create({
      data: {
        name,
        description: description || null,
        percentage,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        active
      }
    });

    return c.json({ discount, message: 'Discount created successfully' }, 201);

  } catch (error) {
    console.error('Create discount error:', error);
    return c.json({ error: 'Failed to create discount', message: error.message }, 500);
  }
});

// PUT /api/v1/discounts/:id - Update discount (admin only)
app.put('/api/v1/discounts/:id', authMiddleware, requireRole('ADMIN'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const { name, description, percentage, startDate, endDate, active } = body;

    const existingDiscount = await prisma.eventDiscount.findUnique({ where: { id } });
    if (!existingDiscount) {
      return c.json({ error: 'Discount not found' }, 404);
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (percentage !== undefined) {
      if (percentage < 0 || percentage > 100) {
        return c.json({ error: 'Percentage must be between 0 and 100' }, 400);
      }
      updateData.percentage = percentage;
    }
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (active !== undefined) updateData.active = active;

    // Validate dates if both are being set
    const finalStart = updateData.startDate || existingDiscount.startDate;
    const finalEnd = updateData.endDate || existingDiscount.endDate;
    if (new Date(finalEnd) <= new Date(finalStart)) {
      return c.json({ error: 'End date must be after start date' }, 400);
    }

    const discount = await prisma.eventDiscount.update({
      where: { id },
      data: updateData
    });

    return c.json({ discount, message: 'Discount updated successfully' });

  } catch (error) {
    console.error('Update discount error:', error);
    return c.json({ error: 'Failed to update discount', message: error.message }, 500);
  }
});

// DELETE /api/v1/discounts/:id - Delete discount (admin only)
app.delete('/api/v1/discounts/:id', authMiddleware, requireRole('ADMIN'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const { id } = c.req.param();

    const existingDiscount = await prisma.eventDiscount.findUnique({ where: { id } });
    if (!existingDiscount) {
      return c.json({ error: 'Discount not found' }, 404);
    }

    await prisma.eventDiscount.delete({
      where: { id }
    });

    return c.json({ message: 'Discount deleted successfully' });

  } catch (error) {
    console.error('Delete discount error:', error);
    return c.json({ error: 'Failed to delete discount', message: error.message }, 500);
  }
});

// ============================================================
// Workshop Routes
// ============================================================

// GET /api/v1/workshops - List published workshops (public)
app.get('/api/v1/workshops', async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const workshops = await prisma.workshop.findMany({
      where: { isPublished: true },
      orderBy: { startDate: 'asc' },
      include: { _count: { select: { registrations: true } } }
    });

    return c.json({ workshops });

  } catch (error) {
    console.error('Get workshops error:', error);
    return c.json({ error: 'Failed to fetch workshops', message: error.message }, 500);
  }
});

// GET /api/v1/workshops/admin - List ALL workshops (admin only)
app.get('/api/v1/workshops/admin', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const workshops = await prisma.workshop.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return c.json({ workshops });

  } catch (error) {
    console.error('Get admin workshops error:', error);
    return c.json({ error: 'Failed to fetch workshops', message: error.message }, 500);
  }
});

// POST /api/v1/workshops - Create workshop (admin only)
app.post('/api/v1/workshops', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const body = await c.req.json();
    const { title, description, imageUrls, startDate, endDate, capacity, isPublished = false } = body;

    if (!title || !description || !startDate || !endDate) {
      return c.json({ error: 'Missing required fields: title, description, startDate, endDate' }, 400);
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return c.json({ error: 'End date must be after start date' }, 400);
    }

    const workshop = await prisma.workshop.create({
      data: {
        title,
        description,
        imageUrls: imageUrls || [],
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        capacity: capacity !== undefined ? Number(capacity) : 0,
        isPublished
      }
    });

    return c.json({ workshop, message: 'Workshop created successfully' }, 201);

  } catch (error) {
    console.error('Create workshop error:', error);
    return c.json({ error: 'Failed to create workshop', message: error.message }, 500);
  }
});

// PUT /api/v1/workshops/:id - Update workshop (admin only)
app.put('/api/v1/workshops/:id', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const { title, description, imageUrls, startDate, endDate, capacity, isPublished } = body;

    const existingWorkshop = await prisma.workshop.findUnique({ where: { id } });
    if (!existingWorkshop) {
      return c.json({ error: 'Workshop not found' }, 404);
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (imageUrls !== undefined) updateData.imageUrls = imageUrls;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (capacity !== undefined) updateData.capacity = Number(capacity);
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    // Validate dates if both are being set
    const finalStart = updateData.startDate || existingWorkshop.startDate;
    const finalEnd = updateData.endDate || existingWorkshop.endDate;
    if (new Date(finalEnd) <= new Date(finalStart)) {
      return c.json({ error: 'End date must be after start date' }, 400);
    }

    const workshop = await prisma.workshop.update({
      where: { id },
      data: updateData
    });

    return c.json({ workshop, message: 'Workshop updated successfully' });

  } catch (error) {
    console.error('Update workshop error:', error);
    return c.json({ error: 'Failed to update workshop', message: error.message }, 500);
  }
});

// DELETE /api/v1/workshops/:id - Delete workshop (admin only)
app.delete('/api/v1/workshops/:id', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const { id } = c.req.param();

    const existingWorkshop = await prisma.workshop.findUnique({ where: { id } });
    if (!existingWorkshop) {
      return c.json({ error: 'Workshop not found' }, 404);
    }

    await prisma.workshop.delete({
      where: { id }
    });

    return c.json({ message: 'Workshop deleted successfully' });

  } catch (error) {
    console.error('Delete workshop error:', error);
    return c.json({ error: 'Failed to delete workshop', message: error.message }, 500);
  }
});

// GET /api/v1/workshops/my-registrations - User's registered workshops
app.get('/api/v1/workshops/my-registrations', authMiddleware, async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const user = c.get('user');

    const registrations = await prisma.workshopRegistration.findMany({
      where: { userId: user.userId },
      include: {
        workshop: {
          include: { _count: { select: { registrations: true } } },
        },
      },
      orderBy: { workshop: { startDate: 'asc' } },
    });

    const workshops = registrations.map((r) => ({
      registrationId: r.id,
      workshopId: r.workshop.id,
      title: r.workshop.title,
      description: r.workshop.description,
      imageUrls: r.workshop.imageUrls,
      startDate: r.workshop.startDate.toISOString(),
      endDate: r.workshop.endDate.toISOString(),
      capacity: r.workshop.capacity,
      registered: r.workshop._count.registrations,
      registeredAt: r.createdAt.toISOString(),
    }));

    return c.json({ workshops });

  } catch (error) {
    console.error('Get my registrations error:', error);
    return c.json({ error: 'Failed to fetch registrations', message: error.message }, 500);
  }
});

// GET /api/v1/workshops/:id - Public workshop detail
app.get('/api/v1/workshops/:id', optionalAuthMiddleware, async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const { id } = c.req.param();
    const user = c.get('user');

    const workshop = await prisma.workshop.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true } } },
    });

    if (!workshop || !workshop.isPublished) {
      return c.json({ error: 'Workshop not found' }, 404);
    }

    let isRegistered = false;
    if (user) {
      const registration = await prisma.workshopRegistration.findUnique({
        where: { userId_workshopId: { userId: user.userId, workshopId: id } },
      });
      isRegistered = !!registration;
    }

    return c.json({ workshop, isRegistered });

  } catch (error) {
    console.error('Get workshop detail error:', error);
    return c.json({ error: 'Failed to fetch workshop', message: error.message }, 500);
  }
});

// POST /api/v1/workshops/:id/register - Register for workshop
app.post('/api/v1/workshops/:id/register', authMiddleware, async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const { id: workshopId } = c.req.param();
    const user = c.get('user');
    const userId = user.userId;

    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      include: { _count: { select: { registrations: true } } },
    });

    if (!workshop || !workshop.isPublished) {
      return c.json({ error: 'Workshop not found.' }, 404);
    }

    if (new Date(workshop.endDate) < new Date()) {
      return c.json({ error: 'This workshop has already ended.' }, 400);
    }

    if (workshop.capacity > 0 && workshop._count.registrations >= workshop.capacity) {
      return c.json({ error: 'This workshop is full.' }, 400);
    }

    const existing = await prisma.workshopRegistration.findUnique({
      where: { userId_workshopId: { userId, workshopId } },
    });

    if (existing) {
      return c.json({ error: 'You are already registered for this workshop.' }, 409);
    }

    await prisma.workshopRegistration.create({
      data: { userId, workshopId },
    });

    return c.json({ message: 'Registered successfully' }, 201);

  } catch (error) {
    if (error.code === 'P2002') {
      return c.json({ error: 'You are already registered for this workshop.' }, 409);
    }
    console.error('Workshop register error:', error);
    return c.json({ error: 'Failed to register. Please try again.', message: error.message }, 500);
  }
});

// DELETE /api/v1/workshops/:id/register - Cancel workshop registration
app.delete('/api/v1/workshops/:id/register', authMiddleware, async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const { id: workshopId } = c.req.param();
    const user = c.get('user');

    await prisma.workshopRegistration.delete({
      where: {
        userId_workshopId: {
          userId: user.userId,
          workshopId,
        },
      },
    });

    return c.json({ message: 'Registration cancelled successfully' });

  } catch (error) {
    console.error('Cancel registration error:', error);
    return c.json({ error: 'Failed to cancel registration.', message: error.message }, 500);
  }
});

// GET /api/v1/workshops/:id/registrations - Admin: all registrations for a workshop
app.get('/api/v1/workshops/:id/registrations', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const { id } = c.req.param();

    const workshop = await prisma.workshop.findUnique({
      where: { id },
      include: {
        registrations: {
          include: {
            user: {
              select: { id: true, email: true, fname: true, lname: true, createdAt: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!workshop) {
      return c.json({ error: 'Workshop not found' }, 404);
    }

    return c.json({ workshop });

  } catch (error) {
    console.error('Get workshop registrations error:', error);
    return c.json({ error: 'Failed to fetch registrations', message: error.message }, 500);
  }
});

// ============================================================
// Studio Slot Routes
// ============================================================

// GET /api/v1/studio-slots - Public: future available slots
app.get('/api/v1/studio-slots', optionalAuthMiddleware, async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const user = c.get('user');
    const now = new Date();

    const slots = await prisma.studioSlot.findMany({
      where: {
        isAvailable: true,
        startTime: { gte: now },
      },
      include: {
        _count: {
          select: { bookings: { where: { status: 'CONFIRMED' } } },
        },
        ...(user
          ? {
              bookings: {
                where: { userId: user.userId, status: 'CONFIRMED' },
                select: { id: true },
              },
            }
          : {}),
      },
      orderBy: { startTime: 'asc' },
    });

    const result = slots.map((slot) => ({
      id: slot.id,
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString(),
      capacity: slot.capacity,
      confirmedCount: slot._count.bookings,
      userBooked:
        'bookings' in slot && Array.isArray(slot.bookings)
          ? slot.bookings.length > 0
          : false,
    }));

    return c.json({ slots: result });

  } catch (error) {
    console.error('Get studio slots error:', error);
    return c.json({ error: 'Failed to fetch studio slots', message: error.message }, 500);
  }
});

// GET /api/v1/studio-slots/admin - Admin: all slots
app.get('/api/v1/studio-slots/admin', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const slots = await prisma.studioSlot.findMany({
      orderBy: { startTime: 'asc' },
      include: {
        _count: {
          select: { bookings: { where: { status: 'CONFIRMED' } } },
        },
      },
    });

    const result = slots.map((s) => ({
      id: s.id,
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
      capacity: s.capacity,
      isAvailable: s.isAvailable,
      confirmedBookings: s._count.bookings,
      createdAt: s.createdAt.toISOString(),
    }));

    return c.json({ slots: result });

  } catch (error) {
    console.error('Get admin studio slots error:', error);
    return c.json({ error: 'Failed to fetch studio slots', message: error.message }, 500);
  }
});

// POST /api/v1/studio-slots - Admin: create slot
app.post('/api/v1/studio-slots', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const body = await c.req.json();
    const { startTime, endTime, capacity, isAvailable = true } = body;

    if (!startTime || !endTime) {
      return c.json({ error: 'startTime and endTime are required' }, 400);
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return c.json({ error: 'End time must be after start time.' }, 400);
    }

    const slot = await prisma.studioSlot.create({
      data: {
        startTime: start,
        endTime: end,
        capacity: capacity !== undefined ? Number(capacity) : 1,
        isAvailable,
      },
    });

    return c.json({ slot, message: 'Slot created successfully' }, 201);

  } catch (error) {
    console.error('Create studio slot error:', error);
    return c.json({ error: 'Failed to create slot.', message: error.message }, 500);
  }
});

// PUT /api/v1/studio-slots/:id - Admin: update slot
app.put('/api/v1/studio-slots/:id', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const { startTime, endTime, capacity, isAvailable } = body;

    const existing = await prisma.studioSlot.findUnique({ where: { id } });
    if (!existing) {
      return c.json({ error: 'Studio slot not found' }, 404);
    }

    const start = startTime ? new Date(startTime) : existing.startTime;
    const end = endTime ? new Date(endTime) : existing.endTime;

    if (end <= start) {
      return c.json({ error: 'End time must be after start time.' }, 400);
    }

    const slot = await prisma.studioSlot.update({
      where: { id },
      data: {
        startTime: start,
        endTime: end,
        capacity: capacity !== undefined ? Number(capacity) : undefined,
        isAvailable: isAvailable !== undefined ? isAvailable : undefined,
      },
    });

    return c.json({ slot, message: 'Slot updated successfully' });

  } catch (error) {
    console.error('Update studio slot error:', error);
    return c.json({ error: 'Failed to update slot.', message: error.message }, 500);
  }
});

// DELETE /api/v1/studio-slots/:id - Admin: delete slot
app.delete('/api/v1/studio-slots/:id', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const { id } = c.req.param();

    const existing = await prisma.studioSlot.findUnique({ where: { id } });
    if (!existing) {
      return c.json({ error: 'Studio slot not found' }, 404);
    }

    await prisma.studioSlot.delete({ where: { id } });

    return c.json({ message: 'Slot deleted successfully' });

  } catch (error) {
    console.error('Delete studio slot error:', error);
    return c.json({ error: 'Failed to delete slot. It may have active bookings.', message: error.message }, 500);
  }
});

// PATCH /api/v1/studio-slots/:id/availability - Admin: toggle availability
app.patch('/api/v1/studio-slots/:id/availability', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const { isAvailable } = body;

    if (isAvailable === undefined) {
      return c.json({ error: 'isAvailable is required' }, 400);
    }

    const existing = await prisma.studioSlot.findUnique({ where: { id } });
    if (!existing) {
      return c.json({ error: 'Studio slot not found' }, 404);
    }

    const slot = await prisma.studioSlot.update({
      where: { id },
      data: { isAvailable },
    });

    return c.json({ slot, message: 'Slot availability updated' });

  } catch (error) {
    console.error('Toggle slot availability error:', error);
    return c.json({ error: 'Failed to update slot.', message: error.message }, 500);
  }
});

// GET /api/v1/studio-slots/:id/bookings - Admin: slot bookings detail
app.get('/api/v1/studio-slots/:id/bookings', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const { id } = c.req.param();

    const slot = await prisma.studioSlot.findUnique({
      where: { id },
      include: {
        bookings: {
          include: {
            user: {
              select: { id: true, email: true, fname: true, lname: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!slot) {
      return c.json({ error: 'Studio slot not found' }, 404);
    }

    return c.json({ slot });

  } catch (error) {
    console.error('Get slot bookings error:', error);
    return c.json({ error: 'Failed to fetch bookings', message: error.message }, 500);
  }
});

// ============================================================
// Studio Booking Routes
// ============================================================

// POST /api/v1/studio-bookings - Book a studio session
app.post('/api/v1/studio-bookings', authMiddleware, async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const user = c.get('user');
    const userId = user.userId;
    const body = await c.req.json();
    const { slotId } = body;

    if (!slotId) {
      return c.json({ error: 'slotId is required' }, 400);
    }

    const slot = await prisma.studioSlot.findUnique({
      where: { id: slotId },
      include: {
        _count: {
          select: { bookings: { where: { status: 'CONFIRMED' } } },
        },
      },
    });

    if (!slot || !slot.isAvailable) {
      return c.json({ error: 'This time slot is not available.' }, 404);
    }

    if (slot._count.bookings >= slot.capacity) {
      return c.json({ error: 'This time slot is full.' }, 400);
    }

    const existing = await prisma.studioBooking.findUnique({
      where: { userId_slotId: { userId, slotId } },
    });

    if (existing) {
      if (existing.status === 'CONFIRMED') {
        return c.json({ error: 'You have already booked this session.' }, 409);
      }
      // Re-confirm a previously cancelled booking
      await prisma.studioBooking.update({
        where: { id: existing.id },
        data: { status: 'CONFIRMED' },
      });
      return c.json({ message: 'Booking re-confirmed' }, 201);
    }

    await prisma.studioBooking.create({
      data: { userId, slotId },
    });

    return c.json({ message: 'Session booked successfully' }, 201);

  } catch (error) {
    if (error.code === 'P2002') {
      return c.json({ error: 'You have already booked this session.' }, 409);
    }
    console.error('Book studio session error:', error);
    return c.json({ error: 'Failed to book. Please try again.', message: error.message }, 500);
  }
});

// DELETE /api/v1/studio-bookings/:id - Cancel a studio booking
app.delete('/api/v1/studio-bookings/:id', authMiddleware, async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const { id } = c.req.param();
    const user = c.get('user');

    const booking = await prisma.studioBooking.findUnique({
      where: { id },
    });

    if (!booking || booking.userId !== user.userId) {
      return c.json({ error: 'Booking not found.' }, 404);
    }

    if (booking.status !== 'CONFIRMED') {
      return c.json({ error: 'This booking is not active.' }, 400);
    }

    await prisma.studioBooking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return c.json({ message: 'Booking cancelled successfully' });

  } catch (error) {
    console.error('Cancel studio booking error:', error);
    return c.json({ error: 'Failed to cancel booking.', message: error.message }, 500);
  }
});

// GET /api/v1/studio-bookings/mine - User's studio bookings
app.get('/api/v1/studio-bookings/mine', authMiddleware, async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const user = c.get('user');

    const bookings = await prisma.studioBooking.findMany({
      where: { userId: user.userId },
      include: { slot: true },
      orderBy: { slot: { startTime: 'asc' } },
    });

    const data = bookings.map((b) => ({
      bookingId: b.id,
      slotId: b.slot.id,
      startTime: b.slot.startTime.toISOString(),
      endTime: b.slot.endTime.toISOString(),
      status: b.status,
      bookedAt: b.createdAt.toISOString(),
    }));

    return c.json({ bookings: data });

  } catch (error) {
    console.error('Get my studio bookings error:', error);
    return c.json({ error: 'Failed to fetch bookings', message: error.message }, 500);
  }
});

// ============================================================
// Cart Routes
// ============================================================

// Helper function to get or create cart
async function getOrCreateCart(userId, sessionId) {
  if (!prisma) {
    throw new Error('Database not available');
  }

  // Try to find existing cart
  let cart = null;

  if (userId) {
    cart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });
  } else if (sessionId) {
    cart = await prisma.cart.findFirst({
      where: { sessionId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });
  }

  // Create new cart if not found
  if (!cart) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiration

    cart = await prisma.cart.create({
      data: {
        userId,
        sessionId,
        expiresAt
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });
  }

  return cart;
}

// GET /api/v1/cart - Get user cart
app.get('/api/v1/cart', optionalAuthMiddleware, async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    // Get user from token (if authenticated) or session ID from header
    const user = c.get('user');
    const sessionId = c.req.header('X-Session-Id');

    if (!user && !sessionId) {
      return c.json({ error: 'User authentication or session ID required' }, 401);
    }

    const cart = await getOrCreateCart(user?.userId, sessionId);

    // Calculate cart total
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + (parseFloat(item.product.basePrice) * item.quantity);
    }, 0);

    return c.json({
      cart: {
        id: cart.id,
        items: cart.items,
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: subtotal.toFixed(2)
      }
    });

  } catch (error) {
    console.error('Get cart error:', error);
    return c.json({ error: 'Failed to fetch cart', message: error.message }, 500);
  }
});

// POST /api/v1/cart/items - Add item to cart
app.post('/api/v1/cart/items', optionalAuthMiddleware, async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const user = c.get('user');
    const sessionId = c.req.header('X-Session-Id');

    if (!user && !sessionId) {
      return c.json({ error: 'User authentication or session ID required' }, 401);
    }

    const body = await c.req.json();
    const { productId, quantity = 1 } = body;

    if (!productId) {
      return c.json({ error: 'Product ID is required' }, 400);
    }

    if (quantity < 1) {
      return c.json({ error: 'Quantity must be at least 1' }, 400);
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    if (!product.active) {
      return c.json({ error: 'Product is not available' }, 400);
    }

    // Check stock
    if (product.stock < quantity) {
      return c.json({ error: `Only ${product.stock} items available in stock` }, 400);
    }

    // Get or create cart
    const cart = await getOrCreateCart(user?.userId, sessionId);

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId
        }
      }
    });

    let cartItem;

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;

      if (product.stock < newQuantity) {
        return c.json({ error: `Only ${product.stock} items available in stock` }, 400);
      }

      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
        include: { product: true }
      });
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity
        },
        include: { product: true }
      });
    }

    return c.json({ cartItem, message: 'Item added to cart' }, 201);

  } catch (error) {
    console.error('Add to cart error:', error);
    return c.json({ error: 'Failed to add item to cart', message: error.message }, 500);
  }
});

// PUT /api/v1/cart/items/:id - Update cart item quantity
app.put('/api/v1/cart/items/:id', optionalAuthMiddleware, async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const user = c.get('user');
    const sessionId = c.req.header('X-Session-Id');

    if (!user && !sessionId) {
      return c.json({ error: 'User authentication or session ID required' }, 401);
    }

    const { id } = c.req.param();
    const body = await c.req.json();
    const { quantity } = body;

    if (quantity === undefined) {
      return c.json({ error: 'Quantity is required' }, 400);
    }

    if (quantity < 1) {
      return c.json({ error: 'Quantity must be at least 1' }, 400);
    }

    // Get cart item with product
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: {
        cart: true,
        product: true
      }
    });

    if (!cartItem) {
      return c.json({ error: 'Cart item not found' }, 404);
    }

    // Verify cart belongs to user or session
    if (user && cartItem.cart.userId !== user.userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    if (!user && cartItem.cart.sessionId !== sessionId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Check stock
    if (cartItem.product.stock < quantity) {
      return c.json({ error: `Only ${cartItem.product.stock} items available in stock` }, 400);
    }

    // Update quantity
    const updatedItem = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
      include: { product: true }
    });

    return c.json({ cartItem: updatedItem, message: 'Cart item updated' });

  } catch (error) {
    console.error('Update cart item error:', error);
    return c.json({ error: 'Failed to update cart item', message: error.message }, 500);
  }
});

// DELETE /api/v1/cart/items/:id - Remove item from cart
app.delete('/api/v1/cart/items/:id', optionalAuthMiddleware, async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const user = c.get('user');
    const sessionId = c.req.header('X-Session-Id');

    if (!user && !sessionId) {
      return c.json({ error: 'User authentication or session ID required' }, 401);
    }

    const { id } = c.req.param();

    // Get cart item
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: { cart: true }
    });

    if (!cartItem) {
      return c.json({ error: 'Cart item not found' }, 404);
    }

    // Verify cart belongs to user or session
    if (user && cartItem.cart.userId !== user.userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    if (!user && cartItem.cart.sessionId !== sessionId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Delete item
    await prisma.cartItem.delete({
      where: { id }
    });

    return c.json({ message: 'Item removed from cart' });

  } catch (error) {
    console.error('Remove from cart error:', error);
    return c.json({ error: 'Failed to remove item from cart', message: error.message }, 500);
  }
});

// DELETE /api/v1/cart - Clear cart
app.delete('/api/v1/cart', optionalAuthMiddleware, async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const user = c.get('user');
    const sessionId = c.req.header('X-Session-Id');

    if (!user && !sessionId) {
      return c.json({ error: 'User authentication or session ID required' }, 401);
    }

    // Find cart
    let cart = null;

    if (user) {
      cart = await prisma.cart.findFirst({
        where: { userId: user.userId }
      });
    } else if (sessionId) {
      cart = await prisma.cart.findFirst({
        where: { sessionId }
      });
    }

    if (!cart) {
      return c.json({ error: 'Cart not found' }, 404);
    }

    // Delete all cart items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    return c.json({ message: 'Cart cleared successfully' });

  } catch (error) {
    console.error('Clear cart error:', error);
    return c.json({ error: 'Failed to clear cart', message: error.message }, 500);
  }
});

// ============================================================
// Order Routes
// ============================================================

// POST /api/v1/orders - Create order from cart
app.post('/api/v1/orders', authMiddleware, async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const user = c.get('user');

    // Get user's cart with items
    const cart = await prisma.cart.findFirst({
      where: { userId: user.userId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      return c.json({ error: 'Cart is empty' }, 400);
    }

    // Validate stock and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
      if (!item.product.active) {
        return c.json({ error: `Product "${item.product.name}" is no longer available` }, 400);
      }

      if (item.product.stock < item.quantity) {
        return c.json({
          error: `Insufficient stock for "${item.product.name}". Only ${item.product.stock} available.`
        }, 400);
      }

      const itemTotal = parseFloat(item.product.basePrice) * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: item.product.basePrice,
        productSnapshot: {
          name: item.product.name,
          description: item.product.description,
          type: item.product.type,
          imageUrls: item.product.imageUrls,
          properties: item.product.properties
        }
      });
    }

    // For MVP, no tax or discounts
    const tax = 0;
    const discountAmount = 0;
    const total = subtotal + tax - discountAmount;

    // Create order and order items in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId: user.userId,
          status: 'PENDING',
          subtotal,
          discountAmount,
          tax,
          total,
          items: {
            create: orderItems
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      // Update product stock
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      return newOrder;
    });

    return c.json({
      order,
      message: 'Order placed successfully'
    }, 201);

  } catch (error) {
    console.error('Create order error:', error);
    return c.json({ error: 'Failed to create order', message: error.message }, 500);
  }
});

// POST /api/v1/orders/from-stripe - Create order from Stripe webhook
app.post('/api/v1/orders/from-stripe', async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  // Verify internal secret
  const internalSecret = c.req.header('X-Internal-Secret');
  const expectedSecret = process.env.INTERNAL_WEBHOOK_SECRET;

  if (!expectedSecret || internalSecret !== expectedSecret) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json();
    const { userId, stripeSessionId, stripePaymentIntentId, amountTotal, items } = body;

    if (!userId || !stripeSessionId || !items || !items.length) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Idempotency check
    const existingOrder = await prisma.order.findUnique({
      where: { stripeSessionId }
    });

    if (existingOrder) {
      return c.json({ order: existingOrder, message: 'Order already exists' });
    }

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Fetch products for snapshots and stock validation
      const productIds = items.map((i) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } }
      });

      const productMap = {};
      for (const p of products) {
        productMap[p.id] = p;
      }

      // Build order items and validate
      const orderItems = [];
      let subtotal = 0;

      for (const item of items) {
        const product = productMap[item.productId];
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        const priceAtPurchase = parseFloat(product.basePrice);
        subtotal += priceAtPurchase * item.quantity;

        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: product.basePrice,
          productSnapshot: {
            name: product.name,
            description: product.description,
            type: product.type,
            imageUrls: product.imageUrls,
            properties: product.properties,
          },
        });
      }

      // Use Stripe's amount as the total (authoritative)
      const total = amountTotal ? amountTotal / 100 : subtotal;

      // Create the order
      const newOrder = await tx.order.create({
        data: {
          userId,
          status: 'PROCESSING',
          subtotal,
          discountAmount: 0,
          tax: 0,
          total,
          stripeSessionId,
          stripePaymentIntentId: stripePaymentIntentId || null,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Deduct stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            soldCount: { increment: item.quantity },
          },
        });
      }

      return newOrder;
    });

    return c.json({ order, message: 'Order created successfully' }, 201);
  } catch (error) {
    console.error('Create order from Stripe error:', error);
    return c.json({ error: 'Failed to create order', message: error.message }, 500);
  }
});

// POST /api/v1/orders/payment-failed - Handle Stripe payment failure from webhook
app.post('/api/v1/orders/payment-failed', async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  // Verify internal secret
  const internalSecret = c.req.header('X-Internal-Secret');
  const expectedSecret = process.env.INTERNAL_WEBHOOK_SECRET;

  if (!expectedSecret || internalSecret !== expectedSecret) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json();
    const { userId, stripeSessionId, stripePaymentIntentId, eventType } = body;

    console.warn('Payment failed event received:', { userId, stripeSessionId, stripePaymentIntentId, eventType });

    if (!userId) {
      return c.json({ error: 'Missing userId' }, 400);
    }

    // If we have a stripeSessionId, look for an existing order and cancel it
    if (stripeSessionId) {
      const existingOrder = await prisma.order.findUnique({
        where: { stripeSessionId }
      });

      if (existingOrder) {
        await prisma.order.update({
          where: { id: existingOrder.id },
          data: { status: 'CANCELLED' },
        });
        console.warn('Order cancelled due to payment failure:', existingOrder.id);
        return c.json({ cancelled: true, orderId: existingOrder.id });
      }
    }

    // If we have a stripePaymentIntentId, try finding by that
    if (stripePaymentIntentId) {
      const existingOrder = await prisma.order.findFirst({
        where: { stripePaymentIntentId }
      });

      if (existingOrder) {
        await prisma.order.update({
          where: { id: existingOrder.id },
          data: { status: 'CANCELLED' },
        });
        console.warn('Order cancelled due to payment failure:', existingOrder.id);
        return c.json({ cancelled: true, orderId: existingOrder.id });
      }
    }

    // No matching order found — payment failed before order was created
    return c.json({ cancelled: false, message: 'No matching order found' });
  } catch (error) {
    console.error('Payment failed handler error:', error);
    return c.json({ error: 'Failed to process payment failure', message: error.message }, 500);
  }
});

// GET /api/v1/orders - Get user's orders
app.get('/api/v1/orders', authMiddleware, async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const user = c.get('user');
    const { page = '1', limit = '10', status } = c.req.query();

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const where = { userId: user.userId };
    if (status) {
      where.status = status;
    }

    // Get orders and total count
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { placedAt: 'desc' },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      }),
      prisma.order.count({ where })
    ]);

    return c.json({
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    return c.json({ error: 'Failed to fetch orders', message: error.message }, 500);
  }
});

// GET /api/v1/orders/:id - Get single order
app.get('/api/v1/orders/:id', authMiddleware, async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const user = c.get('user');
    const { id } = c.req.param();

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    // Verify order belongs to user
    if (order.userId !== user.userId && user.role !== 'ADMIN') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    return c.json({ order });

  } catch (error) {
    console.error('Get order error:', error);
    return c.json({ error: 'Failed to fetch order', message: error.message }, 500);
  }
});

// PUT /api/v1/orders/:id/cancel - Cancel an order (customer)
app.put('/api/v1/orders/:id/cancel', authMiddleware, async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const user = c.get('user');
    const { id } = c.req.param();

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existingOrder) {
      return c.json({ error: 'Order not found' }, 404);
    }

    // Verify order belongs to user (unless admin)
    if (existingOrder.userId !== user.userId && user.role !== 'ADMIN') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Block if already delivered
    if (existingOrder.status === 'DELIVERED') {
      return c.json({ error: 'Cannot cancel a delivered order' }, 400);
    }

    // Block if already cancelled
    if (existingOrder.status === 'CANCELLED') {
      return c.json({ error: 'Order is already cancelled' }, 400);
    }

    // Issue Stripe refund
    const refundResult = await refundOrder(existingOrder);

    // Restore stock for each item
    for (const item of existingOrder.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
          soldCount: { decrement: item.quantity }
        }
      });
    }

    // Cancel the order
    const order = await prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    return c.json({
      order,
      message: 'Order cancelled successfully',
      refund: refundResult.success ? 'Refund issued' : refundResult.error,
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    return c.json({ error: 'Failed to cancel order', message: error.message }, 500);
  }
});

// GET /api/v1/orders/summary - Get order summary for user
app.get('/api/v1/orders/summary', authMiddleware, async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const user = c.get('user');

    // Get all orders for the user
    const orders = await prisma.order.findMany({
      where: { userId: user.userId },
      select: {
        status: true,
        totalAmount: true,
      }
    });

    // Calculate summary
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING').length;
    const completedOrders = orders.filter(o => o.status === 'DELIVERED').length;
    const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount.toString()), 0);

    return c.json({
      summary: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalSpent: totalSpent.toFixed(2)
      }
    });

  } catch (error) {
    console.error('Get order summary error:', error);
    return c.json({ error: 'Failed to fetch order summary', message: error.message }, 500);
  }
});

// GET /api/v1/admin/orders - Get all orders (admin only)
app.get('/api/v1/admin/orders', authMiddleware, requireRole('ADMIN'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const { page = '1', limit = '20', status, userId } = c.req.query();

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const where = {};
    if (status) {
      where.status = status;
    }
    if (userId) {
      where.userId = userId;
    }

    // Get orders and total count
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { placedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true
            }
          },
          items: {
            include: {
              product: true
            }
          }
        }
      }),
      prisma.order.count({ where })
    ]);

    return c.json({
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Get admin orders error:', error);
    return c.json({ error: 'Failed to fetch orders', message: error.message }, 500);
  }
});

// PUT /api/v1/admin/orders/:id/status - Update order status (admin only)
app.put('/api/v1/admin/orders/:id/status', authMiddleware, requireRole('ADMIN'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const { status } = body;

    if (!status) {
      return c.json({ error: 'Status is required' }, 400);
    }

    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return c.json({ error: 'Invalid status' }, 400);
    }

    // Check if order exists with items
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existingOrder) {
      return c.json({ error: 'Order not found' }, 404);
    }

    // Block cancellation if order is already DELIVERED
    if (status === 'CANCELLED' && existingOrder.status === 'DELIVERED') {
      return c.json({ error: 'Cannot cancel a delivered order' }, 400);
    }

    // Block cancellation if already cancelled
    if (status === 'CANCELLED' && existingOrder.status === 'CANCELLED') {
      return c.json({ error: 'Order is already cancelled' }, 400);
    }

    // If cancelling, issue refund and restore stock
    if (status === 'CANCELLED') {
      await refundOrder(existingOrder);
      for (const item of existingOrder.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
            soldCount: { decrement: item.quantity }
          }
        });
      }
    }

    // Update order status
    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        },
        items: {
          include: {
            product: true
          }
        }
      }
    });

    return c.json({ order, message: 'Order status updated successfully' });

  } catch (error) {
    console.error('Update order status error:', error);
    return c.json({ error: 'Failed to update order status', message: error.message }, 500);
  }
});

// PATCH /api/v1/admin/orders/:id/status - Update order status (admin only) - alternative method
app.patch('/api/v1/admin/orders/:id/status', authMiddleware, requireRole('ADMIN'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const { status } = body;

    if (!status) {
      return c.json({ error: 'Status is required' }, 400);
    }

    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return c.json({ error: 'Invalid status' }, 400);
    }

    // Check if order exists with items
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existingOrder) {
      return c.json({ error: 'Order not found' }, 404);
    }

    // Block cancellation if order is already DELIVERED
    if (status === 'CANCELLED' && existingOrder.status === 'DELIVERED') {
      return c.json({ error: 'Cannot cancel a delivered order' }, 400);
    }

    // Block cancellation if already cancelled
    if (status === 'CANCELLED' && existingOrder.status === 'CANCELLED') {
      return c.json({ error: 'Order is already cancelled' }, 400);
    }

    // If cancelling, issue refund and restore stock
    if (status === 'CANCELLED') {
      await refundOrder(existingOrder);
      for (const item of existingOrder.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
            soldCount: { decrement: item.quantity }
          }
        });
      }
    }

    // Update order status
    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        },
        items: {
          include: {
            product: true
          }
        }
      }
    });

    return c.json({ order, message: 'Order status updated successfully' });

  } catch (error) {
    console.error('Update order status error:', error);
    return c.json({ error: 'Failed to update order status', message: error.message }, 500);
  }
});

// PUT /api/v1/admin/orders/:orderId/items/:itemId - Update order item serial number (admin only)
app.put('/api/v1/admin/orders/:orderId/items/:itemId', authMiddleware, requireRole('ADMIN'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const { orderId, itemId } = c.req.param();
    const body = await c.req.json();
    const { serialNumber } = body;

    // Verify the order item exists and belongs to the order
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: itemId,
        orderId: orderId
      }
    });

    if (!orderItem) {
      return c.json({ error: 'Order item not found' }, 404);
    }

    const updatedItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: { serialNumber: serialNumber || null },
      include: {
        product: true
      }
    });

    return c.json({ item: updatedItem, message: 'Serial number updated successfully' });

  } catch (error) {
    console.error('Update order item serial number error:', error);
    return c.json({ error: 'Failed to update serial number', message: error.message }, 500);
  }
});

// GET /api/v1/admin/users - Get all users (admin only)
app.get('/api/v1/admin/users', authMiddleware, requireRole('ADMIN'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const { page = '1', limit = '20', search, role } = c.req.query();

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter — exclude soft-deleted users
    const where = { deletedAt: null };
    if (role) {
      where.role = role;
    }
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fname: { contains: search, mode: 'insensitive' } },
        { lname: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get users and total count
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fname: true,
          mname: true,
          lname: true,
          role: true,
          status: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { orders: true } },
          studentVerification: {
            select: { id: true, status: true }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    return c.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Get admin users error:', error);
    return c.json({ error: 'Failed to fetch users', message: error.message }, 500);
  }
});

// GET /api/v1/admin/users/:id - Get single user with orders and verification (admin only)
app.get('/api/v1/admin/users/:id', authMiddleware, requireRole('ADMIN'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const { id } = c.req.param();

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fname: true,
        mname: true,
        lname: true,
        role: true,
        status: true,
        emailVerified: true,
        oauthProvider: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          orderBy: { placedAt: 'desc' },
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        },
        studentVerification: {
          include: {
            verifiedBy: {
              select: {
                id: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user });

  } catch (error) {
    console.error('Get admin user error:', error);
    return c.json({ error: 'Failed to fetch user', message: error.message }, 500);
  }
});

// PUT /api/v1/admin/users/:id - Update user (admin only)
app.put('/api/v1/admin/users/:id', authMiddleware, requireRole('ADMIN'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const { email, role, fname, mname, lname, status } = body;

    // Validate the user exists
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Build update data
    const updateData = {};
    if (email !== undefined) updateData.email = email;
    if (fname !== undefined) updateData.fname = fname;
    if (mname !== undefined) updateData.mname = mname;
    if (lname !== undefined) updateData.lname = lname;
    if (role !== undefined) {
      if (!['USER', 'ADMIN', 'SYSTEM'].includes(role)) {
        return c.json({ error: 'Invalid role. Must be USER, ADMIN, or SYSTEM' }, 400);
      }
      updateData.role = role;
    }
    if (status !== undefined) {
      if (!['ACTIVE', 'SUSPENDED', 'PENDING'].includes(status)) {
        return c.json({ error: 'Invalid status. Must be ACTIVE, SUSPENDED, or PENDING' }, 400);
      }
      updateData.status = status;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fname: true,
        mname: true,
        lname: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return c.json({ user: updatedUser });
  } catch (error) {
    console.error('Update admin user error:', error);
    if (error.code === 'P2002') {
      return c.json({ error: 'A user with that email already exists' }, 409);
    }
    return c.json({ error: 'Failed to update user', message: error.message }, 500);
  }
});

// DELETE /api/v1/admin/users/:id - Soft delete user (admin only)
app.delete('/api/v1/admin/users/:id', authMiddleware, requireRole('ADMIN'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const { id } = c.req.param();
    const admin = c.get('user');

    // Prevent self-deletion
    if (id === admin.userId) {
      return c.json({ error: 'You cannot delete your own account' }, 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    if (existingUser.deletedAt) {
      return c.json({ error: 'User is already deleted' }, 400);
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return c.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete admin user error:', error);
    return c.json({ error: 'Failed to delete user', message: error.message }, 500);
  }
});

// GET /api/v1/admin/stats - Get admin statistics
app.get('/api/v1/admin/stats', authMiddleware, requireRole('ADMIN'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    // Get counts and totals in parallel
    const [
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      totalUsers,
      orders
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { active: true } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: { in: ['PENDING', 'PROCESSING'] } } }),
      prisma.user.count(),
      prisma.order.findMany({
        select: {
          totalAmount: true
        }
      })
    ]);

    // Calculate total revenue
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount.toString()), 0);

    return c.json({
      stats: {
        totalProducts,
        activeProducts,
        totalOrders,
        pendingOrders,
        totalRevenue: totalRevenue.toFixed(2),
        totalUsers
      }
    });

  } catch (error) {
    console.error('Get admin stats error:', error);
    return c.json({ error: 'Failed to fetch admin stats', message: error.message }, 500);
  }
});

// ============================================================
// Student Verification Routes
// ============================================================

// POST /api/v1/student/verify - Submit student verification request
app.post('/api/v1/student/verify', authMiddleware, async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { verificationMethod, eduEmail, proofUrl } = body;

    if (!verificationMethod) {
      return c.json({ error: 'Verification method is required' }, 400);
    }

    if (verificationMethod !== 'EDU_EMAIL' && verificationMethod !== 'MANUAL_UPLOAD') {
      return c.json({ error: 'Invalid verification method' }, 400);
    }

    if (verificationMethod === 'EDU_EMAIL') {
      if (!eduEmail) {
        return c.json({ error: 'EDU email is required for EDU_EMAIL verification' }, 400);
      }

      // Check if email ends with .edu
      if (!eduEmail.toLowerCase().endsWith('.edu')) {
        return c.json({ error: 'Email must end with .edu' }, 400);
      }
    }

    if (verificationMethod === 'MANUAL_UPLOAD') {
      if (!proofUrl) {
        return c.json({ error: 'Proof URL is required for MANUAL_UPLOAD verification' }, 400);
      }
    }

    // Check if user already has a verification request
    const existing = await prisma.studentVerification.findUnique({
      where: { userId: user.userId }
    });

    if (existing) {
      if (existing.status === 'PENDING') {
        return c.json({ error: 'You already have a pending verification request' }, 400);
      }

      if (existing.status === 'APPROVED') {
        return c.json({ error: 'You are already verified as a student' }, 400);
      }

      // If rejected, allow resubmission by updating existing record
      const verification = await prisma.studentVerification.update({
        where: { userId: user.userId },
        data: {
          status: 'PENDING',
          verificationMethod,
          eduEmail: verificationMethod === 'EDU_EMAIL' ? eduEmail : null,
          proofUrl: verificationMethod === 'MANUAL_UPLOAD' ? proofUrl : null,
          adminNotes: null,
          verifiedAt: null,
          verifiedById: null
        }
      });

      return c.json({
        verification,
        message: 'Verification request resubmitted successfully'
      }, 201);
    }

    // Create new verification request
    const verification = await prisma.studentVerification.create({
      data: {
        userId: user.userId,
        status: 'PENDING',
        verificationMethod,
        eduEmail: verificationMethod === 'EDU_EMAIL' ? eduEmail : null,
        proofUrl: verificationMethod === 'MANUAL_UPLOAD' ? proofUrl : null
      }
    });

    return c.json({
      verification,
      message: 'Verification request submitted successfully'
    }, 201);

  } catch (error) {
    console.error('Submit verification error:', error);
    return c.json({ error: 'Failed to submit verification', message: error.message }, 500);
  }
});

// GET /api/v1/student/status - Get user's verification status
app.get('/api/v1/student/status', authMiddleware, async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const user = c.get('user');

    const verification = await prisma.studentVerification.findUnique({
      where: { userId: user.userId },
      include: {
        verifiedBy: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    if (!verification) {
      return c.json({
        status: 'NOT_SUBMITTED',
        message: 'No verification request found'
      });
    }

    return c.json({ verification });

  } catch (error) {
    console.error('Get verification status error:', error);
    return c.json({ error: 'Failed to get verification status', message: error.message }, 500);
  }
});

// GET /api/v1/admin/student-verifications - List student verifications (admin only)
app.get('/api/v1/admin/student-verifications', authMiddleware, requireRole('ADMIN'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const { page = '1', limit = '20', status } = c.req.query();

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const where = {};
    if (status) {
      where.status = status;
    }

    // Get verifications and total count
    const [verifications, total] = await Promise.all([
      prisma.studentVerification.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true
            }
          },
          verifiedBy: {
            select: {
              id: true,
              email: true
            }
          }
        }
      }),
      prisma.studentVerification.count({ where })
    ]);

    return c.json({
      verifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Get verifications error:', error);
    return c.json({ error: 'Failed to fetch verifications', message: error.message }, 500);
  }
});

// PUT /api/v1/admin/student-verifications/:id - Approve or reject verification
app.put('/api/v1/admin/student-verifications/:id', authMiddleware, requireRole('ADMIN'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const admin = c.get('user');
    const { id } = c.req.param();
    const body = await c.req.json();
    const { status, adminNotes } = body;

    if (!status) {
      return c.json({ error: 'Status is required' }, 400);
    }

    if (status !== 'APPROVED' && status !== 'REJECTED') {
      return c.json({ error: 'Status must be APPROVED or REJECTED' }, 400);
    }

    // Check if verification exists
    const existingVerification = await prisma.studentVerification.findUnique({
      where: { id }
    });

    if (!existingVerification) {
      return c.json({ error: 'Verification not found' }, 404);
    }

    if (existingVerification.status !== 'PENDING') {
      return c.json({ error: 'Only pending verifications can be updated' }, 400);
    }

    // Update verification
    const verification = await prisma.studentVerification.update({
      where: { id },
      data: {
        status,
        adminNotes,
        verifiedAt: new Date(),
        verifiedById: admin.userId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        },
        verifiedBy: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    return c.json({
      verification,
      message: `Verification ${status.toLowerCase()} successfully`
    });

  } catch (error) {
    console.error('Update verification error:', error);
    return c.json({ error: 'Failed to update verification', message: error.message }, 500);
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

// ============================================================
// Subscription Routes
// ============================================================

// GET /api/v1/subscriptions/plans - Public, no auth
// Pass ?all=true to include inactive plans (for admin)
app.get('/api/v1/subscriptions/plans', async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const showAll = c.req.query('all') === 'true';
    const plans = await prisma.plan.findMany({
      where: showAll ? {} : { active: true },
      orderBy: { sortOrder: 'asc' },
    });
    return c.json({ plans });
  } catch (error) {
    console.error('Failed to fetch plans:', error);
    return c.json({ error: 'Failed to fetch plans' }, 500);
  }
});

// POST /api/v1/subscriptions/from-stripe - Internal webhook secret auth
app.post('/api/v1/subscriptions/from-stripe', async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  const internalSecret = c.req.header('X-Internal-Secret');
  const expectedSecret = process.env.INTERNAL_WEBHOOK_SECRET;

  if (!expectedSecret || internalSecret !== expectedSecret) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json();
    const {
      userId,
      planName,
      stripeSubscriptionId,
      stripeCustomerId,
      status,
      billingPeriod,
      currentPeriodStart,
      currentPeriodEnd,
    } = body;

    if (!userId || !planName) {
      return c.json({ error: 'Missing required fields: userId and planName' }, 400);
    }

    // Verify user exists before creating subscription
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      console.error(`Subscription: user not found for userId=${userId}`);
      return c.json({ error: `User not found: ${userId}` }, 404);
    }

    // Look up Plan by name
    const plan = await prisma.plan.findUnique({ where: { name: planName } });
    if (!plan) {
      return c.json({ error: `Plan not found: ${planName}` }, 404);
    }

    // Upsert UserSubscription by userId (one subscription per user)
    const subscription = await prisma.userSubscription.upsert({
      where: { userId },
      update: {
        planId: plan.id,
        stripeSubscriptionId: stripeSubscriptionId || undefined,
        stripeCustomerId: stripeCustomerId || undefined,
        status: status || 'ACTIVE',
        billingPeriod: billingPeriod || 'monthly',
        currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart) : undefined,
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : undefined,
        canceledAt: status === 'CANCELED' ? new Date() : null,
      },
      create: {
        userId,
        planId: plan.id,
        stripeSubscriptionId: stripeSubscriptionId || null,
        stripeCustomerId: stripeCustomerId || null,
        status: status || 'ACTIVE',
        billingPeriod: billingPeriod || 'monthly',
        currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart) : null,
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : null,
      },
    });

    return c.json({ subscription });
  } catch (error) {
    console.error('Failed to create/update subscription:', error);
    return c.json({ error: error.message || 'Failed to process subscription' }, 500);
  }
});

// POST /api/v1/subscriptions/cancel - JWT auth
app.post('/api/v1/subscriptions/cancel', authMiddleware, async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const user = c.get('user');
    const { stripeSubscriptionId } = await c.req.json();

    if (!stripeSubscriptionId) {
      return c.json({ error: 'Missing stripeSubscriptionId' }, 400);
    }

    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: user.userId },
    });

    if (!subscription || subscription.stripeSubscriptionId !== stripeSubscriptionId) {
      return c.json({ error: 'Subscription not found or does not belong to user' }, 404);
    }

    await prisma.userSubscription.update({
      where: { userId: user.userId },
      data: {
        canceledAt: new Date(),
      },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    return c.json({ error: 'Failed to cancel subscription' }, 500);
  }
});

// GET /api/v1/subscriptions/me - JWT auth
app.get('/api/v1/subscriptions/me', authMiddleware, async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const user = c.get('user');
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: user.userId },
      include: { plan: true },
    });
    return c.json({ subscription });
  } catch (error) {
    console.error('Failed to fetch user subscription:', error);
    return c.json({ error: 'Failed to fetch subscription' }, 500);
  }
});

// PUT /api/v1/subscriptions/plans/:id - Update plan (admin only)
app.put('/api/v1/subscriptions/plans/:id', authMiddleware, requireRole('ADMIN'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const plan = await prisma.plan.update({
      where: { id },
      data: { ...body },
    });
    return c.json({ plan });
  } catch (error) {
    console.error('Failed to update plan:', error);
    return c.json({ error: 'Failed to update plan' }, 500);
  }
});

// POST /api/v1/subscriptions/plans - Create plan (admin only)
app.post('/api/v1/subscriptions/plans', authMiddleware, requireRole('ADMIN'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const body = await c.req.json();
    const plan = await prisma.plan.create({
      data: { ...body },
    });
    return c.json({ plan });
  } catch (error) {
    console.error('Failed to create plan:', error);
    return c.json({ error: 'Failed to create plan' }, 500);
  }
});

// DELETE /api/v1/subscriptions/plans/:id - Delete plan (admin only)
app.delete('/api/v1/subscriptions/plans/:id', authMiddleware, requireRole('ADMIN'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const id = c.req.param('id');
    const activeCount = await prisma.userSubscription.count({
      where: { planId: id, status: { not: 'CANCELED' } },
    });
    if (activeCount > 0) {
      return c.json({ error: 'Cannot delete plan with active subscriptions' }, 400);
    }
    await prisma.plan.delete({ where: { id } });
    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to delete plan:', error);
    return c.json({ error: 'Failed to delete plan' }, 500);
  }
});

// ============================================================
// Admin Subscription Management Routes
// ============================================================

// GET /api/v1/admin/subscriptions - List subscriptions with stats
app.get('/api/v1/admin/subscriptions', authMiddleware, requireRole('ADMIN'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const planFilter = c.req.query('plan');
    const statusFilter = c.req.query('status');
    const billingFilter = c.req.query('billingPeriod');
    const search = c.req.query('search');

    const where = {};

    if (statusFilter && statusFilter !== 'ALL') {
      where.status = statusFilter;
    } else if (!statusFilter) {
      where.status = { not: 'CANCELED' };
    }

    if (planFilter) {
      where.planId = planFilter;
    }

    if (billingFilter) {
      where.billingPeriod = billingFilter;
    }

    if (search) {
      where.user = {
        email: { contains: search, mode: 'insensitive' },
      };
    }

    const [subscriptions, total] = await Promise.all([
      prisma.userSubscription.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, fname: true, lname: true } },
          plan: { select: { id: true, name: true, monthlyPrice: true, annualTotalPrice: true, level: true } },
        },
        orderBy: { plan: { name: 'asc' } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.userSubscription.count({ where }),
    ]);

    const allActive = await prisma.userSubscription.findMany({
      where: { status: { not: 'CANCELED' } },
      include: { plan: { select: { monthlyPrice: true, annualTotalPrice: true } } },
    });

    const totalActive = allActive.filter((s) => s.status === 'ACTIVE').length;
    const totalPastDue = allActive.filter((s) => s.status === 'PAST_DUE').length;

    const mrr = allActive
      .filter((s) => s.status === 'ACTIVE')
      .reduce((sum, s) => {
        if (s.billingPeriod === 'annual') {
          return sum + (s.plan.annualTotalPrice / 12);
        }
        return sum + s.plan.monthlyPrice;
      }, 0);

    const totalByPlan = {};
    for (const s of allActive) {
      totalByPlan[s.planId] = (totalByPlan[s.planId] || 0) + 1;
    }

    const totalByStatus = {};
    for (const s of allActive) {
      totalByStatus[s.status] = (totalByStatus[s.status] || 0) + 1;
    }

    return c.json({
      subscriptions,
      stats: { totalActive, totalPastDue, totalSubscriptions: allActive.length, mrr, totalByPlan, totalByStatus },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Failed to fetch admin subscriptions:', error);
    return c.json({ error: 'Failed to fetch subscriptions' }, 500);
  }
});

// POST /api/v1/admin/subscriptions/:id/cancel - Cancel subscription at period end
app.post('/api/v1/admin/subscriptions/:id/cancel', authMiddleware, requireRole('ADMIN'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const id = c.req.param('id');
    const subscription = await prisma.userSubscription.findUnique({ where: { id } });

    if (!subscription) {
      return c.json({ error: 'Subscription not found' }, 404);
    }

    if (subscription.stripeSubscriptionId && stripe) {
      try {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      } catch (err) {
        if (err.code === 'resource_missing') {
          console.warn(`Stripe subscription ${subscription.stripeSubscriptionId} not found, proceeding with DB update`);
        } else {
          throw err;
        }
      }
    }

    const updated = await prisma.userSubscription.update({
      where: { id },
      data: { canceledAt: new Date() },
      include: {
        user: { select: { id: true, email: true, fname: true, lname: true } },
        plan: { select: { id: true, name: true, monthlyPrice: true, annualTotalPrice: true, level: true } },
      },
    });

    return c.json({ subscription: updated });
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    return c.json({ error: 'Failed to cancel subscription' }, 500);
  }
});

// POST /api/v1/admin/subscriptions/:id/refund - Full or partial refund
app.post('/api/v1/admin/subscriptions/:id/refund', authMiddleware, requireRole('ADMIN'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  if (!stripe) {
    return c.json({ error: 'Stripe not configured' }, 500);
  }

  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const amount = body.amount;

    const subscription = await prisma.userSubscription.findUnique({ where: { id } });

    if (!subscription) {
      return c.json({ error: 'Subscription not found' }, 404);
    }

    if (!subscription.stripeSubscriptionId) {
      return c.json({ error: 'No Stripe subscription associated' }, 400);
    }

    // Retrieve latest paid invoice with expanded payments
    const invoices = await stripe.invoices.list({
      subscription: subscription.stripeSubscriptionId,
      status: 'paid',
      limit: 1,
      expand: ['data.payments'],
    });

    if (!invoices.data.length) {
      return c.json({ error: 'No paid invoices found for this subscription' }, 404);
    }

    const invoice = invoices.data[0];

    // In 2025+ API, payment info is in invoice.payments.data[]
    const payments = invoice.payments && invoice.payments.data;
    let paymentIntent = null;
    let charge = null;

    if (payments && payments.length > 0) {
      const payment = payments[0].payment;
      if (payment) {
        if (payment.type === 'payment_intent') {
          paymentIntent = typeof payment.payment_intent === 'string'
            ? payment.payment_intent
            : (payment.payment_intent && payment.payment_intent.id) || null;
        } else if (payment.type === 'charge') {
          charge = typeof payment.charge === 'string'
            ? payment.charge
            : (payment.charge && payment.charge.id) || null;
        }
      }
    }

    // Fallback: check legacy fields (older API versions)
    if (!paymentIntent && !charge) {
      paymentIntent = invoice.payment_intent
        ? (typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent.id)
        : null;
      charge = invoice.charge
        ? (typeof invoice.charge === 'string' ? invoice.charge : invoice.charge.id)
        : null;
    }

    if (!paymentIntent && !charge) {
      return c.json({ error: 'No payment found on invoice' }, 400);
    }

    const refundParams = paymentIntent
      ? { payment_intent: paymentIntent }
      : { charge: charge };
    if (amount) {
      refundParams.amount = Math.round(amount * 100);
    }

    const refund = await stripe.refunds.create(refundParams);

    return c.json({
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status,
      },
    });
  } catch (error) {
    console.error('Failed to process refund:', error);
    const message = error instanceof Error ? error.message : 'Failed to process refund';
    return c.json({ error: message }, 500);
  }
});

// ============================================================
// Virtual Machine Routes
// ============================================================

// Helper: Proxmox API fetch
const proxmoxFetch = async (path, options = {}) => {
  const https = require('node:https');
  const host = process.env.PROXMOX_HOST;
  const tokenId = process.env.PROXMOX_TOKEN_ID;
  const tokenSecret = process.env.PROXMOX_TOKEN_SECRET;

  if (!host || !tokenId || !tokenSecret) {
    throw new Error('Proxmox environment variables not configured');
  }

  const url = `${host}/api2/json${path}`;
  const method = options.method || 'GET';
  const contentType = options.contentType || 'json';

  let bodyStr;
  let contentTypeHeader;
  if (options.body) {
    if (contentType === 'form') {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(options.body)) {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      }
      bodyStr = params.toString();
      contentTypeHeader = 'application/x-www-form-urlencoded';
    } else {
      bodyStr = JSON.stringify(options.body);
      contentTypeHeader = 'application/json';
    }
  }

  const parsed = new URL(url);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || 8006,
        path: parsed.pathname + parsed.search,
        method,
        headers: {
          Authorization: `PVEAPIToken=${tokenId}=${tokenSecret}`,
          ...(contentTypeHeader ? { 'Content-Type': contentTypeHeader } : {}),
          ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
        },
        rejectUnauthorized: false,
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString();
          if (!res.statusCode || res.statusCode >= 400) {
            reject(new Error(`Proxmox API error ${res.statusCode}: ${raw}`));
            return;
          }
          try {
            const json = JSON.parse(raw);
            resolve(json.data);
          } catch {
            reject(new Error(`Failed to parse Proxmox response: ${raw}`));
          }
        });
      }
    );
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
};

const getProxmoxNode = () => process.env.PROXMOX_NODE || 'pve';
const VM_TEMPLATE_IDS = [11001, 11002];

const parseIpConfig = (ipconfig0) => {
  if (!ipconfig0) return {};
  let ip, gateway;
  const ipMatch = ipconfig0.match(/ip=([^/,\s]+)/);
  if (ipMatch) ip = ipMatch[1];
  const gwMatch = ipconfig0.match(/gw=([^,\s]+)/);
  if (gwMatch) gateway = gwMatch[1];
  return { ip, gateway };
};

// ============================================================
// User-scoped VM endpoints (any authenticated user)
// ============================================================

// GET /api/v1/vms/me - List VMs assigned to the current user
app.get('/api/v1/vms/me', authMiddleware, async (c) => {
  if (!prisma) return c.json({ error: 'Database not available' }, 500);

  try {
    const user = c.get('user');
    const vms = await prisma.virtualMachine.findMany({
      where: { userId: user.userId, deletedAt: null },
      orderBy: { vmid: 'asc' },
    });

    return c.json({
      vms: vms.map((vm) => ({
        id: vm.id,
        vmid: vm.vmid,
        name: vm.name,
        type: vm.type,
        node: vm.node,
        status: vm.status,
        memory: vm.memory,
        cpuCores: vm.cpuCores,
        ipAddress: vm.ipAddress,
        publicIpAddress: vm.publicIpAddress,
        port: vm.port,
        gateway: vm.gateway,
        username: vm.username,
        password: vm.password,
        createdAt: vm.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Failed to fetch user VMs:', error);
    return c.json({ error: 'Failed to fetch VMs' }, 500);
  }
});

// POST /api/v1/vms/me/:vmid/status - Start or stop a VM owned by the current user
app.post('/api/v1/vms/me/:vmid/status', authMiddleware, async (c) => {
  if (!prisma) return c.json({ error: 'Database not available' }, 500);

  try {
    const user = c.get('user');
    const vmid = parseInt(c.req.param('vmid'), 10);
    const { action } = await c.req.json();

    if (action !== 'start' && action !== 'stop') {
      return c.json({ error: 'action must be "start" or "stop"' }, 400);
    }

    // Ownership check
    const vm = await prisma.virtualMachine.findFirst({
      where: { vmid, userId: user.userId, deletedAt: null },
    });
    if (!vm) {
      return c.json({ error: 'VM not found or not assigned to you' }, 404);
    }

    const node = getProxmoxNode();
    await proxmoxFetch(`/nodes/${node}/qemu/${vmid}/status/${action}`, { method: 'POST' });

    // Update status in DB
    await prisma.virtualMachine.update({
      where: { id: vm.id },
      data: { status: action === 'start' ? 'running' : 'stopped' },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to change VM status:', error);
    return c.json({ error: error.message || 'Failed to change VM status' }, 500);
  }
});

// ============================================================
// Admin VM endpoints
// ============================================================

// POST /api/v1/vms/sync - Sync VMs from Proxmox into local DB
app.post('/api/v1/vms/sync', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) return c.json({ error: 'Database not available' }, 500);

  try {
    const node = getProxmoxNode();
    const proxmoxVMs = await proxmoxFetch(`/nodes/${node}/qemu`);
    const activeVMs = proxmoxVMs.filter((vm) => !VM_TEMPLATE_IDS.includes(vm.vmid));

    // Fetch config for each VM in parallel
    const configResults = await Promise.allSettled(
      activeVMs.map((vm) =>
        proxmoxFetch(`/nodes/${node}/qemu/${vm.vmid}/config`)
          .then((config) => ({ vmid: vm.vmid, config }))
      )
    );

    const configMap = new Map();
    for (const result of configResults) {
      if (result.status === 'fulfilled') {
        configMap.set(result.value.vmid, result.value.config);
      }
    }

    // Upsert each VM
    const proxmoxVmIds = new Set();
    for (const vm of activeVMs) {
      proxmoxVmIds.add(vm.vmid);
      const config = configMap.get(vm.vmid);
      const { ip, gateway } = parseIpConfig(config?.ipconfig0);
      const memory = parseInt(config?.memory ?? Math.round(vm.maxmem / (1024 * 1024)), 10) || 2048;
      const cpuCores = parseInt(config?.cores ?? vm.cpus, 10) || 2;

      await prisma.virtualMachine.upsert({
        where: { vmid: vm.vmid },
        update: {
          name: vm.name || `VM ${vm.vmid}`,
          node,
          status: vm.status,
          memory,
          cpuCores,
          ipAddress: ip ?? null,
          gateway: gateway ?? null,
          username: config?.ciuser ?? null,
          password: config?.cipassword ?? null,
          deletedAt: null,
        },
        create: {
          vmid: vm.vmid,
          name: vm.name || `VM ${vm.vmid}`,
          node,
          status: vm.status,
          memory,
          cpuCores,
          ipAddress: ip ?? null,
          gateway: gateway ?? null,
          username: config?.ciuser ?? null,
          password: config?.cipassword ?? null,
        },
      });
    }

    // Soft-delete VMs no longer in Proxmox
    const dbVMs = await prisma.virtualMachine.findMany({
      where: { deletedAt: null },
      select: { vmid: true },
    });

    const missingVmIds = dbVMs
      .filter((dbVm) => !proxmoxVmIds.has(dbVm.vmid))
      .map((dbVm) => dbVm.vmid);

    if (missingVmIds.length > 0) {
      await prisma.virtualMachine.updateMany({
        where: { vmid: { in: missingVmIds } },
        data: { deletedAt: new Date(), status: 'deleted' },
      });
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to sync VMs:', error);
    return c.json({ error: error.message || 'Failed to sync VMs' }, 500);
  }
});

// GET /api/v1/vms - List active VMs from local DB
app.get('/api/v1/vms', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) return c.json({ error: 'Database not available' }, 500);

  try {
    const vms = await prisma.virtualMachine.findMany({
      where: { deletedAt: null },
      orderBy: { vmid: 'asc' },
      include: {
        user: { select: { id: true, email: true, fname: true, lname: true } },
      },
    });

    return c.json({
      vms: vms.map((vm) => ({
        id: vm.id,
        vmid: vm.vmid,
        name: vm.name,
        type: vm.type,
        node: vm.node,
        status: vm.status,
        memory: vm.memory,
        cpuCores: vm.cpuCores,
        ipAddress: vm.ipAddress,
        publicIpAddress: vm.publicIpAddress,
        port: vm.port,
        gateway: vm.gateway,
        username: vm.username,
        password: vm.password,
        userId: vm.userId,
        assignedUser: vm.user
          ? {
              id: vm.user.id,
              email: vm.user.email,
              name: [vm.user.fname, vm.user.lname].filter(Boolean).join(' ') || vm.user.email,
            }
          : null,
        createdAt: vm.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Failed to fetch VMs:', error);
    return c.json({ error: 'Failed to fetch VMs' }, 500);
  }
});

// POST /api/v1/vms/clone - Clone a VM from template
app.post('/api/v1/vms/clone', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) return c.json({ error: 'Database not available' }, 500);

  try {
    const body = await c.req.json();
    const { name, template, storage } = body;

    if (!name || !template || !storage) {
      return c.json({ error: 'name, template, and storage are required' }, 400);
    }

    const templateId = template === 'ubuntu' ? 11001 : 11002;
    const node = getProxmoxNode();

    // Get next VM ID
    const allVMs = await proxmoxFetch(`/nodes/${node}/qemu`);
    const existingIds = allVMs.map((vm) => vm.vmid).filter((id) => !VM_TEMPLATE_IDS.includes(id));
    const newid = existingIds.length === 0 ? 200 : Math.max(...existingIds) + 1;

    const upid = await proxmoxFetch(`/nodes/${node}/qemu/${templateId}/clone`, {
      method: 'POST',
      contentType: 'form',
      body: { newid, name, full: 1, storage },
    });

    // Store VM type in DB
    const vmType = template === 'ubuntu' ? 'Ubuntu' : 'Kali';
    await prisma.virtualMachine.upsert({
      where: { vmid: newid },
      update: { name, type: vmType, node, status: 'stopped', deletedAt: null },
      create: { vmid: newid, name, type: vmType, node, status: 'stopped' },
    });

    return c.json({ upid, newid });
  } catch (error) {
    console.error('Failed to clone VM:', error);
    return c.json({ error: error.message || 'Failed to clone VM' }, 500);
  }
});

// GET /api/v1/vms/tasks/:upid - Get clone task status
app.get('/api/v1/vms/tasks/:upid', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  try {
    const upid = c.req.param('upid');
    const node = getProxmoxNode();
    const encodedUpid = encodeURIComponent(upid);

    const status = await proxmoxFetch(`/nodes/${node}/tasks/${encodedUpid}/status`);
    const log = await proxmoxFetch(`/nodes/${node}/tasks/${encodedUpid}/log`);

    let percentage = 0;
    if (log && Array.isArray(log)) {
      for (const line of log) {
        const match = line.t?.match(/(\d+(?:\.\d+)?)%/);
        if (match) {
          percentage = Math.round(parseFloat(match[1]));
        }
      }
    }

    return c.json({ status: status.status, exitstatus: status.exitstatus, percentage });
  } catch (error) {
    console.error('Failed to get task status:', error);
    return c.json({ error: error.message || 'Failed to get task status' }, 500);
  }
});

// PUT /api/v1/vms/:vmid/config - Configure a VM (cloud-init, resources)
app.put('/api/v1/vms/:vmid/config', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  try {
    const vmid = parseInt(c.req.param('vmid'), 10);
    const body = await c.req.json();
    const node = getProxmoxNode();

    const configBody = {};
    if (body.memory) configBody.memory = body.memory;
    if (body.cores) configBody.cores = body.cores;
    if (body.ciuser) configBody.ciuser = body.ciuser;
    if (body.cipassword) configBody.cipassword = body.cipassword;
    if (body.ipconfig0) configBody.ipconfig0 = body.ipconfig0;

    await proxmoxFetch(`/nodes/${node}/qemu/${vmid}/config`, {
      method: 'PUT',
      contentType: 'form',
      body: configBody,
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to configure VM:', error);
    return c.json({ error: error.message || 'Failed to configure VM' }, 500);
  }
});

// POST /api/v1/vms/:vmid/status - Start or stop a VM
app.post('/api/v1/vms/:vmid/status', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  try {
    const vmid = parseInt(c.req.param('vmid'), 10);
    const { action } = await c.req.json();

    if (action !== 'start' && action !== 'stop') {
      return c.json({ error: 'action must be "start" or "stop"' }, 400);
    }

    const node = getProxmoxNode();
    await proxmoxFetch(`/nodes/${node}/qemu/${vmid}/status/${action}`, { method: 'POST' });

    return c.json({ success: true });
  } catch (error) {
    console.error(`Failed to ${c.req.param('action')} VM:`, error);
    return c.json({ error: error.message || 'Failed to change VM status' }, 500);
  }
});

// PUT /api/v1/vms/:vmid/assign - Assign VM to user and set connection details
app.put('/api/v1/vms/:vmid/assign', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) return c.json({ error: 'Database not available' }, 500);

  try {
    const vmid = parseInt(c.req.param('vmid'), 10);
    const body = await c.req.json();

    const vm = await prisma.virtualMachine.findFirst({
      where: { vmid, deletedAt: null },
    });
    if (!vm) {
      return c.json({ error: 'VM not found' }, 404);
    }

    const data = {};

    // User assignment (userId can be null to unassign)
    if ('userId' in body) {
      if (body.userId) {
        const user = await prisma.user.findUnique({ where: { id: body.userId } });
        if (!user) {
          return c.json({ error: 'User not found' }, 404);
        }
      }
      data.userId = body.userId || null;
    }

    // Connection details
    if ('publicIpAddress' in body) {
      data.publicIpAddress = body.publicIpAddress || null;
    }
    if ('port' in body) {
      data.port = body.port != null ? parseInt(String(body.port), 10) : null;
    }

    await prisma.virtualMachine.update({
      where: { id: vm.id },
      data,
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to update VM assignment:', error);
    return c.json({ error: error.message || 'Failed to update VM' }, 500);
  }
});

// DELETE /api/v1/vms/:vmid - Delete a VM (Proxmox + soft-delete in DB)
app.delete('/api/v1/vms/:vmid', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) return c.json({ error: 'Database not available' }, 500);

  try {
    const vmid = parseInt(c.req.param('vmid'), 10);
    const node = getProxmoxNode();

    // Check if running
    const allVMs = await proxmoxFetch(`/nodes/${node}/qemu`);
    const vm = allVMs.find((v) => v.vmid === vmid);
    if (vm && vm.status === 'running') {
      return c.json({ error: 'Cannot delete a running VM. Stop it first.' }, 400);
    }

    await proxmoxFetch(`/nodes/${node}/qemu/${vmid}`, { method: 'DELETE' });

    // Soft-delete in DB
    await prisma.virtualMachine.updateMany({
      where: { vmid },
      data: { deletedAt: new Date(), status: 'deleted' },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to delete VM:', error);
    return c.json({ error: error.message || 'Failed to delete VM' }, 500);
  }
});

// Export handler for Vercel
const handler = async (req, res) => {
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

// Export both for different use cases
module.exports = handler;  // For Vercel
module.exports.app = app;   // For local development
