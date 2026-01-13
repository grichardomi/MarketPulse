# Admin Support Dashboard

Complete documentation for the Admin Support Ticket System.

## Overview

The Admin Support Dashboard allows administrators to:
- View all support tickets from all customers
- Filter tickets by status and priority
- View customer subscription details
- Respond to tickets with automatic email notifications
- Change ticket status (open → in_progress → resolved → closed)
- Monitor SLA requirements for priority/dedicated support

---

## Features

### 1. Support Dashboard (`/admin/support`)

**Statistics Panel:**
- Total Tickets count
- Open Tickets count
- In Progress Tickets count
- Urgent Tickets count (Priority + Dedicated, not closed/resolved)

**Filtering:**
- Filter by Status: All, Open, In Progress, Resolved, Closed
- Filter by Priority: All, Dedicated, Priority, Standard
- Clear Filters button

**Ticket List Table:**
Displays:
- Ticket ID
- Subject & Category
- Customer Name, Email, and Plan
- Priority Badge (color-coded)
- Status Badge (color-coded)
- Message Count
- Last Updated Time
- View Action Link

**Sorting:**
Tickets are automatically sorted by:
1. Status (Open tickets first)
2. Priority (Dedicated/Priority first)
3. Updated date (Most recent first)

---

### 2. Ticket Detail Page (`/admin/support/[id]`)

**Main Content:**
- Full ticket conversation thread
- Original message from customer
- All follow-up messages (user + admin)
- Admin responses highlighted in green
- User messages in blue
- Timestamps for all messages

**Admin Response Form:**
- Rich textarea for composing responses
- Send button (disabled when empty)
- Automatic status change to "in_progress" on first response
- Automatic email notification to customer

**Status Actions Panel:**
Quick action buttons:
- Mark In Progress (if not already)
- Mark Resolved
- Close Ticket
- Buttons disabled while updating

**Customer Info Panel:**
Displays:
- Customer Name
- Email Address
- Account Creation Date
- Subscription Plan (Free Trial, Starter, Professional, Enterprise)
- Subscription Status (trialing, active, etc.)
- Support Tier (Standard, Priority, Dedicated)

**SLA Alert Panel:**
Shows for Priority/Dedicated tickets:
- Purple badge for Dedicated: "4-hour response time expected"
- Orange badge for Priority: "24-hour response time expected"

---

## API Endpoints

### Admin Tickets List
```
GET /api/admin/support/tickets
Query Parameters:
  - status: open | in_progress | resolved | closed
  - priority: standard | priority | dedicated
  - userId: number

Authorization: Admin only
Response: { tickets: Ticket[] }
```

### Admin Ticket Detail
```
GET /api/admin/support/tickets/[id]
Authorization: Admin only
Response: { ticket: TicketWithDetails }
```

### Admin Update Ticket
```
PATCH /api/admin/support/tickets/[id]
Body: { status: string }
Authorization: Admin only
Response: { ticket: UpdatedTicket }
```

### Admin Add Response
```
POST /api/admin/support/tickets/[id]/messages
Body: { message: string }
Authorization: Admin only
Response: { message: TicketMessage }

Side Effects:
- Creates admin response (isAdminResponse: true, userId: null)
- Updates ticket status to "in_progress" if status was "open"
- Queues email notification to customer
```

---

## Email Notifications

### Admin Notification (When Ticket Created)
**Template:** `emails/support-ticket-created.tsx`
**Sent to:** All admin users
**Contains:**
- Priority badge (color-coded by tier)
- Ticket ID, Subject, Category
- Customer name and email
- Full description
- SLA urgency message (for priority/dedicated)
- Direct link to admin ticket view

### User Notification (When Admin Responds)
**Template:** `emails/support-ticket-response.tsx`
**Sent to:** Ticket creator
**Contains:**
- Ticket ID and subject
- Admin's response message
- Direct link to view and reply
- Instruction to reply via dashboard

---

## Priority System

### Standard Support
- **Tiers:** Free Trial, Starter Plan
- **Badge:** Blue
- **SLA:** Best effort
- **Features:** Basic support, community resources

### Priority Support
- **Tier:** Professional Plan
- **Badge:** Orange
- **SLA:** 24-hour response time
- **Features:** Faster response, dedicated queue

### Dedicated Support
- **Tier:** Enterprise Plan
- **Badge:** Purple
- **SLA:** 4-hour response time
- **Features:** Highest priority, immediate attention

Priority is automatically assigned based on user's active subscription when ticket is created.

---

## Status Workflow

```
┌──────┐     First Admin     ┌─────────────┐
│ Open │ ──────Response─────→│ In Progress │
└──────┘                      └─────────────┘
                                     │
                                     │ Admin Marks
                                     ▼
                              ┌──────────┐
                              │ Resolved │
                              └──────────┘
                                     │
                                     │ Admin or User
                                     ▼
                              ┌────────┐
                              │ Closed │
                              └────────┘
```

**Notes:**
- Users can only close their own tickets
- Admins can change to any status
- Users replying to resolved/closed tickets reopens them to "open"
- Status "in_progress" automatically set when admin first responds

---

## Security

### Authentication
All admin endpoints require:
1. Valid session (`getServerSession`)
2. User account exists
3. User role is `admin`

Returns:
- `401 Unauthorized` - No valid session
- `403 Forbidden` - Not an admin user
- `404 Not Found` - Resource doesn't exist

### Authorization
- Admins can view ALL tickets (not filtered by userId)
- Regular users can only see their own tickets
- Email notifications only sent to ticket owner and admin users

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

  @@index([userId])
  @@index([status])
  @@index([priority])
}

model SupportTicketMessage {
  id              Int           @id @default(autoincrement())
  ticketId        Int
  userId          Int?          // null for admin responses
  isAdminResponse Boolean       @default(false)
  message         String
  createdAt       DateTime      @default(now())
  Ticket          SupportTicket @relation(...)

  @@index([ticketId])
}
```

---

## Files Created/Modified

### Backend - API Endpoints
- ✨ `app/api/admin/support/tickets/route.ts` - List all tickets with filters
- ✨ `app/api/admin/support/tickets/[id]/route.ts` - View and update ticket
- ✨ `app/api/admin/support/tickets/[id]/messages/route.ts` - Admin responses

### Frontend - Admin Pages
- ✨ `app/admin/support/page.tsx` - Dashboard with filters and statistics
- ✨ `app/admin/support/[id]/page.tsx` - Ticket detail with response form
- ✏️ `app/admin/layout.tsx` - Added Support link to navigation

### Email Templates
- ✨ `emails/support-ticket-response.tsx` - User notification template

**Legend:**
- ✨ Created new file
- ✏️ Modified existing file

---

## Usage Guide for Admins

### Responding to a Ticket

1. Navigate to `/admin/support`
2. Review statistics and urgent tickets count
3. Filter by priority to see Dedicated/Priority tickets first
4. Click "View" on a ticket
5. Review customer info and subscription tier
6. Note SLA requirement if priority/dedicated
7. Type response in the text area
8. Click "Send Response"
9. Response is sent, email notification queued, status updated

### Changing Ticket Status

1. Open ticket detail page
2. Use action buttons in sidebar:
   - **Mark In Progress** - When you start working on it
   - **Mark Resolved** - When issue is fixed
   - **Close Ticket** - When conversation is complete
3. Confirm the status change
4. Status updates immediately

### Best Practices

1. **Respond to Dedicated support within 4 hours**
2. **Respond to Priority support within 24 hours**
3. **Update ticket status** as you work on it
4. **Mark as Resolved** when issue is fixed (user can reopen if needed)
5. **Close tickets** only when conversation is truly complete
6. **Check customer plan** before responding (context matters)
7. **Review ticket history** before responding

---

## Monitoring & Metrics

### Dashboard Statistics

The dashboard shows real-time counts:
- **Total** - All tickets in system
- **Open** - New tickets awaiting response
- **In Progress** - Tickets being actively worked on
- **Urgent** - Priority/Dedicated tickets that aren't closed/resolved

### Suggested Metrics (Future Enhancement)

Consider tracking:
- Average response time by priority
- Average resolution time by priority
- SLA compliance rate
- Tickets per customer
- Response volume by admin
- Peak support hours

---

## Troubleshooting

### "Forbidden" Error
- User is not an admin
- Check user role in database: `SELECT role FROM "User" WHERE email = 'your@email.com'`
- Update if needed: `UPDATE "User" SET role = 'admin' WHERE email = 'your@email.com'`

### Email Not Sending
- Check email queue: `SELECT * FROM "EmailQueue" WHERE status = 'pending' ORDER BY "createdAt" DESC`
- Verify email worker is running
- Check email worker logs for errors

### Ticket Not Appearing
- Check filters are cleared
- Verify ticket exists in database
- Check admin authentication

### Status Not Updating
- Check browser console for errors
- Verify admin permissions
- Try refreshing the page

---

## Future Enhancements

### Potential Additions:
1. **Ticket Assignment** - Assign tickets to specific admin users
2. **Internal Notes** - Add private notes not visible to customers
3. **Saved Responses** - Template responses for common issues
4. **File Attachments** - Allow uploading screenshots/files
5. **Live Chat** - Real-time messaging for urgent issues
6. **Satisfaction Ratings** - Customer feedback on resolutions
7. **Knowledge Base Integration** - Suggest articles to customers
8. **Automated Responses** - Auto-reply for common questions
9. **Escalation Rules** - Auto-escalate if SLA approaching
10. **Support Analytics Dashboard** - Detailed metrics and reports

---

## Summary

The Admin Support Dashboard is a complete ticketing system with:
- ✅ Full CRUD operations for tickets
- ✅ Priority-based SLA tracking
- ✅ Automatic email notifications
- ✅ Customer subscription visibility
- ✅ Status workflow management
- ✅ Filtering and sorting
- ✅ Real-time statistics
- ✅ Secure admin-only access

All features are production-ready and integrated with the existing pricing tier system!
