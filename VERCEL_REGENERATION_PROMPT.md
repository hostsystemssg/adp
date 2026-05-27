# Vercel-Compatible B2B Distributor Portal - Regeneration Prompt for AI Studio

## Project Overview
Rebuild this B2B distributor portal for **STRICT VERCEL DEPLOYMENT COMPATIBILITY**. The application must work seamlessly on Vercel's serverless architecture without any modifications post-generation.

---

## ⚠️ CRITICAL VERCEL REQUIREMENTS (NON-NEGOTIABLE)

### 1. **NO Traditional Express Server**
- ❌ DO NOT create `server.ts` with `app.listen()`
- ❌ DO NOT use long-running server processes
- ✅ USE Vercel API Routes (`/api/*` pattern)
- ✅ Export individual handler functions for each endpoint

### 2. **NO File System Database**
- ❌ DO NOT use `fs.readFileSync/writeFileSync` for data persistence
- ❌ DO NOT store data in `db.json` or any local files
- ❌ DO NOT use in-memory storage (data lost on serverless cold start)
- ✅ USE Vercel Postgres (Neon) or Vercel KV for persistent storage
- ✅ Implement proper database connection pooling for serverless

### 3. **NO Path-Based File Operations**
- ❌ DO NOT use `path.join(process.cwd(), ...)` for data storage
- ✅ All file operations must be limited to build-time only

### 4. **Architecture Pattern**
- Frontend: React 19 + Vite 6 (static build → Vercel CDN)
- Backend: Vercel Serverless Functions (API Routes)
- Database: Vercel Postgres or external database (Supabase/PlanetScale)
- Auth: JWT stored in HTTP-only cookies or localStorage

---

## 📁 REQUIRED FILE STRUCTURE FOR VERCEL

```
/
├── api/                          # Vercel API Routes (Serverless Functions)
│   ├── health.ts                 # GET /api/health
│   ├── auth/
│   │   ├── register.ts           # POST /api/auth/register
│   │   ├── login.ts              # POST /api/auth/login
│   │   └── me.ts                 # GET /api/auth/me
│   ├── catalog/
│   │   ├── index.ts              # GET /api/catalog, POST /api/catalog
│   │   └── [id].ts               # GET/PUT/DELETE /api/catalog/:id
│   ├── orders/
│   │   └── index.ts              # POST /api/orders, GET /api/orders
│   └── faq/
│       ├── index.ts              # GET /api/faq, POST /api/faq
│       └── [id].ts               # DELETE /api/faq/:id
├── src/
│   ├── components/               # React components (unchanged)
│   ├── pages/                    # React page components (unchanged)
│   ├── lib/
│   │   ├── jwt.ts                # JWT utilities (keep, but remove fs deps)
│   │   ├── validators.ts         # Zod schemas (unchanged)
│   │   ├── constants.ts          # App constants (unchanged)
│   │   └── consent.ts            # Consent utilities (unchanged)
│   ├── db/
│   │   ├── schema.ts             # Database schema definitions
│   │   └── postgres.ts           # Vercel Postgres client setup
│   ├── App.tsx                   # Main app component
│   └── main.tsx                  # Entry point
├── public/                       # Static assets
├── vercel.json                   # Vercel configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── vite.config.ts                # Vite config (frontend only)
└── .env.example                  # Environment variables template
```

---

## 🔧 TECHNICAL SPECIFICATIONS

### Frontend Stack (Keep Existing)
- React 19.0.1
- Vite 6.2.3
- Tailwind CSS 4.1.14
- React Router DOM 7.15.1
- Lucide React 0.546.0
- Motion 12.23.24
- Recharts 3.8.1

### Backend Stack (MUST CHANGE)
- **Remove:** Express.js, bcryptjs (for server runtime)
- **Add:** 
  - `@vercel/postgres` or `postgres` (Neon driver)
  - `@vercel/kv` (optional, for sessions/cache)
  - `jose` (keep for JWT)
  - `zod` (keep for validation)
  - `bcryptjs` (only for password hashing in API routes)

### Database Schema (Vercel Postgres)

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT CHECK (role IN ('retailer', 'admin')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_anonymized BOOLEAN DEFAULT FALSE
);

-- Retailers table
CREATE TABLE retailers (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  uen TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  showroom_locations TEXT NOT NULL,
  tier TEXT CHECK (tier IN ('Standard', 'Silver', 'Gold', 'Platinum')) DEFAULT 'Standard',
  status TEXT CHECK (status IN ('Pending', 'Approved', 'Declined')) DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('Ceiling Fan', 'LED Downlight')) NOT NULL,
  description TEXT NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  wholesale_price DECIMAL(10,2) NOT NULL,
  moq INTEGER NOT NULL,
  technical_specs JSONB NOT NULL,
  spec_sheet_url TEXT,
  image_url TEXT,
  stock_count INTEGER DEFAULT 0,
  is_pre_order BOOLEAN DEFAULT FALSE,
  pre_order_discount INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  retailer_id TEXT REFERENCES retailers(id),
  user_id TEXT REFERENCES users(id),
  procurement_ref TEXT NOT NULL,
  status TEXT CHECK (status IN ('Pending Payment Proof', 'Payment Verified', 'Processing', 'Dispatched')) NOT NULL,
  total_qty INTEGER NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items table
CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id),
  qty INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  discount_applied INTEGER DEFAULT 0
);

-- Consent Records table
CREATE TABLE consent_records (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT CHECK (purpose IN ('registration', 'marketing', 'analytics')) NOT NULL,
  given_at TIMESTAMPTZ DEFAULT NOW(),
  withdrawn_at TIMESTAMPTZ,
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL
);

-- FAQs table
CREATE TABLE faqs (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📝 API ROUTE IMPLEMENTATION GUIDELINES

### Example: `/api/auth/login.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import { signJWT } from '@/lib/jwt';
import { LoginSchema } from '@/lib/validators';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Query database
    const result = await sql`
      SELECT * FROM users 
      WHERE LOWER(email) = LOWER(${email})
      LIMIT 1
    `;

    const user = result.rows[0];

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Incorrect email credentials or password' },
        { status: 401 }
      );
    }

    if (user.is_anonymized) {
      return NextResponse.json(
        { success: false, error: 'This account has been anonymized per customer request' },
        { status: 403 }
      );
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return NextResponse.json(
        { success: false, error: 'Incorrect email credentials or password' },
        { status: 401 }
      );
    }

    // Fetch retailer info if applicable
    let retailer = null;
    let tokenPayload: any = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    if (user.role === 'retailer') {
      const retailerResult = await sql`
        SELECT * FROM retailers WHERE user_id = ${user.id} LIMIT 1
      `;
      retailer = retailerResult.rows[0] || null;
      
      if (!retailer) {
        return NextResponse.json(
          { success: false, error: 'User account lacks active retailer record' },
          { status: 403 }
        );
      }
      
      tokenPayload.retailerId = retailer.id;
      tokenPayload.companyName = retailer.company_name;
      tokenPayload.tier = retailer.tier;
    }

    const token = await signJWT(tokenPayload);

    return NextResponse.json({
      success: true,
      data: {
        user: { 
          id: user.id, 
          email: user.email, 
          fullName: user.full_name, 
          role: user.role 
        },
        retailer,
        token
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login authentication failed' },
      { status: 500 }
    );
  }
}
```

---

## 🌍 ENVIRONMENT VARIABLES (.env.example)

```bash
# Database
POSTGRES_URL="postgresql://user:password@host:port/database?sslmode=require"

# JWT Secret
JWT_SECRET="your-super-secret-key-minimum-32-chars"

# Optional: Vercel KV for sessions
KV_REST_API_URL="https://your-project.upstash.io"
KV_REST_API_TOKEN="your-token"

# Frontend URL (for CORS if needed)
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```

---

## 📄 VERCEL CONFIGURATION (vercel.json)

```json
{
  "version": 2,
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

---

## 🎯 BUSINESS LOGIC TO PRESERVE

### Authentication Flow
1. JWT-based authentication with 24h expiration
2. Multi-tier role system (admin, retailer)
3. PDPA consent tracking on registration
4. Account anonymization support

### Retailer Tiers & Discounts
- Standard: 0% discount
- Silver: 5% discount
- Gold: 10% discount
- Platinum: 15% discount

### Order Processing
- MOQ validation per product
- Pre-order campaign discounts (15%)
- Tier-based automatic pricing
- Inventory deduction on order creation

### FAQ Management
- Admin-only CRUD operations
- Dynamic FAQ system

---

## 🚫 COMMON PITFALLS TO AVOID

1. **Do not use `process.cwd()`** - Serverless functions don't have persistent working directories
2. **Do not use `fs` module for data** - Files are read-only in production
3. **Do not use global variables for state** - Each invocation is isolated
4. **Do not forget database connection pooling** - Use `@vercel/postgres` which handles this
5. **Do not exceed 10s execution time** (Hobby plan) - Optimize queries
6. **Do not store secrets in code** - Use environment variables only

---

## ✅ VERIFICATION CHECKLIST

Before considering the regeneration complete, verify:

- [ ] No `express` imports anywhere
- [ ] No `app.listen()` calls
- [ ] No `fs.readFileSync` or `fs.writeFileSync` for data operations
- [ ] All API endpoints use Vercel's `NextRequest`/`NextResponse` or compatible format
- [ ] Database uses `@vercel/postgres` or compatible serverless driver
- [ ] All file paths are relative to build, not runtime
- [ ] Environment variables are properly referenced via `process.env`
- [ ] `vercel.json` exists with correct configuration
- [ ] `.env.example` documents all required variables
- [ ] Frontend API calls point to relative `/api/*` paths
- [ ] No hardcoded localhost URLs

---

## 🎨 DESIGN SYSTEM (UNCHANGED)

Maintain the existing UI/UX design:
- Professional B2B aesthetic
- Singapore market focus (PDPA compliance)
- Ceiling fan and LED lighting product catalog
- Multi-step registration with consent checkboxes
- Admin dashboard for product/order management
- Retailer portal for order tracking

---

## 📦 DELIVERABLES

Generate a complete, production-ready codebase with:

1. All API routes implemented as Vercel serverless functions
2. Database schema and migration scripts
3. Frontend components refactored to call `/api/*` endpoints
4. Proper error handling and type safety throughout
5. Environment variable documentation
6. Deployment instructions specific to Vercel
7. Seed data script for initial database population

**The generated code must deploy to Vercel with zero modifications after running:**
```bash
npm install
npm run build
vercel deploy
```
