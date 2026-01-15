import { generateMetadata as generateSeoMetadata } from '@/lib/seo/metadata';
import { helpArticleById } from '@/lib/content/help-content';

export function generateMetadata({ params }: { params: { slug: string } }) {
  const article = helpArticleById[params.slug];

  if (!article) {
    return generateSeoMetadata({
      title: 'Help Article Not Found',
      description: 'The requested help article could not be found.',
      path: `/help/${params.slug}`,
      noIndex: true,
    });
  }

  return generateSeoMetadata({
    title: article.title,
    description: article.description,
    path: `/help/${params.slug}`,
  });
}
