import * as React from 'react';
import {
  Button,
  Heading,
  Section,
  Text,
  Hr,
} from '@react-email/components';
import EmailLayout from './components/EmailLayout';

interface CompetitorSnapshot {
  name: string;
  lastChecked: string;
  daysSinceChange: number | null;
  priceCount: number;
}

interface WeeklySummaryProps {
  userName?: string;
  dashboardUrl?: string;
  settingsUrl?: string;
  weekStartDate?: string;
  weekEndDate?: string;
  // Stats
  competitorsMonitored?: number;
  crawlsCompleted?: number;
  alertsTriggered?: number;
  priceChanges?: number;
  promotionChanges?: number;
  menuChanges?: number;
  // Competitor snapshots
  competitors?: CompetitorSnapshot[];
  // Insights
  longestStableCompetitor?: string;
  longestStableDays?: number;
}

export default function WeeklySummary({
  userName = 'there',
  dashboardUrl = 'https://app.marketpulse.com/dashboard',
  settingsUrl = 'https://app.marketpulse.com/dashboard/settings',
  weekStartDate = 'Jan 1',
  weekEndDate = 'Jan 7',
  competitorsMonitored = 0,
  crawlsCompleted = 0,
  alertsTriggered = 0,
  priceChanges = 0,
  promotionChanges = 0,
  menuChanges = 0,
  competitors = [],
  longestStableCompetitor = '',
  longestStableDays = 0,
}: WeeklySummaryProps) {
  const hasChanges = alertsTriggered > 0;
  const hasCompetitors = competitorsMonitored > 0;

  return (
    <EmailLayout
      previewText={`Your weekly competitive intelligence report (${weekStartDate} - ${weekEndDate})`}
      settingsUrl={settingsUrl}
      footerText="You're receiving this weekly summary because you have competitors being monitored."
    >
      {/* Header */}
      <Section style={header}>
        <Text style={weekBadge}>
          {weekStartDate} - {weekEndDate}
        </Text>
        <Heading style={h1}>Weekly Summary</Heading>
        <Text style={subtitle}>Your competitive intelligence report</Text>
      </Section>

      <Section style={content}>
        <Text style={greeting}>Hi {userName},</Text>

        {!hasCompetitors ? (
          <>
            <Text style={paragraph}>
              You don't have any competitors being monitored yet. Add competitors to start
              receiving weekly insights about your market.
            </Text>
            <Button style={buttonPrimary} href={`${dashboardUrl}/competitors/discover`}>
              Find Competitors
            </Button>
          </>
        ) : (
          <>
            {/* Summary Stats */}
            <Section style={statsContainer}>
              <table style={statsTable} cellPadding="0" cellSpacing="0">
                <tbody>
                  <tr>
                    <td style={statCell}>
                      <Text style={statNumber}>{competitorsMonitored}</Text>
                      <Text style={statLabel}>Monitored</Text>
                    </td>
                    <td style={statCell}>
                      <Text style={statNumber}>{crawlsCompleted}</Text>
                      <Text style={statLabel}>Checks</Text>
                    </td>
                    <td style={statCell}>
                      <Text style={statNumber}>{alertsTriggered}</Text>
                      <Text style={statLabel}>Alerts</Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>

            {/* Status Message */}
            {hasChanges ? (
              <Section style={alertBox}>
                <Text style={alertBoxTitle}>Changes Detected This Week</Text>
                <Text style={alertBoxText}>
                  {priceChanges > 0 && `💰 ${priceChanges} price change${priceChanges !== 1 ? 's' : ''}`}
                  {priceChanges > 0 && (promotionChanges > 0 || menuChanges > 0) && ' • '}
                  {promotionChanges > 0 && `🎉 ${promotionChanges} promotion${promotionChanges !== 1 ? 's' : ''}`}
                  {promotionChanges > 0 && menuChanges > 0 && ' • '}
                  {menuChanges > 0 && `🍽️ ${menuChanges} menu update${menuChanges !== 1 ? 's' : ''}`}
                </Text>
                <Button style={buttonSmall} href={`${dashboardUrl}/alerts`}>
                  View All Alerts
                </Button>
              </Section>
            ) : (
              <Section style={stableBox}>
                <Text style={stableBoxTitle}>All Competitors Stable</Text>
                <Text style={stableBoxText}>
                  No price or menu changes were detected this week. Your competitors
                  are maintaining their current pricing.
                </Text>
                {longestStableCompetitor && longestStableDays > 0 && (
                  <Text style={insightText}>
                    💡 <strong>{longestStableCompetitor}</strong> hasn't changed prices in {longestStableDays} days
                  </Text>
                )}
              </Section>
            )}

            <Hr style={divider} />

            {/* Competitor Snapshots */}
            {competitors.length > 0 && (
              <>
                <Heading style={h2}>Competitor Status</Heading>
                {competitors.map((comp, idx) => (
                  <Section key={idx} style={competitorRow}>
                    <table style={competitorTable} cellPadding="0" cellSpacing="0">
                      <tbody>
                        <tr>
                          <td style={competitorInfo}>
                            <Text style={competitorName}>{comp.name}</Text>
                            <Text style={competitorMeta}>
                              Last checked: {comp.lastChecked}
                              {comp.priceCount > 0 && ` • ${comp.priceCount} prices tracked`}
                            </Text>
                          </td>
                          <td style={competitorStatus}>
                            {comp.daysSinceChange === null ? (
                              <Text style={statusNew}>New</Text>
                            ) : comp.daysSinceChange === 0 ? (
                              <Text style={statusChanged}>Changed</Text>
                            ) : (
                              <Text style={statusStable}>
                                Stable ({comp.daysSinceChange}d)
                              </Text>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </Section>
                ))}
              </>
            )}

            <Hr style={divider} />

            {/* Tips Section */}
            <Section style={tipsBox}>
              <Heading style={h3}>Quick Tips</Heading>
              {!hasChanges && (
                <Text style={tipText}>
                  📊 <strong>Stable market?</strong> This could be a good time to test pricing
                  changes while competitors hold steady.
                </Text>
              )}
              <Text style={tipText}>
                🔔 <strong>Stay informed:</strong> We'll send you instant alerts when any
                competitor changes their prices or promotions.
              </Text>
              <Text style={tipText}>
                ➕ <strong>Expand coverage:</strong> Add more competitors to get a fuller
                picture of your market.
              </Text>
            </Section>

            {/* CTA */}
            <Button style={buttonPrimary} href={dashboardUrl}>
              View Full Dashboard
            </Button>
          </>
        )}
      </Section>
    </EmailLayout>
  );
}

// Styles
const header = {
  backgroundColor: '#1e40af',
  padding: '32px 20px',
  textAlign: 'center' as const,
};

const weekBadge = {
  backgroundColor: 'rgba(255,255,255,0.2)',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: '600' as const,
  padding: '6px 12px',
  borderRadius: '20px',
  display: 'inline-block',
  margin: '0 0 12px',
};

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  margin: '0 0 8px',
};

const subtitle = {
  color: 'rgba(255,255,255,0.8)',
  fontSize: '16px',
  margin: '0',
};

const content = {
  padding: '32px 24px',
};

const greeting = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 24px',
};

const paragraph = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  marginBottom: '24px',
};

const statsContainer = {
  margin: '0 0 24px',
};

const statsTable = {
  width: '100%',
  backgroundColor: '#f3f4f6',
  borderRadius: '12px',
};

const statCell = {
  width: '33.33%',
  padding: '20px 12px',
  textAlign: 'center' as const,
};

const statNumber = {
  color: '#1e40af',
  fontSize: '32px',
  fontWeight: 'bold' as const,
  margin: '0 0 4px',
  lineHeight: '1',
};

const statLabel = {
  color: '#6b7280',
  fontSize: '13px',
  margin: '0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const alertBox = {
  backgroundColor: '#fef3c7',
  border: '1px solid #fcd34d',
  borderRadius: '12px',
  padding: '20px',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const alertBoxTitle = {
  color: '#92400e',
  fontSize: '16px',
  fontWeight: '600' as const,
  margin: '0 0 8px',
};

const alertBoxText = {
  color: '#a16207',
  fontSize: '14px',
  margin: '0 0 16px',
};

const stableBox = {
  backgroundColor: '#ecfdf5',
  border: '1px solid #a7f3d0',
  borderRadius: '12px',
  padding: '20px',
  margin: '0 0 24px',
};

const stableBoxTitle = {
  color: '#065f46',
  fontSize: '16px',
  fontWeight: '600' as const,
  margin: '0 0 8px',
};

const stableBoxText = {
  color: '#047857',
  fontSize: '14px',
  margin: '0 0 12px',
  lineHeight: '1.5',
};

const insightText = {
  color: '#065f46',
  fontSize: '13px',
  margin: '0',
  padding: '12px',
  backgroundColor: 'rgba(255,255,255,0.5)',
  borderRadius: '8px',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const h2 = {
  color: '#111827',
  fontSize: '18px',
  fontWeight: '600' as const,
  margin: '0 0 16px',
};

const h3 = {
  color: '#374151',
  fontSize: '16px',
  fontWeight: '600' as const,
  margin: '0 0 12px',
};

const competitorRow = {
  marginBottom: '12px',
};

const competitorTable = {
  width: '100%',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '12px 16px',
};

const competitorInfo = {
  verticalAlign: 'middle' as const,
};

const competitorName = {
  color: '#111827',
  fontSize: '15px',
  fontWeight: '500' as const,
  margin: '0 0 4px',
};

const competitorMeta = {
  color: '#6b7280',
  fontSize: '13px',
  margin: '0',
};

const competitorStatus = {
  textAlign: 'right' as const,
  verticalAlign: 'middle' as const,
};

const statusNew = {
  color: '#7c3aed',
  fontSize: '12px',
  fontWeight: '600' as const,
  backgroundColor: '#ede9fe',
  padding: '4px 10px',
  borderRadius: '12px',
  margin: '0',
  display: 'inline-block',
};

const statusChanged = {
  color: '#b45309',
  fontSize: '12px',
  fontWeight: '600' as const,
  backgroundColor: '#fef3c7',
  padding: '4px 10px',
  borderRadius: '12px',
  margin: '0',
  display: 'inline-block',
};

const statusStable = {
  color: '#047857',
  fontSize: '12px',
  fontWeight: '600' as const,
  backgroundColor: '#d1fae5',
  padding: '4px 10px',
  borderRadius: '12px',
  margin: '0',
  display: 'inline-block',
};

const tipsBox = {
  backgroundColor: '#f0f9ff',
  borderRadius: '12px',
  padding: '20px',
  margin: '0 0 24px',
};

const tipText = {
  color: '#0c4a6e',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 12px',
};

const buttonPrimary = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '14px 24px',
};

const buttonSmall = {
  backgroundColor: '#92400e',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  padding: '8px 16px',
};
