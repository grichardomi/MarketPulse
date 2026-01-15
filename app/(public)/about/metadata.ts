import type { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateMetadata({
  title: 'About',
  description: 'Learn about MarketPulse and the team behind it.',
  path: '/about',
});
