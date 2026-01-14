/**
 * Test All Notification Systems
 *
 * Usage: npx tsx scripts/test-notifications.ts [email]
 * Example: npx tsx scripts/test-notifications.ts info@objectmodule.com
 *
 * This script tests:
 * 1. Email alerts (queued + sent)
 * 2. Push notifications (if subscribed)
 * 3. In-app alerts (created in database)
 */

import { db } from '../lib/db/prisma';
import { enqueueEmail } from '../lib/email/enqueue';
import { sendQueuedEmail } from '../services/email-worker/send';
import { sendPushNotification } from '../lib/notifications/sendPushNotification';
import { getDashboardUrl } from '../lib/config/env';

async function main() {
  const targetEmail = process.argv[2] || 'info@objectmodule.com';

  console.log(`\n🔔 Testing All Notification Systems`);
  console.log(`📧 Target: ${targetEmail}\n`);
  console.log('='.repeat(50));

  // Find user
  const user = await db.user.findUnique({
    where: { email: targetEmail },
    include: {
      Business: {
        include: {
          Competitor: { take: 1 }
        }
      },
      PushSubscription: true,
    }
  });

  if (!user) {
    console.error(`❌ User not found: ${targetEmail}`);
    process.exit(1);
  }

  console.log(`\n👤 User: ${user.name || user.email} (ID: ${user.id})`);

  const business = user.Business[0];
  const competitor = business?.Competitor[0];
  const pushSubscriptions = user.PushSubscription;

  console.log(`📊 Business: ${business?.name || 'No business'}`);
  console.log(`🏪 Competitor: ${competitor?.name || 'No competitor'}`);
  console.log(`📱 Push Subscriptions: ${pushSubscriptions.length}`);

  // ============================================
  // 1. CREATE IN-APP ALERT
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('📋 1. IN-APP ALERT');
  console.log('='.repeat(50));

  let alertId: number | null = null;

  if (business && competitor) {
    const alert = await db.alert.create({
      data: {
        businessId: business.id,
        competitorId: competitor.id,
        alertType: 'price_change',
        message: `[TEST] ${competitor.name} has updated their prices`,
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
    console.log(`✅ Created alert (ID: ${alert.id})`);
    console.log(`   View at: ${getDashboardUrl('/dashboard/alerts')}`);
  } else {
    console.log(`⚠️  Skipped - no business/competitor setup`);
  }

  // ============================================
  // 2. EMAIL NOTIFICATION
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('📧 2. EMAIL NOTIFICATION');
  console.log('='.repeat(50));

  const emailResult = await enqueueEmail({
    userId: user.id,
    toEmail: user.email,
    templateName: 'alert_notification',
    templateData: {
      competitorName: competitor?.name || 'Demo Competitor',
      alertType: 'price_change',
      message: `[TEST] Price changes detected`,
      details: {
        updated: [
          { item: 'Classic Burger', oldPrice: '$12.99', newPrice: '$11.99', reduced: true },
        ],
      },
      dashboardUrl: getDashboardUrl('/dashboard/alerts'),
      unsubscribeUrl: getDashboardUrl('/dashboard/settings'),
    },
    alertType: 'price_change',
  });

  if (emailResult.success && emailResult.queueId) {
    console.log(`✅ Email queued (ID: ${emailResult.queueId})`);

    // Send immediately
    const sendResult = await sendQueuedEmail(parseInt(emailResult.queueId));
    if (sendResult.success) {
      console.log(`✅ Email sent to ${user.email}`);
    } else {
      console.log(`⚠️  Email queued but not sent: ${sendResult.message || sendResult.error}`);
    }
  } else {
    console.log(`⚠️  Email not queued: ${emailResult.reason}`);
    if (emailResult.reason?.includes('quiet hours')) {
      console.log(`   💡 Check quiet hours in notification settings`);
    }
  }

  // ============================================
  // 3. PUSH NOTIFICATION
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('📱 3. PUSH NOTIFICATION');
  console.log('='.repeat(50));

  if (pushSubscriptions.length === 0) {
    console.log(`⚠️  No push subscriptions found`);
    console.log(`   💡 Enable push notifications at: ${getDashboardUrl('/dashboard/settings')}`);
  } else {
    console.log(`   Found ${pushSubscriptions.length} subscription(s)`);

    const pushResult = await sendPushNotification(user.id, {
      title: '🔔 Test Alert',
      body: `[TEST] Price changes detected at ${competitor?.name || 'Demo Competitor'}`,
      url: '/dashboard/alerts',
      tag: `test-${Date.now()}`,
    });

    if (pushResult.sent > 0) {
      console.log(`✅ Push notification sent to ${pushResult.sent} device(s)`);
    }
    if (pushResult.failed > 0) {
      console.log(`⚠️  Failed to send to ${pushResult.failed} device(s)`);
      pushResult.errors.forEach(err => console.log(`   - ${err}`));
    }
    if (pushResult.sent === 0 && pushResult.failed === 0) {
      console.log(`⚠️  No notifications sent: ${pushResult.errors.join(', ')}`);
    }
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));
  console.log(`
User:            ${user.email}
Alert ID:        ${alertId || 'N/A'}
Email Queue ID:  ${emailResult.queueId || 'N/A'}
Push Devices:    ${pushSubscriptions.length}

View alerts:     ${getDashboardUrl('/dashboard/alerts')}
Settings:        ${getDashboardUrl('/dashboard/settings')}
  `);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
