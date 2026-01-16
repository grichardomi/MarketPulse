import * as React from 'react';
import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components';
import EmailLayout from './components/EmailLayout';

interface AlertEmailProps {
  competitorName?: string;
  alertType?: 'price_change' | 'new_promotion' | 'menu_change';
  message?: string;
  details?: any;
  dashboardUrl?: string;
  unsubscribeUrl?: string;
}

export default function AlertNotification({
  competitorName = 'Your Competitor',
  alertType = 'price_change',
  message = 'Changes detected',
  details = {},
  dashboardUrl = 'https://marketpulse.com/dashboard',
  unsubscribeUrl = 'https://marketpulse.com/settings/notifications',
}: AlertEmailProps) {
  const alertTypeLabels: Record<string, { label: string; emoji: string }> = {
    price_change: { label: 'Price Change', emoji: '💰' },
    new_promotion: { label: 'New Promotion', emoji: '🎉' },
    menu_change: { label: 'Menu Update', emoji: '🍽️' },
  };

  const alertTypeColors: Record<string, string> = {
    price_change: '#3B82F6', // blue
    new_promotion: '#10B981', // green
    menu_change: '#F59E0B', // amber
  };

  const typeInfo = alertTypeLabels[alertType] || {
    label: 'Update',
    emoji: '📢',
  };
  const badgeColor =
    alertTypeColors[alertType] || alertTypeColors.price_change;

  return (
    <EmailLayout
      previewText={`${typeInfo.emoji} ${typeInfo.label} at ${competitorName}`}
      footerText={`You're receiving this because you enabled email notifications for ${alertType.replace('_', ' ')}.`}
      settingsUrl={unsubscribeUrl}
    >
      {/* Alert Badge */}
      <Section style={{ backgroundColor: badgeColor, padding: '12px 20px' }}>
        <Text style={badgeText}>
          {typeInfo.emoji} {typeInfo.label}
        </Text>
      </Section>

      {/* Main Content */}
      <Section style={content}>
        <Heading as="h2" style={h2}>
          Update at {competitorName}
        </Heading>
        <Text style={paragraph}>{message}</Text>

        {/* Details Section */}
        {details &&
          Object.keys(details).length > 0 &&
          renderDetails(details, alertType)}

        {/* CTA Button */}
        <Section style={buttonContainer}>
          <Button style={button} href={dashboardUrl}>
            View in Dashboard
          </Button>
        </Section>
      </Section>
    </EmailLayout>
  );
}

function renderDetails(
  details: any,
  alertType: string
): React.ReactNode {
  if (alertType === 'price_change' && details.updated) {
    return (
      <Section style={detailsBox}>
        <Text style={detailsTitle}>Price Changes</Text>
        {details.updated.map((item: any, idx: number) => (
          <Text key={idx} style={detailItem}>
            <strong>{item.item || 'Item'}:</strong> {item.oldPrice} →{' '}
            {item.newPrice}
            {item.reduced ? ' ⬇️ Price reduced!' : ''}
          </Text>
        ))}
      </Section>
    );
  }

  if (alertType === 'new_promotion' && details.added) {
    return (
      <Section style={detailsBox}>
        <Text style={detailsTitle}>New Promotions</Text>
        {details.added.map((promo: any, idx: number) => (
          <Text key={idx} style={detailItem}>
            <strong>{promo.title || 'New Promotion'}:</strong>{' '}
            {promo.description}
          </Text>
        ))}
      </Section>
    );
  }

  if (alertType === 'menu_change' && details.added) {
    return (
      <Section style={detailsBox}>
        <Text style={detailsTitle}>New Menu Items</Text>
        {details.added.map((item: any, idx: number) => (
          <Text key={idx} style={detailItem}>
            <strong>New:</strong> {item.name}
            {item.price ? ` - ${item.price}` : ''}
          </Text>
        ))}
      </Section>
    );
  }

  return null;
}

// Styles
const badgeText = {
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600' as const,
  margin: '0',
  textAlign: 'center' as const,
};

const content = {
  padding: '32px 20px',
};

const h2 = {
  color: '#111827',
  fontSize: '24px',
  fontWeight: '600' as const,
  lineHeight: '1.4',
  margin: '0 0 16px',
};

const paragraph = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 24px',
};

const detailsBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px',
  margin: '0 0 24px',
};

const detailsTitle = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '600' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 12px',
};

const detailItem = {
  color: '#111827',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 8px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const button = {
  backgroundColor: '#3B82F6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};
