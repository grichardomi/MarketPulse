import type { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateMetadata({
  title: 'Search',
  description: 'Search MarketPulse pages and help articles.',
  path: '/search',
  noIndex: true,
});
