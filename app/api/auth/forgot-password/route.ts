import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/prisma';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email/client';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
    });

    // For security, always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with that email, a reset link has been sent.',
      });
    }

    // Note: We allow password reset/set for ALL users, including OAuth-only users
    // This enables OAuth users to add email/password login capability
    // and recovers users who changed their email away from their OAuth provider

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Save token to database
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetTokenExpires,
      },
    });

    // Create reset URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/auth/reset-password?token=${resetToken}`;

    // Send password reset email
    try {
      await sendEmail({
        to: email,
        subject: 'Reset your MarketPulse password',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(to bottom, #eff6ff, #ffffff); border-radius: 8px; padding: 30px; border: 1px solid #e5e7eb;">
                <h1 style="color: #2563eb; margin-bottom: 20px;">Reset Your Password</h1>

                <p>Hi${user.name ? ` ${user.name}` : ''},</p>

                <p>We received a request to reset your password for your MarketPulse account.</p>

                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
                  <p style="margin: 0 0 16px 0; font-weight: bold;">Click the button below to reset your password:</p>
                  <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">Reset Password</a>
                </div>

                <p style="color: #666; font-size: 14px;">This link will expire in 30 minutes for security reasons.</p>

                <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #2563eb; font-size: 14px;">${resetUrl}</p>

                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

                <p style="color: #666; font-size: 14px; margin-bottom: 8px;">
                  <strong>Didn't request this?</strong><br>
                  If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
                </p>

                <p style="color: #999; font-size: 12px; margin-top: 24px;">
                  This is an automated email from MarketPulse. Please do not reply to this email.
                </p>
              </div>
            </body>
          </html>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Still return success to avoid revealing if user exists
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email, a reset link has been sent.',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);

    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}
