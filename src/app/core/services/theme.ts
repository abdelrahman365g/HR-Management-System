import { Injectable, computed, inject, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'hrms.theme';

const VALID_PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system'];

const MEDIA_QUERY = '(prefers-color-scheme: dark)';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly preference = signal<ThemePreference>('light');

  readonly resolved = signal<'light' | 'dark'>('light');

  readonly isDark = computed(() => this.resolved() === 'dark');

  private readonly media =
    typeof globalThis.matchMedia === 'function' ? globalThis.matchMedia(MEDIA_QUERY) : null;

  private readonly systemListener = (event: MediaQueryListEvent): void => {
    this.resolved.set(event.matches ? 'dark' : 'light');
    this.applyToDocument(this.resolved());
  };

  constructor() {
    this.restore();
  }

  setTheme(preference: ThemePreference): void {
    if (!VALID_PREFERENCES.includes(preference)) return;
    this.preference.set(preference);

    if (preference === 'system') {
      this.resolved.set(this.media?.matches ? 'dark' : 'light');
      this.media?.addEventListener('change', this.systemListener);
    } else {
      this.resolved.set(preference);
      this.media?.removeEventListener('change', this.systemListener);
    }

    this.applyToDocument(this.resolved());

    try {
      globalThis.localStorage?.setItem(THEME_STORAGE_KEY, preference);
    } catch {
    }
  }

  private restore(): void {
    let saved: string | null = null;
    try {
      saved = globalThis.localStorage?.getItem(THEME_STORAGE_KEY) ?? null;
    } catch {
    }
    const preference = this.isValid(saved) ? saved : 'light';
    this.preference.set(preference);
    if (preference === 'system') {
      this.resolved.set(this.media?.matches ? 'dark' : 'light');
      this.media?.addEventListener('change', this.systemListener);
    } else {
      this.resolved.set(preference);
    }

    this.applyToDocument(this.resolved());
  }

  private isValid(value: string | null): value is ThemePreference {
    return value === 'light' || value === 'dark' || value === 'system';
  }

  private applyToDocument(resolved: 'light' | 'dark'): void {
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.style.colorScheme = resolved;
  }
}
