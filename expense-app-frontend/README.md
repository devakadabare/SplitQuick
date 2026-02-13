# SplitQuick Frontend

Frontend application for SplitQuick - The ACTUALLY Free Splitwise Alternative

## Features

- Beautiful purple-gray-white themed UI
- Lightning-fast expense entry (< 10 seconds target)
- Balance-first dashboard
- Real-time data with React Query
- Responsive design for mobile and desktop
- Guest-friendly interface

## Tech Stack

- **Framework**: Next.js 13+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: TanStack React Query
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Forms**: React Hook Form (ready to use)
- **Validation**: Zod (ready to use)

## Prerequisites

- Node.js 18 or higher
- Backend API running on http://localhost:4000

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Create environment file (already created):
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:4000
```

3. Start development server:
```bash
npm run dev
```

The app will be available at http://localhost:3000

## Project Structure

```
expense-app-frontend/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── login/page.tsx           # Login page
│   ├── register/page.tsx        # Register page
│   ├── dashboard/page.tsx       # Dashboard (groups list)
│   ├── groups/[id]/page.tsx     # Group detail (TODO)
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles + theme
├── components/                   # Reusable components (TODO)
├── hooks/
│   ├── useGroups.ts             # Group data hooks
│   ├── useExpenses.ts           # Expense data hooks
│   └── useSettlements.ts        # Settlement data hooks
├── lib/
│   ├── api.ts                   # Axios client
│   └── auth.ts                  # Auth service
├── providers/
│   └── query-provider.tsx       # React Query provider
├── types/
│   └── index.ts                 # TypeScript types
└── .env.local                   # Environment variables
```

## Available Pages

### ✅ Completed
- **/** - Landing page with marketing copy
- **/login** - User login
- **/register** - User registration
- **/dashboard** - Groups list

### 🚧 TODO
- **/groups/[id]** - Group detail with balances and expenses
- **/groups/[id]/settings** - Group settings

## Theme

### Colors

The app uses a purple-gray-white color scheme:

```css
/* Primary Purple */
--primary: #8b5cf6
--primary-hover: #7c3aed
--primary-light: #a78bfa
--primary-dark: #6d28d9

/* Gray Scale */
--gray-50: #f9fafb
--gray-100: #f3f4f6
--gray-200: #e5e7eb
...
--gray-900: #111827

/* Status Colors */
--success: #10b981 (green)
--warning: #f59e0b (orange)
--error: #ef4444 (red)
--info: #3b82f6 (blue)
```

### Utility Classes

Pre-defined classes in `globals.css`:

```css
.btn-primary       /* Purple button */
.btn-secondary     /* Gray button */
.card              /* White card with border */
.input             /* Form input */
```

## API Integration

### Authentication

```typescript
import authService from '@/lib/auth';

// Register
await authService.register(name, email, password);

// Login
await authService.login(email, password);

// Get current user
const user = authService.getUser();

// Logout
authService.logout();
```

### Data Fetching with React Query

```typescript
import { useGroups, useCreateGroup } from '@/hooks/useGroups';
import { useExpenses, useCreateExpense } from '@/hooks/useExpenses';
import { useSimplifiedSettlements } from '@/hooks/useSettlements';

// Get groups
const { data: groups, isLoading } = useGroups();

// Create group
const createGroup = useCreateGroup();
await createGroup.mutateAsync({ name: 'Trip', currency: 'USD' });

// Get balances
const { data: balances } = useBalances(groupId);

// Get simplified settlements
const { data: settlements } = useSimplifiedSettlements(groupId);
```

## Development

### Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

## Next Steps

### Immediate TODO

1. **Group Detail Page** (`app/groups/[id]/page.tsx`)
   - Show group balances (balance-first)
   - Quick Add expense form
   - Expense history list
   - Member list
   - Simplified settlements view

2. **Quick Add Component** (`components/QuickAddExpense.tsx`)
   - Amount input
   - Paid by selector
   - Participants selector (equal split)
   - Submit in < 10 seconds

## Design Principles

1. **Speed First**: Target < 10 seconds to add expense
2. **Balance-First**: Show current state, not transaction history
3. **Guest Friendly**: No signup required to view
4. **Mobile Optimized**: Touch-friendly, responsive
5. **Clean UI**: Minimal, focused, no clutter

## Testing

### Manual Testing Checklist

- [ ] Register new account
- [ ] Login with credentials
- [ ] Create a group
- [ ] View dashboard with groups
- [ ] Navigate to group detail
- [ ] Add expense
- [ ] View balances
- [ ] View simplified settlements
- [ ] Record payment
- [ ] Logout

## License

MIT
