# Quick Start Guide: Build Your First Feature TODAY

**Goal:** Get your development environment running and build the authentication system (Week 1-2 work) starting RIGHT NOW.

---

## 🚀 Today's Mission: Set Up & Run Locally

### Part 1: Install Prerequisites (30 minutes)

**Check what you already have:**
```bash
node --version   # Should be 18+
git --version
```

**If missing, install:**
1. **Node.js 18+**: https://nodejs.org (download LTS version)
2. **Git**: https://git-scm.com
3. **PostgreSQL 15+**: https://www.postgresql.org/download/
   - Windows: Download installer, install with default options
   - Remember the password you set for 'postgres' user!

**Verify PostgreSQL is running:**
```bash
# Windows: Check services
# Or try connecting
psql -U postgres
# Type password when prompted
# If connected, type: \q to quit
```

---

## Part 2: Create Backend Project (45 minutes)

### Step 1: Create Project Directory

```bash
# Create main project folder
mkdir expense-app
cd expense-app

# Create backend folder
mkdir backend
cd backend
```

### Step 2: Initialize Node.js Project

```bash
npm init -y
```

### Step 3: Install All Dependencies at Once

```bash
# Production dependencies
npm install express cors helmet dotenv bcrypt jsonwebtoken @prisma/client express-rate-limit

# Development dependencies
npm install -D typescript @types/node @types/express @types/cors @types/bcrypt @types/jsonwebtoken ts-node nodemon prisma
```

### Step 4: Initialize TypeScript

```bash
npx tsc --init
```

**Edit `tsconfig.json`** - Replace entire content with:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### Step 5: Initialize Prisma

```bash
npx prisma init
```

This creates:
- `prisma/schema.prisma` file
- `.env` file

### Step 6: Configure Database

**Edit `.env` file:**
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/expense_app?schema=public"
JWT_SECRET="your-super-secret-key-change-this-to-something-random-min-32-chars"
JWT_EXPIRES_IN="24h"
PORT=4000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

**Replace `YOUR_PASSWORD` with your PostgreSQL password!**

### Step 7: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# In PostgreSQL prompt, run:
CREATE DATABASE expense_app;

# Verify it was created:
\l

# Exit:
\q
```

### Step 8: Define Prisma Schema

**Edit `prisma/schema.prisma`** - Replace entire content with:

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

  group       Group           @relation(fields: [groupId], references: [id], onDelete: Cascade)
  payer       User            @relation("PaidBy", fields: [paidBy], references: [id])
  splits      ExpenseSplit[]

  @@index([groupId])
  @@index([paidBy])
  @@index([createdAt])
  @@index([groupId, deletedAt])
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

  group         Group     @relation(fields: [groupId], references: [id], onDelete: Cascade)
  fromUser      User      @relation("From", fields: [fromUserId], references: [id])
  toUser        User      @relation("To", fields: [toUserId], references: [id])

  @@index([groupId])
  @@index([fromUserId])
  @@index([toUserId])
  @@index([status])
}
```

### Step 9: Run First Migration

```bash
npx prisma migrate dev --name init
```

This creates the database tables!

### Step 10: Generate Prisma Client

```bash
npx prisma generate
```

---

## Part 3: Build Authentication System (2-3 hours)

### Step 1: Create Folder Structure

```bash
# Create all folders at once
mkdir -p src/config src/middleware src/modules/auth src/utils src/types
```

### Step 2: Create Database Config

**Create `src/config/database.ts`:**
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
```

### Step 3: Create JWT Utilities

**Create `src/config/jwt.ts`:**
```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export const generateToken = (userId: string, email: string): string => {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};
```

### Step 4: Create Auth Middleware

**Create `src/middleware/auth.ts`:**
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
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    (req as any).user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

### Step 5: Create Auth Service

**Create `src/modules/auth/auth.service.ts`:**
```typescript
import bcrypt from 'bcrypt';
import prisma from '../../config/database';
import { generateToken } from '../../config/jwt';

export class AuthService {
  async register(name: string, email: string, password: string) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash
      }
    });

    // Generate token
    const token = generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      token
    };
  }

  async login(email: string, password: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      token
    };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email
    };
  }
}
```

### Step 6: Create Auth Controller

**Create `src/modules/auth/auth.controller.ts`:**
```typescript
import { Request, Response } from 'express';
import { AuthService } from './auth.service';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields required' });
      }

      const result = await authService.register(name, email, password);
      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      const result = await authService.login(email, password);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(401).json({ error: error.message });
    }
  }

  async getMe(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const user = await authService.getMe(userId);
      return res.status(200).json({ user });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
```

### Step 7: Create Auth Routes

**Create `src/modules/auth/auth.routes.ts`:**
```typescript
import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
const authController = new AuthController();

router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.get('/me', authenticate, (req, res) => authController.getMe(req, res));

export default router;
```

### Step 8: Create Main App

**Create `src/app.ts`:**
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './modules/auth/auth.routes';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
```

### Step 9: Create Server Entry Point

**Create `src/server.ts`:**
```typescript
import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
```

### Step 10: Add Scripts to package.json

**Edit `package.json`** - Add these scripts:
```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:migrate": "npx prisma migrate dev",
    "prisma:generate": "npx prisma generate",
    "prisma:studio": "npx prisma studio"
  }
}
```

---

## Part 4: TEST IT! (15 minutes)

### Step 1: Start the Server

```bash
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:4000
📊 Health check: http://localhost:4000/health
```

### Step 2: Test Health Check

Open browser: http://localhost:4000/health

Should see:
```json
{"status":"ok","timestamp":"2026-02-09T..."}
```

### Step 3: Test Registration (using curl or Postman)

**Using curl (in new terminal):**
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"password123\"}"
```

**Expected response:**
```json
{
  "user": {
    "id": "uuid-here",
    "name": "Test User",
    "email": "test@example.com"
  },
  "token": "jwt-token-here"
}
```

### Step 4: Test Login

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
```

### Step 5: Test Protected Route

```bash
# Replace YOUR_TOKEN with the token from registration/login
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:**
```json
{
  "user": {
    "id": "uuid-here",
    "name": "Test User",
    "email": "test@example.com"
  }
}
```

---

## 🎉 SUCCESS! You've Built Authentication!

**What you've accomplished:**
- ✅ Set up TypeScript + Node.js + Express
- ✅ Configured PostgreSQL database
- ✅ Created Prisma schema with 6 models
- ✅ Built complete authentication system
- ✅ JWT token generation and validation
- ✅ Password hashing with bcrypt
- ✅ Protected route middleware
- ✅ Working API endpoints

**You now have:**
- Register endpoint: `POST /api/auth/register`
- Login endpoint: `POST /api/auth/login`
- Get user endpoint: `GET /api/auth/me`

---

## 🚀 Next Steps Tomorrow:

### Day 2: Add Group Management
- Create group endpoint
- List user's groups endpoint
- Invite members endpoint

### Day 3: Add Expenses
- Create expense endpoint (Quick Add)
- List expenses endpoint
- Calculate balances

### Day 4-5: Frontend Setup
- Create Next.js app
- Build login/register forms
- Connect to backend API

---

## 📚 Useful Commands Reference

```bash
# Development
npm run dev                    # Start dev server with auto-reload

# Database
npm run prisma:studio          # Open database GUI
npx prisma migrate dev         # Create new migration
npx prisma generate            # Regenerate Prisma client

# Testing API
curl -X POST http://localhost:4000/api/auth/register -H "Content-Type: application/json" -d '{"name":"Name","email":"email@test.com","password":"pass"}'
```

---

## 🐛 Troubleshooting

**Port already in use:**
```bash
# Change PORT in .env file
PORT=4001
```

**Database connection error:**
```bash
# Check PostgreSQL is running
# Verify DATABASE_URL in .env
# Make sure database 'expense_app' exists
```

**Prisma client not found:**
```bash
npx prisma generate
```

---

## ✨ You're on your way!

**Current progress: Week 1 - Day 1 complete!**

Tomorrow you'll add group and expense management. By end of week, you'll have a working backend API!

**Keep the momentum going! 🔥**
