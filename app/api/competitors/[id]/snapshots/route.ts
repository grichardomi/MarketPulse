import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';
import { getHistoryRetentionDays } from '@/lib/config/pricing';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's subscription to determine history retention
    const subscription = await db.subscription.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    // Determine history cutoff date and limit based on subscription tier
    let historyCutoffDate: Date | null = null;
    let snapshotLimit: number | undefined = undefined;

    if (subscription) {
      const retentionDays = getHistoryRetentionDays(subscription.stripePriceId);
      if (retentionDays !== null) {
        historyCutoffDate = new Date();
        historyCutoffDate.setDate(historyCutoffDate.getDate() - retentionDays);
        // Calculate reasonable limit based on retention (2x per day = ~2 snapshots/day)
        snapshotLimit = Math.ceil(retentionDays * 2.5); // Add buffer for variance
      } else {
        // Unlimited plan - set very high limit for full access
        snapshotLimit = 10000; // Effectively unlimited for reasonable use
      }
    } else {
      // Default for trial users
      snapshotLimit = 100; // Conservative default
    }

    // Verify competitor ownership
    const competitor = await db.competitor.findFirst({
      where: {
        id: parseInt(id),
        Business: { userId: user.id },
      },
    });

    if (!competitor) {
      return Response.json(
        { error: 'Competitor not found' },
        { status: 404 }
      );
    }

    // Build where clause for snapshot filtering
    const snapshotWhere: any = {
      competitorId: competitor.id,
    };
    if (historyCutoffDate) {
      snapshotWhere.detectedAt = {
        gte: historyCutoffDate,
      };
    }

    // Get snapshots for price history (filtered by retention period)
    const snapshots = await db.priceSnapshot.findMany({
      where: snapshotWhere,
      orderBy: { detectedAt: 'asc' },
      take: snapshotLimit,
    });

    // Get total snapshot count (within retention period)
    const totalCount = await db.priceSnapshot.count({
      where: snapshotWhere,
    });

    return Response.json({
      snapshots,
      metadata: {
        total: totalCount,
        shown: snapshots.length,
      },
    });
  } catch (error) {
    console.error('Failed to fetch snapshots:', error);
    return Response.json(
      { error: 'Failed to fetch snapshots' },
      { status: 500 }
    );
  }
}
