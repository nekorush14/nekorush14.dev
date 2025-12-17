import {
  Injectable,
  signal,
  computed,
  effect,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  CookieConsent,
  DEFAULT_COOKIE_CONSENT,
  COOKIE_CONSENT_STORAGE_KEY,
  CONSENT_EXPIRATION_MS,
} from '../models/cookie-consent';

// Declare gtag for TypeScript
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

@Injectable({
  providedIn: 'root',
})
export class CookieConsentService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // Internal consent state
  private readonly _consent = signal<CookieConsent>(this.loadConsent());

  // Signal to trigger settings modal from anywhere
  private readonly _showSettings = signal(false);

  // Public read-only signals
  readonly consent = this._consent.asReadonly();
  readonly showSettings = this._showSettings.asReadonly();

  readonly hasConsent = computed(() => {
    const consent = this._consent();
    if (!consent.consentGiven) return false;

    // Check if consent has expired
    const now = Date.now();
    if (now - consent.timestamp > CONSENT_EXPIRATION_MS) {
      return false;
    }
    return true;
  });

  readonly analyticsEnabled = computed(() => {
    const consent = this._consent();
    return consent.consentGiven && consent.analytics;
  });

  constructor() {
    if (this.isBrowser) {
      // Initialize Google Analytics based on consent
      effect(() => {
        this.updateGoogleAnalytics();
      });
    }
  }

  /**
   * Accept all cookies (essential + analytics).
   */
  acceptAll(): void {
    this.saveConsent({
      essential: true,
      analytics: true,
      consentGiven: true,
      timestamp: Date.now(),
    });
  }

  /**
   * Reject optional cookies (only essential enabled).
   */
  rejectAll(): void {
    this.saveConsent({
      essential: true,
      analytics: false,
      consentGiven: true,
      timestamp: Date.now(),
    });
  }

  /**
   * Save custom preferences.
   */
  savePreferences(analytics: boolean): void {
    this.saveConsent({
      essential: true,
      analytics,
      consentGiven: true,
      timestamp: Date.now(),
    });
  }

  /**
   * Open the settings modal.
   */
  openSettings(): void {
    this._showSettings.set(true);
  }

  /**
   * Close the settings modal.
   */
  closeSettings(): void {
    this._showSettings.set(false);
  }

  /**
   * Reset consent (for testing or user request).
   */
  resetConsent(): void {
    if (this.isBrowser) {
      localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
    }
    this._consent.set(DEFAULT_COOKIE_CONSENT);
  }

  private saveConsent(consent: CookieConsent): void {
    this._consent.set(consent);
    if (this.isBrowser) {
      localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(consent));
    }
  }

  private loadConsent(): CookieConsent {
    if (!this.isBrowser) {
      return DEFAULT_COOKIE_CONSENT;
    }

    try {
      const stored = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CookieConsent;
        // Validate the stored data has required fields
        if (
          typeof parsed.essential === 'boolean' &&
          typeof parsed.analytics === 'boolean' &&
          typeof parsed.consentGiven === 'boolean' &&
          typeof parsed.timestamp === 'number'
        ) {
          return parsed;
        }
      }
    } catch {
      // Invalid JSON, use default
    }

    return DEFAULT_COOKIE_CONSENT;
  }

  private updateGoogleAnalytics(): void {
    if (!this.isBrowser) return;

    const analyticsEnabled = this.analyticsEnabled();

    // Initialize dataLayer if not exists
    window.dataLayer = window.dataLayer || [];

    // Define gtag function if not exists
    if (typeof window.gtag !== 'function') {
      window.gtag = function (...args: unknown[]) {
        window.dataLayer.push(args);
      };
    }

    if (analyticsEnabled) {
      // Grant analytics consent
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
      });

      // Load GA script if not already loaded
      this.loadGAScript();
    } else {
      // Deny analytics consent
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
      });
    }
  }

  private loadGAScript(): void {
    if (!this.isBrowser) return;

    // Check if script already exists
    if (document.getElementById('ga-script')) return;

    // GA Measurement ID from environment variable
    const measurementId = import.meta.env['VITE_GA_MEASUREMENT_ID'];

    // Skip if measurement ID is not configured or is placeholder
    if (!measurementId || measurementId === 'G-XXXXXXXXXX') {
      console.warn(
        'Google Analytics: VITE_GA_MEASUREMENT_ID is not configured. Skipping GA initialization.'
      );
      return;
    }

    const script = document.createElement('script');
    script.id = 'ga-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      anonymize_ip: true,
    });
  }
}
