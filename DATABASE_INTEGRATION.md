# Database Integration Documentation

## Current State

The application is currently configured with **dual database systems**:

### 1. Prisma ORM (Currently Active)
- **Database**: Local SQLite (`prisma/dev.db`)
- **Usage**: All API routes and server components use Prisma
- **Status**: Working locally but not connected to production database

### 2. Supabase (Configured but Not Active)
- **Database**: PostgreSQL on Supabase (`hqwzkizwysiitzhxbzju.supabase.co`)
- **Environment Variables**: Configured in `.env.local` and Vercel
- **Client Files**: Created (`lib/supabase/client.ts`, `lib/supabase/server.ts`)
- **Middleware**: Created for session handling
- **Status**: Infrastructure ready but API routes still use Prisma

## Why Database Isn't Integrated

The deployment on Vercel runs successfully but **does not connect to the Supabase database** because:

1. **API Routes Use Prisma**: All API routes (`/api/brands`, `/api/products`, `/api/categories`, etc.) import and use `@/lib/prisma` instead of Supabase client.

2. **Prisma Points to Local SQLite**: The `DATABASE_URL` environment variable points to Supabase PostgreSQL, but the Prisma schema is designed for SQLite and hasn't been migrated to PostgreSQL.

3. **No Database Migration**: The Supabase database tables haven't been created. Prisma migrations haven't been run against the Supabase PostgreSQL database.

4. **Dual Configuration**: The application has both Prisma and Supabase clients available, but only Prisma is actively used in the codebase.

## Environment Variables Configuration

### Vercel Environment Variables (Configured)
```bash
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://hqwzkizwysiitzhxbzju.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres.hqwzkizwysiitzhxbzju:Qasim.11@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
NEXTAUTH_SECRET=super-secret-e-commerce-key-change-in-production-12345
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_3Qzm-xVGCMwj0kM7K-J32Q__MOYxO3P
```

### Local Environment Variables (`.env.local`)
Same variables are configured locally for development.

## Integration Options

### Option 1: Keep Prisma with Supabase PostgreSQL (Recommended)

**Advantages:**
- Leverages existing Prisma schema and type safety
- Familiar ORM with excellent TypeScript support
- Minimal code changes required
- Better for complex queries and relations

**Steps Required:**

1. **Update Prisma Schema for PostgreSQL**
   ```prisma
   // prisma/schema.prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

3. **Push Schema to Supabase**
   ```bash
   npx prisma db push
   ```

4. **Seed Database (Optional)**
   ```bash
   npm run seed
   ```

5. **Update Vercel NEXTAUTH_URL**
   ```bash
   NEXTAUTH_URL=https://your-domain.vercel.app
   ```

### Option 2: Migrate to Supabase SDK Directly

**Advantages:**
- Native Supabase integration
- Built-in real-time subscriptions
- Direct access to Supabase features (RLS, Auth, Storage)

**Disadvantages:**
- Requires rewriting all API routes
- Lose Prisma's type safety and query builder
- More complex for complex relations

**Steps Required:**

1. **Create Supabase Tables** using SQL migrations
2. **Replace all Prisma imports** with Supabase client
3. **Rewrite all API routes** to use Supabase queries
4. **Implement RLS policies** for security
5. **Update all server components** to use Supabase

## Recommended Path: Option 1 (Prisma + Supabase PostgreSQL)

### Step-by-Step Implementation

#### 1. Update Prisma Schema
```bash
# Edit prisma/schema.prisma
# Change provider from "sqlite" to "postgresql"
```

#### 2. Install PostgreSQL Dependencies
```bash
npm install pg @types/pg
```

#### 3. Generate Prisma Client
```bash
npx prisma generate
```

#### 4. Push Schema to Supabase
```bash
npx prisma db push
```

#### 5. Test Locally
```bash
npm run dev
```

#### 6. Deploy to Vercel
```bash
git add .
git commit -m "Migrate Prisma to Supabase PostgreSQL"
git push origin main
```

#### 7. Update Vercel Environment Variables
- Set `NEXTAUTH_URL` to your production domain
- Ensure `DATABASE_URL` is set to Supabase PostgreSQL

## Current File Structure

```
lib/
├── prisma.ts              # Prisma client (currently used)
├── supabase/
│   ├── client.ts          # Supabase browser client (created, not used)
│   └── server.ts         # Supabase server client (created, not used)
└── admin-auth.ts          # Uses Prisma for admin auth

middleware.ts              # Supabase session middleware (created)

prisma/
├── schema.prisma         # Prisma schema (SQLite)
├── dev.db                # Local SQLite database
└── seed.ts               # Database seeding script
```

## API Routes Using Prisma

All API routes currently use Prisma:
- `/api/brands` - Brand management
- `/api/products` - Product catalog
- `/api/categories` - Category hierarchy
- `/api/orders` - Order processing
- `/api/reviews` - Review management
- `/api/coupons` - Coupon system
- `/api/deals` - Promotional deals
- `/api/global-forms` - Form configurations
- `/api/contact` - Contact submissions
- `/api/subscribe` - Newsletter subscriptions

## Next Steps

1. **Choose Integration Option**: Decide between Prisma + PostgreSQL or Supabase SDK
2. **Update Configuration**: Modify Prisma schema or create Supabase tables
3. **Run Migrations**: Push schema to Supabase database
4. **Test Locally**: Verify database connection works
5. **Deploy**: Push changes to Vercel
6. **Monitor**: Check Vercel logs for database connection issues

## Troubleshooting

### Common Issues

**Issue**: Prisma connection timeout
- **Solution**: Check Supabase database pooling settings
- **Solution**: Verify DATABASE_URL format includes `?sslmode=require`

**Issue**: Authentication failures
- **Solution**: Ensure NEXTAUTH_SECRET matches between local and production
- **Solution**: Update NEXTAUTH_URL to production domain

**Issue**: Missing tables
- **Solution**: Run `npx prisma db push` to create tables
- **Solution**: Check Supabase dashboard for table creation

## Security Considerations

1. **Never commit** `.env.local` or `.env` files
2. **Use Vercel Environment Variables** for production secrets
3. **Enable RLS policies** on Supabase tables
4. **Rotate service role keys** if compromised
5. **Use read-only replicas** for read-heavy operations

## Performance Optimization

1. **Enable connection pooling** in Supabase
2. **Use Prisma data loader** for N+1 query prevention
3. **Implement caching** for frequently accessed data
4. **Use Supabase Edge Functions** for serverless operations
5. **Monitor query performance** with Supabase dashboard

## Support Resources

- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)
