import { db } from '@/lib/db/prisma';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return Response.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find user with this token
    const user = await db.user.findUnique({
      where: { pendingEmailToken: token },
      select: {
        id: true,
        email: true,
        pendingEmail: true,
        pendingEmailExpires: true,
      },
    });

    if (!user) {
      return Response.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (!user.pendingEmailExpires || user.pendingEmailExpires < new Date()) {
      return Response.json(
        { error: 'Verification token has expired. Please request a new email change.' },
        { status: 400 }
      );
    }

    // Check if pending email exists
    if (!user.pendingEmail) {
      return Response.json(
        { error: 'No pending email change found' },
        { status: 400 }
      );
    }

    // Check if the pending email is already taken by another user
    const existingUser = await db.user.findFirst({
      where: {
        email: user.pendingEmail,
        id: { not: user.id },
      },
    });

    if (existingUser) {
      // Clear the pending email since it's no longer available
      await db.user.update({
        where: { id: user.id },
        data: {
          pendingEmail: null,
          pendingEmailToken: null,
          pendingEmailExpires: null,
        },
      });

      return Response.json(
        { error: 'This email is already in use by another account' },
        { status: 409 }
      );
    }

    // Update the user's email and clear pending fields
    await db.user.update({
      where: { id: user.id },
      data: {
        email: user.pendingEmail,
        emailVerified: new Date(),
        pendingEmail: null,
        pendingEmailToken: null,
        pendingEmailExpires: null,
      },
    });

    return Response.json({
      success: true,
      message: 'Email updated successfully! You can now sign in with your new email.',
      newEmail: user.pendingEmail,
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return Response.json(
      { error: 'Failed to verify email change' },
      { status: 500 }
    );
  }
}
