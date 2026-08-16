/**
 * Account-link gate messages (recovered Si).
 */

import { t } from "@/lib/i18n";

export type LinkGate =
  | { ok: true }
  | { ok: false; message: string };

export function requireLinked(
  linked: boolean,
  feature = t("hud.featDefault"),
): LinkGate {
  if (linked) return { ok: true };
  return { ok: false, message: t("hud.gate", { feat: feature }) };
}