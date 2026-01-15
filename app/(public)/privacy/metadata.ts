import type { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateMetadata({
  title: 'Privacy Policy',
  description: 'Read how MarketPulse collects, uses, and protects your data.',
  path: '/privacy',
});
