export interface HelpArticle {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  content: string;
  relatedArticles: { id: string; title: string }[];
}

export const helpArticles: HelpArticle[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn how to set up your account and add your first competitor',
    category: 'Basics',
    icon: '🚀',
    content: `
# Getting Started with MarketPulse

Welcome to MarketPulse! This guide will help you get up and running quickly.

## Step 1: Create Your Account

1. Sign up using your email or Google account
2. Verify your email address
3. Complete your business profile

## Step 2: Add Your First Competitor

1. Navigate to the Competitors page
2. Click "Add Competitor"
3. Enter the competitor's website URL
4. Configure monitoring settings

## Step 3: Set Up Alerts

Your competitors are now being monitored automatically. You'll receive alerts when:
- Prices change
- New promotions are detected
- Menu or product changes occur

## Next Steps

- Customize your notification preferences
- Add more competitors
- Review your dashboard regularly

Need more help? [Contact our support team](/contact)
    `,
    relatedArticles: [
      { id: 'adding-competitors', title: 'Adding Competitors' },
      { id: 'understanding-alerts', title: 'Understanding Alerts' },
    ],
  },
  {
    id: 'adding-competitors',
    title: 'Adding Competitors',
    description: 'Step-by-step guide to monitoring your competitors',
    category: 'Basics',
    icon: '👥',
    content: `
# Adding Competitors

Learn how to add and monitor your competitors effectively.

## How to Add a Competitor

1. **Navigate to Competitors page**
   - Click "Competitors" in the main navigation

2. **Click "Add Competitor" button**
   - Located in the top right corner

3. **Enter competitor details**
   - Business name
   - Website URL (must be a valid URL)
   - Industry/category

4. **Configure monitoring settings**
   - Crawl frequency (how often to check for changes)
   - Enable/disable specific alert types

## Best Practices

- Start with 3-5 main competitors
- Use accurate website URLs
- Enable alerts for changes that matter to your business
- Review competitor data weekly

## Competitor Limits

Your plan determines how many competitors you can monitor:
- **Starter**: 5 competitors
- **Professional**: 15 competitors
- **Enterprise**: Unlimited

[Upgrade your plan](/dashboard/billing) to monitor more competitors.
    `,
    relatedArticles: [
      { id: 'getting-started', title: 'Getting Started' },
      { id: 'price-tracking', title: 'Price Tracking' },
    ],
  },
  {
    id: 'understanding-alerts',
    title: 'Understanding Alerts',
    description: 'Learn about different alert types and how to manage them',
    category: 'Features',
    icon: '🔔',
    content: `
# Understanding Alerts

MarketPulse monitors your competitors and sends you alerts when changes are detected.

## Alert Types

### Price Change Alerts 💰
Triggered when competitor prices change by more than your threshold.

### New Promotion Alerts 🎉
Notifies you when competitors launch new promotions or sales.

### Menu/Product Change Alerts 📋
Alerts you to changes in competitor offerings or menu items.

## Managing Alerts

### Viewing Alerts
- Go to the Alerts page
- Filter by type, competitor, or date
- Mark alerts as read

### Alert Settings
Configure which alerts you receive:
1. Go to Settings
2. Navigate to Notifications
3. Enable/disable specific alert types
4. Set notification channels (email, in-app)

## Alert Filters

Use filters to find specific alerts:
- **By Type**: Filter by alert category
- **By Competitor**: View alerts from specific competitors
- **By Status**: Show read or unread alerts
- **By Date**: View alerts from a specific time period

[Learn more about notification settings](/help/notification-settings)
    `,
    relatedArticles: [
      { id: 'notification-settings', title: 'Notification Settings' },
      { id: 'price-tracking', title: 'Price Tracking' },
    ],
  },
  {
    id: 'managing-subscription',
    title: 'Managing Your Subscription',
    description: 'Upgrade, downgrade, or cancel your subscription',
    category: 'Billing',
    icon: '💳',
    content: `
# Managing Your Subscription

Everything you need to know about billing and subscriptions.

## Subscription Plans

### Starter Plan - $49/month
- Monitor up to 5 competitors
- Daily price tracking
- Email alerts
- 7-day data history

### Professional Plan - $99/month
- Monitor up to 15 competitors
- Hourly price tracking
- Email + in-app alerts
- 30-day data history
- Priority support

### Enterprise Plan - $299/month
- Unlimited competitors
- Real-time tracking
- Advanced analytics
- 1-year data history
- Dedicated account manager

## How to Upgrade

1. Go to [Billing page](/dashboard/billing)
2. Click "Upgrade Plan"
3. Select your desired plan
4. Complete payment

## How to Cancel

1. Go to [Billing page](/dashboard/billing)
2. Click "Manage Subscription"
3. Select "Cancel Subscription"
4. Confirm cancellation

## Billing FAQ

### When am I charged?
You are charged at the beginning of each billing cycle (monthly).

### Can I change plans anytime?
Yes, you can upgrade or downgrade at any time. Changes take effect immediately.

### Do you offer refunds?
We offer a 14-day money-back guarantee for new subscribers.

## Need help?

Contact our support team or check our [Help Center](/help) for more information.
    `,
    relatedArticles: [
      { id: 'getting-started', title: 'Getting Started' },
      { id: 'account-security', title: 'Account Security' },
    ],
  },
  {
    id: 'price-tracking',
    title: 'Price Tracking',
    description: 'How price monitoring and change detection works',
    category: 'Features',
    icon: '💰',
    content: `
# Price Tracking

Learn how MarketPulse monitors competitor pricing and detects changes.

## How Price Tracking Works

MarketPulse automatically scans competitor websites at scheduled intervals to detect pricing changes. Our system:

1. **Crawls competitor pages** based on your monitoring schedule
2. **Extracts pricing data** using advanced parsing algorithms
3. **Compares prices** with previous snapshots
4. **Alerts you** when significant changes occur

## Monitoring Frequency

You can choose how often we check competitor prices:
- **Daily** (Starter plan)
- **Hourly** (Professional plan)
- **Real-time** (Enterprise plan)

## Price Change Thresholds

Set custom thresholds to avoid noise:
- Percentage changes (e.g., alert on 5%+ changes)
- Absolute changes (e.g., alert on $10+ changes)

## Viewing Price History

Access historical price data:
1. Go to Competitors
2. Select a competitor
3. View the Price History tab

## Troubleshooting

If price tracking isn't working:
- Check the competitor URL
- Ensure the page is publicly accessible
- Contact support for help

Need help? [Contact support](/contact)
    `,
    relatedArticles: [
      { id: 'understanding-alerts', title: 'Understanding Alerts' },
      { id: 'notification-settings', title: 'Notification Settings' },
    ],
  },
  {
    id: 'notification-settings',
    title: 'Notification Settings',
    description: 'Configure how and when you receive alerts',
    category: 'Settings',
    icon: '⚙️',
    content: `
# Notification Settings

Customize how and when you receive alerts from MarketPulse.

## Notification Channels

You can receive alerts via:
- **Email** (default)
- **In-app notifications**
- **Push notifications** (Enterprise plan)

## Configuring Notifications

1. Go to **Settings** in your dashboard
2. Click **Notifications**
3. Toggle alerts on/off for each type
4. Set quiet hours (optional)

## Alert Types

Choose which alerts to receive:
- Price changes
- New promotions
- Menu changes
- Competitor additions

## Best Practices

- Enable only the alerts that matter most
- Set quiet hours to avoid interruptions
- Review settings monthly

Need help? [Contact support](/contact)
    `,
    relatedArticles: [
      { id: 'understanding-alerts', title: 'Understanding Alerts' },
      { id: 'price-tracking', title: 'Price Tracking' },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    description: 'Common issues and how to resolve them',
    category: 'Support',
    icon: '🔧',
    content: `
# Troubleshooting

Resolve common issues quickly with these troubleshooting steps.

## Common Issues

### Competitor Not Monitoring
- Verify the website URL is correct
- Ensure the website is publicly accessible
- Check your plan limits

### Missing Alerts
- Check notification settings
- Verify your email address
- Check spam folder

### Incorrect Data
- Ensure the competitor URL points to the correct page
- Allow time for the next crawl cycle
- Contact support for manual review

## Contact Support

If the issue persists, contact our support team:
- Email: support@getmarketpulse.com
- Help Center: [Contact Form](/contact)
    `,
    relatedArticles: [
      { id: 'account-security', title: 'Account Security' },
      { id: 'notification-settings', title: 'Notification Settings' },
    ],
  },
  {
    id: 'account-security',
    title: 'Account Security',
    description: 'Keep your account safe with best practices',
    category: 'Security',
    icon: '🔒',
    content: `
# Account Security

Keep your MarketPulse account safe with these best practices.

## Password Security

- Use a strong, unique password
- Enable two-factor authentication (if available)
- Change your password regularly

## Account Settings

Update your security settings:
1. Go to Profile Settings
2. Click Security
3. Update password or enable 2FA

## Data Protection

MarketPulse protects your data with:
- End-to-end encryption
- Secure backups
- GDPR compliant

## Account Deletion

To delete your account:
1. Go to [Account Settings](/dashboard/account/delete)
2. Click "Delete Account"
3. Confirm deletion
4. All data will be permanently removed

**Note**: This action cannot be undone.

Read our [Privacy Policy](/privacy) for more information.
    `,
    relatedArticles: [
      { id: 'troubleshooting', title: 'Troubleshooting' },
      { id: 'managing-subscription', title: 'Managing Subscription' },
    ],
  },
];

export const helpArticleById: Record<string, HelpArticle> = Object.fromEntries(
  helpArticles.map((article) => [article.id, article])
);

export function getHelpArticleById(id: string) {
  return helpArticleById[id];
}
