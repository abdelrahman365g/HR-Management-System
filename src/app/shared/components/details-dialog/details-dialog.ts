import { Component, ElementRef, computed, effect, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { DetailDisplay, DetailTone } from '../../../core/interfaces/details-dialog.interface';
import { buildDetailsView } from '../../utils/detail-format.util';
import { DetailsDialogService } from '../../../core/services/details-dialog.service';

const SIZE_CLASS = { md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' } as const;

// Full class names so Tailwind can see them.
const TONE_CLASS: Record<DetailTone, string> = {
  neutral: 'bg-sunken text-muted',
  success: 'bg-success-soft text-success-ink',
  warning: 'bg-warning-soft text-warning-ink',
  danger: 'bg-danger-soft text-danger-ink',
  info: 'bg-secondary-soft text-secondary-ink',
};

// Host component: place <app-details-dialog /> ONCE in app.html, next to the
// confirm dialog. Everything shown comes from DetailsDialogService.
@Component({
  selector: 'app-details-dialog',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './details-dialog.html',
})
export class DetailsDialog {
  private readonly service = inject(DetailsDialogService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  readonly view = computed(() => {
    const config = this.service.config();
    return config ? buildDetailsView(config, document.documentElement.lang || 'en') : null;
  });
  readonly sizeClass = computed(() => SIZE_CLASS[this.view()?.size ?? 'lg']);

  constructor() {
    // Native <dialog>: showModal() gives the focus trap, Esc handling and the inert page behind it.
    effect(() => {
      const dialog = this.dialogRef()?.nativeElement;
      if (!dialog) return;

      if (this.service.config()) {
        if (!dialog.open) dialog.showModal();
        // The content renders in the same change-detection pass, so focus after it.
        queueMicrotask(() => dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus());
      } else if (dialog.open) {
        dialog.close();
      }
    });
  }

  close(): void {
    this.service.close();
  }

  // Esc (and dialog.close()) fire the native "close" event.
  onNativeClose(): void {
    this.service.close();
  }

  // Clicks on the dark backdrop land on the <dialog> element itself.
  onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialogRef()?.nativeElement) this.service.close();
  }

  valueText(display: DetailDisplay, suffixKey?: string): string {
    let text = display.text;
    if (display.textKey) {
      const translated = this.translate.instant(display.textKey);
      if (translated !== display.textKey) text = translated;
    }
    return suffixKey ? `${text} ${this.translate.instant(suffixKey)}` : text;
  }

  toneClass(tone?: DetailTone): string {
    return TONE_CLASS[tone ?? 'neutral'];
  }

  valueClass(display: DetailDisplay): string {
    return display.mono ? 'font-mono text-xs' : '';
  }
}