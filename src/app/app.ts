import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationRailComponent } from './core/components/navigation-rail/navigation-rail.component';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavigationRailComponent],
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
        <p>&copy; {{ currentYear }} nekorush14. All rights reserved.</p>
      </footer>
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
      flex-shrink: 0;
      padding: 2rem 1rem;
      text-align: center;
      color: var(--color-on-surface-variant);
      font-size: 0.875rem;
      /* Mobile: above bottom navigation */
      margin-bottom: 80px;
    }

    .site-footer p {
      margin: 0;
    }

    @media (min-width: 768px) {
      .site-footer {
        margin-left: 80px;
        margin-bottom: 0;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly themeService = inject(ThemeService);
  protected readonly currentYear = 2025;

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}

