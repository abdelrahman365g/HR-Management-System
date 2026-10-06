import {
  Component,
  ElementRef,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ConfirmService } from '../../../core/services/confirm';

/**
 * Application-wide confirmation dialog, hosted once in app.html and
 * driven by ConfirmService. Built on the native <dialog> element for
 * the built-in focus trap, Esc handling and inert background.
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [TranslatePipe],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
})
export class ConfirmDialog {
  protected readonly confirmService = inject(ConfirmService);

  private readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  private readonly cancelButton = viewChild<ElementRef<HTMLButtonElement>>('cancelBtn');
  private readonly confirmButton = viewChild<ElementRef<HTMLButtonElement>>('confirmBtn');

  private lastTrigger: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const state = this.confirmService.state();
      const element = this.dialogRef()?.nativeElement;

      if (!element) return;

      if (state && !element.open) {
        this.lastTrigger = document.activeElement as HTMLElement | null;
        element.showModal();
        setTimeout(() => {
          if (this.confirmService.state()?.variant === 'danger') {
            this.cancelButton()?.nativeElement.focus();
          } else {
            this.confirmButton()?.nativeElement.focus();
          }
        });
      } else if (!state && element.open) {
        element.close();
        this.lastTrigger?.focus?.();
        this.lastTrigger = null;
      }
    });
  }

  onConfirm(): void {
    this.confirmService.confirm();
  }

  onCancel(): void {
    this.confirmService.cancel();
  }

  private readonly onNativeClick = (event: MouseEvent): void => {
    const element = this.dialogRef()?.nativeElement;
    if (!element) return;
    if (event.target === element) {
      this.confirmService.cancel();
    }
  };

  private readonly onNativeClose = (): void => {
    this.lastTrigger?.focus?.();
    this.lastTrigger = null;
  };

  private readonly onNativeCancel = (): void => {
    this.confirmService.cancel();
  };

  ngAfterViewInit(): void {
    const element = this.dialogRef()?.nativeElement;
    if (!element) return;
    element.addEventListener('click', this.onNativeClick);
    element.addEventListener('close', this.onNativeClose);
    element.addEventListener('cancel', this.onNativeCancel);
  }

  ngOnDestroy(): void {
    const element = this.dialogRef()?.nativeElement;
    if (!element) return;
    element.removeEventListener('click', this.onNativeClick);
    element.removeEventListener('close', this.onNativeClose);
    element.removeEventListener('cancel', this.onNativeCancel);
  }
}
