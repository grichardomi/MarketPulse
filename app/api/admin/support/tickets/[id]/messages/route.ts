import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';

/**
 * POST /api/admin/support/tickets/[id]/messages
 * Add an admin response to a support ticket
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

    const admin = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!admin || admin.role !== 'admin') {
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
          },
        },
      },
    });

    if (!ticket) {
      return Response.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const body = await req.json();
    const { message } = body;

    if (!message || message.trim().length === 0) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Create the admin response
    const ticketMessage = await db.supportTicketMessage.create({
      data: {
        ticketId: ticket.id,
        userId: null, // null indicates admin response
        message: message.trim(),
        isAdminResponse: true,
      },
    });

    // Update ticket status to in_progress if it was open
    if (ticket.status === 'open') {
      await db.supportTicket.update({
        where: { id: ticket.id },
        data: { status: 'in_progress' },
      });
    }

    // Send email notification to user
    try {
      await db.emailQueue.create({
        data: {
          userId: ticket.userId,
          toEmail: ticket.User.email,
          templateName: 'support-ticket-response',
          templateData: {
            ticketId: ticket.id,
            subject: ticket.subject,
            message: message.trim(),
            userName: ticket.User.name || 'User',
          },
          scheduledFor: new Date(),
          status: 'pending',
        },
      });
    } catch (emailError) {
      console.error('Failed to queue user notification email:', emailError);
      // Don't fail the response if email fails
    }

    return Response.json({ message: ticketMessage }, { status: 201 });
  } catch (error) {
    console.error('Failed to add admin message to support ticket:', error);
    return Response.json({ error: 'Failed to add message' }, { status: 500 });
  }
}
