import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  effect,
  ElementRef,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-cookie-settings-modal',
  templateUrl: './cookie-settings-modal.component.html',
  styleUrl: './cookie-settings-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscapeKey()',
  },
})
export class CookieSettingsModalComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly elementRef = inject(ElementRef);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /** Whether the modal is open */
  readonly isOpen = input.required<boolean>();

  /** Current analytics preference */
  readonly analyticsEnabled = input<boolean>(false);

  /** Emitted when modal is closed */
  readonly closed = output<void>();

  /** Emitted when preferences are saved */
  readonly saved = output<boolean>();

  /** Local state for analytics toggle */
  protected readonly localAnalytics = signal(false);

  private previousActiveElement: HTMLElement | null = null;

  constructor() {
    // Sync local state with input when modal opens
    effect(() => {
      if (this.isOpen()) {
        this.localAnalytics.set(this.analyticsEnabled());
        this.trapFocus();
      } else {
        this.restoreFocus();
      }
    });
  }

  protected toggleAnalytics(): void {
    this.localAnalytics.update((v) => !v);
  }

  protected onSave(): void {
    this.saved.emit(this.localAnalytics());
  }

  protected onClose(): void {
    this.closed.emit();
  }

  protected onOverlayClick(event: MouseEvent): void {
    // Only close if clicking directly on overlay
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  protected onEscapeKey(): void {
    if (this.isOpen()) {
      this.onClose();
    }
  }

  private trapFocus(): void {
    if (!this.isBrowser) return;

    // Store current focus
    this.previousActiveElement = this.document.activeElement as HTMLElement;

    // Focus the modal after it renders
    setTimeout(() => {
      const modal = this.elementRef.nativeElement.querySelector('.cookie-modal');
      if (modal) {
        const firstFocusable = modal.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        firstFocusable?.focus();
      }
    }, 0);
  }

  private restoreFocus(): void {
    if (!this.isBrowser) return;

    if (this.previousActiveElement) {
      this.previousActiveElement.focus();
      this.previousActiveElement = null;
    }
  }
}
