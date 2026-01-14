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

interface EmailChangeNotificationProps {
  name?: string;
  newEmail?: string;
  timestamp?: string;
}

export default function EmailChangeNotification({
  name = 'there',
  newEmail = 'new@example.com',
  timestamp = new Date().toLocaleString(),
}: EmailChangeNotificationProps) {
  return (
    <Html>
      <Head />
      <Preview>Security Alert: Email change requested for your MarketPulse account</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={alertHeader}>
            <Heading style={h1}>🔔 Security Alert</Heading>
          </Section>

          <Section style={content}>
            <Text style={paragraph}>Hi {name},</Text>

            <Text style={paragraph}>
              This is a security notification that someone requested to change the email address on
              your MarketPulse account.
            </Text>

            <Section style={detailsBox}>
              <Text style={detailsText}>
                <strong>New Email Address:</strong> {newEmail}
              </Text>
              <Text style={detailsText}>
                <strong>Time:</strong> {timestamp}
              </Text>
            </Section>

            <Section style={warningBox}>
              <Text style={warningText}>
                <strong>Was this you?</strong>
              </Text>
              <Text style={warningText}>
                If you initiated this change, no action is needed. A verification email has been
                sent to <strong>{newEmail}</strong>. The change will only take effect after
                verification.
              </Text>
            </Section>

            <Section style={dangerBox}>
              <Text style={dangerText}>
                <strong>⚠️ Didn't request this change?</strong>
              </Text>
              <Text style={dangerText}>
                If you did NOT request this change, your account security may be compromised. Take
                these steps immediately:
              </Text>
              <Text style={dangerListText}>
                1. Ignore the verification email sent to {newEmail}
                <br />
                2. Change your password immediately
                <br />
                3. Review your recent account activity
                <br />
                4. Contact our support team
              </Text>
            </Section>

            <Button
              style={button}
              href="https://app.marketpulse.com/dashboard/security"
            >
              Review Security Settings
            </Button>

            <Text style={paragraph}>
              Your current email address ({' '}
              <strong>this one</strong>) will remain active until the new email is verified.
            </Text>
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

const alertHeader = {
  padding: '32px 20px',
  textAlign: 'center' as const,
  backgroundColor: '#fef2f2',
  borderBottom: '3px solid #dc2626',
};

const h1 = {
  color: '#dc2626',
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

const detailsBox = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const detailsText = {
  color: '#334155',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
};

const warningBox = {
  backgroundColor: '#fef3c7',
  border: '1px solid #fbbf24',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const warningText = {
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
};

const dangerBox = {
  backgroundColor: '#fef2f2',
  border: '2px solid #dc2626',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const dangerText = {
  color: '#991b1b',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
};

const dangerListText = {
  color: '#991b1b',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '12px 0',
  paddingLeft: '8px',
};

const button = {
  backgroundColor: '#dc2626',
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
