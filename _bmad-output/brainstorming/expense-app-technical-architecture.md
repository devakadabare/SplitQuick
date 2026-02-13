# Technical Architecture Document: Expense Sharing Application

**Project Name:** Expense Sharing Application
**Document Version:** 1.0
**Date:** 2026-02-09
**Author:** Devaka

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Database Design](#database-design)
5. [API Design](#api-design)
6. [Security Architecture](#security-architecture)
7. [Development Workflow](#development-workflow)
8. [Testing Strategy](#testing-strategy)
9. [Deployment Strategy](#deployment-strategy)
10. [Monitoring & Operations](#monitoring--operations)
11. [Performance Optimization](#performance-optimization)
12. [Deferred Decisions](#deferred-decisions)

---

## Architecture Overview

### Architecture Pattern
**Pattern:** Client-Server Separation (Decoupled Frontend/Backend)

**Rationale:**
- Clean separation of concerns (UI logic vs. business logic)
- Independent scaling of frontend and backend
- Future mobile app can reuse backend API
- Easier testing and maintenance
- Technology flexibility (can swap frontend framework without touching backend)

### Architecture Diagram (Conceptual)
```
┌─────────────────┐
│   Next.js       │
│   Frontend      │
│  (Vercel)       │
└────────┬────────┘
         │ HTTPS/REST
         │
┌────────▼────────┐      ┌──────────────┐
│   Node.js +     │─────▶│  PostgreSQL  │
│   Express API   │      │   Database   │
│   (Railway)     │      │  (Railway)   │
└─────────────────┘      └──────────────┘
         │
         ▼
┌─────────────────┐
│  Email Service  │
│  (TBD)          │
└─────────────────┘
```

---

## Technology Stack

### Frontend Stack

#### Framework: Next.js 13+ (App Router)
**Version:** Latest stable
**Rationale:**
- React-based with modern features (Server Components, Server Actions)
- Built-in routing with file-based system
- Server-side rendering (SSR) for better SEO and initial load
- Static site generation (SSG) for static pages
- API routes for simple serverless functions if needed
- Excellent developer experience
- TypeScript support out of the box
- Automatic code splitting and optimization
- Image optimization built-in

**Alternative Considered:** Plain React (rejected due to lack of SSR/SSG built-in)

#### Language: TypeScript
**Rationale:**
- Type safety prevents runtime errors
- Better IDE autocomplete and refactoring
- Self-documenting code via types
- Catches bugs at compile time
- Industry standard for modern web apps

#### State Management: React Query + Context API
**React Query (TanStack Query):**
- Server state management (API data)
- Automatic caching and revalidation
- Optimistic updates for better UX
- Built-in loading and error states
- Background refetching
**Context API:**
- UI state (modals, theme, etc.)
- Authentication state
- Simple and built-in to React

**Rationale:** React Query eliminates boilerplate for API calls. Context API handles simple UI state. No need for Redux complexity in MVP.

#### Styling: TBD (Tailwind CSS or CSS Modules)
**Options:**
- Tailwind CSS: Utility-first, fast development
- CSS Modules: Scoped styles, traditional approach
**Decision Deferred:** Choose based on team preference during implementation

#### UI Components: Custom + shadcn/ui (Optional)
**Rationale:** Build custom components for learning and flexibility. Can use shadcn/ui for complex components (modals, dropdowns) to save time.

---

### Backend Stack

#### Runtime: Node.js
**Version:** 18 LTS or higher
**Rationale:**
- JavaScript throughout stack (frontend + backend)
- Fast development with unified language
- Excellent package ecosystem (npm)
- Non-blocking I/O good for concurrent requests
- Easy to hire developers (popular technology)

#### Framework: Express.js
**Version:** Latest stable (4.x)
**Rationale:**
- Lightweight and un-opinionated
- Minimal overhead
- Extensive middleware ecosystem
- Easy to understand and debug
- Industry standard for Node.js APIs

**Alternative Considered:** Fastify (faster but less mature ecosystem), NestJS (too heavy for MVP)

#### Language: TypeScript
**Rationale:** Same as frontend - type safety throughout codebase

#### ORM: Prisma
**Version:** Latest stable
**Rationale:**
- Modern, type-safe database access
- Auto-generated TypeScript types from schema
- Excellent migration system
- Clean query syntax
- Built-in connection pooling
- Visual database browser (Prisma Studio)
- Active development and community

**Alternative Considered:**
- TypeORM (more verbose, decorator-based)
- Sequelize (older, more boilerplate)
- Knex.js (query builder, not ORM)
- Raw SQL (maximum control but no type safety)

**Prisma Example:**
```typescript
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
  include: { groups: true }
});
// Type-safe: user.groups is fully typed
```

---

### Database

#### Database: PostgreSQL
**Version:** 15 or higher
**Rationale:**
- Robust relational database with ACID compliance
- Critical for financial data integrity
- Excellent performance for complex queries
- JSON support for flexible data when needed
- Strong data type system
- Industry-proven for financial applications
- Free and open source
- Excellent documentation

**Alternative Considered:**
- MySQL (less feature-rich than Postgres)
- MongoDB (NoSQL not suitable for financial data with complex relationships)
- SQLite (too simple for production)

**Key Features Used:**
- ACID transactions (atomicity for financial operations)
- Foreign key constraints (referential integrity)
- Indexes (query performance)
- Decimal type (precise financial calculations)
- Partial indexes (for soft deletes)

---

## System Architecture

### API Architecture Style

#### Pattern: RESTful API
**Rationale:**
- Standard, well-understood approach
- Resource-based URLs are intuitive
- HTTP verbs map to CRUD operations
- Stateless (scales horizontally)
- Cacheable responses

**Alternative Considered:** GraphQL (rejected as overkill for MVP; adds complexity without clear benefit for this use case)

### Authentication Architecture

#### Method: JWT (JSON Web Tokens)
**Flow:**
1. User logs in with email/password
2. Backend validates credentials
3. Backend generates JWT with payload: `{ userId, email, iat, exp }`
4. Frontend stores JWT (httpOnly cookie recommended, or localStorage)
5. Every API request includes JWT in `Authorization: Bearer <token>` header
6. Backend middleware validates JWT and extracts user context
7. Request proceeds with authenticated user

**Token Configuration:**
- Expiry: 24 hours for MVP
- Algorithm: HS256 (HMAC with SHA-256)
- Secret: Strong random string (min 32 characters)

**Rationale:**
- Stateless authentication (no session storage needed)
- Scales horizontally (any backend instance can validate token)
- Standard approach, well-supported
- No database lookup on every request (performance)

**Security Considerations:**
- Token stored in httpOnly cookie prevents XSS attacks
- Short expiry limits damage if token stolen
- HTTPS only in production
- Refresh tokens deferred to post-MVP

**Alternative Considered:**
- Firebase Auth (rejected to avoid vendor lock-in)
- Auth0/Clerk (rejected to keep full control for MVP)
- Session-based auth (rejected due to statefulness and scaling challenges)

### Password Security

#### Hashing: bcrypt
**Configuration:**
- Salt rounds: 10 (industry standard)
- Algorithm: bcrypt (adaptive, slow by design)

**Rationale:**
- Deliberately slow to prevent brute force attacks
- Automatic salt generation
- Industry standard for password hashing
- Cannot be reversed (one-way function)

**Never:**
- Store plaintext passwords
- Use MD5 or SHA1 (too fast, vulnerable)
- Use simple hashing without salt

---

## Database Design

### Core Entities

#### User
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  name          String
  avatarUrl     String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  groupMemberships GroupMember[]
  expensesPaid     Expense[]      @relation("PaidBy")
  settlementsFrom  Settlement[]   @relation("From")
  settlementsTo    Settlement[]   @relation("To")

  @@index([email])
}
```

#### Group
```prisma
model Group {
  id          String    @id @default(uuid())
  name        String
  currency    String    // ISO code: USD, EUR, LKR, etc.
  createdBy   String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  // Relations
  members     GroupMember[]
  expenses    Expense[]
  settlements Settlement[]

  @@index([createdBy])
  @@index([deletedAt]) // For filtering active groups
}
```

#### GroupMember
```prisma
model GroupMember {
  groupId     String
  userId      String
  role        String    // 'admin' or 'member'
  joinedAt    DateTime  @default(now())
  invitedBy   String?
  isGuest     Boolean   @default(false) // Guest user flag
  guestEmail  String?   // Email for guest users

  // Relations
  group       Group     @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user        User?     @relation(fields: [userId], references: [id])

  @@id([groupId, userId])
  @@index([userId]) // Find all groups for a user
  @@index([groupId]) // Find all members of a group
}
```

#### Expense
```prisma
model Expense {
  id          String    @id @default(uuid())
  groupId     String
  title       String
  amount      Decimal   @db.Decimal(10, 2) // Precise financial calculations
  paidBy      String    // User who paid
  splitMethod String    // 'equal', 'percentage', 'custom'
  category    String?   // Optional: 'food', 'transport', etc.
  note        String?
  date        DateTime  @default(now())
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?
  deletedBy   String?

  // Relations
  group       Group           @relation(fields: [groupId], references: [id], onDelete: Cascade)
  payer       User            @relation("PaidBy", fields: [paidBy], references: [id])
  splits      ExpenseSplit[]

  @@index([groupId])
  @@index([paidBy])
  @@index([createdAt])
  @@index([groupId, deletedAt]) // Active expenses per group
  @@index([category])
}
```

#### ExpenseSplit
```prisma
model ExpenseSplit {
  id          String   @id @default(uuid())
  expenseId   String
  userId      String
  amount      Decimal  @db.Decimal(10, 2) // How much this user owes
  percentage  Decimal? @db.Decimal(5, 2)  // For percentage splits

  // Relations
  expense     Expense  @relation(fields: [expenseId], references: [id], onDelete: Cascade)

  @@index([expenseId])
  @@index([userId])
  @@index([expenseId, userId])
}
```

#### Settlement
```prisma
model Settlement {
  id            String    @id @default(uuid())
  groupId       String
  fromUserId    String    // Debtor
  toUserId      String    // Creditor
  amount        Decimal   @db.Decimal(10, 2)
  note          String?
  status        String    // 'pending', 'confirmed'
  recordedBy    String    // Who initiated the recording
  recordedAt    DateTime  @default(now())
  confirmedAt   DateTime?
  confirmedBy   String?

  // Relations
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

### Database Indexing Strategy

**Indexes Rationale:**
- `User.email`: Frequent lookups during login
- `Expense.groupId`: Filter expenses by group (primary query pattern)
- `Expense.createdAt`: Sort by date
- `Expense.[groupId, deletedAt]`: Composite index for active expenses
- `GroupMember.[groupId, userId]`: Composite primary key for membership checks
- `Settlement.status`: Filter pending settlements

**Index Monitoring:**
- Use Prisma query logging to identify slow queries
- Add indexes as query patterns emerge in production
- Avoid over-indexing (slows writes)

---

## API Design

### REST API Endpoints

#### Authentication Endpoints
```
POST   /api/auth/register          - Create new user account
POST   /api/auth/login             - Login and receive JWT
POST   /api/auth/logout            - Logout (client discards token)
GET    /api/auth/me                - Get current user profile
PUT    /api/auth/me                - Update profile
POST   /api/auth/forgot-password   - Request password reset
POST   /api/auth/reset-password    - Reset password with token
```

#### Group Endpoints
```
GET    /api/groups                      - List user's groups
POST   /api/groups                      - Create new group
GET    /api/groups/:id                  - Get group details
PUT    /api/groups/:id                  - Update group (admin only)
DELETE /api/groups/:id                  - Soft delete group (admin only)
POST   /api/groups/:id/members          - Invite member (admin only)
DELETE /api/groups/:id/members/:userId  - Remove member (admin only)
GET    /api/groups/:id/balances         - Calculate current balances
POST   /api/groups/:id/simplify         - Get simplified settlements
```

#### Expense Endpoints
```
GET    /api/groups/:groupId/expenses       - List expenses (with filters)
POST   /api/groups/:groupId/expenses       - Create expense
GET    /api/expenses/:id                   - Get expense details
PUT    /api/expenses/:id                   - Update expense (creator/admin)
DELETE /api/expenses/:id                   - Soft delete expense
```

#### Settlement Endpoints
```
GET    /api/groups/:groupId/settlements    - Settlement history
POST   /api/settlements                    - Record payment
PUT    /api/settlements/:id/confirm        - Confirm payment (creditor)
GET    /api/settlements/pending            - My pending confirmations
```

### Request/Response Format

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Standard Response Format:**
```json
{
  "data": { ... },
  "message": "Success message",
  "timestamp": "2026-02-09T12:00:00Z"
}
```

**Error Response Format:**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2026-02-09T12:00:00Z",
  "details": { ... }  // Optional, development only
}
```

### API Versioning
**Strategy:** URL-based versioning (e.g., `/api/v1/groups`)
**MVP:** No versioning initially (`/api/groups`), add `/api/v2/` when breaking changes needed

---

## Security Architecture

### Security Layers

#### 1. Authentication Middleware
```typescript
async function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    if (!req.user) return res.status(401).json({ error: 'User not found' });
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

#### 2. Authorization Middleware
```typescript
async function requireGroupMember(req, res, next) {
  const groupId = req.params.groupId;
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId: req.user.id }
    }
  });
  if (!membership) return res.status(403).json({ error: 'Not a group member' });
  req.membership = membership;
  next();
}

async function requireGroupAdmin(req, res, next) {
  await requireGroupMember(req, res, () => {});
  if (req.membership.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
```

#### 3. Input Validation with Zod
```typescript
import { z } from 'zod';

const createExpenseSchema = z.object({
  title: z.string().min(1).max(100),
  amount: z.number().positive().max(999999.99),
  paidBy: z.string().uuid(),
  splitMethod: z.enum(['equal', 'percentage', 'custom']),
  participants: z.array(z.string().uuid()).min(1),
  category: z.string().optional(),
  note: z.string().max(500).optional(),
  date: z.string().datetime().optional()
});

function validateRequest(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      return res.status(400).json({
        error: 'Validation failed',
        details: err.errors
      });
    }
  };
}

// Usage
app.post('/api/groups/:groupId/expenses',
  authenticate,
  requireGroupMember,
  validateRequest(createExpenseSchema),
  createExpense
);
```

#### 4. Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 login attempts
  message: 'Too many login attempts'
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
```

#### 5. Security Headers (Helmet.js)
```typescript
import helmet from 'helmet';

app.use(helmet()); // Sets secure headers:
// - X-Frame-Options (prevent clickjacking)
// - X-Content-Type-Options (prevent MIME sniffing)
// - X-XSS-Protection
// - Strict-Transport-Security (HTTPS only)
```

#### 6. CORS Configuration
```typescript
import cors from 'cors';

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // Allow cookies
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

### Security Best Practices

1. **Environment Variables:** Never commit secrets to git
2. **HTTPS Only:** Enforce in production
3. **SQL Injection:** Prevented by Prisma (parameterized queries)
4. **XSS Prevention:** React escapes by default, validate user input
5. **CSRF:** Use SameSite cookies, CSRF tokens if needed
6. **Dependency Security:** Regular `npm audit` checks

---

## Development Workflow

### Project Structure

#### Backend Structure
```
backend/
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
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.validation.ts
│   │   ├── groups/
│   │   ├── expenses/
│   │   └── settlements/
│   ├── utils/
│   │   ├── settlement-algorithm.ts
│   │   └── email.ts
│   ├── types/
│   ├── app.ts
│   └── server.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
└── .env
```

#### Frontend Structure
```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── expense/
│   │   ├── group/
│   │   └── settlement/
│   ├── hooks/
│   ├── lib/
│   └── types/
└── public/
```

### Development Environment Setup

**Prerequisites:**
- Node.js 18+ installed
- PostgreSQL 15+ installed (or use Docker)
- Git installed

**Backend Setup:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with database URL and secrets
npx prisma migrate dev
npx prisma generate
npm run dev
```

**Frontend Setup:**
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with API URL
npm run dev
```

### Git Workflow

**Branch Strategy:**
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: Feature branches
- `bugfix/*`: Bug fix branches

**Commit Convention:**
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code refactoring
- `docs:` Documentation
- `test:` Tests
- `chore:` Maintenance

**Example:** `feat: add settlement simplification algorithm`

### Code Quality Tools

**Linting:**
```bash
npm install -D eslint @typescript-eslint/parser
npm run lint
```

**Formatting:**
```bash
npm install -D prettier
npm run format
```

**Pre-commit Hooks (Husky):**
```bash
npm install -D husky lint-staged
# Runs linter and formatter before commit
```

---

## Testing Strategy

### Testing Pyramid

#### 1. Unit Tests (Jest)
**Coverage:** Individual functions and algorithms
**Example:**
```typescript
describe('Settlement Simplification Algorithm', () => {
  test('should simplify 3-person debt to minimum transactions', () => {
    const expenses = [
      { paidBy: 'A', amount: 3000, participants: ['A', 'B', 'C'] },
      { paidBy: 'B', amount: 6000, participants: ['A', 'B', 'C'] }
    ];

    const settlements = simplifySettlements(expenses);

    expect(settlements).toHaveLength(1);
    expect(settlements[0]).toEqual({
      from: 'C',
      to: 'B',
      amount: '3000.00'
    });
  });

  test('should handle already balanced scenario', () => {
    const expenses = [
      { paidBy: 'A', amount: 100, participants: ['A', 'B'] },
      { paidBy: 'B', amount: 100, participants: ['A', 'B'] }
    ];

    const settlements = simplifySettlements(expenses);

    expect(settlements).toHaveLength(0);
  });
});
```

#### 2. Integration Tests (Supertest)
**Coverage:** API endpoints with real database
**Example:**
```typescript
describe('POST /api/groups/:id/expenses', () => {
  let token, groupId, userId;

  beforeAll(async () => {
    // Setup: Create user, group, get token
    const user = await createTestUser();
    token = generateToken(user.id);
    const group = await createTestGroup(user.id);
    groupId = group.id;
    userId = user.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.expense.deleteMany({});
    await prisma.group.deleteMany({});
    await prisma.user.deleteMany({});
  });

  test('should create expense successfully', async () => {
    const response = await request(app)
      .post(`/api/groups/${groupId}/expenses`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Dinner',
        amount: 3000,
        paidBy: userId,
        splitMethod: 'equal',
        participants: [userId]
      });

    expect(response.status).toBe(201);
    expect(response.body.data.expense.title).toBe('Test Dinner');
  });

  test('should reject expense without authentication', async () => {
    const response = await request(app)
      .post(`/api/groups/${groupId}/expenses`)
      .send({ title: 'Test', amount: 100 });

    expect(response.status).toBe(401);
  });
});
```

#### 3. E2E Tests (Deferred to Post-MVP)
**Coverage:** Full user flows in browser (Playwright/Cypress)
**Example scenarios:**
- User registers → creates group → adds expense → views balance
- User invites friend → friend joins → records settlement

### Test Database Strategy
```typescript
// Use separate test database
// .env.test
DATABASE_URL="postgresql://localhost:5432/expense_app_test"

// Reset before each test suite
beforeAll(async () => {
  await prisma.$executeRaw`TRUNCATE TABLE users, groups, expenses CASCADE`;
});
```

### CI/CD Testing
**GitHub Actions workflow runs:**
1. Install dependencies
2. Run database migrations
3. Run unit tests
4. Run integration tests
5. Run linter
6. Build application
7. Deploy if all pass (main branch only)

---

## Deployment Strategy

### Hosting Decisions (Recommended)

#### Frontend: Vercel
**Rationale:**
- Creators of Next.js (optimal support)
- Zero-config deployment from GitHub
- Automatic HTTPS
- Edge network (fast globally)
- Generous free tier
- Preview deployments for PRs

**Alternative Options:** Netlify, AWS Amplify, self-hosted

#### Backend: Railway
**Rationale:**
- Simple deployment from GitHub
- Free tier for hobby projects ($5 credit/month)
- Built-in PostgreSQL database
- Environment variable management
- Automatic HTTPS
- Easy scaling later

**Alternative Options:** Render, Fly.io, Heroku, DigitalOcean App Platform

#### Database: Railway PostgreSQL
**Rationale:**
- Included with Railway backend
- Managed service (automatic backups)
- Simple connection (DATABASE_URL)
- Free tier adequate for MVP

**Alternative Options:** Supabase, AWS RDS, Neon

### CI/CD Pipeline

#### GitHub Actions Workflow
```yaml
name: Backend CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npm test
      - run: npm run lint
      - run: npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Railway
        # Railway auto-deploys from GitHub
```

### Environment Variables Management

**Development (.env.local):**
```bash
DATABASE_URL=postgresql://localhost:5432/expense_app
JWT_SECRET=dev-secret-key
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Production (Railway/Vercel environment variables):**
```bash
DATABASE_URL=<railway-postgres-url>
JWT_SECRET=<strong-random-secret>
NODE_ENV=production
FRONTEND_URL=https://yourapp.vercel.app
```

**Validation at startup:**
```typescript
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test'])
});

const env = envSchema.parse(process.env);
export default env;
```

---

## Monitoring & Operations

### Logging Strategy

#### Structured Logging (Winston)
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Console in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Usage
logger.info('User logged in', { userId, email });
logger.error('Settlement failed', { settlementId, error: err.message });
```

### Error Tracking

**MVP:** Console logging + file logs
**Post-MVP:** Consider Sentry for real-time error monitoring

### Health Checks

```typescript
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected'
    });
  }
});
```

### Backup Strategy

**Database Backups:**
- Railway: Automatic daily backups included
- Retention: Last 7 days
- Manual backups before major changes

**Code Backups:**
- Git repository (GitHub)
- Protected main branch
- Tag releases (v1.0.0, v1.1.0, etc.)

---

## Performance Optimization

### Caching Strategy

#### Level 1: Frontend Caching (React Query)
```typescript
const { data: groups } = useQuery({
  queryKey: ['groups'],
  queryFn: fetchGroups,
  staleTime: 5 * 60 * 1000, // Consider fresh for 5 min
  cacheTime: 10 * 60 * 1000  // Keep in cache for 10 min
});

// Invalidate after mutations
const mutation = useMutation({
  mutationFn: createExpense,
  onSuccess: () => {
    queryClient.invalidateQueries(['groups', groupId, 'expenses']);
  }
});
```

#### Level 2: Database Query Optimization
- Proper indexing on frequently queried fields
- Use `select` to fetch only needed fields
- Pagination for large lists
- Eager loading with `include` to avoid N+1 queries

**Example:**
```typescript
// Bad: N+1 query problem
const groups = await prisma.group.findMany();
for (const group of groups) {
  const members = await prisma.groupMember.findMany({
    where: { groupId: group.id }
  });
}

// Good: Single query with join
const groups = await prisma.group.findMany({
  include: { members: true }
});
```

#### Level 3: API Response Caching (Deferred to Post-MVP)
- Redis for caching expensive calculations
- Cache balance calculations for 5 minutes
- Invalidate cache on expense/settlement creation

### Database Performance

**Query Performance Monitoring:**
```typescript
const prisma = new PrismaClient({
  log: [{ emit: 'event', level: 'query' }],
});

prisma.$on('query', (e) => {
  if (e.duration > 100) { // Log queries > 100ms
    logger.warn('Slow query', { query: e.query, duration: e.duration });
  }
});
```

**Connection Pooling:**
- Prisma handles connection pooling automatically
- Default: 10 connections
- Configure via DATABASE_URL: `?connection_limit=10`

---

## Deferred Decisions

The following technical decisions are intentionally deferred until implementation or post-MVP:

### 1. Email Service Provider
**Options:** SendGrid, Mailgun, AWS SES, Resend
**Defer Reason:** Need to compare pricing and free tier limits
**Decision Point:** Before implementing notifications

### 2. Real-Time Updates
**Options:** WebSockets, Server-Sent Events (SSE), Firebase Realtime, polling
**Defer Reason:** MVP can use simple page refresh; real-time is nice-to-have
**Decision Point:** If users complain about stale data

### 3. File Storage (for future receipt photos)
**Options:** AWS S3, Cloudinary, Supabase Storage
**Defer Reason:** Not needed for MVP
**Decision Point:** When adding receipt photo feature

### 4. Frontend Styling Approach
**Options:** Tailwind CSS, CSS Modules, Styled Components
**Defer Reason:** Team preference during implementation
**Decision Point:** At project kickoff

### 5. API Documentation Tool
**Options:** Swagger/OpenAPI, Postman collections, manual docs
**Defer Reason:** API is simple for MVP; can add once stabilized
**Decision Point:** When onboarding additional developers

### 6. Advanced Monitoring
**Options:** Sentry, Datadog, LogRocket
**Defer Reason:** MVP can use basic logging; paid tools for production scale
**Decision Point:** After MVP launch with real users

### 7. Caching Layer (Redis)
**Options:** Redis, Memcached
**Defer Reason:** React Query handles frontend caching; backend caching only needed if performance issues arise
**Decision Point:** If balance calculations become slow

---

## Settlement Algorithm Implementation

### Greedy Algorithm Approach

**Algorithm:** Minimize transactions by matching largest creditors with largest debtors

**Pseudocode:**
```
function simplifySettlements(expenses):
  1. Calculate net balance for each person
  2. Separate into creditors (positive balance) and debtors (negative balance)
  3. Sort both lists by amount (descending)
  4. While both lists have entries:
     a. Take largest creditor and largest debtor
     b. Settlement amount = min(creditor balance, debtor balance)
     c. Create settlement: debtor pays creditor this amount
     d. Update both balances
     e. Remove anyone with zero balance
  5. Return list of settlements
```

**TypeScript Implementation:**
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

function simplifySettlements(expenses: Expense[]): Settlement[] {
  // Step 1: Calculate net balance per person
  const balances: Map<string, number> = new Map();

  for (const expense of expenses) {
    const sharePerPerson = expense.amount / expense.participants.length;

    // Payer gets credited
    balances.set(
      expense.paidBy,
      (balances.get(expense.paidBy) || 0) + expense.amount
    );

    // Participants get debited
    for (const participant of expense.participants) {
      balances.set(
        participant,
        (balances.get(participant) || 0) - sharePerPerson
      );
    }
  }

  // Step 2: Separate creditors and debtors
  const creditors: Balance[] = [];
  const debtors: Balance[] = [];

  for (const [userId, balance] of balances.entries()) {
    if (balance > 0.01) creditors.push({ userId, amount: balance });
    if (balance < -0.01) debtors.push({ userId, amount: -balance });
  }

  // Step 3: Sort descending
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Step 4: Match creditors with debtors
  const settlements: Settlement[] = [];
  let i = 0, j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const settlementAmount = Math.min(creditor.amount, debtor.amount);

    settlements.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: settlementAmount.toFixed(2)
    });

    creditor.amount -= settlementAmount;
    debtor.amount -= settlementAmount;

    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }

  return settlements;
}
```

**Complexity:**
- Time: O(n log n) for sorting + O(n) for matching = O(n log n)
- Space: O(n) for storing balances

**Test Cases:**
```typescript
describe('Settlement Algorithm', () => {
  test('Example 1: A pays 3000, B pays 6000, split 3 ways', () => {
    // Each person should pay 3000
    // A paid 3000, owes 3000 → balance: 0
    // B paid 6000, owes 3000 → balance: +3000
    // C paid 0, owes 3000 → balance: -3000
    // Result: C pays B 3000

    const result = simplifySettlements([
      { paidBy: 'A', amount: 3000, participants: ['A', 'B', 'C'] },
      { paidBy: 'B', amount: 6000, participants: ['A', 'B', 'C'] }
    ]);

    expect(result).toEqual([
      { from: 'C', to: 'B', amount: '3000.00' }
    ]);
  });

  test('Example 2: Already balanced', () => {
    const result = simplifySettlements([
      { paidBy: 'A', amount: 100, participants: ['A', 'B'] },
      { paidBy: 'B', amount: 100, participants: ['A', 'B'] }
    ]);

    expect(result).toEqual([]);
  });

  test('Example 3: Complex 4-person scenario', () => {
    // A pays 100, B pays 200, C pays 50, D pays 150
    // Total: 500, each owes 125
    // Balances: A: -25, B: +75, C: -75, D: +25
    // Simplified: C pays B 75 (or equivalent)

    const result = simplifySettlements([
      { paidBy: 'A', amount: 100, participants: ['A', 'B', 'C', 'D'] },
      { paidBy: 'B', amount: 200, participants: ['A', 'B', 'C', 'D'] },
      { paidBy: 'C', amount: 50, participants: ['A', 'B', 'C', 'D'] },
      { paidBy: 'D', amount: 150, participants: ['A', 'B', 'C', 'D'] }
    ]);

    // Should produce 2-3 settlements (near-optimal)
    expect(result.length).toBeLessThanOrEqual(3);

    // Verify total amounts match
    const totalSettled = result.reduce((sum, s) =>
      sum + parseFloat(s.amount), 0
    );
    expect(totalSettled).toBeCloseTo(100); // 75 + 25 = 100
  });
});
```

---

## Appendix: Technology Alternatives Considered

| Decision | Chosen | Alternatives Considered | Rejection Reason |
|----------|--------|------------------------|------------------|
| Frontend Framework | Next.js | Plain React, Vue.js, Angular | Next.js provides SSR, routing, and optimization out of the box |
| Backend Framework | Express.js | Fastify, NestJS, Koa | Express is standard, well-documented, and sufficient for MVP |
| Database | PostgreSQL | MySQL, MongoDB | Postgres has superior features for financial data and complex queries |
| ORM | Prisma | TypeORM, Sequelize, Knex | Prisma offers best TypeScript integration and DX |
| Auth Method | Custom JWT | Firebase Auth, Auth0, Clerk | Custom provides full control and no vendor lock-in for MVP |
| Hosting (Frontend) | Vercel | Netlify, AWS Amplify | Vercel is made for Next.js, best integration |
| Hosting (Backend) | Railway | Render, Heroku, Fly.io | Railway's free tier and simplicity ideal for MVP |
| State Management | React Query + Context | Redux, Zustand, MobX | React Query handles server state excellently, Context for UI state |
| Styling | TBD | Tailwind, CSS Modules, Styled Components | Team preference, all are viable |
| Testing | Jest + Supertest | Vitest, Mocha, Cypress | Jest is standard, Supertest perfect for API testing |
| CI/CD | GitHub Actions | GitLab CI, CircleCI | GitHub Actions is free and integrated with GitHub |

---

**Document End**

This architecture provides a solid foundation for building a scalable, maintainable expense-sharing application. All decisions prioritize simplicity for MVP while maintaining flexibility for future enhancements.
