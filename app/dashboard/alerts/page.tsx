'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense, useCallback } from 'react';
import Link from 'next/link';

interface Alert {
  id: number;
  alertType: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  competitor?: {
    id: number;
    name: string;
    url: string;
  } | null;
}

interface FilterOption {
  type?: string;
  id?: number;
  label?: string;
  name?: string;
  value?: string;
  count: number;
}

interface AlertsResponse {
  alerts: Alert[];
  total: number;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  filters: {
    alertTypes: FilterOption[];
    competitors: FilterOption[];
    readStatus: FilterOption[];
  };
}

const ALERT_TYPE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  price_change: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '💰' },
  new_promotion: { bg: 'bg-green-100', text: 'text-green-700', icon: '🎉' },
  menu_change: { bg: 'bg-purple-100', text: 'text-purple-700', icon: '📋' },
};

function AlertsContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterData, setFilterData] = useState<AlertsResponse['filters'] | null>(null);
  const [total, setTotal] = useState(0);
  const [selectedAlerts, setSelectedAlerts] = useState<Set<number>>(new Set());
  const [undoAction, setUndoAction] = useState<{ alertIds: number[]; previousState: boolean } | null>(null);
  const notifyAlertsUpdated = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('alerts-updated'));
    }
  }, []);

  // Filters
  const [alertType, setAlertType] = useState(searchParams.get('alertType') || 'all');
  const [isRead, setIsRead] = useState(searchParams.get('isRead') || 'all');
  const [competitorId, setCompetitorId] = useState(searchParams.get('competitorId') || 'all');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');
  const [displayLimit, setDisplayLimit] = useState(20);
  const [hasMore, setHasMore] = useState(false);

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
  }

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: (displayLimit + 1).toString(), // Fetch one extra to check if there are more
        offset: '0',
        alertType: alertType !== 'all' ? alertType : '',
        isRead: isRead !== 'all' ? isRead : '',
        competitorId: competitorId !== 'all' ? competitorId : '',
        dateFrom: dateFrom || '',
        dateTo: dateTo || '',
        sortBy,
        sortOrder,
      });

      const res = await fetch(`/api/alerts?${params}`);
      if (!res.ok) throw new Error('Failed to load alerts');

      const data: AlertsResponse = await res.json();
      // Check if there are more alerts than displayLimit
      setHasMore(data.alerts.length > displayLimit);
      // Only show up to displayLimit
      setAlerts(data.alerts.slice(0, displayLimit));
      setTotal(data.total);
      setFilterData(data.filters);
      setError('');
    } catch (err) {
      console.error('Failed to load alerts:', err);
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [displayLimit, alertType, isRead, competitorId, dateFrom, dateTo, sortBy, sortOrder]);

  // Load alerts
  useEffect(() => {
    if (status === 'authenticated') {
      loadAlerts();
    }
  }, [status, loadAlerts]);

  // Reset display limit when filters change
  useEffect(() => {
    setDisplayLimit(20);
  }, [alertType, isRead, competitorId, dateFrom, dateTo, sortBy, sortOrder]);

  // Reload when display limit changes
  useEffect(() => {
    if (status === 'authenticated' && displayLimit > 20) {
      loadAlerts();
    }
  }, [status, displayLimit, loadAlerts]);

  const handleSelectAlert = (alertId: number) => {
    const newSet = new Set(selectedAlerts);
    if (newSet.has(alertId)) {
      newSet.delete(alertId);
    } else {
      newSet.add(alertId);
    }
    setSelectedAlerts(newSet);
  };

  const handleSelectAll = () => {
    if (selectedAlerts.size === alerts.length) {
      setSelectedAlerts(new Set());
    } else {
      setSelectedAlerts(new Set(alerts.map((a) => a.id)));
    }
  };

  // Toggle read status for a single alert (inline action)
  const handleToggleRead = async (alertId: number, currentIsRead: boolean) => {
    const newIsRead = !currentIsRead;

    // Optimistic UI update
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, isRead: newIsRead } : alert
    ));

    // Store for undo
    setUndoAction({ alertIds: [alertId], previousState: currentIsRead });
    setTimeout(() => setUndoAction(null), 5000);

    try {
      const res = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertIds: [alertId],
          isRead: newIsRead,
        }),
      });

      if (!res.ok) {
        // Revert on failure
        setAlerts(prev => prev.map(alert =>
          alert.id === alertId ? { ...alert, isRead: currentIsRead } : alert
        ));
        throw new Error('Failed to update alert');
      }
      notifyAlertsUpdated();
    } catch (err) {
      console.error('Failed to update alert:', err);
      setError('Failed to update alert');
      setUndoAction(null);
    }
  };

  // Bulk mark as read/unread (for selected alerts)
  const handleBulkMarkAsRead = async (markAsRead: boolean) => {
    if (selectedAlerts.size === 0) return;

    const alertIds = Array.from(selectedAlerts);
    const previousStates = new Map(
      alerts.filter(a => alertIds.includes(a.id)).map(a => [a.id, a.isRead])
    );

    // Optimistic UI update
    setAlerts(prev => prev.map(alert =>
      alertIds.includes(alert.id) ? { ...alert, isRead: markAsRead } : alert
    ));

    // Store for undo (use the opposite of what we're setting)
    setUndoAction({ alertIds, previousState: !markAsRead });
    setSelectedAlerts(new Set());
    setTimeout(() => setUndoAction(null), 5000);

    try {
      const res = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertIds,
          isRead: markAsRead,
        }),
      });

      if (!res.ok) {
        // Revert on failure
        setAlerts(prev => prev.map(alert => {
          const prevState = previousStates.get(alert.id);
          return prevState !== undefined ? { ...alert, isRead: prevState } : alert;
        }));
        throw new Error('Failed to update alerts');
      }
      notifyAlertsUpdated();
    } catch (err) {
      console.error('Failed to update alerts:', err);
      setError('Failed to update alerts');
      setUndoAction(null);
    }
  };

  const handleUndo = async () => {
    if (!undoAction) return;

    const { alertIds, previousState } = undoAction;

    // Optimistic UI update
    setAlerts(prev => prev.map(alert =>
      alertIds.includes(alert.id) ? { ...alert, isRead: previousState } : alert
    ));

    setUndoAction(null);

    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertIds,
          isRead: previousState,
        }),
      });
      notifyAlertsUpdated();
    } catch (err) {
      console.error('Failed to undo:', err);
      loadAlerts();
    }
  };

  const handleClearFilters = () => {
    setAlertType('all');
    setIsRead('all');
    setCompetitorId('all');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters =
    alertType !== 'all' ||
    isRead !== 'all' ||
    competitorId !== 'all' ||
    dateFrom ||
    dateTo;


  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
      <main className="container mx-auto px-4 sm:px-6 py-8 pb-20 md:pb-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Alerts</h1>
          <p className="text-gray-600">
            {total} {total === 1 ? 'alert' : 'alerts'} found
          </p>
        </div>

        {/* Filters Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Filters</h2>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Alert Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Alert Type
              </label>
              <select
                value={alertType}
                onChange={(e) => {
                  setAlertType(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              >
                <option value="all">All Types</option>
                {filterData?.alertTypes.map((at) => (
                  <option key={at.type} value={at.type}>
                    {at.type?.replace('_', ' ') || 'Unknown'} ({at.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Read Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Status
              </label>
              <select
                value={isRead}
                onChange={(e) => {
                  setIsRead(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              >
                <option value="all">All</option>
                <option value="false">Unread</option>
                <option value="true">Read</option>
              </select>
            </div>

            {/* Competitor Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Competitor
              </label>
              <select
                value={competitorId}
                onChange={(e) => {
                  setCompetitorId(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              >
                <option value="all">All Competitors</option>
                {filterData?.competitors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Date From Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </div>

            {/* Date To Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          {/* Sort Options */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-4">
            <label className="text-sm font-medium text-gray-900">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            >
              <option value="createdAt">Date</option>
              <option value="alertType">Type</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            >
              <option value="desc">Newest</option>
              <option value="asc">Oldest</option>
            </select>
          </div>
        </div>

        {/* Undo Toast */}
        {undoAction && (
          <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-gray-900 text-white rounded-lg shadow-lg flex items-center gap-4 animate-in slide-in-from-bottom-4">
            <span className="text-sm">
              {undoAction.alertIds.length} alert{undoAction.alertIds.length !== 1 ? 's' : ''} marked as {undoAction.previousState ? 'unread' : 'read'}
            </span>
            <button
              onClick={handleUndo}
              className="px-3 py-1 bg-white text-gray-900 rounded font-medium text-sm hover:bg-gray-100 transition-colors"
            >
              Undo
            </button>
          </div>
        )}

        {/* Alerts List */}
        {alerts.length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">No alerts yet</h3>
            <p className="text-gray-600">
              {hasActiveFilters
                ? 'No alerts match your filters. Try adjusting them.'
                : 'Alerts will appear here when your competitors have changes.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Header Row - Desktop */}
            <div className="hidden md:grid md:grid-cols-[auto_1fr_180px_140px_140px_100px] items-center gap-4 px-4 py-3 bg-gray-100 rounded-lg">
              <input
                type="checkbox"
                checked={selectedAlerts.size === alerts.length && alerts.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 rounded"
                title="Select all"
              />
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-700">Alert</p>
                {selectedAlerts.size > 0 && (
                  <span className="text-xs text-blue-600 font-medium">
                    ({selectedAlerts.size} selected)
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-700">Competitor</p>
              <p className="text-sm font-semibold text-gray-700">Type</p>
              <p className="text-sm font-semibold text-gray-700">Date</p>
              <div className="flex items-center gap-1">
                {selectedAlerts.size > 0 ? (
                  <>
                    <button
                      onClick={() => handleBulkMarkAsRead(true)}
                      className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Mark selected as read"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleBulkMarkAsRead(false)}
                      className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Mark selected as unread"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-gray-500">Actions</span>
                )}
              </div>
            </div>

            {/* Alert Items */}
            {alerts.map((alert) => {
              const alertColor = ALERT_TYPE_COLORS[alert.alertType] || {
                bg: 'bg-gray-100',
                text: 'text-gray-700',
                icon: '📌',
              };
              const alertDate = new Date(alert.createdAt);
              const formattedDate = alertDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={alert.id}
                  className={`border rounded-lg transition-colors ${
                    selectedAlerts.has(alert.id)
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {/* Desktop Layout */}
                  <div className="hidden md:grid md:grid-cols-[auto_1fr_180px_140px_140px_100px] items-center gap-4 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedAlerts.has(alert.id)}
                      onChange={() => handleSelectAlert(alert.id)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div className="flex items-center gap-2 min-w-0">
                      <p className={`font-medium truncate ${alert.isRead ? 'text-gray-500' : 'text-gray-900'}`}>
                        {alert.message}
                      </p>
                      {!alert.isRead && (
                        <span className="flex-shrink-0 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                          New
                        </span>
                      )}
                    </div>
                    <div className="truncate">
                      {alert.competitor ? (
                        <Link
                          href={`/dashboard/competitors/${alert.competitor.id}`}
                          className="text-sm text-blue-600 hover:underline truncate"
                        >
                          {alert.competitor.name}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium w-fit ${alertColor.bg} ${alertColor.text}`}
                    >
                      <span>{alertColor.icon}</span>
                      {alert.alertType.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-600">{formattedDate}</span>
                    <button
                      onClick={() => handleToggleRead(alert.id, alert.isRead)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                        alert.isRead
                          ? 'text-blue-600 hover:bg-blue-50 border border-blue-200'
                          : 'text-green-600 hover:bg-green-50 border border-green-200'
                      }`}
                      title={alert.isRead ? 'Mark as unread' : 'Mark as read'}
                    >
                      {alert.isRead ? (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Unread
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Read
                        </>
                      )}
                    </button>
                  </div>

                  {/* Mobile Layout */}
                  <div className="md:hidden p-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedAlerts.has(alert.id)}
                        onChange={() => handleSelectAlert(alert.id)}
                        className="w-4 h-4 text-blue-600 rounded mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className={`font-medium break-words ${alert.isRead ? 'text-gray-500' : 'text-gray-900'}`}>
                            {alert.message}
                          </p>
                          {!alert.isRead && (
                            <span className="flex-shrink-0 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                              New
                            </span>
                          )}
                        </div>
                        {alert.competitor && (
                          <div className="mb-2">
                            <Link
                              href={`/dashboard/competitors/${alert.competitor.id}`}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {alert.competitor.name}
                            </Link>
                          </div>
                        )}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${alertColor.bg} ${alertColor.text}`}
                            >
                              <span>{alertColor.icon}</span>
                              {alert.alertType.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-gray-500">{formattedDate}</span>
                          </div>
                          <button
                            onClick={() => handleToggleRead(alert.id, alert.isRead)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                              alert.isRead
                                ? 'text-blue-600 hover:bg-blue-50 border border-blue-200'
                                : 'text-green-600 hover:bg-green-50 border border-green-200'
                            }`}
                          >
                            {alert.isRead ? 'Mark unread' : 'Mark read'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && alerts.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setDisplayLimit(prev => prev + 20)}
              className="px-8 py-3 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 hover:border-blue-300"
            >
              Load More Alerts ({total - alerts.length} remaining)
            </button>
          </div>
        )}
      </main>
  );
}

export default function AlertsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading alerts...</p>
        </div>
      </div>
    }>
      <AlertsContent />
    </Suspense>
  );
}
