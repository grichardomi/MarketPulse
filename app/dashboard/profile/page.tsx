'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface UserProfile {
  id: number;
  email: string;
  name: string | null;
  image: string | null;
  hasPassword: boolean;
  authMethods: string[];
  createdAt: string;
  role: string;
  city: string | null;
  state: string | null;
  zipcode: string | null;
  pendingEmail: string | null;
  pendingEmailExpires: string | null;
}

export default function ProfilePage() {
  const { status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipcode, setZipcode] = useState('');

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
  }

  // Load profile
  useEffect(() => {
    if (status === 'authenticated') {
      loadProfile();
    }
  }, [status]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/profile');
      if (!res.ok) throw new Error('Failed to load profile');

      const data: UserProfile = await res.json();
      setProfile(data);

      // Update form state
      setName(data.name || '');
      setEmail(data.email);
      setCity(data.city || '');
      setState(data.state || '');
      setZipcode(data.zipcode || '');
      setError('');
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEmailChange = async () => {
    try {
      const res = await fetch('/api/user/cancel-email-change', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel email change');
      }

      // Reload profile to clear pending email
      await loadProfile();
      setSuccess('Email change cancelled');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to cancel email change:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel email change');
    }
  };

  const handleResendVerification = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const res = await fetch('/api/user/resend-email-verification', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend verification email');
      }

      setSuccess('Verification email resent! Please check your inbox.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Failed to resend verification:', err);
      setError(err instanceof Error ? err.message : 'Failed to resend verification');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          city: city || null,
          state: state || null,
          zipcode: zipcode || null
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle special case: password required before email change
        if (data.requiresPassword) {
          setError('PASSWORD_REQUIRED');
          setEmail(profile?.email || ''); // Reset email field
          setSaving(false);
          return;
        }
        const errorMsg = data.message || data.details ? `${data.error}: ${data.message || data.details}` : (data.error || 'Failed to update profile');
        throw new Error(errorMsg);
      }

      setProfile((prev) => (prev ? { ...prev, ...data.user } : null));
      setHasChanges(false);

      // Show appropriate success message
      if (data.emailChangeInitiated) {
        setSuccess(data.message || 'Verification email sent. Please check your inbox.');
        // Reset email field to current email since change is pending
        setEmail(profile?.email || '');
      } else {
        setSuccess('Profile updated successfully!');
      }

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl pb-20 md:pb-8">
        {error && error !== 'PASSWORD_REQUIRED' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {error === 'PASSWORD_REQUIRED' && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-amber-800">Password Required</h3>
                <p className="text-sm text-amber-700 mt-1">
                  You must set a password before changing your email address. This ensures you can still sign in after the email change, since your new email won&apos;t be linked to your Google account.
                </p>
                <Link
                  href="/dashboard/security"
                  className="inline-block mt-3 px-4 py-2 text-sm bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors font-medium"
                >
                  Set Password in Security Settings
                </Link>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            ✓ {success}
          </div>
        )}

        {/* Pending Email Warning */}
        {profile?.pendingEmail && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800">Email Change Pending</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  A verification email has been sent to <strong>{profile.pendingEmail}</strong>.
                  Please check your inbox (and spam folder) and click the verification link to complete the email change.
                </p>
                {profile.pendingEmailExpires && (
                  <p className="text-xs text-yellow-600 mt-2">
                    ⏰ Link expires: {new Date(profile.pendingEmailExpires).toLocaleString()}
                  </p>
                )}
                <p className="text-xs text-yellow-600 mt-2">
                  Your current email ({profile.email}) will remain active until you verify the new address.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleResendVerification}
                    disabled={saving}
                    className="px-3 py-1.5 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Sending...' : 'Resend Email'}
                  </button>
                  <button
                    onClick={handleCancelEmailChange}
                    className="px-3 py-1.5 text-xs text-yellow-800 hover:text-yellow-900 border border-yellow-300 rounded hover:bg-yellow-100 transition-colors"
                  >
                    Cancel Change
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your personal information and account settings</p>
        </div>

        <div className="space-y-8">
          {/* Personal Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="your@email.com"
                />
                {email !== profile?.email && (
                  <p className="text-xs text-blue-600 mt-1">
                    ℹ️ You'll receive a verification email to confirm the change
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Address Information</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Austin"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => {
                          setState(e.target.value.toUpperCase());
                          setHasChanges(true);
                        }}
                        maxLength={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
                        placeholder="TX"
                      />
                      <p className="text-xs text-gray-500 mt-1">2-letter code</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
                      <input
                        type="text"
                        value={zipcode}
                        onChange={(e) => {
                          setZipcode(e.target.value);
                          setHasChanges(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="78701"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Account Information</h2>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Account ID</span>
                <span className="font-medium">{profile?.id}</span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-gray-600">Account Created</span>
                <span className="font-medium">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-gray-600">Role</span>
                <span className="font-medium capitalize">{profile?.role}</span>
              </div>

              <div className="flex justify-between py-2 border-t border-gray-200 pt-4">
                <span className="text-gray-600">Authentication Methods</span>
                <div className="flex gap-2">
                  {profile?.authMethods.map((method) => (
                    <span
                      key={method}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                    >
                      {method === 'google' ? 'Google' : 'Password'}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
              {!profile?.hasPassword && (
                <Link
                  href="/dashboard/security"
                  className="block px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 text-center font-medium"
                >
                  Set a Password
                </Link>
              )}
              <Link
                href="/dashboard/security"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 text-center font-medium"
              >
                Manage Security Settings
              </Link>
              <Link
                href="/dashboard/business"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 text-center font-medium"
              >
                Business Settings
              </Link>
            </div>
          </div>

          {/* Save Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => loadProfile()}
              disabled={saving || !hasChanges}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Discard Changes
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={saving || !hasChanges}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </main>
  );
}
