import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';
import { enqueueSystemEmail } from '@/lib/email/enqueue';
import { sendQueuedEmail } from '@/services/email-worker/send';

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
      select: {
        id: true,
        name: true,
        email: true,
        pendingEmail: true,
        pendingEmailToken: true,
        pendingEmailExpires: true
      },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.pendingEmail || !user.pendingEmailToken) {
      return Response.json(
        { error: 'No pending email change found' },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (!user.pendingEmailExpires || user.pendingEmailExpires < new Date()) {
      return Response.json(
        { error: 'Verification link has expired. Please request a new email change.' },
        { status: 400 }
      );
    }

    // Resend verification email to NEW email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email-change?token=${user.pendingEmailToken}`;

    const enqueueResult = await enqueueSystemEmail(
      user.id,
      user.pendingEmail,
      'email-change-verification',
      {
        name: user.name || 'User',
        verificationUrl,
        oldEmail: user.email,
        expiresIn: '24 hours',
      }
    );

    // Send immediately instead of waiting for cron
    if (enqueueResult.success && enqueueResult.queueId) {
      const sendResult = await sendQueuedEmail(parseInt(enqueueResult.queueId));

      if (!sendResult.success) {
        console.error('Failed to send email immediately:', sendResult.error);
        // Email is still queued, will be sent by cron worker
      }
    }

    return Response.json({
      success: true,
      message: 'Verification email resent successfully',
    });
  } catch (error) {
    console.error('Failed to resend verification email:', error);
    return Response.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    );
  }
}
