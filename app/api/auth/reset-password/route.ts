import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { PASSWORD_REQUIREMENTS } from '@/lib/auth/password';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(PASSWORD_REQUIREMENTS.minLength, `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`)
    .max(PASSWORD_REQUIREMENTS.maxLength, `Password must be no more than ${PASSWORD_REQUIREMENTS.maxLength} characters`)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = resetPasswordSchema.parse(body);

    // Find user by reset token
    const user = await db.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(), // Token must not be expired
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token. Please request a new password reset.' },
        { status: 400 }
      );
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user password and clear reset token
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    // Optional: Send confirmation email
    try {
      const { sendEmail } = await import('@/lib/email/client');
      await sendEmail({
        to: user.email,
        subject: 'Your MarketPulse password has been changed',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(to bottom, #eff6ff, #ffffff); border-radius: 8px; padding: 30px; border: 1px solid #e5e7eb;">
                <h1 style="color: #2563eb; margin-bottom: 20px;">Password Changed Successfully</h1>

                <p>Hi${user.name ? ` ${user.name}` : ''},</p>

                <p>Your password for your MarketPulse account has been successfully changed.</p>

                <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin: 24px 0;">
                  <p style="margin: 0; color: #166534;">
                    <strong>✓ Password Updated</strong><br>
                    You can now sign in with your new password.
                  </p>
                </div>

                <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/signin" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">Sign In to MarketPulse</a></p>

                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

                <p style="color: #666; font-size: 14px;">
                  <strong>Didn't make this change?</strong><br>
                  If you didn't change your password, please contact our support team immediately at support@getmarketpulse.com
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
      console.error('Failed to send password change confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);

    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
