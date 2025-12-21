import { Component, afterNextRender, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { AsyncPipe, DOCUMENT } from '@angular/common';
import { injectContent, MarkdownComponent } from '@analogjs/content';
import { RouteMeta } from '@analogjs/router';
import PostAttributes from 'src/app/core/models/post-attributes';
import { OgpService } from '../../core/services/ogp.service';

// Redirect to home while blog is disabled
export const routeMeta: RouteMeta = {
  canActivate: [
    () => {
      const router = inject(Router);
      return router.createUrlTree(['/']);
    },
  ],
};

@Component({
  selector: 'app-blog-post',
  imports: [RouterLink, MarkdownComponent, AsyncPipe],
  templateUrl: './[slug].page.html',
  styleUrl: './[slug].page.css',
})
export default class BlogPostPage {
  private readonly document = inject(DOCUMENT);
  private readonly ogpService = inject(OgpService);

  readonly post$ = injectContent<PostAttributes>({
    param: 'slug',
    subdirectory: 'blog',
  });

  private readonly post = toSignal(this.post$);

  constructor() {
    // Set OGP metadata when post data is available
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
      }
    });

    afterNextRender(() => {
      // Wait for markdown content to render
      setTimeout(() => this.enhanceCodeBlocks(), 100);
    });
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
      copyBtn.addEventListener('click', () => this.handleCopy(pre, copyBtn));

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
