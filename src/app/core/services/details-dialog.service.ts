import { Injectable, signal } from '@angular/core';
import { DetailsDialogConfig } from '../interfaces/details-dialog.interface';

@Injectable({ providedIn: 'root' })
export class DetailsDialogService {
  readonly config = signal<DetailsDialogConfig | null>(null);

  private resolver: (() => void) | null = null;

  open<T>(config: DetailsDialogConfig<T>): Promise<void> {
    this.finish();
    this.config.set(config as DetailsDialogConfig);
    return new Promise<void>((resolve) => {
      this.resolver = resolve;
    });
  }

  close(): void {
    this.finish();
  }

  private finish(): void {
    this.config.set(null);
    const resolve = this.resolver;
    this.resolver = null;
    resolve?.();
  }
}