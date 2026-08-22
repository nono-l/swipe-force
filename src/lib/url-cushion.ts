/**
 * JPDOC: 外部URLの2段クッション。開くこと自体は未連携可。評価だけ連携必須。
 */
/** Shared 2-step outbound-link cushion (sound-test / profile / banners). */

import {
  URL_REPORT_LABELS,
  fetchUrlReports,
  postUrlReport,
  markUrlVisited,
  hasLocalUrlVisit,
  type UrlReportSummary,
  type UrlReportId,
} from "@/lib/sound-comments";
import { translate } from "@/lib/i18n";

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

export function isExternalHttpUrl(raw: string): boolean {
  const s = String(raw || "").trim();
  if (!s) return false;
  try {
    const u = new URL(
      s,
      typeof location !== "undefined" ? location.href : "https://local.invalid",
    );
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    if (typeof location === "undefined") return true;
    const here = location.hostname.replace(/^www\./i, "").toLowerCase();
    const there = u.hostname.replace(/^www\./i, "").toLowerCase();
    return !!there && there !== here;
  } catch {
    return false;
  }
}

export function bannerUrlTrackKey(id?: string): string {
  const raw = String(id || "")
    .replace(/[^a-z0-9_-]/gi, "")
    .slice(0, 28);
  if (raw.length >= 4) return `bnr:${raw}`.slice(0, 32);
  return "bnr:pool";
}

export type UrlCushionOpts = {
  trackKey: string;
  url: string;
  contextLabel: string;
  playerId: string;
  linked: boolean;
  reportState?: Record<string, UrlReportSummary>;
  onNeedLink?: () => void;
  /** false = 未連携でも外部サイトを開ける（評価は連携必須） */
  requireLinkToOpen?: boolean;
  /** fired after the destination actually opens */
  onOpened?: () => void;
};

export function openUrlCushion(opts: UrlCushionOpts): void {
  const { trackKey, url, contextLabel, playerId, linked } = opts;
  const reportState: Record<string, UrlReportSummary> = opts.reportState || {};
  let host = "link";
  try {
    host = new URL(url).hostname;
  } catch {
    /* */
  }
  let onStep1 = true;
  const layer = document.createElement("div");
  layer.style.cssText =
    "position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;padding:12px;font-family:system-ui,sans-serif";
  const card = document.createElement("div");
  card.style.cssText =
    "width:min(360px,94vw);background:#0a1418;border:2px solid #6cf;border-radius:14px;padding:16px;color:#eef;box-shadow:0 16px 48px #000a";
  layer.appendChild(card);
  document.body.appendChild(layer);
  const close = () => layer.remove();

  const step1 = () => {
    onStep1 = true;
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
      <div style="font-size:10px;margin-bottom:10px;color:${visited ? "#cfc" : "#fc8"}">${visited ? "✓ 開封済み · 評価できます" : "未開封 · 飛んだ人だけ評価可"}</div>
      <div id="sf-cu-chips" style="display:flex;flex-wrap:wrap;gap:6px;min-height:28px;margin-bottom:10px;padding:8px;background:#061018;border-radius:8px;border:1px solid #234"></div>
      <div style="font-size:11px;font-weight:700;color:#9bc;margin-bottom:6px">定型評価</div>
      <div id="sf-cu-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px"></div>
      ${visited ? "" : `<div style="font-size:10px;color:#a86;margin-bottom:10px;line-height:1.4;padding:8px;background:#1a1008;border-radius:8px;border:1px solid #643">🔒 2段目のクッションから実際にリンクを開いた人だけが評価できます（スパム防止）</div>`}
      <button type="button" id="sf-cu-go" style="width:100%;padding:12px;border-radius:10px;border:1px solid #4af;background:linear-gradient(180deg,#1a4060,#102838);color:#dff;font-weight:800;margin-bottom:8px;cursor:pointer">② 本当に開く（クッション2）→</button>
      <button type="button" id="sf-cu-x" style="width:100%;padding:10px;border-radius:10px;border:1px solid #456;background:#1a2428;color:#bcd;cursor:pointer">閉じる</button>`;
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
        if (!visited) return;
        if (!linked) {
          opts.onNeedLink?.();
          return;
        }
        void (async () => {
          await markUrlVisited(trackKey, url, playerId);
          const r = await postUrlReport(
            trackKey,
            url,
            playerId,
            meta.id as UrlReportId,
          );
          if (r.ok) {
            reportState[url] = r;
            step1();
          }
        })();
      };
      grid.appendChild(b);
    }
    card.querySelector("#sf-cu-go")!.addEventListener("click", () => step2());
    card.querySelector("#sf-cu-x")!.addEventListener("click", close);
  };

  const step2 = () => {
    onStep1 = false;
    card.innerHTML = `<div style="font-size:13px;font-weight:800;color:#fc8;margin-bottom:8px">② クッション · 外部サイトへ</div>
      <div style="font-size:11px;line-height:1.5;color:#cba;background:#1a1208;border:1px solid #864;border-radius:8px;padding:10px;margin-bottom:10px">${translate("cushion.warn")}${opts.requireLinkToOpen === false ? `<br/>${translate("cushion.guest")}` : ""}</div>
      <div style="font-size:11px;word-break:break-all;color:#8cf;background:#061018;border-radius:8px;padding:10px;margin-bottom:12px;border:1px solid #246">${esc(url)}</div>
      <button type="button" id="sf-cu-open" style="width:100%;padding:14px;border-radius:10px;border:1px solid #4f8;background:linear-gradient(180deg,#1a6040,#0e3020);color:#fff;font-weight:800;margin-bottom:8px;cursor:pointer">サイトを開く</button>
      <button type="button" id="sf-cu-back" style="width:100%;padding:10px;border-radius:10px;border:1px solid #456;background:#1a2428;color:#bcd;cursor:pointer">← 評価画面に戻る</button>`;
    card.querySelector("#sf-cu-open")!.addEventListener("click", () => {
      void (async () => {
        const mustLink = opts.requireLinkToOpen !== false;
        if (!linked && mustLink) {
          opts.onNeedLink?.();
          return;
        }
        const ok = await markUrlVisited(trackKey, url, playerId, {
          allowGuest: !mustLink,
        });
        if (!ok && mustLink) return;
        reportState[url] = {
          ...(reportState[url] || {
            counts: Object.fromEntries(URL_REPORT_LABELS.map((x) => [x.id, 0])),
            mine: null,
          }),
          visited: true,
        };
        window.open(url, "_blank", "noopener,noreferrer");
        try {
          opts.onOpened?.();
        } catch {
          /* */
        }
        step1();
      })();
    });
    card.querySelector("#sf-cu-back")!.addEventListener("click", step1);
  };

  step1();
  if (playerId) {
    void fetchUrlReports(trackKey, [url], playerId).then((r) => {
      Object.assign(reportState, r);
      if (onStep1 && layer.isConnected) step1();
    });
  }
  layer.addEventListener("click", (ev) => {
    if (ev.target === layer) close();
  });
}
