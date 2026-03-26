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
    const { name, description, basePrice, type, imageUrls, properties, stock = 0, active = true, isRefurbished, isOpenBox, studentDiscountPercentage, upc } = body;

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
        isRefurbished: isRefurbished ?? false,
        isOpenBox: isOpenBox ?? false,
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
    const { name, description, basePrice, type, imageUrls, properties, stock, active, isRefurbished, isOpenBox, studentDiscountPercentage, upc } = body;

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
    if (isRefurbished !== undefined) updateData.isRefurbished = isRefurbished;
    if (isOpenBox !== undefined) updateData.isOpenBox = isOpenBox;
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
      include: {
        registrations: { select: { seats: true } },
        _count: { select: { registrations: true } },
        products: { include: { product: { select: { id: true, name: true, basePrice: true, imageUrls: true, type: true } } } },
      }
    });

    return c.json({
      workshops: workshops.map((w) => ({
        ...w,
        totalSeats: w.registrations.reduce((sum, r) => sum + r.seats, 0),
        registrations: undefined,
        products: w.products.map((wp) => ({ ...wp.product, quantity: wp.quantity })),
      })),
    });

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
      orderBy: { createdAt: 'desc' },
      include: {
        registrations: { select: { seats: true } },
        products: { include: { product: { select: { id: true, name: true, basePrice: true, imageUrls: true, type: true } } } },
        _count: { select: { registrations: true } },
      }
    });

    return c.json({
      workshops: workshops.map((w) => ({
        ...w,
        totalSeats: w.registrations.reduce((sum, r) => sum + r.seats, 0),
        registrationCount: w._count.registrations,
        registrations: undefined,
        products: w.products.map((wp) => ({ ...wp.product, quantity: wp.quantity })),
      })),
    });

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
    const { title, description, imageUrls, startDate, endDate, capacity, isPublished = false, products = [] } = body;

    if (!title || !description || !startDate || !endDate) {
      return c.json({ error: 'Missing required fields: title, description, startDate, endDate' }, 400);
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return c.json({ error: 'End date must be after start date' }, 400);
    }

    const workshop = await prisma.$transaction(async (tx) => {
      const w = await tx.workshop.create({
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

      if (products.length > 0) {
        await tx.workshopProduct.createMany({
          data: products.map((p) => ({
            workshopId: w.id,
            productId: p.productId,
            quantity: p.quantity || 1,
          })),
        });
      }

      return w;
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
    const { title, description, imageUrls, startDate, endDate, capacity, isPublished, products } = body;

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

    const workshop = await prisma.$transaction(async (tx) => {
      const w = await tx.workshop.update({
        where: { id },
        data: updateData
      });

      if (products !== undefined) {
        await tx.workshopProduct.deleteMany({ where: { workshopId: id } });
        if (products.length > 0) {
          await tx.workshopProduct.createMany({
            data: products.map((p) => ({
              workshopId: id,
              productId: p.productId,
              quantity: p.quantity || 1,
            })),
          });
        }
      }

      return w;
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
          include: {
            registrations: { select: { seats: true } },
            _count: { select: { registrations: true } },
          },
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
      registered: r.workshop.registrations.reduce((sum, reg) => sum + reg.seats, 0),
      seats: r.seats,
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

    const workshopRaw = await prisma.workshop.findUnique({
      where: { id },
      include: {
        registrations: { select: { seats: true } },
        _count: { select: { registrations: true } },
        products: { include: { product: { select: { id: true, name: true, basePrice: true, imageUrls: true, type: true } } } },
      },
    });

    if (!workshopRaw || !workshopRaw.isPublished) {
      return c.json({ error: 'Workshop not found' }, 404);
    }

    const totalSeats = workshopRaw.registrations.reduce((sum, r) => sum + r.seats, 0);
    const workshop = {
      ...workshopRaw,
      totalSeats,
      registrations: undefined,
      products: workshopRaw.products.map((wp) => ({ ...wp.product, quantity: wp.quantity })),
    };

    let isRegistered = false;
    if (user) {
      try {
        const registration = await prisma.workshopRegistration.findUnique({
          where: { userId_workshopId: { userId: user.userId, workshopId: id } },
        });
        isRegistered = !!registration;
      } catch (regError) {
        console.error('isRegistered check failed (non-fatal):', regError?.message);
        // Non-fatal: workshop still loads, registration status unknown
      }
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

    let body = {};
    try { body = await c.req.json(); } catch {}
    const seats = Math.max(1, Math.floor(Number(body.seats) || 1));
    const mediaConsentGranted = body.mediaConsentGranted !== false; // default true
    const agreementVersion = 'MD-STEM-v1-2026-03-26';
    const agreementAcceptedAt = new Date(); // server-authoritative timestamp
    const agreementIp =
      c.req.header('cf-connecting-ip') ||
      (c.req.header('x-forwarded-for') || '').split(',')[0].trim() ||
      c.req.header('x-real-ip') ||
      'unknown';
    const agreementUserAgent = c.req.header('user-agent') || null;

    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      include: { registrations: { select: { seats: true } } },
    });

    if (!workshop || !workshop.isPublished) {
      return c.json({ error: 'Workshop not found.' }, 404);
    }

    if (new Date(workshop.endDate) < new Date()) {
      return c.json({ error: 'This workshop has already ended.' }, 400);
    }

    const totalSeats = workshop.registrations.reduce((sum, r) => sum + r.seats, 0);
    if (workshop.capacity > 0 && totalSeats + seats > workshop.capacity) {
      return c.json({ error: 'Not enough seats available.' }, 400);
    }

    const existing = await prisma.workshopRegistration.findUnique({
      where: { userId_workshopId: { userId, workshopId } },
    });

    if (existing) {
      return c.json({ error: 'You are already registered for this workshop.' }, 409);
    }

    await prisma.workshopRegistration.create({
      data: {
        userId,
        workshopId,
        seats,
        agreementAcceptedAt,
        agreementVersion,
        agreementIp,
        agreementUserAgent,
        mediaConsentGranted,
      },
    });

    return c.json({
      message: 'Registered successfully',
      agreementVersion,
      agreementAcceptedAt: agreementAcceptedAt.toISOString(),
      mediaConsentGranted,
    }, 201);

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

// PATCH /api/v1/workshops/registrations/:registrationId - Admin: update seats
app.patch('/api/v1/workshops/registrations/:registrationId', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const { registrationId } = c.req.param();
    const body = await c.req.json();
    const seats = Math.max(1, Math.floor(Number(body.seats) || 1));

    const registration = await prisma.workshopRegistration.update({
      where: { id: registrationId },
      data: { seats },
    });

    return c.json({ registration, message: 'Registration updated' });

  } catch (error) {
    console.error('Update registration error:', error);
    return c.json({ error: 'Failed to update registration', message: error.message }, 500);
  }
});

// DELETE /api/v1/workshops/registrations/:registrationId - Admin: cancel registration
app.delete('/api/v1/workshops/registrations/:registrationId', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const { registrationId } = c.req.param();

    await prisma.workshopRegistration.delete({
      where: { id: registrationId },
    });

    return c.json({ message: 'Registration cancelled' });

  } catch (error) {
    console.error('Delete registration error:', error);
    return c.json({ error: 'Failed to cancel registration', message: error.message }, 500);
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
          taxExempt: true,
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
        taxExempt: true,
        stripeCustomerId: true,
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
    const { email, role, fname, mname, lname, status, taxExempt } = body;

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
    if (taxExempt !== undefined) {
      if (typeof taxExempt !== 'boolean') {
        return c.json({ error: 'taxExempt must be a boolean' }, 400);
      }
      updateData.taxExempt = taxExempt;

      // Sync tax_exempt status to Stripe Customer
      const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
      if (STRIPE_SECRET_KEY) {
        const Stripe = require('stripe');
        const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2026-01-28.clover' });
        const stripeExemptStatus = taxExempt ? 'exempt' : 'none';

        if (existingUser.stripeCustomerId) {
          // Update existing Stripe customer
          await stripe.customers.update(existingUser.stripeCustomerId, { tax_exempt: stripeExemptStatus });
        } else if (taxExempt) {
          // Create a new Stripe customer with exempt status and save the ID
          const customer = await stripe.customers.create({
            email: existingUser.email,
            metadata: { userId: existingUser.id },
            tax_exempt: stripeExemptStatus,
          });
          updateData.stripeCustomerId = customer.id;
        }
      }
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
        taxExempt: true,
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

// POST /api/v1/admin/users/:userId/student-verification - Manually verify a user as student
app.post('/api/v1/admin/users/:userId/student-verification', authMiddleware, requireRole('ADMIN'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const admin = c.get('user');
    const { userId } = c.req.param();

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Check for existing verification
    const existing = await prisma.studentVerification.findFirst({
      where: { userId }
    });

    if (existing && existing.status === 'APPROVED') {
      return c.json({ error: 'User is already verified' }, 400);
    }

    let verification;

    if (existing) {
      // Update existing non-approved record
      verification = await prisma.studentVerification.update({
        where: { id: existing.id },
        data: {
          status: 'APPROVED',
          verificationMethod: 'MANUAL_UPLOAD',
          verifiedAt: new Date(),
          verifiedById: admin.userId
        },
        include: {
          user: { select: { id: true, email: true } },
          verifiedBy: { select: { id: true, email: true } }
        }
      });
    } else {
      // Create new approved record
      verification = await prisma.studentVerification.create({
        data: {
          userId,
          status: 'APPROVED',
          verificationMethod: 'MANUAL_UPLOAD',
          verifiedAt: new Date(),
          verifiedById: admin.userId
        },
        include: {
          user: { select: { id: true, email: true } },
          verifiedBy: { select: { id: true, email: true } }
        }
      });
    }

    return c.json({
      verification,
      message: 'User verified as student successfully'
    });

  } catch (error) {
    console.error('Manual student verification error:', error);
    return c.json({ error: 'Failed to verify user', message: error.message }, 500);
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

    // Check existing subscription before upsert (for provisioning logic)
    const existing = await prisma.userSubscription.findUnique({ where: { userId } });

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

    // Auto-provision VMs when subscription becomes ACTIVE
    // Idempotency handled inside provisionVmsForSubscription (skips if VMs already exist)
    const resolvedStatus = status || 'ACTIVE';
    const needsProvisioning = resolvedStatus === 'ACTIVE' && (!existing || existing.status !== 'ACTIVE');

    if (needsProvisioning) {
      try {
        await provisionVmsForSubscription(userId, subscription.id, plan.id);
      } catch (err) {
        console.error('VM provisioning error:', err);
      }
    }

    // Destroy linked VMs when subscription is canceled
    // Await — Vercel serverless kills background tasks after response
    if (resolvedStatus === 'CANCELED') {
      try {
        await destroyVmsForSubscription(subscription.id);
      } catch (err) {
        console.error('VM destruction error:', err);
      }
    }

    return c.json({ subscription });
  } catch (error) {
    console.error('Failed to create/update subscription:', error);
    return c.json({ error: error.message || 'Failed to process subscription' }, 500);
  }
});

// POST /api/v1/subscriptions/reprovision - Internal secret auth
// Destroys old VMs and provisions new ones after a plan change
app.post('/api/v1/subscriptions/reprovision', async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  const internalSecret = c.req.header('X-Internal-Secret');
  const expectedSecret = process.env.INTERNAL_WEBHOOK_SECRET;

  if (!expectedSecret || internalSecret !== expectedSecret) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { userId, newPlanName } = await c.req.json();

    if (!userId || !newPlanName) {
      return c.json({ error: 'Missing required fields: userId and newPlanName' }, 400);
    }

    const subscription = await prisma.userSubscription.findUnique({ where: { userId } });
    if (!subscription) {
      return c.json({ error: 'Subscription not found' }, 404);
    }

    const plan = await prisma.plan.findUnique({ where: { name: newPlanName } });
    if (!plan) {
      return c.json({ error: `Plan not found: ${newPlanName}` }, 404);
    }

    // Destroy existing VMs
    await destroyVmsForSubscription(subscription.id);

    // Update subscription's plan
    await prisma.userSubscription.update({
      where: { userId },
      data: { planId: plan.id },
    });

    // Provision new VMs for the new plan
    await provisionVmsForSubscription(userId, subscription.id, plan.id);

    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to reprovision:', error);
    const message = error instanceof Error ? error.message : 'Failed to reprovision';
    return c.json({ error: message }, 500);
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

// GET /api/v1/users/profile - Get current user's profile (taxExempt + stripeCustomerId for checkout)
app.get('/api/v1/users/profile', authMiddleware, async (c) => {
  if (!prisma) return c.json({ error: 'Database not available' }, 500);
  try {
    const authUser = c.get('user');
    const userId = authUser?.userId || authUser?.sub || authUser?.id;
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        taxExempt: true,
        stripeCustomerId: true,
      }
    });
    if (!user) return c.json({ error: 'User not found' }, 404);
    return c.json({ user });
  } catch (error) {
    console.error('Get user profile error:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
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
          plan: { select: { id: true, name: true, monthlyPrice: true, annualTotalPrice: true, level: true, vmConfig: true } },
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
        plan: { select: { id: true, name: true, monthlyPrice: true, annualTotalPrice: true, level: true, vmConfig: true } },
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

// POST /api/v1/vms - Create a VirtualMachine record in DB (used by provisionVM)
app.post('/api/v1/vms', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) return c.json({ error: 'Database not available' }, 500);
  try {
    const body = await c.req.json();
    const { vmid, name, type, node, status, memory, cpuCores, ipAddress, gateway, username, password, userId, subscriptionId, storage } = body;
    if (!vmid || !name) return c.json({ error: 'vmid and name are required' }, 400);

    const vm = await prisma.virtualMachine.upsert({
      where: { vmid: parseInt(String(vmid), 10) },
      update: {
        name, type: type ?? null, node: node ?? 'pve', status: status ?? 'stopped',
        memory: memory ? parseInt(String(memory), 10) : 2048,
        cpuCores: cpuCores ? parseInt(String(cpuCores), 10) : 2,
        ipAddress: ipAddress ?? null, gateway: gateway ?? null,
        username: username ?? null, password: password ?? null,
        userId: userId ?? null, subscriptionId: subscriptionId ?? null,
        storage: storage ?? null, deletedAt: null,
      },
      create: {
        vmid: parseInt(String(vmid), 10), name, type: type ?? null, node: node ?? 'pve',
        status: status ?? 'stopped',
        memory: memory ? parseInt(String(memory), 10) : 2048,
        cpuCores: cpuCores ? parseInt(String(cpuCores), 10) : 2,
        ipAddress: ipAddress ?? null, gateway: gateway ?? null,
        username: username ?? null, password: password ?? null,
        userId: userId ?? null, subscriptionId: subscriptionId ?? null,
        storage: storage ?? null,
      },
    });

    return c.json({ vm: { id: vm.id, vmid: vm.vmid, name: vm.name, status: vm.status, createdAt: vm.createdAt.toISOString() } }, 201);
  } catch (error) {
    console.error('Failed to create VM record:', error);
    return c.json({ error: error.message || 'Failed to create VM record' }, 500);
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

    // Get VMs currently being provisioned — skip overwriting their config
    const provisioningStatuses = ['provisioning', 'cloning', 'configuring', 'starting'];
    const provisioningVmIds = new Set(
      (await prisma.virtualMachine.findMany({
        where: { status: { in: provisioningStatuses }, deletedAt: null },
        select: { vmid: true },
      })).map((v) => v.vmid)
    );

    // Upsert each VM
    const proxmoxVmIds = new Set();
    for (const vm of activeVMs) {
      proxmoxVmIds.add(vm.vmid);

      // Skip VMs mid-provisioning — their Proxmox state is transient
      if (provisioningVmIds.has(vm.vmid)) continue;

      const config = configMap.get(vm.vmid);
      const { ip, gateway } = parseIpConfig(config?.ipconfig0);
      const memory = parseInt(config?.memory ?? Math.round(vm.maxmem / (1024 * 1024)), 10) || 2048;
      const cpuCores = parseInt(config?.cores ?? vm.cpus, 10) || 2;

      // Don't overwrite username/password on update — Proxmox returns '***' for cipassword
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
        subscription: { include: { plan: { select: { name: true } } } },
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
        subscriptionId: vm.subscriptionId,
        storage: vm.storage,
        assignedUser: vm.user
          ? {
              id: vm.user.id,
              email: vm.user.email,
              name: [vm.user.fname, vm.user.lname].filter(Boolean).join(' ') || vm.user.email,
            }
          : null,
        subscription: vm.subscription
          ? {
              planName: vm.subscription.plan.name,
              status: vm.subscription.status,
              billingPeriod: vm.subscription.billingPeriod,
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

// PATCH /api/v1/vms/:vmid - Update VM status (used by provisioner to track progress)
app.patch('/api/v1/vms/:vmid', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) return c.json({ error: 'Database not available' }, 500);
  try {
    const vmid = parseInt(c.req.param('vmid'), 10);
    const { status } = await c.req.json();
    if (!status) return c.json({ error: 'status is required' }, 400);

    const vm = await prisma.virtualMachine.findFirst({ where: { vmid, deletedAt: null } });
    if (!vm) return c.json({ error: 'VM not found' }, 404);

    await prisma.virtualMachine.update({ where: { id: vm.id }, data: { status } });
    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to update VM status:', error);
    return c.json({ error: error.message || 'Failed to update VM status' }, 500);
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

    // Release IP allocation
    await releaseIpAllocation(vmid);

    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to delete VM:', error);
    return c.json({ error: error.message || 'Failed to delete VM' }, 500);
  }
});

// ============================================================
// Announcement Routes
// ============================================================

// GET /api/v1/announcements/active - Public, no auth
app.get('/api/v1/announcements/active', async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const now = new Date();
    const announcements = await prisma.announcement.findMany({
      where: {
        active: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    });
    return c.json({ announcements });
  } catch (error) {
    console.error('Failed to fetch active announcements:', error);
    return c.json({ error: 'Failed to fetch announcements' }, 500);
  }
});

// GET /api/v1/announcements - Admin only, all announcements
app.get('/api/v1/announcements', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return c.json({ announcements });
  } catch (error) {
    console.error('Failed to fetch announcements:', error);
    return c.json({ error: 'Failed to fetch announcements' }, 500);
  }
});

// POST /api/v1/announcements - Admin only, create
app.post('/api/v1/announcements', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const body = await c.req.json();
    const { title, content, startDate, endDate, active } = body;

    if (!title || !content || !startDate || !endDate) {
      return c.json({ error: 'title, content, startDate, and endDate are required' }, 400);
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        active: active ?? true,
      },
    });
    return c.json({ announcement }, 201);
  } catch (error) {
    console.error('Failed to create announcement:', error);
    return c.json({ error: 'Failed to create announcement' }, 500);
  }
});

// PUT /api/v1/announcements/:id - Admin only, update
app.put('/api/v1/announcements/:id', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { title, content, startDate, endDate, active } = body;

    const data = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (startDate !== undefined) data.startDate = new Date(startDate);
    if (endDate !== undefined) data.endDate = new Date(endDate);
    if (active !== undefined) data.active = active;

    const announcement = await prisma.announcement.update({
      where: { id },
      data,
    });
    return c.json({ announcement });
  } catch (error) {
    console.error('Failed to update announcement:', error);
    return c.json({ error: 'Failed to update announcement' }, 500);
  }
});

// DELETE /api/v1/announcements/:id - Admin only, hard delete
app.delete('/api/v1/announcements/:id', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) {
    return c.json({ error: 'Database not available' }, 500);
  }

  try {
    const id = c.req.param('id');
    await prisma.announcement.delete({ where: { id } });
    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to delete announcement:', error);
    return c.json({ error: 'Failed to delete announcement' }, 500);
  }
});

// ============================================================
// Storage Routes
// ============================================================

// POST /api/v1/storage/sync - Sync storage pools from Proxmox
app.post('/api/v1/storage/sync', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) return c.json({ error: 'Database not available' }, 500);
  try {
    const node = getProxmoxNode();
    const pools = await proxmoxFetch(`/nodes/${node}/storage?content=images`);

    for (const pool of pools) {
      let status;
      try {
        status = await proxmoxFetch(`/nodes/${node}/storage/${pool.storage}/status`);
      } catch {
        console.warn(`Failed to get status for storage ${pool.storage}, skipping`);
        continue;
      }

      await prisma.storage.upsert({
        where: { name: pool.storage },
        update: {
          node,
          type: status.type || pool.type,
          totalBytes: BigInt(status.total || 0),
          usedBytes: BigInt(status.used || 0),
          availBytes: BigInt(status.avail || 0),
          active: pool.active === 1,
        },
        create: {
          name: pool.storage,
          node,
          type: status.type || pool.type,
          totalBytes: BigInt(status.total || 0),
          usedBytes: BigInt(status.used || 0),
          availBytes: BigInt(status.avail || 0),
          active: pool.active === 1,
          vmable: false,
        },
      });
    }

    const storages = await prisma.storage.findMany({ orderBy: { name: 'asc' } });
    return c.json({ success: true, storages: storages.map(serializeStorage) });
  } catch (error) {
    console.error('Failed to sync storage:', error);
    return c.json({ error: error.message || 'Failed to sync storage' }, 500);
  }
});

// GET /api/v1/storage - List all storage pools
app.get('/api/v1/storage', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) return c.json({ error: 'Database not available' }, 500);
  try {
    const storages = await prisma.storage.findMany({ orderBy: { name: 'asc' } });
    return c.json({ storages: storages.map(serializeStorage) });
  } catch (error) {
    console.error('Failed to fetch storage:', error);
    return c.json({ error: 'Failed to fetch storage' }, 500);
  }
});

// PUT /api/v1/storage/:id - Update storage (toggle vmable, active)
app.put('/api/v1/storage/:id', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) return c.json({ error: 'Database not available' }, 500);
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const data = {};
    if ('vmable' in body) data.vmable = !!body.vmable;
    if ('active' in body) data.active = !!body.active;

    const storage = await prisma.storage.update({ where: { id }, data });
    return c.json({ storage: serializeStorage(storage) });
  } catch (error) {
    console.error('Failed to update storage:', error);
    return c.json({ error: 'Failed to update storage' }, 500);
  }
});

function serializeStorage(s) {
  return {
    id: s.id,
    name: s.name,
    node: s.node,
    type: s.type,
    totalBytes: s.totalBytes.toString(),
    usedBytes: s.usedBytes.toString(),
    availBytes: s.availBytes.toString(),
    active: s.active,
    vmable: s.vmable,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

// ============================================================
// VM Template Management
// ============================================================

// GET /api/v1/vm-templates
app.get('/api/v1/vm-templates', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) return c.json({ error: 'Database not available' }, 500);
  try {
    const osType = c.req.query('osType');
    const activeParam = c.req.query('active');
    const where = {};
    if (osType) where.osType = osType;
    if (activeParam !== undefined) where.active = activeParam === 'true';

    const templates = await prisma.vmTemplate.findMany({ where, orderBy: { createdAt: 'desc' } });
    return c.json({
      templates: templates.map((t) => ({
        id: t.id, vmid: t.vmid, osType: t.osType, name: t.name, active: t.active,
        createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Failed to fetch VM templates:', error);
    return c.json({ error: 'Failed to fetch VM templates' }, 500);
  }
});

// POST /api/v1/vm-templates
app.post('/api/v1/vm-templates', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) return c.json({ error: 'Database not available' }, 500);
  try {
    const body = await c.req.json();
    const { vmid, osType, name, active } = body;
    if (!vmid || !osType || !name) return c.json({ error: 'vmid, osType, and name are required' }, 400);

    const template = await prisma.vmTemplate.create({
      data: { vmid: parseInt(String(vmid), 10), osType, name, active: active !== false },
    });
    return c.json({
      template: {
        id: template.id, vmid: template.vmid, osType: template.osType, name: template.name,
        active: template.active, createdAt: template.createdAt.toISOString(), updatedAt: template.updatedAt.toISOString(),
      },
    }, 201);
  } catch (error) {
    console.error('Failed to create VM template:', error);
    return c.json({ error: error.message || 'Failed to create VM template' }, 500);
  }
});

// PUT /api/v1/vm-templates/:id
app.put('/api/v1/vm-templates/:id', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) return c.json({ error: 'Database not available' }, 500);
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const data = {};
    if ('vmid' in body) data.vmid = parseInt(String(body.vmid), 10);
    if ('osType' in body) data.osType = body.osType;
    if ('name' in body) data.name = body.name;
    if ('active' in body) data.active = !!body.active;

    const template = await prisma.vmTemplate.update({ where: { id }, data });
    return c.json({
      template: {
        id: template.id, vmid: template.vmid, osType: template.osType, name: template.name,
        active: template.active, createdAt: template.createdAt.toISOString(), updatedAt: template.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to update VM template:', error);
    return c.json({ error: error.message || 'Failed to update VM template' }, 500);
  }
});

// DELETE /api/v1/vm-templates/:id
app.delete('/api/v1/vm-templates/:id', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) return c.json({ error: 'Database not available' }, 500);
  try {
    const id = c.req.param('id');
    await prisma.vmTemplate.delete({ where: { id } });
    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to delete VM template:', error);
    return c.json({ error: error.message || 'Failed to delete VM template' }, 500);
  }
});

// ============================================================
// IP Pool Management
// ============================================================

function ipToNum(ip) {
  return ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct), 0) >>> 0;
}
function numToIp(num) {
  return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join('.');
}

// GET /api/v1/ip-pool
app.get('/api/v1/ip-pool', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) return c.json({ error: 'Database not available' }, 500);
  try {
    const pools = await prisma.ipPool.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { allocations: true } } },
    });
    return c.json({
      pools: pools.map((p) => ({
        id: p.id, name: p.name, startIp: p.startIp, endIp: p.endIp, cidr: p.cidr,
        gateway: p.gateway, allocationCount: p._count.allocations,
        createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Failed to fetch IP pools:', error);
    return c.json({ error: 'Failed to fetch IP pools' }, 500);
  }
});

// POST /api/v1/ip-pool
app.post('/api/v1/ip-pool', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) return c.json({ error: 'Database not available' }, 500);
  try {
    const body = await c.req.json();
    const { name, startIp, endIp, cidr, gateway } = body;
    if (!name || !startIp || !endIp || !gateway) return c.json({ error: 'name, startIp, endIp, and gateway are required' }, 400);

    const pool = await prisma.ipPool.create({ data: { name, startIp, endIp, cidr: cidr ?? 24, gateway } });
    return c.json({
      pool: {
        id: pool.id, name: pool.name, startIp: pool.startIp, endIp: pool.endIp, cidr: pool.cidr,
        gateway: pool.gateway, allocationCount: 0,
        createdAt: pool.createdAt.toISOString(), updatedAt: pool.updatedAt.toISOString(),
      },
    }, 201);
  } catch (error) {
    console.error('Failed to create IP pool:', error);
    return c.json({ error: error.message || 'Failed to create IP pool' }, 500);
  }
});

// PUT /api/v1/ip-pool/:id
app.put('/api/v1/ip-pool/:id', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) return c.json({ error: 'Database not available' }, 500);
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const data = {};
    if ('name' in body) data.name = body.name;
    if ('startIp' in body) data.startIp = body.startIp;
    if ('endIp' in body) data.endIp = body.endIp;
    if ('cidr' in body) data.cidr = parseInt(String(body.cidr), 10);
    if ('gateway' in body) data.gateway = body.gateway;

    const pool = await prisma.ipPool.update({
      where: { id }, data,
      include: { _count: { select: { allocations: true } } },
    });
    return c.json({
      pool: {
        id: pool.id, name: pool.name, startIp: pool.startIp, endIp: pool.endIp, cidr: pool.cidr,
        gateway: pool.gateway, allocationCount: pool._count.allocations,
        createdAt: pool.createdAt.toISOString(), updatedAt: pool.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to update IP pool:', error);
    return c.json({ error: error.message || 'Failed to update IP pool' }, 500);
  }
});

// DELETE /api/v1/ip-pool/:id
app.delete('/api/v1/ip-pool/:id', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) return c.json({ error: 'Database not available' }, 500);
  try {
    const id = c.req.param('id');
    await prisma.ipPool.delete({ where: { id } });
    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to delete IP pool:', error);
    return c.json({ error: error.message || 'Failed to delete IP pool' }, 500);
  }
});

// GET /api/v1/ip-pool/:id/allocations
app.get('/api/v1/ip-pool/:id/allocations', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) return c.json({ error: 'Database not available' }, 500);
  try {
    const poolId = c.req.param('id');
    const allocations = await prisma.ipAllocation.findMany({
      where: { poolId }, orderBy: { createdAt: 'desc' },
    });
    return c.json({
      allocations: allocations.map((a) => ({
        id: a.id, ipAddress: a.ipAddress, vmid: a.vmid, poolId: a.poolId,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Failed to fetch allocations:', error);
    return c.json({ error: 'Failed to fetch allocations' }, 500);
  }
});

// DELETE /api/v1/ip-pool/allocations/:id
app.delete('/api/v1/ip-pool/allocations/:id', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) return c.json({ error: 'Database not available' }, 500);
  try {
    const id = c.req.param('id');
    await prisma.ipAllocation.delete({ where: { id } });
    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to release allocation:', error);
    return c.json({ error: error.message || 'Failed to release allocation' }, 500);
  }
});

// POST /api/v1/ip-pool/allocate
app.post('/api/v1/ip-pool/allocate', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) return c.json({ error: 'Database not available' }, 500);
  try {
    let poolId;
    try { const body = await c.req.json(); poolId = body.poolId; } catch {}

    const pool = poolId
      ? await prisma.ipPool.findUnique({ where: { id: poolId } })
      : await prisma.ipPool.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!pool) return c.json({ error: 'No IP pool available' }, 404);

    const existing = await prisma.ipAllocation.findMany({
      where: { poolId: pool.id }, select: { ipAddress: true },
    });
    const usedIps = new Set(existing.map((a) => a.ipAddress));

    const startNum = ipToNum(pool.startIp);
    const endNum = ipToNum(pool.endIp);
    let allocatedIp = null;
    for (let num = startNum; num <= endNum; num++) {
      const ip = numToIp(num);
      if (!usedIps.has(ip)) { allocatedIp = ip; break; }
    }
    if (!allocatedIp) return c.json({ error: 'No IPs available in pool' }, 409);

    const allocation = await prisma.ipAllocation.create({
      data: { ipAddress: allocatedIp, poolId: pool.id, vmid: -1 },
    });

    return c.json({ allocationId: allocation.id, ipAddress: allocatedIp, cidr: pool.cidr, gateway: pool.gateway }, 201);
  } catch (error) {
    console.error('Failed to allocate IP:', error);
    return c.json({ error: error.message || 'Failed to allocate IP' }, 500);
  }
});

// PATCH /api/v1/ip-pool/allocations/:id
app.patch('/api/v1/ip-pool/allocations/:id', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) return c.json({ error: 'Database not available' }, 500);
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    if (body.vmid === undefined) return c.json({ error: 'vmid is required' }, 400);

    const allocation = await prisma.ipAllocation.update({
      where: { id }, data: { vmid: parseInt(String(body.vmid), 10) },
    });
    return c.json({
      allocation: {
        id: allocation.id, ipAddress: allocation.ipAddress, vmid: allocation.vmid,
        poolId: allocation.poolId, createdAt: allocation.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to update allocation:', error);
    return c.json({ error: error.message || 'Failed to update allocation' }, 500);
  }
});

// ============================================================
// VM Provisioner (uses provisionVM utility via API calls)
// ============================================================

const crypto = require('crypto');

const FALLBACK_TEMPLATE_IDS = { ubuntu: 11001, kali: 11002 };
const PROVISION_API_URL = process.env.VERCEL
  ? 'https://api.innozverse.com'
  : `http://localhost:${process.env.PORT || '3001'}`;

function generateProvisionUsername() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 8; i++) result += chars[crypto.randomInt(chars.length)];
  return result;
}

function generateProvisionPassword() {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const symbols = '!@#$%^&*';
  const all = upper + lower + digits + symbols;
  let result = '';
  result += upper[crypto.randomInt(upper.length)];
  result += lower[crypto.randomInt(lower.length)];
  result += digits[crypto.randomInt(digits.length)];
  result += symbols[crypto.randomInt(symbols.length)];
  for (let i = 4; i < 16; i++) result += all[crypto.randomInt(all.length)];
  const arr = result.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}

function generateSystemToken() {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
  const jwt = require('jsonwebtoken');
  return jwt.sign({ userId: 'system', email: 'system@internal', role: 'SYSTEM' }, JWT_SECRET, { expiresIn: '10m' });
}

async function apiFetchInternal(path, accessToken, options) {
  const response = await fetch(`${PROVISION_API_URL}${path}`, {
    method: (options && options.method) || 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    ...(options && options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error ${response.status}`);
  }
  return response.json();
}

async function resolveTemplateVmid(osType, accessToken) {
  try {
    const data = await apiFetchInternal(`/api/v1/vm-templates?osType=${encodeURIComponent(osType)}&active=true`, accessToken);
    if (data.templates && data.templates.length > 0) return data.templates[0].vmid;
  } catch (err) {
    console.warn(`Failed to resolve template for osType=${osType} via API:`, err);
  }
  return FALLBACK_TEMPLATE_IDS[osType] || null;
}

/**
 * Provision a single VM using API calls for DB ops + IP pool allocation.
 */
async function provisionSingleVM({ userId, subscriptionId, cloneFrom, cpuCores, memory, storage, vmType, accessToken }) {
  const node = getProxmoxNode();
  let allocationId = null;

  try {
    // 1. Allocate IP from pool
    const ipResult = await apiFetchInternal('/api/v1/ip-pool/allocate', accessToken, { method: 'POST' });
    allocationId = ipResult.allocationId;
    const { ipAddress, cidr, gateway } = ipResult;
    console.log(`Allocated IP ${ipAddress}/${cidr} (allocation: ${allocationId})`);

    // 2. Generate credentials
    const username = generateProvisionUsername();
    const password = generateProvisionPassword();

    // 3. Get next Proxmox VMID and verify it doesn't already exist
    const rawNextId = await proxmoxFetch('/cluster/nextid');
    let newid = parseInt(String(rawNextId), 10);
    const existingVMs = await proxmoxFetch(`/nodes/${node}/qemu`);
    const existingVmids = new Set((existingVMs || []).map(vm => vm.vmid));
    while (existingVmids.has(newid)) {
      console.warn(`VMID ${newid} already exists on Proxmox, trying next`);
      newid++;
    }
    console.log(`Got next VMID: ${newid}`);

    // 4. Update allocation with actual VMID
    await apiFetchInternal(`/api/v1/ip-pool/allocations/${allocationId}`, accessToken, { method: 'PATCH', body: { vmid: newid } });

    // 5. Pick storage and save VM to DB early (status: provisioning)
    const vmName = `vm-${newid}-${userId.slice(0, 8)}`;
    const storageRes = await apiFetchInternal('/api/v1/storage', accessToken);
    const vmableStorage = (storageRes.storages || [])
      .filter(s => s.active && s.vmable)
      .sort((a, b) => Number(b.availBytes) - Number(a.availBytes))[0];
    if (!vmableStorage) throw new Error('No vmable storage available');

    // Save VM record early so UI can show progress
    await apiFetchInternal('/api/v1/vms', accessToken, {
      method: 'POST',
      body: {
        vmid: newid, name: vmName, type: vmType, node, status: 'provisioning',
        memory, cpuCores, ipAddress, gateway, username, password,
        userId, subscriptionId: subscriptionId || null, storage: vmableStorage.name,
      },
    });
    console.log(`VM ${vmName} (vmid=${newid}) record created with status 'provisioning'`);

    // Helper to update VM status
    const updateStatus = async (status) => {
      await apiFetchInternal(`/api/v1/vms/${newid}`, accessToken, { method: 'PATCH', body: { status } });
    };

    try {
      // 6. Clone template
      await updateStatus('cloning');

      const upid = await proxmoxFetch(`/nodes/${node}/qemu/${cloneFrom}/clone`, {
        method: 'POST', contentType: 'form',
        body: { newid, name: vmName, full: 1, storage: vmableStorage.name },
      });
      console.log(`Cloning template ${cloneFrom} -> VM ${newid}, task: ${upid}`);

      const cloneOk = await pollProxmoxTask(node, upid, 300000);
      if (!cloneOk) throw new Error(`Clone task failed for VM ${vmName}`);
      await new Promise(r => setTimeout(r, 2000));

      // 7. Configure VM
      await updateStatus('configuring');

      await proxmoxFetch(`/nodes/${node}/qemu/${newid}/config`, {
        method: 'PUT', contentType: 'form',
        body: { cores: cpuCores, memory, ipconfig0: `ip=${ipAddress}/${cidr},gw=${gateway}`, ciuser: username, cipassword: password },
      });
      console.log(`Configured VM ${newid}: ${cpuCores} cores, ${memory}MB RAM, IP ${ipAddress}`);

      // 8. Resize disk
      await proxmoxFetch(`/nodes/${node}/qemu/${newid}/resize`, {
        method: 'PUT', contentType: 'form',
        body: { disk: 'scsi0', size: `${storage}G` },
      });

      // 9. Start VM
      await updateStatus('starting');

      await proxmoxFetch(`/nodes/${node}/qemu/${newid}/status/start`, { method: 'POST' });

      // 10. Mark as running
      await updateStatus('running');

      console.log(`VM ${vmName} (vmid=${newid}) provisioned successfully`);
      return { vmid: newid, ipAddress, username, password };
    } catch (innerError) {
      // Mark VM as error in DB
      try { await updateStatus('error'); } catch { console.error(`Failed to set error status for VM ${newid}`); }
      throw innerError;
    }
  } catch (error) {
    if (allocationId) {
      try {
        await apiFetchInternal(`/api/v1/ip-pool/allocations/${allocationId}`, accessToken, { method: 'DELETE' });
        console.log(`Released IP allocation ${allocationId} after provisioning failure`);
      } catch { console.error(`Failed to release IP allocation ${allocationId}`); }
    }
    throw error;
  }
}

async function provisionVmsForSubscription(userId, subscriptionId, planId) {
  if (!prisma) return;

  const existing = await prisma.virtualMachine.count({
    where: { subscriptionId, deletedAt: null },
  });
  if (existing > 0) {
    console.log(`VMs already provisioned for subscription ${subscriptionId}, skipping`);
    return;
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) return;

  const vmConfig = plan.vmConfig;
  if (!Array.isArray(vmConfig) || vmConfig.length === 0) return;

  const accessToken = generateSystemToken();

  console.log(`Provisioning ${vmConfig.length} VMs for user ${userId}, plan ${plan.name}`);

  for (let i = 0; i < vmConfig.length; i++) {
    const spec = vmConfig[i];

    try {
      const templateVmid = await resolveTemplateVmid(spec.template, accessToken);
      if (!templateVmid) { console.error(`Unknown template: ${spec.template}`); continue; }

      const vmType = spec.template.charAt(0).toUpperCase() + spec.template.slice(1);

      const result = await provisionSingleVM({
        userId,
        subscriptionId,
        cloneFrom: templateVmid,
        cpuCores: spec.cores,
        memory: spec.memory,
        storage: spec.diskSize || 32,
        vmType,
        accessToken,
      });

      console.log(`VM provisioned for subscription ${subscriptionId}: vmid=${result.vmid}, ip=${result.ipAddress}`);
    } catch (error) {
      console.error(`Failed to provision VM ${i + 1} (${spec.template}):`, error);
    }
  }
}

async function releaseIpAllocation(vmid) {
  if (!prisma) return;
  const result = await prisma.ipAllocation.deleteMany({ where: { vmid } });
  if (result.count > 0) {
    console.log(`Released ${result.count} IP allocation(s) for vmid=${vmid}`);
  }
}

async function destroyVmsForSubscription(subscriptionId) {
  if (!prisma) return;
  const vms = await prisma.virtualMachine.findMany({ where: { subscriptionId, deletedAt: null } });
  if (vms.length === 0) return;

  console.log(`Destroying ${vms.length} VMs for subscription ${subscriptionId}`);
  const node = getProxmoxNode();
  for (const vm of vms) {
    try {
      // 1. Stop VM if running — poll task until complete
      if (vm.status === 'running') {
        try {
          const upid = await proxmoxFetch(`/nodes/${node}/qemu/${vm.vmid}/status/stop`, { method: 'POST' });
          if (upid) {
            const stopped = await pollProxmoxTask(node, upid, 60000);
            if (!stopped) console.warn(`Stop task for VM ${vm.vmid} did not complete in time, attempting delete anyway`);
          }
        } catch (err) {
          console.warn(`Failed to stop VM ${vm.vmid}:`, err);
        }
      }

      // 2. Delete from Proxmox
      try {
        await proxmoxFetch(`/nodes/${node}/qemu/${vm.vmid}`, { method: 'DELETE' });
        console.log(`VM ${vm.name} (vmid=${vm.vmid}) deleted from Proxmox`);
      } catch (err) {
        console.error(`Failed to delete VM ${vm.vmid} from Proxmox:`, err);
      }

      // 3. Soft-delete in DB
      await prisma.virtualMachine.update({ where: { id: vm.id }, data: { deletedAt: new Date(), status: 'deleted' } });

      // 4. Release IP allocation
      await releaseIpAllocation(vm.vmid);

      console.log(`VM ${vm.name} (vmid=${vm.vmid}) destroyed`);
    } catch (error) {
      console.error(`Failed to destroy VM ${vm.name}:`, error);
    }
  }
}

async function pollProxmoxTask(node, upid, timeoutMs) {
  const encoded = encodeURIComponent(upid);
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise(r => setTimeout(r, 3000));
    try {
      const status = await proxmoxFetch(`/nodes/${node}/tasks/${encoded}/status`);
      if (status.status === 'stopped') return status.exitstatus === 'OK';
    } catch {}
  }
  return false;
}

// POST /api/v1/admin/subscriptions/:id/provision - Manually trigger VM provisioning for a subscription
app.post('/api/v1/admin/subscriptions/:id/provision', authMiddleware, requireRole('ADMIN', 'SYSTEM'), async (c) => {
  if (!prisma) return c.json({ error: 'Database not available' }, 500);
  try {
    const id = c.req.param('id');
    const subscription = await prisma.userSubscription.findUnique({ where: { id } });
    if (!subscription) return c.json({ error: 'Subscription not found' }, 404);
    if (subscription.status !== 'ACTIVE') return c.json({ error: 'Subscription is not active' }, 400);

    // Await provisioning — Vercel serverless kills background tasks after response
    try {
      await provisionVmsForSubscription(subscription.userId, subscription.id, subscription.planId);
      return c.json({ success: true, message: 'VM provisioning completed' });
    } catch (err) {
      console.error('VM provisioning error:', err);
      return c.json({ success: true, message: 'VM provisioning started with errors', error: String(err) });
    }
  } catch (error) {
    console.error('Failed to trigger provisioning:', error);
    return c.json({ error: 'Failed to trigger provisioning' }, 500);
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
