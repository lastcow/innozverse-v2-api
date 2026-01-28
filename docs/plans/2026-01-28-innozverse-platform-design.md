# Innozverse Commerce Platform - Architecture Design

**Date:** 2026-01-28
**Status:** Approved
**Target:** Web + Mobile E-commerce Platform

---

## 1. High-Level Architecture

### Monorepo Structure
```
innozverse-v2/
├── apps/
│   ├── web/              # Next.js 14 (App Router)
│   │   ├── src/app/      # Routes, pages, API routes for NextAuth
│   │   ├── src/components/
│   │   └── src/lib/      # Client utilities
│   ├── api/              # Hono serverless API
│   │   ├── src/routes/   # API endpoints (products, orders, admin)
│   │   ├── src/middleware/
│   │   └── src/docs/     # OpenAPI schema generation
│   └── mobile/           # React Native app (iOS + Android)
│       ├── src/screens/  # Product browse, cart, checkout, profile
│       ├── src/api/      # API client (uses shared types)
│       └── src/navigation/
├── packages/
│   ├── database/         # Prisma schema + client (server-side only)
│   ├── types/            # Shared TS/Zod schemas (web/api/mobile)
│   ├── api-client/       # Typed API client (web + mobile use this)
│   └── config/           # Shared configs (ESLint, TypeScript)
└── docs/
    ├── api/              # API documentation (Markdown guides)
    └── plans/            # Design docs (this file)
```

### Deployment Strategy
- **Web:** Vercel project (`apps/web`) → innozverse.com
- **API:** Vercel project (`apps/api`) → api.innozverse.com
- **Mobile:** TestFlight (iOS) + Google Play Internal Testing
- **Preview Environments:** Each PR creates Vercel preview (web + api) + Neon database branch
- **CI/CD:** GitHub Actions runs tests before merge, auto-deploy on main branch

### Mobile Integration
- Mobile app imports `packages/types` for type safety
- Uses `packages/api-client` (same client as web)
- Authentication via OAuth (Google/GitHub) or email/password
- JWT stored in secure keychain (react-native-keychain)
- Cart syncs automatically across web and mobile via database

---

## 2. Database Schema

### Users
- `id` (UUID), `email` (unique), `password_hash` (nullable for OAuth)
- `role` (enum: ADMIN, SYSTEM, USER)
- `oauth_provider` (enum: LOCAL, GOOGLE, GITHUB, nullable)
- `oauth_id` (string, nullable)
- `email_verified` (boolean), `created_at`, `updated_at`

### StudentVerifications
- `id`, `user_id` (FK to Users)
- `status` (enum: PENDING, APPROVED, REJECTED)
- `verification_method` (enum: EDU_EMAIL, MANUAL_UPLOAD)
- `edu_email` (nullable - auto-verified .edu addresses)
- `proof_url` (nullable - Cloudinary URL for uploaded documents)
- `admin_notes` (text), `verified_at`, `verified_by` (FK to Users)

### Products
- `id`, `name`, `description`, `type` (enum: SURFACE, LAPTOP, XBOX)
- `base_price` (decimal), `stock` (integer), `active` (boolean)
- `properties` (JSONB - stores RAM, processor, color, etc.)
- `image_urls` (JSON array - Cloudinary URLs)
- `created_at`, `updated_at`

### ProductPropertyTemplates
- `id`, `product_type` (enum: SURFACE, LAPTOP, XBOX)
- `schema` (JSONB - defines required/optional fields per type)
- Example: `{"LAPTOP": {"required": ["ram", "processor", "storage"], "optional": ["color", "warranty"]}}`

### Carts (for cross-device sync)
- `id`, `user_id` (FK, nullable for guest carts), `session_id` (for anonymous users)
- `expires_at` (delete old carts after 30 days), `created_at`, `updated_at`

### CartItems
- `id`, `cart_id` (FK), `product_id` (FK), `quantity`, `added_at`

### Orders
- `id`, `user_id` (FK), `status` (enum: PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
- `subtotal`, `discount_amount`, `tax`, `total`, `placed_at`, `updated_at`

### OrderItems
- `id`, `order_id` (FK), `product_id` (FK), `quantity`, `price_at_purchase`
- `product_snapshot` (JSONB - full product data at time of order)

---

## 3. API Architecture

### Authentication Endpoints (NextAuth in `apps/web`)
- `POST /api/auth/register` - Create account
- `POST /api/auth/signin` - Login (email/password or OAuth)
- `POST /api/auth/signout` - Invalidate session
- `GET /api/auth/session` - Get current user + JWT
- `POST /api/auth/refresh` - Refresh access token

### Hono API Routes (`apps/api`)

#### Public Routes
- `GET /api/v1/products` - List products (filter by type, search properties, paginated)
- `GET /api/v1/products/:id` - Get product details

#### Authenticated Routes
- `GET /api/v1/cart` - Get user's cart
- `POST /api/v1/cart/items` - Add item to cart
- `PATCH /api/v1/cart/items/:id` - Update quantity
- `DELETE /api/v1/cart/items/:id` - Remove from cart
- `POST /api/v1/orders` - Create order from cart
- `GET /api/v1/orders` - User's order history
- `GET /api/v1/orders/:id` - Order details
- `POST /api/v1/student-verification` - Submit verification
- `GET /api/v1/student-verification/status` - Check verification status

#### Admin Routes
- `POST /api/v1/admin/products` - Create product
- `PATCH /api/v1/admin/products/:id` - Update product
- `DELETE /api/v1/admin/products/:id` - Soft delete
- `GET /api/v1/admin/student-verifications` - List pending verifications
- `PATCH /api/v1/admin/student-verifications/:id` - Approve/reject
- `GET /api/v1/admin/users` - List users (paginated)
- `PATCH /api/v1/admin/users/:id/role` - Change user role
- `GET /api/v1/admin/orders` - All orders with filters
- `PATCH /api/v1/admin/orders/:id/status` - Update order status
- `GET /api/v1/admin/stats` - Dashboard analytics

### Middleware Chain
1. CORS (allow web + mobile origins)
2. Helmet (security headers)
3. Rate limiting (Upstash Redis) - per endpoint tiers
4. JWT validation (decode + verify signature)
5. Role enforcement (RBAC middleware)
6. Request logging (structured JSON)

### Documentation
- OpenAPI auto-generated from Hono routes
- Interactive Swagger UI at `/api/docs`
- Markdown guides in `docs/api/`

---

## 4. Frontend Architecture

### Web App (`apps/web` - Next.js 14)

#### Key Pages
- `/` - Landing page
- `/products` - Product catalog with filters
- `/products/[id]` - Product detail
- `/cart` - Shopping cart
- `/checkout` - Order confirmation (mocked payment for MVP)
- `/auth/signin` - Login (email/password + Google + GitHub)
- `/auth/signup` - Registration
- `/dashboard` - User dashboard (orders, profile, student verification)
- `/admin` - Admin CMS

#### Tech Stack
- UI: Shadcn/UI + Tailwind CSS
- Forms: React Hook Form + Zod validation
- State: Zustand (cart) + TanStack Query (API data)
- Auth: NextAuth `useSession` hook

### Mobile App (`apps/mobile` - React Native)

#### Key Screens
- HomeScreen, ProductListScreen, ProductDetailScreen
- CartScreen, CheckoutScreen
- AuthScreen (login/signup)
- ProfileScreen, OrderHistoryScreen, OrderDetailScreen

#### Tech Stack
- Navigation: React Navigation v6
- OAuth: expo-auth-session or react-native-app-auth
- Secure storage: react-native-keychain
- Images: React Native Fast Image (Cloudinary)
- State: Zustand + TanStack Query
- API: Shared `packages/api-client`

---

## 5. Authentication & Security

### Authentication Flow
- **Web:** NextAuth handles OAuth + credentials, issues JWT in httpOnly cookie
- **Mobile:** Custom OAuth flow, stores JWT in secure keychain
- **Tokens:** Access tokens (15min), Refresh tokens (7 days)
- **JWT Claims:** `{ userId, email, role, exp }`

### RBAC Implementation
- Hono middleware validates JWT and checks role
- Admin routes require `ADMIN` or `SYSTEM` role
- Users can only access their own orders/cart (resource ownership check)

### Rate Limiting (Upstash Redis)
- Anonymous: 20 req/min
- Authenticated: 100 req/min
- Admin: 500 req/min
- Auth endpoints: 5 req/min (brute force protection)

### Student Verification
- Auto-verify `.edu` email addresses
- Manual upload: Store proof in Cloudinary private folder (signed URLs for admins)
- Once approved: Apply 10% discount automatically at checkout

---

## 6. Testing Strategy

### Unit Tests (Jest)
- Backend: Utilities, middleware, services
- Frontend: Components, hooks, utilities
- Shared: Zod schemas, API client methods

### Integration Tests (Supertest)
- Every API endpoint with real database (Neon branch)
- Validate request/response schemas
- Test authentication, RBAC, business logic
- Cart sync, order creation, student discounts

### E2E Tests (Playwright for Web, Detox for Mobile)
**Critical Flows:**
1. Register → Login → Logout
2. Browse products → Filter → Search
3. Add to cart → Update → Checkout
4. Submit student verification → Auto-approve → Discount applied
5. Place order → View history
6. Admin: Create product → Approve verification

### CI/CD Pipeline (GitHub Actions)
1. Lint + Type check
2. Unit tests
3. Integration tests (Neon preview branch)
4. Build
5. E2E tests (Vercel preview)
6. Deploy (only if all pass)

### Coverage Requirements
- Unit: 80%+ for business logic
- Integration: 100% API endpoint coverage
- E2E: All critical paths covered

---

## 7. Infrastructure & Services

### Hosting & Databases
- **Vercel:** Web + API hosting (preview per PR, auto HTTPS, CDN)
- **Neon:** PostgreSQL (branch per PR, connection pooling)
- **Upstash:** Redis for rate limiting
- **Docker:** Local PostgreSQL + Redis for development

### External Services
- **Cloudinary:** Image storage + optimization (25GB free)
- **Mailgun:** Transactional emails (5k emails/month free)
- **Sentry:** Error tracking (5k errors/month free)
- **NextAuth:** OAuth providers (Google, GitHub)

### Environment Variables
```bash
DATABASE_URL, DATABASE_URL_POOLED
NEXTAUTH_SECRET, NEXTAUTH_URL, JWT_SECRET
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
MAILGUN_API_KEY, MAILGUN_DOMAIN
UPSTASH_REDIS_URL, UPSTASH_REDIS_TOKEN
SENTRY_DSN
API_URL, WEB_URL
```

### Deployment Workflow
1. **PR Pushed:** GitHub Action → Neon branch created → Vercel preview → Tests run
2. **PR Merged:** Auto-deploy to production → Migrations run → Cleanup preview
3. **Mobile Team:** Points app to API preview URL during development

---

## 8. Development Workflow

### Local Setup
```bash
git clone <repo>
cd innozverse-v2
npm install
cp .env.example .env
docker-compose up -d
npm run db:migrate
npm run db:seed
npm run dev  # Turborepo starts all apps
```

### API Documentation
- **OpenAPI:** Interactive Swagger UI at `/api/docs`
- **Markdown:** Guides in `docs/api/` (authentication, products, cart, admin, errors)
- **TypeScript:** Shared types in `packages/types` (contract for mobile team)

### Git Workflow
- `main` branch: Production, auto-deploys
- Feature branches: `feature/...`, `fix/...`
- PR required, 1 approval, tests must pass
- Squash merge for clean history

### Mobile Team Coordination
- API versioning: `/api/v1/...`
- API frozen 2 weeks before mobile launch
- Weekly sync to review API changes
- Shared test fixtures for consistent data

### Pre-commit Hooks (Husky)
- Lint staged files
- Type check
- Run unit tests for changed files

---

## MVP Scope Decisions

**Included:**
- All three auth methods (Google, GitHub, email/password)
- Single subscription tier (no Free/Basic/Pro for MVP)
- Mocked payment flow (no Stripe integration yet)
- Full Admin CMS (products, orders, users, verifications)
- Student verification (auto .edu + manual approval)
- Comprehensive testing (unit, integration, E2E)

**Deferred Post-Mobile Launch:**
- Multi-tier subscriptions
- Stripe payment integration
- Content/blog editing (GitBook handles docs)
- Advanced analytics dashboard
- Email marketing automation

---

## Success Criteria

1. Web app deployed to Vercel with passing E2E tests
2. API deployed with 100% integration test coverage
3. Mobile app in TestFlight/Play Store internal testing
4. All critical flows work across web + mobile
5. OpenAPI docs available for mobile team
6. No critical security vulnerabilities (Sentry monitoring)
7. Student verification flow operational (auto + manual)

---

## Timeline Considerations

- **Mobile launch:** 3 months
- **API stability period:** 2 weeks before mobile launch (no breaking changes)
- **Testing phase:** Comprehensive from day one (API contract tests critical)
- **Documentation:** Updated with every API change

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend (Web) | Next.js 14, Tailwind, Shadcn/UI, NextAuth |
| Frontend (Mobile) | React Native, React Navigation, Expo Auth |
| Backend API | Hono (serverless), Vercel |
| Database | PostgreSQL (Neon), Prisma ORM |
| Cache/Rate Limit | Upstash Redis |
| Images | Cloudinary |
| Email | Mailgun |
| Monitoring | Sentry |
| Testing | Jest, Supertest, Playwright, Detox |
| CI/CD | GitHub Actions, Vercel |
| Monorepo | Turborepo |
| TypeScript | Strict mode with pragmatic exceptions |
