/**
 * Account-link gate messages (recovered Si).
 */

export type LinkGate =
  | { ok: true }
  | { ok: false; message: string };

export function requireLinked(
  linked: boolean,
  feature = "この機能",
): LinkGate {
  if (linked) return { ok: true };
  return { ok: false, message: `${feature}はアカウント連携が必要です` };
}
