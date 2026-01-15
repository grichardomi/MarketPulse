export interface PublicPage {
  path: string;
  title: string;
  description: string;
  priority?: number;
  changeFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export const publicPages: PublicPage[] = [
  {
    path: '/',
    title: 'Home',
    description: 'Monitor your competitors effortlessly with MarketPulse.',
    priority: 1.0,
    changeFrequency: 'weekly',
  },
  {
    path: '/pricing',
    title: 'Pricing',
    description: 'Simple, transparent pricing for competitor monitoring.',
    priority: 0.9,
    changeFrequency: 'monthly',
  },
  {
    path: '/about',
    title: 'About',
    description: 'Learn more about MarketPulse and our mission.',
    priority: 0.7,
    changeFrequency: 'monthly',
  },
  {
    path: '/contact',
    title: 'Contact',
    description: 'Get in touch with the MarketPulse team.',
    priority: 0.6,
    changeFrequency: 'monthly',
  },
  {
    path: '/help',
    title: 'Help Center',
    description: 'Find answers and learn how to use MarketPulse.',
    priority: 0.7,
    changeFrequency: 'monthly',
  },
  {
    path: '/privacy',
    title: 'Privacy Policy',
    description: 'Read our privacy policy and data practices.',
    priority: 0.4,
    changeFrequency: 'yearly',
  },
  {
    path: '/terms',
    title: 'Terms of Service',
    description: 'Review the terms for using MarketPulse.',
    priority: 0.4,
    changeFrequency: 'yearly',
  },
  {
    path: '/status',
    title: 'Status',
    description: 'Check service availability and uptime.',
    priority: 0.4,
    changeFrequency: 'daily',
  },
];
