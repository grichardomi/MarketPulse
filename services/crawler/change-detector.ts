import { db } from '@/lib/db/prisma';
import { ExtractedData } from './ai-extractor';
import { enqueueAlertEmail } from '@/lib/email/enqueue';
import { sendAlertPushNotification } from '@/lib/notifications/sendPushNotification';
import crypto from 'crypto';

// Cooldown period between alerts of same type for same competitor (in hours)
const ALERT_COOLDOWN_HOURS = 1;

export interface ChangeDetectionResult {
  hasChanges: boolean;
  changeTypes: string[];
  message: string;
  details: Record<string, any>;
}

/**
 * Detect changes between two extracted data snapshots
 */
export async function detectChanges(
  competitorId: number,
  businessId: number,
  newData: ExtractedData,
  newHash: string
): Promise<ChangeDetectionResult> {
  // Get previous snapshot - skip the first result since the new snapshot
  // may have already been created before this function is called
  const snapshots = await db.priceSnapshot.findMany({
    where: { competitorId },
    orderBy: { detectedAt: 'desc' },
    take: 2,
  });

  // Find the previous snapshot (the one that's not the current crawl)
  // If the most recent snapshot has the same hash, it's the one we just created
  const previousSnapshot = snapshots.find(s => s.snapshotHash !== newHash) || null;

  // If no previous snapshot with different hash, this is first crawl or no changes
  if (!previousSnapshot) {
    // Check if this is truly a first crawl (only 0-1 snapshots exist)
    if (snapshots.length <= 1) {
      return {
        hasChanges: false,
        changeTypes: [],
        message: 'First crawl - no previous data to compare',
        details: { reason: 'first_crawl' },
      };
    }
    // Multiple snapshots exist but all have same hash = no changes
    return {
      hasChanges: false,
      changeTypes: [],
      message: 'No changes detected',
      details: { reason: 'hash_match' },
    };
  }

  // Hash changed - analyze what changed
  const previousData = previousSnapshot.extractedData as unknown as ExtractedData;
  const changes = analyzeChanges(previousData, newData);

  if (changes.changeTypes.length > 0) {
    // Check cooldown - get last alert time for this competitor
    const competitor = await db.competitor.findUnique({
      where: { id: competitorId },
      select: { lastAlertAt: true },
    });

    const cooldownTime = new Date(Date.now() - ALERT_COOLDOWN_HOURS * 60 * 60 * 1000);
    const isInCooldown = competitor?.lastAlertAt && competitor.lastAlertAt > cooldownTime;

    if (isInCooldown) {
      console.log(`Competitor ${competitorId} is in alert cooldown, skipping alerts`);
      return {
        hasChanges: true,
        changeTypes: changes.changeTypes,
        message: 'Changes detected but alert cooldown active',
        details: { cooldown: true },
      };
    }

    // Create alerts for each change type with dedupeKey
    const alerts = [];

    // Helper to create dedupeKey from content
    const createDedupeKey = (alertType: string, content: any): string => {
      const hash = crypto.createHash('md5');
      hash.update(JSON.stringify({ alertType, content }));
      return hash.digest('hex').substring(0, 16);
    };

    if (changes.changeTypes.includes('price_change')) {
      const dedupeKey = createDedupeKey('price_change', changes.priceChanges);
      try {
        const priceAlert = await db.alert.create({
          data: {
            businessId,
            competitorId,
            alertType: 'price_change',
            message: changes.priceChangeMessage,
            details: changes.priceChanges as any,
            dedupeKey,
            isRead: false,
          },
        });
        alerts.push(priceAlert);

        // Enqueue email notification
        enqueueAlertEmail(priceAlert.id).catch((err) => {
          console.error('Failed to enqueue price alert email:', err);
        });

        // Send push notification
        sendAlertPushNotification(priceAlert.id).catch((err) => {
          console.error('Failed to send price alert push notification:', err);
        });
      } catch (err: any) {
        if (err.code === 'P2002') {
          console.log(`Duplicate price_change alert skipped for competitor ${competitorId}`);
        } else {
          throw err;
        }
      }
    }

    if (changes.changeTypes.includes('new_promotion')) {
      const dedupeKey = createDedupeKey('new_promotion', changes.promotionChanges);
      try {
        const promotionAlert = await db.alert.create({
          data: {
            businessId,
            competitorId,
            alertType: 'new_promotion',
            message: changes.promotionChangeMessage,
            details: changes.promotionChanges as any,
            dedupeKey,
            isRead: false,
          },
        });
        alerts.push(promotionAlert);

        // Enqueue email notification
        enqueueAlertEmail(promotionAlert.id).catch((err) => {
          console.error('Failed to enqueue promotion alert email:', err);
        });

        // Send push notification
        sendAlertPushNotification(promotionAlert.id).catch((err) => {
          console.error('Failed to send promotion alert push notification:', err);
        });
      } catch (err: any) {
        if (err.code === 'P2002') {
          console.log(`Duplicate new_promotion alert skipped for competitor ${competitorId}`);
        } else {
          throw err;
        }
      }
    }

    if (changes.changeTypes.includes('menu_change')) {
      const dedupeKey = createDedupeKey('menu_change', changes.menuChanges);
      try {
        const menuAlert = await db.alert.create({
          data: {
            businessId,
            competitorId,
            alertType: 'menu_change',
            message: changes.menuChangeMessage,
            details: changes.menuChanges as any,
            dedupeKey,
            isRead: false,
          },
        });
        alerts.push(menuAlert);

        // Enqueue email notification
        enqueueAlertEmail(menuAlert.id).catch((err) => {
          console.error('Failed to enqueue menu alert email:', err);
        });

        // Send push notification
        sendAlertPushNotification(menuAlert.id).catch((err) => {
          console.error('Failed to send menu alert push notification:', err);
        });
      } catch (err: any) {
        if (err.code === 'P2002') {
          console.log(`Duplicate menu_change alert skipped for competitor ${competitorId}`);
        } else {
          throw err;
        }
      }
    }

    // Update lastAlertAt on competitor if any alerts were created
    if (alerts.length > 0) {
      await db.competitor.update({
        where: { id: competitorId },
        data: { lastAlertAt: new Date() },
      });
      console.log(`Created ${alerts.length} alerts for competitor ${competitorId}`);
    }
  }

  return {
    hasChanges: changes.changeTypes.length > 0,
    changeTypes: changes.changeTypes,
    message: changes.summary,
    details: {
      priceChanges: changes.priceChanges,
      promotionChanges: changes.promotionChanges,
      menuChanges: changes.menuChanges,
    },
  };
}

/**
 * Analyze differences between snapshots
 */
function analyzeChanges(
  previous: ExtractedData,
  current: ExtractedData
): {
  changeTypes: string[];
  summary: string;
  priceChangeMessage: string;
  priceChanges: any;
  promotionChangeMessage: string;
  promotionChanges: any;
  menuChangeMessage: string;
  menuChanges: any;
} {
  const changeTypes: string[] = [];
  let summary = 'Changes detected: ';

  // Detect price changes
  const priceChanges = detectPriceChanges(previous.prices || [], current.prices || []);
  const hasNewPrices = priceChanges.added.length > 0 || priceChanges.updated.length > 0;
  const hasPriceReductions = priceChanges.updated.some((p: any) => p.reduced);

  if (hasNewPrices) {
    changeTypes.push('price_change');
    summary += `Prices updated (${priceChanges.added.length} added, ${priceChanges.updated.length} changed). `;
  }

  // Detect promotion changes
  const promotionChanges = detectPromotionChanges(
    previous.promotions || [],
    current.promotions || []
  );

  if (promotionChanges.added.length > 0 || promotionChanges.removed.length > 0) {
    changeTypes.push('new_promotion');
    summary += `Promotions updated (${promotionChanges.added.length} new, ${promotionChanges.removed.length} ended). `;
  }

  // Detect menu changes
  const menuChanges = detectMenuChanges(previous.menu_items || [], current.menu_items || []);

  if (menuChanges.added.length > 0 || menuChanges.removed.length > 0) {
    changeTypes.push('menu_change');
    summary += `Menu updated (${menuChanges.added.length} added, ${menuChanges.removed.length} removed). `;
  }

  return {
    changeTypes,
    summary: summary || 'No significant changes detected',
    priceChangeMessage: generatePriceMessage(priceChanges, hasPriceReductions),
    priceChanges,
    promotionChangeMessage: generatePromotionMessage(promotionChanges),
    promotionChanges,
    menuChangeMessage: generateMenuMessage(menuChanges),
    menuChanges,
  };
}

/**
 * Detect price changes
 */
function detectPriceChanges(
  previous: any[],
  current: any[]
): {
  added: any[];
  removed: any[];
  updated: any[];
} {
  const added: any[] = [];
  const removed: any[] = [];
  const updated: any[] = [];

  // Items in current but not in previous = added
  for (const item of current) {
    const found = previous.find((p) => p.item?.toLowerCase() === item.item?.toLowerCase());
    if (!found) {
      added.push(item);
    } else if (found.price !== item.price) {
      // Price changed
      const reduced = extractPrice(item.price) < extractPrice(found.price);
      updated.push({
        item: item.item,
        oldPrice: found.price,
        newPrice: item.price,
        reduced,
      });
    }
  }

  // Items in previous but not in current = removed
  for (const item of previous) {
    const found = current.find((c) => c.item?.toLowerCase() === item.item?.toLowerCase());
    if (!found) {
      removed.push(item);
    }
  }

  return { added, removed, updated };
}

/**
 * Detect promotion changes
 */
function detectPromotionChanges(
  previous: any[],
  current: any[]
): {
  added: any[];
  removed: any[];
} {
  const added: any[] = [];
  const removed: any[] = [];

  // Promotions in current but not in previous = added
  for (const promo of current) {
    const found = previous.find(
      (p) =>
        p.title?.toLowerCase() === promo.title?.toLowerCase() ||
        p.description?.toLowerCase().includes(promo.description?.substring(0, 20)?.toLowerCase())
    );
    if (!found) {
      added.push(promo);
    }
  }

  // Promotions in previous but not in current = removed/ended
  for (const promo of previous) {
    const found = current.find(
      (c) =>
        c.title?.toLowerCase() === promo.title?.toLowerCase() ||
        c.description?.toLowerCase().includes(promo.description?.substring(0, 20)?.toLowerCase())
    );
    if (!found) {
      removed.push(promo);
    }
  }

  return { added, removed };
}

/**
 * Detect menu changes
 */
function detectMenuChanges(
  previous: any[],
  current: any[]
): {
  added: any[];
  removed: any[];
} {
  const added: any[] = [];
  const removed: any[] = [];

  // Items in current but not in previous = added
  for (const item of current) {
    const found = previous.find((p) => p.name?.toLowerCase() === item.name?.toLowerCase());
    if (!found) {
      added.push(item);
    }
  }

  // Items in previous but not in current = removed
  for (const item of previous) {
    const found = current.find((c) => c.name?.toLowerCase() === item.name?.toLowerCase());
    if (!found) {
      removed.push(item);
    }
  }

  return { added, removed };
}

/**
 * Helper to extract numeric price from string
 */
function extractPrice(priceStr: string): number {
  const match = priceStr.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

/**
 * Generate human-readable price change message
 */
function generatePriceMessage(changes: any, _hasPriceReductions: boolean): string {
  let msg = '';

  if (changes.added.length > 0) {
    msg += `${changes.added.length} new price${changes.added.length > 1 ? 's' : ''} added. `;
  }

  if (changes.updated.length > 0) {
    const reductions = changes.updated.filter((c: any) => c.reduced).length;
    msg += `${changes.updated.length} price${changes.updated.length > 1 ? 's' : ''} updated`;
    if (reductions > 0) {
      msg += ` (${reductions} price ${reductions > 1 ? 'reductions' : 'reduction'})`;
    }
    msg += '. ';
  }

  if (changes.removed.length > 0) {
    msg += `${changes.removed.length} price${changes.removed.length > 1 ? 's' : ''} removed. `;
  }

  return msg || 'Prices updated';
}

/**
 * Generate human-readable promotion message
 */
function generatePromotionMessage(changes: any): string {
  let msg = '';

  if (changes.added.length > 0) {
    msg += `${changes.added.length} new promotion${changes.added.length > 1 ? 's' : ''}: ${changes.added[0]?.title || 'Special offer'} and more. `;
  }

  if (changes.removed.length > 0) {
    msg += `${changes.removed.length} promotion${changes.removed.length > 1 ? 's' : ''} ended. `;
  }

  return msg || 'Promotions updated';
}

/**
 * Generate human-readable menu message
 */
function generateMenuMessage(changes: any): string {
  let msg = '';

  if (changes.added.length > 0) {
    msg += `${changes.added.length} new menu item${changes.added.length > 1 ? 's' : ''}: ${changes.added[0]?.name || 'Item'} and more. `;
  }

  if (changes.removed.length > 0) {
    msg += `${changes.removed.length} menu item${changes.removed.length > 1 ? 's' : ''} removed. `;
  }

  return msg || 'Menu updated';
}
