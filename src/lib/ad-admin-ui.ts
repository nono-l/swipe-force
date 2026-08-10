import { advertiserPortalUrl, openAdvertiserPortal } from "@/lib/ad-portal-url";
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
  saveAdminAdVideo,
  type AdminAdVideo,
} from "@/lib/ad-videos-api";
import { maxCoinsForVideo, parseYouTubeVideoId } from "@/components/game/engine/modes/ad-watch";
import { fetchYouTubeDurationSec, fetchYouTubeTitle } from "@/lib/youtube-duration";
import { isPromoAdminPlayer } from "@/components/game/engine/modes/admin";

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

export function openAdAdminDialog(opts: AdAdminDialogOpts): void {
  if (document.getElementById("sf-ad-admin")) return;
  if (!isPromoAdminPlayer(opts.playerId)) {
    opts.onDenied?.();
    return;
  }

  const root = document.createElement("div");
  root.id = "sf-ad-admin";
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

  const close = () => root.remove();

  const reload = async () => {
    const r = await fetchAdminAdVideos(String(opts.playerId || ""));
    if (!r.ok) {
      flash = `読込失敗 (${r.reason || "error"})`;
      opts.sfxFail?.();
      return;
    }
    videos = r.videos;
  };

  const render = () => {
    const editing = videos.find((v) => v.id === editId);

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div>
          <div style="font-size:15px;font-weight:800;color:#9ef">📺 広告管理</div>
          <div style="font-size:10px;color:#8ab;margin-top:2px">全広告表示（運営＋全広告主） · 尺 · 上限 · 実績</div>
          <div style="font-size:10px;margin-top:6px;line-height:1.45">
            <button type="button" id="sf-aa-portal" style="margin-right:6px;padding:4px 10px;border-radius:6px;border:1px solid #8cf;background:#102838;color:#cef;font-size:11px;font-weight:700;cursor:pointer">📣 ポータルを開く</button>
            <button type="button" id="sf-aa-portal-copy" style="padding:3px 8px;border-radius:6px;border:1px solid #456;background:#122028;color:#bcd;font-size:10px;cursor:pointer">URLコピー</button>
            <a id="sf-aa-portal-url" href="/advertiser" target="_blank" rel="noopener" title="クリックで開く / 長押しでコピー" style="display:block;font-size:9px;color:#8cf;margin-top:4px;word-break:break-all;user-select:all;cursor:pointer;padding:4px 6px;border:1px dashed #356;border-radius:6px;background:#041018;text-decoration:none"></a>
          </div>
        </div>
        <button type="button" id="sf-aa-x" style="border:0;background:transparent;color:#9ab;font-size:22px;cursor:pointer;line-height:1">×</button>
      </div>

      <div style="background:#0a1820;border:1px solid #264;border-radius:10px;padding:10px;margin-bottom:12px">
        <div style="font-size:11px;font-weight:700;color:#9ec;margin-bottom:8px">${editId ? "編集" : "新規登録"}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div style="grid-column:1/-1">
            <label style="font-size:10px;color:#8ab">YouTube URL または 動画ID</label>
            <input id="sf-aa-id" ${editId ? "readonly" : ""} value="${esc(editing?.id || "")}" placeholder="https://www.youtube.com/watch?v=… / live / youtu.be/…" style="${inputStyle(editId ? "opacity:.7" : "")}" />
            <div id="sf-aa-id-parsed" style="font-size:10px;color:#8ab;margin-top:4px"></div>
          </div>
          <div style="grid-column:1/-1">
            <label style="font-size:10px;color:#8ab">ラベル</label>
            <input id="sf-aa-label" value="${esc(editing?.label || "")}" placeholder="空なら動画タイトルを自動" style="${inputStyle()}" />
          </div>
          <div>
            <label style="font-size:10px;color:#8ab">動画の長さ（秒）· 自動取得可</label>
            <div style="display:flex;gap:6px">
              <input id="sf-aa-dur" type="number" min="10" max="86400" value="${editing?.durationSec ?? ""}" placeholder="自動" style="${inputStyle()}" />
              <button type="button" id="sf-aa-dur-fetch" style="${btnStyle("ghost")};white-space:nowrap;flex-shrink:0">尺を取得</button>
            </div>
            <div id="sf-aa-dur-status" style="font-size:9px;color:#678;margin-top:3px">URL/ID 確定後に自動取得します</div>
          </div>
          <div>
            <label style="font-size:10px;color:#8ab">合計表示上限（時間）</label>
            <input id="sf-aa-maxh" type="number" min="0" max="100000" step="0.1" value="${editing?.maxDisplayHours ?? 0}" style="${inputStyle()}" />
            <div style="font-size:9px;color:#678;margin-top:2px">0 = 無制限 · 全プレイヤー合算の視聴時間</div>
          </div>
          <div style="grid-column:1/-1;display:flex;align-items:center;gap:8px">
            <label style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#cde;cursor:pointer">
              <input type="checkbox" id="sf-aa-active" ${editing ? (editing.active && !editing.exhausted ? "checked" : editing.active ? "checked" : "") : "checked"} />
              配信中（ON）
            </label>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" id="sf-aa-save" style="flex:1;${btnStyle("primary")}" ${busy ? "disabled" : ""}>${busy ? "保存中…" : editId ? "更新する" : "追加する"}</button>
          ${editId ? `<button type="button" id="sf-aa-cancel" style="${btnStyle("ghost")}">新規に戻る</button>` : ""}
        </div>
        ${flash ? `<div style="margin-top:8px;font-size:11px;color:#fc8">${esc(flash)}</div>` : ""}
      </div>

      <div style="font-size:11px;font-weight:700;color:#fec;margin-bottom:6px">登録動画 (${videos.length})</div>
      <div id="sf-aa-list" style="display:flex;flex-direction:column;gap:8px"></div>
      <div style="font-size:9px;color:#567;margin-top:12px;line-height:1.4">
        ※ 表示上限に達した動画は自動でプレイヤーに出なくなります。<br/>
        ※ 再生秒数はコイン受取時に加算（同一プレイヤーの重複分は差し引き）。
      </div>
    `;

    const list = card.querySelector("#sf-aa-list")!;
    if (!videos.length) {
      list.innerHTML = `<div style="font-size:11px;color:#789;padding:12px;text-align:center;border:1px dashed #345;border-radius:8px">まだ動画がありません</div>`;
    } else {
      for (const v of videos) {
        const row = document.createElement("div");
        row.style.cssText =
          "background:#0a1520;border:1px solid #234;border-radius:10px;padding:10px";
        const budget =
          v.maxDisplayHours > 0
            ? `${formatHours(v.totalWatchSec)} / ${v.maxDisplayHours}時間`
            : `${formatHours(v.totalWatchSec)} / 無制限`;
        const rem =
          v.remainingDisplaySec == null
            ? "残 ∞"
            : v.exhausted
              ? "上限到達"
              : `残 ${formatHours(v.remainingDisplaySec)}`;
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
              <div style="font-size:12px;font-weight:800;color:${v.exhausted ? "#a86" : v.active ? "#cfe" : "#889"}">${esc(v.label)} ${v.exhausted ? "· 停止" : v.active ? "" : "· OFF"}</div>
              <div style="font-size:10px;color:#789;margin-top:2px;word-break:break-all">${esc(v.id)}</div>
              <div style="font-size:10px;margin-top:4px;line-height:1.35">
                ${
                  v.ownerKind === "advertiser" && v.ownerPlayerId
                    ? `<span style="color:#fe8">広告主</span> ${
                        (v.ownerDisplayName || "").trim()
                          ? `<b style="color:#cfe">${esc(v.ownerDisplayName || "")}</b> <span style="color:#567;font-size:9px">${esc(v.ownerPlayerId)}</span>`
                          : `<span style="color:#9ab;word-break:break-all">${esc(v.ownerPlayerId)}</span>`
                      }`
                    : `<span style="color:#6a8">運営登録</span>`
                }
              </div>
            </div>
            <div style="display:flex;gap:4px;flex-shrink:0">
              <button type="button" data-edit="${esc(v.id)}" style="${btnStyle("ghost")}">編集</button>
              <button type="button" data-del="${esc(v.id)}" style="${btnStyle("danger")}">削除</button>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 10px;margin-top:8px;font-size:10px;color:#9ab">
            <div>尺 <b style="color:#cde">${v.durationSec}秒</b></div>
            <div>最後まで <b style="color:#fe8">${maxCoinsForVideo(v.durationSec)}枚</b></div>
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


    const idInput = card.querySelector("#sf-aa-id") as HTMLInputElement | null;
    const parsedEl = card.querySelector("#sf-aa-id-parsed") as HTMLElement | null;
    const durInput = card.querySelector("#sf-aa-dur") as HTMLInputElement | null;
    const durStatus = card.querySelector("#sf-aa-dur-status") as HTMLElement | null;
    let lastFetchedId = "";
    let fetchGen = 0;

    const setDurStatus = (msg: string, color = "#678") => {
      if (durStatus) {
        durStatus.textContent = msg;
        durStatus.style.color = color;
      }
    };

    const labelInput = card.querySelector("#sf-aa-label") as HTMLInputElement | null;
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

    card.querySelector("#sf-aa-dur-fetch")?.addEventListener("click", () => {
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

    const portalUrl = advertiserPortalUrl();
    const urlEl = card.querySelector("#sf-aa-portal-url") as HTMLAnchorElement | null;
    if (urlEl) {
      urlEl.href = portalUrl;
      urlEl.textContent = portalUrl;
    }
    card.querySelector("#sf-aa-portal")?.addEventListener("click", () => {
      opts.sfxUi?.();
      openAdvertiserPortal();
    });
    card.querySelector("#sf-aa-portal-copy")?.addEventListener("click", async () => {
      const ok = await copyText(portalUrl);
      flash = ok ? `ポータルURLをコピーしました` : `コピー失敗: ${portalUrl}`;
      if (ok) opts.sfxOk?.();
      else opts.sfxFail?.();
      render();
    });
    card.querySelector("#sf-aa-x")?.addEventListener("click", () => {
      opts.sfxUi?.();
      close();
    });
    card.querySelector("#sf-aa-cancel")?.addEventListener("click", () => {
      editId = "";
      flash = "";
      render();
    });
    card.querySelector("#sf-aa-save")?.addEventListener("click", async () => {
      if (busy) return;
      const idRaw =
        (card.querySelector("#sf-aa-id") as HTMLInputElement)?.value || "";
      const id = parseYouTubeVideoId(idRaw);
      let label =
        (card.querySelector("#sf-aa-label") as HTMLInputElement)?.value?.trim() ||
        id;
      let durationSec = Number(
        (card.querySelector("#sf-aa-dur") as HTMLInputElement)?.value || 0,
      );
      const maxDisplayHours = Number(
        (card.querySelector("#sf-aa-maxh") as HTMLInputElement)?.value || 0,
      );
      const active = !!(
        card.querySelector("#sf-aa-active") as HTMLInputElement
      )?.checked;
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
      const idEl = card.querySelector("#sf-aa-id") as HTMLInputElement | null;
      const labEl = card.querySelector("#sf-aa-label") as HTMLInputElement | null;
      const durEl = card.querySelector("#sf-aa-dur") as HTMLInputElement | null;
      const maxEl = card.querySelector("#sf-aa-maxh") as HTMLInputElement | null;
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
      const res = await saveAdminAdVideo(String(opts.playerId || ""), {
        id,
        label: label || id, // title may fill below
        durationSec,
        maxDisplayHours,
        active,
        sortOrder: editing?.sortOrder ?? videos.length,
      });
      busy = false;
      if (!res.ok) {
        flash = `保存失敗 (${res.reason || "error"})`;
        opts.sfxFail?.();
        render();
        return;
      }
      videos = res.videos;
      editId = "";
      flash = `保存しました · ${id}`;
      opts.sfxOk?.();
      render();
    });

    list.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        editId = (btn as HTMLElement).getAttribute("data-edit") || "";
        flash = "";
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
