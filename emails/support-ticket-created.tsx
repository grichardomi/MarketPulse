import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components';
import EmailLayout from './components/EmailLayout';

interface SupportTicketCreatedEmailProps {
  ticketId: number;
  subject: string;
  description: string;
  priority: 'standard' | 'priority' | 'dedicated';
  category: string;
  userEmail: string;
  userName: string;
}

export default function SupportTicketCreatedEmail({
  ticketId,
  subject,
  description,
  priority,
  category,
  userEmail,
  userName,
}: SupportTicketCreatedEmailProps) {
  const previewText = `New ${priority} support ticket: ${subject}`;
  const priorityColor = priority === 'dedicated' ? '#9333ea' : priority === 'priority' ? '#f97316' : '#3b82f6';
  const priorityLabel = priority === 'dedicated' ? 'DEDICATED' : priority === 'priority' ? 'PRIORITY' : 'STANDARD';

  return (
    <EmailLayout
      previewText={previewText}
      footerText="You received this email because you are a support team member at MarketPulse."
    >
      <Heading style={h1}>New Support Ticket</Heading>

      <Section style={prioritySection}>
        <Text style={{ ...priorityBadge, backgroundColor: priorityColor }}>
          {priorityLabel} SUPPORT
        </Text>
      </Section>

      <Section style={section}>
        <Text style={label}>Ticket ID:</Text>
        <Text style={value}>#{ticketId}</Text>

        <Text style={label}>From:</Text>
        <Text style={value}>{userName} ({userEmail})</Text>

        <Text style={label}>Category:</Text>
        <Text style={value}>{category}</Text>

        <Text style={label}>Subject:</Text>
        <Text style={value}>{subject}</Text>

        <Text style={label}>Description:</Text>
        <Text style={descriptionStyle}>{description}</Text>
      </Section>

      <Section style={buttonSection}>
        <Button
          style={button}
          href={`${process.env.NEXT_PUBLIC_APP_URL}/admin/support/${ticketId}`}
        >
          View & Respond to Ticket
        </Button>
      </Section>

      {priority !== 'standard' && (
        <Section style={urgentSection}>
          <Text style={urgentText}>
            {priority === 'dedicated'
              ? '⚡ This is a DEDICATED support customer. Please respond within 4 hours.'
              : '⚡ This is a PRIORITY support customer. Please respond within 24 hours.'}
          </Text>
        </Section>
      )}
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

const prioritySection = {
  padding: '0 40px',
  marginBottom: '24px',
};

const priorityBadge = {
  display: 'inline-block',
  padding: '8px 16px',
  borderRadius: '9999px',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: 'bold',
  letterSpacing: '0.5px',
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
  lineHeight: '24px',
  marginTop: '4px',
};

const descriptionStyle = {
  color: '#1f2937',
  fontSize: '16px',
  lineHeight: '24px',
  marginTop: '4px',
  whiteSpace: 'pre-wrap' as const,
  backgroundColor: '#f9fafb',
  padding: '16px',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
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

const urgentSection = {
  backgroundColor: '#fef3c7',
  padding: '16px 40px',
  margin: '0 40px',
  borderRadius: '8px',
  border: '1px solid #fbbf24',
};

const urgentText = {
  color: '#92400e',
  fontSize: '14px',
  fontWeight: '600',
  margin: 0,
  textAlign: 'center' as const,
};
