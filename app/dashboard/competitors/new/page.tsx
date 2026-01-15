'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function NewCompetitorPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [competitorLimit, setCompetitorLimit] = useState<number>(3);
  const [currentCount, setCurrentCount] = useState<number>(0);
  const [loadingLimit, setLoadingLimit] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    crawlFrequencyMinutes: 720,
    isActive: true,
  });

  // Validation helpers
  const isNameValid = formData.name.trim().length >= 2;
  // Simple URL validation - just needs to have a dot and some characters
  const urlTrimmed = formData.url.trim();
  const isUrlValid = urlTrimmed.length > 3 && urlTrimmed.includes('.') && !urlTrimmed.includes(' ');
  const isAtLimit = currentCount >= competitorLimit;
  const isFormValid = isNameValid && isUrlValid && !isAtLimit;

  // Fetch limit data
  useEffect(() => {
    const fetchLimitData = async () => {
      try {
        const res = await fetch('/api/subscription/limit', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setCompetitorLimit(data.competitorLimit ?? 3);
          setCurrentCount(data.currentCount ?? 0);
        }
      } catch (err) {
        console.error('Failed to fetch limit data:', err);
      } finally {
        setLoadingLimit(false);
      }
    };
    fetchLimitData();
  }, []);

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate before submission
    if (!isFormValid) {
      if (isAtLimit) {
        setError('You have reached your competitor limit. Please remove existing competitors or upgrade your plan.');
      } else if (!isNameValid) {
        setError('Please enter a valid competitor name (at least 2 characters).');
      } else if (!isUrlValid) {
        setError('Please enter a website address (e.g., competitor.com).');
      }
      return;
    }

    setLoading(true);
    setError('');

    // Normalize URL - add https:// if missing
    let normalizedUrl = formData.url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    try {
      const res = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          url: normalizedUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create competitor');
      }

      router.push('/dashboard/competitors');
    } catch (err) {
      console.error('Failed to create competitor:', err);
      setError(err instanceof Error ? err.message : 'Failed to create competitor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              MarketPulse
            </Link>

            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 pb-20 md:pb-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Add New Competitor</h1>
          <p className="text-gray-600 mb-8">
            Enter details about the competitor you want to monitor
          </p>

          {/* Limit Warning */}
          {!loadingLimit && isAtLimit && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-amber-800 font-medium">
                    You&apos;ve reached your competitor limit ({currentCount}/{competitorLimit})
                  </p>
                  <p className="text-amber-700 text-sm mt-1">
                    Remove existing competitors or upgrade your plan to add more.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard/competitors')}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
                    >
                      Manage Competitors
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard/subscription')}
                      className="px-4 py-2 border border-amber-600 text-amber-700 rounded-lg hover:bg-amber-100 text-sm font-medium"
                    >
                      Upgrade Plan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-white border border-gray-200 rounded-lg p-8"
          >
            {/* Competitor Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Competitor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Acme Coffee Shop"
                aria-invalid={formData.name.length > 0 && !isNameValid}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  formData.name.length > 0 && !isNameValid
                    ? 'border-red-300'
                    : 'border-gray-300'
                }`}
              />
              <p className={`text-xs mt-1 ${formData.name.length > 0 && !isNameValid ? 'text-red-600' : 'text-gray-600'}`}>
                {formData.name.length > 0 && !isNameValid
                  ? 'Name must be at least 2 characters'
                  : 'Give your competitor a recognizable name'}
              </p>
            </div>

            {/* Website URL */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Website URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://competitor.com or competitor.com"
                aria-invalid={formData.url.length > 0 && !isUrlValid}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  formData.url.length > 0 && !isUrlValid
                    ? 'border-red-300'
                    : 'border-gray-300'
                }`}
              />
              <p className={`text-xs mt-1 ${formData.url.length > 0 && !isUrlValid ? 'text-red-600' : 'text-gray-600'}`}>
                {formData.url.length > 0 && !isUrlValid
                  ? 'Enter a website address (e.g., competitor.com)'
                  : 'We\'ll monitor this URL for pricing and content changes'}
              </p>
            </div>

            {/* Crawl Frequency */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Check Frequency
              </label>
              <select
                value={formData.crawlFrequencyMinutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    crawlFrequencyMinutes: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value={360}>Every 6 hours</option>
                <option value={720}>Every 12 hours (recommended)</option>
                <option value={1440}>Every 24 hours</option>
                <option value={2880}>Every 48 hours</option>
              </select>
              <p className="text-xs text-gray-600 mt-1">
                How often we&apos;ll check the website for changes
              </p>
            </div>

            {/* Active Status Toggle */}
            <div className="mb-8">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 font-medium">
                  Start monitoring immediately
                </span>
              </label>
              <p className="text-xs text-gray-600 mt-1 ml-6">
                You can pause monitoring anytime from the competitors list
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !isFormValid || loadingLimit}
                className={`flex-1 px-4 py-3 rounded-lg transition-colors font-medium ${
                  loading || !isFormValid || loadingLimit
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading ? 'Adding...' : isAtLimit ? 'Limit Reached' : 'Add Competitor'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
