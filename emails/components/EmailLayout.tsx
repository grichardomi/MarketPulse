import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Link,
} from '@react-email/components';
import * as React from 'react';

interface EmailLayoutProps {
  children: React.ReactNode;
  previewText: string;
  footerText?: string;
  settingsUrl?: string;
}

// Base URL for assets - should match your deployed app URL
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://getmarketpulse.com';

export default function EmailLayout({
  children,
  previewText,
  footerText = 'MarketPulse - Stay ahead of your competition',
  settingsUrl,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo Header */}
          <Section style={logoSection}>
            <Img
              src={`${BASE_URL}/logo_transparent.png`}
              width="180"
              height="auto"
              alt="MarketPulse"
              style={logo}
            />
          </Section>

          {/* Main Content */}
          {children}

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerTextStyle}>{footerText}</Text>
            {settingsUrl && (
              <Link href={settingsUrl} style={link}>
                Notification Settings
              </Link>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Shared styles - can be imported by other email templates
export const emailStyles = {
  main: {
    backgroundColor: '#f6f9fc',
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  },
  container: {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
    maxWidth: '600px',
  },
  content: {
    padding: '0 48px',
  },
  paragraph: {
    color: '#525f7f',
    fontSize: '16px',
    lineHeight: '24px',
    textAlign: 'left' as const,
    marginBottom: '16px',
  },
  h1: {
    color: '#1f2937',
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '0 0 24px',
    padding: '0',
    textAlign: 'center' as const,
  },
  h2: {
    color: '#1e293b',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '24px 0 16px',
  },
  button: {
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
  },
  link: {
    color: '#2563eb',
    textDecoration: 'underline',
  },
};

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

const logoSection = {
  padding: '32px 20px 24px',
  textAlign: 'center' as const,
};

const logo = {
  display: 'inline-block',
  margin: '0 auto',
};

const footer = {
  padding: '24px 48px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e2e8f0',
  marginTop: '32px',
};

const footerTextStyle = {
  color: '#94a3b8',
  fontSize: '14px',
  marginBottom: '8px',
};

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
};
