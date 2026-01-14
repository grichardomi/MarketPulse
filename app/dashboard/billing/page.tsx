'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Subscription {
  status: string;
  stripePriceId: string;
  competitorLimit: number;
  competitorsUsed: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  daysRemaining: number | null;
}

interface Payment {
  id: number;
  amount: number;
  amountFormatted: string;
  currency: string;
  status: string;
  createdAt: string;
}

// Plans data - matches lib/config/pricing.ts
const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 20,
    competitors: 5,
    features: [
      { name: 'Competitors', value: '5' },
      { name: 'Price tracking', value: 'Twice daily' },
      { name: 'Email alerts', value: true },
      { name: 'History retention', value: '30 days' },
      { name: 'Push notifications', value: true },
      { name: 'Support tickets', value: false },
      { name: 'API access', value: false },
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 50,
    competitors: 15,
    popular: true,
    features: [
      { name: 'Competitors', value: '15' },
      { name: 'Price tracking', value: 'Twice daily' },
      { name: 'Email alerts', value: true },
      { name: 'History retention', value: '90 days' },
      { name: 'Push notifications', value: true },
      { name: 'Support tickets', value: 'Priority' },
      { name: 'API access', value: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 200,
    competitors: 50,
    features: [
      { name: 'Competitors', value: '50' },
      { name: 'Price tracking', value: 'Twice daily' },
      { name: 'Email alerts', value: true },
      { name: 'History retention', value: 'Unlimited' },
      { name: 'Push notifications', value: true },
      { name: 'Support tickets', value: 'Dedicated' },
      { name: 'API access', value: true },
    ],
  },
];


export default function BillingPage() {
  const { status } = useSession();
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upgrading, setUpgrading] = useState(false);
  const [managingBilling, setManagingBilling] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(10);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      loadBillingData();
    }
  }, [status, router]);

  const loadBillingData = async () => {
    try {
      setLoading(true);

      // Fetch subscription
      const subRes = await fetch('/api/billing/subscription');
      const subData = await subRes.json();

      if (subData.hasSubscription) {
        setSubscription(subData.subscription);
      }

      // Fetch payment history
      const payRes = await fetch('/api/billing/payments');
      const payData = await payRes.json();
      setPayments(payData.payments || []);

      setError('');
    } catch (err) {
      console.error('Failed to load billing data:', err);
      setError('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: string, billingCycle: string = 'monthly') => {
    try {
      setUpgrading(true);
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, billingCycle }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      setError(err.message || 'Failed to upgrade');
      setUpgrading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setManagingBilling(true);
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to open billing portal');
      }

      // Redirect to Stripe customer portal
      window.location.href = data.portalUrl;
    } catch (err: any) {
      setError(err.message || 'Failed to open billing portal');
      setManagingBilling(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading billing information...</p>
        </div>
      </div>
    );
  }

  const isTrialing = subscription?.status === 'trialing';
  const isPaid = subscription?.status === 'active';
  const isPastDue = subscription?.status === 'past_due';

  return (
      <main className="container mx-auto px-4 sm:px-6 py-8 pb-20 md:pb-8">
        <h1 className="text-3xl font-bold mb-6">Billing & Subscription</h1>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Trial Warning */}
        {isTrialing && subscription?.daysRemaining !== null && subscription.daysRemaining <= 7 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-900 font-medium">
              ⏰ Your trial ends in {subscription.daysRemaining} {subscription.daysRemaining === 1 ? 'day' : 'days'}.
              Upgrade now to continue monitoring your competitors.
            </p>
          </div>
        )}

        {/* Past Due Warning */}
        {isPastDue && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-900 font-medium">
              ⚠️ Your payment failed. Please update your payment method to continue service.
            </p>
            <button
              onClick={handleManageBilling}
              disabled={managingBilling}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {managingBilling ? 'Opening...' : 'Update Payment Method'}
            </button>
          </div>
        )}

        {/* Current Plan Summary */}
        {subscription && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Current Plan</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isTrialing ? 'bg-amber-100 text-amber-700' :
                isPaid ? 'bg-green-100 text-green-700' :
                isPastDue ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {subscription.status === 'trialing' ? 'Free Trial' :
                 subscription.status === 'active' ? 'Active' :
                 subscription.status === 'past_due' ? 'Past Due' : subscription.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-600">Competitor Limit</p>
                <p className="text-2xl font-bold">
                  {subscription.competitorLimit === -1 ? 'Unlimited' : subscription.competitorLimit}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {subscription.competitorsUsed} of {subscription.competitorLimit} used
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {isTrialing ? 'Trial Period' : 'Current Period'}
                </p>
                <p className="text-lg font-semibold">
                  {new Date(subscription.currentPeriodStart).toLocaleDateString()} -
                  {' '}{new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {isTrialing ? 'Trial Ends' : 'Next Billing Date'}
                </p>
                <p className="text-lg font-semibold">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  {isTrialing && subscription.daysRemaining !== null && (
                    <span className="text-sm text-amber-600 ml-2">
                      ({subscription.daysRemaining} days left)
                    </span>
                  )}
                </p>
              </div>
            </div>

            {isPaid && (
              <button
                onClick={handleManageBilling}
                disabled={managingBilling}
                className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 disabled:opacity-50 font-medium"
              >
                {managingBilling ? 'Opening...' : 'Manage Subscription'}
              </button>
            )}
          </div>
        )}

        {/* Plans Comparison */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-2">
            {isTrialing ? 'Choose a Plan' : 'Available Plans'}
          </h2>
          <p className="text-gray-600 mb-6">
            {isTrialing
              ? 'Upgrade to continue using MarketPulse after your trial ends.'
              : 'Compare plans and features.'}
          </p>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const isCurrentPlan = isPaid && subscription?.competitorLimit === plan.competitors;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-lg border-2 p-6 ${
                    plan.popular
                      ? 'border-blue-500 shadow-lg'
                      : isCurrentPlan
                        ? 'border-green-500'
                        : 'border-gray-200'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
                      Most Popular
                    </span>
                  )}
                  {isCurrentPlan && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                      Current Plan
                    </span>
                  )}

                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-2 mb-4">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-gray-500">/month</span>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        {feature.value === true ? (
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : feature.value === false ? (
                          <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        <span className={feature.value === false ? 'text-gray-400' : 'text-gray-700'}>
                          {feature.name}: {typeof feature.value === 'boolean' ? (feature.value ? 'Yes' : 'No') : feature.value}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <button
                      disabled
                      className="w-full py-2 px-4 bg-green-100 text-green-700 rounded-lg font-medium cursor-default"
                    >
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={upgrading}
                      className={`w-full py-2 px-4 rounded-lg font-medium disabled:opacity-50 transition-colors ${
                        plan.popular
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      {upgrading ? 'Processing...' : isTrialing ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Trial Features Note */}
          {isTrialing && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-semibold text-amber-800 mb-2">Your Trial Includes:</h4>
              <ul className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-amber-700">
                <li className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  3 Competitors
                </li>
                <li className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Email Alerts
                </li>
                <li className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  30-Day History
                </li>
                <li className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-amber-600">No Support Access</span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Payment History</h2>

          {payments.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No payment history yet</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.slice(0, displayLimit).map((payment) => (
                      <tr key={payment.id} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">{payment.amountFormatted}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            payment.status === 'succeeded' ? 'bg-green-100 text-green-700' :
                            payment.status === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Load More Button */}
              {payments.length > displayLimit && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setDisplayLimit(prev => prev + 10)}
                    className="px-8 py-3 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 hover:border-blue-300"
                  >
                    Load More ({payments.length - displayLimit} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
  );
}
