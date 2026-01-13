import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';

/**
 * GET /api/support/tickets/[id]
 * Get a specific support ticket with all messages
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

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the ticket and verify ownership
    const ticket = await db.supportTicket.findFirst({
      where: {
        id: parseInt(id),
        userId: user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!ticket) {
      return Response.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    return Response.json({ ticket });
  } catch (error) {
    console.error('Failed to fetch support ticket:', error);
    return Response.json(
      { error: 'Failed to fetch support ticket' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/support/tickets/[id]
 * Update a support ticket (e.g., close it)
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

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the ticket and verify ownership
    const ticket = await db.supportTicket.findFirst({
      where: {
        id: parseInt(id),
        userId: user.id,
      },
    });

    if (!ticket) {
      return Response.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { status } = body;

    // Only allow users to close their own tickets
    if (status && status !== 'closed') {
      return Response.json(
        { error: 'You can only close your own tickets' },
        { status: 403 }
      );
    }

    const updatedTicket = await db.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: status || ticket.status,
        resolvedAt: status === 'closed' ? new Date() : ticket.resolvedAt,
      },
    });

    return Response.json({ ticket: updatedTicket });
  } catch (error) {
    console.error('Failed to update support ticket:', error);
    return Response.json(
      { error: 'Failed to update support ticket' },
      { status: 500 }
    );
  }
}
