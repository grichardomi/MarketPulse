import type { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateMetadata({
  title: 'Terms of Service',
  description: 'Review the MarketPulse terms and conditions.',
  path: '/terms',
});
