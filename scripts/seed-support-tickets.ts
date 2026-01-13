/**
 * Script to create test support tickets for demo purposes
 * Run with: npx tsx scripts/seed-support-tickets.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎫 Creating test support tickets...\n');

  // Get test users
  const users = await prisma.user.findMany({
    where: { role: 'user' },
    take: 3,
  });

  if (users.length === 0) {
    console.error('❌ No users found. Please create users first.');
    return;
  }

  console.log(`✅ Found ${users.length} users\n`);

  // Test Ticket 1: Open - Standard Support
  const ticket1 = await prisma.supportTicket.create({
    data: {
      userId: users[0].id,
      subject: 'Unable to add competitor website',
      description: `Hi, I'm trying to add a competitor URL but I keep getting an error message saying "Failed to fetch competitor data". The website is definitely accessible in my browser. Could you help me troubleshoot this?

The URL I'm trying to add is: https://example-competitor.com

Thank you!`,
      status: 'open',
      priority: 'standard',
      category: 'technical',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
  });
  console.log(`✅ Created ticket #${ticket1.id}: ${ticket1.subject} (${ticket1.priority}, ${ticket1.status})`);

  // Test Ticket 2: In Progress - Priority Support with conversation
  const ticket2 = await prisma.supportTicket.create({
    data: {
      userId: users[1] ? users[1].id : users[0].id,
      subject: 'Billing question: Upgrade to Enterprise plan',
      description: `Hello,

I'm currently on the Professional plan and considering upgrading to Enterprise. I have a few questions:

1. Will my historical data be preserved?
2. Can I switch mid-billing cycle?
3. Will I get prorated charges?

Please advise. Thanks!`,
      status: 'in_progress',
      priority: 'priority',
      category: 'billing',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    },
  });
  console.log(`✅ Created ticket #${ticket2.id}: ${ticket2.subject} (${ticket2.priority}, ${ticket2.status})`);

  await prisma.supportTicketMessage.create({
    data: {
      ticketId: ticket2.id,
      userId: null,
      message: `Hi there!

Great questions! Let me answer each one:

1. Yes, all your historical data will be preserved when upgrading. You'll actually get access to UNLIMITED history instead of the 90-day limit.

2. Yes, you can upgrade at any time. The change takes effect immediately.

3. Yes, we prorate charges. You'll only pay for the remaining days in your billing cycle at the new rate.

Would you like me to help you with the upgrade process?`,
      isAdminResponse: true,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
  });
  console.log(`  └─ Added admin response`);

  // Test Ticket 3: URGENT Open - Dedicated Support
  const ticket3 = await prisma.supportTicket.create({
    data: {
      userId: users[2] ? users[2].id : users[0].id,
      subject: 'URGENT: Price alerts not being sent',
      description: `URGENT: Our team is not receiving price change alerts for the past 6 hours. This is critical for our business operations as we need real-time notifications.

Affected competitors:
- All 15 tracked competitors
- No email alerts received since 8:00 AM
- Dashboard shows price changes but no notifications

Please investigate ASAP as this is impacting our pricing strategy decisions.

Priority: CRITICAL`,
      status: 'open',
      priority: 'dedicated',
      category: 'technical',
      createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    },
  });
  console.log(`✅ Created ticket #${ticket3.id}: ${ticket3.subject} (${ticket3.priority}, ${ticket3.status})`);

  // Test Ticket 4: Resolved with conversation
  const ticket4 = await prisma.supportTicket.create({
    data: {
      userId: users[0].id,
      subject: 'How to export competitor data?',
      description: `Hi,

I need to export my competitor tracking data for a presentation. Is there a way to download this information as a CSV or Excel file?

Thanks!`,
      status: 'resolved',
      priority: 'standard',
      category: 'other',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`✅ Created ticket #${ticket4.id}: ${ticket4.subject} (${ticket4.priority}, ${ticket4.status})`);

  await prisma.supportTicketMessage.createMany({
    data: [
      {
        ticketId: ticket4.id,
        userId: null,
        message: `Hello!

Currently, the export feature is not available in the dashboard, but you can:

1. Use the browser's print function to save as PDF
2. Take screenshots of the charts and data
3. Copy the data tables and paste into Excel

We're working on a proper export feature for a future release. Would any of these workarounds help you?`,
        isAdminResponse: true,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000),
      },
      {
        ticketId: ticket4.id,
        userId: users[0].id,
        message: `Perfect! The screenshot option will work fine for my presentation. Looking forward to the export feature in the future.

Thanks for the quick help!`,
        isAdminResponse: false,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000),
      },
    ],
  });
  console.log(`  └─ Added 2 messages`);

  // Test Ticket 5: Feature Request - Priority
  const ticket5 = await prisma.supportTicket.create({
    data: {
      userId: users[1] ? users[1].id : users[0].id,
      subject: 'Feature Request: Slack integration for alerts',
      description: `Hi team,

We love MarketPulse but would really benefit from Slack integration. Currently we get email alerts, but it would be much better if price changes could be posted directly to our #competitive-intel Slack channel.

Features we'd like:
- Direct Slack notifications for price changes
- Customizable message format
- Ability to tag team members
- Separate channels for different alert types

Is this on your roadmap? We'd be happy to beta test!

Thanks,
John`,
      status: 'open',
      priority: 'priority',
      category: 'feature_request',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    },
  });
  console.log(`✅ Created ticket #${ticket5.id}: ${ticket5.subject} (${ticket5.priority}, ${ticket5.status})`);

  // Test Ticket 6: Closed ticket
  const ticket6 = await prisma.supportTicket.create({
    data: {
      userId: users[0].id,
      subject: 'Password reset not working',
      description: `I tried to reset my password but never received the email. Can you help?`,
      status: 'closed',
      priority: 'standard',
      category: 'technical',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`✅ Created ticket #${ticket6.id}: ${ticket6.subject} (${ticket6.priority}, ${ticket6.status})`);

  await prisma.supportTicketMessage.createMany({
    data: [
      {
        ticketId: ticket6.id,
        userId: null,
        message: `Hi there,

I've checked your account and resent the password reset email. Please check your spam folder as well.

The email should arrive within 5 minutes. Let me know if you still don't see it!`,
        isAdminResponse: true,
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000),
      },
      {
        ticketId: ticket6.id,
        userId: users[0].id,
        message: `Got it! It was in my spam folder. All set now, thank you!`,
        isAdminResponse: false,
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 - 30 * 60 * 1000),
      },
    ],
  });
  console.log(`  └─ Added 2 messages`);

  // Test Ticket 7: API Setup - Dedicated Support
  const ticket7 = await prisma.supportTicket.create({
    data: {
      userId: users[2] ? users[2].id : users[0].id,
      subject: 'API access setup assistance',
      description: `Hello,

We just upgraded to Enterprise and would like to set up API access for our internal dashboard. Could you provide:

1. API documentation
2. Authentication credentials
3. Rate limits and best practices
4. Sample code for common operations

Our tech stack: React + Node.js

Thanks!`,
      status: 'in_progress',
      priority: 'dedicated',
      category: 'technical',
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
  });
  console.log(`✅ Created ticket #${ticket7.id}: ${ticket7.subject} (${ticket7.priority}, ${ticket7.status})`);

  await prisma.supportTicketMessage.create({
    data: {
      ticketId: ticket7.id,
      userId: null,
      message: `Hi there!

Congratulations on upgrading to Enterprise! I'll help you get set up with API access.

I've generated your API credentials and will send them via secure email separately. Here's what you need to know:

1. **Documentation**: https://docs.marketpulse.com/api
2. **Rate Limits**: 1000 requests/hour for Enterprise
3. **Best Practices**: Use webhooks for real-time updates instead of polling

I'll also prepare some React/Node.js sample code and send that over within the next hour.

Anything else you need to get started?`,
      isAdminResponse: true,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
  });
  console.log(`  └─ Added admin response`);

  // Summary
  console.log('\n📊 Summary:');
  const stats = await prisma.supportTicket.groupBy({
    by: ['status', 'priority'],
    _count: true,
  });

  console.log('\nBy Status & Priority:');
  stats.forEach((stat) => {
    console.log(`  ${stat.status} (${stat.priority}): ${stat._count} tickets`);
  });

  const total = await prisma.supportTicket.count();
  console.log(`\n✅ Total test tickets created: ${total}`);
  console.log('\n🎉 Done! Visit /admin/support to view the tickets.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
