# Test Support Tickets - Demo Data

## Overview
Created 7 realistic test support tickets to demonstrate the support system functionality.

## What Was Created

### Tickets by Status:
- **2 Open** (1 standard, 1 dedicated urgent)
- **2 In Progress** (1 priority, 1 dedicated)
- **1 Resolved** (with conversation)
- **1 Closed** (with conversation)
- **1 Open Feature Request** (priority)

### Tickets by Priority:
- **3 Standard** (Free/Starter tier)
- **3 Priority** (Professional tier)
- **1 Dedicated** (Enterprise tier - URGENT)

### Tickets Include:
1. **Unable to add competitor website** - Open, Standard, Technical
2. **Billing upgrade question** - In Progress, Priority, Billing (with admin response)
3. **URGENT: Price alerts not working** - Open, Dedicated, Technical (CRITICAL)
4. **Export data question** - Resolved, Standard, Other (full conversation)
5. **Slack integration request** - Open, Priority, Feature Request
6. **Password reset issue** - Closed, Standard, Technical (full conversation)
7. **API setup assistance** - In Progress, Dedicated, Technical (with admin response)

## How to Run

### Option 1: TypeScript Script (Recommended)
```bash
npx tsx scripts/seed-support-tickets.ts
```

### Option 2: SQL Script
```bash
psql $DATABASE_URL -f scripts/create-test-support-tickets.sql
```

## View the Tickets

### User View
Navigate to: `/dashboard/support`
- Users can only see their own tickets

### Admin View
Navigate to: `/admin/support`
- Admins see all tickets with filters
- Statistics dashboard
- Full customer context

## Test Scenarios

### For Admin Testing:
1. **Filter by Priority** - See urgent dedicated tickets first
2. **Filter by Status** - View only open tickets needing response
3. **SLA Testing** - Notice urgent alerts for dedicated/priority
4. **Response Flow** - Reply to open tickets, status changes to "in_progress"
5. **Customer Context** - View subscription tier before responding

### For User Testing:
1. **Create New Ticket** - `/dashboard/support/new`
2. **View Own Tickets** - See only personal tickets
3. **Reply to Ticket** - Add messages to conversation
4. **Close Ticket** - Mark ticket as closed

## Cleanup

To remove all test tickets:
```sql
DELETE FROM "SupportTicketMessage" WHERE "ticketId" IN (SELECT id FROM "SupportTicket" WHERE subject LIKE '%test%' OR subject LIKE '%URGENT%');
DELETE FROM "SupportTicket" WHERE subject LIKE '%test%' OR subject LIKE '%URGENT%';
```

Or delete specific tickets:
```sql
DELETE FROM "SupportTicket" WHERE id IN (1, 2, 3, 4, 5, 6, 7);
```

## Features Demonstrated

✅ Different priority levels (standard, priority, dedicated)
✅ Different statuses (open, in_progress, resolved, closed)
✅ Conversation threads (user + admin messages)
✅ Various categories (technical, billing, feature_request, other)
✅ Realistic timestamps (2 hours ago, 1 day ago, etc.)
✅ Urgent tickets with critical business impact
✅ Feature requests from customers
✅ Resolved conversations showing problem resolution

## Next Steps

1. Navigate to `/admin/support` to see the dashboard
2. Try filtering by status or priority
3. Click into any ticket to see the conversation
4. Add admin responses to open tickets
5. Change ticket statuses
6. Check email notifications (if email worker is running)

Enjoy the demo! 🎉
