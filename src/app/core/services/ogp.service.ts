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
   * Updates all OGP and Twitter Card meta tags
   */
  updateMetadata(metadata: Partial<OgpMetadata>): void {
    const data = { ...this.defaults, ...metadata };

    if (data.title) {
      this.title.setTitle(data.title);
    }

    // Open Graph meta tags
    this.setMetaTag('og:title', data.title);
    this.setMetaTag('og:description', data.description);
    this.setMetaTag('og:url', data.url);
    this.setMetaTag('og:image', data.image);
    this.setMetaTag('og:type', data.type);
    this.setMetaTag('og:site_name', data.siteName);

    // Twitter Card meta tags
    this.setMetaTag('twitter:card', 'summary_large_image');
    this.setMetaTag('twitter:title', data.title);
    this.setMetaTag('twitter:description', data.description);
    this.setMetaTag('twitter:image', data.image);

    // Standard meta description
    this.setMetaTag('description', data.description, 'name');
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
