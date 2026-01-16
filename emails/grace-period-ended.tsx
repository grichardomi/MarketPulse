import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components';
import EmailLayout from './components/EmailLayout';

interface GracePeriodEndedProps {
  userName?: string;
  dashboardUrl?: string;
}

export default function GracePeriodEnded({
  userName = 'there',
  dashboardUrl = 'https://app.marketpulse.com/dashboard',
}: GracePeriodEndedProps) {
  return (
    <EmailLayout
      previewText="Your MarketPulse grace period has ended"
      footerText="MarketPulse - Competitive Intelligence Made Simple"
      settingsUrl={`${dashboardUrl}/settings`}
    >
      <Section style={header}>
        <Heading style={h1}>Your grace period has ended</Heading>
      </Section>

      <Section style={content}>
        <Text style={paragraph}>Hi {userName},</Text>

        <Text style={paragraph}>
          Your 3-day grace period has ended. Your MarketPulse account is now paused,
          and you no longer have access to your competitor monitoring data.
        </Text>

        <Section style={urgentBox}>
          <Text style={urgentTitle}>
            ⏰ Your data is waiting for you
          </Text>
          <Text style={urgentText}>
            All your competitor data, insights, and historical tracking are safely stored.
            Upgrade now to regain immediate access and resume monitoring.
          </Text>
        </Section>

        <Button style={button} href={`${dashboardUrl}/billing`}>
          Reactivate Your Account
        </Button>

        <Section style={benefitsBox}>
          <Heading style={h2}>What you're missing:</Heading>
          <Text style={benefitText}>
            ✗ Real-time competitor monitoring
          </Text>
          <Text style={benefitText}>
            ✗ Instant change alerts
          </Text>
          <Text style={benefitText}>
            ✗ Price tracking and insights
          </Text>
          <Text style={benefitText}>
            ✗ Competitive intelligence reports
          </Text>
        </Section>

        <Text style={paragraph}>
          <strong>Reactivate in under 2 minutes:</strong>
        </Text>

        <Text style={paragraph}>
          Choose a plan, enter your payment details, and you'll have immediate access
          to all your data and monitoring. No setup required - everything is exactly
          where you left it.
        </Text>

        <Button style={secondaryButton} href={`${dashboardUrl}/billing`}>
          View Plans & Pricing
        </Button>

        <Text style={paragraph}>
          Have questions about which plan is right for you? Just reply to this email
          and we'll help you choose.
        </Text>

        <Text style={paragraphSmall}>
          Your account and data will be permanently deleted after 30 days of inactivity.
          Upgrade anytime before then to keep your data.
        </Text>
      </Section>
    </EmailLayout>
  );
}

const header = {
  padding: '0 20px 16px',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#dc2626',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
};

const h2 = {
  color: '#1e293b',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 16px',
};

const content = {
  padding: '0 48px',
};

const paragraph = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  marginBottom: '16px',
};

const paragraphSmall = {
  color: '#94a3b8',
  fontSize: '14px',
  lineHeight: '20px',
  marginTop: '24px',
};

const urgentBox = {
  backgroundColor: '#fee2e2',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  borderLeft: '4px solid #dc2626',
};

const urgentTitle = {
  color: '#991b1b',
  fontSize: '18px',
  fontWeight: 'bold' as const,
  lineHeight: '24px',
  margin: '0 0 12px',
};

const urgentText = {
  color: '#7f1d1d',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '0',
};

const benefitsBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const benefitText = {
  color: '#64748b',
  fontSize: '15px',
  lineHeight: '24px',
  marginBottom: '12px',
  textDecoration: 'line-through',
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

const secondaryButton = {
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
