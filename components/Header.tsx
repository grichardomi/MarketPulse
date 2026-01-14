'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

interface Subscription {
  status: string;
  daysRemaining: number | null;
  currentPeriodEnd: string;
  stripePriceId?: string;
  competitorLimit?: number;
}

interface HeaderProps {
  subscription?: Subscription | null;
}

export default function Header({ subscription }: HeaderProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts?limit=1&isRead=false');
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, []);

  // Fetch unread count on mount and periodically
  useEffect(() => {
    if (status !== 'authenticated') return;

    fetchUnreadCount();
    // Refresh every 60 seconds
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [status, fetchUnreadCount]);

  // Refresh when navigating away from alerts page
  useEffect(() => {
    if (status === 'authenticated' && !pathname?.startsWith('/dashboard/alerts')) {
      fetchUnreadCount();
    }
  }, [pathname, status, fetchUnreadCount]);

  // Check if user has support access (Professional or Enterprise plans only)
  // Professional = 15 competitors, Enterprise = 50 competitors
  const hasSupportAccess = subscription?.status === 'active' &&
    subscription?.competitorLimit !== undefined &&
    subscription.competitorLimit >= 15;

  const allNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Competitors', href: '/dashboard/competitors', icon: '👥' },
    { label: 'Alerts', href: '/dashboard/alerts', icon: '🔔' },
    { label: 'Support', href: '/dashboard/support', icon: '💬', requiresSupport: true },
    { label: 'Billing', href: '/dashboard/billing', icon: '💳' },
    { label: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
  ];

  // Filter out Support for users without support access (Trial, Starter)
  const navItems = allNavItems.filter(item => !item.requiresSupport || hasSupportAccess);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Desktop & Mobile Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 py-2 md:py-3 lg:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/dashboard" className="flex-shrink-0">
              <Image
                src="/logo_transparent.png"
                alt="MarketPulse"
                width={500}
                height={125}
                className="h-16 md:h-16 lg:h-20 xl:h-24 w-auto"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8 flex-1 mx-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm lg:text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* User Menu */}
            <div className="relative flex items-center gap-2 sm:gap-4">
              {/* Notification Bell */}
              <Link
                href="/dashboard/alerts"
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title={unreadCount > 0 ? `${unreadCount} unread alerts` : 'Alerts'}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Plan Badge - Prominent display */}
              {subscription?.status === 'trialing' && (
                <Link
                  href="/dashboard/billing"
                  className="hidden sm:flex items-center bg-amber-100 rounded-full border border-amber-200 hover:bg-amber-200 transition-colors overflow-hidden"
                >
                  <span className="px-3 py-1.5 text-amber-800 text-sm font-semibold">
                    On Trial
                  </span>
                  {subscription.daysRemaining !== null && (
                    <span className="px-3 py-1.5 bg-amber-700 text-white text-sm font-bold flex items-center justify-center min-w-[60px]">
                      {subscription.daysRemaining}d left
                    </span>
                  )}
                </Link>
              )}
              {/* Mobile Trial Badge */}
              {subscription?.status === 'trialing' && (
                <Link
                  href="/dashboard/billing"
                  className="sm:hidden px-2 py-1 bg-amber-700 text-white rounded-full text-xs font-bold"
                >
                  {subscription.daysRemaining !== null ? `${subscription.daysRemaining}d` : 'Trial'}
                </Link>
              )}
              {subscription?.status === 'active' && (
                <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-semibold border border-green-200">
                  Pro
                </span>
              )}
              {subscription?.status === 'past_due' && (
                <Link
                  href="/dashboard/billing"
                  className="px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-xs sm:text-sm font-semibold border border-red-200 hover:bg-red-200 transition-colors animate-pulse"
                >
                  Past Due
                </Link>
              )}
              {!subscription && (
                <Link
                  href="/dashboard/billing"
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm font-semibold border border-gray-200 hover:bg-gray-200 transition-colors"
                >
                  Free
                </Link>
              )}

              {/* User Info (Hidden on small mobile) */}
              <div className="text-right hidden sm:block">
                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">
                  {session?.user?.name || session?.user?.email}
                </p>
              </div>

              {/* Desktop User Dropdown */}
              <div className="relative hidden md:block group">
                <button className="px-3 lg:px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center gap-2">
                  Account
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link href="/dashboard/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg">
                    Profile Settings
                  </Link>
                  <Link href="/dashboard/business" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Business Settings
                  </Link>
                  <Link href="/dashboard/security" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Security
                  </Link>
                  <div className="border-t border-gray-200"></div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 rounded-b-lg"
                  >
                    Sign Out
                  </button>
                </div>
              </div>

              {/* Mobile Sign Out Button */}
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="md:hidden px-3 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-xs sm:text-sm font-medium"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden safe-bottom z-40">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center py-2 px-2 text-[10px] sm:text-xs font-medium transition-colors ${
                isActive(item.href)
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <span className="relative text-base sm:text-lg mb-0.5">
                {item.icon}
                {item.href === '/dashboard/alerts' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </span>
              <span className="truncate max-w-[60px]">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
