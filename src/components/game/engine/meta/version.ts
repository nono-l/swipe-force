/**
 * Recovered aliases for app version / changelog.
 * Source of truth: `@/lib/version-history`.
 */
import {
  APP_VERSION,
  VERSION_HISTORY,
  versionShortLabel,
} from "@/lib/version-history";

/** Current version string e.g. "1.5.0" (recovered `cn`) */
export const cn = APP_VERSION;

/** Changelog entries newest-first (recovered `ln`) */
export const ln = VERSION_HISTORY;

export function un(): string {
  return versionShortLabel();
}

export { APP_VERSION, VERSION_HISTORY, versionShortLabel };
