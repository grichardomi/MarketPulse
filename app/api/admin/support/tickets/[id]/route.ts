import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';

/**
 * GET /api/admin/support/tickets/[id]
 * Get a specific support ticket (admin only)
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Get the ticket
    const ticket = await db.supportTicket.findUnique({
      where: { id: parseInt(id) },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            Subscription: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              select: {
                stripePriceId: true,
                status: true,
                competitorLimit: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            Ticket: {
              select: {
                User: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      return Response.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return Response.json({ ticket });
  } catch (error) {
    console.error('Failed to fetch admin support ticket:', error);
    return Response.json(
      { error: 'Failed to fetch support ticket' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/support/tickets/[id]
 * Update a support ticket (admin only)
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const ticket = await db.supportTicket.findUnique({
      where: { id: parseInt(id) },
    });

    if (!ticket) {
      return Response.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const body = await req.json();
    const { status } = body;

    // Validate status
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (status && !validStatuses.includes(status)) {
      return Response.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update ticket
    const updatedTicket = await db.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: status || ticket.status,
        resolvedAt:
          status === 'resolved' || status === 'closed'
            ? new Date()
            : ticket.resolvedAt,
      },
    });

    return Response.json({ ticket: updatedTicket });
  } catch (error) {
    console.error('Failed to update admin support ticket:', error);
    return Response.json(
      { error: 'Failed to update support ticket' },
      { status: 500 }
    );
  }
}
