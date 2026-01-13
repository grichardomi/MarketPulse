'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils/format';
import { getPricingPlanByPriceId } from '@/lib/config/pricing';
import ConfirmationModal from '@/components/ConfirmationModal';

interface Message {
  id: number;
  message: string;
  isAdminResponse: boolean;
  createdAt: string;
  Ticket: {
    User: {
      name: string;
      email: string;
    };
  };
}

interface Ticket {
  id: number;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  User: {
    id: number;
    name: string;
    email: string;
    createdAt: string;
    Subscription: Array<{
      stripePriceId: string;
      status: string;
      competitorLimit: number;
    }>;
  };
}

export default function AdminSupportTicketDetailPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: '',
  });

  const loadTicket = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/support/tickets/${params.id}`);

      if (!res.ok) {
        if (res.status === 403) {
          router.push('/dashboard');
          return;
        }
        if (res.status === 404) {
          router.push('/admin/support');
          return;
        }
        throw new Error('Failed to load ticket');
      }

      const data = await res.json();
      setTicket(data.ticket);
    } catch (err) {
      console.error('Failed to load ticket:', err);
      setError('Failed to load support ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }

    if (status === 'authenticated' && params.id) {
      loadTicket();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, params.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    setError('');

    try {
      const res = await fetch(
        `/api/admin/support/tickets/${params.id}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: newMessage }),
        }
      );

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      setNewMessage('');
      await loadTicket();
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Change Ticket Status',
      message: `Are you sure you want to change this ticket status to "${newStatus.replace('_', ' ')}"?`,
      action: newStatus,
    });
  };

  const confirmStatusChange = async () => {
    const newStatus = confirmModal.action;
    setUpdatingStatus(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/support/tickets/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      setConfirmModal({ isOpen: false, title: '', message: '', action: '' });
      await loadTicket();
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('Failed to update ticket status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Ticket not found</p>
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'dedicated':
        return 'bg-purple-100 text-purple-700';
      case 'priority':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const subscription = ticket.User.Subscription[0];
  const plan = subscription
    ? getPricingPlanByPriceId(subscription.stripePriceId)
    : null;

  return (
    <main className="container mx-auto px-4 sm:px-6 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/support"
            className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
          >
            ← Back to Support Dashboard
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  #{ticket.id} - {ticket.subject}
                </h1>
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(ticket.status)}`}
                >
                  {ticket.status.replace('_', ' ')}
                </span>
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}
                >
                  {ticket.priority.toUpperCase()}
                </span>
              </div>
              <p className="text-gray-600">
                Created {formatRelativeTime(ticket.createdAt)} • Category:{' '}
                <span className="capitalize">{ticket.category}</span>
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Original Message */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                  {ticket.User.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">
                      {ticket.User.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatRelativeTime(ticket.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {ticket.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            {ticket.messages.map((message) => (
              <div
                key={message.id}
                className={`border rounded-lg p-6 ${
                  message.isAdminResponse
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      message.isAdminResponse
                        ? 'bg-green-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    {message.isAdminResponse
                      ? 'A'
                      : message.Ticket.User.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">
                        {message.isAdminResponse
                          ? 'Support Team'
                          : message.Ticket.User.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatRelativeTime(message.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {message.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Reply Form */}
            {ticket.status !== 'closed' && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Respond as Support Team
                </h3>
                <form onSubmit={handleSendMessage}>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your response here..."
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent mb-4"
                    disabled={sendingMessage}
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={sendingMessage || !newMessage.trim()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingMessage ? 'Sending...' : 'Send Response'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Actions */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Actions
              </h3>
              <div className="space-y-2">
                {ticket.status !== 'in_progress' && (
                  <button
                    onClick={() => handleStatusChange('in_progress')}
                    disabled={updatingStatus}
                    className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                  >
                    Mark In Progress
                  </button>
                )}
                {ticket.status !== 'resolved' && (
                  <button
                    onClick={() => handleStatusChange('resolved')}
                    disabled={updatingStatus}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Mark Resolved
                  </button>
                )}
                {ticket.status !== 'closed' && (
                  <button
                    onClick={() => handleStatusChange('closed')}
                    disabled={updatingStatus}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                  >
                    Close Ticket
                  </button>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Customer Info
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">
                    {ticket.User.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">
                    {ticket.User.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer Since</p>
                  <p className="font-medium text-gray-900">
                    {new Date(ticket.User.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Subscription</p>
                  <p className="font-medium text-gray-900">
                    {plan ? plan.name : 'Free Trial'}
                  </p>
                  {subscription && (
                    <p className="text-sm text-gray-600">
                      Status: {subscription.status}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Support Tier</p>
                  <span
                    className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}
                  >
                    {ticket.priority.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* SLA Info */}
            {ticket.priority !== 'standard' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ⚡ SLA Alert
                </h3>
                <p className="text-sm text-gray-700">
                  {ticket.priority === 'dedicated'
                    ? 'Dedicated support: 4-hour response time expected'
                    : 'Priority support: 24-hour response time expected'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, title: '', message: '', action: '' })}
        onConfirm={confirmStatusChange}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Change Status"
        confirmButtonClass="bg-yellow-600 hover:bg-yellow-700"
        isLoading={updatingStatus}
      />
    </main>
  );
}
