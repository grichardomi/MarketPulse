# Pricing Features Implementation

This document details the implementation of tier-based features for MarketPulse: **history retention**, **priority support**, and **dedicated support**.

## ✅ Implemented Features

### 1. History Retention (30-day, 90-day, Unlimited)

**What it does:** Restricts historical data access based on subscription tier.

**Implementation:**

#### Configuration (`lib/config/pricing.ts`)
- Added `historyRetentionDays` property to `PricingTier` interface
- **Starter Plan:** 30 days
- **Professional Plan:** 90 days
- **Enterprise Plan:** Unlimited (`null`)
- Helper function: `getHistoryRetentionDays(priceId)`

#### Backend Enforcement
**Files modified:**
- `app/api/competitors/[id]/route.ts` - Filters snapshots by retention period
- `app/api/competitors/[id]/snapshots/route.ts` - Filters all snapshot queries

**How it works:**
1. Fetches user's subscription
2. Calculates cutoff date based on `historyRetentionDays`
3. Applies date filter to all `PriceSnapshot` queries
4. Only returns data within the allowed retention window

**Example:**
```typescript
// Starter user (30 days) on Jan 15, 2026
// Can only see snapshots from Dec 16, 2025 onwards
const cutoffDate = new Date('2025-12-16');
const snapshots = await db.priceSnapshot.findMany({
  where: {
    competitorId: id,
    detectedAt: { gte: cutoffDate }
  }
});
```

---

### 2. Support System (Priority & Dedicated)

**What it does:** Provides a ticketing system with automatic priority assignment based on subscription tier.

**Implementation:**

#### Database Schema (`prisma/schema.prisma`)
New models:
- **SupportTicket:** Stores support requests with status, priority, category
- **SupportTicketMessage:** Threaded conversation for each ticket

Priority levels:
- `standard` - Free & Starter tier
- `priority` - Professional tier (24hr SLA)
- `dedicated` - Enterprise tier (4hr SLA)

#### API Endpoints

**`/api/support/tickets`**
- `GET` - List all user tickets
- `POST` - Create new ticket (auto-assigns priority based on subscription)

**`/api/support/tickets/[id]`**
- `GET` - View ticket with all messages
- `PATCH` - Update ticket status (users can only close)

**`/api/support/tickets/[id]/messages`**
- `POST` - Add message to ticket (reopens if resolved/closed)

#### Priority Assignment Logic
```typescript
const subscription = await db.subscription.findFirst({
  where: { userId }
});

const supportTier = subscription
  ? getSupportTier(subscription.stripePriceId)
  : 'standard';

// Automatically set on ticket creation
await db.supportTicket.create({
  data: {
    priority: supportTier, // 'standard', 'priority', or 'dedicated'
    ...
  }
});
```

#### Email Notifications
**Template:** `emails/support-ticket-created.tsx`
- Sent to all admin users when ticket is created
- Color-coded by priority (blue/orange/purple)
- Shows urgency for priority/dedicated customers
- Links directly to admin ticket view

**Notification Flow:**
1. User creates ticket
2. System determines priority from subscription
3. Queues email to all admins via `EmailQueue`
4. Email worker processes and sends notifications

#### User Interface

**`/dashboard/support`** - Ticket list
- Shows all user tickets
- Status badges (open, in_progress, resolved, closed)
- Priority badges for priority/dedicated support
- Message count and timestamps

**`/dashboard/support/new`** - Create ticket
- Category selection (technical, billing, feature_request, other)
- Subject and description fields
- Automatic priority assignment (transparent to user)

**`/dashboard/support/[id]`** - Ticket detail
- Full conversation thread
- Reply functionality
- Close ticket button
- Admin responses highlighted differently
- Auto-reopens when user replies to resolved ticket

**Navigation:** Added "Support" link to main dashboard navigation

---

## Configuration Reference

### Pricing Plans (`lib/config/pricing.ts`)

```typescript
export const PRICING_PLANS = {
  starter: {
    historyRetentionDays: 30,
    supportTier: 'standard',
    competitorLimit: 5,
    // ...
  },
  professional: {
    historyRetentionDays: 90,
    supportTier: 'priority',
    competitorLimit: 15,
    // ...
  },
  enterprise: {
    historyRetentionDays: null, // unlimited
    supportTier: 'dedicated',
    competitorLimit: 50,
    // ...
  }
};
```

---

## Helper Functions

### `getHistoryRetentionDays(priceId: string)`
Returns the number of days of history retention for a given Stripe price ID.
- Returns `number` for limited retention
- Returns `null` for unlimited retention
- Defaults to 30 days if price ID not found

### `getSupportTier(priceId: string)`
Returns the support tier for a given Stripe price ID.
- Returns `'standard' | 'priority' | 'dedicated'`
- Defaults to `'standard'` if not found

---

## Testing Checklist

### History Retention
- [ ] Starter user can only see last 30 days of snapshots
- [ ] Professional user can see last 90 days of snapshots
- [ ] Enterprise user can see unlimited history
- [ ] Trial users get 30-day history
- [ ] Upgrading plan immediately expands history access
- [ ] Downgrading plan immediately restricts history

### Support System
- [ ] Starter user creates ticket → priority = 'standard'
- [ ] Professional user creates ticket → priority = 'priority'
- [ ] Enterprise user creates ticket → priority = 'dedicated'
- [ ] Admin users receive email notification for new tickets
- [ ] Email shows correct priority badge and urgency message
- [ ] Users can view all their tickets
- [ ] Users can reply to tickets
- [ ] Users can close their own tickets
- [ ] Replying to resolved ticket reopens it
- [ ] Closed tickets show read-only state

---

## ✅ Admin Support Dashboard (COMPLETED)

The complete admin support system has been implemented with all features:

1. **Admin Support Dashboard** (`/admin/support`) ✅
   - View all tickets across all users
   - Filter by status, priority, user
   - Real-time statistics (Total, Open, In Progress, Urgent)
   - Sort by status, priority, and update date
   - Highlight urgent priority/dedicated tickets

2. **Admin Ticket Response** (`/admin/support/[id]`) ✅
   - View full ticket conversation
   - Reply as admin (`isAdminResponse: true`)
   - Change ticket status (open → in_progress → resolved → closed)
   - View customer subscription tier and plan details
   - SLA alert panel for priority/dedicated customers
   - Customer information sidebar

3. **Email Notifications** ✅
   - Admin notification when ticket created (`support-ticket-created.tsx`)
   - User notification when admin responds (`support-ticket-response.tsx`)
   - Priority-based urgency messages
   - Direct links to ticket pages

4. **Security & Access Control** ✅
   - Admin-only endpoints with role verification
   - Proper authentication checks
   - 401/403 error handling

See **[ADMIN_SUPPORT_DASHBOARD.md](./ADMIN_SUPPORT_DASHBOARD.md)** for complete documentation.

---

## Database Schema

```prisma
model SupportTicket {
  id           Int       @id @default(autoincrement())
  userId       Int
  subject      String
  description  String
  status       String    @default("open")
  priority     String    @default("standard")
  category     String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  resolvedAt   DateTime?
  User         User      @relation(...)
  messages     SupportTicketMessage[]
}

model SupportTicketMessage {
  id              Int           @id @default(autoincrement())
  ticketId        Int
  userId          Int?
  isAdminResponse Boolean       @default(false)
  message         String
  createdAt       DateTime      @default(now())
  Ticket          SupportTicket @relation(...)
}
```

---

## Files Modified/Created

### Configuration
- ✏️ `lib/config/pricing.ts` - Added history retention and support tier configs

### Backend - History Retention
- ✏️ `app/api/competitors/[id]/route.ts` - Filter snapshots by retention period
- ✏️ `app/api/competitors/[id]/snapshots/route.ts` - Filter all snapshot queries

### Backend - User Support System
- ✨ `app/api/support/tickets/route.ts` - List and create tickets
- ✨ `app/api/support/tickets/[id]/route.ts` - View and update tickets
- ✨ `app/api/support/tickets/[id]/messages/route.ts` - Add messages

### Backend - Admin Support System
- ✨ `app/api/admin/support/tickets/route.ts` - Admin list all tickets with filters
- ✨ `app/api/admin/support/tickets/[id]/route.ts` - Admin view and update ticket
- ✨ `app/api/admin/support/tickets/[id]/messages/route.ts` - Admin responses

### Frontend - User Support
- ✨ `app/dashboard/support/page.tsx` - User ticket list page
- ✨ `app/dashboard/support/new/page.tsx` - Create ticket form
- ✨ `app/dashboard/support/[id]/page.tsx` - Ticket detail and conversation
- ✏️ `components/Header.tsx` - Added Support link to user navigation

### Frontend - Admin Support
- ✨ `app/admin/support/page.tsx` - Admin dashboard with filters and stats
- ✨ `app/admin/support/[id]/page.tsx` - Admin ticket detail with response form
- ✏️ `app/admin/layout.tsx` - Added Support link to admin navigation

### Database
- ✏️ `prisma/schema.prisma` - Added SupportTicket and SupportTicketMessage models

### Email Templates
- ✨ `emails/support-ticket-created.tsx` - Admin notification template
- ✨ `emails/support-ticket-response.tsx` - User notification template

### Documentation
- ✨ `PRICING_FEATURES_IMPLEMENTATION.md` - Complete feature documentation
- ✨ `ADMIN_SUPPORT_DASHBOARD.md` - Admin system documentation

**Legend:**
- ✨ Created new file
- ✏️ Modified existing file

---

## Summary

All three pricing features are now fully implemented and functional:

1. **✅ History Retention** - Enforced at API level, users only see data within their plan's retention window
2. **✅ Priority Support** - Professional users get priority queue with 24hr SLA expectation
3. **✅ Dedicated Support** - Enterprise users get dedicated queue with 4hr SLA expectation

The implementation follows best practices:
- Configuration centralized in `lib/config/pricing.ts`
- Enforcement at API level (not client-side)
- Automatic tier detection from subscription
- Email notifications for support team
- User-friendly UI with clear priority indicators
- Scalable architecture ready for admin features
