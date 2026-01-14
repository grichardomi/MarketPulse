import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';
import { getSupportTier, hasAccessToSupport } from '@/lib/config/pricing';

/**
 * GET /api/support/tickets
 * Get all support tickets for the authenticated user
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        Subscription: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Check subscription status for support access
    const subscription = user.Subscription?.[0];
    const subscriptionStatus = subscription?.status || null;
    const stripePriceId = subscription?.stripePriceId || null;
    const hasSupportAccess = hasAccessToSupport(subscriptionStatus, stripePriceId);

    // Return subscription info along with tickets (for UI to show upgrade prompt)
    if (!hasSupportAccess) {
      return Response.json({
        tickets: [],
        hasAccess: false,
        subscriptionStatus,
        message: 'Support tickets are available on Professional and Enterprise plans. Please upgrade to access support.',
      });
    }

    // Get all tickets for the user
    const tickets = await db.supportTicket.findMany({
      where: { userId: user.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1, // Just get the first message for preview
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json({ tickets, hasAccess: true });
  } catch (error) {
    console.error('Failed to fetch support tickets:', error);
    return Response.json(
      { error: 'Failed to fetch support tickets' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/support/tickets
 * Create a new support ticket
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's subscription to determine support tier
    const subscription = await db.subscription.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    // Check if user has support access (Professional and Enterprise only)
    const subscriptionStatus = subscription?.status || null;
    const stripePriceId = subscription?.stripePriceId || null;
    if (!hasAccessToSupport(subscriptionStatus, stripePriceId)) {
      return Response.json(
        {
          error: 'SUPPORT_REQUIRES_PRO_PLAN',
          message: 'Support tickets are available on Professional and Enterprise plans. Please upgrade to access support.',
        },
        { status: 403 }
      );
    }

    const supportTier = subscription
      ? getSupportTier(subscription.stripePriceId)
      : 'none';

    const body = await req.json();
    const { subject, description, category } = body;

    if (!subject || !description) {
      return Response.json(
        { error: 'Subject and description are required' },
        { status: 400 }
      );
    }

    // Create the ticket
    const ticket = await db.supportTicket.create({
      data: {
        userId: user.id,
        subject,
        description,
        category: category || 'other',
        priority: supportTier,
      },
      include: {
        messages: true,
      },
    });

    // Send email notification to support team (admin users)
    // For priority and dedicated support, this is critical
    try {
      const adminUsers = await db.user.findMany({
        where: { role: 'admin' },
        select: { id: true, email: true },
      });

      // Queue email for each admin
      for (const admin of adminUsers) {
        await db.emailQueue.create({
          data: {
            userId: admin.id,
            toEmail: admin.email,
            templateName: 'support-ticket-created',
            templateData: {
              ticketId: ticket.id,
              subject: ticket.subject,
              description: ticket.description,
              priority: ticket.priority,
              category: ticket.category,
              userEmail: user.email,
              userName: user.name || 'Unknown',
            },
            scheduledFor: new Date(),
            status: 'pending',
          },
        });
      }
    } catch (emailError) {
      console.error('Failed to queue support notification emails:', emailError);
      // Don't fail the ticket creation if email fails
    }

    return Response.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error('Failed to create support ticket:', error);
    return Response.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}
