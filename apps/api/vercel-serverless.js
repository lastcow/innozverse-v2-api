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

    // Get products and total count
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    return c.json({
      products,
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

    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    return c.json({ product });

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
    const { name, description, basePrice, type, imageUrls, properties, stock = 0, active = true } = body;

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
        active
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
    const { name, description, basePrice, type, imageUrls, properties, stock, active } = body;

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

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      return c.json({ error: 'Order not found' }, 404);
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
