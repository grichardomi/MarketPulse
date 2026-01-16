import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components';
import EmailLayout from './components/EmailLayout';

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
    <EmailLayout
      previewText={previewText}
      footerText="If you have any further questions, simply reply to your ticket in the dashboard."
    >
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
    </EmailLayout>
  );
}

const h1 = {
  color: '#1f2937',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 24px',
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
