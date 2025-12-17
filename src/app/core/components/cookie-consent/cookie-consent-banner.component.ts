import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CookieConsentService } from '../../services/cookie-consent.service';
import { CookieSettingsModalComponent } from './cookie-settings-modal.component';

@Component({
  selector: 'app-cookie-consent-banner',
  imports: [RouterLink, CookieSettingsModalComponent],
  templateUrl: './cookie-consent-banner.component.html',
  styleUrl: './cookie-consent-banner.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CookieConsentBannerComponent {
  protected readonly consentService = inject(CookieConsentService);

  /** Show banner when consent has not been given */
  protected readonly showBanner = computed(() => !this.consentService.hasConsent());

  /** Current analytics preference for modal */
  protected readonly currentAnalytics = computed(
    () => this.consentService.consent().analytics
  );

  protected acceptAll(): void {
    this.consentService.acceptAll();
  }

  protected rejectAll(): void {
    this.consentService.rejectAll();
  }

  protected openSettings(): void {
    this.consentService.openSettings();
  }

  protected closeSettings(): void {
    this.consentService.closeSettings();
  }

  protected saveSettings(analytics: boolean): void {
    this.consentService.savePreferences(analytics);
    this.consentService.closeSettings();
  }
}
