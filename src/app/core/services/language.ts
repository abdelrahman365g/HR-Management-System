import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import {
  DEFAULT_LANGUAGE,
  LANG_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
} from '../constants/languages.constant';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);

  readonly current = signal<string>(DEFAULT_LANGUAGE);
  readonly dir = signal<'ltr' | 'rtl'>('ltr');

  readonly isRtl = computed(() => this.dir() === 'rtl');

  init(): Observable<unknown> {
    let saved: string | null = null;
    try {
      saved = globalThis.localStorage?.getItem(LANG_STORAGE_KEY) ?? null;
    } catch {
      console.error('could not load the saved language');
    }
    const initial = saved && this.isValid(saved) ? saved : DEFAULT_LANGUAGE;
    return this.applyLanguage(initial);
  }

  setLanguage(code: string): void {
    if (code === this.current()) return;
    if (!this.isValid(code)) return;
    this.applyLanguage(code);
  }

  private applyLanguage(code: string): Observable<unknown> {
    const language = SUPPORTED_LANGUAGES.find((l) => l.code === code);
    if (!language) return new Observable<never>((observer) => observer.complete());

    const load$ = this.translate.use(code);

    load$.subscribe({
      next: () => {
        this.current.set(code);
        this.dir.set(language.dir);

        const root = document.documentElement;
        root.lang = code;
        root.dir = language.dir;

        try {
          globalThis.localStorage?.setItem(LANG_STORAGE_KEY, code);
        } catch {
          console.error('could not save the selected language');
        }
      },
      error: (err: unknown) => {
        console.error(
          `[i18n] failed to load language file for "${code}" ` +
            `(/assets/i18n/${code}.json). Falling back to English text.`,
          err,
        );
      },
    });

    return load$;
  }

  private isValid(code: string): boolean {
    return SUPPORTED_LANGUAGES.some((l) => l.code === code);
  }
}
