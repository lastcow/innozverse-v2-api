import { PrismaClient, ProductType, Role, VerificationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.userSubscription.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productPropertyTemplate.deleteMany();
  await prisma.studentVerification.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  console.log('👥 Creating users...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@innozverse.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: Role.ADMIN,
      emailVerified: true,
    },
  });

  const regularUser = await prisma.user.create({
    data: {
      email: 'user@example.com',
      passwordHash: await bcrypt.hash('user123', 10),
      role: Role.USER,
      emailVerified: true,
    },
  });

  const studentUser = await prisma.user.create({
    data: {
      email: 'student@edu.example.com',
      passwordHash: await bcrypt.hash('student123', 10),
      role: Role.USER,
      emailVerified: true,
      studentVerification: {
        create: {
          status: VerificationStatus.APPROVED,
          verificationMethod: 'EDU_EMAIL',
          eduEmail: 'student@edu.example.com',
          verifiedAt: new Date(),
          verifiedById: adminUser.id,
        },
      },
    },
  });

  console.log(`✅ Created ${3} users`);

  // Create property templates
  console.log('📋 Creating property templates...');

  await prisma.productPropertyTemplate.create({
    data: {
      productType: ProductType.LAPTOP,
      schema: {
        processor: { type: 'string', required: true, label: 'Processor' },
        ram: { type: 'string', required: true, label: 'RAM' },
        storage: { type: 'string', required: true, label: 'Storage' },
        display: { type: 'string', required: true, label: 'Display' },
        graphics: { type: 'string', required: false, label: 'Graphics Card' },
        battery: { type: 'string', required: false, label: 'Battery Life' },
        weight: { type: 'string', required: false, label: 'Weight' },
      },
    },
  });

  await prisma.productPropertyTemplate.create({
    data: {
      productType: ProductType.SURFACE,
      schema: {
        processor: { type: 'string', required: true, label: 'Processor' },
        ram: { type: 'string', required: true, label: 'RAM' },
        storage: { type: 'string', required: true, label: 'Storage' },
        display: { type: 'string', required: true, label: 'Display' },
        touchscreen: { type: 'boolean', required: true, label: 'Touchscreen' },
        stylus: { type: 'boolean', required: false, label: 'Includes Stylus' },
        keyboard: { type: 'string', required: false, label: 'Keyboard Type' },
        weight: { type: 'string', required: false, label: 'Weight' },
      },
    },
  });

  await prisma.productPropertyTemplate.create({
    data: {
      productType: ProductType.XBOX,
      schema: {
        storage: { type: 'string', required: true, label: 'Storage' },
        resolution: { type: 'string', required: true, label: 'Max Resolution' },
        fps: { type: 'string', required: true, label: 'Frame Rate' },
        rayTracing: { type: 'boolean', required: false, label: 'Ray Tracing' },
        diskDrive: { type: 'boolean', required: true, label: 'Disc Drive' },
        controllers: { type: 'number', required: false, label: 'Controllers Included' },
      },
    },
  });

  console.log(`✅ Created ${3} property templates`);

  // Create products
  console.log('🛍️ Creating products...');

  await prisma.product.create({
    data: {
      name: 'Surface Pro 9',
      description: 'The most versatile Surface yet, with powerful performance, all-day battery, and optional 5G connectivity. Perfect for students and professionals.',
      type: ProductType.SURFACE,
      basePrice: 999.99,
      stock: 50,
      active: true,
      properties: {
        processor: 'Intel Core i5-1235U',
        ram: '8GB',
        storage: '256GB SSD',
        display: '13" PixelSense (2880x1920)',
        touchscreen: true,
        stylus: false,
        keyboard: 'Type Cover (sold separately)',
        weight: '1.94 lbs',
      },
      imageUrls: [
        '/products/surface-pro-9-1.jpg',
        '/products/surface-pro-9-2.jpg',
      ],
    },
  });

  await prisma.product.create({
    data: {
      name: 'Dell XPS 15',
      description: 'Premium laptop with stunning InfinityEdge display and powerful performance for creators and professionals.',
      type: ProductType.LAPTOP,
      basePrice: 1799.99,
      stock: 30,
      active: true,
      properties: {
        processor: 'Intel Core i7-12700H',
        ram: '16GB DDR5',
        storage: '512GB NVMe SSD',
        display: '15.6" FHD+ (1920x1200)',
        graphics: 'NVIDIA GeForce RTX 3050 Ti',
        battery: 'Up to 13 hours',
        weight: '4.31 lbs',
      },
      imageUrls: [
        '/products/dell-xps-15-1.jpg',
        '/products/dell-xps-15-2.jpg',
      ],
    },
  });

  await prisma.product.create({
    data: {
      name: 'MacBook Pro 14"',
      description: 'Supercharged by M2 Pro or M2 Max chip for exceptional performance and battery life. Perfect for developers and creatives.',
      type: ProductType.LAPTOP,
      basePrice: 1999.99,
      stock: 25,
      active: true,
      properties: {
        processor: 'Apple M2 Pro (10-core)',
        ram: '16GB Unified Memory',
        storage: '512GB SSD',
        display: '14.2" Liquid Retina XDR',
        graphics: 'Integrated 16-core GPU',
        battery: 'Up to 18 hours',
        weight: '3.5 lbs',
      },
      imageUrls: [
        '/products/macbook-pro-14-1.jpg',
        '/products/macbook-pro-14-2.jpg',
      ],
    },
  });

  await prisma.product.create({
    data: {
      name: 'Xbox Series X',
      description: 'The fastest, most powerful Xbox ever. Experience next-gen speed and performance with 4K gaming at up to 120fps.',
      type: ProductType.XBOX,
      basePrice: 499.99,
      stock: 100,
      active: true,
      properties: {
        storage: '1TB NVMe SSD',
        resolution: '4K (3840x2160)',
        fps: 'Up to 120fps',
        rayTracing: true,
        diskDrive: true,
        controllers: 1,
      },
      imageUrls: [
        '/products/xbox-series-x-1.jpg',
        '/products/xbox-series-x-2.jpg',
      ],
    },
  });

  await prisma.product.create({
    data: {
      name: 'Xbox Series S',
      description: 'Next-gen performance in the smallest Xbox ever. Experience digital gaming at 1440p at up to 120fps.',
      type: ProductType.XBOX,
      basePrice: 299.99,
      stock: 150,
      active: true,
      properties: {
        storage: '512GB NVMe SSD',
        resolution: '1440p (2560x1440)',
        fps: 'Up to 120fps',
        rayTracing: true,
        diskDrive: false,
        controllers: 1,
      },
      imageUrls: [
        '/products/xbox-series-s-1.jpg',
        '/products/xbox-series-s-2.jpg',
      ],
    },
  });

  console.log(`✅ Created ${5} products`);

  // Create subscription plans
  console.log('📋 Creating subscription plans...');

  await prisma.plan.create({
    data: {
      name: 'Free',
      level: 0,
      monthlyPrice: 0,
      annualTotalPrice: 0,
      description: 'Free for students only. Verify with a valid .edu email.',
      highlights: [
        '1 Standard Linux VM (1 vCPU, 512MB RAM)',
        '25GB SSD Storage',
        'Community Access',
      ],
      sortOrder: 0,
    },
  });

  await prisma.plan.create({
    data: {
      name: 'Basic',
      level: 1,
      monthlyPrice: 19.99,
      annualTotalPrice: 215.89,
      description: 'Perfect entry point for cybersecurity students.',
      highlights: [
        '1 Standard + 1 Kali VM (2 vCPU, 2GB RAM each)',
        '25GB NVMe/Ubuntu VM, 32GB NVMe/Kali VM',
        'Community Support',
      ],
      sortOrder: 1,
    },
  });

  await prisma.plan.create({
    data: {
      name: 'Pro',
      level: 2,
      monthlyPrice: 29.99,
      annualTotalPrice: 323.89,
      description: 'For serious developers and security professionals.',
      highlights: [
        '2 Standard + 1 Kali VM (2 vCPU, 2GB RAM each)',
        '25GB NVMe/Ubuntu VM, 32GB NVMe/Kali VM',
        'Priority Support',
      ],
      sortOrder: 2,
    },
  });

  await prisma.plan.create({
    data: {
      name: 'Premium',
      level: 3,
      monthlyPrice: 59.99,
      annualTotalPrice: 647.89,
      description: 'The ultimate toolkit for professionals.',
      highlights: [
        '3 Standard + 2 Kali VMs (4 vCPU, 4GB RAM each)',
        '50GB NVMe/Ubuntu VM, 50GB NVMe/Kali VM',
        'Priority + Dedicated Support',
      ],
      sortOrder: 3,
    },
  });

  console.log(`✅ Created ${4} subscription plans`);

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
