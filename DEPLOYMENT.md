# Deployment Guide - Innozverse Platform

This guide covers deploying the Innozverse platform to Vercel.

## Architecture

The platform consists of two separate applications:
- **API**: Hono serverless API (`apps/api`)
- **Web**: Next.js frontend (`apps/web`)

Both will be deployed as separate Vercel projects.

## Prerequisites

1. Vercel account (https://vercel.com)
2. GitHub repository pushed (already done: https://github.com/lastcow/innozverse-v2-api)
3. Neon PostgreSQL database URL

## Deployment Steps

### 1. Deploy the API

#### Via Vercel Dashboard:

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub repository: `lastcow/innozverse-v2-api`
4. Configure the project:
   - **Project Name**: `innozverse-api` (or your preferred name)
   - **Framework Preset**: Other
   - **Root Directory**: Leave as root (monorepo will be detected)
   - **Build Command**: Leave empty or use `echo "API build"`
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

5. Add Environment Variables:
   ```
   DATABASE_URL=your-neon-postgres-url
   JWT_SECRET=your-secure-random-string
   NODE_ENV=production
   NEXT_PUBLIC_WEB_URL=https://your-web-app.vercel.app
   ```

6. Click "Deploy"

7. After deployment, note your API URL (e.g., `https://innozverse-api.vercel.app`)

#### Vercel Configuration:
The API uses the existing `vercel.json` in the root which points to `apps/api/vercel-serverless.js`.

---

### 2. Deploy the Web App

#### Via Vercel Dashboard:

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select the SAME GitHub repository: `lastcow/innozverse-v2-api`
4. Configure the project:
   - **Project Name**: `innozverse-web` (or your preferred name)
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web` (IMPORTANT!)
   - **Build Command**: `npm run build` (will be auto-detected)
   - **Output Directory**: `.next` (will be auto-detected)
   - **Install Command**: `npm install`

5. Add Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://innozverse-api.vercel.app
   NEXTAUTH_URL=https://your-web-app.vercel.app
   NEXTAUTH_SECRET=your-secure-random-string-for-nextauth
   DATABASE_URL=your-neon-postgres-url
   ```

   Optional OAuth (if using Google/GitHub login):
   ```
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   ```

6. Click "Deploy"

---

### 3. Update CORS Settings

After deploying the web app, update the API's `NEXT_PUBLIC_WEB_URL` environment variable:

1. Go to your API project on Vercel
2. Settings → Environment Variables
3. Update `NEXT_PUBLIC_WEB_URL` to your actual web app URL
4. Redeploy the API

---

## Environment Variables Reference

### API Project (`innozverse-api`)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | Secret for JWT token signing | Random 32+ character string |
| `NODE_ENV` | Environment | `production` |
| `NEXT_PUBLIC_WEB_URL` | Web app URL for CORS | `https://innozverse-web.vercel.app` |

### Web Project (`innozverse-web`)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | API endpoint URL | `https://innozverse-api.vercel.app` |
| `NEXTAUTH_URL` | Web app URL | `https://innozverse-web.vercel.app` |
| `NEXTAUTH_SECRET` | NextAuth encryption secret | Random 32+ character string |
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `GOOGLE_CLIENT_ID` | (Optional) Google OAuth | From Google Console |
| `GOOGLE_CLIENT_SECRET` | (Optional) Google OAuth | From Google Console |
| `GITHUB_CLIENT_ID` | (Optional) GitHub OAuth | From GitHub Settings |
| `GITHUB_CLIENT_SECRET` | (Optional) GitHub OAuth | From GitHub Settings |

---

## Generate Secrets

Use these commands to generate secure secrets:

```bash
# For JWT_SECRET
openssl rand -base64 32

# For NEXTAUTH_SECRET
openssl rand -base64 32
```

---

## Post-Deployment Checklist

- [ ] API deployed successfully
- [ ] Web app deployed successfully
- [ ] Database migrations run (Prisma)
- [ ] CORS configured correctly
- [ ] Environment variables set correctly
- [ ] Test API endpoints
- [ ] Test authentication flow
- [ ] Test product browsing
- [ ] Test cart and checkout
- [ ] Test admin dashboard (create admin user first)

---

## Creating an Admin User

After deployment, create an admin user by directly updating the database:

```sql
-- Connect to your Neon database
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

Or use Prisma Studio:
```bash
npx prisma studio
```

---

## Troubleshooting

### API returns 500 errors
- Check DATABASE_URL is set correctly
- Check API logs in Vercel dashboard
- Verify Prisma schema is up to date

### Authentication not working
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your web app URL
- Ensure API URL is correct in web app

### CORS errors
- Update `NEXT_PUBLIC_WEB_URL` in API environment variables
- Redeploy API after updating

### Database connection issues
- Verify DATABASE_URL format
- Check Neon database is accessible
- Run `npx prisma generate` locally to verify schema

---

## Monitoring

- **API Logs**: Vercel Dashboard → innozverse-api → Logs
- **Web Logs**: Vercel Dashboard → innozverse-web → Logs
- **Database**: Neon Dashboard → Your Project → Monitoring

---

## Updating the Application

When you push changes to GitHub:
- Vercel will automatically redeploy both projects
- API redeploys on any push
- Web redeploys on any push

To redeploy manually:
1. Go to Vercel Dashboard
2. Select the project
3. Click "Deployments"
4. Click "..." on latest deployment → "Redeploy"

---

## Custom Domains (Optional)

To use custom domains:

1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as instructed
4. Update environment variables with new domain
5. Redeploy both projects
