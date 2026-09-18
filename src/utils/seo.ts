import { MetaTagConfig } from '../types';

/**
 * Resolves the canonical URL based on the configuration rules and browser window
 */
export function resolveCanonicalUrl(config: MetaTagConfig, currentPath = typeof window !== 'undefined' ? window.location.pathname : '/', currentSearch = typeof window !== 'undefined' ? window.location.search : ''): string {
  let base = config.canonicalBaseUrl.trim();
  if (base.endsWith('/')) {
    base = base.slice(0, -1);
  }

  switch (config.canonicalPathRule) {
    case 'root':
      return `${base}/`;
    case 'preserve_query': {
      const cleanPath = currentPath.startsWith('/') ? currentPath : `/${currentPath}`;
      return `${base}${cleanPath}${currentSearch}`;
    }
    case 'preserve_path':
    default: {
      const cleanPath = currentPath.startsWith('/') ? currentPath : `/${currentPath}`;
      return `${base}${cleanPath === '/' ? '/' : cleanPath}`;
    }
  }
}

/**
 * Helper to set or update a meta tag in document.head
 */
function setMetaTag(attrName: 'name' | 'property', attrValue: string, content: string) {
  if (typeof document === 'undefined') return;
  let element = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

/**
 * Helper to set or update a link tag in document.head
 */
function setLinkTag(rel: string, href: string) {
  if (typeof document === 'undefined') return;
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

/**
 * Dynamically applies MetaTagConfig to the DOM head
 */
export function applyMetaTagsToDocument(config: MetaTagConfig) {
  if (typeof document === 'undefined') return;

  // 1. Title
  if (config.title) {
    document.title = config.title;
  }

  // 2. Canonical URL
  const canonicalUrl = resolveCanonicalUrl(config);
  setLinkTag('canonical', canonicalUrl);

  // 3. Meta Description & Robots & Keywords
  setMetaTag('name', 'description', config.description);
  if (config.robots) setMetaTag('name', 'robots', config.robots);
  if (config.keywords) setMetaTag('name', 'keywords', config.keywords);
  if (config.themeColor) setMetaTag('name', 'theme-color', config.themeColor);

  // 4. OpenGraph Tags
  setMetaTag('property', 'og:title', config.ogTitle || config.title);
  setMetaTag('property', 'og:description', config.ogDescription || config.description);
  setMetaTag('property', 'og:url', canonicalUrl);
  setMetaTag('property', 'og:type', config.ogType || 'website');
  setMetaTag('property', 'og:site_name', config.siteName || 'TO KNOW NOTHING');
  setMetaTag('property', 'og:locale', config.locale || 'en_GB');

  if (config.ogImage) {
    setMetaTag('property', 'og:image', config.ogImage);
    setMetaTag('property', 'og:image:secure_url', config.ogImage);
    if (config.ogImageAlt) {
      setMetaTag('property', 'og:image:alt', config.ogImageAlt);
    }
  }

  // 5. Twitter / X Cards
  setMetaTag('name', 'twitter:card', config.twitterCard || 'summary_large_image');
  setMetaTag('name', 'twitter:title', config.ogTitle || config.title);
  setMetaTag('name', 'twitter:description', config.ogDescription || config.description);
  if (config.ogImage) {
    setMetaTag('name', 'twitter:image', config.ogImage);
    if (config.ogImageAlt) {
      setMetaTag('name', 'twitter:image:alt', config.ogImageAlt);
    }
  }
  if (config.twitterSite) setMetaTag('name', 'twitter:site', config.twitterSite);
  if (config.twitterCreator) setMetaTag('name', 'twitter:creator', config.twitterCreator);

  // 6. Schema.org JSON-LD Structured Data
  let ldJsonScript = document.querySelector('script[data-seo-jsonld="true"]') as HTMLScriptElement | null;
  if (config.enableStructuredData) {
    if (!ldJsonScript) {
      ldJsonScript = document.createElement('script');
      ldJsonScript.setAttribute('type', 'application/ld+json');
      ldJsonScript.setAttribute('data-seo-jsonld', 'true');
      document.head.appendChild(ldJsonScript);
    }

    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${config.canonicalBaseUrl}/#organization`,
          name: config.siteName || 'TO KNOW NOTHING APPAREL LTD',
          url: config.canonicalBaseUrl,
          logo: config.ogImage,
          description: config.description,
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Studio 4B, Redchurch Street, Shoreditch',
            addressLocality: 'London',
            postalCode: 'E2 7DD',
            addressCountry: 'GB',
          },
        },
        {
          '@type': 'WebSite',
          '@id': `${config.canonicalBaseUrl}/#website`,
          url: config.canonicalBaseUrl,
          name: config.siteName,
          description: config.description,
          publisher: {
            '@id': `${config.canonicalBaseUrl}/#organization`,
          },
        },
      ],
    };

    ldJsonScript.textContent = JSON.stringify(structuredData, null, 2);
  } else if (ldJsonScript) {
    ldJsonScript.remove();
  }
}

/**
 * Generate formatted HTML string for admin preview/export
 */
export function generateHeadHtmlSnippet(config: MetaTagConfig): string {
  const canonicalUrl = resolveCanonicalUrl(config);
  return `<!-- Primary Meta Tags -->
<title>${config.title}</title>
<meta name="title" content="${config.title}" />
<meta name="description" content="${config.description}" />
<link rel="canonical" href="${canonicalUrl}" />
<meta name="robots" content="${config.robots}" />
<meta name="theme-color" content="${config.themeColor}" />

<!-- Open Graph / Facebook / Discord -->
<meta property="og:type" content="${config.ogType}" />
<meta property="og:url" content="${canonicalUrl}" />
<meta property="og:site_name" content="${config.siteName}" />
<meta property="og:locale" content="${config.locale}" />
<meta property="og:title" content="${config.ogTitle || config.title}" />
<meta property="og:description" content="${config.ogDescription || config.description}" />
<meta property="og:image" content="${config.ogImage}" />
<meta property="og:image:alt" content="${config.ogImageAlt}" />

<!-- Twitter / X -->
<meta name="twitter:card" content="${config.twitterCard}" />
<meta name="twitter:url" content="${canonicalUrl}" />
<meta name="twitter:title" content="${config.ogTitle || config.title}" />
<meta name="twitter:description" content="${config.ogDescription || config.description}" />
<meta name="twitter:image" content="${config.ogImage}" />
<meta name="twitter:site" content="${config.twitterSite}" />
<meta name="twitter:creator" content="${config.twitterCreator}" />`;
}
