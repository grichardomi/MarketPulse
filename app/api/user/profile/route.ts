import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';
import { userProfileUpdateSchema } from '@/lib/validation/user';
import { randomBytes } from 'crypto';
import { enqueueSystemEmail } from '@/lib/email/enqueue';
import { sendQueuedEmail } from '@/services/email-worker/send';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database with accounts (use ID for reliable lookup after email changes)
    const user = await db.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: {
        Account: {
          select: {
            provider: true,
          },
        },
      },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine auth methods
    const authMethods: string[] = [];
    if (user.password) {
      authMethods.push('password');
    }
    user.Account.forEach((account) => {
      if (account.provider === 'google') {
        authMethods.push('google');
      }
    });

    return Response.json({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      hasPassword: !!user.password,
      authMethods,
      createdAt: user.createdAt,
      role: user.role,
      city: user.city,
      state: user.state,
      zipcode: user.zipcode,
      pendingEmail: user.pendingEmail,
      pendingEmailExpires: user.pendingEmailExpires,
    });
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return Response.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database (use ID for reliable lookup after email changes)
    const user = await db.user.findUnique({
      where: { id: parseInt(session.user.id) },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = userProfileUpdateSchema.parse(body);

    let emailChangeInitiated = false;

    // Handle email change separately with verification flow
    if (validatedData.email && validatedData.email !== user.email) {
      const newEmail = validatedData.email;

      // Check if user has a password set - required to change email
      // This prevents OAuth-only users from getting locked out after email change
      if (!user.password) {
        return Response.json(
          {
            error: 'Password required',
            message: 'You must set a password before changing your email. This ensures you can sign in after the change.',
            requiresPassword: true
          },
          { status: 400 }
        );
      }

      // Check if new email is already in use
      const existingUser = await db.user.findUnique({
        where: { email: newEmail },
      });

      if (existingUser) {
        return Response.json(
          { error: 'This email is already in use' },
          { status: 409 }
        );
      }

      // Generate verification token
      const verificationToken = randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiration

      // Store pending email with token
      await db.user.update({
        where: { id: user.id },
        data: {
          pendingEmail: newEmail,
          pendingEmailToken: verificationToken,
          pendingEmailExpires: expiresAt,
        },
      });

      // Send verification email to NEW email
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email-change?token=${verificationToken}`;

      const verificationEmailResult = await enqueueSystemEmail(
        user.id,
        newEmail,
        'email-change-verification',
        {
          name: user.name || 'User',
          verificationUrl,
          oldEmail: user.email,
          expiresIn: '24 hours',
        }
      );

      // Send notification to OLD email
      const notificationEmailResult = await enqueueSystemEmail(
        user.id,
        user.email,
        'email-change-notification',
        {
          name: user.name || 'User',
          newEmail,
          timestamp: new Date().toLocaleString(),
        }
      );

      // Send emails immediately instead of waiting for cron
      if (verificationEmailResult.success && verificationEmailResult.queueId) {
        sendQueuedEmail(parseInt(verificationEmailResult.queueId)).catch(err =>
          console.error('Failed to send verification email immediately:', err)
        );
      }

      if (notificationEmailResult.success && notificationEmailResult.queueId) {
        sendQueuedEmail(parseInt(notificationEmailResult.queueId)).catch(err =>
          console.error('Failed to send notification email immediately:', err)
        );
      }

      emailChangeInitiated = true;
    }

    // Update other fields (non-email fields)
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.city !== undefined && { city: validatedData.city }),
        ...(validatedData.state !== undefined && { state: validatedData.state }),
        ...(validatedData.zipcode !== undefined && { zipcode: validatedData.zipcode }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
        city: true,
        state: true,
        zipcode: true,
        pendingEmail: true,
      },
    });

    return Response.json({
      success: true,
      user: updatedUser,
      emailChangeInitiated,
      ...(emailChangeInitiated && {
        message: 'Verification email sent to new address. Please check your inbox to confirm the change.',
      }),
    });
  } catch (error: any) {
    console.error('Failed to update profile:', error);

    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return Response.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return Response.json(
      {
        error: 'Failed to update profile',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
