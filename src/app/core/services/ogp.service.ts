import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

/**
 * Metadata structure for Open Graph Protocol
 */
export interface OgpMetadata {
  title: string;
  description: string;
  url: string;
  image?: string;
  type?: 'website' | 'article';
  siteName?: string;
}

// Allowed URL protocols for security
const ALLOWED_PROTOCOLS = ['https:', 'http:'];
// Allowed domains for OGP resources (site's own domain)
const ALLOWED_DOMAINS = ['nekorush14.dev'];

/**
 * Sanitize text content to prevent XSS attacks.
 * Escapes HTML special characters in meta tag content.
 */
function sanitizeText(input: string | undefined): string | undefined {
  if (!input) return input;

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Validate and sanitize URL to prevent XSS and SSRF attacks.
 * Only allows HTTPS/HTTP URLs from allowed domains.
 */
function sanitizeUrl(input: string | undefined): string | undefined {
  if (!input) return input;

  try {
    const url = new URL(input);

    // Only allow HTTP(S) protocols
    if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
      console.warn(`OgpService: Blocked URL with disallowed protocol: ${url.protocol}`);
      return undefined;
    }

    // Only allow URLs from allowed domains for security
    if (!ALLOWED_DOMAINS.some((domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`))) {
      console.warn(`OgpService: Blocked URL from disallowed domain: ${url.hostname}`);
      return undefined;
    }

    // Return sanitized URL string
    return url.href;
  } catch {
    console.warn(`OgpService: Invalid URL provided: ${input}`);
    return undefined;
  }
}

/**
 * Service for managing Open Graph Protocol meta tags.
 * Handles both OGP and Twitter Card meta tags for social media sharing.
 */
@Injectable({
  providedIn: 'root',
})
export class OgpService {
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);

  private readonly defaults: Required<Omit<OgpMetadata, 'title' | 'description' | 'url'>> = {
    siteName: 'nekorush14.dev',
    type: 'website',
    image: 'https://nekorush14.dev/meta/og-image.png',
  };

  /**
   * Updates all OGP and Twitter Card meta tags.
   * All inputs are sanitized to prevent XSS attacks.
   */
  updateMetadata(metadata: Partial<OgpMetadata>): void {
    const data = { ...this.defaults, ...metadata };

    // Sanitize text content
    const safeTitle = sanitizeText(data.title);
    const safeDescription = sanitizeText(data.description);
    const safeSiteName = sanitizeText(data.siteName);

    // Sanitize URLs
    const safeUrl = sanitizeUrl(data.url);
    const safeImage = sanitizeUrl(data.image);

    if (safeTitle) {
      this.title.setTitle(safeTitle);
    }

    // Open Graph meta tags
    this.setMetaTag('og:title', safeTitle);
    this.setMetaTag('og:description', safeDescription);
    this.setMetaTag('og:url', safeUrl);
    this.setMetaTag('og:image', safeImage);
    this.setMetaTag('og:type', data.type);
    this.setMetaTag('og:site_name', safeSiteName);

    // Twitter Card meta tags (use 'name' attribute instead of 'property')
    this.setMetaTag('twitter:card', 'summary_large_image', 'name');
    this.setMetaTag('twitter:title', safeTitle, 'name');
    this.setMetaTag('twitter:description', safeDescription, 'name');
    this.setMetaTag('twitter:image', safeImage, 'name');

    // Standard meta description
    this.setMetaTag('description', safeDescription, 'name');
  }

  private setMetaTag(
    name: string,
    content: string | undefined,
    attribute: 'property' | 'name' = 'property'
  ): void {
    if (!content) return;

    const selector = attribute === 'property' ? `property='${name}'` : `name='${name}'`;
    const existingTag = this.meta.getTag(selector);

    if (existingTag) {
      this.meta.updateTag({ [attribute]: name, content });
    } else {
      this.meta.addTag({ [attribute]: name, content });
    }
  }
}
