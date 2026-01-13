'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

export default function NewSupportTicketPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'technical',
  });
  const [touched, setTouched] = useState({
    subject: false,
    description: false,
  });

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  // Validation constants
  const SUBJECT_MIN_LENGTH = 5;
  const SUBJECT_MAX_LENGTH = 200;
  const DESCRIPTION_MIN_LENGTH = 20;
  const DESCRIPTION_MAX_LENGTH = 5000;

  // Validation functions
  const validateSubject = () => {
    const trimmed = formData.subject.trim();
    if (!trimmed) return 'Subject is required';
    if (trimmed.length < SUBJECT_MIN_LENGTH) {
      return `Subject must be at least ${SUBJECT_MIN_LENGTH} characters`;
    }
    if (trimmed.length > SUBJECT_MAX_LENGTH) {
      return `Subject must be less than ${SUBJECT_MAX_LENGTH} characters`;
    }
    return '';
  };

  const validateDescription = () => {
    const trimmed = formData.description.trim();
    if (!trimmed) return 'Description is required';
    if (trimmed.length < DESCRIPTION_MIN_LENGTH) {
      return `Description must be at least ${DESCRIPTION_MIN_LENGTH} characters`;
    }
    if (trimmed.length > DESCRIPTION_MAX_LENGTH) {
      return `Description must be less than ${DESCRIPTION_MAX_LENGTH} characters`;
    }
    return '';
  };

  const subjectError = validateSubject();
  const descriptionError = validateDescription();
  const isFormValid = !subjectError && !descriptionError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({ subject: true, description: true });

    // Validate before submitting
    if (!isFormValid) {
      setError('Please fix the validation errors before submitting');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create ticket');
      }

      const data = await res.json();
      router.push(`/dashboard/support/${data.ticket.id}`);
    } catch (err: any) {
      console.error('Failed to create ticket:', err);
      setError(err.message || 'Failed to create support ticket');
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 sm:px-6 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/support"
            className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
          >
            ← Back to Support
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Create Support Ticket
          </h1>
          <p className="text-gray-600 mt-2">
            Describe your issue and we&apos;ll get back to you as soon as possible
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-8">
          <div className="space-y-6">
            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                required
              >
                <option value="technical">Technical Issue</option>
                <option value="billing">Billing Question</option>
                <option value="feature_request">Feature Request</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                  Subject <span className="text-red-500">*</span>
                </label>
                <span className={`text-xs ${
                  formData.subject.length > SUBJECT_MAX_LENGTH
                    ? 'text-red-600 font-semibold'
                    : 'text-gray-500'
                }`}>
                  {formData.subject.length}/{SUBJECT_MAX_LENGTH}
                </span>
              </div>
              <input
                type="text"
                id="subject"
                value={formData.subject}
                onChange={(e) => {
                  setFormData({ ...formData, subject: e.target.value });
                }}
                onBlur={() => setTouched({ ...touched, subject: true })}
                placeholder="Brief description of your issue"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
                  touched.subject && subjectError
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300'
                }`}
                maxLength={SUBJECT_MAX_LENGTH}
              />
              {touched.subject && subjectError && (
                <p className="mt-1 text-sm text-red-600">{subjectError}</p>
              )}
              {!subjectError && formData.subject.trim().length > 0 && (
                <p className="mt-1 text-sm text-green-600">✓ Subject looks good</p>
              )}
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <span className={`text-xs ${
                  formData.description.length > DESCRIPTION_MAX_LENGTH
                    ? 'text-red-600 font-semibold'
                    : 'text-gray-500'
                }`}>
                  {formData.description.length}/{DESCRIPTION_MAX_LENGTH}
                </span>
              </div>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                }}
                onBlur={() => setTouched({ ...touched, description: true })}
                placeholder="Please provide as much detail as possible about your issue..."
                rows={8}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
                  touched.description && descriptionError
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300'
                }`}
                maxLength={DESCRIPTION_MAX_LENGTH}
              />
              {touched.description && descriptionError && (
                <p className="mt-1 text-sm text-red-600">{descriptionError}</p>
              )}
              {!descriptionError && formData.description.trim().length > 0 && (
                <p className="mt-1 text-sm text-green-600">✓ Description looks good</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              {/* Validation Summary */}
              {(touched.subject || touched.description) && !isFormValid && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 font-medium">
                    Please complete all required fields:
                  </p>
                  <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
                    {touched.subject && subjectError && <li>{subjectError}</li>}
                    {touched.description && descriptionError && <li>{descriptionError}</li>}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-end gap-4">
                <Link
                  href="/dashboard/support"
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading || !isFormValid}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title={!isFormValid ? 'Please fix validation errors before submitting' : 'Create support ticket'}
                >
                  {loading ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
