import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface EmailChangeVerificationProps {
  name?: string;
  verificationUrl?: string;
  oldEmail?: string;
  expiresIn?: string;
}

export default function EmailChangeVerification({
  name = 'there',
  verificationUrl = 'https://app.marketpulse.com/verify-email-change?token=ABC123',
  oldEmail = 'old@example.com',
  expiresIn = '24 hours',
}: EmailChangeVerificationProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your new email address for MarketPulse</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>Verify Your New Email</Heading>
          </Section>

          <Section style={content}>
            <Text style={paragraph}>Hi {name},</Text>

            <Text style={paragraph}>
              You recently requested to change your MarketPulse email address from{' '}
              <strong>{oldEmail}</strong> to this email.
            </Text>

            <Text style={paragraph}>
              To complete this change, please click the button below to verify this email address:
            </Text>

            <Button style={button} href={verificationUrl}>
              Verify New Email Address
            </Button>

            <Text style={warningBox}>
              <strong>⏰ This link expires in {expiresIn}</strong>
            </Text>

            <Text style={paragraph}>
              If the button doesn't work, copy and paste this link into your browser:
            </Text>
            <Text style={linkText}>{verificationUrl}</Text>

            <Section style={securityNote}>
              <Text style={securityText}>
                <strong>Security Note:</strong> If you didn't request this change, please ignore
                this email. Your current email address will remain unchanged. For additional
                security, consider changing your password.
              </Text>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>MarketPulse - Stay ahead of your competition</Text>
            <Text style={footerText}>
              Need help?{' '}
              <Link href="https://support.marketpulse.com" style={link}>
                Contact Support
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 20px',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#2563eb',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
};

const content = {
  padding: '0 48px',
};

const paragraph = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  marginBottom: '16px',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '14px 20px',
  margin: '24px 0',
};

const warningBox = {
  backgroundColor: '#fef3c7',
  border: '1px solid #fbbf24',
  borderRadius: '8px',
  padding: '16px',
  color: '#92400e',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '24px 0',
};

const linkText = {
  color: '#64748b',
  fontSize: '14px',
  wordBreak: 'break-all' as const,
  marginBottom: '24px',
};

const securityNote = {
  backgroundColor: '#f1f5f9',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const securityText = {
  color: '#475569',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
};

const footer = {
  padding: '24px 48px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e2e8f0',
  marginTop: '32px',
};

const footerText = {
  color: '#94a3b8',
  fontSize: '14px',
  marginBottom: '8px',
};

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
};
