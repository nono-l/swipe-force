/**
 * JPDOC: 対応言語の登録。ブラウザが日本語でなければ英語。後から言語を足せる形。
 */
/**
 * Locale registry.
 * To add a language later:
 *   1. Copy ja.ts → <id>.ts and translate
 *   2. Append an entry here
 *   3. Import it in catalog.ts
 * Browser match uses `tags` (prefix): "ja" matches ja, ja-JP, ja-JP-macrolanguage.
 */

export const LOCALE_DEFS = [
  {
    id: "ja",
    name: "Japanese",
    native: "日本語",
    tags: ["ja"],
  },
  {
    id: "en",
    name: "English",
    native: "English",
    tags: ["en"],
  },
] as const;

export type LocaleId = (typeof LOCALE_DEFS)[number]["id"];

export const DEFAULT_LOCALE: LocaleId = "en";
export const JA_LOCALE: LocaleId = "ja";

export function isLocaleId(v: unknown): v is LocaleId {
  return LOCALE_DEFS.some((d) => d.id === v);
}

export function localeDef(id: LocaleId) {
  return LOCALE_DEFS.find((d) => d.id === id) ?? LOCALE_DEFS[1]!;
}

/** First matching installed locale, else English (non-Japanese browsers). */
export function matchBrowserLocale(raw: string | readonly string[]): LocaleId {
  const list = (Array.isArray(raw) ? raw : [raw])
    .map((s) => String(s || "").trim().toLowerCase())
    .filter(Boolean);
  for (const tag of list) {
    const base = tag.split("-")[0] || tag;
    if (base === "ja" || tag.startsWith("ja")) return "ja";
  }
  for (const tag of list) {
    const base = tag.split("-")[0] || tag;
    const hit = LOCALE_DEFS.find((d) =>
      d.tags.some((t) => t === base || tag.startsWith(t)),
    );
    if (hit) return hit.id;
  }
  return DEFAULT_LOCALE;
}
