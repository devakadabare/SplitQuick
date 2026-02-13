# Statement of Work: Expense Sharing Web Application

**Project Name:** Expense Sharing Application (Splitwise Alternative)
**Document Version:** 1.0
**Date:** 2026-02-09
**Author:** Devaka

---

## Executive Summary

This document outlines the scope, features, and implementation approach for building a web-based expense management application that enables friends to track shared expenses, split costs, and settle debts efficiently. The application will simplify the complexity of group finances through intelligent debt consolidation and transparent record-keeping.

---

## Project Vision

Create a user-friendly expense-sharing platform that:
- Makes expense tracking effortless and transparent
- Simplifies complex multi-person debt settlements into minimal transactions
- Maintains complete financial history for accountability
- Supports both active users and guest participants
- Provides manual settlement tracking without payment processing complexity

---

## MVP Scope (Phase 1)

### Core Features

#### 1. User Management
**Feature:** User Registration & Authentication
- **Description:** Custom authentication system with email/password
- **Functionality:**
  - User registration with email verification
  - Secure login with JWT tokens (24-hour expiry)
  - Password hashing with bcrypt
  - Password reset via email
  - User profile management (name, email, profile photo optional)
  - Email-based notifications for critical actions
- **Reasoning:** Custom auth provides full control and no vendor lock-in, suitable for MVP with potential to migrate to third-party later if needed

#### 2. Group Management
**Feature:** Create and Manage Expense Groups
- **Description:** Users can create groups to track shared expenses with friends
- **Functionality:**
  - Create unlimited groups with custom names
  - Set single currency per group at creation (USD, EUR, LKR, etc.)
  - Two-tier role system:
    - **Admin Role:** Group creator; can invite/remove members, edit settings, delete group
    - **Member Role:** Can add expenses, settle debts, view all data
  - Email-based invitations to join groups
  - Guest user support: Invited users appear in group even if not registered
  - Group settings: Name, currency (editable only if no expenses exist)
  - Soft delete for groups (preserves data)
- **Reasoning:** Admin/member distinction provides necessary governance without over-complicating permissions. Guest users reduce friction for group participation.

#### 3. Expense Recording
**Feature:** Add and Track Shared Expenses
- **Description:** Record expenses with flexible splitting options
- **Functionality:**
  - **Required Fields:**
    - Title (e.g., "Dinner at Restaurant")
    - Amount (with 2 decimal precision)
    - Who paid
    - Split method selection
  - **Optional Fields:**
    - Description/notes (context about payment)
    - Category (Food, Transport, Accommodation, Utilities, Entertainment, Other)
    - Date (defaults to today)
  - **Split Methods:**
    - Equal split among all group members
    - Equal split among selected members only
    - Percentage-based split (e.g., 50%-30%-20%)
    - Custom amounts per person (future enhancement)
  - **Expense Management:**
    - Soft delete (only creator or admin can delete)
    - No editing after creation (use correction expenses instead)
    - "Deleted" expenses appear grayed out with option to show/hide
    - Complete expense history preserved
- **Reasoning:** Mandatory title prevents confusion. Soft delete maintains audit trail for financial records. Multiple split methods cover 90% of real-world scenarios.

#### 4. Balance Tracking
**Feature:** Real-Time Balance Calculation and Visualization
- **Description:** Automatic calculation of who owes whom
- **Functionality:**
  - Per-person net balance calculation
  - Group-level balance overview
  - User-wise balance views (see what you owe/are owed)
  - Balance history showing how debts evolved
  - Both "all transactions" view and "simplified" view
- **Reasoning:** Transparent balance tracking builds trust and prevents disputes

#### 5. Settlement Simplification
**Feature:** Intelligent Debt Consolidation
- **Description:** Reduce complex multi-person debts to minimum transactions
- **Functionality:**
  - **On-Demand Simplification:** User clicks "Simplify Balances" when ready
  - **Algorithm:** Greedy debt settlement algorithm
    - Calculates net balance per person
    - Matches largest creditors with largest debtors
    - Produces minimum number of settlement transactions
  - **Example:** Instead of A→B, B→A, C→A, C→B (4 transactions), shows C→B only (1 transaction)
  - **Optional Feature:** Users can choose to simplify or view raw transactions
  - **Preserves History:** Simplification doesn't alter original expense records
- **Reasoning:** Minimizing transactions reduces friction and makes settlements practical. Optional nature lets users understand both detailed and simplified views.

#### 6. Settlement Recording
**Feature:** Manual Payment Tracking with Verification
- **Description:** Record when debts are paid, with flexible confirmation flows
- **Functionality:**
  - **Two Settlement Modes:**
    - **Debtor-Initiated (Two-Way Confirmation):**
      - C records "I paid B 1000"
      - Status: Pending B's confirmation
      - B receives notification to confirm
      - Once confirmed, debt updates
    - **Creditor-Initiated (One-Way Confirmation):**
      - A records "B paid me 1000"
      - No confirmation needed (creditor is source of truth)
      - Debt auto-settles
      - Especially useful for guest users who can't confirm
  - **Partial Payments:** Support incremental payments (e.g., C pays B 2000 of 3000 owed, remainder stays as active debt)
  - **Payment Notes:** Optional context ("Paid via bank transfer", "Cash at coffee shop")
  - **Settlement History:** Complete log of who recorded what payment and when
  - **No Duplicate Detection:** MVP doesn't prevent duplicate entries (users responsible)
  - **No Undo:** Mistakes corrected via new expense (e.g., "Correction - B overpaid: 1000")
- **Reasoning:** Two-mode system balances verification needs with practical usability. Creditor override prevents guest users from blocking settlements. Partial payments reflect real-world payment behavior.

#### 7. History & Reporting
**Feature:** Multi-Level Activity Tracking
- **Description:** Comprehensive view of all financial activity
- **Functionality:**
  - **Group-Level History:** Chronological feed of expenses and settlements
  - **User-Wise History:** Filter to see transactions between specific people
  - **Activity Timeline:** Mix of expenses ("A added Dinner - 3000") and settlements ("B confirmed payment to C")
  - **Expense Details View:** Click any expense to see full breakdown
  - **Search & Filters:**
    - Date range
    - Category
    - Person involved
    - Amount range
    - Keyword search in titles/notes
- **Reasoning:** Transparent history prevents disputes and helps users understand their financial relationships.

#### 8. Dashboard Views
**Feature:** At-a-Glance Financial Overview
- **Description:** Summary views for quick understanding
- **Functionality:**
  - **Personal Dashboard (Home Page):**
    - All groups I'm in
    - Total I owe across all groups
    - Total owed to me across all groups
    - Recent activity feed across groups
  - **Group Dashboard:**
    - Total group spending
    - Per-person spending breakdown
    - Current balances (who owes whom)
    - Quick actions: Add Expense, Simplify Balances, Settle Up
- **Reasoning:** Dashboard reduces cognitive load by surfacing key information immediately.

#### 9. Notification System
**Feature:** Email Notifications for Critical Actions
- **Description:** Keep users informed via email (no in-app notifications for MVP)
- **Functionality:**
  - **Critical Notifications:**
    - Payment confirmation request: "B says they paid you 1000 - please confirm"
    - Group invitation: "A invited you to 'Weekend Trip' group"
  - **Important Notifications:**
    - New expense in group: "A added expense: Dinner - 3000"
    - Payment confirmed: "B confirmed your payment of 1000"
  - **Email-Only:** No in-app notification center for MVP
  - **User Preferences:** Basic on/off toggles for notification types
- **Reasoning:** Email ensures reach without requiring users to actively check app. Simpler than building in-app notification system for MVP.

---

## Future Enhancements (Post-MVP)

### Phase 2: Enhanced Features

#### 1. Custom Split Amounts
- Allow exact amount entry per person (not just equal/percentage)
- Handle uneven splits with rounding
- **Reasoning:** Covers edge cases but adds complexity to UI/UX

#### 2. Receipt Photo Upload
- Attach photos to expenses for record-keeping
- File storage integration (Cloudinary/S3)
- Image preview in expense details
- **Reasoning:** Visual proof reduces disputes but requires storage infrastructure

#### 3. Expense Editing
- Allow expense modification with constraints
- Show "edited" flag and edit history
- Prevent editing if settlements already based on it
- **Reasoning:** User-friendly but complex to implement correctly without breaking settlement integrity

#### 4. In-App Notifications
- Notification center within application
- Real-time updates via WebSockets or polling
- Read/unread status
- **Reasoning:** Better UX but requires real-time infrastructure

#### 5. Multi-Currency Support
- Each expense can have different currency
- Automatic conversion at time of entry
- Historical exchange rate tracking
- **Reasoning:** Useful for international groups but adds significant complexity to calculations

#### 6. Payment Gateway Integration
- Direct payment via Venmo/PayPal/Stripe
- One-click settlement from app
- Automatic settlement recording
- **Reasoning:** Convenience but requires payment processing compliance and fees

#### 7. Advanced Analytics
- Spending trends over time
- Category-based insights
- Export reports (CSV/PDF)
- Spending by person/category visualizations
- **Reasoning:** Power user feature, not critical for core functionality

#### 8. Recurring Expenses
- Set up repeating expenses (monthly rent, weekly groceries)
- Automatic creation on schedule
- **Reasoning:** Convenience for predictable expenses

#### 9. Comments & Discussions
- Comment thread per expense
- Discuss split amounts or clarify purchases
- **Reasoning:** Facilitates communication but requires moderation strategy

#### 10. Mobile Apps
- Native iOS and Android apps
- Reuse existing backend API
- Push notifications on mobile
- **Reasoning:** Mobile-first usage but requires additional development resources

#### 11. Split Strategies
- Multiple simplification algorithms (user choice)
- "Avoid certain people" constraints in settlement routing
- Round number preferences
- **Reasoning:** Advanced optimization for complex social dynamics

#### 12. Multi-Admin Support
- Multiple admins per group
- Admin transfer and succession planning
- **Reasoning:** Useful for large groups but adds permission complexity

---

## Out of Scope

The following are explicitly NOT included in any planned phase:

1. **Social Features:** Friend lists, user profiles beyond basic info, activity feeds beyond group context
2. **Marketplace/Shopping:** No e-commerce features or purchasing within app
3. **Budgeting Tools:** No personal finance management or budget planning
4. **Investment Tracking:** Not a financial portfolio manager
5. **Tax Reporting:** No tax calculation or filing support
6. **Business Expense Reports:** Focused on friend groups, not corporate reimbursement
7. **Cryptocurrency Payments:** Fiat currency only
8. **Offline Mode:** Requires internet connection
9. **Third-Party Integrations:** No Slack/Discord/other platform integrations initially

---

## Key Design Decisions & Rationale

### 1. Manual Settlement Tracking (No Payment Processing)
**Decision:** Application records settlements but doesn't process actual payments
**Rationale:**
- Avoids payment gateway integration complexity and fees
- No PCI compliance requirements
- Users already have preferred payment methods (Venmo, cash, bank transfer)
- Reduces regulatory burden for MVP
- Can add payment integration later if users demand it

### 2. Soft Delete Architecture
**Decision:** Never hard-delete financial records; mark as deleted instead
**Rationale:**
- Financial audit trail must be preserved
- Prevents broken references if settlements already exist
- Enables "undo" functionality later
- Maintains data integrity
- Industry best practice for financial applications

### 3. Single Currency Per Group
**Decision:** Each group has one currency set at creation
**Rationale:**
- Eliminates exchange rate complexity for MVP
- Fits 90% of use cases (domestic friend groups)
- Simplifies all calculations and display logic
- Multi-currency can be added later for international groups

### 4. Guest User System
**Decision:** Allow tracking expenses for people who haven't signed up
**Rationale:**
- Removes friction to start using app
- Not everyone wants to create an account immediately
- Common scenario: One person tracks, others participate casually
- Guest data connects automatically if they later register with that email

### 5. Greedy Algorithm for Settlement
**Decision:** Use greedy debt matching rather than complex graph optimization
**Rationale:**
- Produces near-optimal results (often optimal) for typical group sizes
- Simple to implement and debug (~50 lines of code)
- Fast execution (instant for groups <1000 people)
- Deterministic output (predictable for users)
- Complex algorithms offer minimal improvement for significantly higher complexity

### 6. Dual Confirmation Modes
**Decision:** Two-way confirmation when debtor pays, one-way when creditor records
**Rationale:**
- Balances verification needs with practical usability
- Prevents guest users from blocking settlements
- Person receiving money is source of truth
- Reduces friction while maintaining accountability

### 7. Optional Expense Categorization
**Decision:** Categories are optional, not required
**Rationale:**
- Keeps entry flow simple for casual users
- Power users get reporting insights
- Doesn't force users into categorization decisions when they just want to log an expense quickly

---

## Success Metrics

### MVP Success Criteria
- Users can create groups and invite friends
- Expenses can be recorded with multiple split methods
- Balance calculations are accurate
- Settlement simplification works correctly
- Payment recording and confirmation flows are intuitive
- Email notifications are delivered reliably
- Application is stable with no data loss

### User Experience Goals
- Add expense in <30 seconds
- Settlement simplification reduces transactions by 50%+ in typical scenarios
- Users understand what they owe without explanation
- Zero learning curve for basic operations

### Technical Goals
- API response time <200ms for 95th percentile
- Zero data loss or corruption
- 99.5% uptime
- Support 100 concurrent users initially
- Database queries optimized with proper indexing

---

## Risk Mitigation

### Financial Data Integrity
**Risk:** Calculation errors or data loss with financial records
**Mitigation:**
- Comprehensive unit tests for settlement algorithm
- PostgreSQL ACID transactions
- Soft delete only (never destroy data)
- Regular automated backups
- Extensive logging of financial operations

### User Disputes
**Risk:** Users disagree about expenses or settlements
**Mitigation:**
- Complete audit trail of who added/modified what
- Settlement confirmation flows
- Transparent history views
- Notes/context on expenses and payments

### Guest User Confusion
**Risk:** Guest users don't understand their status or can't access data
**Mitigation:**
- Clear invitation emails explaining guest vs. registered status
- Persistent invitation links
- Automatic data connection on registration
- Admin can manage guest users

### Performance Degradation
**Risk:** App slows down as groups accumulate expenses
**Mitigation:**
- Database indexing strategy
- Pagination for large lists
- Caching strategy (React Query)
- Query optimization monitoring

---

## Next Steps

1. **Technical Architecture Document:** Detailed technical decisions and implementation approach (separate document)
2. **Database Schema Design:** Complete data model with relationships
3. **API Specification:** Detailed endpoint definitions
4. **UI/UX Wireframes:** Screen designs and user flows
5. **Development Roadmap:** Sprint planning and milestones
6. **Testing Strategy:** Test cases and quality assurance approach

---

## Appendix: Feature Comparison

| Feature | MVP (Phase 1) | Future Enhancement |
|---------|---------------|-------------------|
| User Registration | ✅ Email/Password | Social login (Google, etc.) |
| Group Creation | ✅ Unlimited groups | Group templates, categories |
| Expense Entry | ✅ Title, amount, split | Receipt photos, voice input |
| Split Methods | ✅ Equal, percentage | ✅ Custom amounts |
| Settlement | ✅ Manual tracking | Payment gateway integration |
| Notifications | ✅ Email only | In-app + push notifications |
| Currency | ✅ Single per group | Multi-currency with conversion |
| History | ✅ Full audit trail | Advanced analytics & reports |
| Editing | ❌ No editing | Expense modification with history |
| Mobile | ✅ Responsive web | Native iOS/Android apps |
| Real-time | ❌ Refresh required | WebSocket live updates |
| Categories | ✅ Optional | Smart auto-categorization |
| Recurring | ❌ | Scheduled recurring expenses |

---

**Document End**
