/** A translation key plus optional params, translated in the template. */
export interface TranslatedMessage {
  key: string;
  params?: Record<string, unknown>;
}

/** Builds a TranslatedMessage from a key and optional params. */
export function msg(key: string, params?: Record<string, unknown>): TranslatedMessage {
  return { key, params };
}
