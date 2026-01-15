import { db } from '@/lib/db/prisma';
import { calculateScheduledTime } from './quiet-hours';
import { getDashboardUrl } from '@/lib/config/env';

interface EnqueueEmailParams {
  userId: number;
  toEmail: string;
  templateName: string;
  templateData: any;
  alertType: string;
  alertId?: number; // Link email to alert for deduplication
}

/**
 * Enqueue an email respecting user notification preferences
 */
export async function enqueueEmail({
  userId,
  toEmail,
  templateName,
  templateData,
  alertType,
  alertId,
}: EnqueueEmailParams): Promise<{ success: boolean; queueId?: string; reason?: string }> {
  try {
    // Fetch user preferences
    const preferences = await db.notificationPreferences.findUnique({
      where: { userId },
    });

    // If no preferences or email disabled, skip
    if (!preferences || !preferences.emailEnabled) {
      return {
        success: false,
        reason: 'Email notifications disabled or preferences not found',
      };
    }

    // Check if this alert type is enabled
    const alertTypes = preferences.alertTypes as string[] | null;
    if (!alertTypes || !alertTypes.includes(alertType)) {
      return {
        success: false,
        reason: `Alert type "${alertType}" not enabled`,
      };
    }

    // Calculate when to send (respecting quiet hours)
    const now = new Date();
    const scheduledFor = calculateScheduledTime(
      now,
      preferences.quietHoursStart,
      preferences.quietHoursEnd,
      preferences.timezone
    );

    // Insert into EmailQueue (alertId unique constraint prevents duplicates)
    try {
      const queueEntry = await db.emailQueue.create({
        data: {
          userId,
          alertId,
          toEmail,
          templateName,
          templateData,
          scheduledFor,
          status: 'pending',
        },
      });

      return {
        success: true,
        queueId: String(queueEntry.id),
      };
    } catch (err: any) {
      // Handle duplicate email for same alert
      if (err.code === 'P2002' && alertId) {
        return {
          success: false,
          reason: 'Email already queued for this alert',
        };
      }
      throw err;
    }
  } catch (error) {
    console.error('Failed to enqueue email:', error);
    return {
      success: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Enqueue a system email (bypasses notification preferences)
 * Use for critical emails like password reset, email verification, etc.
 */
export async function enqueueSystemEmail(
  userId: number,
  toEmail: string,
  templateName: string,
  templateData: any
): Promise<{ success: boolean; queueId?: string; reason?: string }> {
  try {
    // Insert into EmailQueue immediately (no quiet hours check)
    const queueEntry = await db.emailQueue.create({
      data: {
        userId,
        toEmail,
        templateName,
        templateData,
        scheduledFor: new Date(), // Send immediately
        status: 'pending',
      },
    });

    return {
      success: true,
      queueId: String(queueEntry.id),
    };
  } catch (error) {
    console.error('Failed to enqueue system email:', error);
    return {
      success: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Convenience function to enqueue email for an alert
 */
export async function enqueueAlertEmail(alertId: number): Promise<{ success: boolean; reason?: string }> {
  try {
    // Fetch alert with related data
    const alert = await db.alert.findUnique({
      where: { id: alertId },
      include: {
        Business: {
          include: {
            User: true,
          },
        },
        Competitor: true,
      },
    });

    if (!alert) {
      return { success: false, reason: 'Alert not found' };
    }

    if (!alert.Business?.User?.email) {
      return { success: false, reason: 'User email not found' };
    }

    // Prepare template data
    const templateData = {
      competitorName: alert.Competitor?.name || 'Unknown Competitor',
      alertType: alert.alertType,
      message: alert.message,
      details: alert.details,
      dashboardUrl: getDashboardUrl('/dashboard/alerts'),
      unsubscribeUrl: getDashboardUrl('/dashboard/settings'),
    };

    // Enqueue email (alertId prevents duplicate emails for same alert)
    return await enqueueEmail({
      userId: alert.Business!.userId,
      toEmail: alert.Business!.User.email,
      templateName: 'alert_notification',
      templateData,
      alertType: alert.alertType,
      alertId,
    });
  } catch (error) {
    console.error('Failed to enqueue alert email:', error);
    return {
      success: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
