/**
 * Advertiser portal UI (prepaid redeem + own ad videos).
 * Separate from platform media-admin.
 */

import { partnerPortalUrl, openPartnerPortal } from "@/lib/partner-portal-url";
import {
  createPrepaidCode,
  deleteAdvertiserVideo,
  disablePrepaidCode,
  fetchAdvertiserStatus,
  fetchPrepaidAdmin,
  redeemPrepaidCode,
  saveAdvertiserVideo,
  type AdvertiserVideo,
  type PrepaidCode,
} from "@/lib/partner-api";
import { parseYouTubeVideoId } from "@/components/game/engine/modes/media-watch";
import {
  fetchYouTubeDurationSec,
  fetchYouTubeTitle,
} from "@/lib/youtube-duration";
import { isPromoAdminPlayer } from "@/components/game/engine/modes/admin";

function isFlagOn(v: unknown): boolean {
  return v === true || v === 1 || v === "1" || v === "true";
}

function paintChannelToggle(root: ParentNode, prefix: string, on: boolean) {
  const hid = root.querySelector(`#${prefix}`) as HTMLInputElement | null;
  if (hid) hid.value = on ? "1" : "0";
  const off = root.querySelector(`#${prefix}-off`) as HTMLButtonElement | null;
  const onBtn = root.querySelector(`#${prefix}-on`) as HTMLButtonElement | null;
  if (off) {
    off.style.background = on ? "#152018" : "#3a2020";
    off.style.borderColor = on ? "#345" : "#a66";
    off.style.color = on ? "#89a" : "#fcc";
    off.style.fontWeight = on ? "600" : "800";
  }
  if (onBtn) {
    onBtn.style.background = on ? "#1a4030" : "#152018";
    onBtn.style.borderColor = on ? "#6a4" : "#345";
    onBtn.style.color = on ? "#cfc" : "#89a";
    onBtn.style.fontWeight = on ? "800" : "600";
  }
}

function channelToggleHtml(prefix: string, on: boolean): string {
  return `
    <div style="grid-column:1/-1;background:#0a1520;border:1px solid #345;border-radius:10px;padding:10px">
      <div style="font-size:12px;font-weight:800;color:#cfe">CLEAR画面のチャンネルリンク</div>
      <div style="font-size:10px;color:#8ab;margin:4px 0 8px;line-height:1.4">全段階クリア後に YouTube チャンネルへ飛ばすボタン。<b style="color:#fc8">初期値は出さない</b></div>
      <div style="display:flex;gap:8px">
        <button type="button" id="${prefix}-off" style="flex:1;padding:12px 8px;border-radius:8px;border:2px solid ${on ? "#345" : "#a66"};background:${on ? "#152018" : "#3a2020"};color:${on ? "#89a" : "#fcc"};font-weight:${on ? 600 : 800};cursor:pointer">出さない</button>
        <button type="button" id="${prefix}-on" style="flex:1;padding:12px 8px;border-radius:8px;border:2px solid ${on ? "#6a4" : "#345"};background:${on ? "#1a4030" : "#152018"};color:${on ? "#cfc" : "#89a"};font-weight:${on ? 800 : 600};cursor:pointer">出す</button>
      </div>
      <input type="hidden" id="${prefix}" value="${on ? "1" : "0"}" />
      <div style="font-size:10px;margin-top:8px;color:${on ? "#9e8" : "#889"}">いま: ${on ? "出す（CLEARにボタン表示）" : "出さない"}</div>
    </div>`;
}
import {
  fetchPartnerBannerStatus,
  getScreenBottomBlackPx,
  prepareBannerUpload,
  savePartnerBannerHref,
  setPartnerBannerActive,
  uploadPartnerBanner,
  clearPartnerBanner,
  type PartnerBanner,
} from "@/lib/partner-banner-api";
import { openBannerEditor } from "@/lib/banner-editor-ui";
import { openBannerHistoryDialog } from "@/lib/banner-history-ui";
import { confirmBannerDelete } from "@/lib/banner-delete-ui";
import { onLocaleChange, translate } from "@/lib/i18n";

/** Support desk (Discord) for advertisers */
export const PARTNER_SUPPORT_URL = "https://discord.gg/hfDykSD2JJ";

export type PartnerPortalDialogOpts = {
  playerId?: string | null;
  sfxUi?: () => void;
  sfxOk?: () => void;
  sfxFail?: () => void;
};

async function copyText(text: string): Promise<boolean> {
  const s = String(text || "").trim();
  if (!s) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(s);
      return true;
    }
  } catch {
    /* */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = s;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, s.length);
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&" + "amp;")
    .replace(/</g, "&" + "lt;")
    .replace(/>/g, "&" + "gt;")
    .replace(/"/g, "&" + "quot;");
}

function formatHours(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  if (s < 60) return `${s}秒`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}分${s % 60 ? `${s % 60}秒` : ""}`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h}時間${rm}分` : `${h}時間`;
}

function inputStyle(extra = "") {
  return `width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid #456;background:#0a1520;color:#eef;font-size:13px;${extra}`;
}

function btnStyle(
  kind: "primary" | "danger" | "ghost" | "tab" | "tabOn" = "ghost",
) {
  const map = {
    primary:
      "border:1px solid #6af;background:#1a4060;color:#dff;font-weight:700",
    danger: "border:1px solid #a44;background:#301018;color:#fcc",
    ghost: "border:1px solid #456;background:#122028;color:#bcd",
    tab: "border:1px solid #345;background:#0a1520;color:#8ab;flex:1",
    tabOn:
      "border:1px solid #8cf;background:#102838;color:#def;flex:1;font-weight:700",
  };
  return `padding:8px 10px;border-radius:8px;cursor:pointer;font-size:12px;${map[kind]}`;
}

export function openPartnerPortalDialog(opts: PartnerPortalDialogOpts): void {
  // re-open if stuck / re-tap
  try { document.getElementById("sf-partner-root")?.remove(); } catch { /* */ }
  const playerId = String(opts.playerId || "").trim();
  if (!playerId) {
    console.warn("[partner] missing playerId");
    return;
  }

  const isAdmin = isPromoAdminPlayer(playerId);
  const root = document.createElement("div");
  root.id = "sf-partner-root";
  root.style.cssText =
    "position:fixed;inset:0;z-index:99996;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:12px;font-family:system-ui,sans-serif";
  const card = document.createElement("div");
  card.style.cssText =
    "width:min(440px,100%);max-height:min(92vh,720px);overflow:auto;background:#0c141c;border:1px solid #3a6a8a;border-radius:14px;padding:14px 14px 16px;box-shadow:0 12px 40px #000a;color:#def";
  root.appendChild(card);
  document.body.appendChild(root);
  root.addEventListener("pointerdown", (e) => e.stopPropagation());

  let tab: "mine" | "all" | "redeem" | "issue" | "banner" = "mine";
  let flash = "";
  let busy = false;
  let creditHours = 0;
  let creditSec = 0;
  let totalCredited = 0;
  let assignedHours = 0;
  let freeHours = 0;
  let videos: AdvertiserVideo[] = [];
  let allVideos: AdvertiserVideo[] = [];
  let codes: PrepaidCode[] = [];
  let editId = "";
  let formShowCh = false;
  let bannerStatus: {
    weekLimit: number;
    weekUsed: number;
    weekRemaining: number;
    maxBytes: number;
    minRatio: number;
    maxRatio: number;
    maxOwned: number;
    banners: PartnerBanner[];
    banner: PartnerBanner | null;
  } = {
    weekLimit: 8,
    weekUsed: 0,
    weekRemaining: 8,
    maxBytes: 200 * 1024,
    minRatio: 1.5,
    maxRatio: 5,
    maxOwned: 200,
    banners: [],
    banner: null,
  };

  const close = () => {
    offLocale();
    root.remove();
  };

  const reload = async () => {
    const st = await fetchAdvertiserStatus(playerId, { all: isAdmin });
    creditHours = st.balance.creditHours;
    creditSec =
      Number(st.balance.creditSec) || Math.floor(creditHours * 3600);
    totalCredited = st.balance.totalCredited;
    assignedHours = st.assignedHours;
    freeHours = st.freeHours;
    videos = (st.videos || []).map((v) => ({
      ...v,
      showChannel: isFlagOn(v.showChannel),
      claimOnce: isFlagOn(v.claimOnce),
    }));
    allVideos = (st.allVideos || []).map((v) => ({
      ...v,
      showChannel: isFlagOn(v.showChannel),
      claimOnce: isFlagOn(v.claimOnce),
    }));
    if (isAdmin && tab === "issue") {
      const r = await fetchPrepaidAdmin(playerId);
      codes = r.codes;
    }
    if (tab === "banner" || true) {
      const b = await fetchPartnerBannerStatus(playerId);
      if (b.ok) {
        bannerStatus = {
          weekLimit: b.weekLimit,
          weekUsed: b.weekUsed,
          weekRemaining: b.weekRemaining,
          maxBytes: b.maxBytes,
          minRatio: b.minRatio,
          maxRatio: b.maxRatio,
          maxOwned: b.maxOwned || 16,
          banners: b.banners || [],
          banner: b.banner,
        };
      }
    }
  };

  const paint = () => {
    const editing = videos.find((v) => v.id === editId) || null;

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div>
          <div style="font-size:15px;font-weight:800;color:#9ef">${translate("partner.title")}</div>
          <div style="font-size:10px;color:#8ab;margin-top:2px">${translate("partner.lead")}</div>
          <div style="font-size:9px;color:#6a8;margin-top:4px;word-break:break-all">${translate("partner.directUrl")}:
            <a href="${partnerPortalUrl()}" target="_blank" rel="noopener" style="color:#8cf;text-decoration:underline">${esc(partnerPortalUrl())}</a>
            <button type="button" id="sf-pt-open-portal" style="margin-left:6px;padding:2px 8px;border-radius:6px;border:1px solid #456;background:#122028;color:#bcd;font-size:9px;cursor:pointer">${translate("common.open")}</button>
          </div>
          <div style="font-size:9px;color:#6a8;margin-top:4px;word-break:break-all">${translate("partner.bannerEdit")}:
            <a href="/banner" target="_blank" rel="noopener" style="color:#8cf;text-decoration:underline">${esc(typeof location !== "undefined" ? location.origin + "/banner" : "/banner")}</a>
          </div>
          <div style="font-size:9px;margin-top:6px;line-height:1.4">
            <span style="color:#8ab">${translate("partner.support")}</span>
            <a href="${PARTNER_SUPPORT_URL}" target="_blank" rel="noopener" style="color:#8cf;text-decoration:underline;margin-left:4px">Discord</a>
            <div style="color:#567;word-break:break-all;user-select:all">${esc(PARTNER_SUPPORT_URL)}</div>
          </div>
        </div>
        <button type="button" id="sf-pt-x" style="border:0;background:transparent;color:#9ab;font-size:22px;cursor:pointer">×</button>
      </div>

      <div style="background:#0a1820;border:1px solid #264;border-radius:10px;padding:10px;margin-bottom:10px;font-size:11px;line-height:1.5">
        ${translate("partner.credit")} <b style="color:#fe8">${creditSec.toLocaleString()} sec</b>
        <span style="color:#9ab">${translate("partner.aboutHours", { h: creditHours.toFixed(2) })}</span>
        · ${translate("partner.assigned", { h: assignedHours.toFixed(1) })} · ${translate("partner.free", { h: freeHours.toFixed(1) })}
        <div style="font-size:9px;color:#678;margin-top:2px">${translate("partner.creditHint", { h: totalCredited.toFixed(1) })}</div>
      </div>

      <div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap">
        <button type="button" id="sf-pt-tab-mine" style="${btnStyle(tab === "mine" ? "tabOn" : "tab")}">${translate("partner.tabMine")}</button>
        <button type="button" id="sf-pt-tab-banner" style="${btnStyle(tab === "banner" ? "tabOn" : "tab")}">${translate("partner.tabBanner")}</button>
        ${isAdmin ? `<button type="button" id="sf-pt-tab-all" style="${btnStyle(tab === "all" ? "tabOn" : "tab")}">${translate("partner.tabAll")}</button>` : ""}
        <button type="button" id="sf-pt-tab-redeem" style="${btnStyle(tab === "redeem" ? "tabOn" : "tab")}">${translate("partner.tabRedeem")}</button>
        ${isAdmin ? `<button type="button" id="sf-pt-tab-issue" style="${btnStyle(tab === "issue" ? "tabOn" : "tab")}">${translate("partner.tabIssue")}</button>` : ""}
      </div>

      <div id="sf-pt-body"></div>
      ${flash ? `<div style="margin-top:10px;font-size:11px;color:#fc8">${esc(flash)}</div>` : ""}
    `;

    const body = card.querySelector("#sf-pt-body")!;

    if (tab === "banner") {
      const list = bannerStatus.banners;
      const kb = Math.round(bannerStatus.maxBytes / 1024);
      const atCap = list.length >= bannerStatus.maxOwned;
      const cards = list.length
        ? list
            .map((item, i) => {
              const bid = esc(item.id || "");
              const safeUrl = esc(item.url).replace(/'/g, "");
              const on = item.active !== false;
              return `<div data-bn="${bid}" style="background:#0a1820;border:1px solid ${on ? "#264" : "#543"};border-radius:10px;padding:10px;margin-bottom:8px;opacity:${on ? "1" : ".72"}">
                <div style="width:100%;height:64px;border-radius:8px;background:#000 center/cover no-repeat;background-image:url('${safeUrl}');border:1px solid #345;margin-bottom:6px;filter:${on ? "none" : "grayscale(.7)"}"></div>
                <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px">
                  <div style="font-size:10px;color:#8ab">#${i + 1} · ${item.width}×${item.height} · ${Math.round((item.bytes || 0) / 1024)}KB · ${on ? translate("partner.lotteryOn") : translate("partner.lotteryOff")}</div>
                  <span style="font-size:9px;font-weight:800;padding:2px 7px;border-radius:999px;border:1px solid ${on ? "#3a6" : "#864"};background:${on ? "#0f2a18" : "#2a1810"};color:${on ? "#cfc" : "#fc8"}">${on ? translate("partner.active") : translate("partner.inactive")}</span>
                </div>
                <label style="font-size:10px;color:#8ab">${translate("partner.href")}</label>
                <input class="sf-bn-href" type="url" inputmode="url" data-id="${bid}" placeholder="https://example.com" value="${esc(item.href || "")}" style="${inputStyle("width:100%;margin-top:4px;word-break:break-all")}" />
                <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">
                  <button type="button" class="sf-bn-href-save" data-id="${bid}" style="${btnStyle("primary")};flex:1;min-width:72px;padding:8px 10px">${translate("common.save")}</button>
                  <button type="button" class="sf-bn-hist" data-id="${bid}" style="${btnStyle("ghost")};flex:1;min-width:72px;padding:8px 10px">${translate("partner.history")}</button>
                  <button type="button" class="sf-bn-toggle" data-id="${bid}" data-on="${on ? "1" : "0"}" style="${on ? btnStyle("danger") : btnStyle("primary")};flex:1;min-width:88px;padding:8px 10px">${on ? translate("partner.disable") : translate("partner.enable")}</button>
                </div>
                <button type="button" class="sf-bn-del" data-id="${bid}" style="width:100%;margin-top:6px;${btnStyle("danger")}">${translate("partner.delThis")}</button>
              </div>`;
            })
            .join("")
        : `<div style="padding:18px;text-align:center;color:#678;font-size:11px;border:1px dashed #345;border-radius:8px;margin-bottom:10px">${translate("partner.noBanners")}</div>`;
      body.innerHTML = `
        <div style="font-size:11px;color:#9bc;margin-bottom:10px;line-height:1.45">
          ${translate("partner.bannerLead1")}<br/>
          ${translate("partner.bannerLead2")}<br/>
          ${translate("partner.bannerSpec", { min: bannerStatus.minRatio, max: bannerStatus.maxRatio, kb })}<br/>
          ${translate("partner.bannerCount", { n: list.length, left: bannerStatus.weekRemaining, limit: bannerStatus.weekLimit })}
        </div>
        <button type="button" id="sf-bn-hist-all" style="width:100%;margin-bottom:10px;${btnStyle("ghost")}">${translate("partner.histAll")}</button>
        ${cards}
        <div style="font-size:11px;font-weight:700;color:#9ef;margin:12px 0 8px">${translate("partner.addNew")}</div>
        <button type="button" id="sf-strip-open" data-action="open-strip-editor" style="width:100%;padding:14px;border-radius:10px;border:1px solid #8cf;background:linear-gradient(180deg,#1a4060,#102838);color:#eff;font-weight:800;font-size:14px;cursor:pointer;margin-bottom:8px;pointer-events:auto;opacity:1" ${atCap || bannerStatus.weekRemaining <= 0 ? "disabled" : ""}>
          ${translate("partner.makeEditor")}
        </button>
        <a id="sf-strip-open-tab" href="/banner" target="_blank" rel="noopener" style="display:block;width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid #456;background:#0a1520;color:#9cf;font-weight:700;font-size:12px;text-align:center;text-decoration:none;margin-bottom:8px">
          ${translate("partner.openTab")}
        </a>
        <div style="font-size:10px;color:#8ab;margin-bottom:10px;text-align:center;line-height:1.4">
          ${translate("partner.deepLink")}:
          <a id="sf-strip-deeplink" href="/banner" target="_blank" rel="noopener" style="color:#8cf;word-break:break-all;text-decoration:underline">${esc(typeof location !== "undefined" ? location.origin + "/banner" : "/banner")}</a>
          <button type="button" id="sf-strip-copy-link" style="margin-left:6px;padding:2px 8px;border-radius:6px;border:1px solid #456;background:#122028;color:#bcd;font-size:9px;cursor:pointer">${translate("common.copy")}</button>
        </div>
        <div style="font-size:10px;color:#8ab;margin-bottom:6px;text-align:center">${translate("partner.orUpload")}</div>
        <input type="file" id="sf-bn-file" accept="image/jpeg,image/png,image/webp" style="width:100%;margin:0 0 10px;font-size:12px;color:#cde" />
        <button type="button" id="sf-bn-up" style="width:100%;${btnStyle("primary")}" ${busy || bannerStatus.weekRemaining <= 0 || atCap ? "disabled" : ""}>
          ${busy ? translate("partner.uploading") : atCap ? translate("partner.atCap", { n: bannerStatus.maxOwned }) : bannerStatus.weekRemaining <= 0 ? translate("partner.weekCap") : translate("partner.upload")}
        </button>
        <div style="font-size:9px;color:#567;margin-top:10px;line-height:1.4;white-space:pre-line">
          ${translate("partner.bannerNote")}
        </div>
      `;
    } else if (tab === "redeem") {
      body.innerHTML = `
        <div style="font-size:11px;color:#9bc;margin-bottom:8px;line-height:1.4">
          ${translate("partner.redeemLead")}
        </div>
        <label style="font-size:10px;color:#8ab">${translate("partner.redeemLabel")}</label>
        <div style="display:flex;gap:6px;margin:4px 0 10px">
          <input id="sf-pt-code" placeholder="ADXXXXXXXX" autocomplete="off" autocapitalize="characters" style="${inputStyle("text-transform:uppercase;flex:1")}" />
          <button type="button" id="sf-pt-paste" style="${btnStyle("ghost")};flex-shrink:0">${translate("partner.paste")}</button>
        </div>
        <button type="button" id="sf-pt-redeem" style="width:100%;${btnStyle("primary")}" ${busy ? "disabled" : ""}>${translate("partner.redeemBtn")}</button>
      `;
    } else if (tab === "all" && isAdmin) {
      body.innerHTML = `
        <div style="font-size:11px;color:#9bc;margin-bottom:8px;line-height:1.4">
          <b style="color:#fe8">管理者</b>は全広告を閲覧できます（編集はマイ広告 or 運営の広告管理）。
        </div>
        <div style="font-size:11px;font-weight:700;color:#fec;margin-bottom:6px">全広告 (${allVideos.length})</div>
        <div id="sf-pv-all-list" style="display:flex;flex-direction:column;gap:8px"></div>
      `;
      const list = body.querySelector("#sf-pv-all-list")!;
      if (!allVideos.length) {
        list.innerHTML = `<div style="font-size:11px;color:#678;padding:10px;text-align:center;border:1px dashed #345;border-radius:8px">登録なし</div>`;
      } else {
        for (const v of allVideos) {
          const owner =
            v.ownerKind === "advertiser" && v.ownerPlayerId
              ? (v.ownerDisplayName || "").trim()
                ? `広告主: ${esc(v.ownerDisplayName || "")}`
                : `広告主: ${esc(v.ownerPlayerId)}`
              : "運営登録";
          const row = document.createElement("div");
          row.style.cssText =
            "background:#0a1520;border:1px solid #234;border-radius:10px;padding:10px";
          row.innerHTML = `
            <div style="font-size:12px;font-weight:800;color:${v.exhausted ? "#a86" : v.active ? "#cfe" : "#889"}">${esc(v.label)} ${v.exhausted ? "· 上限" : v.active ? "" : "· OFF"}</div>
            <div style="font-size:10px;color:#678;word-break:break-all">${esc(v.id)}</div>
            <div style="font-size:10px;color:#fe8;margin-top:4px">${owner}</div>
            <div style="font-size:10px;color:#9ab;margin-top:6px;display:grid;grid-template-columns:1fr 1fr;gap:4px">
              <div>尺 ${v.durationSec}秒</div><div>上限 ${v.maxDisplayHours}h</div>
              <div>再生 ${formatHours(v.totalWatchSec)}</div>
              <div>視聴者 ${v.viewerCount} · 受取 ${v.totalClaims}</div>
              <div style="grid-column:1/-1">受取: ${v.claimOnce ? "一人1回" : "何度でも"} · チャンネル: <b style="color:${isFlagOn(v.showChannel) ? "#9e8" : "#a86"}">${isFlagOn(v.showChannel) ? "出す" : "出さない"}</b></div>
            </div>`;
          list.appendChild(row);
        }
      }
    } else if (tab === "issue" && isAdmin) {
      body.innerHTML = `
        <div style="font-size:11px;color:#9bc;margin-bottom:8px">広告主向けプリペイド発行（管理者）</div>
        <div style="margin-bottom:10px;padding:8px;border:1px solid #345;border-radius:8px;background:#0a1520">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px">
            <div style="font-size:10px;color:#8ab">広告主が開くURL</div>
            <button type="button" id="sf-pp-portal-copy" style="padding:3px 8px;border-radius:6px;border:1px solid #456;background:#122028;color:#bcd;font-size:10px;cursor:pointer">コピー</button>
          </div>
          <a href="${partnerPortalUrl()}" target="_blank" rel="noopener" id="sf-pp-portal" style="display:block;color:#8cf;font-size:11px;font-weight:700;word-break:break-all;padding:4px;border:1px dashed #356;border-radius:6px;background:#041018;text-decoration:none">${esc(partnerPortalUrl())}</a>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div style="grid-column:1/-1"><label style="font-size:10px;color:#8ab">コード（空=自動）</label>
          <input id="sf-pp-code" style="${inputStyle()}" /></div>
          <div style="grid-column:1/-1"><label style="font-size:10px;color:#8ab">ラベル</label>
          <input id="sf-pp-label" style="${inputStyle()}" /></div>
          <div><label style="font-size:10px;color:#8ab">付与時間 h</label>
          <input id="sf-pp-hours" type="number" min="0.1" step="0.1" value="10" style="${inputStyle()}" /></div>
          <div><label style="font-size:10px;color:#8ab">使用上限</label>
          <input id="sf-pp-max" type="number" min="1" value="1" style="${inputStyle()}" /></div>
        </div>
        <button type="button" id="sf-pp-create" style="width:100%;${btnStyle("primary")};margin-bottom:12px" ${busy ? "disabled" : ""}>発行する</button>
        <div style="font-size:11px;font-weight:700;color:#fec;margin-bottom:6px">発行済み (${codes.length})</div>
        <div id="sf-pp-list" style="display:flex;flex-direction:column;gap:6px"></div>
      `;
      const list = body.querySelector("#sf-pp-list")!;
      if (!codes.length) {
        list.innerHTML = `<div style="font-size:10px;color:#678">まだ発行がありません</div>`;
      } else {
        for (const c of codes) {
          const row = document.createElement("div");
          row.style.cssText =
            "background:#0a1520;border:1px solid #234;border-radius:8px;padding:8px;font-size:11px";
          row.innerHTML = `
            <div style="display:flex;justify-content:space-between;gap:6px;align-items:flex-start">
              <div style="min-width:0;flex:1">
                <div style="font-size:10px;color:#8ab;margin-bottom:2px">${esc(c.label)}${c.active ? "" : " · 停止"}</div>
                <code style="display:block;font-size:14px;font-weight:800;letter-spacing:.04em;color:${c.active ? "#9ef" : "#888"};background:#041018;border:1px dashed #356;border-radius:6px;padding:6px 8px;user-select:all;word-break:break-all">${esc(c.code)}</code>
                <div style="font-size:10px;color:#9ab;margin-top:4px">${c.creditHours}h · 使用 ${c.claimCount}/${c.maxClaims}</div>
              </div>
              <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0">
                <button type="button" data-copy="${esc(c.code)}" style="${btnStyle("primary")}">コピー</button>
                ${c.active ? `<button type="button" data-dis="${esc(c.code)}" style="${btnStyle("danger")}">停止</button>` : ""}
              </div>
            </div>`;
          list.appendChild(row);
        }
      }
    } else {
      // mine tab — create / edit form
      const defaultMax = Math.min(
        1,
        Math.max(0.1, freeHours > 0 ? freeHours : 1),
      );
      body.innerHTML = `
        <div style="background:#0a1820;border:1px solid #264;border-radius:10px;padding:10px;margin-bottom:12px">
          <div style="font-size:11px;font-weight:700;color:#9ec;margin-bottom:8px">${editId ? "広告を編集" : "新規広告"}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div style="grid-column:1/-1">
              <label style="font-size:10px;color:#8ab">YouTube URL / ID</label>
              <input id="sf-pv-id" ${editId ? "readonly" : ""} value="${esc(editing?.id || "")}" placeholder="https://youtube.com/watch?v=… / live / shorts / youtu.be/…" style="${inputStyle(editId ? "opacity:.7" : "")}" />
              <div id="sf-pv-id-parsed" style="font-size:10px;color:#8ab;margin-top:4px"></div>
              <div id="sf-pv-dur-status" style="font-size:10px;color:#678;margin-top:2px"></div>
            </div>
            <div style="grid-column:1/-1">
              <label style="font-size:10px;color:#8ab">ラベル（空ならタイトル自動）</label>
              <input id="sf-pv-label" value="${esc(editing?.label || "")}" placeholder="動画タイトルを自動取得" style="${inputStyle()}" />
            </div>
            <div>
              <label style="font-size:10px;color:#8ab">尺（秒）自動可</label>
              <div style="display:flex;gap:4px">
                <input id="sf-pv-dur" type="number" min="10" value="${editing?.durationSec ?? ""}" placeholder="自動" style="${inputStyle()}" />
                <button type="button" id="sf-pv-dur-f" style="${btnStyle("ghost")};flex-shrink:0">取得</button>
              </div>
            </div>
            <div>
              <label style="font-size:10px;color:#8ab">表示上限 h</label>
              <input id="sf-pv-maxh" type="number" min="0.1" step="0.1" value="${editing?.maxDisplayHours ?? defaultMax}" style="${inputStyle()}" />
              <div style="font-size:9px;color:#678;margin-top:2px">空き ${freeHours.toFixed(1)}h</div>
            </div>
            <div style="grid-column:1/-1">
              <label style="display:inline-flex;gap:6px;align-items:center;font-size:12px;cursor:pointer">
                <input type="checkbox" id="sf-pv-active" ${editing ? (editing.active ? "checked" : "") : "checked"} /> 配信中
              </label>
            </div>
            <div style="grid-column:1/-1">
              <label style="display:inline-flex;gap:6px;align-items:flex-start;font-size:12px;cursor:pointer;line-height:1.35">
                <input type="checkbox" id="sf-pv-once" ${editing?.claimOnce ? "checked" : ""} style="margin-top:2px" />
                <span>一人1回まで<span style="display:block;font-size:10px;color:#8ab">OFFなら同じ人が何度でも受け取れます（1時間4枚まで）</span></span>
              </label>
            </div>
            <div style="grid-column:1/-1">
              ${channelToggleHtml("sf-pv-ch", formShowCh)}
            </div>
          </div>
          <div style="display:flex;gap:8px;margin-top:10px">
            <button type="button" id="sf-pv-save" style="flex:1;${btnStyle("primary")}" ${busy ? "disabled" : ""}>${busy ? "保存中…" : editId ? "更新" : "登録"}</button>
            ${editId ? `<button type="button" id="sf-pv-cancel" style="${btnStyle("ghost")}">新規へ</button>` : ""}
          </div>
        </div>
        <div style="font-size:11px;font-weight:700;color:#fec;margin-bottom:6px">自分の広告 (${videos.length})</div>
        <div id="sf-pv-list" style="display:flex;flex-direction:column;gap:8px"></div>
        ${totalCredited <= 0 ? `<div style="font-size:10px;color:#a86;margin-top:8px">※ 先に「コード登録」でチャージしてください</div>` : ""}
      `;
      const list = body.querySelector("#sf-pv-list")!;
      if (!videos.length) {
        list.innerHTML = `<div style="font-size:11px;color:#678;padding:10px;text-align:center;border:1px dashed #345;border-radius:8px">まだ自分の広告がありません</div>`;
      } else {
        for (const v of videos) {
          const row = document.createElement("div");
          row.style.cssText =
            "background:#0a1520;border:1px solid #234;border-radius:10px;padding:10px";
          row.innerHTML = `
            <div style="display:flex;justify-content:space-between;gap:8px">
              <div style="min-width:0">
                <div style="font-size:12px;font-weight:800;color:${v.exhausted ? "#a86" : v.active ? "#cfe" : "#889"}">${esc(v.label)}${editId === v.id ? " · 編集中" : ""}</div>
                <div style="font-size:10px;color:#678;word-break:break-all">${esc(v.id)}</div>
              </div>
              <div style="display:flex;gap:4px;flex-shrink:0">
                <button type="button" data-edit="${esc(v.id)}" style="${btnStyle("ghost")}">編集</button>
                <button type="button" data-del="${esc(v.id)}" style="${btnStyle("danger")}">削除</button>
              </div>
            </div>
            <div style="font-size:10px;color:#9ab;margin-top:6px;display:grid;grid-template-columns:1fr 1fr;gap:4px">
              <div>尺 ${v.durationSec}秒</div><div>上限 ${v.maxDisplayHours}h</div>
              <div>再生 ${formatHours(v.totalWatchSec)}</div>
              <div>視聴者 ${v.viewerCount} · 受取 ${v.totalClaims}</div>
              <div style="grid-column:1/-1">受取: ${v.claimOnce ? "一人1回" : "何度でも"} · チャンネル: <b style="color:${isFlagOn(v.showChannel) ? "#9e8" : "#a86"}">${isFlagOn(v.showChannel) ? "出す" : "出さない"}</b></div>
            </div>`;
          list.appendChild(row);
        }
      }
    }

    // —— events ——
    card.querySelector("#sf-pt-x")?.addEventListener("click", () => {
      opts.sfxUi?.();
      close();
    });
    card.querySelector("#sf-pt-open-portal")?.addEventListener("click", () => {
      opts.sfxUi?.();
      openPartnerPortal();
    });
    card.querySelector("#sf-pt-tab-mine")?.addEventListener("click", () => {
      tab = "mine";
      flash = "";
      void reload().then(paint);
    });
    card.querySelector("#sf-pt-tab-banner")?.addEventListener("click", () => {
      tab = "banner";
      flash = "";
      void reload().then(paint);
    });
    card.querySelector("#sf-pt-tab-all")?.addEventListener("click", () => {
      tab = "all";
      flash = "";
      void reload().then(paint);
    });
    card.querySelector("#sf-pt-tab-redeem")?.addEventListener("click", () => {
      tab = "redeem";
      flash = "";
      paint();
    });
    card.querySelector("#sf-pt-tab-issue")?.addEventListener("click", () => {
      tab = "issue";
      flash = "";
      void reload().then(paint);
    });

    card.querySelector("#sf-strip-copy-link")?.addEventListener("click", async () => {
      const url =
        typeof location !== "undefined"
          ? `${location.origin}/banner`
          : "/banner";
      const ok = await copyText(url);
      flash = ok ? "バナー直リンクをコピーしました" : "コピー失敗";
      if (ok) opts.sfxOk?.();
      else opts.sfxFail?.();
      paint();
    });
    const openStripEditor = () => {
      opts.sfxUi?.();
      try {
        openBannerEditor({
          maxH: 85,
          minRatio: bannerStatus.minRatio || 1.5,
          maxRatio: bannerStatus.maxRatio || 5,
          maxBytes: bannerStatus.maxBytes || 200 * 1024,
          playerId: playerId || null,
          sfxUi: opts.sfxUi,
          sfxOk: opts.sfxOk,
          onSave: (dataUrl, meta) => {
            void (async () => {
              // always allow editing; upload only if weekly quota remains
              if (bannerStatus.weekRemaining <= 0) {
                flash = `書き出し済（${meta.width}×${meta.height}）· 配信は週上限のため未送信 · /banner からDL可`;
                opts.sfxFail?.();
                // still try download via temporary link
                try {
                  const a = document.createElement("a");
                  a.href = dataUrl;
                  a.download = `swipe-force-banner-${meta.width}x${meta.height}.jpg`;
                  a.click();
                } catch { /* */ }
                paint();
                return;
              }
              busy = true;
              flash = `書き出し ${meta.width}×${meta.height} · 送信中…`;
              paint();
              const res = await uploadPartnerBanner(playerId, dataUrl);
              busy = false;
              if (!res.ok) {
                const map: Record<string, string> = {
                  week_limit: "今週の差し替え上限（8回）に達しています",
                  too_large: "200KB を超えています",
                  bad_ratio: "横長バナーにしてください（比率 1.5〜5）",
                  too_small: "画像が小さすぎます",
                  bad_format: "JPEG / PNG / WebP のみ",
                  bad_image: "画像を読み取れません",
                  slot_limit: "登録上限です。先に1枚削除してください",
                };
                flash = map[res.reason || ""] || `失敗 (${res.reason || "?"})`;
                opts.sfxFail?.();
              } else {
                flash =
                  res.via === "blob"
                    ? `バナー保存完了（Blob）· 残り ${res.weekRemaining} 回`
                    : `バナー保存完了 · 残り ${res.weekRemaining} 回`;
                opts.sfxOk?.();
              }
              await reload();
              tab = "banner";
              paint();
            })();
          },
        });
      } catch (err) {
        console.warn("[strip-editor]", err);
        flash = "エディタを開けませんでした · 下の直リンクを試してください";
        opts.sfxFail?.();
        paint();
      }
    };
    const stripBtn = card.querySelector("#sf-strip-open") as HTMLButtonElement | null;
    if (stripBtn) {
      stripBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        openStripEditor();
      };
      stripBtn.disabled = false;
      stripBtn.removeAttribute("disabled");
      stripBtn.style.pointerEvents = "auto";
      stripBtn.style.opacity = "1";
    }
    card.querySelector("#sf-bn-hist-all")?.addEventListener("click", () => {
      opts.sfxUi?.();
      openBannerHistoryDialog({
        playerId,
        all: isAdmin,
        sfxUi: opts.sfxUi,
      });
    });
    card.querySelectorAll(".sf-bn-hist").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = (btn as HTMLElement).dataset.id || "";
        opts.sfxUi?.();
        openBannerHistoryDialog({
          playerId,
          bannerId: id || undefined,
          all: isAdmin,
          sfxUi: opts.sfxUi,
        });
      });
    });
    card.querySelectorAll(".sf-bn-href-save").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = (btn as HTMLElement).dataset.id || "";
        const input = card.querySelector(
          `.sf-bn-href[data-id="${id}"]`,
        ) as HTMLInputElement | null;
        const raw = (input?.value || "").trim();
        busy = true;
        flash = "";
        paint();
        const res = await savePartnerBannerHref(playerId, raw, id);
        busy = false;
        if (!res.ok) {
          flash =
            res.reason === "bad_href"
              ? "リンクは http / https のURLにしてください"
              : res.reason === "bad_id" || res.reason === "not_found"
                ? "対象のバナーが見つかりません"
                : `リンク保存失敗 (${res.reason || "?"})`;
          opts.sfxFail?.();
        } else {
          flash = raw
            ? `リンクを保存しました: ${res.href || raw}`
            : "リンクを外しました";
          opts.sfxOk?.();
        }
        await reload();
        tab = "banner";
        paint();
      });
    });
    card.querySelectorAll(".sf-bn-toggle").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = (btn as HTMLElement).dataset.id || "";
        if (!id) return;
        const nowOn = (btn as HTMLElement).dataset.on === "1";
        busy = true;
        paint();
        const res = await setPartnerBannerActive(playerId, id, !nowOn);
        busy = false;
        flash = res.ok
          ? nowOn
            ? "無効にしました（抽選から外れます）"
            : "有効にしました（抽選に戻ります）"
          : `切替失敗 (${res.reason})`;
        if (res.ok) opts.sfxOk?.();
        else opts.sfxFail?.();
        await reload();
        tab = "banner";
        paint();
      });
    });
    card.querySelectorAll(".sf-bn-del").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = (btn as HTMLElement).dataset.id || "";
        if (!id) return;
        const ok = await confirmBannerDelete({ sfxUi: opts.sfxUi });
        if (!ok) return;
        busy = true;
        flash = "";
        paint();
        const res = await clearPartnerBanner(playerId, id);
        busy = false;
        if (!res.ok) {
          flash = `削除失敗 (${res.reason || "?"})`;
          opts.sfxFail?.();
        } else {
          flash = "バナーを削除しました";
          opts.sfxOk?.();
        }
        await reload();
        tab = "banner";
        paint();
      });
    });
    card.querySelector("#sf-bn-up")?.addEventListener("click", async () => {
      const input = card.querySelector("#sf-bn-file") as HTMLInputElement | null;
      const file = input?.files?.[0];
      if (!file) {
        flash = "画像ファイルを選んでください";
        paint();
        return;
      }
      if (file.size > bannerStatus.maxBytes) {
        flash = `サイズ超過（最大 ${Math.round(bannerStatus.maxBytes / 1024)}KB）`;
        opts.sfxFail?.();
        paint();
        return;
      }
      busy = true;
      flash = "";
      paint();
      try {
        const prep = await prepareBannerUpload(file);
        flash = `検査中… 下黒帯 ${prep.bottomBlack}px · 許可縦 ${prep.maxHeightAllowed}px · 画面黒帯 ${prep.screenBlackPx}px`;
        paint();
        // re-get file input state lost after paint — use prep.dataUrl only
        const res = await uploadPartnerBanner(playerId, prep.dataUrl);
        busy = false;
        if (!res.ok) {
          const map: Record<string, string> = {
            week_limit: "今週の差し替え上限（8回）に達しています",
            too_large: "200KB を超えています",
            bad_ratio: "横長バナーにしてください（比率 1.5〜5）",
            too_small: "画像が小さすぎます",
            bad_format: "JPEG / PNG / WebP のみ",
            bad_image: "画像を読み取れません",
            slot_limit: "登録上限です。先に1枚削除してください",
          };
          flash = map[res.reason || ""] || `失敗 (${res.reason || "?"})`;
          opts.sfxFail?.();
        } else {
          flash =
            res.via === "blob"
              ? `アップロード完了（Blob / CDN）· 残り ${res.weekRemaining} 回`
              : `仮保存完了 · 残り ${res.weekRemaining} 回（BLOB_TOKEN 未設定）`;
          opts.sfxOk?.();
        }
        await reload();
        paint();
      } catch {
        busy = false;
        flash = "アップロードに失敗しました";
        opts.sfxFail?.();
        paint();
      }
    });
    // redeem
    card.querySelector("#sf-pt-paste")?.addEventListener("click", async () => {
      opts.sfxUi?.();
      try {
        const t = await navigator.clipboard.readText();
        const el = card.querySelector("#sf-pt-code") as HTMLInputElement | null;
        if (el && t) el.value = t.trim();
      } catch {
        flash = "貼付できません · 長押しでペースト";
        opts.sfxFail?.();
        paint();
      }
    });
    card.querySelector("#sf-pt-redeem")?.addEventListener("click", async () => {
      if (busy) return;
      const code =
        (card.querySelector("#sf-pt-code") as HTMLInputElement)?.value || "";
      if (!code.trim()) {
        flash = "コードを入力してください";
        opts.sfxFail?.();
        paint();
        return;
      }
      busy = true;
      flash = "";
      paint();
      const r = await redeemPrepaidCode(playerId, code);
      busy = false;
      if (!r.ok) {
        flash = `登録失敗 (${r.reason || "error"})`;
        opts.sfxFail?.();
        paint();
        return;
      }
      flash = `チャージ完了 +${r.credited}h`;
      opts.sfxOk?.();
      await reload();
      tab = "mine";
      paint();
    });

    // issue
    card.querySelector("#sf-pp-portal-copy")?.addEventListener("click", async () => {
      const ok = await copyText(partnerPortalUrl());
      flash = ok ? "ポータルURLをコピーしました" : "コピー失敗";
      if (ok) opts.sfxOk?.();
      else opts.sfxFail?.();
      paint();
    });
    card.querySelector("#sf-pp-create")?.addEventListener("click", async () => {
      if (busy) return;
      const code =
        (card.querySelector("#sf-pp-code") as HTMLInputElement)?.value || "";
      const label =
        (card.querySelector("#sf-pp-label") as HTMLInputElement)?.value || "";
      const hours = Number(
        (card.querySelector("#sf-pp-hours") as HTMLInputElement)?.value || 10,
      );
      const maxClaims = Number(
        (card.querySelector("#sf-pp-max") as HTMLInputElement)?.value || 1,
      );
      busy = true;
      flash = "";
      paint();
      const r = await createPrepaidCode(playerId, {
        code: code || undefined,
        label: label || undefined,
        creditHours: hours,
        maxClaims,
      });
      busy = false;
      if (!r.ok) {
        flash = `発行失敗 (${r.reason})`;
        opts.sfxFail?.();
        paint();
        return;
      }
      if (r.code) {
        const ok = await copyText(r.code);
        flash = ok
          ? `発行 · コピー済み: ${r.code}`
          : `発行しました: ${r.code}`;
      } else {
        flash = "発行しました";
      }
      opts.sfxOk?.();
      await reload();
      paint();
    });
    card.querySelectorAll("[data-copy]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const code = (btn as HTMLElement).getAttribute("data-copy") || "";
        const ok = await copyText(code);
        flash = ok ? `コピー: ${code}` : "コピー失敗";
        if (ok) opts.sfxOk?.();
        else opts.sfxFail?.();
        paint();
      });
    });
    card.querySelectorAll("[data-dis]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const code = (btn as HTMLElement).getAttribute("data-dis") || "";
        if (!code || busy) return;
        busy = true;
        paint();
        await disablePrepaidCode(playerId, code);
        busy = false;
        flash = `停止: ${code}`;
        opts.sfxOk?.();
        await reload();
        paint();
      });
    });

    // mine form — live parse + save / edit
    const idInput = card.querySelector("#sf-pv-id") as HTMLInputElement | null;
    const labelInput = card.querySelector(
      "#sf-pv-label",
    ) as HTMLInputElement | null;
    const durInput = card.querySelector("#sf-pv-dur") as HTMLInputElement | null;
    const parsedEl = card.querySelector("#sf-pv-id-parsed") as HTMLElement | null;
    const durStatus = card.querySelector(
      "#sf-pv-dur-status",
    ) as HTMLElement | null;
    let lastFetchedId = "";
    let lastAutoLabel = "";
    let fetchGen = 0;

    const setDurStatus = (msg: string, color = "#678") => {
      if (durStatus) {
        durStatus.textContent = msg;
        durStatus.style.color = color;
      }
    };

    const autoFetchMeta = async (vid: string, force = false) => {
      if (!vid || vid.length < 6) return;
      if (!force && lastFetchedId === vid && durInput?.value) return;
      const gen = ++fetchGen;
      setDurStatus("尺・タイトルを取得中…", "#fe8");
      const [sec, title] = await Promise.all([
        fetchYouTubeDurationSec(vid),
        fetchYouTubeTitle(vid),
      ]);
      if (gen !== fetchGen) return;
      if (
        title &&
        labelInput &&
        (!labelInput.value.trim() ||
          labelInput.value === lastAutoLabel ||
          labelInput.value === vid)
      ) {
        labelInput.value = title.slice(0, 40);
        lastAutoLabel = labelInput.value;
      }
      if (sec && sec >= 1) {
        lastFetchedId = vid;
        if (durInput) durInput.value = String(sec);
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        const human =
          h > 0
            ? `${h}時間${m}分${s}秒`
            : m > 0
              ? `${m}分${s}秒`
              : `${s}秒`;
        const tbit = title
          ? ` · 「${title.slice(0, 28)}${title.length > 28 ? "…" : ""}」`
          : "";
        setDurStatus(`自動取得: ${sec}秒（${human}）${tbit}`, "#8c8");
      } else if (title) {
        setDurStatus("タイトル取得OK · 尺は手入力", "#fe8");
      } else {
        setDurStatus("自動取得失敗 · 手入力するか再試行", "#f86");
      }
    };

    const updateParsed = () => {
      if (!idInput || !parsedEl) return;
      if (editId) {
        parsedEl.textContent = `ID: ${editId}`;
        parsedEl.style.color = "#8ab";
        return;
      }
      const parsed = parseYouTubeVideoId(idInput.value);
      if (!idInput.value.trim()) {
        parsedEl.textContent =
          "フルURL（watch / live / shorts / youtu.be）を貼れます";
        parsedEl.style.color = "#678";
      } else if (parsed) {
        parsedEl.textContent = `→ 動画ID: ${parsed}`;
        parsedEl.style.color = "#8c8";
        window.clearTimeout((updateParsed as { _t?: number })._t);
        (updateParsed as { _t?: number })._t = window.setTimeout(() => {
          void autoFetchMeta(parsed, false);
        }, 450);
      } else {
        parsedEl.textContent = "解析できません（URLかIDを確認）";
        parsedEl.style.color = "#f86";
      }
    };
    idInput?.addEventListener("input", updateParsed);
    idInput?.addEventListener("change", updateParsed);
    idInput?.addEventListener("paste", () => setTimeout(updateParsed, 0));
    updateParsed();
    if (editId && editing) {
      setDurStatus(
        `登録済み: ${editing.durationSec}秒 · 「取得」で再取得可`,
        "#8ab",
      );
    }

    card.querySelector("#sf-pv-dur-f")?.addEventListener("click", async () => {
      opts.sfxUi?.();
      const raw = idInput?.value || editId || "";
      const id = parseYouTubeVideoId(raw) || editId;
      if (!id) {
        flash = "URL/ID を入力してください";
        opts.sfxFail?.();
        paint();
        return;
      }
      if (idInput && !editId) idInput.value = id;
      await autoFetchMeta(id, true);
      opts.sfxOk?.();
    });

    card.querySelector("#sf-pv-cancel")?.addEventListener("click", () => {
      editId = "";
      formShowCh = false;
      flash = "";
      paint();
    });

    const bindCh = () => {
      card.querySelector("#sf-pv-ch-off")?.addEventListener("click", () => {
        formShowCh = false;
        paintChannelToggle(card, "sf-pv-ch", false);
        opts.sfxUi?.();
      });
      card.querySelector("#sf-pv-ch-on")?.addEventListener("click", () => {
        formShowCh = true;
        paintChannelToggle(card, "sf-pv-ch", true);
        opts.sfxUi?.();
      });
    };
    bindCh();

    card.querySelector("#sf-pv-save")?.addEventListener("click", async () => {
      if (busy) return;
      const idRaw = idInput?.value || "";
      const id = parseYouTubeVideoId(idRaw) || editId;
      if (idInput && id && !editId) idInput.value = id;
      let label = labelInput?.value?.trim() || id;
      let durationSec = Number(durInput?.value || 0);
      const maxDisplayHours = Number(
        (card.querySelector("#sf-pv-maxh") as HTMLInputElement)?.value || 1,
      );
      const active = !!(
        card.querySelector("#sf-pv-active") as HTMLInputElement
      )?.checked;
      const claimOnce = !!(
        card.querySelector("#sf-pv-once") as HTMLInputElement
      )?.checked;
      const showChannel =
        formShowCh ||
        (card.querySelector("#sf-pv-ch") as HTMLInputElement)?.value === "1";
      formShowCh = showChannel;
      if (id.length < 6) {
        flash = "動画IDを解析できません";
        opts.sfxFail?.();
        paint();
        return;
      }
      busy = true;
      flash = editId ? "更新中…" : "登録中…";
      paint();
      // re-read after paint loses inputs — use captured values
      if (!durationSec || durationSec < 10) {
        const got = await fetchYouTubeDurationSec(id);
        durationSec = got && got >= 10 ? got : 180;
      }
      if (!label || label === id) {
        const title = await fetchYouTubeTitle(id);
        if (title) label = title.slice(0, 40);
      }
      const r = await saveAdvertiserVideo(playerId, {
        id,
        label,
        durationSec,
        maxDisplayHours,
        active,
        claimOnce,
        showChannel,
      });
      busy = false;
      if (!r.ok) {
        flash = r.message || `保存失敗 (${r.reason || "error"})`;
        // keep edit mode so user can retry
        opts.sfxFail?.();
        paint();
        return;
      }
      videos = (r.videos || videos).map((v) => ({
        ...v,
        showChannel: isFlagOn(v.showChannel),
        claimOnce: isFlagOn(v.claimOnce),
      }));
      freeHours = r.freeHours ?? freeHours;
      editId = id;
      formShowCh = showChannel;
      flash = `保存しました · チャンネルリンク: ${showChannel ? "出す" : "出さない"}`;
      opts.sfxOk?.();
      await reload();
      paint();
    });

    card.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        editId = (btn as HTMLElement).getAttribute("data-edit") || "";
        const row = videos.find((v) => v.id === editId) || allVideos.find((v) => v.id === editId);
        formShowCh = isFlagOn(row?.showChannel);
        flash = editId
          ? `編集: ${editId} · チャンネル ${formShowCh ? "出す" : "出さない"}`
          : "";
        opts.sfxUi?.();
        paint();
        // scroll form into view
        card.querySelector("#sf-pv-label")?.scrollIntoView({ block: "nearest" });
      });
    });
    card.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = (btn as HTMLElement).getAttribute("data-del") || "";
        if (!id || busy) return;
        if (!confirm(`削除しますか？\n${id}`)) return;
        busy = true;
        paint();
        const r = await deleteAdvertiserVideo(playerId, id);
        busy = false;
        if (!r.ok) {
          flash = `削除失敗 (${r.reason || "error"})`;
          opts.sfxFail?.();
          paint();
          return;
        }
        if (editId === id) editId = "";
        flash = `削除しました · ${id}`;
        opts.sfxOk?.();
        await reload();
        paint();
      });
    });
  };

  root.addEventListener("click", (e) => {
    if (e.target === root) {
      opts.sfxUi?.();
      close();
    }
  });

  const offLocale = onLocaleChange(() => paint());

  void (async () => {
    await reload();
    paint();
  })();
}
