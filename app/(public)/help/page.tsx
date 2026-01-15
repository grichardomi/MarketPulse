'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { helpArticles } from '@/lib/content/help-content';

const categories = Array.from(new Set(helpArticles.map((a) => a.category)));

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredArticles = helpArticles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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

      {/* Hero Section */}
      <div className="bg-blue-600 text-white py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              How can we help you?
            </h1>
            <p className="text-base md:text-lg mb-6 text-blue-100">
              Search our help center or browse articles below
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 text-base"
              />
              <svg
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          {/* Category Filter */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === 'All'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Help Articles Grid */}
          {filteredArticles.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No articles found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search or browse all categories
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/help/${article.id}`}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{article.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {article.title}
                        </h3>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium whitespace-nowrap ml-2">
                          {article.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{article.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Contact Section */}
          <div className="mt-12 bg-white border border-gray-200 rounded-lg p-6 md:p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Still need help?
            </h2>
            <p className="text-gray-600 mb-6">
              Can&apos;t find what you&apos;re looking for? Our support team is here to help.
            </p>
            <Link
              href="/contact"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
