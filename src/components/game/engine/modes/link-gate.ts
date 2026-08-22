/**
 * JPDOC: 連携必須の入口ロック。
 */
/**
 * Account-link gate messages (recovered Si).
 */

import { translate } from "@/lib/i18n";

export type LinkGate =
  | { ok: true }
  | { ok: false; message: string };

export function requireLinked(
  linked: boolean,
  feature = translate("hud.featDefault"),
): LinkGate {
  if (linked) return { ok: true };
  return { ok: false, message: translate("hud.gate", { feat: feature }) };
}