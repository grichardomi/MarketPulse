import Stripe from 'stripe';
import { PRICING_PLANS, getCompetitorLimit } from '@/lib/config/pricing';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

/**
 * Export pricing plans from centralized config
 * DO NOT modify pricing here - update .env.local instead
 */
export { PRICING_PLANS };

// Helper to get price ID based on plan
export function getPriceId(plan: keyof typeof PRICING_PLANS): string {
  return PRICING_PLANS[plan].priceId;
}

// Helper to get competitor limit from price ID
export function getCompetitorLimitFromPriceId(priceId: string): number {
  return getCompetitorLimit(priceId);
}
