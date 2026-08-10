/** DOM dialogs for profile + player status (link perks / meta UI). */

import {
  readLocalProfile,
  writeLocalProfile,
  saveMyProfile,
  fetchPublicProfile,
  type PlayerProfile,
} from "@/lib/account";
import {
  segmentTextWithUrls,
  profileUrlTrackKey,
} from "@/lib/sanitize-message";
import {
  URL_REPORT_LABELS,
  fetchUrlReports,
  postUrlReport,
  markUrlVisited,
  hasLocalUrlVisit,
  type UrlReportSummary,
  type UrlReportId,
} from "@/lib/sound-comments";
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

function openUrlCushion(opts: {
  trackKey: string;
  url: string;
  contextLabel: string;
  reportState: Record<string, UrlReportSummary>;
  playerId: string;
  linked: boolean;
  onNeedLink?: () => void;
}) {
  const { trackKey, url, contextLabel, reportState, playerId, linked } = opts;
  let host = "link";
  try {
    host = new URL(url).hostname;
  } catch {
    /* */
  }
  const layer = document.createElement("div");
  layer.style.cssText =
    "position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;padding:12px;font-family:system-ui,sans-serif";
  const card = document.createElement("div");
  card.style.cssText =
    "width:min(360px,94vw);background:#0a1418;border:2px solid #6cf;border-radius:14px;padding:16px;color:#eef";
  layer.appendChild(card);
  document.body.appendChild(layer);
  const close = () => layer.remove();

  const step1 = () => {
    card.innerHTML = "";
    const sum = reportState[url] || {
      counts: Object.fromEntries(URL_REPORT_LABELS.map((x) => [x.id, 0])),
      mine: null,
      visited: hasLocalUrlVisit(trackKey, url),
    };
    const visited = !!(sum.visited || hasLocalUrlVisit(trackKey, url));
    card.innerHTML = `<div style="font-size:13px;font-weight:800;color:#8ef;margin-bottom:4px">① クッション · 評価</div>
      <div style="font-size:10px;color:#fc8;background:#1a1208;border:1px solid #643;border-radius:6px;padding:6px;margin-bottom:8px">${esc(contextLabel)}</div>
      <div style="font-size:11px;color:#8ab;margin-bottom:8px;word-break:break-all">リンク先: ${esc(host)}</div>
      <div style="font-size:10px;margin-bottom:10px;color:${visited ? "#cfc" : "#fc8"}">${visited ? "✓ 開封済み" : "未開封 · 飛んだ人だけ評価可"}</div>
      <div id="sf-cu-chips" style="display:flex;flex-wrap:wrap;gap:6px;min-height:28px;margin-bottom:10px;padding:8px;background:#061018;border-radius:8px"></div>
      <div style="font-size:11px;font-weight:700;color:#9bc;margin-bottom:6px">定型評価</div>
      <div id="sf-cu-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px"></div>
      <button type="button" id="sf-cu-go" style="width:100%;padding:12px;border-radius:10px;border:1px solid #4af;background:#1a4060;color:#dff;font-weight:800;margin-bottom:8px">② 本当に開く →</button>
      <button type="button" id="sf-cu-x" style="width:100%;padding:10px;border-radius:10px;border:1px solid #456;background:#1a2428;color:#bcd">閉じる</button>`;
    const chips = card.querySelector("#sf-cu-chips")!;
    let any = false;
    for (const meta of URL_REPORT_LABELS) {
      const n = sum.counts[meta.id] || 0;
      if (!n) continue;
      any = true;
      const sp = document.createElement("span");
      sp.textContent = `${meta.emoji} ${meta.label} ${n}`;
      sp.style.cssText =
        "padding:4px 8px;border-radius:999px;font-size:11px;border:1px solid #456;background:#0a1512";
      chips.appendChild(sp);
    }
    if (!any) {
      chips.textContent = "まだ評価がありません";
      (chips as HTMLElement).style.color = "#678";
      (chips as HTMLElement).style.fontSize = "11px";
    }
    const grid = card.querySelector("#sf-cu-grid")!;
    for (const meta of URL_REPORT_LABELS) {
      const b = document.createElement("button");
      b.type = "button";
      b.disabled = !visited;
      b.textContent = `${meta.emoji} ${meta.label}`;
      b.style.cssText = `padding:10px;border-radius:8px;border:1px solid ${sum.mine === meta.id ? "#8f8" : "#456"};background:${visited ? "#122" : "#111"};color:${visited ? "#eef" : "#666"};cursor:${visited ? "pointer" : "not-allowed"};opacity:${visited ? 1 : 0.55}`;
      b.onclick = () => {
        if (!visited || !linked) {
          opts.onNeedLink?.();
          return;
        }
        void postUrlReport(trackKey, url, playerId, meta.id as UrlReportId).then(
          (r) => {
            if (r.ok) {
              reportState[url] = r;
              step1();
            }
          },
        );
      };
      grid.appendChild(b);
    }
    card.querySelector("#sf-cu-go")!.addEventListener("click", () => step2());
    card.querySelector("#sf-cu-x")!.addEventListener("click", close);
  };

  const step2 = () => {
    card.innerHTML = `<div style="font-size:13px;font-weight:800;color:#fc8;margin-bottom:8px">② 外部サイトへ</div>
      <div style="font-size:11px;color:#cba;background:#1a1208;border:1px solid #864;border-radius:8px;padding:10px;margin-bottom:10px">外部サイトです。安全は保証されません。</div>
      <div style="font-size:11px;word-break:break-all;color:#8cf;background:#061018;border-radius:8px;padding:10px;margin-bottom:12px">${esc(url)}</div>
      <button type="button" id="sf-cu-open" style="width:100%;padding:14px;border-radius:10px;border:1px solid #4f8;background:#1a6040;color:#fff;font-weight:800;margin-bottom:8px">サイトを開く</button>
      <button type="button" id="sf-cu-back" style="width:100%;padding:10px;border-radius:10px;border:1px solid #456;background:#1a2428;color:#bcd">← 戻る</button>`;
    card.querySelector("#sf-cu-open")!.addEventListener("click", () => {
      void (async () => {
        if (!linked) {
          opts.onNeedLink?.();
          return;
        }
        const ok = await markUrlVisited(trackKey, url, playerId);
        if (!ok) return;
        reportState[url] = {
          ...(reportState[url] || {
            counts: Object.fromEntries(URL_REPORT_LABELS.map((x) => [x.id, 0])),
            mine: null,
          }),
          visited: true,
        };
        window.open(url, "_blank", "noopener,noreferrer");
        step1();
      })();
    });
    card.querySelector("#sf-cu-back")!.addEventListener("click", step1);
  };

  step1();
  layer.addEventListener("click", (ev) => {
    if (ev.target === layer) close();
  });
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
  const my = readLocalProfile();
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
      <div style="font-size:11px;color:#6a9;line-height:1.4;margin-bottom:10px">連携特典。助けに来た相手に表示。シェア文は別テンプレです。</div>
      <label style="font-size:11px;color:#9ab">表示名（必須 · 16）</label>
      <input id="sf-pr-name" maxlength="16" value="${esc(my.displayName)}" placeholder="パイロット名"
        style="width:100%;box-sizing:border-box;margin:4px 0 10px;padding:9px;border-radius:8px;border:1px solid #2a6;background:#001a10;color:#efe;font-size:14px" />
      <label style="font-size:11px;color:#9ab">シェア文テンプレ（任意 · 40）</label>
      <div style="font-size:10px;color:#678;margin:2px 0 4px">Xシェア本文に載る短い一文</div>
      <input id="sf-pr-share" maxlength="40" value="${esc(my.shareBlurb)}" placeholder="例: 4面ボス詰み助けて"
        style="width:100%;box-sizing:border-box;margin:0 0 4px;padding:9px;border-radius:8px;border:1px solid #2a6;background:#001a10;color:#efe" />
      <div id="sf-pr-sc" style="font-size:10px;color:#678;text-align:right;margin-bottom:10px">0 / 40</div>
      <label style="font-size:11px;color:#9ab">自己紹介（任意 · 5000）</label>
      <div style="font-size:10px;color:#678;margin:2px 0 4px">https URLは自動リンク · # & = クエリOK · クッション経由</div>
      <textarea id="sf-pr-bio" maxlength="5000" rows="6" placeholder="例: 関東勢です&#10;https://x.com/you?s=20&t=abc#hi"
        style="width:100%;box-sizing:border-box;margin:4px 0 6px;padding:9px;border-radius:8px;border:1px solid #2a6;background:#001a10;color:#efe;resize:vertical;min-height:90px">${esc(my.bio)}</textarea>
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
  const paint = () => {
    sc.textContent = `${[...shareEl.value].length} / 40`;
    bc.textContent = `${[...bioEl.value].length} / 5000`;
  };
  shareEl.oninput = paint;
  bioEl.oninput = paint;
  paint();
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
      msg.textContent = "保存しました";
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
      <div style="font-size:10px;color:#567;margin-top:10px;line-height:1.4">v1.5.0 · プロフ / シェア文 / 自己紹介URL / 統計画面</div>
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
