/**
 * Test Alert Email Script
 *
 * Usage: npx ts-node scripts/test-alert-email.ts [email]
 * Example: npx ts-node scripts/test-alert-email.ts info@objectmodule.com
 *
 * This script:
 * 1. Creates a test alert in the database
 * 2. Queues the alert email
 * 3. Immediately sends it (bypasses cron)
 */

import { db } from '../lib/db/prisma';
import { enqueueEmail } from '../lib/email/enqueue';
import { sendQueuedEmail } from '../services/email-worker/send';
import { getDashboardUrl } from '../lib/config/env';

async function main() {
  const targetEmail = process.argv[2] || 'info@objectmodule.com';

  console.log(`\n🔔 Testing Alert Email System`);
  console.log(`📧 Target: ${targetEmail}\n`);

  // Find user
  const user = await db.user.findUnique({
    where: { email: targetEmail },
    include: {
      Business: {
        include: {
          Competitor: { take: 1 }
        }
      }
    }
  });

  if (!user) {
    console.error(`❌ User not found: ${targetEmail}`);
    process.exit(1);
  }

  console.log(`✓ Found user: ${user.name || user.email} (ID: ${user.id})`);

  // Get or create test data
  const business = user.Business[0];
  const competitor = business?.Competitor[0];

  console.log(`✓ Business: ${business?.name || 'No business'}`);
  console.log(`✓ Competitor: ${competitor?.name || 'No competitor'}\n`);

  // Create a test alert if we have business/competitor
  let alertId: number | null = null;

  if (business && competitor) {
    const alert = await db.alert.create({
      data: {
        businessId: business.id,
        competitorId: competitor.id,
        alertType: 'price_change',
        message: `Test alert: ${competitor.name} has updated their prices`,
        details: {
          updated: [
            { item: 'Test Item A', oldPrice: '$10.99', newPrice: '$9.99', reduced: true },
            { item: 'Test Item B', oldPrice: '$8.99', newPrice: '$9.99', reduced: false },
          ],
          newItems: [
            { item: 'New Special', price: '$12.99' }
          ]
        },
        isRead: false,
      }
    });
    alertId = alert.id;
    console.log(`✓ Created test alert (ID: ${alert.id})`);
  }

  // Queue the email
  const testAlertType = 'price_change';
  const testCompetitorName = competitor?.name || 'Demo Competitor';

  console.log(`\n📬 Queueing email...`);

  const result = await enqueueEmail({
    userId: user.id,
    toEmail: user.email,
    templateName: 'alert_notification',
    templateData: {
      competitorName: testCompetitorName,
      alertType: testAlertType,
      message: `Price changes detected at ${testCompetitorName}`,
      details: {
        updated: [
          { item: 'Classic Burger', oldPrice: '$12.99', newPrice: '$11.99', reduced: true },
          { item: 'Caesar Salad', oldPrice: '$9.99', newPrice: '$10.99', reduced: false },
        ],
        newItems: [
          { item: 'Weekend Special', price: '$14.99' }
        ]
      },
      dashboardUrl: getDashboardUrl('/dashboard/alerts'),
      unsubscribeUrl: getDashboardUrl('/dashboard/settings'),
    },
    alertType: testAlertType,
  });

  if (!result.success) {
    console.error(`❌ Failed to queue email: ${result.reason}`);

    if (result.reason?.includes('quiet hours')) {
      console.log(`\n💡 Tip: Email is scheduled for after quiet hours. Check your notification settings.`);
    }
    if (result.reason?.includes('disabled')) {
      console.log(`\n💡 Tip: Email notifications may be disabled. Check /dashboard/settings`);
    }

    process.exit(1);
  }

  console.log(`✓ Email queued (Queue ID: ${result.queueId})`);

  // Immediately send the email (bypass cron)
  if (result.queueId) {
    console.log(`\n📤 Sending email immediately...`);

    try {
      const sendResult = await sendQueuedEmail(parseInt(result.queueId));

      if (sendResult.success) {
        console.log(`\n✅ SUCCESS! Email sent to ${targetEmail}`);
        console.log(`   Check your inbox (and spam folder)\n`);
      } else {
        console.log(`\n⚠️  Email not sent: ${sendResult.message || sendResult.error}`);
      }
    } catch (err) {
      console.error(`\n❌ Failed to send email:`, err);
    }
  }

  // Summary
  console.log(`\n📊 Summary:`);
  console.log(`   User: ${user.email}`);
  console.log(`   Alert ID: ${alertId || 'N/A (no business/competitor)'}`);
  console.log(`   Queue ID: ${result.queueId}`);
  console.log(`   View alerts at: ${getDashboardUrl('/dashboard/alerts')}`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
