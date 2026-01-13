import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';

/**
 * POST /api/support/tickets/[id]/messages
 * Add a message to a support ticket
 */
export async function POST(
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
    const { message } = body;

    if (!message || message.trim().length === 0) {
      return Response.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Create the message
    const ticketMessage = await db.supportTicketMessage.create({
      data: {
        ticketId: ticket.id,
        userId: user.id,
        message: message.trim(),
        isAdminResponse: false,
      },
    });

    // Update ticket status if it was resolved/closed
    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      await db.supportTicket.update({
        where: { id: ticket.id },
        data: { status: 'open' }, // Reopen the ticket
      });
    }

    return Response.json({ message: ticketMessage }, { status: 201 });
  } catch (error) {
    console.error('Failed to add message to support ticket:', error);
    return Response.json(
      { error: 'Failed to add message' },
      { status: 500 }
    );
  }
}
