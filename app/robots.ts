import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/account/', '/checkout/', '/cart/', '/api/'],
    },
    sitemap: 'https://luxehome.com/sitemap.xml',
  };
}
