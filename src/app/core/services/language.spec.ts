import { TestBed } from '@angular/core/testing';
import { provideTranslateTesting } from '../../../testing/translate-testing';
import { LanguageService } from './language';
import { LANG_STORAGE_KEY } from '../constants/languages.constant';

describe('LanguageService', () => {
  let service: LanguageService;

  beforeEach(() => {
    globalThis.localStorage?.clear();
    TestBed.configureTestingModule({
      providers: [provideTranslateTesting()],
    });
    service = TestBed.inject(LanguageService);
  });

  it('initialises to en by default and sets document attrs', () => {
    service.init();
    expect(service.current()).toBe('en');
    expect(service.dir()).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('restores a saved language on init', () => {
    globalThis.localStorage?.setItem(LANG_STORAGE_KEY, 'ar');
    service.init();
    expect(service.current()).toBe('ar');
    expect(service.dir()).toBe('rtl');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
  });

  it('falls back to en for a corrupt saved value', () => {
    globalThis.localStorage?.setItem(LANG_STORAGE_KEY, 'fr');
    service.init();
    expect(service.current()).toBe('en');
  });

  it('falls back to en when storage throws', () => {
    const original = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('blocked');
      },
    });
    try {
      service.init();
      expect(service.current()).toBe('en');
    } finally {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: original,
      });
    }
  });

  it('switches to ar and persists the choice', () => {
    service.init();
    service.setLanguage('ar');
    expect(service.current()).toBe('ar');
    expect(service.dir()).toBe('rtl');
    expect(globalThis.localStorage?.getItem(LANG_STORAGE_KEY)).toBe('ar');
  });

  it('rejects unknown language codes', () => {
    service.init();
    service.setLanguage('de');
    expect(service.current()).toBe('en');
    // The stored key stays 'en' (written by init), never 'de'.
    expect(globalThis.localStorage?.getItem(LANG_STORAGE_KEY)).not.toBe('de');
  });
});
