'use client';

import { useRouter } from 'next/navigation';
import CompetitorDiscovery from '@/components/onboarding/CompetitorDiscovery';
import { useState, useEffect } from 'react';

export default function DiscoverCompetitorsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addedCompetitors, setAddedCompetitors] = useState<any[]>([]);
  const [businessData, setBusinessData] = useState<any>(null);
  const [userData, setUserData] = useState<{ city?: string; state?: string } | null>(null);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [competitorLimit, setCompetitorLimit] = useState<number>(3);
  const [currentCount, setCurrentCount] = useState<number>(0);
  const [existingUrls, setExistingUrls] = useState<string[]>([]);

  useEffect(() => {
    loadBusinessData();
  }, []);

  const loadBusinessData = async () => {
    try {
      const [businessRes, limitRes, userRes, competitorsRes] = await Promise.all([
        fetch('/api/business', { cache: 'no-store' }),
        fetch('/api/subscription/limit', { cache: 'no-store' }),
        fetch('/api/user/profile', { cache: 'no-store' }),
        fetch('/api/competitors', { cache: 'no-store' }),
      ]);

      if (businessRes.ok) {
        const businessData = await businessRes.json();
        setBusinessData(businessData.business);
      }

      if (limitRes.ok) {
        const limitData = await limitRes.json();
        setCompetitorLimit(limitData.competitorLimit ?? 3);
        setCurrentCount(limitData.currentCount ?? 0);
      }

      if (userRes.ok) {
        const userProfile = await userRes.json();
        setUserData({
          city: userProfile.city || undefined,
          state: userProfile.state || undefined,
        });
      }

      if (competitorsRes.ok) {
        const competitorsData = await competitorsRes.json();
        const urls = (competitorsData.competitors || []).map((c: any) => c.url?.toLowerCase());
        setExistingUrls(urls.filter(Boolean));
      }
    } catch (err) {
      console.error('Failed to load business data:', err);
    } finally {
      setLoadingBusiness(false);
    }
  };

  const parseLocation = (location: string): { city: string; state: string; zipcode: string } => {
    if (!location) return { city: '', state: '', zipcode: '' };

    const parts = location.split(',').map(p => p.trim());
    let city = '';
    let state = '';
    let zipcode = '';

    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1];
      const secondLastPart = parts[parts.length - 2];

      // Try to extract zipcode from last part (e.g., "TX 78701")
      const zipcodeMatch = lastPart.match(/\b(\d{5})\b/);
      if (zipcodeMatch) {
        zipcode = zipcodeMatch[1];
      }

      // Extract state (2-letter code)
      const stateMatch = lastPart.match(/\b([A-Z]{2})\b/);
      if (stateMatch) {
        state = stateMatch[1];
        city = secondLastPart;
      } else {
        state = lastPart.substring(0, 2).toUpperCase();
        city = secondLastPart;
      }
    }

    return { city, state, zipcode };
  };

  const handleDiscoveryComplete = async (competitors: any[]) => {
    setLoading(true);
    setError('');
    const added: any[] = [];
    const failed: any[] = [];

    for (const comp of competitors) {
      try {
        const res = await fetch('/api/competitors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: comp.name,
            url: comp.website,
          }),
        });

        if (res.ok) {
          added.push(comp);
        } else {
          const errData = await res.json();

          // Handle specific error cases
          if (res.status === 403) {
            // Limit reached or industry validation failed - stop processing
            setError(errData.error || 'Unable to add competitor');
            setLoading(false);
            if (added.length > 0) {
              setAddedCompetitors(added);
            }
            return;
          }

          if (res.status === 409) {
            // Duplicate competitor - continue with others
            failed.push({ ...comp, error: errData.error || 'Already monitoring this competitor' });
          } else {
            // Other errors (400, 404, 500)
            failed.push({ ...comp, error: errData.error || 'Failed to add competitor' });
          }
        }
      } catch (err) {
        failed.push({ ...comp, error: 'Network error - please try again' });
      }
    }

    setLoading(false);
    setAddedCompetitors(added);

    // Show error if some competitors failed but not all
    if (failed.length > 0 && added.length > 0) {
      setError(`Added ${added.length} competitor(s). ${failed.length} failed: ${failed.map(f => f.name).join(', ')}`);
    } else if (failed.length > 0 && added.length === 0) {
      setError(`Failed to add competitors: ${failed.map(f => `${f.name} (${f.error})`).join(', ')}`);
    }

    if (added.length > 0) {
      // Show success and redirect after 2 seconds
      setTimeout(() => {
        router.push('/dashboard/competitors');
        router.refresh();
      }, 2000);
    }
  };

  const handleSkip = () => {
    router.push('/dashboard/competitors/new');
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Discover Competitors
          </h1>
          <p className="text-gray-600">
            Use AI to automatically find and add competitors in your area
          </p>
        </div>

        {/* Limit Warning Banner */}
        {!loadingBusiness && currentCount >= competitorLimit && (
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
                  To add new competitors, you&apos;ll need to remove existing ones or upgrade your plan.
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    onClick={() => router.push('/dashboard/competitors')}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
                  >
                    Manage Competitors
                  </button>
                  <button
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
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">{error}</p>
            {addedCompetitors.length > 0 && !error.includes('Added') && (
              <p className="text-red-600 text-sm mt-2">
                Successfully added {addedCompetitors.length} competitor(s) before the error occurred.
              </p>
            )}
          </div>
        )}

        {addedCompetitors.length > 0 && !error && (
          <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-green-800">
                  Successfully added {addedCompetitors.length} competitor(s)!
                </h3>
                <ul className="mt-2 text-sm text-green-700">
                  {addedCompetitors.map((comp, idx) => (
                    <li key={idx}>✓ {comp.name}</li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-green-600">
                  Redirecting to competitors page...
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {loadingBusiness ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your business info...</p>
            </div>
          ) : (
            <CompetitorDiscovery
              onComplete={handleDiscoveryComplete}
              onSkip={handleSkip}
              onManageCompetitors={() => router.push('/dashboard/competitors')}
              initialIndustry={businessData?.industry || ''}
              initialCity={businessData?.city || (businessData?.location ? parseLocation(businessData.location).city : '')}
              initialState={businessData?.state || (businessData?.location ? parseLocation(businessData.location).state : '')}
              initialZipcode={businessData?.zipcode || (businessData?.location ? parseLocation(businessData.location).zipcode : '')}
              maxSelectable={Math.max(0, competitorLimit - currentCount)}
              userCity={userData?.city}
              userState={userData?.state}
              existingUrls={existingUrls}
            />
          )}
        </div>

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-700">Adding competitors...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
