'use client';

import { useState } from 'react';
import Link from 'next/link';
import { INDUSTRY_METADATA, type Industry } from '@/lib/config/industries';

// Constants defined outside component - single source of truth
const COMMON_INDUSTRIES = [
  'Restaurant / Food Service',
  'Coffee Shop / Cafe',
  'Pizza Restaurant',
  'Fast Food',
  'Bar / Pub',
  'Bakery',
  'Hair Salon / Barber',
  'Nail Salon',
  'Spa / Wellness',
  'Gym / Fitness Center',
  'Yoga Studio',
  'Retail Store',
  'Clothing Boutique',
  'Bookstore',
  'Pet Store',
  'Hardware Store',
  'Auto Repair',
  'Car Wash',
  'Dental Office',
  'Medical Clinic',
  'Veterinary Clinic',
  'Real Estate Agency',
  'Law Firm',
  'Accounting Services',
  'Marketing Agency',
  'Consulting',
  'Other',
] as const;

// Helper to get industry label from enum value
function getIndustryLabel(industryValue: string): string | null {
  const metadata = INDUSTRY_METADATA[industryValue as Industry];
  return metadata?.label || null;
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
] as const;

interface Competitor {
  name: string;
  website: string;
  relevanceScore: number;
  matchReason: string;
}

interface CompetitorDiscoveryProps {
  onComplete: (selectedCompetitors: Competitor[]) => void;
  onSkip: () => void;
  onManageCompetitors?: () => void;
  initialIndustry?: string;
  initialCity?: string;
  initialState?: string;
  initialZipcode?: string;
  maxSelectable?: number;
  userCity?: string;
  userState?: string;
  existingUrls?: string[];
}

export default function CompetitorDiscovery({
  onComplete,
  onSkip,
  onManageCompetitors,
  initialIndustry = '',
  initialCity = '',
  initialState = '',
  initialZipcode = '',
  maxSelectable = 999,
  userCity = '',
  userState = '',
  existingUrls = [],
}: CompetitorDiscoveryProps) {
  // Check if industry was passed from previous screen (as an Industry enum value)
  const prefilledIndustryLabel = initialIndustry ? getIndustryLabel(initialIndustry) : null;
  const hasPrefilledIndustry = !!prefilledIndustryLabel;

  // Check if location was passed from previous screen
  const hasPrefilledLocation = !!(initialCity && initialState && initialState.length === 2);

  // Form state - use the label if we have a prefilled industry, otherwise empty for manual selection
  const [industry, setIndustry] = useState(
    hasPrefilledIndustry ? prefilledIndustryLabel : (initialIndustry || '')
  );
  const [customIndustry, setCustomIndustry] = useState('');
  const [city, setCity] = useState(initialCity);
  const [state, setState] = useState(initialState);
  const [zipcode, setZipcode] = useState(initialZipcode);

  // Validation helpers - industry is valid if prefilled OR if a valid selection from the list
  const isIndustrySelected = hasPrefilledIndustry || (industry !== '' && (COMMON_INDUSTRIES as readonly string[]).includes(industry));
  const isCustomIndustryValid = industry === 'Other' && customIndustry.trim().length > 0;
  const isIndustryValid = hasPrefilledIndustry || (isIndustrySelected && (industry !== 'Other' || isCustomIndustryValid));
  const isCityValid = city.trim().length > 0;
  const isStateValid = state.length === 2;
  const isFormValid = isIndustryValid && isCityValid && isStateValid;

  // Check if location differs from user profile
  const locationMismatch =
    (userCity && userState) &&
    (city.trim().toLowerCase() !== userCity.toLowerCase() || state !== userState);

  // Discovery state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showResults, setShowResults] = useState(false);

  const handleDiscover = async () => {
    // Double-check validation before proceeding
    if (!isFormValid) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    // Use custom industry if "Other" is selected
    const finalIndustry = industry === 'Other' ? customIndustry.trim() : industry;

    if (!finalIndustry) {
      setError('Please specify your industry');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/competitors/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: finalIndustry,
          city,
          state,
          zipcode: zipcode || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to discover competitors');
      }

      if (data.count === 0) {
        setError(data.message || 'No competitors found. Try adjusting your search.');
        setCompetitors([]);
        setShowResults(false);
      } else {
        if (data.trackingError) {
          setError(data.trackingError);
        }

        // Filter out competitors user already has
        const newCompetitors = data.competitors.filter((comp: Competitor) => {
          const compUrl = comp.website?.toLowerCase().replace(/\/$/, '');
          return !existingUrls.some(url => {
            const existingUrl = url.replace(/\/$/, '');
            return compUrl === existingUrl || compUrl?.includes(existingUrl) || existingUrl.includes(compUrl || '');
          });
        });

        if (newCompetitors.length === 0) {
          setError('All discovered competitors are already in your profile.');
          setCompetitors([]);
          setShowResults(false);
        } else {
          const filteredCount = data.competitors.length - newCompetitors.length;
          if (filteredCount > 0) {
            setError(`${filteredCount} competitor(s) already in your profile were filtered out.`);
          }
          setCompetitors(newCompetitors);
          setShowResults(true);

          // Auto-select top competitors (up to 3, but respecting maxSelectable)
          const autoSelect = new Set<number>();
          const autoSelectCount = Math.min(3, newCompetitors.length, maxSelectable);
          for (let i = 0; i < autoSelectCount; i++) {
            autoSelect.add(i);
          }
          setSelected(autoSelect);
        }
      }
    } catch (err: any) {
      console.error('Discovery error:', err);
      setError(err.message || 'Failed to discover competitors');
      setCompetitors([]);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (index: number) => {
    const newSelected = new Set(selected);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      // Check if we've reached the max
      if (newSelected.size >= maxSelectable) {
        setError(`You can only select up to ${maxSelectable} competitor${maxSelectable !== 1 ? 's' : ''}`);
        return;
      }
      newSelected.add(index);
      setError(''); // Clear error if successful
    }
    setSelected(newSelected);
  };

  const handleSelectAll = () => {
    if (selected.size === Math.min(competitors.length, maxSelectable)) {
      setSelected(new Set());
    } else {
      // Select up to maxSelectable
      const toSelect = competitors.slice(0, maxSelectable).map((_, i) => i);
      setSelected(new Set(toSelect));
      if (competitors.length > maxSelectable) {
        setError(`Limited to ${maxSelectable} competitor${maxSelectable !== 1 ? 's' : ''} based on your plan`);
      }
    }
  };

  const handleContinue = () => {
    const selectedCompetitors = Array.from(selected).map((i) => competitors[i]);
    onComplete(selectedCompetitors);
  };

  const handleBack = () => {
    setShowResults(false);
    setCompetitors([]);
    setSelected(new Set());
    setError('');
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Find Your Competitors
        </h2>
        <p className="text-gray-600">
          We&apos;ll help you discover competitors in your area using AI
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Input Form */}
      {!showResults && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 mb-6">
          <div className="space-y-6">
            {/* At Limit Warning - show when user can't add more competitors */}
            {maxSelectable === 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="font-medium text-amber-800">
                  You&apos;ve reached your competitor limit
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  To add new competitors, remove existing ones or upgrade your plan.
                </p>
              </div>
            )}

            {/* Industry - show as read-only if prefilled from previous screen */}
            {hasPrefilledIndustry ? (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Industry / Business Type
                </label>
                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-base text-gray-700">
                  {industry}
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-900 mb-2">
                  Industry / Business Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  required
                  aria-required="true"
                  aria-invalid={!isIndustryValid}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-base ${
                    !isIndustryValid ? 'border-gray-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select your industry</option>
                  {COMMON_INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
                {industry === 'Other' && (
                  <input
                    type="text"
                    value={customIndustry}
                    onChange={(e) => setCustomIndustry(e.target.value)}
                    placeholder="Enter your specific industry"
                    required
                    aria-required="true"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-base mt-3"
                  />
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Select the category that best matches your business
                </p>
              </div>
            )}

            {/* Location - show as read-only if prefilled from previous screen */}
            {hasPrefilledLocation ? (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Location
                </label>
                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-base text-gray-700">
                  {city}, {state}{zipcode ? ` ${zipcode}` : ''}
                </div>
              </div>
            ) : (
              <>
                {/* Location Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-900 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Austin"
                      required
                      aria-required="true"
                      aria-invalid={!isCityValid}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-base"
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-900 mb-2">
                      State <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      required
                      aria-required="true"
                      aria-invalid={!isStateValid}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-base"
                    >
                      <option value="">Select State</option>
                      {US_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Zipcode (Optional) */}
                <div>
                  <label htmlFor="zipcode" className="block text-sm font-medium text-gray-900 mb-2">
                    Zipcode (optional)
                  </label>
                  <input
                    id="zipcode"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={zipcode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setZipcode(value);
                    }}
                    placeholder="78701"
                    maxLength={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-base"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    For more precise results in your specific area
                  </p>
                </div>
              </>
            )}

            {/* Location Mismatch Warning - only show when location is editable */}
            {!hasPrefilledLocation && locationMismatch && city && state && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Location differs from your profile
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      Your profile shows <strong>{userCity}, {userState}</strong>.
                      You&apos;re searching in <strong>{city}, {state}</strong>.
                    </p>
                    <p className="text-xs text-amber-600 mt-2">
                      This is fine if you want to monitor competitors in a different area.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Validation Summary - only show when there are incomplete fields */}
            {!isFormValid && !loading && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Required fields:</p>
                <ul className="text-sm space-y-1">
                  {/* Only show industry validation if not prefilled */}
                  {!hasPrefilledIndustry && (
                    <li className={`flex items-center gap-2 ${isIndustryValid ? 'text-green-600' : 'text-gray-500'}`}>
                      {isIndustryValid ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="3" /></svg>
                      )}
                      Industry / Business Type
                    </li>
                  )}
                  {/* Only show location validation if not prefilled */}
                  {!hasPrefilledLocation && (
                    <>
                      <li className={`flex items-center gap-2 ${isCityValid ? 'text-green-600' : 'text-gray-500'}`}>
                        {isCityValid ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="3" /></svg>
                        )}
                        City
                      </li>
                      <li className={`flex items-center gap-2 ${isStateValid ? 'text-green-600' : 'text-gray-500'}`}>
                        {isStateValid ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="3" /></svg>
                        )}
                        State
                      </li>
                    </>
                  )}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              {maxSelectable > 0 && (
                <button
                  type="button"
                  onClick={handleDiscover}
                  disabled={loading || !isFormValid}
                  aria-disabled={loading || !isFormValid}
                  className={`w-full py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2 ${
                    loading || !isFormValid
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Discovering...</span>
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      <span>Find Competitors</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={maxSelectable > 0 ? onSkip : onManageCompetitors}
                className={`w-full px-6 py-3 border rounded-lg font-medium transition-colors ${
                  maxSelectable > 0
                    ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    : 'border-amber-300 text-amber-700 hover:bg-amber-50'
                }`}
              >
                {maxSelectable > 0 ? 'Skip - Add Manually' : 'Manage Existing Competitors'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {showResults && competitors.length > 0 && (
        <div className="space-y-6">
          {/* At Limit Warning */}
          {maxSelectable === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-800 font-medium">
                You&apos;ve reached your competitor limit
              </p>
              <p className="text-amber-700 text-sm mt-1">
                Remove existing competitors or upgrade your plan to add these.
              </p>
            </div>
          )}

          {/* Results Header */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  We found {competitors.length} competitors
                </p>
                <p className="text-sm text-gray-600">
                  {maxSelectable > 0
                    ? `Select up to ${maxSelectable} to monitor`
                    : 'View potential competitors in your area'}
                </p>
              </div>
              {maxSelectable > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {selected.size === Math.min(competitors.length, maxSelectable) ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>
          </div>

          {/* Competitor Cards */}
          <div className="space-y-3">
            {competitors.map((comp, index) => (
              <div
                key={index}
                onClick={() => maxSelectable > 0 && handleToggleSelect(index)}
                className={`bg-white border rounded-lg p-4 md:p-5 transition-all ${
                  maxSelectable === 0
                    ? 'border-gray-200 opacity-75'
                    : selected.has(index)
                    ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200 cursor-pointer'
                    : 'border-gray-200 hover:bg-gray-50 cursor-pointer'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox - hidden when at limit */}
                  {maxSelectable > 0 && (
                    <input
                      type="checkbox"
                      checked={selected.has(index)}
                      onChange={() => {}}
                      className="w-5 h-5 mt-1 text-blue-600 rounded focus:ring-blue-500"
                    />
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {comp.name}
                      </h3>
                      <span className="flex-shrink-0 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        {comp.relevanceScore}% match
                      </span>
                    </div>

                    <Link
                      href={comp.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm text-blue-600 hover:underline mb-2 inline-block"
                    >
                      {comp.website}
                    </Link>

                    <p className="text-sm text-gray-600 mt-2">
                      {comp.matchReason}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Manual Add Option */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Don&apos;t see a competitor you want to monitor?
            </p>
            <button
              onClick={onSkip}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add Competitor Manually
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleBack}
              className="sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              ← Back
            </button>

            {maxSelectable > 0 ? (
              <button
                onClick={handleContinue}
                disabled={selected.size === 0}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                Continue with {selected.size} competitor{selected.size !== 1 ? 's' : ''} →
              </button>
            ) : (
              <button
                onClick={onManageCompetitors || onSkip}
                className="flex-1 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium transition-colors"
              >
                Manage Existing Competitors →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
