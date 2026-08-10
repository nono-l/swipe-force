import { advertiserPortalUrl, openAdvertiserPortal } from "@/lib/ad-portal-url";
/**
 * Advertiser portal UI (prepaid redeem + own ad videos).
 * Separate from platform ad-admin.
 */

import {
  deleteAdvertiserVideo,
  fetchAdvertiserStatus,
  redeemPrepaidCode,
  saveAdvertiserVideo,
  type AdvertiserVideo,
} from "@/lib/ad-advertiser-api";
import { parseYouTubeVideoId } from "@/components/game/engine/modes/ad-watch";
import { fetchYouTubeDurationSec } from "@/lib/youtube-duration";
import {
  createPrepaidCode,
  disablePrepaidCode,
  fetchPrepaidAdmin,
  type PrepaidCode,
} from "@/lib/ad-advertiser-api";
import { isPromoAdminPlayer } from "@/components/game/engine/modes/admin";

export type AdAdvertiserDialogOpts = {
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

function btnStyle(kind: "primary" | "danger" | "ghost" | "tab" | "tabOn" = "ghost") {
  const map = {
    primary: "border:1px solid #6af;background:#1a4060;color:#dff;font-weight:700",
    danger: "border:1px solid #a44;background:#301018;color:#fcc",
    ghost: "border:1px solid #456;background:#122028;color:#bcd",
    tab: "border:1px solid #345;background:#0a1520;color:#8ab;flex:1",
    tabOn: "border:1px solid #8cf;background:#102838;color:#def;flex:1;font-weight:700",
  };
  return `padding:8px 10px;border-radius:8px;cursor:pointer;font-size:12px;${map[kind]}`;
}

export function openAdAdvertiserDialog(opts: AdAdvertiserDialogOpts): void {
  if (document.getElementById("sf-ad-adv")) return;
  const playerId = String(opts.playerId || "");
  if (!playerId) return;

  const root = document.createElement("div");
  root.id = "sf-ad-adv";
  root.style.cssText =
    "position:fixed;inset:0;z-index:99996;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;padding:12px;font-family:system-ui,sans-serif";
  const card = document.createElement("div");
  card.style.cssText =
    "width:min(520px,96vw);max-height:92vh;overflow:auto;background:#061018;border:1px solid #3a6;border-radius:12px;padding:14px;color:#def;box-shadow:0 12px 40px #000a";
  root.appendChild(card);
  document.body.appendChild(root);
  root.addEventListener("pointerdown", (e) => e.stopPropagation());

  const isAdmin = isPromoAdminPlayer(playerId);
  let tab: "mine" | "all" | "redeem" | "issue" = "mine";
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

  const close = () => root.remove();

  const reload = async () => {
    const st = await fetchAdvertiserStatus(playerId, {
      all: isAdmin,
    });
    creditHours = st.balance.creditHours;
    creditSec = Number(st.balance.creditSec) || Math.floor(creditHours * 3600);
    totalCredited = st.balance.totalCredited;
    assignedHours = st.assignedHours;
    freeHours = st.freeHours;
    videos = st.videos;
    allVideos = st.allVideos || [];
    if (isAdmin && tab === "issue") {
      const r = await fetchPrepaidAdmin(playerId);
      codes = r.codes;
    }
  };

  const render = () => {
    const editing = videos.find((v) => v.id === editId);

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div>
          <div style="font-size:15px;font-weight:800;color:#9ef">📣 広告主ポータル</div>
          <div style="font-size:10px;color:#8ab;margin-top:2px">プリペイドで予算を入れて配信 · <b style="color:#fe8">自分の登録分のみ</b></div>
          <div style="font-size:9px;color:#6a8;margin-top:4px;word-break:break-all">直URL: <a href="${advertiserPortalUrl()}" target="_blank" rel="noopener" style="color:#8cf;text-decoration:underline">${esc(advertiserPortalUrl())}</a>
          <button type="button" id="sf-adv-open-portal" style="margin-left:6px;padding:2px 8px;border-radius:6px;border:1px solid #456;background:#122028;color:#bcd;font-size:9px;cursor:pointer">開く</button></div>
        </div>
        <button type="button" id="sf-adv-x" style="border:0;background:transparent;color:#9ab;font-size:22px;cursor:pointer">×</button>
      </div>

      <div style="background:#0a1820;border:1px solid #264;border-radius:10px;padding:10px;margin-bottom:10px;font-size:11px;line-height:1.5">
        広告クレジット <b style="color:#fe8">${creditSec.toLocaleString()} sec</b>
        <span style="color:#9ab">（約 ${creditHours.toFixed(2)} 時間）</span>
        · 割当 ${assignedHours.toFixed(1)}h · 空き ${freeHours.toFixed(1)}h
        <div style="font-size:9px;color:#678;margin-top:2px">視聴1秒＝1クレジット消費 · 0で配信停止 · 累計チャージ ${totalCredited.toFixed(1)}h</div>
      </div>

      <div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap">
        <button type="button" id="sf-adv-tab-mine" style="${btnStyle(tab === "mine" ? "tabOn" : "tab")}">マイ広告</button>
        ${isAdmin ? `<button type="button" id="sf-adv-tab-all" style="${btnStyle(tab === "all" ? "tabOn" : "tab")}">全広告</button>` : ""}
        <button type="button" id="sf-adv-tab-redeem" style="${btnStyle(tab === "redeem" ? "tabOn" : "tab")}">コード登録</button>
        ${isAdmin ? `<button type="button" id="sf-adv-tab-issue" style="${btnStyle(tab === "issue" ? "tabOn" : "tab")}">発行(管理)</button>` : ""}
      </div>

      <div id="sf-adv-body"></div>
      ${flash ? `<div style="margin-top:10px;font-size:11px;color:#fc8">${esc(flash)}</div>` : ""}
    `;

    const body = card.querySelector("#sf-adv-body")!;

    if (tab === "redeem") {
      body.innerHTML = `
        <div style="font-size:11px;color:#9bc;margin-bottom:8px;line-height:1.4">
          運営から受け取った <b>プリペイドコード</b> を入力すると、表示時間の予算が加算されます。
        </div>
        <label style="font-size:10px;color:#8ab">プリペイドコード（コピペ可）</label>
        <div style="display:flex;gap:6px;margin:4px 0 10px">
          <input id="sf-adv-code" placeholder="貼り付け → ADXXXXXXXX" autocomplete="off" autocapitalize="characters" style="${inputStyle("text-transform:uppercase;flex:1")}" />
          <button type="button" id="sf-adv-paste" style="${btnStyle("ghost")};flex-shrink:0">貼付</button>
        </div>
        <button type="button" id="sf-adv-redeem" style="width:100%;${btnStyle("primary")}" ${busy ? "disabled" : ""}>コードを登録してチャージ</button>
      `;
    } else if (tab === "all" && isAdmin) {
      body.innerHTML = `
        <div style="font-size:11px;color:#9bc;margin-bottom:8px;line-height:1.4">
          <b style="color:#fe8">管理者</b>は全広告を閲覧できます（編集は運営の広告管理 or 自分の分）。
        </div>
        <div style="font-size:11px;font-weight:700;color:#fec;margin-bottom:6px">全広告 (${allVideos.length})</div>
        <div id="sf-av-all-list" style="display:flex;flex-direction:column;gap:8px"></div>
      `;
      const list = body.querySelector("#sf-av-all-list")!;
      if (!allVideos.length) {
        list.innerHTML = `<div style="font-size:11px;color:#678;padding:10px;text-align:center;border:1px dashed #345;border-radius:8px">登録なし</div>`;
      } else {
        for (const v of allVideos) {
          const owner =
            v.ownerKind === "advertiser" && v.ownerPlayerId
              ? (v.ownerDisplayName || "").trim()
                ? `広告主: ${esc(v.ownerDisplayName || "")} <span style="color:#567">${esc(v.ownerPlayerId)}</span>`
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
            </div>`;
          list.appendChild(row);
        }
      }
    } else if (tab === "all" && isAdmin) {
      body.innerHTML = `
        <div style="font-size:11px;color:#9bc;margin-bottom:8px;line-height:1.4">
          <b style="color:#fe8">管理者</b>は全広告を閲覧できます（編集は運営の広告管理 or 自分の分）。
        </div>
        <div style="font-size:11px;font-weight:700;color:#fec;margin-bottom:6px">全広告 (${allVideos.length})</div>
        <div id="sf-av-all-list" style="display:flex;flex-direction:column;gap:8px"></div>
      `;
      const list = body.querySelector("#sf-av-all-list")!;
      if (!allVideos.length) {
        list.innerHTML = `<div style="font-size:11px;color:#678;padding:10px;text-align:center;border:1px dashed #345;border-radius:8px">登録なし</div>`;
      } else {
        for (const v of allVideos) {
          const owner =
            v.ownerKind === "advertiser" && v.ownerPlayerId
              ? (v.ownerDisplayName || "").trim()
                ? `広告主: ${esc(v.ownerDisplayName || "")} <span style="color:#567">${esc(v.ownerPlayerId)}</span>`
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
            </div>`;
          list.appendChild(row);
        }
      }
    } else if (tab === "issue" && isAdmin) {
      body.innerHTML = `
        <div style="font-size:11px;color:#9bc;margin-bottom:8px">広告主向けプリペイドを発行（管理者専用）</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div style="grid-column:1/-1">
            <label style="font-size:10px;color:#8ab">コード（空なら自動）</label>
            <input id="sf-pp-code" placeholder="空欄で自動生成" style="${inputStyle()}" />
          </div>
          <div style="grid-column:1/-1">
            <label style="font-size:10px;color:#8ab">ラベル</label>
            <input id="sf-pp-label" placeholder="春キャンペーン" style="${inputStyle()}" />
          </div>
          <div>
            <label style="font-size:10px;color:#8ab">付与時間（h）</label>
            <input id="sf-pp-hours" type="number" min="0.1" step="0.1" value="10" style="${inputStyle()}" />
          </div>
          <div>
            <label style="font-size:10px;color:#8ab">使用上限回数</label>
            <input id="sf-pp-max" type="number" min="1" value="1" style="${inputStyle()}" />
          </div>
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
                <code data-code-select="${esc(c.code)}" style="display:block;font-size:14px;font-weight:800;letter-spacing:.04em;color:${c.active ? "#9ef" : "#888"};background:#041018;border:1px dashed #356;border-radius:6px;padding:6px 8px;user-select:all;cursor:text;word-break:break-all">${esc(c.code)}</code>
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
      // mine
      body.innerHTML = `
        <div style="background:#0a1820;border:1px solid #264;border-radius:10px;padding:10px;margin-bottom:12px">
          <div style="font-size:11px;font-weight:700;color:#9ec;margin-bottom:8px">${editId ? "広告を編集" : "新規広告"}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div style="grid-column:1/-1">
              <label style="font-size:10px;color:#8ab">YouTube URL / ID</label>
              <input id="sf-av-id" ${editId ? "readonly" : ""} value="${esc(editing?.id || "")}" placeholder="https://youtube.com/…" style="${inputStyle(editId ? "opacity:.7" : "")}" />
            </div>
            <div style="grid-column:1/-1">
              <label style="font-size:10px;color:#8ab">ラベル</label>
              <input id="sf-av-label" value="${esc(editing?.label || "")}" style="${inputStyle()}" />
            </div>
            <div>
              <label style="font-size:10px;color:#8ab">尺（秒）自動可</label>
              <div style="display:flex;gap:4px">
                <input id="sf-av-dur" type="number" min="10" value="${editing?.durationSec ?? ""}" placeholder="自動" style="${inputStyle()}" />
                <button type="button" id="sf-av-dur-f" style="${btnStyle("ghost")};flex-shrink:0">取得</button>
              </div>
            </div>
            <div>
              <label style="font-size:10px;color:#8ab">表示上限（時間）</label>
              <input id="sf-av-maxh" type="number" min="0.1" step="0.1" value="${editing?.maxDisplayHours ?? Math.min(1, Math.max(0.1, freeHours || 1))}" style="${inputStyle()}" />
              <div style="font-size:9px;color:#678;margin-top:2px">空き予算 ${freeHours.toFixed(1)}h まで</div>
            </div>
            <div style="grid-column:1/-1">
              <label style="display:inline-flex;align-items:center;gap:6px;font-size:12px;cursor:pointer">
                <input type="checkbox" id="sf-av-active" ${editing ? (editing.active ? "checked" : "") : "checked"} /> 配信中
              </label>
            </div>
          </div>
          <div style="display:flex;gap:8px;margin-top:10px">
            <button type="button" id="sf-av-save" style="flex:1;${btnStyle("primary")}" ${busy ? "disabled" : ""}>${busy ? "保存中…" : editId ? "更新" : "登録"}</button>
            ${editId ? `<button type="button" id="sf-av-cancel" style="${btnStyle("ghost")}">新規へ</button>` : ""}
          </div>
        </div>
        <div style="font-size:11px;font-weight:700;color:#fec;margin-bottom:6px">自分の広告 (${videos.length})</div>
        <div id="sf-av-list" style="display:flex;flex-direction:column;gap:8px"></div>
        ${totalCredited <= 0 ? `<div style="font-size:10px;color:#a86;margin-top:8px">※ 先に「コード登録」でプリペイドをチャージしてください</div>` : ""}
      `;
      const list = body.querySelector("#sf-av-list")!;
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
                <div style="font-size:12px;font-weight:800;color:${v.exhausted ? "#a86" : v.active ? "#cfe" : "#889"}">${esc(v.label)}</div>
                <div style="font-size:10px;color:#678;word-break:break-all">${esc(v.id)}</div>
              </div>
              <div style="display:flex;gap:4px;flex-shrink:0">
                <button type="button" data-edit="${esc(v.id)}" style="${btnStyle("ghost")}">編集</button>
                <button type="button" data-del="${esc(v.id)}" style="${btnStyle("danger")}">削除</button>
              </div>
            </div>
            <div style="font-size:10px;color:#9ab;margin-top:6px;display:grid;grid-template-columns:1fr 1fr;gap:4px">
              <div>尺 ${v.durationSec}秒</div>
              <div>上限 ${v.maxDisplayHours}h</div>
              <div>再生 ${formatHours(v.totalWatchSec)}</div>
              <div>視聴者 ${v.viewerCount} · 受取 ${v.totalClaims}</div>
            </div>`;
          list.appendChild(row);
        }
      }
    }

    card.querySelector("#sf-adv-x")?.addEventListener("click", () => {
      opts.sfxUi?.();
      close();
    });
    card.querySelector("#sf-adv-tab-mine")?.addEventListener("click", () => {
      tab = "mine";
      flash = "";
      void reload().then(render);
    });
    card.querySelector("#sf-adv-tab-redeem")?.addEventListener("click", () => {
      tab = "redeem";
      flash = "";
      render();
    });
    card.querySelector("#sf-adv-tab-issue")?.addEventListener("click", () => {
      tab = "issue";
      flash = "";
      void reload().then(render);
    });

    // redeem
    card.querySelector("#sf-adv-redeem")?.addEventListener("click", async () => {
      if (busy) return;
      const code = (card.querySelector("#sf-adv-code") as HTMLInputElement)?.value || "";
      busy = true;
      render();
      const r = await redeemPrepaidCode(playerId, code);
      busy = false;
      if (!r.ok) {
        flash = `登録失敗 (${r.reason === "already" ? "使用済み" : r.reason === "sold_out" ? "上限" : r.reason === "expired" ? "期限切れ" : r.reason || "error"})`;
        opts.sfxFail?.();
        render();
        return;
      }
      flash = `チャージ完了 +${r.credited}h`;
      opts.sfxOk?.();
      tab = "mine";
      await reload();
      render();
    });

    // issue
    const portalUrl = advertiserPortalUrl();
    const ppPortal = card.querySelector("#sf-pp-portal") as HTMLAnchorElement | null;
    if (ppPortal) {
      ppPortal.href = portalUrl;
      ppPortal.textContent = portalUrl;
      // normal <a> navigation — do not preventDefault
    }
    card.querySelector("#sf-pp-portal-copy")?.addEventListener("click", async () => {
      const ok = await copyText(portalUrl);
      flash = ok ? `ポータルURLをコピーしました` : `コピー失敗`;
      if (ok) opts.sfxOk?.();
      else opts.sfxFail?.();
      paint();
    });
    card.querySelector("#sf-adv-open-portal")?.addEventListener("click", () => {
      opts.sfxUi?.();
      openAdvertiserPortal();
    });
    card.querySelector("#sf-pp-create")?.addEventListener("click", async () => {
      if (busy) return;
      busy = true;
      render();
      const code = (document.querySelector("#sf-pp-code") as HTMLInputElement)?.value;
      const label = (document.querySelector("#sf-pp-label") as HTMLInputElement)?.value;
      const creditHours = Number(
        (document.querySelector("#sf-pp-hours") as HTMLInputElement)?.value || 10,
      );
      const maxClaims = Number(
        (document.querySelector("#sf-pp-max") as HTMLInputElement)?.value || 1,
      );
      // re-query after render wiped - need to capture before render
      // fix: capture before busy render
    });
  };

  // Fix issue: rewrite render handlers more carefully with captured form values
  // Actually the create handler above is broken. Rebuild open function handlers after first paint via bind functions.

  const bind = () => {
    card.querySelector("#sf-adv-x")?.addEventListener("click", () => {
      opts.sfxUi?.();
      close();
    });
    card.querySelector("#sf-adv-tab-mine")?.addEventListener("click", () => {
      tab = "mine";
      flash = "";
      void reload().then(() => {
        paint();
      });
    });
    card.querySelector("#sf-adv-tab-all")?.addEventListener("click", () => {
      tab = "all";
      flash = "";
      void reload().then(() => paint());
    });
    card.querySelector("#sf-adv-tab-redeem")?.addEventListener("click", () => {
      tab = "redeem";
      flash = "";
      paint();
    });
    card.querySelector("#sf-adv-tab-issue")?.addEventListener("click", () => {
      tab = "issue";
      flash = "";
      void reload().then(() => paint());
    });

    card.querySelector("#sf-adv-paste")?.addEventListener("click", async () => {
      opts.sfxUi?.();
      try {
        const text = await navigator.clipboard?.readText?.();
        const el = card.querySelector("#sf-adv-code") as HTMLInputElement | null;
        if (el && text) {
          el.value = text.trim().toUpperCase();
          flash = "貼り付けました";
          paint();
          // restore value after paint
          const el2 = card.querySelector("#sf-adv-code") as HTMLInputElement | null;
          if (el2) el2.value = text.trim().toUpperCase();
          opts.sfxOk?.();
          return;
        }
      } catch {
        /* */
      }
      flash = "貼付は長押し or Ctrl+V でもOK";
      opts.sfxFail?.();
      paint();
    });
    card.querySelector("#sf-adv-redeem")?.addEventListener("click", async () => {
      if (busy) return;
      const code =
        (card.querySelector("#sf-adv-code") as HTMLInputElement)?.value || "";
      busy = true;
      paint();
      const r = await redeemPrepaidCode(playerId, code);
      busy = false;
      if (!r.ok) {
        const map: Record<string, string> = {
          already: "このコードは登録済み",
          sold_out: "使用上限に達しています",
          expired: "期限切れです",
          invalid: "無効なコードです",
        };
        flash = map[r.reason || ""] || `登録失敗 (${r.reason})`;
        opts.sfxFail?.();
        paint();
        return;
      }
      flash = `チャージ完了 +${r.credited}h`;
      opts.sfxOk?.();
      tab = "mine";
      await reload();
      paint();
    });

    const portalUrl = advertiserPortalUrl();
    const ppPortal = card.querySelector("#sf-pp-portal") as HTMLAnchorElement | null;
    if (ppPortal) {
      ppPortal.href = portalUrl;
      ppPortal.textContent = portalUrl;
      // normal <a> navigation — do not preventDefault
    }
    card.querySelector("#sf-pp-portal-copy")?.addEventListener("click", async () => {
      const ok = await copyText(portalUrl);
      flash = ok ? `ポータルURLをコピーしました` : `コピー失敗`;
      if (ok) opts.sfxOk?.();
      else opts.sfxFail?.();
      paint();
    });
    card.querySelector("#sf-adv-open-portal")?.addEventListener("click", () => {
      opts.sfxUi?.();
      openAdvertiserPortal();
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
      const max = Number(
        (card.querySelector("#sf-pp-max") as HTMLInputElement)?.value || 1,
      );
      busy = true;
      paint();
      const r = await createPrepaidCode(playerId, {
        code: code || undefined,
        label: label || undefined,
        creditHours: hours,
        maxClaims: max,
      });
      busy = false;
      if (!r.ok) {
        flash = `発行失敗 (${r.reason})`;
        opts.sfxFail?.();
        paint();
        return;
      }
      flash = r.code
        ? `発行しました · コピー可: ${r.code}`
        : "発行しました";
      if (r.code) {
        const ok = await copyText(r.code);
        if (ok) flash = `発行 · クリップボードにコピー済み: ${r.code}`;
      }
      opts.sfxOk?.();
      await reload();
      paint();
    });

    card.querySelectorAll("[data-copy]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const code = (btn as HTMLElement).getAttribute("data-copy") || "";
        if (!code) return;
        const ok = await copyText(code);
        flash = ok ? `コピーしました: ${code}` : `コピー失敗 · 長押しで選択: ${code}`;
        if (ok) opts.sfxOk?.();
        else opts.sfxFail?.();
        paint();
      });
    });
    card.querySelectorAll("[data-code-select]").forEach((el) => {
      el.addEventListener("click", () => {
        try {
          const range = document.createRange();
          range.selectNodeContents(el);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        } catch {
          /* */
        }
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

    card.querySelector("#sf-av-cancel")?.addEventListener("click", () => {
      editId = "";
      flash = "";
      paint();
    });

    card.querySelector("#sf-av-dur-f")?.addEventListener("click", async () => {
      opts.sfxUi?.();
      const raw =
        (card.querySelector("#sf-av-id") as HTMLInputElement)?.value || editId;
      const id = parseYouTubeVideoId(raw);
      if (!id) {
        flash = "URL/ID を入力してください";
        opts.sfxFail?.();
        paint();
        return;
      }
      flash = "尺を取得中…";
      paint();
      const sec = await fetchYouTubeDurationSec(id);
      const dur = card.querySelector("#sf-av-dur") as HTMLInputElement | null;
      if (sec && dur) {
        // need re-paint carefully - set flash and update via paint with temp
        flash = `尺 ${sec}秒 を取得`;
        // store on editing path by setting value after paint
        paint();
        const d2 = card.querySelector("#sf-av-dur") as HTMLInputElement | null;
        if (d2) d2.value = String(sec);
        opts.sfxOk?.();
      } else {
        flash = "尺の取得に失敗";
        opts.sfxFail?.();
        paint();
      }
    });

    card.querySelector("#sf-av-save")?.addEventListener("click", async () => {
      if (busy) return;
      const idRaw =
        (card.querySelector("#sf-av-id") as HTMLInputElement)?.value || "";
      const id = parseYouTubeVideoId(idRaw) || editId;
      let label =
        (card.querySelector("#sf-av-label") as HTMLInputElement)?.value?.trim() ||
        id;
      let durationSec = Number(
        (card.querySelector("#sf-av-dur") as HTMLInputElement)?.value || 0,
      );
      const maxDisplayHours = Number(
        (card.querySelector("#sf-av-maxh") as HTMLInputElement)?.value || 1,
      );
      const active = !!(
        card.querySelector("#sf-av-active") as HTMLInputElement
      )?.checked;
      if (id.length < 6) {
        flash = "動画IDを解析できません";
        opts.sfxFail?.();
        paint();
        return;
      }
      busy = true;
      flash = "";
      paint();
      if (!durationSec || durationSec < 10) {
        const got = await fetchYouTubeDurationSec(id);
        if (got) durationSec = got;
        else durationSec = 180;
      }
      const r = await saveAdvertiserVideo(playerId, {
        id,
        label,
        durationSec,
        maxDisplayHours,
        active,
      });
      busy = false;
      if (!r.ok) {
        flash = r.message || `保存失敗 (${r.reason})`;
        opts.sfxFail?.();
        paint();
        return;
      }
      videos = r.videos || [];
      freeHours = r.freeHours ?? freeHours;
      editId = "";
      flash = `保存しました · ${id}`;
      opts.sfxOk?.();
      await reload();
      paint();
    });

    card.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        editId = (btn as HTMLElement).getAttribute("data-edit") || "";
        flash = "";
        opts.sfxUi?.();
        paint();
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
          flash = `削除失敗 (${r.reason})`;
          opts.sfxFail?.();
          paint();
          return;
        }
        if (editId === id) editId = "";
        flash = `削除 · ${id}`;
        opts.sfxOk?.();
        await reload();
        paint();
      });
    });
  };

  const paint = () => {
    // rebuild using render body then bind - simplify: call original render logic
    // Re-define compact paint by reusing innerHTML from first render function
    // Easiest: assign render = paint after rewriting once
    renderShell();
    bind();
  };

  const renderShell = () => {
    const editing = videos.find((v) => v.id === editId);
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div>
          <div style="font-size:15px;font-weight:800;color:#9ef">📣 広告主ポータル</div>
          <div style="font-size:10px;color:#8ab;margin-top:2px">プリペイドで予算を入れて配信 · <b style="color:#fe8">自分の登録分のみ</b></div>
          <div style="font-size:9px;color:#6a8;margin-top:4px;word-break:break-all">直URL: <a href="${advertiserPortalUrl()}" target="_blank" rel="noopener" style="color:#8cf;text-decoration:underline">${esc(advertiserPortalUrl())}</a>
          <button type="button" id="sf-adv-open-portal" style="margin-left:6px;padding:2px 8px;border-radius:6px;border:1px solid #456;background:#122028;color:#bcd;font-size:9px;cursor:pointer">開く</button></div>
        </div>
        <button type="button" id="sf-adv-x" style="border:0;background:transparent;color:#9ab;font-size:22px;cursor:pointer">×</button>
      </div>
      <div style="background:#0a1820;border:1px solid #264;border-radius:10px;padding:10px;margin-bottom:10px;font-size:11px;line-height:1.5">
        広告クレジット <b style="color:#fe8">${creditSec.toLocaleString()} sec</b>
        <span style="color:#9ab">（約 ${creditHours.toFixed(2)} 時間）</span>
        · 割当 ${assignedHours.toFixed(1)}h · 空き ${freeHours.toFixed(1)}h
        <div style="font-size:9px;color:#678;margin-top:2px">視聴1秒＝1クレジット消費 · 0で配信停止 · 累計チャージ ${totalCredited.toFixed(1)}h</div>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap">
        <button type="button" id="sf-adv-tab-mine" style="${btnStyle(tab === "mine" ? "tabOn" : "tab")}">マイ広告</button>
        ${isAdmin ? `<button type="button" id="sf-adv-tab-all" style="${btnStyle(tab === "all" ? "tabOn" : "tab")}">全広告</button>` : ""}
        <button type="button" id="sf-adv-tab-redeem" style="${btnStyle(tab === "redeem" ? "tabOn" : "tab")}">コード登録</button>
        ${isAdmin ? `<button type="button" id="sf-adv-tab-issue" style="${btnStyle(tab === "issue" ? "tabOn" : "tab")}">発行(管理)</button>` : ""}
      </div>
      <div id="sf-adv-body"></div>
      ${flash ? `<div style="margin-top:10px;font-size:11px;color:#fc8">${esc(flash)}</div>` : ""}
    `;
    const body = card.querySelector("#sf-adv-body")!;
    if (tab === "redeem") {
      body.innerHTML = `
        <div style="font-size:11px;color:#9bc;margin-bottom:8px;line-height:1.4">
          運営の <b>プリペイドコード</b> で表示時間予算をチャージします。
        </div>
        <label style="font-size:10px;color:#8ab">プリペイドコード（コピペ可）</label>
        <div style="display:flex;gap:6px;margin:4px 0 10px">
          <input id="sf-adv-code" placeholder="貼り付け → ADXXXXXXXX" autocomplete="off" autocapitalize="characters" style="${inputStyle("text-transform:uppercase;flex:1")}" />
          <button type="button" id="sf-adv-paste" style="${btnStyle("ghost")};flex-shrink:0">貼付</button>
        </div>
        <button type="button" id="sf-adv-redeem" style="width:100%;${btnStyle("primary")}" ${busy ? "disabled" : ""}>コードを登録してチャージ</button>
      `;
    } else if (tab === "issue" && isAdmin) {
      body.innerHTML = `
        <div style="font-size:11px;color:#9bc;margin-bottom:8px">広告主向けプリペイド発行（管理者）</div>
        <div style="margin-bottom:10px;padding:8px;border:1px solid #345;border-radius:8px;background:#0a1520">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px">
            <div style="font-size:10px;color:#8ab">広告主が開くURL</div>
            <button type="button" id="sf-pp-portal-copy" style="padding:3px 8px;border-radius:6px;border:1px solid #456;background:#122028;color:#bcd;font-size:10px;cursor:pointer">コピー</button>
          </div>
          <a href="/advertiser" target="_blank" rel="noopener" id="sf-pp-portal" title="クリックでコピーも可" style="display:block;color:#8cf;font-size:11px;font-weight:700;word-break:break-all;padding:4px;border:1px dashed #356;border-radius:6px;background:#041018;text-decoration:none"></a>
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
                <code data-code-select="${esc(c.code)}" style="display:block;font-size:14px;font-weight:800;letter-spacing:.04em;color:${c.active ? "#9ef" : "#888"};background:#041018;border:1px dashed #356;border-radius:6px;padding:6px 8px;user-select:all;cursor:text;word-break:break-all">${esc(c.code)}</code>
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
      body.innerHTML = `
        <div style="background:#0a1820;border:1px solid #264;border-radius:10px;padding:10px;margin-bottom:12px">
          <div style="font-size:11px;font-weight:700;color:#9ec;margin-bottom:8px">${editId ? "広告を編集" : "新規広告"}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div style="grid-column:1/-1"><label style="font-size:10px;color:#8ab">YouTube URL / ID</label>
            <input id="sf-av-id" ${editId ? "readonly" : ""} value="${esc(editing?.id || "")}" style="${inputStyle(editId ? "opacity:.7" : "")}" /></div>
            <div style="grid-column:1/-1"><label style="font-size:10px;color:#8ab">ラベル</label>
            <input id="sf-av-label" value="${esc(editing?.label || "")}" style="${inputStyle()}" /></div>
            <div><label style="font-size:10px;color:#8ab">尺（秒）</label>
            <div style="display:flex;gap:4px">
              <input id="sf-av-dur" type="number" min="10" value="${editing?.durationSec ?? ""}" placeholder="自動" style="${inputStyle()}" />
              <button type="button" id="sf-av-dur-f" style="${btnStyle("ghost")};flex-shrink:0">取得</button>
            </div></div>
            <div><label style="font-size:10px;color:#8ab">表示上限 h</label>
            <input id="sf-av-maxh" type="number" min="0.1" step="0.1" value="${editing?.maxDisplayHours ?? Math.min(1, Math.max(0.1, freeHours || 1))}" style="${inputStyle()}" />
            <div style="font-size:9px;color:#678;margin-top:2px">空き ${freeHours.toFixed(1)}h</div></div>
            <div style="grid-column:1/-1"><label style="display:inline-flex;gap:6px;align-items:center;font-size:12px;cursor:pointer">
              <input type="checkbox" id="sf-av-active" ${editing ? (editing.active ? "checked" : "") : "checked"} /> 配信中
            </label></div>
          </div>
          <div style="display:flex;gap:8px;margin-top:10px">
            <button type="button" id="sf-av-save" style="flex:1;${btnStyle("primary")}" ${busy ? "disabled" : ""}>${busy ? "…" : editId ? "更新" : "登録"}</button>
            ${editId ? `<button type="button" id="sf-av-cancel" style="${btnStyle("ghost")}">新規へ</button>` : ""}
          </div>
        </div>
        <div style="font-size:11px;font-weight:700;color:#fec;margin-bottom:6px">自分の広告のみ (${videos.length})</div>
        <div id="sf-av-list" style="display:flex;flex-direction:column;gap:8px"></div>
        ${totalCredited <= 0 ? `<div style="font-size:10px;color:#a86;margin-top:8px">※ 先に「コード登録」でチャージしてください</div>` : ""}
      `;
      const list = body.querySelector("#sf-av-list")!;
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
                <div style="font-size:12px;font-weight:800;color:${v.exhausted ? "#a86" : v.active ? "#cfe" : "#889"}">${esc(v.label)}</div>
                <div style="font-size:10px;color:#678;word-break:break-all">${esc(v.id)}</div>
              </div>
              <div style="display:flex;gap:4px">
                <button type="button" data-edit="${esc(v.id)}" style="${btnStyle("ghost")}">編集</button>
                <button type="button" data-del="${esc(v.id)}" style="${btnStyle("danger")}">削除</button>
              </div>
            </div>
            <div style="font-size:10px;color:#9ab;margin-top:6px;display:grid;grid-template-columns:1fr 1fr;gap:4px">
              <div>尺 ${v.durationSec}秒</div><div>上限 ${v.maxDisplayHours}h</div>
              <div>再生 ${formatHours(v.totalWatchSec)}</div>
              <div>視聴者 ${v.viewerCount} · 受取 ${v.totalClaims}</div>
            </div>`;
          list.appendChild(row);
        }
      }
    }
  };

  root.addEventListener("click", (e) => {
    if (e.target === root) {
      opts.sfxUi?.();
      close();
    }
  });

  void (async () => {
    await reload();
    paint();
  })();
}
