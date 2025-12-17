import {
  Injectable,
  signal,
  computed,
  effect,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // User's theme preference
  private readonly _theme = signal<Theme>(this.getInitialTheme());

  // Resolved theme based on preference and system setting
  private readonly _systemPrefersDark = signal(this.getSystemPreference());

  readonly theme = this._theme.asReadonly();

  readonly resolvedTheme = computed(() => {
    const theme = this._theme();
    if (theme === 'system') {
      return this._systemPrefersDark() ? 'dark' : 'light';
    }
    return theme;
  });

  readonly isDark = computed(() => this.resolvedTheme() === 'dark');

  constructor() {
    if (this.isBrowser) {
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        this._systemPrefersDark.set(e.matches);
      });

      // Apply theme to DOM when it changes
      effect(() => {
        this.applyTheme(this.resolvedTheme());
      });
    }
  }

  setTheme(theme: Theme): void {
    this._theme.set(theme);
    if (this.isBrowser) {
      localStorage.setItem('theme', theme);
    }
  }

  toggleTheme(): void {
    const current = this.resolvedTheme();
    this.setTheme(current === 'dark' ? 'light' : 'dark');
  }

  private getInitialTheme(): Theme {
    if (!this.isBrowser) {
      return 'dark';
    }

    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored;
    }
    return 'dark';
  }

  private getSystemPreference(): boolean {
    if (!this.isBrowser) {
      return false;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    if (!this.isBrowser) return;

    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }
}
