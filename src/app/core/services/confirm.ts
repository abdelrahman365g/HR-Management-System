import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  titleKey: string;
  messageKey?: string;
  params?: Record<string, unknown>;
  confirmKey?: string;
  cancelKey?: string;
  variant?: 'danger' | 'info';
}

export interface ConfirmState extends ConfirmOptions {
  variant: 'danger' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  /** Current dialog request, or null when nothing is open. */
  readonly state = signal<ConfirmState | null>(null);

  private resolver: ((value: boolean) => void) | null = null;

  /**
   * Opens the confirm dialog (one at a time — a second call while open
   * resolves the previous one as cancelled) and resolves with the
   * user's choice.
   */
  ask(options: ConfirmOptions): Promise<boolean> {
    if (this.resolver) {
      this.resolve(false);
    }
    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
      this.state.set({
        variant: 'danger',
        confirmKey: 'common.confirm',
        cancelKey: 'common.cancel',
        ...options,
      });
    });
  }

  /** Called by the dialog when the user confirms. */
  confirm(): void {
    this.resolve(true);
  }

  /** Called by the dialog on cancel / Esc / scrim click / close. */
  cancel(): void {
    this.resolve(false);
  }

  private resolve(value: boolean): void {
    this.state.set(null);
    const resolver = this.resolver;
    this.resolver = null;
    resolver?.(value);
  }
}
