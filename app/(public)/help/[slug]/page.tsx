'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { getHelpArticleById } from '@/lib/content/help-content';

export default function HelpArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  const article = getHelpArticleById(slug);

  if (!article) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-6xl mb-4">❓</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Article Not Found</h1>
          <p className="text-gray-600 mb-6">
            The help article you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/help"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Help Center
          </Link>
        </div>
      </div>
    );
  }

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

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/help" className="text-blue-600 hover:underline">
              Help Center
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900">{article.title}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Article Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-5xl">{article.icon}</span>
              <div>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium mb-2">
                  {article.category}
                </span>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  {article.title}
                </h1>
              </div>
            </div>
          </div>

          {/* Article Content */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 mb-8">
            <div
              className="prose prose-blue max-w-none"
              style={{
                whiteSpace: 'pre-wrap',
                lineHeight: '1.8',
              }}
            >
              {article.content}
            </div>
          </div>

          {/* Related Articles */}
          {article.relatedArticles.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Related Articles
              </h2>
              <div className="space-y-2">
                {article.relatedArticles.map((related) => (
                  <Link
                    key={related.id}
                    href={`/help/${related.id}`}
                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors text-blue-600 hover:underline"
                  >
                    {related.title} →
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Contact Support */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">Was this article helpful?</p>
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
