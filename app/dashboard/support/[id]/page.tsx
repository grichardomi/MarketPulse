'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils/format';
import ConfirmationModal from '@/components/ConfirmationModal';

interface Message {
  id: number;
  message: string;
  isAdminResponse: boolean;
  createdAt: string;
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
    name: string;
    email: string;
  };
}

export default function SupportTicketDetailPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [closingTicket, setClosingTicket] = useState(false);

  const loadTicket = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/support/tickets/${params.id}`);

      if (!res.ok) {
        if (res.status === 404) {
          router.push('/dashboard/support');
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
      const res = await fetch(`/api/support/tickets/${params.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage }),
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      setNewMessage('');
      await loadTicket(); // Reload to get the new message
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCloseTicket = () => {
    setShowCloseConfirm(true);
  };

  const confirmCloseTicket = async () => {
    setClosingTicket(true);
    setError('');

    try {
      const res = await fetch(`/api/support/tickets/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      });

      if (!res.ok) {
        throw new Error('Failed to close ticket');
      }

      setShowCloseConfirm(false);
      await loadTicket();
    } catch (err) {
      console.error('Failed to close ticket:', err);
      setError('Failed to close ticket');
    } finally {
      setClosingTicket(false);
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

  return (
    <main className="container mx-auto px-4 sm:px-6 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/support"
            className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
          >
            ← Back to Support
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {ticket.subject}
                </h1>
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(ticket.status)}`}
                >
                  {ticket.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-gray-600">
                Created {formatRelativeTime(ticket.createdAt)} • Category:{' '}
                <span className="capitalize">{ticket.category}</span>
              </p>
            </div>
            {ticket.status !== 'closed' && (
              <button
                onClick={handleCloseTicket}
                className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
              >
                Close Ticket
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Original Message */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
              {ticket.User.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-gray-900">
                  {ticket.User.name || 'You'}
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
        {ticket.messages.length > 0 && (
          <div className="space-y-4 mb-6">
            {ticket.messages.map((message) => (
              <div
                key={message.id}
                className={`border rounded-lg p-6 ${
                  message.isAdminResponse
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      message.isAdminResponse
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-600 text-white'
                    }`}
                  >
                    {message.isAdminResponse ? 'S' : ticket.User.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">
                        {message.isAdminResponse ? 'Support Team' : ticket.User.name || 'You'}
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
          </div>
        )}

        {/* Reply Form */}
        {ticket.status !== 'closed' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add Reply
            </h3>
            <form onSubmit={handleSendMessage}>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent mb-4"
                disabled={sendingMessage}
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={sendingMessage || !newMessage.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMessage ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </form>
          </div>
        )}

        {ticket.status === 'closed' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-600">
              This ticket is closed. If you need further assistance, please create a new ticket.
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={confirmCloseTicket}
        title="Close Ticket"
        message="Are you sure you want to close this ticket? You won't be able to add more messages once it's closed."
        confirmText="Close Ticket"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        isLoading={closingTicket}
      />
    </main>
  );
}
