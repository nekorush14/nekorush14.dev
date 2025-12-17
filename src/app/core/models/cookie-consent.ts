/**
 * Cookie consent preferences stored in localStorage.
 */
export interface CookieConsent {
  /** Essential cookies - always enabled for site functionality */
  essential: boolean;
  /** Analytics cookies - Google Analytics tracking */
  analytics: boolean;
  /** Whether the user has given explicit consent */
  consentGiven: boolean;
  /** Timestamp when consent was given (for expiration tracking) */
  timestamp: number;
}

/**
 * Default consent state before user interaction.
 */
export const DEFAULT_COOKIE_CONSENT: CookieConsent = {
  essential: true,
  analytics: false,
  consentGiven: false,
  timestamp: 0,
};

/**
 * Cookie consent storage key for localStorage.
 */
export const COOKIE_CONSENT_STORAGE_KEY = 'cookie-consent';

/**
 * Consent expiration period in milliseconds (12 months).
 * GDPR recommends re-obtaining consent periodically.
 */
export const CONSENT_EXPIRATION_MS = 365 * 24 * 60 * 60 * 1000;
