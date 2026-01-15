import type { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateMetadata({
  title: 'Status',
  description: 'Check MarketPulse system status and uptime updates.',
  path: '/status',
});
