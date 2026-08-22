/**
 * JPDOC: バナーの表示履歴と、外部へ飛んだクリック履歴。
 */
/**
 * Partner banner display / click history popup.
 */

import {
  fetchBannerHistory,
  type BannerHistoryRow,
} from "@/lib/partner-banner-api";
import { translate } from "@/lib/i18n";

export type BannerHistoryOpts = {
  playerId: string;
  bannerId?: string;
  all?: boolean;
  sfxUi?: () => void;
};

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&" + "amp;")
    .replace(/</g, "&" + "lt;")
    .replace(/>/g, "&" + "gt;")
    .replace(/"/g, "&" + "quot;");
}

function formatJstStamp(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso.slice(0, 16) || "—";
  const d = new Date(t + 9 * 3600 * 1000);
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${mo}/${day} ${hh}:${mm}`;
}

function viewerLabel(r: BannerHistoryRow): string {
  const name = (r.displayName || "").trim();
  if (name) return name;
  const id = r.viewerPlayerId || "";
  return id ? `${id.slice(0, 8)}…` : "不明";
}

function el(tag: string, style?: string, text?: string): HTMLElement {
  const n = document.createElement(tag);
  if (style) n.style.cssText = style;
  if (text != null) n.textContent = text;
  return n;
}

export function openBannerHistoryDialog(opts: BannerHistoryOpts): void {
  document.getElementById("sf-bn-hist-root")?.remove();

  const root = el(
    "div",
    "position:fixed;inset:0;z-index:100020;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;padding:12px;font-family:system-ui,sans-serif",
  );
  root.id = "sf-bn-hist-root";
  const card = el(
    "div",
    "width:min(440px,96vw);max-height:92vh;overflow:auto;background:#061018;border:1px solid #3a6;border-radius:12px;padding:14px 14px 12px;color:#def;box-shadow:0 12px 40px #000a",
  );
  root.appendChild(card);
  document.body.appendChild(root);

  let tab: "impress" | "click" = "impress";
  let loading = true;
  let impress: BannerHistoryRow[] = [];
  let clicks: BannerHistoryRow[] = [];
  let summary = { impress: 0, clicks: 0, viewers: 0 };
  let err = "";

  const close = () => {
    opts.sfxUi?.();
    root.remove();
  };

  const paintList = (rows: BannerHistoryRow[], empty: string) => {
    if (!rows.length) {
      return `<div style="padding:18px 8px;text-align:center;color:#678;font-size:12px;border:1px dashed #345;border-radius:8px">${esc(empty)}</div>`;
    }
    return rows
      .map((r) => {
        const thumb = r.url
          ? `<div style="width:72px;height:28px;flex-shrink:0;border-radius:4px;background:#000 center/cover no-repeat;background-image:url('${esc(r.url).replace(/'/g, "")}');border:1px solid #345"></div>`
          : `<div style="width:72px;height:28px;flex-shrink:0;border-radius:4px;background:#123;border:1px solid #345"></div>`;
        const extra =
          r.kind === "click" && r.href
            ? `<div style="font-size:10px;color:#8cf;word-break:break-all;margin-top:3px">${esc(r.href)}</div>`
            : "";
        return `<div style="display:flex;gap:8px;padding:8px;border:1px solid #234;border-radius:8px;background:#0a1520">
          ${thumb}
          <div style="min-width:0;flex:1">
            <div style="display:flex;justify-content:space-between;gap:8px">
              <div style="font-size:12px;font-weight:800;color:#cfe">${esc(viewerLabel(r))}</div>
              <div style="font-size:10px;color:#8ab;font-variant-numeric:tabular-nums">${esc(formatJstStamp(r.createdAt))}</div>
            </div>
            <div style="font-size:10px;color:#678;margin-top:2px">${esc(r.viewerPlayerId || "—")}${r.chargedSec ? ` · ${r.chargedSec}秒` : ""}</div>
            ${extra}
          </div>
        </div>`;
      })
      .join("");
  };

  const paint = () => {
    const rows = tab === "impress" ? impress : clicks;
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px">
        <div>
          <div style="font-size:14px;font-weight:800;color:#9ef">${translate("bannerHist.title")}</div>
          <div style="font-size:10px;color:#8ab;margin-top:2px">${translate("bannerHist.summary", {
            i: summary.impress,
            c: summary.clicks,
            v: summary.viewers,
            scope: opts.bannerId ? translate("bannerHist.thisOne") : opts.all ? translate("bannerHist.all") : "",
          })}</div>
        </div>
        <button type="button" id="sf-bh-x" style="padding:6px 10px;border-radius:8px;border:1px solid #456;background:#122028;color:#cde;cursor:pointer;font-size:12px">${translate("bannerHist.close")}</button>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:10px">
        <button type="button" id="sf-bh-tab-im" style="flex:1;padding:8px;border-radius:8px;border:1px solid ${tab === "impress" ? "#4a8" : "#345"};background:${tab === "impress" ? "#0f2a18" : "#0a1520"};color:${tab === "impress" ? "#cfc" : "#9ab"};font-weight:800;font-size:12px;cursor:pointer">${translate("bannerHist.impress")} ${summary.impress}</button>
        <button type="button" id="sf-bh-tab-ck" style="flex:1;padding:8px;border-radius:8px;border:1px solid ${tab === "click" ? "#4a8" : "#345"};background:${tab === "click" ? "#0f2a18" : "#0a1520"};color:${tab === "click" ? "#cfc" : "#9ab"};font-weight:800;font-size:12px;cursor:pointer">${translate("bannerHist.clicks")} ${summary.clicks}</button>
      </div>
      ${
        loading
          ? `<div style="padding:24px;text-align:center;color:#8ab;font-size:12px">${translate("common.loading")}</div>`
          : err
            ? `<div style="padding:16px;color:#fc8;font-size:12px">${esc(err)}</div>`
            : `<div style="display:flex;flex-direction:column;gap:6px;max-height:min(62vh,480px);overflow:auto">${paintList(
                rows,
                tab === "impress" ? translate("bannerHist.emptyI") : translate("bannerHist.emptyC"),
              )}</div>`
      }
    `;
    card.querySelector("#sf-bh-x")?.addEventListener("click", close);
    card.querySelector("#sf-bh-tab-im")?.addEventListener("click", () => {
      opts.sfxUi?.();
      tab = "impress";
      paint();
    });
    card.querySelector("#sf-bh-tab-ck")?.addEventListener("click", () => {
      opts.sfxUi?.();
      tab = "click";
      paint();
    });
  };

  root.addEventListener("click", (e) => {
    if (e.target === root) close();
  });

  paint();
  void fetchBannerHistory(opts.playerId, {
    bannerId: opts.bannerId,
    all: opts.all,
  }).then((st) => {
    loading = false;
    if (!st.ok) err = translate("bannerHist.loadFail", { r: st.reason || "?" });
    impress = st.impress;
    clicks = st.clicks;
    summary = st.summary;
    paint();
  });
}
