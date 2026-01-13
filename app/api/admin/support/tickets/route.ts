import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';

/**
 * GET /api/admin/support/tickets
 * Get all support tickets (admin only)
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const userId = searchParams.get('userId');

    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (userId) where.userId = parseInt(userId);

    // Get all tickets with filters
    const tickets = await db.supportTicket.findMany({
      where,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            Subscription: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              select: {
                stripePriceId: true,
                status: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: [
        { status: 'asc' }, // Open tickets first
        { priority: 'desc' }, // Dedicated/priority first
        { updatedAt: 'desc' }, // Most recently updated
      ],
    });

    return Response.json({ tickets });
  } catch (error) {
    console.error('Failed to fetch admin support tickets:', error);
    return Response.json(
      { error: 'Failed to fetch support tickets' },
      { status: 500 }
    );
  }
}
