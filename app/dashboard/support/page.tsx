'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils/format';

interface Ticket {
  id: number;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    messages: number;
  };
}

export default function SupportPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState('');
  const [hasAccess, setHasAccess] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }

    if (status === 'authenticated') {
      loadTickets();
    }
  }, [status, router]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/support/tickets');

      if (!res.ok) {
        throw new Error('Failed to load tickets');
      }

      const data = await res.json();
      setTickets(data.tickets || []);
      setHasAccess(data.hasAccess !== false);
      setSubscriptionStatus(data.subscriptionStatus || null);
    } catch (err) {
      console.error('Failed to load tickets:', err);
      setError('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading support tickets...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-700';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'resolved':
        return 'bg-green-100 text-green-700';
      case 'closed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'dedicated':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
            Dedicated Support
          </span>
        );
      case 'priority':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700">
            Priority Support
          </span>
        );
      default:
        return null;
    }
  };

  // Show upgrade prompt for users without support access
  if (!hasAccess) {
    return (
      <main className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Support Tickets</h1>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {subscriptionStatus === 'trialing'
                ? 'Support tickets are available on Professional and Enterprise plans. Upgrade to get priority help from our team.'
                : subscriptionStatus === 'active'
                  ? 'Support tickets are available on Professional and Enterprise plans. Upgrade your plan to access our support team.'
                  : 'Upgrade to Professional or Enterprise to access our dedicated support team.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard/billing">
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                  View Plans & Upgrade
                </button>
              </Link>
              <a
                href="mailto:support@marketpulse.com"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Email Us Instead
              </a>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              Need urgent help? Email us at support@marketpulse.com
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Support</h1>
            <p className="text-gray-600 mt-2">
              Get help from our support team
            </p>
          </div>
          <Link href="/dashboard/support/new">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              New Ticket
            </button>
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Tickets List */}
        {tickets.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-600 mb-4">No support tickets yet</p>
            <Link href="/dashboard/support/new">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                Create Your First Ticket
              </button>
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/dashboard/support/${ticket.id}`}
                  className="block hover:bg-gray-50 transition-colors"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {ticket.subject}
                          </h3>
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}
                          >
                            {ticket.status.replace('_', ' ')}
                          </span>
                          {getPriorityBadge(ticket.priority)}
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {ticket.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-3">
                      <span>Created {formatRelativeTime(ticket.createdAt)}</span>
                      <span>•</span>
                      <span>{ticket._count.messages} messages</span>
                      <span>•</span>
                      <span className="capitalize">{ticket.category}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
