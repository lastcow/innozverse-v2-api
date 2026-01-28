# Innozverse Commerce Platform

A full-stack e-commerce platform built for innovation products and services, featuring student verification for educational discounts.

## 🚀 Features

### Customer Features
- **Product Catalog**: Browse hardware, software, and services with filtering
- **Shopping Cart**: Guest and authenticated cart support
- **Checkout**: Streamlined order placement
- **User Dashboard**: Order history and account management
- **Student Verification**: Submit verification for educational discounts

### Admin Features
- **Dashboard**: Platform statistics and insights
- **Product Management**: Full CRUD operations for products
- **Order Management**: View and update order status
- **CMS**: Content management for products

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **NextAuth.js** - Authentication

### Backend
- **Hono** - Lightweight web framework for serverless
- **Prisma** - Database ORM
- **PostgreSQL** (Neon) - Database
- **JWT** - Token-based authentication

### Infrastructure
- **Vercel** - Deployment platform
- **Turborepo** - Monorepo management
- **npm workspaces** - Package management

## 📁 Project Structure

```
innozverse-v2/
├── apps/
│   ├── api/                    # Hono API (serverless)
│   │   ├── src/
│   │   │   └── index.ts
│   │   └── vercel-serverless.js  # Vercel serverless entry
│   └── web/                    # Next.js frontend
│       ├── src/
│       │   ├── app/           # App router pages
│       │   ├── components/    # React components
│       │   └── hooks/         # Custom hooks
│       └── public/
├── packages/
│   ├── database/              # Prisma schema and client
│   ├── types/                 # Shared TypeScript types
│   └── config/                # Shared configs
├── vercel.json                # API deployment config
└── DEPLOYMENT.md              # Deployment guide
```

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL database (Neon recommended)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/lastcow/innozverse-v2-api.git
cd innozverse-v2
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

**For API** (`apps/api/.env`):
```env
DATABASE_URL=your-neon-postgres-url
JWT_SECRET=your-secure-random-string
```

**For Web** (`apps/web/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
DATABASE_URL=your-neon-postgres-url
```

4. Run database migrations:
```bash
cd packages/database
npx prisma migrate dev
npx prisma db seed  # Optional: seed sample data
```

5. Start development servers:

Terminal 1 (API):
```bash
cd apps/api
npm run dev
```

Terminal 2 (Web):
```bash
cd apps/web
npm run dev
```

6. Open http://localhost:3000 in your browser

### Create Admin User

```bash
cd packages/database
npx prisma studio
```
Update a user's `role` field to `ADMIN`.

## 📦 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

### Quick Deploy to Vercel

1. **Deploy API**:
   - Import repository to Vercel
   - Use root directory
   - Set environment variables
   - Deploy

2. **Deploy Web**:
   - Import SAME repository to Vercel
   - Set root directory to `apps/web`
   - Set environment variables
   - Deploy

## 🔑 Environment Variables

### Required for API
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing
- `NEXT_PUBLIC_WEB_URL` - Web app URL for CORS

### Required for Web
- `NEXT_PUBLIC_API_URL` - API endpoint URL
- `NEXTAUTH_URL` - Web app URL
- `NEXTAUTH_SECRET` - NextAuth encryption secret
- `DATABASE_URL` - PostgreSQL connection string

## 🧪 Testing

```bash
# Run API tests
cd apps/api
npm test

# Run web tests
cd apps/web
npm test
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user

### Product Endpoints
- `GET /api/v1/products` - List products
- `GET /api/v1/products/:id` - Get product details
- `POST /api/v1/products` - Create product (admin)
- `PUT /api/v1/products/:id` - Update product (admin)
- `DELETE /api/v1/products/:id` - Delete product (admin)

### Cart Endpoints
- `GET /api/v1/cart` - Get cart
- `POST /api/v1/cart/items` - Add to cart
- `PUT /api/v1/cart/items/:id` - Update cart item
- `DELETE /api/v1/cart/items/:id` - Remove from cart

### Order Endpoints
- `POST /api/v1/orders` - Place order
- `GET /api/v1/orders` - Get user orders
- `GET /api/v1/orders/:id` - Get order details
- `GET /api/v1/orders/summary` - Get order summary

### Admin Endpoints
- `GET /api/v1/admin/stats` - Platform statistics
- `GET /api/v1/admin/orders` - All orders
- `PATCH /api/v1/admin/orders/:id/status` - Update order status

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Authors

- Development with Claude Code

## 🐛 Known Issues

- OAuth providers (Google, GitHub) require additional setup
- Email verification not yet implemented
- Payment processing is in MVP mode (no actual payments)

## 🗺️ Roadmap

- [ ] Payment gateway integration (Stripe)
- [ ] Email notifications
- [ ] Advanced search and filtering
- [ ] Product reviews and ratings
- [ ] Wishlist functionality
- [ ] Multi-language support
- [ ] Mobile app

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Contact: [Add contact info]

---

Built with ❤️ using Next.js, Hono, and Prisma
