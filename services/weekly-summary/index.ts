import { db } from '@/lib/db/prisma';
import { getDashboardUrl } from '@/lib/config/env';
import type { Prisma } from '@prisma/client';

interface CompetitorSnapshot {
  name: string;
  lastChecked: string;
  daysSinceChange: number | null;
  priceCount: number;
}

export interface WeeklySummaryData {
  userId: number;
  userEmail: string;
  userName: string;
  dashboardUrl: string;
  settingsUrl: string;
  weekStartDate: string;
  weekEndDate: string;
  competitorsMonitored: number;
  crawlsCompleted: number;
  alertsTriggered: number;
  priceChanges: number;
  promotionChanges: number;
  menuChanges: number;
  competitors: CompetitorSnapshot[];
  longestStableCompetitor: string;
  longestStableDays: number;
}

/**
 * Get the start and end of the previous week (Monday to Sunday)
 */
function getPreviousWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();

  // Calculate days since last Monday
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  // End of previous week (last Sunday at 23:59:59)
  const end = new Date(now);
  end.setDate(now.getDate() - daysSinceMonday - 1);
  end.setHours(23, 59, 59, 999);

  // Start of previous week (Monday at 00:00:00)
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  return { start, end };
}

/**
 * Format date as "Jan 1"
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Gather weekly summary data for a single user
 */
export async function getWeeklySummaryForUser(userId: number): Promise<WeeklySummaryData | null> {
  const { start: weekStart, end: weekEnd } = getPreviousWeekRange();

  // Get user with businesses that have active competitors
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      Business: {
        include: {
          Competitor: {
            where: { isActive: true },
            select: { id: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!user || !user.Business || user.Business.length === 0) {
    return null;
  }

  // Find the business with the most active competitors (deterministic selection)
  const business = user.Business
    .filter(b => b.Competitor.length > 0)
    .sort((a, b) => b.Competitor.length - a.Competitor.length)[0];

  if (!business) {
    return null;
  }

  // Get competitors with their latest snapshot
  const competitors = await db.competitor.findMany({
    where: {
      businessId: business.id,
      isActive: true,
    },
    include: {
      PriceSnapshot: {
        orderBy: { detectedAt: 'desc' },
        take: 1,
      },
    },
  });

  // Count alerts by type for the week
  const alertsThisWeek = await db.alert.findMany({
    where: {
      businessId: business.id,
      createdAt: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
  });

  const priceChanges = alertsThisWeek.filter(a => a.alertType === 'price_change').length;
  const promotionChanges = alertsThisWeek.filter(a => a.alertType === 'new_promotion').length;
  const menuChanges = alertsThisWeek.filter(a => a.alertType === 'menu_change').length;

  // Count crawls (snapshots) for the week
  const crawlsCompleted = await db.priceSnapshot.count({
    where: {
      Competitor: {
        businessId: business.id,
      },
      detectedAt: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
  });

  // Build competitor snapshots
  const competitorSnapshots: CompetitorSnapshot[] = [];
  let longestStableCompetitor = '';
  let longestStableDays = 0;

  for (const comp of competitors) {
    const lastSnapshot = comp.PriceSnapshot[0];

    // Calculate days since last change (alert)
    let daysSinceChange: number | null = null;
    if (comp.lastAlertAt) {
      daysSinceChange = daysBetween(new Date(comp.lastAlertAt), new Date());

      // Track longest stable competitor
      if (daysSinceChange > longestStableDays) {
        longestStableDays = daysSinceChange;
        longestStableCompetitor = comp.name;
      }
    }

    // Get price count from last snapshot
    let priceCount = 0;
    if (lastSnapshot?.extractedData) {
      const data = lastSnapshot.extractedData as Record<string, unknown>;
      const prices = data?.prices as unknown[] | undefined;
      priceCount = prices?.length || 0;
    }

    competitorSnapshots.push({
      name: comp.name,
      lastChecked: comp.lastCrawledAt
        ? formatDate(new Date(comp.lastCrawledAt))
        : 'Never',
      daysSinceChange,
      priceCount,
    });
  }

  return {
    userId: user.id,
    userEmail: user.email,
    userName: user.name || 'there',
    dashboardUrl: getDashboardUrl('/dashboard'),
    settingsUrl: getDashboardUrl('/dashboard/settings'),
    weekStartDate: formatDate(weekStart),
    weekEndDate: formatDate(weekEnd),
    competitorsMonitored: competitors.length,
    crawlsCompleted,
    alertsTriggered: alertsThisWeek.length,
    priceChanges,
    promotionChanges,
    menuChanges,
    competitors: competitorSnapshots,
    longestStableCompetitor,
    longestStableDays,
  };
}

/**
 * Get all users who should receive weekly summaries
 * - Has at least one active competitor
 * - Has email notifications enabled (or no preferences = default enabled)
 * - Is on active trial or has active subscription
 */
export async function getUsersForWeeklySummary(): Promise<number[]> {
  const users = await db.user.findMany({
    include: {
      Business: {
        include: {
          Competitor: {
            where: { isActive: true },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      NotificationPreferences: true,
      Subscription: {
        where: {
          status: { in: ['active', 'trialing', 'grace_period'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  const now = new Date();
  const trialDays = 14;

  return users
    .filter(user => {
      // Must have a business with at least one active competitor
      // Find the first business that has active competitors
      const businessWithCompetitors = user.Business.find(b => b.Competitor.length > 0);
      if (!businessWithCompetitors) {
        return false;
      }

      // Check if user has valid subscription or is in trial
      const subscription = user.Subscription[0]; // Already filtered to active statuses
      const hasActiveSubscription = !!subscription;

      const trialEnd = new Date(user.trialStartedAt);
      trialEnd.setDate(trialEnd.getDate() + trialDays);
      const isInTrial = !subscription && trialEnd > now;

      if (!hasActiveSubscription && !isInTrial) {
        return false;
      }

      // Check notification preferences
      const prefs = user.NotificationPreferences;

      // If no preferences, default to enabled
      if (!prefs) {
        return true;
      }

      // If email is globally disabled, skip
      if (!prefs.emailEnabled) {
        return false;
      }

      // Weekly summaries are always enabled if emailEnabled is true
      // emailFrequency controls how ALERTS are delivered (instant vs digest), not weekly reports
      // alertTypes controls which ALERT types trigger emails, not weekly summaries
      // Future: add weeklySummaryEnabled flag if users need to opt out specifically

      return true;
    })
    .map(user => user.id);
}

/**
 * Enqueue weekly summary email for a user
 */
export async function enqueueWeeklySummaryEmail(userId: number): Promise<{ success: boolean; reason?: string }> {
  try {
    const summaryData = await getWeeklySummaryForUser(userId);

    if (!summaryData) {
      return { success: false, reason: 'User or business not found' };
    }

    // Skip if no competitors
    if (summaryData.competitorsMonitored === 0) {
      return { success: false, reason: 'No competitors monitored' };
    }

    // Create email queue entry - cast to Prisma.InputJsonValue
    await db.emailQueue.create({
      data: {
        userId,
        toEmail: summaryData.userEmail,
        templateName: 'weekly_summary',
        templateData: summaryData as unknown as Prisma.InputJsonValue,
        scheduledFor: new Date(),
        status: 'pending',
      },
    });

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to enqueue weekly summary for user ${userId}:`, error);
    return { success: false, reason: message };
  }
}

/**
 * Process weekly summaries for all eligible users
 */
export async function processWeeklySummaries(): Promise<{
  processed: number;
  sent: number;
  skipped: number;
  errors: number;
}> {
  const stats = {
    processed: 0,
    sent: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    const userIds = await getUsersForWeeklySummary();
    console.log(`Found ${userIds.length} users eligible for weekly summary`);

    for (const userId of userIds) {
      stats.processed++;

      const result = await enqueueWeeklySummaryEmail(userId);

      if (result.success) {
        stats.sent++;
        console.log(`Enqueued weekly summary for user ${userId}`);
      } else if (result.reason === 'No competitors monitored') {
        stats.skipped++;
      } else {
        stats.errors++;
        console.error(`Failed for user ${userId}: ${result.reason}`);
      }
    }
  } catch (error) {
    console.error('Error processing weekly summaries:', error);
  }

  return stats;
}
