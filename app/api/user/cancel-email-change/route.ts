import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';

export async function POST() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, pendingEmail: true },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.pendingEmail) {
      return Response.json(
        { error: 'No pending email change found' },
        { status: 400 }
      );
    }

    // Clear pending email fields
    await db.user.update({
      where: { id: user.id },
      data: {
        pendingEmail: null,
        pendingEmailToken: null,
        pendingEmailExpires: null,
      },
    });

    return Response.json({
      success: true,
      message: 'Email change cancelled',
    });
  } catch (error) {
    console.error('Failed to cancel email change:', error);
    return Response.json(
      { error: 'Failed to cancel email change' },
      { status: 500 }
    );
  }
}
