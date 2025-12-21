import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NavigationRailComponent } from './core/components/navigation-rail/navigation-rail.component';
import { CookieConsentBannerComponent } from './core/components/cookie-consent/cookie-consent-banner.component';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet, NavigationRailComponent, CookieConsentBannerComponent],
  template: `
    <div class="app-layout">
      <!-- Mobile Theme Toggle -->
      <button
        type="button"
        class="mobile-theme-toggle"
        (click)="toggleTheme()"
        [attr.aria-label]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
      >
        <span class="material-symbols-outlined" aria-hidden="true">
          {{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}
        </span>
      </button>

      <!-- Navigation Rail (Desktop: left side, Mobile: bottom) -->
      <app-navigation-rail />

      <!-- Main Content -->
      <main class="main-content">
        <router-outlet />
      </main>

      <!-- Footer -->
      <footer class="site-footer">
        <a routerLink="/privacy" class="footer-link">Privacy Policy</a>
        <span class="footer-separator" aria-hidden="true">|</span>
        <p class="footer-copyright">&copy; 2025 nekorush14</p>
        <span class="footer-separator" aria-hidden="true">|</span>
        <a
          href="https://github.com/nekorush14/nekorush14.dev"
          target="_blank"
          rel="noopener noreferrer"
          class="footer-link"
        >GitHub Repository</a>
        <span class="footer-separator" aria-hidden="true">|</span>
        <a
          rel="license"
          href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
          target="_blank"
          class="license-link"
          aria-label="Content is licensed under CC BY-NC-SA 4.0"
        >
          <img
            alt="CC BY-NC-SA 4.0"
            src="https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png"
            width="88"
            height="31"
          />
        </a>
      </footer>

      <!-- Cookie Consent Banner -->
      <app-cookie-consent-banner />
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }

    .app-layout {
      position: relative;
      display: flex;
      flex-direction: column;
      min-height: 100%;
      background-color: var(--color-surface);
      color: var(--color-on-surface);
    }

    .main-content {
      flex: 1 0 auto;
    }

    /* Desktop: shift content to make room for rail */
    @media (min-width: 768px) {
      .main-content {
        margin-left: 80px;
      }
    }

    /* Mobile Theme Toggle - flat icon button */
    .mobile-theme-toggle {
      position: absolute;
      top: 1rem;
      right: 1rem;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      padding: 0;
      border: none;
      border-radius: var(--radius-full);
      background-color: transparent;
      color: var(--color-on-surface-variant);
      cursor: pointer;
      transition: all var(--duration-normal) var(--ease-spring);
    }

    .mobile-theme-toggle:hover {
      background-color: var(--color-surface-container-high);
      color: var(--color-on-surface);
    }

    .mobile-theme-toggle:active {
      transform: scale(0.95);
    }

    .mobile-theme-toggle:focus-visible {
      outline: none;
      box-shadow:
        0 0 0 2px var(--color-surface),
        0 0 0 4px var(--color-primary);
    }

    .mobile-theme-toggle .material-symbols-outlined {
      font-size: 24px;
    }

    /* Hide on desktop (desktop uses nav-rail theme toggle) */
    @media (min-width: 768px) {
      .mobile-theme-toggle {
        display: none;
      }
    }

    /* Footer */
    .site-footer {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      flex-shrink: 0;
      padding: 2rem 1rem;
      color: var(--color-on-surface-variant);
      font-size: 0.875rem;
      /* Mobile: above bottom navigation */
      margin-bottom: 80px;
    }

    .footer-link {
      color: var(--color-on-surface-variant);
      text-decoration: none;
      transition: color var(--duration-fast) var(--ease-standard);
    }

    .footer-link:hover {
      color: var(--color-primary);
    }

    .footer-link:focus-visible {
      outline: none;
      box-shadow:
        0 0 0 2px var(--color-surface),
        0 0 0 4px var(--color-primary);
      border-radius: var(--radius-sm);
    }

    .footer-separator {
      display: none;
      color: var(--color-outline-variant);
    }

    .footer-copyright {
      margin: 0;
      text-align: center;
    }

    .license-link {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      line-height: 0;
      transition: opacity var(--duration-fast) var(--ease-standard);
    }

    .license-link:hover {
      opacity: 0.8;
    }

    .license-link:focus-visible {
      outline: none;
      box-shadow:
        0 0 0 2px var(--color-surface),
        0 0 0 4px var(--color-primary);
      border-radius: var(--radius-sm);
    }

    @media (min-width: 768px) {
      .site-footer {
        flex-direction: row;
        flex-wrap: wrap;
        margin-left: 80px;
        margin-bottom: 0;
      }

      .footer-separator {
        display: inline;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly themeService = inject(ThemeService);

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}

