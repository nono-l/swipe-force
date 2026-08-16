/** Canonical partner portal URL helpers */

export function partnerPortalPath(): string {
  return "/partner";
}

export function partnerPortalUrl(): string {
  if (typeof location !== "undefined" && location.origin) {
    return `${location.origin}${partnerPortalPath()}`;
  }
  return partnerPortalPath();
}

/** Open portal in a new tab (fallback to same tab). Returns true if navigated. */
export function openPartnerPortal(opts?: {
  sameTab?: boolean;
}): boolean {
  const url = partnerPortalUrl();
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
