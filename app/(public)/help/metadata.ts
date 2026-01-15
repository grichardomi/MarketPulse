import type { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateMetadata({
  title: 'Help Center',
  description: 'Browse MarketPulse help articles and get answers fast.',
  path: '/help',
});
