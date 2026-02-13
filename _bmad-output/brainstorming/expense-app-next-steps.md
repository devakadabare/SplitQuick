# Next Steps: Implementation Action Plan

**Project:** Expense Sharing Application
**Date:** 2026-02-09
**Status:** Ready to Begin Development

---

## Phase 1: Immediate Setup (This Week)

### Day 1-2: Account Setup & Tools

**✅ Create Essential Accounts:**

1. **GitHub** (https://github.com)
   - Create organization or personal account
   - Enable two-factor authentication
   - Purpose: Code repository, version control, CI/CD

2. **Vercel** (https://vercel.com)
   - Sign up with GitHub account
   - Purpose: Frontend hosting (Next.js)
   - Free tier: Unlimited deployments

3. **Railway** (https://railway.app)
   - Sign up with GitHub account
   - Purpose: Backend + PostgreSQL hosting
   - Free tier: $5 credit/month

4. **Google AdSense** (https://adsense.google.com)
   - Apply for account (may take 1-2 days approval)
   - Purpose: Ad monetization
   - Requirements: Valid email, payment info

**✅ Domain Name:**
- Purchase domain from Namecheap, Google Domains, or Cloudflare
- Suggestions:
  - splitquick.com
  - fairshare.app
  - cashclear.io
  - splitly.app
  - sharezy.co
- Cost: ~$10-15/year

**✅ Development Tools:**
- Install Node.js 18+ (https://nodejs.org)
- Install PostgreSQL 15+ locally (https://postgresql.org)
- Install Git (https://git-scm.com)
- IDE: VS Code recommended (https://code.visualstudio.com)
- VS Code Extensions:
  - Prisma
  - ESLint
  - Prettier
  - TypeScript

---

## Day 3-4: Project Initialization

### Initialize Repositories

**Backend Repository:**

```bash
# Create directory
mkdir expense-app-backend
cd expense-app-backend

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express cors helmet dotenv bcrypt jsonwebtoken
npm install @prisma/client
npm install -D typescript @types/node @types/express @types/cors @types/bcrypt @types/jsonwebtoken
npm install -D ts-node nodemon prisma
npm install -D jest @types/jest ts-jest supertest @types/supertest
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier

# Initialize TypeScript
npx tsc --init

# Initialize Prisma
npx prisma init

# Initialize Git
git init
git add .
git commit -m "Initial backend setup"

# Create GitHub repo and push
gh repo create expense-app-backend --private
git remote add origin <your-repo-url>
git push -u origin main
```

**Frontend Repository:**

```bash
# Create Next.js app with TypeScript
npx create-next-app@latest expense-app-frontend --typescript --tailwind --app --no-src-dir

cd expense-app-frontend

# Install additional dependencies
npm install @tanstack/react-query axios zod
npm install -D eslint prettier

# Initialize Git
git init
git add .
git commit -m "Initial frontend setup"

# Create GitHub repo and push
gh repo create expense-app-frontend --private
git remote add origin <your-repo-url>
git push -u origin main
```

### Project Structure Setup

**Backend Structure:**
```
expense-app-backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── jwt.ts
│   │   └── env.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   └── errorHandler.ts
│   ├── modules/
│   │   ├── auth/
│   │   ├── groups/
│   │   ├── expenses/
│   │   └── settlements/
│   ├── utils/
│   ├── types/
│   ├── app.ts
│   └── server.ts
├── prisma/
│   └── schema.prisma
├── tests/
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json
```

**Frontend Structure:**
```
expense-app-frontend/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── expense/
│   ├── group/
│   └── settlement/
├── hooks/
├── lib/
├── types/
├── public/
├── .env.local.example
├── next.config.js
└── package.json
```

---

## Day 5-7: Database Schema & Configuration

### Create Prisma Schema

**File:** `backend/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  name          String
  avatarUrl     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  groupMemberships GroupMember[]
  expensesPaid     Expense[]      @relation("PaidBy")
  settlementsFrom  Settlement[]   @relation("From")
  settlementsTo    Settlement[]   @relation("To")

  @@index([email])
}

model Group {
  id          String    @id @default(uuid())
  name        String
  currency    String
  createdBy   String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  members     GroupMember[]
  expenses    Expense[]
  settlements Settlement[]

  @@index([createdBy])
  @@index([deletedAt])
}

model GroupMember {
  groupId     String
  userId      String
  role        String    @default("member")
  joinedAt    DateTime  @default(now())
  invitedBy   String?
  isGuest     Boolean   @default(false)
  guestEmail  String?

  group       Group     @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user        User?     @relation(fields: [userId], references: [id])

  @@id([groupId, userId])
  @@index([userId])
  @@index([groupId])
}

model Expense {
  id          String    @id @default(uuid())
  groupId     String
  title       String
  amount      Decimal   @db.Decimal(10, 2)
  paidBy      String
  splitMethod String
  category    String?
  note        String?
  date        DateTime  @default(now())
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?
  deletedBy   String?

  group       Group           @relation(fields: [groupId], references: [id], onDelete: Cascade)
  payer       User            @relation("PaidBy", fields: [paidBy], references: [id])
  splits      ExpenseSplit[]

  @@index([groupId])
  @@index([paidBy])
  @@index([createdAt])
  @@index([groupId, deletedAt])
  @@index([category])
}

model ExpenseSplit {
  id          String   @id @default(uuid())
  expenseId   String
  userId      String
  amount      Decimal  @db.Decimal(10, 2)
  percentage  Decimal? @db.Decimal(5, 2)

  expense     Expense  @relation(fields: [expenseId], references: [id], onDelete: Cascade)

  @@index([expenseId])
  @@index([userId])
  @@index([expenseId, userId])
}

model Settlement {
  id            String    @id @default(uuid())
  groupId       String
  fromUserId    String
  toUserId      String
  amount        Decimal   @db.Decimal(10, 2)
  note          String?
  status        String    @default("pending")
  recordedBy    String
  recordedAt    DateTime  @default(now())
  confirmedAt   DateTime?
  confirmedBy   String?

  group         Group     @relation(fields: [groupId], references: [id], onDelete: Cascade)
  fromUser      User      @relation("From", fields: [fromUserId], references: [id])
  toUser        User      @relation("To", fields: [toUserId], references: [id])

  @@index([groupId])
  @@index([fromUserId])
  @@index([toUserId])
  @@index([status])
  @@index([groupId, status])
}
```

### Environment Variables

**Backend `.env.example`:**
```env
# Database
DATABASE_URL="postgresql://localhost:5432/expense_app"

# JWT
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"
JWT_EXPIRES_IN="24h"

# Server
PORT=4000
NODE_ENV="development"

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:3000"

# Email (TBD - configure later)
EMAIL_SERVICE=""
EMAIL_USER=""
EMAIL_PASSWORD=""
```

**Frontend `.env.local.example`:**
```env
# API
NEXT_PUBLIC_API_URL="http://localhost:4000/api"

# Google AdSense (add after approval)
NEXT_PUBLIC_ADSENSE_CLIENT=""
```

---

## Week 2: Core Authentication System

### Sprint 1 Goals:
- ✅ User registration endpoint
- ✅ Login endpoint with JWT
- ✅ Password hashing with bcrypt
- ✅ JWT middleware for protected routes
- ✅ Basic frontend auth forms

### Backend Tasks:

**1. Create Auth Module** (`src/modules/auth/`)

Files to create:
- `auth.controller.ts` - Handle HTTP requests
- `auth.service.ts` - Business logic
- `auth.routes.ts` - Route definitions
- `auth.validation.ts` - Zod schemas

**2. Implement JWT Config** (`src/config/jwt.ts`)
```typescript
import jwt from 'jsonwebtoken';

export const generateToken = (userId: string, email: string): string => {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET!);
};
```

**3. Create Auth Middleware** (`src/middleware/auth.ts`)
```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt';
import prisma from '../config/database';

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

### Frontend Tasks:

**1. Create Auth Context** (`lib/auth-context.tsx`)
```typescript
'use client';

import { createContext, useContext, useState } from 'react';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Implement login, register, logout functions

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

**2. Create Login/Register Forms** (`app/(auth)/`)
- `app/(auth)/login/page.tsx`
- `app/(auth)/register/page.tsx`

---

## Week 3-4: Expense Management

### Sprint 2 Goals:
- ✅ Create group endpoint
- ✅ Add expense endpoint (Quick Add)
- ✅ List expenses endpoint
- ✅ Calculate balances
- ✅ Frontend expense forms

### Key Endpoints to Build:

```
POST   /api/groups
POST   /api/groups/:groupId/expenses
GET    /api/groups/:groupId/expenses
GET    /api/groups/:groupId/balances
```

### Settlement Simplification Algorithm

**File:** `src/utils/settlement-algorithm.ts`

```typescript
interface Balance {
  userId: string;
  amount: number;
}

interface Settlement {
  from: string;
  to: string;
  amount: string;
}

export function simplifySettlements(expenses: Expense[]): Settlement[] {
  // Calculate net balances
  const balances = new Map<string, number>();

  for (const expense of expenses) {
    const splits = expense.splits;

    // Credit the payer
    balances.set(
      expense.paidBy,
      (balances.get(expense.paidBy) || 0) + Number(expense.amount)
    );

    // Debit each participant
    for (const split of splits) {
      balances.set(
        split.userId,
        (balances.get(split.userId) || 0) - Number(split.amount)
      );
    }
  }

  // Separate creditors and debtors
  const creditors: Balance[] = [];
  const debtors: Balance[] = [];

  for (const [userId, balance] of balances.entries()) {
    if (balance > 0.01) creditors.push({ userId, amount: balance });
    if (balance < -0.01) debtors.push({ userId, amount: -balance });
  }

  // Sort descending
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Match creditors with debtors
  const settlements: Settlement[] = [];
  let i = 0, j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    const amount = Math.min(creditor.amount, debtor.amount);

    settlements.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: amount.toFixed(2)
    });

    creditor.amount -= amount;
    debtor.amount -= amount;

    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }

  return settlements;
}
```

---

## Week 5-6: Settlement & Guest Users

### Sprint 3 Goals:
- ✅ Record settlement endpoint
- ✅ Confirm settlement endpoint
- ✅ Guest user invitation system
- ✅ Guest view balance (no auth)

---

## Week 7-8: UI Polish & Ads

### Sprint 4 Goals:
- ✅ Balance-first dashboard
- ✅ Quick Add UI (optimized for speed)
- ✅ Google AdSense integration
- ✅ Responsive design

### Ad Integration Steps:

**1. Get AdSense Approval:**
- Apply with domain and basic content
- May take 1-2 weeks for approval

**2. Add AdSense Script** (`app/layout.tsx`):
```typescript
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXX"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**3. Create Ad Component** (`components/ads/AdBanner.tsx`):
```typescript
'use client';

import { useEffect } from 'react';

export function AdBanner() {
  useEffect(() => {
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (err) {
      console.error('Ad error:', err);
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client="ca-pub-XXXXXXXXX"
      data-ad-slot="XXXXXXXXX"
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
```

**4. Place Ads Strategically:**
- Bottom of dashboard
- After expense added (success state)
- Bottom of balance view
- Max 1 ad per page

---

## Week 9-10: Testing & Bug Fixes

### Testing Checklist:

**Unit Tests:**
- ✅ Settlement algorithm (multiple scenarios)
- ✅ Balance calculation
- ✅ JWT token generation/validation
- ✅ Password hashing

**Integration Tests:**
- ✅ Auth flow (register → login → protected route)
- ✅ Create group → Add expense → Check balances
- ✅ Record settlement → Confirm settlement
- ✅ Guest user invitation flow

**Manual Testing:**
- ✅ Speed test: Time to add expense (<15s goal)
- ✅ Mobile responsiveness
- ✅ Ad placement (not intrusive)
- ✅ Guest user experience

---

## Week 11-12: Deployment & Launch Prep

### Deployment Steps:

**1. Backend Deployment (Railway):**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Add PostgreSQL
railway add

# Set environment variables
railway variables set JWT_SECRET=xxx
railway variables set NODE_ENV=production

# Deploy
railway up
```

**2. Frontend Deployment (Vercel):**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables in Vercel dashboard
# - NEXT_PUBLIC_API_URL
# - NEXT_PUBLIC_ADSENSE_CLIENT
```

**3. Connect Domain:**
- Point domain to Vercel (frontend)
- Set up subdomain for API (api.yourdomain.com → Railway)

---

## Week 13: Soft Launch

### Launch Checklist:

**Pre-Launch:**
- ✅ All features working in production
- ✅ Ads displaying correctly
- ✅ Database backups configured
- ✅ Error monitoring set up (logging)
- ✅ Analytics configured (Google Analytics)

**Soft Launch:**
- ✅ Invite 10-20 friend groups to beta test
- ✅ Gather feedback via survey
- ✅ Monitor error logs daily
- ✅ Track key metrics (expenses added, settlements, ad revenue)

**Metrics to Track:**
- New users per day
- Expenses added per user
- Time to add expense (goal: <15s)
- Ad impressions and revenue
- Guest-to-user conversion rate
- Any error patterns

---

## Week 14+: Public Launch & Marketing

### Marketing Plan:

**1. Reddit Launch:**
- Post in r/Splitwise (carefully, not spammy)
- Post in r/personalfinance
- Post in r/frugal
- Message: "Built this free alternative to Splitwise after they added the 4-expense limit"

**2. Product Hunt:**
- Prepare launch post
- Get 5-10 upvotes from friends in first hour
- Respond to all comments
- Tagline: "The ACTUALLY Free Splitwise Alternative"

**3. Twitter/X:**
- Thread about Splitwise paywall problem
- How you built an ad-supported alternative
- Link to app
- Use hashtags: #splitwise #expensetracking #frugal

**4. App Indexing:**
- Submit to alternative app directories
- Get listed on "Splitwise alternatives" comparison sites
- SEO optimization for "free Splitwise alternative"

**5. Referral Program (Later):**
- Both users get 1 month premium free
- Viral loop for growth

---

## Success Metrics (First 3 Months)

**Month 1:**
- 1,000 users
- 5,000 expenses tracked
- $100 ad revenue
- 4.5+ star feedback

**Month 2:**
- 5,000 users
- 25,000 expenses tracked
- $500 ad revenue
- 10% guest-to-user conversion

**Month 3:**
- 10,000 users
- 100,000 expenses tracked
- $2,000 ad revenue
- Launch premium tier

---

## Tools & Resources

**Project Management:**
- GitHub Projects (free, integrated with repos)
- Or Trello/Notion for task tracking

**Communication:**
- Discord server for beta testers
- Email for updates

**Analytics:**
- Google Analytics (free)
- Plausible (privacy-friendly alternative)

**Error Tracking:**
- Winston logs (included in architecture)
- Sentry (optional, add later if needed)

**Email Service (Choose Later):**
- Mailgun: 5,000 emails/month free
- SendGrid: 100 emails/day free
- Resend: 3,000 emails/month free

---

## Critical Path Forward

**Your immediate next action should be:**

1. ✅ Create GitHub, Vercel, Railway accounts (TODAY)
2. ✅ Purchase domain name (TODAY)
3. ✅ Initialize both repositories (THIS WEEK)
4. ✅ Set up local development environment (THIS WEEK)
5. ✅ Create Prisma schema and run first migration (THIS WEEK)

**Then follow the weekly sprint plan above.**

---

## Questions or Blockers?

If you get stuck on any step:
1. Check the Technical Architecture Document for implementation details
2. Check the SOW for feature specifications
3. Google/Stack Overflow for specific errors
4. Ask in developer communities (Reddit, Discord)

---

**You're ready to build! Let's make this happen. 🚀**

**Next Status Check:** End of Week 2 (after auth system is complete)
