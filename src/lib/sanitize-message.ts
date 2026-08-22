/**
 * JPDOC: ユーザー入力のサニタイズ。XSSをここに閉じる。
 */
/**
 * Strict text sanitizer (client + server).
 * Blocks null/control codes, HTML/SQL metacharacters, bidi tricks, etc.
 * Allowlists JP/EN text, safe punctuation, and standard emoji.
 */

/** fan-mail short notes */
const FAN_MAX_LEN = 40;
/** sound-test comments */
export const SOUND_COMMENT_MAX_LEN = 2000;

/** C0/C1 controls, DEL, and other non-characters we never want */
const HAS_CONTROL =
  // eslint-disable-next-line no-control-regex
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\uFFFE\uFFFF]/;

/** HTML / markup / quote / escape vectors */
const HAS_HTML_META = /[<>&"'`\\/]/;

/** SQL comment / statement separators (defense in depth; DB is parameterized) */
const HAS_SQL_META = /(--|\/\*|\*\/|;|\||\x00)/;

/** Obvious injection keywords as whole words */
const HAS_SQL_KW =
  /\b(union|select|insert|update|delete|drop|alter|create|truncate|exec|execute|script|javascript|onerror|onload|eval)\b/i;

/**
 * Invisible / bidi override — but KEEP:
 *  U+200D ZWJ (emoji sequences)
 *  U+FE0F emoji presentation selector (handled in allowlist, not stripped here)
 */
const STRIP_INVISIBLE =
  /[\u200B\u200C\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF\u00AD]/g;

const RE_EMOJI_PICTO = /\p{Extended_Pictographic}/u;

function isEmojiRelatedCodePoint(c: number): boolean {
  // ZWJ for multi-part emoji
  if (c === 0x200d) return true;
  // Variation Selector-16 (emoji style)
  if (c === 0xfe0f) return true;
  // Combining Enclosing Keycap
  if (c === 0x20e3) return true;
  // Skin tone modifiers
  if (c >= 0x1f3fb && c <= 0x1f3ff) return true;
  // Regional indicator symbols (flags)
  if (c >= 0x1f1e6 && c <= 0x1f1ff) return true;
  // Tags used in some flag sequences (rarely)
  if (c >= 0xe0020 && c <= 0xe007f) return true;
  return false;
}

/**
 * Allowed code points:
 * - ASCII letters/digits + safe punct
 * - Hiragana / Katakana / Kanji
 * - Standard emoji (+ ZWJ / VS16 / skin tones / flags)
 */
function isAllowedChar(ch: string): boolean {
  const c = ch.codePointAt(0) ?? 0;
  // ASCII A-Z a-z 0-9 space
  if (c === 0x20) return true;
  if (c >= 0x30 && c <= 0x39) return true;
  if (c >= 0x41 && c <= 0x5a) return true;
  if (c >= 0x61 && c <= 0x7a) return true;
  // fullwidth space
  if (c === 0x3000) return true;
  // safe ASCII punct: ! ? . , ( ) ~
  if (c === 0x21 || c === 0x3f || c === 0x2e || c === 0x2c) return true;
  if (c === 0x28 || c === 0x29 || c === 0x7e) return true;
  // JP punct: 、。・ー〜…！？「」『』（）
  if (
    c === 0x3001 ||
    c === 0x3002 ||
    c === 0x30fb ||
    c === 0x30fc ||
    c === 0x301c ||
    c === 0xff5e ||
    c === 0x2026 ||
    c === 0xff01 ||
    c === 0xff1f ||
    c === 0x300c ||
    c === 0x300d ||
    c === 0x300e ||
    c === 0x300f ||
    c === 0xff08 ||
    c === 0xff09
  )
    return true;
  // Hiragana
  if (c >= 0x3041 && c <= 0x3096) return true;
  if (c === 0x309d || c === 0x309e || c === 0x30fc) return true;
  // Katakana
  if (c >= 0x30a1 && c <= 0x30fa) return true;
  if (c === 0x30fd || c === 0x30fe) return true;
  // halfwidth katakana
  if (c >= 0xff66 && c <= 0xff9d) return true;
  // CJK Unified Ideographs
  if (c >= 0x4e00 && c <= 0x9fff) return true;
  if (c >= 0x3400 && c <= 0x4dbf) return true;
  // iteration marks 々 〻
  if (c === 0x3005 || c === 0x303b) return true;

  // --- standard emoji ---
  if (isEmojiRelatedCodePoint(c)) return true;
  if (RE_EMOJI_PICTO.test(ch)) return true;
  // Misc Symbols & Dingbats often used as emoji (⭐✨♥ etc.) when presented as emoji
  if (c >= 0x2600 && c <= 0x26ff) return true;
  if (c >= 0x2700 && c <= 0x27bf) return true;
  // Supplemental Symbols and Pictographs / etc. covered by Extended_Pictographic mostly

  return false;
}

function limitGraphemes(s: string, max: number): string {
  try {
    if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
      const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
      let out = "";
      let n = 0;
      for (const { segment } of seg.segment(s)) {
        if (n >= max) break;
        out += segment;
        n += 1;
      }
      return out;
    }
  } catch {
    /* fall through */
  }
  return [...s].slice(0, max).join("");
}

export type SanitizeResult =
  | { ok: true; text: string }
  | { ok: false; reason: "type" | "long" | "control" | "null" | "html" | "sql" | "empty" | "unsafe" };

export function sanitizeFanMessage(raw: unknown): SanitizeResult {
  return sanitizeText(raw, FAN_MAX_LEN, 400, false);
}

/** Sound-test comments: up to 2000 graphemes, newlines OK */
export function sanitizeSoundComment(raw: unknown): SanitizeResult {
  return sanitizeText(raw, SOUND_COMMENT_MAX_LEN, 16000, true);
}

function sanitizeText(
  raw: unknown,
  maxGraphemes: number,
  maxUtf16: number,
  allowNewline: boolean,
): SanitizeResult {
  if (typeof raw !== "string") return { ok: false, reason: "type" };
  if (raw.length > maxUtf16) return { ok: false, reason: "long" };

  if (raw.includes("\u0000") || raw.includes("\0")) {
    return { ok: false, reason: "null" };
  }
  if (HAS_CONTROL.test(raw)) return { ok: false, reason: "control" };
  if (HAS_HTML_META.test(raw)) return { ok: false, reason: "html" };
  if (HAS_SQL_META.test(raw)) return { ok: false, reason: "sql" };
  if (HAS_SQL_KW.test(raw)) return { ok: false, reason: "sql" };

  let t = raw.normalize("NFC");
  t = t.replace(STRIP_INVISIBLE, "");
  if (allowNewline) {
    t = t.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\t/g, " ");
    t = t.replace(/\n{3,}/g, "\n\n");
  } else if (/[\r\n\t]/.test(t)) {
    return { ok: false, reason: "control" };
  }

  if (allowNewline) {
    const lines = t.split("\n");
    const outLines: string[] = [];
    for (const line of lines) {
      const cleaned = [...line].filter(isAllowedChar).join("");
      if (cleaned !== [...line].join("")) return { ok: false, reason: "unsafe" };
      outLines.push(cleaned);
    }
    let text = limitGraphemes(outLines.join("\n").trim(), maxGraphemes);
    text = text
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n")
      .trim();
    if (!text) return { ok: false, reason: "empty" };
    if (
      !/[\p{L}\p{N}\u3040-\u30ff\u4e00-\u9fff]/u.test(text) &&
      !RE_EMOJI_PICTO.test(text) &&
      !/[\u2600-\u27bf]/u.test(text)
    ) {
      return { ok: false, reason: "empty" };
    }
    return { ok: true, text };
  }

  const cleaned = [...t].filter(isAllowedChar).join("");
  const expected = [...t].join("");
  if (cleaned !== expected) return { ok: false, reason: "unsafe" };

  const text = limitGraphemes(cleaned.trim(), maxGraphemes);
  if (!text) return { ok: false, reason: "empty" };
  if (
    !/[\p{L}\p{N}\u3040-\u30ff\u4e00-\u9fff]/u.test(text) &&
    !RE_EMOJI_PICTO.test(text) &&
    !/[\u2600-\u27bf]/u.test(text)
  ) {
    return { ok: false, reason: "empty" };
  }
  return { ok: true, text };
}

export function sanitizeReasonLabel(reason: string): string {
  switch (reason) {
    case "html":
      return "HTML記号は使えません";
    case "sql":
      return "使えない文字・語句があります";
    case "control":
    case "null":
      return "制御文字は使えません";
    case "unsafe":
      return "使用できない文字が含まれています";
    case "empty":
      return "メッセージを入力してください";
    case "long":
      return "長すぎます（上限を超えています）";
    case "url":
      return "URLが正しくありません（httpsのみ）";
    case "url_limit":
      return "URLは20件までです";
    default:
      return "入力内容を確認してください";
  }
}

const MAX_URLS = 20;
const MAX_URL_LEN = 500;

/**
 * Safe external links only: http/https, no credentials, no userinfo tricks.
 * Returns cleaned absolute URLs (max 20).
 */
export function sanitizeUrlList(raw: unknown): {
  ok: true;
  urls: string[];
} | { ok: false; reason: "url" | "url_limit" | "type" } {
  if (raw == null) return { ok: true, urls: [] };
  if (!Array.isArray(raw)) return { ok: false, reason: "type" };
  if (raw.length > MAX_URLS) return { ok: false, reason: "url_limit" };
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") return { ok: false, reason: "url" };
    const s = item.trim();
    if (!s) continue; // skip empty slots
    if (s.length > MAX_URL_LEN) return { ok: false, reason: "url" };
    if (/[\u0000-\u001F\u007F<>"'`]/.test(s)) return { ok: false, reason: "url" };
    let u: URL;
    try {
      u = new URL(s);
    } catch {
      return { ok: false, reason: "url" };
    }
    if (u.protocol !== "https:" && u.protocol !== "http:") {
      return { ok: false, reason: "url" };
    }
    if (u.username || u.password) return { ok: false, reason: "url" };
    // block weird hosts
    if (!u.hostname || u.hostname.includes(" ") || u.hostname === "localhost") {
      // allow localhost in dev? safer block for public comments
      if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
        /* allow for local testing */
      } else if (!/^[a-z0-9.-]+$/i.test(u.hostname)) {
        return { ok: false, reason: "url" };
      }
    }
    // normalize: drop hash for storage consistency optional — keep path/query
    const cleaned = u.toString();
    if (!out.includes(cleaned)) out.push(cleaned);
    if (out.length > MAX_URLS) return { ok: false, reason: "url_limit" };
  }
  return { ok: true, urls: out };
}

export type SoundCommentKind = "note" | "arrange" | "cover";

export function sanitizeCommentKind(raw: unknown): SoundCommentKind {
  if (raw === "arrange" || raw === "cover" || raw === "note") return raw;
  return "note";
}


/** profile display name */
export const PROFILE_NAME_MAX = 16;
/** profile bio / self-intro */
export const PROFILE_BIO_MAX = 5000;
/** share tweet blurb */
export const PROFILE_SHARE_MAX = 40;

export function sanitizeProfileName(raw: unknown): { ok: true; text: string } | { ok: false; reason: string } {
  const base = sanitizeFanMessage(raw);
  if (!base.ok) return base;
  const text = base.text.slice(0, PROFILE_NAME_MAX);
  if (!text.trim()) return { ok: false, reason: "empty" };
  return { ok: true, text };
}

/** シェア文テンプレ（40文字・改行なし） */
export function sanitizeProfileShare(raw: unknown): { ok: true; text: string } | { ok: false; reason: string } {
  if (typeof raw !== "string") return { ok: false, reason: "type" };
  if (!raw.trim()) return { ok: true, text: "" };
  const base = sanitizeText(raw, PROFILE_SHARE_MAX, 400, false);
  if (!base.ok) {
    if (base.reason === "empty") return { ok: true, text: "" };
    return base;
  }
  return { ok: true, text: base.text.slice(0, PROFILE_SHARE_MAX) };
}

export function sanitizeProfileBio(raw: unknown): { ok: true; text: string } | { ok: false; reason: string } {
  if (typeof raw !== "string") return { ok: false, reason: "type" };
  if (!raw.trim()) return { ok: true, text: "" };
  if (raw.length > 40000) return { ok: false, reason: "long" };
  if (raw.includes("\u0000") || raw.includes("\0")) return { ok: false, reason: "null" };
  if (HAS_CONTROL.test(raw)) return { ok: false, reason: "control" };
  // block tag/script vectors but allow URL query chars (/ ? = & : % #)
  if (/[<>"'`]/.test(raw)) return { ok: false, reason: "html" };
  // SQL separators — but not inside https URLs
  const withoutUrls = raw.replace(/https?:\/\/[^\s<>"'`]+/gi, " ");
  if (HAS_SQL_META.test(withoutUrls)) return { ok: false, reason: "sql" };
  if (HAS_SQL_KW.test(withoutUrls)) return { ok: false, reason: "sql" };

  let t = raw.normalize("NFC");
  t = t.replace(STRIP_INVISIBLE, "");
  t = t.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\t/g, " ");
  t = t.replace(/\n{3,}/g, "\n\n");

  const isProfileChar = (ch: string) => {
    if (isAllowedChar(ch)) return true;
    const c = ch.codePointAt(0) ?? 0;
    // URL / path safe ASCII
    // : / ? = & % # + _ - @ . ~ * , [ ]
    if (
      c === 0x3a || // :
      c === 0x2f || // /
      c === 0x3f || // ?
      c === 0x3d || // =
      c === 0x26 || // &
      c === 0x25 || // %
      c === 0x23 || // #
      c === 0x2b || // +
      c === 0x5f || // _
      c === 0x2d || // -
      c === 0x40 || // @
      c === 0x7e || // ~
      c === 0x2a || // *
      c === 0x5b || // [
      c === 0x5d // ]
    )
      return true;
    return false;
  };

  const lines = t.split("\n");
  const outLines: string[] = [];
  for (const line of lines) {
    const cleaned = [...line].filter(isProfileChar).join("");
    if (cleaned !== [...line].join("")) return { ok: false, reason: "unsafe" };
    outLines.push(cleaned);
  }
  let text = limitGraphemes(outLines.join("\n").trim(), PROFILE_BIO_MAX);
  text = text
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
  if (!text) return { ok: true, text: "" };
  return { ok: true, text };
}

/** Extract http(s) URLs from free text (for auto-link / cushion). */
export function extractUrlsFromText(text: string): string[] {
  if (!text) return [];
  const re = /https?:\/\/[^\s<>"'`]+/gi;
  const found: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    let u = m[0];
    // trim trailing JP/EN punctuation often stuck to URLs
    // keep ? # & = in query; only strip trailing sentence punct
    u = u.replace(/[),.、。！!]+$/g, "");
    try {
      const parsed = new URL(u);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") continue;
      if (parsed.username || parsed.password) continue;
      const cleaned = parsed.toString();
      if (!found.includes(cleaned)) found.push(cleaned);
    } catch {
      /* skip */
    }
    if (found.length >= MAX_URLS) break;
  }
  return found;
}

/** Split text into plain / url segments for linkify UI. */
export function segmentTextWithUrls(
  text: string,
): { type: "text" | "url"; value: string }[] {
  if (!text) return [];
  const re = /https?:\/\/[^\s<>"'`]+/gi;
  const segs: { type: "text" | "url"; value: string }[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      segs.push({ type: "text", value: text.slice(last, m.index) });
    }
    let u = m[0];
    let trail = "";
    const trim = u.match(/^(.*?)([),.、。！!]+)$/);
    if (trim) {
      u = trim[1];
      trail = trim[2];
    }
    try {
      const parsed = new URL(u);
      if (
        (parsed.protocol === "http:" || parsed.protocol === "https:") &&
        !parsed.username &&
        !parsed.password
      ) {
        segs.push({ type: "url", value: parsed.toString() });
        if (trail) segs.push({ type: "text", value: trail });
      } else {
        segs.push({ type: "text", value: m[0] });
      }
    } catch {
      segs.push({ type: "text", value: m[0] });
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) segs.push({ type: "text", value: text.slice(last) });
  return segs;
}

/** track key for profile URL cushion / reports */
export function profileUrlTrackKey(playerId: string): string {
  const id = String(playerId || "")
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 24);
  return `prof:${id}`.slice(0, 32);
}
