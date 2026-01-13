import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface SupportTicketResponseEmailProps {
  ticketId: number;
  subject: string;
  message: string;
  userName: string;
}

export default function SupportTicketResponseEmail({
  ticketId,
  subject,
  message,
  userName,
}: SupportTicketResponseEmailProps) {
  const previewText = `New response to your support ticket: ${subject}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Support Team Response</Heading>

          <Section style={section}>
            <Text style={greeting}>Hi {userName},</Text>

            <Text style={paragraph}>
              Our support team has responded to your ticket:
            </Text>

            <Text style={label}>Ticket #{ticketId}</Text>
            <Text style={value}>{subject}</Text>

            <Text style={label}>Response:</Text>
            <Text style={responseStyle}>{message}</Text>
          </Section>

          <Section style={buttonSection}>
            <Button
              style={button}
              href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/support/${ticketId}`}
            >
              View & Reply to Ticket
            </Button>
          </Section>

          <Section style={footerSection}>
            <Text style={footerText}>
              If you have any further questions, simply reply to your ticket in
              the dashboard.
            </Text>
            <Text style={footerTextSmall}>
              You received this email because you created a support ticket at
              MarketPulse.
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

const h1 = {
  color: '#1f2937',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 40px',
};

const section = {
  padding: '0 40px',
};

const greeting = {
  color: '#1f2937',
  fontSize: '18px',
  lineHeight: '24px',
  marginBottom: '16px',
};

const paragraph = {
  color: '#4b5563',
  fontSize: '16px',
  lineHeight: '24px',
  marginBottom: '24px',
};

const label = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  marginBottom: '4px',
  marginTop: '20px',
};

const value = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '24px',
  marginTop: '4px',
  marginBottom: '16px',
};

const responseStyle = {
  color: '#1f2937',
  fontSize: '16px',
  lineHeight: '24px',
  marginTop: '4px',
  whiteSpace: 'pre-wrap' as const,
  backgroundColor: '#f0fdf4',
  padding: '16px',
  borderRadius: '8px',
  border: '2px solid #86efac',
};

const buttonSection = {
  padding: '32px 40px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const footerSection = {
  padding: '24px 40px',
  borderTop: '1px solid #e5e7eb',
  marginTop: '32px',
};

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 12px 0',
  textAlign: 'center' as const,
};

const footerTextSmall = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '18px',
  margin: 0,
  textAlign: 'center' as const,
};
