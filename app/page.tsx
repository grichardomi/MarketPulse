'use server';

import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/auth-options';
import Footer from '@/components/Footer';
import { PRICING_PLANS } from '@/lib/config/pricing';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-2 md:py-3 lg:py-4 border-b border-gray-200 bg-white">
        <Link href="/">
          <Image
            src="/logo_transparent.png"
            alt="MarketPulse"
            width={500}
            height={125}
            className="h-16 md:h-16 lg:h-20 xl:h-24 w-auto"
            priority
          />
        </Link>
        <div className="flex gap-2 sm:gap-4">
          <Link href="/pricing" className="px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-600 hover:text-gray-900">
            Pricing
          </Link>
          <Link href="/auth/signin" className="px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-600 hover:text-gray-900">
            Sign In
          </Link>
          <Link href="/auth/signin" className="px-3 sm:px-6 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 py-12 sm:py-20 text-center">
        <div className="inline-block mb-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          14-Day Free Trial • No Credit Card Required
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
          Stop Guessing What Your<br />Competitors Are Doing
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-4 max-w-3xl mx-auto">
          Know instantly when competitors change prices, launch promotions, or update their offerings. Make data-driven decisions and stay one step ahead.
        </p>
        <p className="text-sm sm:text-base text-gray-500 mb-8 max-w-2xl mx-auto">
          Used by restaurant owners, retailers, and service businesses to monitor competition automatically.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/auth/signin" className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 text-lg shadow-lg hover:shadow-xl transition-all">
            Start Free Trial
          </Link>
          <Link href="/pricing" className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 text-lg">
            View Pricing
          </Link>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            <span>Setup in 5 minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            <span>24/7 monitoring</span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16 sm:py-24 bg-white rounded-2xl shadow-sm my-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">How MarketPulse Works</h2>
          <p className="text-lg text-gray-600">Get started in three simple steps</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="text-xl font-semibold mb-3">Add Competitors</h3>
            <p className="text-gray-600">
              Simply paste your competitors&apos; website URLs. Our AI automatically discovers and categorizes their offerings.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="text-xl font-semibold mb-3">We Monitor 24/7</h3>
            <p className="text-gray-600">
              MarketPulse checks competitor sites continuously, detecting price changes, new promotions, and menu updates.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="text-xl font-semibold mb-3">Get Instant Alerts</h3>
            <p className="text-gray-600">
              Receive notifications via email, SMS, push, or Slack the moment something changes. React faster than your competition.
            </p>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="container mx-auto px-4 py-16 sm:py-24">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Perfect For Your Industry</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white p-8 rounded-xl border-2 border-gray-200 hover:border-blue-400 transition-colors">
            <div className="text-4xl mb-4">🍕</div>
            <h3 className="text-xl font-bold mb-3">Restaurants & Cafes</h3>
            <p className="text-gray-600 mb-4">
              Track competitor menu changes, daily specials, and pricing updates. Know when nearby restaurants launch promotions.
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Monitor menu item prices</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Track daily specials</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Detect new promotions</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-xl border-2 border-gray-200 hover:border-blue-400 transition-colors">
            <div className="text-4xl mb-4">🛍️</div>
            <h3 className="text-xl font-bold mb-3">Retail Stores</h3>
            <p className="text-gray-600 mb-4">
              Stay competitive with real-time alerts on product pricing, sales events, and inventory changes from nearby retailers.
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Product price tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Sale event notifications</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Stock availability alerts</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-xl border-2 border-gray-200 hover:border-blue-400 transition-colors">
            <div className="text-4xl mb-4">💼</div>
            <h3 className="text-xl font-bold mb-3">Service Businesses</h3>
            <p className="text-gray-600 mb-4">
              Monitor service packages, pricing tiers, and promotional offers from competing service providers in your area.
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Service pricing changes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Package updates</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Promotional campaigns</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 sm:py-24 bg-gray-50 rounded-2xl">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">Everything You Need to Win</h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Powerful features that save you hours of manual research while keeping you ahead of the competition
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              icon: '⚡',
              title: 'Real-Time Alerts',
              desc: 'Get notified within minutes when competitors change anything. No more manual checking.',
              benefit: 'React 10x faster than competitors'
            },
            {
              icon: '🤖',
              title: 'AI-Powered Analysis',
              desc: 'Claude AI automatically extracts prices, products, and promotions from any website.',
              benefit: 'Save 10+ hours per week'
            },
            {
              icon: '⚙️',
              title: '5-Minute Setup',
              desc: 'No technical knowledge required. Add competitors and start monitoring immediately.',
              benefit: 'Start monitoring today'
            },
            {
              icon: '📱',
              title: 'Mobile-First Dashboard',
              desc: 'Check competitor activity from anywhere. Optimized for phone, tablet, and desktop.',
              benefit: 'Stay informed on the go'
            },
            {
              icon: '🔗',
              title: 'Slack & Webhook Integration',
              desc: 'Send alerts directly to Slack, Discord, or your own systems via webhooks.',
              benefit: 'Fits your workflow'
            },
            {
              icon: '💰',
              title: 'Transparent Pricing',
              desc: `Simple plans starting at ${PRICING_PLANS.starter.displayPrice}/month. No hidden fees, cancel anytime.`,
              benefit: 'ROI from day one'
            },
          ].map((feature, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm mb-3">{feature.desc}</p>
              <p className="text-blue-600 text-sm font-medium">{feature.benefit}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="container mx-auto px-4 py-16 sm:py-24">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Trusted by Business Owners</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-yellow-400">★</span>
              ))}
            </div>
            <p className="text-gray-700 mb-4">
              &quot;MarketPulse saved me hours every week. I used to manually check 5 competitor websites daily. Now I just get alerts when something changes.&quot;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                SM
              </div>
              <div>
                <p className="font-semibold text-sm">Sarah Martinez</p>
                <p className="text-xs text-gray-500">Owner, Corner Cafe Austin</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-yellow-400">★</span>
              ))}
            </div>
            <p className="text-gray-700 mb-4">
              &quot;Caught a competitor launching a 20% off sale within 10 minutes. Adjusted our pricing immediately and didn&apos;t lose customers. Worth every penny.&quot;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                JK
              </div>
              <div>
                <p className="font-semibold text-sm">James Kim</p>
                <p className="text-xs text-gray-500">Manager, Downtown Retail</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-yellow-400">★</span>
              ))}
            </div>
            <p className="text-gray-700 mb-4">
              &quot;Setup was incredibly easy. Added 3 competitors in under 5 minutes and already got my first alert. This is exactly what I needed.&quot;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                EP
              </div>
              <div>
                <p className="font-semibold text-sm">Emily Porter</p>
                <p className="text-xs text-gray-500">Owner, Boutique Fitness Studio</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-16 sm:py-24 max-w-4xl">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {[
            {
              q: "Do I need a credit card for the free trial?",
              a: "No! Start your 14-day free trial with just your email. No credit card required. If you love it, you can upgrade anytime."
            },
            {
              q: "How often do you check competitor websites?",
              a: "We monitor your competitors every 12 hours by default. You can customize the frequency for each competitor (from hourly to daily checks) based on your needs."
            },
            {
              q: "What types of changes does MarketPulse detect?",
              a: "Our AI detects price changes, new menu items or products, promotional offers, service updates, and any significant content changes on competitor websites."
            },
            {
              q: "Can I track competitors in different cities?",
              a: "Absolutely! Track competitors anywhere in the world. Just add their website URL and our system will monitor them regardless of location."
            },
            {
              q: "What if my competitor doesn't have a website?",
              a: "Currently, MarketPulse monitors web-based information. We're working on social media monitoring for businesses without websites."
            },
            {
              q: "Can I cancel anytime?",
              a: "Yes! Cancel your subscription anytime with one click. No long-term contracts, no cancellation fees. We believe in earning your business every month."
            },
            {
              q: "How accurate is the AI detection?",
              a: "Our AI is powered by Claude and achieves 95%+ accuracy in detecting changes. We're constantly improving it, and you can always view the raw data yourself."
            },
            {
              q: "Do you offer refunds?",
              a: "If you're not satisfied within the first 30 days, we'll refund your money, no questions asked. Your satisfaction is our priority."
            }
          ].map((faq, idx) => (
            <details key={idx} className="bg-white p-6 rounded-lg border border-gray-200 group">
              <summary className="font-semibold text-lg cursor-pointer list-none flex justify-between items-center">
                <span>{faq.q}</span>
                <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-16 sm:py-24">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 sm:p-12 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Stop Losing Customers to Competitors?
          </h2>
          <p className="text-lg sm:text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Join hundreds of business owners who stay ahead with MarketPulse. Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/signin" className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 text-lg shadow-lg">
              Start Free 14-Day Trial
            </Link>
            <Link href="/pricing" className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-blue-700 text-lg">
              View Pricing Plans
            </Link>
          </div>
          <p className="mt-6 text-sm text-blue-200">
            No credit card required • Setup in 5 minutes • Cancel anytime
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
