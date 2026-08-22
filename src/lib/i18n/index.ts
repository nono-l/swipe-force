/**
 * JPDOC: 翻訳関数 translate()。1文字の t は圧縮後の引数と衝突するので使わない。
 *
 * ブラウザが日本語なら ja、それ以外は en。
 * 言語を足すときは ja.ts をコピーし、locales.ts と DICTS に登録する。
 */

import { useEffect, useState } from "react";
import { en } from "./en";
import { ja, type Messages } from "./ja";
import {
  DEFAULT_LOCALE,
  LOCALE_DEFS,
  isLocaleId,
  localeDef,
  matchBrowserLocale,
  type LocaleId,
} from "./locales";

export type { LocaleId, Messages };
export { LOCALE_DEFS, DEFAULT_LOCALE, isLocaleId, localeDef, matchBrowserLocale };

const DICTS: Record<LocaleId, Messages> = {
  ja,
  en,
};

const STORAGE_KEY = "sf_locale_v1";

type Leaf = string;
type Vars = Record<string, string | number>;

function getByPath(obj: unknown, path: string): string | undefined {
  let cur: unknown = obj;
  for (const part of path.split(".")) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

function fill(s: string, vars?: Vars): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k: string) =>
    vars[k] === undefined ? `{${k}}` : String(vars[k]),
  );
}

export type MsgPath = string;

let current: LocaleId = DEFAULT_LOCALE;
let booted = false;
const listeners = new Set<() => void>();

function readSaved(): LocaleId | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return isLocaleId(v) ? v : null;
  } catch {
    return null;
  }
}

function browserLangs(): string[] {
  if (typeof navigator === "undefined") return [];
  const list = Array.from(navigator.languages || []);
  if (navigator.language) list.unshift(navigator.language);
  return list;
}

export function detectLocale(): LocaleId {
  return matchBrowserLocale(browserLangs());
}

function applyDocLang(id: LocaleId) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = id;
}

export function bootLocale(): LocaleId {
  if (!booted) {
    current = readSaved() || detectLocale();
    booted = true;
    applyDocLang(current);
  }
  return current;
}

export function getLocale(): LocaleId {
  return bootLocale();
}

export function getLocaleNative(): string {
  return localeDef(getLocale()).native;
}

export function setLocale(id: LocaleId, persist = true): LocaleId {
  bootLocale();
  if (!isLocaleId(id) || id === current) {
    applyDocLang(current);
    return current;
  }
  current = id;
  applyDocLang(id);
  if (persist && typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* */
    }
  }
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* */
    }
  });
  return current;
}

export function clearLocaleOverride(): LocaleId {
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* */
    }
  }
  return setLocale(detectLocale(), false);
}

export function cycleLocale(delta = 1): LocaleId {
  const ids = LOCALE_DEFS.map((d) => d.id);
  const i = Math.max(0, ids.indexOf(getLocale()));
  const next = ids[(i + delta + ids.length) % ids.length]!;
  return setLocale(next);
}

export function onLocaleChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function dict(id?: LocaleId): Messages {
  return DICTS[id || getLocale()] || en;
}

export function translate(path: MsgPath, vars?: Vars): string {
  bootLocale();
  const loc = current;
  const raw =
    getByPath(DICTS[loc], path) ??
    getByPath(ja, path) ??
    getByPath(en, path) ??
    path;
  return fill(raw as Leaf, vars);
}

export function useLocale(): LocaleId {
  const [id, setId] = useState<LocaleId>(() => getLocale());
  useEffect(() => onLocaleChange(() => setId(getLocale())), []);
  return id;
}
