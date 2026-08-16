/** DOM dialogs for profile + player status (link perks / meta UI). */

import {
  readLocalProfile,
  writeLocalProfile,
  saveMyProfile,
  fetchPublicProfile,
  syncProfileFromServer,
  type PlayerProfile,
} from "@/lib/account";
import {
  segmentTextWithUrls,
  profileUrlTrackKey,
} from "@/lib/sanitize-message";
import {
  URL_REPORT_LABELS,
  fetchUrlReports,
  hasLocalUrlVisit,
  type UrlReportSummary,
} from "@/lib/sound-comments";
import { t } from "@/lib/i18n";
import { openUrlCushion } from "@/lib/url-cushion";
import { buildStatusLines, formatPlayTime, readStats } from "@/lib/player-stats";

function esc(s: string) {
  const amp = ["&", "a", "m", "p", ";"].join("");
  const lt = ["&", "l", "t", ";"].join("");
  const gt = ["&", "g", "t", ";"].join("");
  const quot = ["&", "q", "u", "o", "t", ";"].join("");
  const apos = ["&", "#", "3", "9", ";"].join("");
  return String(s)
    .replace(/&/g, amp)
    .replace(/</g, lt)
    .replace(/>/g, gt)
    .replace(/"/g, quot)
    .replace(/'/g, apos);
}

export function fillLinkedBio(
  host: HTMLElement,
  bio: string,
  ownerId: string,
  contextLabel: string,
  playerId: string,
  linked: boolean,
  onNeedLink?: () => void,
) {
  host.innerHTML = "";
  host.style.whiteSpace = "pre-wrap";
  host.style.wordBreak = "break-word";
  const trackKey = profileUrlTrackKey(ownerId);
  const segs = segmentTextWithUrls(bio);
  const urls = segs.filter((s) => s.type === "url").map((s) => s.value);
  const reportState: Record<string, UrlReportSummary> = {};
  for (const u of urls) {
    reportState[u] = {
      counts: Object.fromEntries(URL_REPORT_LABELS.map((x) => [x.id, 0])),
      mine: null,
      visited: hasLocalUrlVisit(trackKey, u),
    };
  }
  if (urls.length) {
    void fetchUrlReports(trackKey, urls, playerId).then((rep) => {
      for (const [u, sum] of Object.entries(rep)) {
        reportState[u] = {
          ...sum,
          visited: sum.visited || hasLocalUrlVisit(trackKey, u),
        };
      }
    });
  }
  for (const seg of segs) {
    if (seg.type === "text") {
      host.appendChild(document.createTextNode(seg.value));
    } else {
      const a = document.createElement("button");
      a.type = "button";
      let short = seg.value;
      try {
        const u = new URL(seg.value);
        short = u.hostname + u.pathname.slice(0, 20);
      } catch {
        /* */
      }
      a.textContent = short.length > 36 ? short.slice(0, 35) + "…" : short;
      a.style.cssText =
        "display:inline;padding:0 2px;border:0;border-bottom:1px dashed #6cf;background:transparent;color:#8cf;font:inherit;cursor:pointer";
      a.onclick = (ev) => {
        ev.preventDefault();
        if (!linked) {
          onNeedLink?.();
          return;
        }
        openUrlCushion({
          trackKey,
          url: seg.value,
          contextLabel,
          reportState,
          playerId,
          linked,
          onNeedLink,
        });
      };
      host.appendChild(a);
    }
  }
}

export function openProfileDialog(opts: {
  linked: boolean;
  playerId: string;
  onSaved?: (p: PlayerProfile) => void;
  onNeedLink?: () => void;
  sfxUi?: () => void;
  sfxOk?: () => void;
  sfxFail?: () => void;
}) {
  if (!opts.linked) {
    opts.onNeedLink?.();
    opts.sfxFail?.();
    return;
  }
  if (document.getElementById("sf-profile-dlg")) return;
  opts.sfxUi?.();
  const local = readLocalProfile();
  const dlg = document.createElement("div");
  dlg.id = "sf-profile-dlg";
  dlg.style.cssText =
    "position:fixed;inset:0;z-index:9990;display:flex;align-items:center;justify-content:center;background:rgba(0,8,6,.8);padding:12px;font-family:system-ui,sans-serif";
  dlg.innerHTML = `
    <div style="width:min(360px,96vw);max-height:92vh;overflow:auto;background:#061a12;border:2px solid #66ffaa;border-radius:12px;padding:14px;color:#dff">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-size:14px;font-weight:700;color:#8ff">プロフィール</div>
        <button type="button" id="sf-pr-x" style="border:0;background:transparent;color:#9ab;font-size:18px;cursor:pointer">×</button>
      </div>
      <div style="font-size:11px;color:#6a9;line-height:1.4;margin-bottom:10px">${t("profile.lead")}</div>
      <div id="sf-pr-sync" style="font-size:10px;color:#8a7;margin-bottom:8px">${t("profile.syncing")}</div>
      <label style="font-size:11px;color:#9ab">${t("profile.name")}</label>
      <input id="sf-pr-name" maxlength="16" value="${esc(local.displayName)}" placeholder="パイロット名"
        style="width:100%;box-sizing:border-box;margin:4px 0 10px;padding:9px;border-radius:8px;border:1px solid #2a6;background:#001a10;color:#efe;font-size:14px" />
      <label style="font-size:11px;color:#9ab">${t("profile.share")}</label>
      <div style="font-size:10px;color:#678;margin:2px 0 4px">${t("profile.shareHint")}</div>
      <input id="sf-pr-share" maxlength="40" value="${esc(local.shareBlurb)}" placeholder="例: 4面ボス詰み助けて"
        style="width:100%;box-sizing:border-box;margin:0 0 4px;padding:9px;border-radius:8px;border:1px solid #2a6;background:#001a10;color:#efe" />
      <div id="sf-pr-sc" style="font-size:10px;color:#678;text-align:right;margin-bottom:10px">0 / 40</div>
      <label style="font-size:11px;color:#9ab">${t("profile.bio")}</label>
      <div style="font-size:10px;color:#678;margin:2px 0 4px">${t("profile.bioHint")}</div>
      <textarea id="sf-pr-bio" maxlength="5000" rows="6" placeholder="例: 関東勢です&#10;https://x.com/you?s=20&t=abc#hi"
        style="width:100%;box-sizing:border-box;margin:4px 0 6px;padding:9px;border-radius:8px;border:1px solid #2a6;background:#001a10;color:#efe;resize:vertical;min-height:90px">${esc(local.bio)}</textarea>
      <div id="sf-pr-bc" style="font-size:10px;color:#678;text-align:right;margin-bottom:8px">0 / 5000</div>
      <div id="sf-pr-msg" style="min-height:1.2em;font-size:11px;color:#fc8;text-align:center;margin-bottom:8px"></div>
      <div style="display:flex;gap:8px">
        <button type="button" id="sf-pr-clear" style="flex:1;padding:10px;border-radius:8px;border:1px solid #654;background:#221810;color:#ca8">クリア</button>
        <button type="button" id="sf-pr-save" style="flex:2;padding:10px;border-radius:8px;border:1px solid #4f8;background:#1a5;color:#fff;font-weight:700">保存</button>
      </div>
    </div>`;
  document.body.appendChild(dlg);
  const stop = (e: Event) => e.stopPropagation();
  dlg.addEventListener("pointerdown", stop);
  const nameEl = dlg.querySelector("#sf-pr-name") as HTMLInputElement;
  const shareEl = dlg.querySelector("#sf-pr-share") as HTMLInputElement;
  const bioEl = dlg.querySelector("#sf-pr-bio") as HTMLTextAreaElement;
  const sc = dlg.querySelector("#sf-pr-sc") as HTMLElement;
  const bc = dlg.querySelector("#sf-pr-bc") as HTMLElement;
  const msg = dlg.querySelector("#sf-pr-msg") as HTMLElement;
  const syncEl = dlg.querySelector("#sf-pr-sync") as HTMLElement;
  const paint = () => {
    sc.textContent = `${[...shareEl.value].length} / 40`;
    bc.textContent = `${[...bioEl.value].length} / 5000`;
  };
  shareEl.oninput = paint;
  bioEl.oninput = paint;
  paint();

  // pull server copy so custom domain / vercel.app stay in sync
  void syncProfileFromServer(opts.playerId).then((p) => {
    if (!document.getElementById("sf-profile-dlg")) return;
    // only overwrite fields if user hasn't typed yet (still match local open)
    const dirty =
      nameEl.value !== local.displayName ||
      shareEl.value !== local.shareBlurb ||
      bioEl.value !== local.bio;
    if (!dirty) {
      nameEl.value = p.displayName || "";
      shareEl.value = p.shareBlurb || "";
      bioEl.value = p.bio || "";
      paint();
    }
    if (syncEl) {
      syncEl.textContent = p.hasProfile
        ? "サーバーと同期済み"
        : "サーバー未設定 · この端末の下書きがあれば表示中";
      syncEl.style.color = p.hasProfile ? "#6a9" : "#a86";
    }
  });

  dlg.querySelector("#sf-pr-x")!.addEventListener("click", () => {
    dlg.remove();
    opts.sfxUi?.();
  });
  dlg.querySelector("#sf-pr-clear")!.addEventListener("click", () => {
    void saveMyProfile("", "", "").then((r) => {
      if (!r.ok) {
        msg.textContent = "失敗";
        opts.sfxFail?.();
        return;
      }
      nameEl.value = "";
      shareEl.value = "";
      bioEl.value = "";
      paint();
      writeLocalProfile({
        displayName: "",
        bio: "",
        shareBlurb: "",
        hasProfile: false,
      });
      msg.textContent = "クリアしました";
      opts.sfxUi?.();
      opts.onSaved?.(r.profile!);
    });
  });
  dlg.querySelector("#sf-pr-save")!.addEventListener("click", () => {
    void saveMyProfile(nameEl.value, bioEl.value, shareEl.value).then((r) => {
      if (!r.ok) {
        msg.textContent =
          r.reason === "empty"
            ? "表示名を入れてください"
            : r.reason === "link_required"
              ? "連携が必要です"
              : "使えない文字があるか保存できません";
        opts.sfxFail?.();
        return;
      }
      msg.textContent = "サーバーに保存しました";
      if (syncEl) {
        syncEl.textContent = "サーバーと同期済み";
        syncEl.style.color = "#6a9";
      }
      opts.sfxOk?.();
      opts.onSaved?.(r.profile!);
      setTimeout(() => dlg.remove(), 400);
    });
  });
}

export function openStatsDialog(opts: {
  playerId: string;
  linked?: boolean;
  sfxUi?: () => void;
}) {
  if (document.getElementById("sf-stats-dlg")) return;
  opts.sfxUi?.();
  const lines = buildStatusLines(opts.playerId);
  const st = readStats();
  const dlg = document.createElement("div");
  dlg.id = "sf-stats-dlg";
  dlg.style.cssText =
    "position:fixed;inset:0;z-index:9990;display:flex;align-items:center;justify-content:center;background:rgba(0,8,6,.8);padding:12px;font-family:system-ui,sans-serif";
  dlg.innerHTML = `
    <div style="width:min(360px,96vw);max-height:90vh;overflow:auto;background:#061018;border:2px solid #44ffcc;border-radius:12px;padding:14px;color:#dff">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-size:14px;font-weight:700;color:#8ff">ゲーム情報</div>
        <button type="button" id="sf-st-x" style="border:0;background:transparent;color:#9ab;font-size:18px;cursor:pointer">×</button>
      </div>
      <div style="font-size:10px;color:#6a9;margin-bottom:8px">総プレイ ${formatPlayTime(st.playTimeSec)} · 自動記録</div>
      <div style="background:#031018;border:1px solid #245;border-radius:8px;padding:10px;font-size:12px;line-height:1.65;font-family:ui-monospace,monospace;color:#cfe">
        ${lines.map((l) => esc(l)).join("<br/>")}
      </div>
      <div style="font-size:10px;color:#567;margin-top:10px;line-height:1.4">v1.8.0 · 広告視聴 / 広告主ポータル / プリペイドクレジット</div>
    </div>`;
  document.body.appendChild(dlg);
  dlg.addEventListener("pointerdown", (e) => e.stopPropagation());
  dlg.querySelector("#sf-st-x")!.addEventListener("click", () => dlg.remove());
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) dlg.remove();
  });
}

export async function loadSharerProfile(playerId: string): Promise<PlayerProfile> {
  return fetchPublicProfile(playerId);
}

/** Read-only public profile (share mission host, etc.) */
export function openViewProfileDialog(opts: {
  ownerId: string;
  /** optional preloaded */
  profile?: PlayerProfile | null;
  viewerId: string;
  linked: boolean;
  onNeedLink?: () => void;
  sfxUi?: () => void;
  sfxFail?: () => void;
}) {
  if (document.getElementById("sf-view-profile-dlg")) return;
  opts.sfxUi?.();
  const dlg = document.createElement("div");
  dlg.id = "sf-view-profile-dlg";
  dlg.style.cssText =
    "position:fixed;inset:0;z-index:9990;display:flex;align-items:center;justify-content:center;background:rgba(0,8,6,.82);padding:12px;font-family:system-ui,sans-serif";
  dlg.innerHTML = `
    <div style="width:min(360px,96vw);max-height:92vh;overflow:auto;background:#061018;border:2px solid #66ccff;border-radius:12px;padding:14px;color:#dff">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-size:14px;font-weight:700;color:#8ef">依頼主プロフィール</div>
        <button type="button" id="sf-vp-x" style="border:0;background:transparent;color:#9ab;font-size:18px;cursor:pointer">×</button>
      </div>
      <div id="sf-vp-body" style="font-size:12px;color:#9ab">読み込み中…</div>
    </div>`;
  document.body.appendChild(dlg);
  dlg.addEventListener("pointerdown", (e) => e.stopPropagation());
  const close = () => {
    dlg.remove();
    opts.sfxUi?.();
  };
  dlg.querySelector("#sf-vp-x")!.addEventListener("click", close);
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) close();
  });

  const paint = (p: PlayerProfile) => {
    const body = dlg.querySelector("#sf-vp-body") as HTMLElement;
    if (!body) return;
    if (!p.hasProfile) {
      body.innerHTML = `
        <div style="font-size:11px;color:#89a;margin-bottom:8px">ID ${esc(opts.ownerId)}</div>
        <div style="padding:16px;text-align:center;color:#789;background:#031018;border-radius:8px;border:1px solid #234">
          プロフィール未設定です
        </div>`;
      return;
    }
    body.innerHTML = `
      <div style="font-size:10px;color:#678;margin-bottom:4px">ID ${esc(opts.ownerId)}</div>
      <div style="font-size:18px;font-weight:800;color:#eff;margin-bottom:6px">${esc(p.displayName || "—")}</div>
      ${
        p.shareBlurb
          ? `<div style="font-size:11px;color:#fc8;background:#1a1408;border:1px solid #653;border-radius:8px;padding:8px;margin-bottom:10px">「${esc(p.shareBlurb)}」</div>`
          : ""
      }
      <div style="font-size:11px;color:#8ab;margin-bottom:4px">自己紹介</div>
      <div id="sf-vp-bio" style="min-height:60px;background:#031018;border:1px solid #245;border-radius:8px;padding:10px;font-size:12px;line-height:1.55;color:#cde;white-space:pre-wrap"></div>
      <div style="font-size:10px;color:#567;margin-top:10px">URLは2段クッション経由 · 連携後に開封</div>`;
    const bioHost = body.querySelector("#sf-vp-bio") as HTMLElement;
    if (bioHost) {
      if (p.bio) {
        fillLinkedBio(
          bioHost,
          p.bio,
          opts.ownerId,
          "依頼主プロフの自己紹介URL",
          opts.viewerId,
          opts.linked,
          opts.onNeedLink,
        );
      } else {
        bioHost.textContent = "（未記入）";
        bioHost.style.color = "#567";
      }
    }
  };

  if (opts.profile && opts.profile.hasProfile) {
    paint(opts.profile);
  } else {
    void fetchPublicProfile(opts.ownerId).then((p) => {
      if (!document.getElementById("sf-view-profile-dlg")) return;
      paint(p);
    }).catch(() => {
      const body = dlg.querySelector("#sf-vp-body") as HTMLElement;
      if (body) body.textContent = "読み込みに失敗しました";
      opts.sfxFail?.();
    });
  }
}

export function shareProfilePayload(): {
  displayName?: string;
  bio?: string;
  shareBlurb?: string;
} | undefined {
  const p = readLocalProfile();
  if (!p.hasProfile) return undefined;
  return {
    displayName: p.displayName,
    bio: p.bio,
    shareBlurb: p.shareBlurb,
  };
}

