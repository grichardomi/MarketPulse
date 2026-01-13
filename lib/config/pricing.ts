/**
 * SINGLE SOURCE OF TRUTH FOR PRICING
 * All pricing information comes from environment variables
 * Update .env.local to change pricing across the entire app
 */

export interface PricingTier {
  id: string;
  name: string;
  priceId: string;
  price: number; // in cents
  displayPrice: string; // formatted for display (e.g., "$20")
  competitorLimit: number;
  features: string[];
  highlighted?: boolean;
}

// Helper to get env var with fallback
function getEnvNumber(key: string, fallback: number): number {
  const value = process.env[key];
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

function getEnvString(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

// Format price in cents to display string
function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

/**
 * PRICING CONFIGURATION
 * Reads from environment variables with sensible defaults
 */
export const PRICING_PLANS: Record<string, PricingTier> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    priceId: getEnvString('STRIPE_STARTER_PRICE_ID', 'price_1SoEPrRmoXSly4A3ARWfwpbc'),
    price: getEnvNumber('STRIPE_STARTER_PRICE', 2000), // $20
    displayPrice: formatPrice(getEnvNumber('STRIPE_STARTER_PRICE', 2000)),
    competitorLimit: getEnvNumber('STRIPE_STARTER_LIMIT', 5),
    features: [
      '5 competitors',
      'Twice-daily tracking',
      'Email alerts',
      'Mobile app access',
      '30-day history',
    ],
    highlighted: false,
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    priceId: getEnvString('STRIPE_PRO_PRICE_ID', 'price_1SoES1RmoXSly4A3dVUJFoMS'),
    price: getEnvNumber('STRIPE_PRO_PRICE', 5000), // $50
    displayPrice: formatPrice(getEnvNumber('STRIPE_PRO_PRICE', 5000)),
    competitorLimit: getEnvNumber('STRIPE_PRO_LIMIT', 15),
    features: [
      '15 competitors',
      'Twice-daily tracking',
      'Email + SMS alerts',
      'Webhook integrations',
      'Priority support',
      '90-day history',
    ],
    highlighted: true,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    priceId: getEnvString('STRIPE_ENTERPRISE_PRICE_ID', 'price_1SoETFRmoXSly4A3McPoBTHV'),
    price: getEnvNumber('STRIPE_ENTERPRISE_PRICE', 20000), // $200
    displayPrice: formatPrice(getEnvNumber('STRIPE_ENTERPRISE_PRICE', 20000)),
    competitorLimit: getEnvNumber('STRIPE_ENTERPRISE_LIMIT', 50),
    features: [
      '50 competitors',
      'Twice-daily tracking',
      'Email + SMS alerts',
      'Unlimited webhooks',
      'API access',
      'Dedicated support',
      'Unlimited history',
    ],
    highlighted: false,
  },
};

/**
 * Get pricing plan by ID
 */
export function getPricingPlan(planId: string): PricingTier | undefined {
  return PRICING_PLANS[planId];
}

/**
 * Get pricing plan by Stripe Price ID
 */
export function getPricingPlanByPriceId(priceId: string): PricingTier | undefined {
  return Object.values(PRICING_PLANS).find(plan => plan.priceId === priceId);
}

/**
 * Get all pricing plans as array
 */
export function getAllPricingPlans(): PricingTier[] {
  return Object.values(PRICING_PLANS);
}

/**
 * Get competitor limit for a price ID
 */
export function getCompetitorLimit(priceId: string): number {
  const plan = getPricingPlanByPriceId(priceId);
  return plan?.competitorLimit || 5; // Default to starter limit
}

/**
 * Trial configuration
 */
export const TRIAL_CONFIG = {
  durationDays: getEnvNumber('TRIAL_DURATION_DAYS', 14),
  gracePeriodDays: getEnvNumber('TRIAL_GRACE_PERIOD_DAYS', 3),
  competitorLimit: getEnvNumber('TRIAL_COMPETITOR_LIMIT', 3),
};
