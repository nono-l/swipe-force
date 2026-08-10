/** Canonical advertiser portal URL helpers */

export function advertiserPortalPath(): string {
  return "/advertiser";
}

export function advertiserPortalUrl(): string {
  if (typeof location !== "undefined" && location.origin) {
    return `${location.origin}${advertiserPortalPath()}`;
  }
  return advertiserPortalPath();
}

/** Open portal in a new tab (fallback to same tab). Returns true if navigated. */
export function openAdvertiserPortal(opts?: {
  sameTab?: boolean;
}): boolean {
  const url = advertiserPortalUrl();
  try {
    if (opts?.sameTab) {
      window.location.assign(url);
      return true;
    }
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (w) return true;
    // popup blocked → same tab
    window.location.assign(url);
    return true;
  } catch {
    try {
      window.location.href = url;
      return true;
    } catch {
      return false;
    }
  }
}
