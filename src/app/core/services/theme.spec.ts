import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import {
  ThemeService,
  THEME_STORAGE_KEY,
} from './theme';

/**
 * jsdom has no matchMedia; install a controllable stub per test.
 * Returns the stub whose `matches` the test can flip.
 */
function installMatchMedia(
  matches: boolean,
): { matches: boolean; listeners: Array<(e: MediaQueryListEvent) => void> } {
  const state = {
    matches,
    listeners: [] as Array<(e: MediaQueryListEvent) => void>,
  };
  const mq = {
    get matches() {
      return state.matches;
    },
    addEventListener: (_t: string, l: (e: MediaQueryListEvent) => void) => {
      state.listeners.push(l);
    },
    removeEventListener: (_t: string, l: (e: MediaQueryListEvent) => void) => {
      const i = state.listeners.indexOf(l);
      if (i >= 0) state.listeners.splice(i, 1);
    },
    addListener: vi.fn(),
    removeListener: vi.fn(),
  };
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mq));
  return state;
}

describe('ThemeService', () => {
  beforeEach(() => {
    globalThis.localStorage?.removeItem(THEME_STORAGE_KEY);
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = '';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  function makeService(): ThemeService {
    return TestBed.inject(ThemeService);
  }

  it('defaults to light', () => {
    installMatchMedia(false);
    const service = makeService();
    expect(service.preference()).toBe('light');
    expect(service.resolved()).toBe('light');
    expect(service.isDark()).toBe(false);
  });

  it('applies and removes the dark class + color-scheme on <html>', () => {
    installMatchMedia(false);
    const service = makeService();
    service.setTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');

    service.setTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('persists the choice and restores it', () => {
    installMatchMedia(false);
    const service = makeService();
    service.setTheme('dark');
    expect(globalThis.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    // A fresh injector simulates a reload.
    TestBed.resetTestingModule();
    const reloaded = makeService();
    expect(reloaded.preference()).toBe('dark');
    expect(reloaded.resolved()).toBe('dark');
  });

  it('ignores invalid stored values and falls back to light', () => {
    installMatchMedia(false);
    globalThis.localStorage.setItem(THEME_STORAGE_KEY, 'purple');
    const service = makeService();
    expect(service.preference()).toBe('light');
    expect(service.resolved()).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it("'system' follows prefers-color-scheme", () => {
    const media = installMatchMedia(true);
    globalThis.localStorage.setItem(THEME_STORAGE_KEY, 'system');
    const service = makeService();
    expect(service.preference()).toBe('system');
    expect(service.resolved()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // OS flips its theme -> the service follows while on 'system'.
    media.matches = false;
    media.listeners.forEach((l) => l({ matches: false } as MediaQueryListEvent));
    expect(service.resolved()).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it("leaving 'system' stops following the OS theme", () => {
    const media = installMatchMedia(false);
    const service = makeService();

    service.setTheme('system');
    expect(media.listeners.length).toBe(1);

    service.setTheme('light');
    expect(media.listeners.length).toBe(0);

    // Flipping the OS theme no longer changes the resolved value.
    media.matches = true;
    media.listeners.forEach((l) => l({ matches: true } as MediaQueryListEvent));
    expect(service.resolved()).toBe('light');
  });
});
