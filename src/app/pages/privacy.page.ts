import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouteMeta } from '@analogjs/router';
import { CookieConsentService } from '../core/services/cookie-consent.service';

export const routeMeta: RouteMeta = {
  title: 'プライバシーポリシー | nekorush14.dev',
};

@Component({
  selector: 'app-privacy-page',
  templateUrl: './privacy.page.html',
  styles: `
    :host {
      display: block;
    }

    .privacy-page {
      padding: 3rem 1rem;
    }

    @media (min-width: 768px) {
      .privacy-page {
        padding: 4rem 2rem;
      }
    }

    .privacy-container {
      max-width: 48rem;
      margin: 0 auto;
    }

    .page-title {
      margin: 0 0 0.5rem;
      font-family: var(--font-display);
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-on-surface);
      animation: var(--animate-slide-up);
    }

    @media (min-width: 768px) {
      .page-title {
        font-size: 2.5rem;
      }
    }

    .last-updated {
      margin: 0 0 2rem;
      font-size: 0.875rem;
      color: var(--color-on-surface-variant);
      animation: var(--animate-slide-up);
      animation-delay: 50ms;
      animation-fill-mode: both;
    }

    .privacy-content {
      animation: var(--animate-slide-up);
      animation-delay: 100ms;
      animation-fill-mode: both;
    }

    .cookie-settings-section {
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid var(--color-outline-variant);
      animation: var(--animate-slide-up);
      animation-delay: 150ms;
      animation-fill-mode: both;
    }

    .cookie-settings-section h2 {
      margin: 0 0 1rem;
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-on-surface);
    }

    .cookie-settings-section p {
      margin: 0 0 1rem;
      font-size: 0.875rem;
      line-height: 1.6;
      color: var(--color-on-surface-variant);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PrivacyPage {
  private readonly consentService = inject(CookieConsentService);

  protected readonly currentYear = new Date().getFullYear();

  protected openCookieSettings(): void {
    this.consentService.openSettings();
  }
}
