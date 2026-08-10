/**
 * Sound-test comments open / return mode (recovered ji / Xe).
 */

export function canOpenComments(trackLabel: string | null | undefined): {
  ok: boolean;
  message?: string;
} {
  if (!trackLabel || trackLabel.startsWith("—")) {
    return { ok: false, message: "先に曲を再生してください" };
  }
  return { ok: true };
}

/** Where to return when leaving comments (recovered Xe). */
export function commentsReturnMode(
  listMode: string,
  playMode: string,
): string {
  if (
    listMode === "menu" ||
    listMode === "stage" ||
    listMode === "boss" ||
    listMode === "legacy" ||
    listMode === "archive"
  ) {
    return listMode;
  }
  return playMode === "title" ? "menu" : playMode;
}

export type VoteDelta = 1 | -1;

export function voteLabel(delta: VoteDelta): string {
  return delta > 0 ? "いいね" : "よくないね";
}
