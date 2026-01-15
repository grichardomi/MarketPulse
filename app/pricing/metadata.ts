import type { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateMetadata({
  title: 'Pricing',
  description: 'Choose the MarketPulse plan that fits your business.',
  path: '/pricing',
});
