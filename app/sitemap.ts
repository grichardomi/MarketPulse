import { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/seo/metadata';
import { helpArticles } from '@/lib/content/help-content';
import { publicPages } from '@/lib/content/public-pages';

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date();

  const routes = publicPages.map((page) => ({
    url: `${siteConfig.url}${page.path}`,
    lastModified: currentDate,
    changeFrequency: page.changeFrequency ?? 'weekly',
    priority: page.priority ?? 0.8,
  }));

  const helpArticleRoutes = helpArticles.map((article) => ({
    url: `${siteConfig.url}/help/${article.id}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...routes, ...helpArticleRoutes];
}
