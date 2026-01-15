'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ContactPage() {
  const fieldLimits = {
    name: { min: 2, max: 100 },
    email: { max: 254 },
    subject: { min: 3, max: 200 },
    message: { min: 10, max: 2000 },
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    subject: false,
    message: false,
  });

  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Validation functions
  const validateName = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return 'Name is required';
    if (trimmed.length < fieldLimits.name.min) return `Name must be at least ${fieldLimits.name.min} characters`;
    if (trimmed.length > fieldLimits.name.max) return `Name must be less than ${fieldLimits.name.max} characters`;
    if (!/^[a-zA-Z\s\-'.]+$/.test(trimmed)) return 'Name can only contain letters, spaces, hyphens, and apostrophes';
    return null;
  };

  const validateEmail = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return 'Email is required';
    if (trimmed.length > fieldLimits.email.max) return `Email must be less than ${fieldLimits.email.max} characters`;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) return 'Please enter a valid email address';
    return null;
  };

  const validateSubject = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return 'Subject is required';
    if (trimmed.length < fieldLimits.subject.min) return `Subject must be at least ${fieldLimits.subject.min} characters`;
    if (trimmed.length > fieldLimits.subject.max) return `Subject must be less than ${fieldLimits.subject.max} characters`;
    return null;
  };

  const validateMessage = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return 'Message is required';
    if (trimmed.length < fieldLimits.message.min) return `Message must be at least ${fieldLimits.message.min} characters`;
    if (trimmed.length > fieldLimits.message.max) return `Message must be less than ${fieldLimits.message.max} characters`;
    return null;
  };

  // Compute field errors
  const fieldErrors = {
    name: validateName(formData.name),
    email: validateEmail(formData.email),
    subject: validateSubject(formData.subject),
    message: validateMessage(formData.message),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched on submit attempt
    setTouched({ name: true, email: true, subject: true, message: true });

    if (!isFormValid) {
      return;
    }
    setStatus('sending');
    setErrorMessage('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trimmedFormData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
      }

      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTouched({ name: false, email: false, subject: false, message: false });
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Failed to send message. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  };

  const trimmedFormData = {
    name: formData.name.trim(),
    email: formData.email.trim(),
    subject: formData.subject.trim(),
    message: formData.message.trim(),
  };

  const isFormValid = !fieldErrors.name && !fieldErrors.email && !fieldErrors.subject && !fieldErrors.message;

  // Helper to determine if error should be shown
  const showError = (field: keyof typeof touched) => touched[field] && fieldErrors[field];

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 py-2 md:py-3 lg:py-4">
          <Link href="/">
            <Image
              src="/logo_transparent.png"
              alt="MarketPulse"
              width={500}
              height={125}
              className="h-16 md:h-16 lg:h-20 xl:h-24 w-auto"
              priority
            />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Contact Us
            </h1>
            <p className="text-base md:text-lg text-gray-600">
              Have a question or need help? We&apos;re here to assist you.
            </p>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8">
            {status === 'success' ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✉️</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Message Sent!
                </h2>
                <p className="text-gray-600 mb-6">
                  Thank you for contacting us. We&apos;ll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                    Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={fieldLimits.name.max}
                    aria-invalid={showError('name') ? 'true' : 'false'}
                    aria-describedby={showError('name') ? 'name-error' : undefined}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none text-base transition-colors ${
                      showError('name')
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="Your name"
                  />
                  {showError('name') && (
                    <p id="name-error" className="mt-1.5 text-sm text-red-600" role="alert">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                    Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={fieldLimits.email.max}
                    aria-invalid={showError('email') ? 'true' : 'false'}
                    aria-describedby={showError('email') ? 'email-error' : undefined}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none text-base transition-colors ${
                      showError('email')
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="your@email.com"
                  />
                  {showError('email') && (
                    <p id="email-error" className="mt-1.5 text-sm text-red-600" role="alert">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* Subject Field */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-900 mb-2">
                    Subject <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={fieldLimits.subject.max}
                    aria-invalid={showError('subject') ? 'true' : 'false'}
                    aria-describedby={showError('subject') ? 'subject-error' : undefined}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none text-base transition-colors ${
                      showError('subject')
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="How can we help?"
                  />
                  {showError('subject') && (
                    <p id="subject-error" className="mt-1.5 text-sm text-red-600" role="alert">
                      {fieldErrors.subject}
                    </p>
                  )}
                </div>

                {/* Message Field */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="message" className="block text-sm font-medium text-gray-900">
                      Message <span className="text-red-600">*</span>
                    </label>
                    <span className={`text-xs ${
                      formData.message.length > fieldLimits.message.max
                        ? 'text-red-600'
                        : formData.message.length > fieldLimits.message.max * 0.9
                          ? 'text-amber-600'
                          : 'text-gray-500'
                    }`}>
                      {formData.message.length}/{fieldLimits.message.max}
                    </span>
                  </div>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={fieldLimits.message.max}
                    rows={6}
                    aria-invalid={showError('message') ? 'true' : 'false'}
                    aria-describedby={showError('message') ? 'message-error' : undefined}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none text-base resize-none transition-colors ${
                      showError('message')
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="Tell us more about your inquiry..."
                  />
                  {showError('message') && (
                    <p id="message-error" className="mt-1.5 text-sm text-red-600" role="alert">
                      {fieldErrors.message}
                    </p>
                  )}
                </div>

                {/* Error Message */}
                {status === 'error' && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {errorMessage}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={status === 'sending' || !isFormValid}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'sending' ? 'Sending...' : 'Send Message'}
                </button>

                <p className="text-xs text-gray-600 text-center">
                  You can also email us directly at{' '}
                  <a
                    href="mailto:contact@getmarketpulse.com"
                    className="text-blue-600 hover:underline"
                  >
                    contact@getmarketpulse.com
                  </a>
                </p>
              </form>
            )}
          </div>

          {/* Additional Contact Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Need immediate help?{' '}
              <Link href="/help" className="text-blue-600 hover:underline">
                Visit our Help Center
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
