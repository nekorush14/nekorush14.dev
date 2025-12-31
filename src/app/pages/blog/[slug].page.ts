import { Component, DestroyRef, effect, inject, PLATFORM_ID } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AsyncPipe, DatePipe, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { injectContent, MarkdownComponent } from '@analogjs/content';
import PostAttributes from 'src/app/core/models/post-attributes';
import { OgpService } from '../../core/services/ogp.service';

@Component({
  selector: 'app-blog-post',
  imports: [RouterLink, MarkdownComponent, AsyncPipe, DatePipe],
  templateUrl: './[slug].page.html',
  styleUrl: './[slug].page.css',
})
export default class BlogPostPage {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ogpService = inject(OgpService);
  private readonly destroyRef = inject(DestroyRef);

  // Track cleanup functions for event listeners
  private readonly cleanupFns: (() => void)[] = [];

  readonly post$ = injectContent<PostAttributes>({
    param: 'slug',
    subdirectory: 'blog',
  });

  private readonly post = toSignal(this.post$);

  constructor() {
    // Register cleanup on component destroy
    this.destroyRef.onDestroy(() => {
      this.cleanupFns.forEach((fn) => fn());
      this.cleanupFns.length = 0;
    });

    // Set OGP metadata and enhance content when post data changes
    effect(() => {
      const post = this.post();
      if (post?.attributes) {
        const attrs = post.attributes;
        this.ogpService.updateMetadata({
          title: `${attrs.title} | nekorush14.dev`,
          description: attrs.description,
          url: `https://nekorush14.dev/blog/${attrs.slug}`,
          image: attrs.coverImage,
          type: 'article',
        });

        // Enhance content after DOM updates (works for both initial load and SPA navigation)
        if (isPlatformBrowser(this.platformId)) {
          // Use requestAnimationFrame to wait for DOM to update
          requestAnimationFrame(() => {
            this.waitForMarkdownContent();
          });
        }
      }
    });
  }

  private waitForMarkdownContent(): void {
    // Only run in browser environment
    if (!isPlatformBrowser(this.platformId)) return;

    const prose = this.document.querySelector('.prose');
    if (!prose) return;

    // Check if content is already rendered
    const checkAndEnhance = () => {
      const hasContent = prose.querySelector('p, h1, h2, h3, pre');
      if (hasContent) {
        this.generateTableOfContents();
        this.enhanceCodeBlocks();
        return true;
      }
      return false;
    };

    // Try immediately first
    if (checkAndEnhance()) return;

    // Otherwise, observe for changes
    const observer = new MutationObserver(() => {
      if (checkAndEnhance()) {
        observer.disconnect();
      }
    });

    observer.observe(prose, {
      childList: true,
      subtree: true,
    });

    // Fallback timeout to prevent infinite observation
    const timeoutId = setTimeout(() => {
      observer.disconnect();
      checkAndEnhance();
    }, 3000);

    // Register cleanup for observer and timeout
    this.cleanupFns.push(() => {
      clearTimeout(timeoutId);
      observer.disconnect();
    });
  }

  private generateTableOfContents(): void {
    const prose = this.document.querySelector('.prose');
    if (!prose) return;

    // Find [[toc]] placeholder in text nodes
    let tocPlaceholder: Element | null = null;
    const paragraphs = Array.from(prose.querySelectorAll('p'));
    for (const p of paragraphs) {
      if (p.textContent?.trim() === '[[toc]]') {
        tocPlaceholder = p;
        break;
      }
    }

    if (!tocPlaceholder) return;

    // Extract h2 and h3 headings
    const headings = prose.querySelectorAll('h2, h3');
    if (headings.length === 0) return;

    interface TocItem {
      id: string;
      text: string;
      level: number;
    }

    const tocItems: TocItem[] = [];

    headings.forEach((heading, index) => {
      const text = heading.textContent?.trim() || '';
      // Generate id from text (slug format)
      const id = heading.id || this.generateSlug(text, index);
      heading.id = id;

      tocItems.push({
        id,
        text,
        level: heading.tagName === 'H2' ? 2 : 3,
      });
    });

    // Build TOC HTML
    const tocNav = this.document.createElement('nav');
    tocNav.className = 'toc';
    tocNav.setAttribute('aria-label', 'Table of contents');

    const tocTitle = this.document.createElement('p');
    tocTitle.className = 'toc-title';
    tocTitle.textContent = '目次';
    tocNav.appendChild(tocTitle);

    const tocList = this.document.createElement('ul');
    tocList.className = 'toc-list';

    tocItems.forEach((item) => {
      const li = this.document.createElement('li');
      li.className = item.level === 3 ? 'toc-item toc-item-nested' : 'toc-item';

      const link = this.document.createElement('button');
      link.type = 'button';
      link.className = 'toc-link';
      link.textContent = item.text;
      link.setAttribute('data-target', item.id);

      const clickHandler = () => {
        const target = this.document.getElementById(item.id);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      };
      link.addEventListener('click', clickHandler);

      // Register cleanup for event listener
      this.cleanupFns.push(() => {
        link.removeEventListener('click', clickHandler);
      });

      li.appendChild(link);
      tocList.appendChild(li);
    });

    tocNav.appendChild(tocList);

    // Replace placeholder with TOC
    tocPlaceholder.parentNode?.replaceChild(tocNav, tocPlaceholder);
  }

  private generateSlug(text: string, index: number): string {
    // Convert text to URL-friendly slug
    const slug = text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u30fc-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return slug || `heading-${index}`;
  }

  private enhanceCodeBlocks(): void {
    const preElements = this.document.querySelectorAll('.prose pre');

    preElements.forEach((pre) => {
      // Skip if already enhanced
      if (pre.classList.contains('enhanced')) return;
      pre.classList.add('enhanced');

      // Get language from pre class or code class
      const lang = this.detectLanguage(pre);

      // Create wrapper for better structure
      const wrapper = this.document.createElement('div');
      wrapper.className = 'code-block';

      // Create header
      const header = this.document.createElement('div');
      header.className = 'code-block-header';

      // Language label (convert to Title Case)
      const langLabel = this.document.createElement('span');
      langLabel.className = 'code-block-lang';
      langLabel.textContent = this.toTitleCase(lang || 'code');

      // Copy button
      const copyBtn = this.document.createElement('button');
      copyBtn.className = 'code-copy-btn';
      copyBtn.setAttribute('aria-label', 'Copy code');
      copyBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
        </svg>
        <span>Copy</span>
      `;
      const copyHandler = () => this.handleCopy(pre, copyBtn);
      copyBtn.addEventListener('click', copyHandler);

      // Register cleanup for event listener
      this.cleanupFns.push(() => {
        copyBtn.removeEventListener('click', copyHandler);
      });

      header.appendChild(langLabel);
      header.appendChild(copyBtn);

      // Wrap pre element
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(header);
      wrapper.appendChild(pre);
    });
  }

  private detectLanguage(pre: Element): string | null {
    // Priority 1: Check data-language attribute (added by Shiki transformer)
    const dataLang = pre.getAttribute('data-language');
    if (dataLang && dataLang !== 'code') return dataLang;

    // Priority 2: Check pre element classes (e.g., "shiki language-typescript")
    const preClasses = Array.from(pre.classList);
    for (const cls of preClasses) {
      if (cls.startsWith('language-')) {
        return cls.replace('language-', '');
      }
    }

    // Priority 3: Check code element classes
    const code = pre.querySelector('code');
    if (code) {
      const codeClasses = Array.from(code.classList);
      for (const cls of codeClasses) {
        if (cls.startsWith('language-')) {
          return cls.replace('language-', '');
        }
      }
    }

    return null;
  }

  private toTitleCase(str: string): string {
    // Convert to title case (first letter uppercase, rest lowercase)
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  private async handleCopy(pre: Element, button: HTMLButtonElement): Promise<void> {
    const code = pre.querySelector('code');
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code.textContent || '');

      // Show success state
      button.classList.add('copied');
      button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
        <span>Copied!</span>
      `;

      // Reset after 2 seconds
      setTimeout(() => {
        button.classList.remove('copied');
        button.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
          </svg>
          <span>Copy</span>
        `;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
}
