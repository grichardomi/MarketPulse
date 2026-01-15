'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { helpArticles } from '@/lib/content/help-content';
import { publicPages } from '@/lib/content/public-pages';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const matchingPages = useMemo(() => {
    if (!normalizedQuery) return [];
    return publicPages.filter((page) => {
      return (
        page.title.toLowerCase().includes(normalizedQuery) ||
        page.description.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [normalizedQuery]);

  const matchingHelpArticles = useMemo(() => {
    if (!normalizedQuery) return [];
    return helpArticles.filter((article) => {
      return (
        article.title.toLowerCase().includes(normalizedQuery) ||
        article.description.toLowerCase().includes(normalizedQuery) ||
        article.content.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [normalizedQuery]);

  const hasResults = matchingPages.length > 0 || matchingHelpArticles.length > 0;

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

      {/* Search Hero */}
      <div className="bg-blue-600 text-white py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Search MarketPulse
            </h1>
            <p className="text-base md:text-lg mb-6 text-blue-100">
              Find pages, help articles, and answers in one place
            </p>

            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Search pages and help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 text-base"
              />
              <svg
                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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

      {/* Results */}
      <main className="container mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          {!normalizedQuery ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Popular resources
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {helpArticles.slice(0, 4).map((article) => (
                  <Link
                    key={article.id}
                    href={`/help/${article.id}`}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      {article.title}
                    </p>
                    <p className="text-sm text-gray-600">{article.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          ) : !hasResults ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">No results found</div>
              <p className="text-gray-600">
                Try another keyword or browse the Help Center.
              </p>
              <Link
                href="/help"
                className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Visit Help Center
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {matchingPages.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Pages
                  </h2>
                  <div className="space-y-3">
                    {matchingPages.map((page) => (
                      <Link
                        key={page.path}
                        href={page.path}
                        className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                      >
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          {page.title}
                        </p>
                        <p className="text-sm text-gray-600">{page.description}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {matchingHelpArticles.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Help Articles
                  </h2>
                  <div className="space-y-3">
                    {matchingHelpArticles.map((article) => (
                      <Link
                        key={article.id}
                        href={`/help/${article.id}`}
                        className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                      >
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          {article.title}
                        </p>
                        <p className="text-sm text-gray-600">{article.description}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
