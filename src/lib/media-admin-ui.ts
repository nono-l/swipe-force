import { partnerPortalUrl, openPartnerPortal } from "@/lib/partner-portal-url";
/**
 * Dedicated Ad management UI (admin only).
 * - Register YouTube IDs
 * - durationSec (ladder)
 * - maxDisplayHours (campaign budget)
 * - Live stats: watched seconds / claims / remaining budget
 */

import {
  deleteAdminAdVideo,
  fetchAdminAdVideos,
  saveMediaCatalogVideo,
  type AdminAdVideo,
} from "@/lib/media-catalog-api";
import { maxCoinsForVideo, parseYouTubeVideoId } from "@/components/game/engine/modes/media-watch";
import { fetchYouTubeDurationSec, fetchYouTubeTitle } from "@/lib/youtube-duration";
import { isPromoAdminPlayer } from "@/components/game/engine/modes/admin";
import { t } from "@/lib/i18n";

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
      <div style="font-size:12px;font-weight:800;color:#cfe">${t("mediaAd.showCh")}</div>
      <div style="font-size:10px;color:#8ab;margin:4px 0 8px;line-height:1.4">${t("mediaAd.showChHint")}</div>
      <div style="display:flex;gap:8px">
        <button type="button" id="${prefix}-off" style="flex:1;padding:12px 8px;border-radius:8px;border:2px solid ${on ? "#345" : "#a66"};background:${on ? "#152018" : "#3a2020"};color:${on ? "#89a" : "#fcc"};font-weight:${on ? 600 : 800};cursor:pointer">${t("mediaAd.chOff")}</button>
        <button type="button" id="${prefix}-on" style="flex:1;padding:12px 8px;border-radius:8px;border:2px solid ${on ? "#6a4" : "#345"};background:${on ? "#1a4030" : "#152018"};color:${on ? "#cfc" : "#89a"};font-weight:${on ? 800 : 600};cursor:pointer">${t("mediaAd.chOn")}</button>
      </div>
      <input type="hidden" id="${prefix}" value="${on ? "1" : "0"}" />
      <div style="font-size:10px;margin-top:8px;color:${on ? "#9e8" : "#889"}">${on ? t("mediaAd.chNowOn") : t("mediaAd.chNowOff")}</div>
    </div>`;
}

export type AdAdminDialogOpts = {
  playerId?: string | null;
  sfxUi?: () => void;
  sfxOk?: () => void;
  sfxFail?: () => void;
  onDenied?: () => void;
};

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&" + "amp;")
    .replace(/</g, "&" + "lt;")
    .replace(/>/g, "&" + "gt;")
    .replace(/"/g, "&" + "quot;");
}

function formatHours(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  if (s < 60) return t("mediaAd.sec", { n: s });
  const m = Math.floor(s / 60);
  if (m < 60) return s % 60 ? t("mediaAd.minSec", { m, s: s % 60 }) : t("mediaAd.min", { m });
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? t("mediaAd.hourMin", { h, m: rm }) : t("mediaAd.hour", { h });
}

function inputStyle(extra = "") {
  return `width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid #456;background:#0a1520;color:#eef;font-size:13px;${extra}`;
}

function btnStyle(kind: "primary" | "danger" | "ghost" | "ok" = "ghost") {
  const map = {
    primary: "border:1px solid #6af;background:#1a4060;color:#dff;font-weight:700",
    danger: "border:1px solid #a44;background:#301018;color:#fcc",
    ghost: "border:1px solid #456;background:#122028;color:#bcd",
    ok: "border:1px solid #4a6;background:#0a2818;color:#cfc",
  };
  return `padding:8px 10px;border-radius:8px;cursor:pointer;font-size:12px;${map[kind]}`;
}


async function copyText(text: string): Promise<boolean> {
  const s = String(text || "").trim();
  if (!s) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(s);
      return true;
    }
  } catch { /* */ }
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

export function openMediaAdminDialog(opts: AdAdminDialogOpts): void {
  if (document.getElementById("sf-media-admin")) return;
  if (!isPromoAdminPlayer(opts.playerId)) {
    opts.onDenied?.();
    return;
  }

  const root = document.createElement("div");
  root.id = "sf-media-admin";
  root.style.cssText =
    "position:fixed;inset:0;z-index:99995;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;padding:12px;font-family:system-ui,sans-serif";

  const card = document.createElement("div");
  card.style.cssText =
    "width:min(520px,96vw);max-height:92vh;overflow:auto;background:#061018;border:1px solid #3a6;border-radius:12px;padding:14px;color:#def;box-shadow:0 12px 40px #000a";
  root.appendChild(card);
  document.body.appendChild(root);
  root.addEventListener("pointerdown", (e) => e.stopPropagation());

  let videos: AdminAdVideo[] = [];
  let flash = "";
  let busy = false;
  let editId = "";
  let formShowCh = false;

  const close = () => root.remove();

  const reload = async () => {
    const r = await fetchAdminAdVideos(String(opts.playerId || ""));
    if (!r.ok) {
      flash = t("mediaAd.loadFail", { r: r.reason || "error" });
      opts.sfxFail?.();
      return;
    }
    videos = (r.videos || []).map((v) => ({
      ...v,
      showChannel: isFlagOn(v.showChannel),
      claimOnce: isFlagOn(v.claimOnce),
    }));
  };

  const render = () => {
    const editing = videos.find((v) => v.id === editId);

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div>
          <div style="font-size:15px;font-weight:800;color:#9ef">${t("mediaAd.title")}</div>
          <div style="font-size:10px;color:#8ab;margin-top:2px">${t("mediaAd.lead")}</div>
          <div style="font-size:10px;margin-top:6px;line-height:1.45">
            <button type="button" id="sf-ma-portal" style="margin-right:6px;padding:4px 10px;border-radius:6px;border:1px solid #8cf;background:#102838;color:#cef;font-size:11px;font-weight:700;cursor:pointer">${t("mediaAd.openPortal")}</button>
            <button type="button" id="sf-ma-portal-copy" style="padding:3px 8px;border-radius:6px;border:1px solid #456;background:#122028;color:#bcd;font-size:10px;cursor:pointer">${t("mediaAd.copyUrl")}</button>
            <a id="sf-ma-portal-url" href="/partner" target="_blank" rel="noopener" title="クリックで開く / 長押しでコピー" style="display:block;font-size:9px;color:#8cf;margin-top:4px;word-break:break-all;user-select:all;cursor:pointer;padding:4px 6px;border:1px dashed #356;border-radius:6px;background:#041018;text-decoration:none"></a>
          </div>
        </div>
        <button type="button" id="sf-ma-x" style="border:0;background:transparent;color:#9ab;font-size:22px;cursor:pointer;line-height:1">×</button>
      </div>

      <div style="background:#0a1820;border:1px solid #264;border-radius:10px;padding:10px;margin-bottom:12px">
        <div style="font-size:11px;font-weight:700;color:#9ec;margin-bottom:8px">${editId ? t("mediaAd.edit") : t("mediaAd.create")}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div style="grid-column:1/-1">
            <label style="font-size:10px;color:#8ab">${t("mediaAd.yt")}</label>
            <input id="sf-ma-id" ${editId ? "readonly" : ""} value="${esc(editing?.id || "")}" placeholder="https://www.youtube.com/watch?v=… / live / youtu.be/…" style="${inputStyle(editId ? "opacity:.7" : "")}" />
            <div id="sf-ma-id-parsed" style="font-size:10px;color:#8ab;margin-top:4px"></div>
          </div>
          <div style="grid-column:1/-1">
            <label style="font-size:10px;color:#8ab">${t("mediaAd.label")}</label>
            <input id="sf-ma-label" value="${esc(editing?.label || "")}" placeholder="${t("mediaAd.labelPh")}" style="${inputStyle()}" />
          </div>
          <div>
            <label style="font-size:10px;color:#8ab">${t("mediaAd.dur")}</label>
            <div style="display:flex;gap:6px">
              <input id="sf-ma-dur" type="number" min="10" max="86400" value="${editing?.durationSec ?? ""}" placeholder="自動" style="${inputStyle()}" />
              <button type="button" id="sf-ma-dur-fetch" style="${btnStyle("ghost")};white-space:nowrap;flex-shrink:0">${t("mediaAd.fetchDur")}</button>
            </div>
            <div id="sf-ma-dur-status" style="font-size:9px;color:#678;margin-top:3px">${t("mediaAd.durHint")}</div>
          </div>
          <div>
            <label style="font-size:10px;color:#8ab">${t("mediaAd.hours")}</label>
            <input id="sf-ma-maxh" type="number" min="0" max="100000" step="0.1" value="${editing?.maxDisplayHours ?? 0}" style="${inputStyle()}" />
            <div style="font-size:9px;color:#678;margin-top:2px">${t("mediaAd.hoursHint")}</div>
          </div>
          <div style="grid-column:1/-1;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <label style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#cde;cursor:pointer">
              <input type="checkbox" id="sf-ma-active" ${editing ? (editing.active && !editing.exhausted ? "checked" : editing.active ? "checked" : "") : "checked"} />
              ${t("mediaAd.liveOn")}
            </label>
            <label style="display:inline-flex;align-items:flex-start;gap:6px;font-size:12px;color:#cde;cursor:pointer;line-height:1.35">
              <input type="checkbox" id="sf-ma-once" ${editing?.claimOnce ? "checked" : ""} style="margin-top:2px" />
              <span>${t("mediaAd.once")}<span style="display:block;font-size:10px;color:#8ab">${t("mediaAd.onceHint")}</span></span>
            </label>
          </div>
          ${channelToggleHtml("sf-ma-ch", formShowCh)}
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" id="sf-ma-save" style="flex:1;${btnStyle("primary")}" ${busy ? "disabled" : ""}>${busy ? t("mediaAd.saving") : editId ? t("mediaAd.update") : t("mediaAd.add")}</button>
          ${editId ? `<button type="button" id="sf-ma-cancel" style="${btnStyle("ghost")}">${t("mediaAd.backNew")}</button>` : ""}
        </div>
        ${flash ? `<div style="margin-top:8px;font-size:11px;color:#fc8">${esc(flash)}</div>` : ""}
      </div>

      <div style="font-size:11px;font-weight:700;color:#fec;margin-bottom:6px">${t("mediaAd.list", { n: videos.length })}</div>
      <div id="sf-ma-list" style="display:flex;flex-direction:column;gap:8px"></div>
      <div style="font-size:9px;color:#567;margin-top:12px;line-height:1.4">
        ${t("mediaAd.note")}
      </div>
    `;

    const list = card.querySelector("#sf-ma-list")!;
    if (!videos.length) {
      list.innerHTML = `<div style="font-size:11px;color:#789;padding:12px;text-align:center;border:1px dashed #345;border-radius:8px">${t("mediaAd.empty")}</div>`;
    } else {
      for (const v of videos) {
        const row = document.createElement("div");
        row.style.cssText =
          "background:#0a1520;border:1px solid #234;border-radius:10px;padding:10px";
        const budget =
          v.maxDisplayHours > 0
            ? `${formatHours(v.totalWatchSec)} / ${t("mediaAd.hour", { h: v.maxDisplayHours })}`
            : `${formatHours(v.totalWatchSec)} / ${t("mediaAd.unlimited")}`;
        const rem =
          v.remainingDisplaySec == null
            ? t("mediaAd.remainInf")
            : v.exhausted
              ? t("mediaAd.cap")
              : t("mediaAd.remain", { h: formatHours(v.remainingDisplaySec) });
        const pct =
          v.maxDisplayHours > 0
            ? Math.min(
                100,
                Math.floor(
                  (v.totalWatchSec / Math.max(1, v.maxDisplayHours * 3600)) *
                    100,
                ),
              )
            : 0;
        row.innerHTML = `
          <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">
            <div style="min-width:0">
              <div style="font-size:12px;font-weight:800;color:${v.exhausted ? "#a86" : v.active ? "#cfe" : "#889"}">${esc(v.label)} ${v.exhausted ? t("mediaAd.stopped") : v.active ? "" : t("mediaAd.off")}</div>
              <div style="font-size:10px;color:#789;margin-top:2px;word-break:break-all">${esc(v.id)}</div>
              <div style="font-size:10px;margin-top:4px;line-height:1.35">
                ${
                  v.ownerKind === "advertiser" && v.ownerPlayerId
                    ? `<span style="color:#fe8">${t("mediaAd.partner")}</span> ${
                        (v.ownerDisplayName || "").trim()
                          ? `<b style="color:#cfe">${esc(v.ownerDisplayName || "")}</b> <span style="color:#567;font-size:9px">${esc(v.ownerPlayerId)}</span>`
                          : `<span style="color:#9ab;word-break:break-all">${esc(v.ownerPlayerId)}</span>`
                      }`
                    : `<span style="color:#6a8">${t("mediaAd.staff")}</span>`
                }
              </div>
            </div>
            <div style="display:flex;gap:4px;flex-shrink:0">
              <button type="button" data-edit="${esc(v.id)}" style="${btnStyle("ghost")}">${t("mediaAd.edit")}</button>
              <button type="button" data-del="${esc(v.id)}" style="${btnStyle("danger")}">${t("mediaAd.del")}</button>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 10px;margin-top:8px;font-size:10px;color:#9ab">
            <div>${t("mediaAd.len", { n: v.durationSec })}</div>
            <div>${t("mediaAd.coins", { n: maxCoinsForVideo(v.durationSec) })}</div>
            <div>受取 <b style="color:#cde">${v.claimOnce ? "一人1回" : "何度でも"}</b></div>
            <div>CLEARリンク <b style="color:${isFlagOn(v.showChannel) ? "#9e8" : "#a86"}">${isFlagOn(v.showChannel) ? t("mediaAd.chOn") : t("mediaAd.chOff")}</b></div>
            <div>受取実績 <b style="color:#cde">${v.totalClaims}</b> 回</div>
            <div style="grid-column:1/-1">累計再生 <b style="color:#fe8">${formatHours(v.totalWatchSec)}</b> <span style="color:#678">(${v.totalWatchSec}秒)</span></div>
            <div style="grid-column:1/-1">表示予算 ${esc(budget)} · <b style="color:${v.exhausted ? "#f86" : "#8c8"}">${esc(rem)}</b></div>
          </div>
          ${
            v.maxDisplayHours > 0
              ? `<div style="height:6px;background:#123;border-radius:3px;overflow:hidden;margin-top:8px">
                   <div style="height:100%;width:${pct}%;background:${v.exhausted ? "#a44" : "linear-gradient(90deg,#2a6,#6c4)"}"></div>
                 </div>`
              : ""
          }
          <div style="margin-top:10px;border-top:1px solid #234;padding-top:8px">
            <div style="font-size:10px;font-weight:800;color:#9ec;margin-bottom:6px">
              視聴プレイヤー ${v.viewerCount ?? v.viewers?.length ?? 0} 人
              · 合計 ${formatHours(v.totalWatchSec)}
            </div>
            ${
              !(v.viewers && v.viewers.length)
                ? `<div style="font-size:10px;color:#567">まだ視聴ログがありません</div>`
                : `<div style="display:flex;flex-direction:column;gap:4px;max-height:140px;overflow:auto">
                    ${v.viewers
                      .map((vw) => {
                        const last = vw.lastClaimedAt
                          ? (() => {
                              try {
                                const d = new Date(vw.lastClaimedAt!);
                                const j = new Date(d.getTime() + 9 * 3600 * 1000);
                                return `${j.getUTCMonth() + 1}/${j.getUTCDate()} ${j.getUTCHours()}:${String(j.getUTCMinutes()).padStart(2, "0")}`;
                              } catch {
                                return "";
                              }
                            })()
                          : "";
                        const name = (vw.displayName || "").trim();
                        const who = name
                          ? `<span style="color:#cfe;font-weight:700">${esc(name)}</span><span style="color:#567;margin-left:6px;font-size:9px">${esc(vw.playerId)}</span>`
                          : `<span style="color:#9ab;word-break:break-all">${esc(vw.playerId)}</span>`;
                        return `<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;font-size:10px;background:#071018;border:1px solid #1a2a34;border-radius:6px;padding:5px 8px">
                          <span style="min-width:0;flex:1;line-height:1.3">${who}</span>
                          <span style="color:#fe8;font-weight:800;white-space:nowrap;flex-shrink:0">${formatHours(vw.watchSec)}</span>
                          <span style="color:#678;white-space:nowrap;flex-shrink:0">受取${vw.claims}${last ? " · " + last : ""}</span>
                        </div>`;
                      })
                      .join("")}
                  </div>`
            }
          </div>
        `;
        list.appendChild(row);
      }
    }


    const idInput = card.querySelector("#sf-ma-id") as HTMLInputElement | null;
    const parsedEl = card.querySelector("#sf-ma-id-parsed") as HTMLElement | null;
    const durInput = card.querySelector("#sf-ma-dur") as HTMLInputElement | null;
    const durStatus = card.querySelector("#sf-ma-dur-status") as HTMLElement | null;
    let lastFetchedId = "";
    let fetchGen = 0;

    const setDurStatus = (msg: string, color = "#678") => {
      if (durStatus) {
        durStatus.textContent = msg;
        durStatus.style.color = color;
      }
    };

    const labelInput = card.querySelector("#sf-ma-label") as HTMLInputElement | null;
    let lastAutoLabelFor = "";
    const autoFetchDuration = async (vid: string, force = false) => {
      if (!vid || vid.length < 6) return;
      if (!force && lastFetchedId === vid && durInput?.value) return;
      const gen = ++fetchGen;
      setDurStatus("尺・タイトルを取得中…", "#fe8");
      const [sec, title] = await Promise.all([
        fetchYouTubeDurationSec(vid),
        fetchYouTubeTitle(vid),
      ]);
      if (gen !== fetchGen) return;
      // fill label if empty or previous auto-title for another id
      if (
        title &&
        labelInput &&
        (!labelInput.value.trim() ||
          lastAutoLabelFor === labelInput.value ||
          labelInput.value === vid)
      ) {
        labelInput.value = title.slice(0, 40);
        lastAutoLabelFor = labelInput.value;
      }
      if (sec && sec >= 1) {
        lastFetchedId = vid;
        if (durInput) durInput.value = String(sec);
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        const human = h > 0 ? `${h}時間${m}分${s}秒` : m > 0 ? `${m}分${s}秒` : `${s}秒`;
        const tbit = title ? ` · 「${title.slice(0, 28)}${title.length > 28 ? "…" : ""}」` : "";
        setDurStatus(`自動取得: ${sec}秒（${human}）${tbit}`, "#8c8");
      } else if (title) {
        setDurStatus(`タイトル取得OK · 尺は手入力`, "#fe8");
      } else {
        setDurStatus("自動取得失敗 · 手入力するか再試行", "#f86");
      }
    };

    const updateParsed = () => {
      if (!idInput || !parsedEl || editId) {
        if (parsedEl && editId) parsedEl.textContent = `ID: ${editId}`;
        return;
      }
      const parsed = parseYouTubeVideoId(idInput.value);
      if (!idInput.value.trim()) {
        parsedEl.textContent = "フルURL（watch / live / shorts / youtu.be）を貼れます";
        parsedEl.style.color = "#678";
      } else if (parsed) {
        parsedEl.textContent = `→ 動画ID: ${parsed}`;
        parsedEl.style.color = "#8c8";
        // debounce auto duration
        window.clearTimeout((updateParsed as any)._t);
        (updateParsed as any)._t = window.setTimeout(() => {
          void autoFetchDuration(parsed, false);
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

    card.querySelector("#sf-ma-dur-fetch")?.addEventListener("click", () => {
      opts.sfxUi?.();
      const raw = idInput?.value || editId || "";
      const vid = parseYouTubeVideoId(raw) || editId;
      if (!vid) {
        setDurStatus("先に URL / ID を入力", "#f86");
        return;
      }
      void autoFetchDuration(vid, true);
    });

    // editing existing: show current as known
    if (editId && editing) {
      setDurStatus(`登録済み: ${editing.durationSec}秒 · 「尺を取得」で再取得可`, "#8ab");
    }

    const portalUrl = partnerPortalUrl();
    const urlEl = card.querySelector("#sf-ma-portal-url") as HTMLAnchorElement | null;
    if (urlEl) {
      urlEl.href = portalUrl;
      urlEl.textContent = portalUrl;
    }
    card.querySelector("#sf-ma-portal")?.addEventListener("click", () => {
      opts.sfxUi?.();
      openPartnerPortal();
    });
    card.querySelector("#sf-ma-portal-copy")?.addEventListener("click", async () => {
      const ok = await copyText(portalUrl);
      flash = ok ? `ポータルURLをコピーしました` : `コピー失敗: ${portalUrl}`;
      if (ok) opts.sfxOk?.();
      else opts.sfxFail?.();
      render();
    });
    card.querySelector("#sf-ma-x")?.addEventListener("click", () => {
      opts.sfxUi?.();
      close();
    });
    card.querySelector("#sf-ma-cancel")?.addEventListener("click", () => {
      editId = "";
      formShowCh = false;
      flash = "";
      render();
    });
    card.querySelector("#sf-ma-ch-off")?.addEventListener("click", () => {
      formShowCh = false;
      paintChannelToggle(card, "sf-ma-ch", false);
      opts.sfxUi?.();
    });
    card.querySelector("#sf-ma-ch-on")?.addEventListener("click", () => {
      formShowCh = true;
      paintChannelToggle(card, "sf-ma-ch", true);
      opts.sfxUi?.();
    });
    card.querySelector("#sf-ma-save")?.addEventListener("click", async () => {
      if (busy) return;
      const idRaw =
        (card.querySelector("#sf-ma-id") as HTMLInputElement)?.value || "";
      const id = parseYouTubeVideoId(idRaw);
      let label =
        (card.querySelector("#sf-ma-label") as HTMLInputElement)?.value?.trim() ||
        id;
      let durationSec = Number(
        (card.querySelector("#sf-ma-dur") as HTMLInputElement)?.value || 0,
      );
      const maxDisplayHours = Number(
        (card.querySelector("#sf-ma-maxh") as HTMLInputElement)?.value || 0,
      );
      const active = !!(
        card.querySelector("#sf-ma-active") as HTMLInputElement
      )?.checked;
      const claimOnce = !!(
        card.querySelector("#sf-ma-once") as HTMLInputElement
      )?.checked;
      const showChannel =
        formShowCh ||
        (card.querySelector("#sf-ma-ch") as HTMLInputElement)?.value === "1";
      formShowCh = showChannel;
      if (id.length < 6) {
        flash = "URL / ID から動画IDを解析できませんでした";
        opts.sfxFail?.();
        render();
        return;
      }
      busy = true;
      flash = "";
      render();
      // restore form values after re-render
      const idEl = card.querySelector("#sf-ma-id") as HTMLInputElement | null;
      const labEl = card.querySelector("#sf-ma-label") as HTMLInputElement | null;
      const durEl = card.querySelector("#sf-ma-dur") as HTMLInputElement | null;
      const maxEl = card.querySelector("#sf-ma-maxh") as HTMLInputElement | null;
      if (idEl && !editId) idEl.value = idRaw;
      if (labEl) labEl.value = label;
      if (durEl && durationSec) durEl.value = String(durationSec);
      if (maxEl) maxEl.value = String(maxDisplayHours);

      if (!durationSec || durationSec < 10) {
        flash = "尺を自動取得中…";
        render();
        const got = await fetchYouTubeDurationSec(id);
        if (got && got >= 10) {
          durationSec = got;
        } else {
          busy = false;
          flash = "尺の自動取得に失敗しました。秒数を手入力してください";
          opts.sfxFail?.();
          render();
          return;
        }
      }
      if (!label || label === id) {
        const title = await fetchYouTubeTitle(id);
        if (title) label = title.slice(0, 40);
      }
      const res = await saveMediaCatalogVideo(String(opts.playerId || ""), {
        id,
        label: label || id, // title may fill below
        durationSec,
        maxDisplayHours,
        active,
        claimOnce,
        showChannel,
        sortOrder: editing?.sortOrder ?? videos.length,
      });
      busy = false;
      if (!res.ok) {
        flash = `保存失敗 (${res.reason || "error"})`;
        opts.sfxFail?.();
        render();
        return;
      }
      videos = res.videos.map((v) => ({
        ...v,
        showChannel: isFlagOn(v.showChannel),
        claimOnce: isFlagOn(v.claimOnce),
      }));
      editId = id;
      formShowCh = showChannel;
      flash = `保存しました · チャンネル ${showChannel ? "出す" : "出さない"}`;
      opts.sfxOk?.();
      render();
    });

    list.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        editId = (btn as HTMLElement).getAttribute("data-edit") || "";
        const row = videos.find((v) => v.id === editId);
        formShowCh = isFlagOn(row?.showChannel);
        flash = editId
          ? `編集 · チャンネル ${formShowCh ? "出す" : "出さない"}`
          : "";
        opts.sfxUi?.();
        render();
      });
    });
    list.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = (btn as HTMLElement).getAttribute("data-del") || "";
        if (!id || busy) return;
        if (!confirm(`削除しますか？\n${id}`)) return;
        busy = true;
        render();
        const res = await deleteAdminAdVideo(String(opts.playerId || ""), id);
        busy = false;
        if (!res.ok) {
          flash = `削除失敗 (${res.reason || "error"})`;
          opts.sfxFail?.();
          render();
          return;
        }
        videos = res.videos;
        if (editId === id) editId = "";
        flash = `削除しました · ${id}`;
        opts.sfxOk?.();
        render();
      });
    });
  };

  root.addEventListener("click", (e) => {
    if (e.target === root) {
      opts.sfxUi?.();
      close();
    }
  });

  void (async () => {
    await reload();
    render();
  })();
}
