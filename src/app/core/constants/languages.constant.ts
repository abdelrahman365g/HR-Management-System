export interface SupportedLanguage {
  code: 'en' | 'ar';
  label: string;
  dir: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
];

export const DEFAULT_LANGUAGE = 'en';
export const LANG_STORAGE_KEY = 'hrms.lang';
