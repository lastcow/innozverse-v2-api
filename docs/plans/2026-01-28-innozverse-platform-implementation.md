# Innozverse Commerce Platform Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full-stack e-commerce platform (web + mobile) with product catalog, cart sync, student verification, and admin CMS.

**Architecture:** Turborepo monorepo with Next.js 14 (web), Hono serverless API, React Native (mobile), Prisma + PostgreSQL, NextAuth for authentication, comprehensive testing.

**Tech Stack:** Next.js 14, Hono, React Native, Prisma, PostgreSQL (Neon), NextAuth, Tailwind CSS, Shadcn/UI, TanStack Query, Zustand, Jest, Playwright, Detox

---

## Phase 1: Monorepo Foundation

### Task 1: Initialize Turborepo Structure

**Files:**
- Create: `package.json`
- Create: `turbo.json`
- Create: `.npmrc`
- Create: `apps/.gitkeep`
- Create: `packages/.gitkeep`

**Step 1: Create root package.json**

```json
{
  "name": "innozverse-v2",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "test:e2e": "turbo run test:e2e",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "clean": "turbo run clean && rm -rf node_modules",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\""
  },
  "devDependencies": {
    "turbo": "^1.13.0",
    "prettier": "^3.2.5",
    "@turbo/gen": "^1.13.0"
  },
  "packageManager": "npm@10.5.0",
  "engines": {
    "node": ">=20.0.0"
  }
}
```

**Step 2: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:e2e": {
      "cache": false
    },
    "lint": {
      "outputs": []
    },
    "type-check": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
```

**Step 3: Create .npmrc**

```
enable-pre-post-scripts=true
auto-install-peers=true
strict-peer-dependencies=false
```

**Step 4: Create placeholder directories**

Run: `mkdir -p apps packages`

**Step 5: Install dependencies**

Run: `npm install`
Expected: Turborepo and dependencies installed

**Step 6: Commit**

```bash
git add package.json turbo.json .npmrc
git commit -m "feat: initialize Turborepo monorepo structure

- Set up workspaces for apps and packages
- Configure Turborepo pipeline
- Add npm configuration

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 2: TypeScript Configuration Package

**Files:**
- Create: `packages/config/package.json`
- Create: `packages/config/tsconfig.base.json`
- Create: `packages/config/tsconfig.nextjs.json`
- Create: `packages/config/tsconfig.react-native.json`

**Step 1: Create packages/config/package.json**

```json
{
  "name": "@repo/config",
  "version": "0.0.0",
  "private": true,
  "main": "index.js",
  "files": ["*.json"],
  "devDependencies": {
    "typescript": "^5.4.5"
  }
}
```

**Step 2: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true,
    "forceConsistentCasingInFileNames": true
  },
  "exclude": ["node_modules", "dist", "build", ".next", "coverage"]
}
```

**Step 3: Create tsconfig.nextjs.json**

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Step 4: Create tsconfig.react-native.json**

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2022"],
    "jsx": "react-native",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Step 5: Commit**

```bash
git add packages/config/
git commit -m "feat: add shared TypeScript configurations

- Base config with strict mode enabled
- Next.js specific config with JSX support
- React Native config for mobile app

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 3: ESLint Configuration Package

**Files:**
- Create: `packages/config/eslint-base.js`
- Create: `packages/config/eslint-nextjs.js`
- Create: `packages/config/eslint-react-native.js`
- Modify: `packages/config/package.json`

**Step 1: Update packages/config/package.json**

Add to devDependencies:
```json
"eslint": "^8.57.0",
"@typescript-eslint/parser": "^7.7.1",
"@typescript-eslint/eslint-plugin": "^7.7.1",
"eslint-config-prettier": "^9.1.0",
"eslint-plugin-react": "^7.34.1",
"eslint-plugin-react-hooks": "^4.6.0"
```

**Step 2: Create eslint-base.js**

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
  env: {
    node: true,
    es2022: true,
  },
};
```

**Step 3: Create eslint-nextjs.js**

```javascript
module.exports = {
  extends: [
    './eslint-base.js',
    'next/core-web-vitals',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
```

**Step 4: Create eslint-react-native.js**

```javascript
module.exports = {
  extends: [
    './eslint-base.js',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  env: {
    'react-native/react-native': true,
  },
};
```

**Step 5: Install dependencies**

Run: `npm install` (from root)

**Step 6: Commit**

```bash
git add packages/config/
git commit -m "feat: add shared ESLint configurations

- Base config with TypeScript support
- Next.js config with React rules
- React Native config for mobile

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 2: Database Schema & Prisma Setup

### Task 4: Initialize Prisma Package

**Files:**
- Create: `packages/database/package.json`
- Create: `packages/database/prisma/schema.prisma`
- Create: `packages/database/tsconfig.json`
- Create: `packages/database/src/index.ts`

**Step 1: Create packages/database/package.json**

```json
{
  "name": "@repo/database",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^5.14.0"
  },
  "devDependencies": {
    "prisma": "^5.14.0",
    "tsx": "^4.11.0",
    "typescript": "^5.4.5"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "extends": "@repo/config/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*", "prisma/**/*"]
}
```

**Step 3: Create prisma/schema.prisma (User model)**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
  SYSTEM
}

enum OAuthProvider {
  LOCAL
  GOOGLE
  GITHUB
}

model User {
  id            String         @id @default(uuid())
  email         String         @unique
  passwordHash  String?        @map("password_hash")
  role          Role           @default(USER)
  oauthProvider OAuthProvider? @map("oauth_provider")
  oauthId       String?        @map("oauth_id")
  emailVerified Boolean        @default(false) @map("email_verified")
  createdAt     DateTime       @default(now()) @map("created_at")
  updatedAt     DateTime       @updatedAt @map("updated_at")

  studentVerification StudentVerification?
  carts               Cart[]
  orders              Order[]
  verificationsApproved StudentVerification[] @relation("ApprovedBy")

  @@map("users")
}
```

**Step 4: Create src/index.ts**

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export * from '@prisma/client';
```

**Step 5: Install dependencies**

Run: `npm install` (from root)

**Step 6: Commit**

```bash
git add packages/database/
git commit -m "feat: initialize Prisma database package with User model

- Set up Prisma client with singleton pattern
- Add User model with OAuth support
- Configure TypeScript

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 5: Add Student Verification Schema

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

**Step 1: Add StudentVerification model to schema.prisma**

Add after User model:

```prisma
enum VerificationStatus {
  PENDING
  APPROVED
  REJECTED
}

enum VerificationMethod {
  EDU_EMAIL
  MANUAL_UPLOAD
}

model StudentVerification {
  id                 String             @id @default(uuid())
  userId             String             @unique @map("user_id")
  status             VerificationStatus @default(PENDING)
  verificationMethod VerificationMethod @map("verification_method")
  eduEmail           String?            @map("edu_email")
  proofUrl           String?            @map("proof_url")
  adminNotes         String?            @map("admin_notes") @db.Text
  verifiedAt         DateTime?          @map("verified_at")
  verifiedById       String?            @map("verified_by_id")
  createdAt          DateTime           @default(now()) @map("created_at")
  updatedAt          DateTime           @updatedAt @map("updated_at")

  user       User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  verifiedBy User? @relation("ApprovedBy", fields: [verifiedById], references: [id])

  @@map("student_verifications")
}
```

**Step 2: Commit**

```bash
git add packages/database/prisma/schema.prisma
git commit -m "feat: add StudentVerification model

- Support EDU email auto-verification
- Manual upload with proof documents
- Admin approval workflow

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 6: Add Product Schema

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

**Step 1: Add Product models to schema.prisma**

Add after StudentVerification:

```prisma
enum ProductType {
  SURFACE
  LAPTOP
  XBOX
}

model Product {
  id          String      @id @default(uuid())
  name        String
  description String      @db.Text
  type        ProductType
  basePrice   Decimal     @map("base_price") @db.Decimal(10, 2)
  stock       Int         @default(0)
  active      Boolean     @default(true)
  properties  Json        @default("{}")
  imageUrls   Json        @default("[]") @map("image_urls")
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")

  cartItems  CartItem[]
  orderItems OrderItem[]

  @@map("products")
}

model ProductPropertyTemplate {
  id          String      @id @default(uuid())
  productType ProductType @unique @map("product_type")
  schema      Json
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")

  @@map("product_property_templates")
}
```

**Step 2: Commit**

```bash
git add packages/database/prisma/schema.prisma
git commit -m "feat: add Product and PropertyTemplate models

- JSONB properties for flexible specs (RAM, processor, etc.)
- Product type enum (SURFACE, LAPTOP, XBOX)
- Property templates for admin UI

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 7: Add Cart and Order Schema

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

**Step 1: Add Cart models to schema.prisma**

Add after ProductPropertyTemplate:

```prisma
model Cart {
  id        String    @id @default(uuid())
  userId    String?   @map("user_id")
  sessionId String?   @map("session_id")
  expiresAt DateTime? @map("expires_at")
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  user  User?      @relation(fields: [userId], references: [id], onDelete: Cascade)
  items CartItem[]

  @@index([userId])
  @@index([sessionId])
  @@map("carts")
}

model CartItem {
  id        String   @id @default(uuid())
  cartId    String   @map("cart_id")
  productId String   @map("product_id")
  quantity  Int      @default(1)
  addedAt   DateTime @default(now()) @map("added_at")

  cart    Cart    @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])

  @@unique([cartId, productId])
  @@map("cart_items")
}
```

**Step 2: Add Order models to schema.prisma**

Add after CartItem:

```prisma
enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

model Order {
  id             String      @id @default(uuid())
  userId         String      @map("user_id")
  status         OrderStatus @default(PENDING)
  subtotal       Decimal     @db.Decimal(10, 2)
  discountAmount Decimal     @default(0) @map("discount_amount") @db.Decimal(10, 2)
  tax            Decimal     @default(0) @db.Decimal(10, 2)
  total          Decimal     @db.Decimal(10, 2)
  placedAt       DateTime    @default(now()) @map("placed_at")
  updatedAt      DateTime    @updatedAt @map("updated_at")

  user  User        @relation(fields: [userId], references: [id])
  items OrderItem[]

  @@index([userId])
  @@index([status])
  @@map("orders")
}

model OrderItem {
  id              String   @id @default(uuid())
  orderId         String   @map("order_id")
  productId       String   @map("product_id")
  quantity        Int
  priceAtPurchase Decimal  @map("price_at_purchase") @db.Decimal(10, 2)
  productSnapshot Json     @map("product_snapshot")
  createdAt       DateTime @default(now()) @map("created_at")

  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])

  @@map("order_items")
}
```

**Step 3: Commit**

```bash
git add packages/database/prisma/schema.prisma
git commit -m "feat: add Cart and Order models

- Cart sync across devices (user_id + session_id)
- Order history with status tracking
- Product snapshot for historical pricing

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 8: Create Database Seed Script

**Files:**
- Create: `packages/database/prisma/seed.ts`

**Step 1: Write seed script**

```typescript
import { PrismaClient, ProductType, Role, VerificationStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean database
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.studentVerification.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productPropertyTemplate.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@innozverse.com',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      emailVerified: true,
    },
  });

  const user = await prisma.user.create({
    data: {
      email: 'user@example.com',
      passwordHash: userPassword,
      role: Role.USER,
      emailVerified: true,
    },
  });

  const student = await prisma.user.create({
    data: {
      email: 'student@university.edu',
      passwordHash: userPassword,
      role: Role.USER,
      emailVerified: true,
      studentVerification: {
        create: {
          status: VerificationStatus.APPROVED,
          verificationMethod: 'EDU_EMAIL',
          eduEmail: 'student@university.edu',
          verifiedAt: new Date(),
          verifiedById: admin.id,
        },
      },
    },
  });

  console.log('✅ Users created');

  // Create property templates
  await prisma.productPropertyTemplate.createMany({
    data: [
      {
        productType: ProductType.LAPTOP,
        schema: {
          required: ['ram', 'processor', 'storage'],
          optional: ['color', 'warranty', 'screen_size'],
        },
      },
      {
        productType: ProductType.SURFACE,
        schema: {
          required: ['ram', 'processor', 'storage', 'screen_size'],
          optional: ['color', 'pen_included'],
        },
      },
      {
        productType: ProductType.XBOX,
        schema: {
          required: ['model', 'storage'],
          optional: ['color', 'controllers_included'],
        },
      },
    ],
  });

  console.log('✅ Property templates created');

  // Create products
  await prisma.product.createMany({
    data: [
      {
        name: 'Surface Pro 9',
        description: 'Microsoft Surface Pro 9 - Versatile 2-in-1 laptop/tablet',
        type: ProductType.SURFACE,
        basePrice: 999.99,
        stock: 25,
        properties: {
          ram: '16GB',
          processor: 'Intel Core i5',
          storage: '256GB SSD',
          screen_size: '13 inch',
          color: 'Platinum',
          pen_included: true,
        },
        imageUrls: ['https://via.placeholder.com/400x300?text=Surface+Pro+9'],
      },
      {
        name: 'Dell XPS 15',
        description: 'Dell XPS 15 - Premium laptop for professionals',
        type: ProductType.LAPTOP,
        basePrice: 1499.99,
        stock: 15,
        properties: {
          ram: '32GB',
          processor: 'Intel Core i7',
          storage: '512GB SSD',
          screen_size: '15.6 inch',
          color: 'Silver',
          warranty: '2 years',
        },
        imageUrls: ['https://via.placeholder.com/400x300?text=Dell+XPS+15'],
      },
      {
        name: 'MacBook Pro 14"',
        description: 'Apple MacBook Pro 14-inch with M3 Pro chip',
        type: ProductType.LAPTOP,
        basePrice: 1999.99,
        stock: 10,
        properties: {
          ram: '18GB',
          processor: 'Apple M3 Pro',
          storage: '512GB SSD',
          screen_size: '14.2 inch',
          color: 'Space Black',
          warranty: '1 year',
        },
        imageUrls: ['https://via.placeholder.com/400x300?text=MacBook+Pro+14'],
      },
      {
        name: 'Xbox Series X',
        description: 'Xbox Series X - Most powerful Xbox console',
        type: ProductType.XBOX,
        basePrice: 499.99,
        stock: 50,
        properties: {
          model: 'Series X',
          storage: '1TB SSD',
          color: 'Black',
          controllers_included: 1,
        },
        imageUrls: ['https://via.placeholder.com/400x300?text=Xbox+Series+X'],
      },
      {
        name: 'Xbox Series S',
        description: 'Xbox Series S - Compact next-gen gaming',
        type: ProductType.XBOX,
        basePrice: 299.99,
        stock: 75,
        properties: {
          model: 'Series S',
          storage: '512GB SSD',
          color: 'White',
          controllers_included: 1,
        },
        imageUrls: ['https://via.placeholder.com/400x300?text=Xbox+Series+S'],
      },
    ],
  });

  console.log('✅ Products created');
  console.log('');
  console.log('🎉 Seeding complete!');
  console.log('');
  console.log('📧 Login credentials:');
  console.log('   Admin: admin@innozverse.com / admin123');
  console.log('   User:  user@example.com / user123');
  console.log('   Student: student@university.edu / user123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Step 2: Add bcryptjs to dependencies**

Modify `packages/database/package.json` dependencies:
```json
"bcryptjs": "^2.4.3",
"@types/bcryptjs": "^2.4.6"
```

**Step 3: Install dependencies**

Run: `npm install` (from root)

**Step 4: Commit**

```bash
git add packages/database/
git commit -m "feat: add database seed script

- Creates admin, user, and verified student accounts
- Seeds property templates for all product types
- Adds sample products (Surface, laptops, Xbox)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 9: Create Environment Variables Template

**Files:**
- Create: `.env.example`

**Step 1: Create .env.example**

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/innozverse?schema=public"
DATABASE_URL_POOLED="postgresql://user:password@localhost:5432/innozverse?schema=public&pgbouncer=true"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"

# JWT
JWT_SECRET="your-jwt-secret-here-generate-with-openssl-rand-base64-32"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Mailgun
MAILGUN_API_KEY="your-mailgun-api-key"
MAILGUN_DOMAIN="your-mailgun-domain"

# Upstash Redis
UPSTASH_REDIS_URL="your-upstash-redis-url"
UPSTASH_REDIS_TOKEN="your-upstash-redis-token"

# Sentry
SENTRY_DSN="your-sentry-dsn"

# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WEB_URL="http://localhost:3000"

# Node Environment
NODE_ENV="development"
```

**Step 2: Commit**

```bash
git add .env.example
git commit -m "feat: add environment variables template

- Database connection strings
- Auth provider credentials
- External service configurations

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 3: Shared Packages

### Task 10: Create Shared Types Package

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/src/index.ts`
- Create: `packages/types/src/user.ts`
- Create: `packages/types/src/product.ts`
- Create: `packages/types/src/cart.ts`
- Create: `packages/types/src/order.ts`

**Step 1: Create packages/types/package.json**

```json
{
  "name": "@repo/types",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint .",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "typescript": "^5.4.5"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "extends": "@repo/config/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

**Step 3: Create src/user.ts**

```typescript
import { z } from 'zod';

export const RoleSchema = z.enum(['USER', 'ADMIN', 'SYSTEM']);
export type Role = z.infer<typeof RoleSchema>;

export const OAuthProviderSchema = z.enum(['LOCAL', 'GOOGLE', 'GITHUB']);
export type OAuthProvider = z.infer<typeof OAuthProviderSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: RoleSchema,
  oauthProvider: OAuthProviderSchema.nullable(),
  emailVerified: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type User = z.infer<typeof UserSchema>;

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthResponseSchema = z.object({
  user: UserSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
```

**Step 4: Create src/product.ts**

```typescript
import { z } from 'zod';

export const ProductTypeSchema = z.enum(['SURFACE', 'LAPTOP', 'XBOX']);
export type ProductType = z.infer<typeof ProductTypeSchema>;

export const ProductPropertiesSchema = z.record(z.unknown());
export type ProductProperties = z.infer<typeof ProductPropertiesSchema>;

export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  type: ProductTypeSchema,
  basePrice: z.number().positive(),
  stock: z.number().int().min(0),
  active: z.boolean(),
  properties: ProductPropertiesSchema,
  imageUrls: z.array(z.string().url()),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Product = z.infer<typeof ProductSchema>;

export const CreateProductRequestSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  type: ProductTypeSchema,
  basePrice: z.number().positive(),
  stock: z.number().int().min(0),
  properties: ProductPropertiesSchema,
  imageUrls: z.array(z.string().url()),
});
export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;

export const UpdateProductRequestSchema = CreateProductRequestSchema.partial();
export type UpdateProductRequest = z.infer<typeof UpdateProductRequestSchema>;

export const ProductListQuerySchema = z.object({
  type: ProductTypeSchema.optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
});
export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;
```

**Step 5: Create src/cart.ts**

```typescript
import { z } from 'zod';
import { ProductSchema } from './product';

export const CartItemSchema = z.object({
  id: z.string().uuid(),
  cartId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  addedAt: z.date(),
  product: ProductSchema.optional(),
});
export type CartItem = z.infer<typeof CartItemSchema>;

export const CartSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  sessionId: z.string().nullable(),
  items: z.array(CartItemSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Cart = z.infer<typeof CartSchema>;

export const AddToCartRequestSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
});
export type AddToCartRequest = z.infer<typeof AddToCartRequestSchema>;

export const UpdateCartItemRequestSchema = z.object({
  quantity: z.number().int().positive(),
});
export type UpdateCartItemRequest = z.infer<typeof UpdateCartItemRequestSchema>;
```

**Step 6: Create src/order.ts**

```typescript
import { z } from 'zod';

export const OrderStatusSchema = z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const OrderItemSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  priceAtPurchase: z.number().positive(),
  productSnapshot: z.record(z.unknown()),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  status: OrderStatusSchema,
  subtotal: z.number().positive(),
  discountAmount: z.number().min(0),
  tax: z.number().min(0),
  total: z.number().positive(),
  placedAt: z.date(),
  updatedAt: z.date(),
  items: z.array(OrderItemSchema),
});
export type Order = z.infer<typeof OrderSchema>;

export const CreateOrderRequestSchema = z.object({
  cartId: z.string().uuid(),
});
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;
```

**Step 7: Create src/index.ts**

```typescript
export * from './user';
export * from './product';
export * from './cart';
export * from './order';
```

**Step 8: Install dependencies**

Run: `npm install` (from root)

**Step 9: Commit**

```bash
git add packages/types/
git commit -m "feat: add shared types package with Zod schemas

- User authentication types
- Product CRUD types
- Cart and order types
- Request/response validation schemas

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 11: Create API Client Package

**Files:**
- Create: `packages/api-client/package.json`
- Create: `packages/api-client/tsconfig.json`
- Create: `packages/api-client/src/index.ts`
- Create: `packages/api-client/src/client.ts`
- Create: `packages/api-client/src/products.ts`
- Create: `packages/api-client/src/cart.ts`

**Step 1: Create packages/api-client/package.json**

```json
{
  "name": "@repo/api-client",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint .",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@repo/types": "workspace:*"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "typescript": "^5.4.5"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "extends": "@repo/config/tsconfig.base.json",
  "include": ["src/**/*"]
}
```

**Step 3: Create src/client.ts**

```typescript
export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T; error: null } | { data: null; error: string }> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const json = await response.json();

      if (!response.ok) {
        return { data: null, error: json.error || 'Request failed' };
      }

      return { data: json, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  async get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}
```

**Step 4: Create src/products.ts**

```typescript
import type { Product, ProductListQuery, CreateProductRequest, UpdateProductRequest } from '@repo/types';
import type { ApiClient } from './client';

export class ProductsApi {
  constructor(private client: ApiClient) {}

  async list(query?: ProductListQuery) {
    const params = new URLSearchParams();
    if (query?.type) params.set('type', query.type);
    if (query?.search) params.set('search', query.search);
    if (query?.page) params.set('page', query.page.toString());
    if (query?.limit) params.set('limit', query.limit.toString());

    const queryString = params.toString();
    return this.client.get<{ products: Product[]; total: number }>(
      `/v1/products${queryString ? `?${queryString}` : ''}`
    );
  }

  async get(id: string) {
    return this.client.get<Product>(`/v1/products/${id}`);
  }

  async create(data: CreateProductRequest) {
    return this.client.post<Product>('/v1/admin/products', data);
  }

  async update(id: string, data: UpdateProductRequest) {
    return this.client.patch<Product>(`/v1/admin/products/${id}`, data);
  }

  async delete(id: string) {
    return this.client.delete<{ success: boolean }>(`/v1/admin/products/${id}`);
  }
}
```

**Step 5: Create src/cart.ts**

```typescript
import type { Cart, AddToCartRequest, UpdateCartItemRequest } from '@repo/types';
import type { ApiClient } from './client';

export class CartApi {
  constructor(private client: ApiClient) {}

  async get() {
    return this.client.get<Cart>('/v1/cart');
  }

  async addItem(data: AddToCartRequest) {
    return this.client.post<Cart>('/v1/cart/items', data);
  }

  async updateItem(itemId: string, data: UpdateCartItemRequest) {
    return this.client.patch<Cart>(`/v1/cart/items/${itemId}`, data);
  }

  async removeItem(itemId: string) {
    return this.client.delete<Cart>(`/v1/cart/items/${itemId}`);
  }
}
```

**Step 6: Create src/index.ts**

```typescript
import { ApiClient } from './client';
import { ProductsApi } from './products';
import { CartApi } from './cart';

export function createApiClient(baseUrl: string) {
  const client = new ApiClient(baseUrl);

  return {
    client,
    products: new ProductsApi(client),
    cart: new CartApi(client),
  };
}

export type { ApiClient };
export * from './products';
export * from './cart';
```

**Step 7: Install dependencies**

Run: `npm install` (from root)

**Step 8: Commit**

```bash
git add packages/api-client/
git commit -m "feat: add shared API client package

- Type-safe HTTP client with error handling
- Products API methods
- Cart API methods
- Shared by web and mobile apps

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 4: Hono API Application

### Task 12: Initialize Hono API App

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/.eslintrc.js`
- Create: `apps/api/vercel.json`
- Create: `apps/api/src/index.ts`

**Step 1: Create apps/api/package.json**

```json
{
  "name": "@repo/api",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint .",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  },
  "dependencies": {
    "@repo/database": "workspace:*",
    "@repo/types": "workspace:*",
    "hono": "^4.3.11",
    "@hono/node-server": "^1.11.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^20.12.12",
    "tsx": "^4.11.0",
    "typescript": "^5.4.5",
    "vitest": "^1.6.0"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "extends": "@repo/config/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

**Step 3: Create .eslintrc.js**

```javascript
module.exports = {
  extends: ['@repo/config/eslint-base.js'],
};
```

**Step 4: Create vercel.json**

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": null,
  "outputDirectory": "dist"
}
```

**Step 5: Create src/index.ts**

```typescript
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

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

// Routes (to be added)
app.get('/api/v1', (c) => {
  return c.json({ message: 'Innozverse API v1' });
});

const port = parseInt(process.env.PORT || '3001');
console.log(`🚀 API server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
```

**Step 6: Install dependencies**

Run: `npm install` (from root)

**Step 7: Test the API**

Run: `npm run dev --workspace=@repo/api`
Expected: Server starts on port 3001

Open another terminal:
Run: `curl http://localhost:3001/health`
Expected: `{"status":"ok","timestamp":"..."}`

**Step 8: Stop the server (Ctrl+C)**

**Step 9: Commit**

```bash
git add apps/api/
git commit -m "feat: initialize Hono API application

- Basic Hono server with CORS and logging
- Health check endpoint
- Vercel deployment configuration
- TypeScript and ESLint setup

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 13: Add JWT Middleware

**Files:**
- Create: `apps/api/src/middleware/auth.ts`
- Create: `apps/api/src/types.ts`

**Step 1: Create src/types.ts**

```typescript
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
```

**Step 2: Create src/middleware/auth.ts**

```typescript
import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import jwt from 'jsonwebtoken';
import type { JWTPayload, AuthContext } from '../types';
import type { Role } from '@repo/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    c.set('user', payload);
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
```

**Step 3: Write test for middleware**

Create: `apps/api/src/middleware/auth.test.ts`

```typescript
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
```

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace=@repo/api`
Expected: All tests pass

**Step 5: Commit**

```bash
git add apps/api/src/middleware/ apps/api/src/types.ts
git commit -m "feat: add JWT authentication middleware

- JWT token verification middleware
- Role-based access control (RBAC)
- Comprehensive unit tests

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

Due to length constraints, I'll continue with the remaining critical tasks in a condensed format:

---

## Phase 5: Next.js Web Application (Summary)

**Task 14:** Initialize Next.js app with App Router
**Task 15:** Set up NextAuth with Google/GitHub/Credentials
**Task 16:** Create Shadcn/UI components (Button, Card, Form, etc.)
**Task 17:** Build product catalog page with filters
**Task 18:** Implement shopping cart with Zustand
**Task 19:** Create user dashboard
**Task 20:** Build admin CMS pages

---

## Phase 6: React Native Mobile App (Summary)

**Task 21:** Initialize React Native with Expo
**Task 22:** Set up navigation (React Navigation)
**Task 23:** Implement OAuth authentication
**Task 24:** Create product browsing screens
**Task 25:** Build cart and checkout flow
**Task 26:** Add profile and order history

---

## Phase 7: Integration & Testing

**Task 27:** Write API integration tests (Supertest)
**Task 28:** Write E2E tests for web (Playwright)
**Task 29:** Write E2E tests for mobile (Detox)
**Task 30:** Set up GitHub Actions CI/CD

---

## Phase 8: Deployment

**Task 31:** Configure Neon database production
**Task 32:** Deploy API to Vercel
**Task 33:** Deploy web app to Vercel
**Task 34:** Set up Cloudinary, Mailgun, Upstash, Sentry
**Task 35:** Build mobile apps for TestFlight/Play Store

---

## Success Criteria

- [ ] Web app deployed and accessible
- [ ] API deployed with 100% endpoint coverage tests
- [ ] Mobile app in internal testing
- [ ] All critical flows working (auth, browse, cart, checkout, admin)
- [ ] Student verification operational
- [ ] OpenAPI docs live at /api/docs
- [ ] No critical security vulnerabilities

---

## Notes for Implementation

- Follow TDD strictly: Write test → Run (fail) → Implement → Run (pass) → Commit
- Use @superpowers:executing-plans to run this plan task-by-task
- Or use @superpowers:subagent-driven-development for fresh subagent per task
- Run tests before every commit
- Keep commits small and focused
- Update API documentation with every endpoint change

---

**End of Plan**
