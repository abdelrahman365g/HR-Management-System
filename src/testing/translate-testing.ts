import { provideTranslateService } from '@ngx-translate/core';

/**
 * Testing provider for specs: the translate pipe/service return the key
 * itself (no HTTP loader, en.json not needed). Use in every spec whose
 * templates render `| translate`.
 */
export function provideTranslateTesting() {
  return provideTranslateService({ lang: 'en', fallbackLang: 'en' });
}
