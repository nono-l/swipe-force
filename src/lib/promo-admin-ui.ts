/**
 * DOM admin UI: promo codes + staff (appointed admins).
 * Gated to super admin + appointed staff.
 */

import {
  buildPromoUrl,
  deleteCustomPromo,
  formatGrantSummary,
  getAllPromoDefs,
  loadClaimedPromos,
  normalizePromoCode,
  type PromoDef,
  unclaimPromoCode,
  upsertCustomPromo,
  type GrantBundle,
} from "@/components/game/engine/modes/bag-grants";
import {
  appointAdmin,
  fetchStaffList,
  isPromoAdminPlayer,
  isSuperAdmin,
  normalizePlayerId,
  removeAppointedAdmin,
  SUPER_ADMIN_PLAYER_ID,
  type StaffEntry,
} from "@/components/game/engine/modes/admin";

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

function inputStyle(extra = "") {
  return `width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid #456;background:#0a1520;color:#eef;font-size:13px;${extra}`;
}

function btnStyle(kind: "primary" | "danger" | "ghost" | "ok" | "tab" | "tabOn" = "ghost") {
  const map = {
    primary: "border:1px solid #6af;background:#1a4060;color:#dff;font-weight:700",
    danger: "border:1px solid #a44;background:#301018;color:#fcc",
    ghost: "border:1px solid #456;background:#122028;color:#bcd",
    ok: "border:1px solid #4a6;background:#0a2818;color:#cfc",
    tab: "border:1px solid #345;background:#0a1520;color:#8ab;flex:1",
    tabOn: "border:1px solid #fc8;background:#2a2010;color:#ffe088;flex:1;font-weight:700",
  };
  return `padding:8px 10px;border-radius:8px;cursor:pointer;font-size:12px;${map[kind]}`;
}

export function openPromoAdminDialog(opts: {
  playerId?: string | null;
  sfxUi?: () => void;
  sfxOk?: () => void;
  sfxFail?: () => void;
  onDenied?: () => void;
  /** notify host that staff list changed (menu may need refresh) */
  onStaffChange?: () => void;
}) {
  if (document.getElementById("sf-promo-admin")) return;

  // Soft gate: refresh staff then re-check
  void (async () => {
    await fetchStaffList();
    if (!isPromoAdminPlayer(opts.playerId)) {
      opts.sfxFail?.();
      opts.onDenied?.();
      return;
    }
    mount();
  })();

  function mount() {
    if (document.getElementById("sf-promo-admin")) return;
    opts.sfxUi?.();

    const dlg = document.createElement("div");
    dlg.id = "sf-promo-admin";
    dlg.style.cssText =
      "position:fixed;inset:0;z-index:9995;display:flex;align-items:center;justify-content:center;background:rgba(0,6,10,.86);padding:10px;font-family:system-ui,sans-serif";

    const card = document.createElement("div");
    card.style.cssText =
      "width:min(400px,96vw);max-height:92vh;overflow:auto;background:#061018;border:2px solid #ffcc66;border-radius:14px;padding:14px;color:#eef";
    dlg.appendChild(card);
    document.body.appendChild(dlg);
    dlg.addEventListener("pointerdown", (e) => e.stopPropagation());

    let tab: "promo" | "staff" = "promo";
    let editCode = "";
    let flash = "";
    let staff: StaffEntry[] = [
      { playerId: SUPER_ADMIN_PLAYER_ID, label: "固定管理者", fixed: true },
    ];
    let staffBusy = false;

    const close = () => dlg.remove();

    const setFlash = (msg: string, ok = true) => {
      flash = msg;
      if (ok) opts.sfxOk?.();
      else opts.sfxFail?.();
      render();
    };

    const readForm = (): {
      code: string;
      label: string;
      grant: GrantBundle;
    } => {
      const code = normalizePromoCode(
        (card.querySelector("#sf-pa-code") as HTMLInputElement)?.value || "",
      );
      const label =
        (card.querySelector("#sf-pa-label") as HTMLInputElement)?.value?.trim() ||
        code;
      const grant: GrantBundle = {
        stageTicket: Number(
          (card.querySelector("#sf-pa-t") as HTMLInputElement)?.value || 0,
        ),
        ptsX5: Number(
          (card.querySelector("#sf-pa-x5") as HTMLInputElement)?.value || 0,
        ),
        ptsX10: Number(
          (card.querySelector("#sf-pa-x10") as HTMLInputElement)?.value || 0,
        ),
        ptsPack: Number(
          (card.querySelector("#sf-pa-pack") as HTMLInputElement)?.value || 0,
        ),
      };
      return { code, label, grant };
    };

    const fillForm = (def?: PromoDef | null) => {
      editCode = def?.code || "";
      const codeEl = card.querySelector("#sf-pa-code") as HTMLInputElement | null;
      const labelEl = card.querySelector(
        "#sf-pa-label",
      ) as HTMLInputElement | null;
      if (codeEl) codeEl.value = def?.code || "";
      if (labelEl) labelEl.value = def?.label || "";
      const setN = (id: string, v: number) => {
        const el = card.querySelector(id) as HTMLInputElement | null;
        if (el) el.value = String(v || 0);
      };
      setN("#sf-pa-t", def?.grant.stageTicket || 0);
      setN("#sf-pa-x5", def?.grant.ptsX5 || 0);
      setN("#sf-pa-x10", def?.grant.ptsX10 || 0);
      setN("#sf-pa-pack", def?.grant.ptsPack || 0);
    };

    async function reloadStaff() {
      const list = await fetchStaffList();
      staff = list.staff;
      opts.onStaffChange?.();
    }

    function renderPromoBody(): string {
      const defs = getAllPromoDefs();
      const claimed = new Set(loadClaimedPromos(null));
      const customs = defs.filter((d) => d.custom);
      const builtins = defs.filter((d) => !d.custom);

      return `
      ${flash ? `<div style="font-size:11px;margin-bottom:8px;padding:8px;border-radius:8px;background:#1a2010;border:1px solid #664;color:#fec">${esc(flash)}</div>` : ""}
      <div style="background:#0a141c;border:1px solid #345;border-radius:10px;padding:10px;margin-bottom:12px">
        <div style="font-size:11px;font-weight:700;color:#9cf;margin-bottom:8px">${editCode ? `編集: ${esc(editCode)}` : "新規コード"}</div>
        <label style="display:block;font-size:10px;color:#8ab;margin-bottom:3px">コード (A-Z0-9)</label>
        <input id="sf-pa-code" maxlength="24" placeholder="SUMMER2026" style="${inputStyle("margin-bottom:8px;text-transform:uppercase")}" />
        <label style="display:block;font-size:10px;color:#8ab;margin-bottom:3px">表示名</label>
        <input id="sf-pa-label" maxlength="40" placeholder="夏キャンペーン" style="${inputStyle("margin-bottom:8px")}" />
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
          <div>
            <label style="font-size:10px;color:#8ab">TICKET</label>
            <input id="sf-pa-t" type="number" min="0" max="99" value="0" style="${inputStyle()}" />
          </div>
          <div>
            <label style="font-size:10px;color:#8ab">PTS ×5</label>
            <input id="sf-pa-x5" type="number" min="0" max="99" value="0" style="${inputStyle()}" />
          </div>
          <div>
            <label style="font-size:10px;color:#8ab">PTS ×10</label>
            <input id="sf-pa-x10" type="number" min="0" max="99" value="0" style="${inputStyle()}" />
          </div>
          <div>
            <label style="font-size:10px;color:#8ab">+5000</label>
            <input id="sf-pa-pack" type="number" min="0" max="99" value="0" style="${inputStyle()}" />
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" id="sf-pa-save" style="flex:1;${btnStyle("primary")}">${editCode ? "更新" : "追加"}</button>
          <button type="button" id="sf-pa-clear" style="${btnStyle("ghost")}">クリア</button>
        </div>
      </div>
      <div style="font-size:11px;font-weight:700;color:#fec;margin-bottom:6px">カスタム (${customs.length})</div>
      <div id="sf-pa-custom" style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px"></div>
      <div style="font-size:11px;font-weight:700;color:#8ab;margin-bottom:6px">ビルトイン (${builtins.length})</div>
      <div id="sf-pa-built" style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px"></div>
      `;
    }

    function renderStaffBody(): string {
      return `
      ${flash ? `<div style="font-size:11px;margin-bottom:8px;padding:8px;border-radius:8px;background:#1a2010;border:1px solid #664;color:#fec">${esc(flash)}</div>` : ""}
      <div style="font-size:10px;color:#8a7;margin-bottom:10px;line-height:1.45">
        固定管理者 <code style="color:#fc8">${esc(SUPER_ADMIN_PLAYER_ID)}</code> は削除不可。<br/>
        追加管理者は連携済みプレイヤーIDを指定して任命します。
      </div>
      <div style="background:#0a141c;border:1px solid #345;border-radius:10px;padding:10px;margin-bottom:12px">
        <div style="font-size:11px;font-weight:700;color:#9cf;margin-bottom:8px">管理者を任命</div>
        <label style="display:block;font-size:10px;color:#8ab;margin-bottom:3px">プレイヤーID</label>
        <input id="sf-st-id" maxlength="32" placeholder="uxxxxxxxxxxxx" style="${inputStyle("margin-bottom:8px")}" />
        <label style="display:block;font-size:10px;color:#8ab;margin-bottom:3px">表示名（任意）</label>
        <input id="sf-st-label" maxlength="40" placeholder="運営A" style="${inputStyle("margin-bottom:10px")}" />
        <button type="button" id="sf-st-add" style="width:100%;${btnStyle("primary")}" ${staffBusy ? "disabled" : ""}>任命する</button>
      </div>
      <div style="font-size:11px;font-weight:700;color:#fec;margin-bottom:6px">スタッフ一覧 (${staff.length})</div>
      <div id="sf-st-list" style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px"></div>
      `;
    }

    function render() {
      if (!isPromoAdminPlayer(opts.playerId)) {
        close();
        opts.onDenied?.();
        return;
      }

      card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div style="font-size:14px;font-weight:800;color:#ffe088">管理パネル</div>
        <button type="button" id="sf-pa-x" style="border:0;background:transparent;color:#9ab;font-size:20px;cursor:pointer;line-height:1">×</button>
      </div>
      <div style="font-size:10px;color:#8a7;margin-bottom:8px">
        操作者 ${esc(String(opts.playerId || "").slice(0, 28))}${isSuperAdmin(opts.playerId) ? " · SUPER" : " · STAFF"}
      </div>
      <div style="display:flex;gap:6px;margin-bottom:12px">
        <button type="button" id="sf-tab-promo" style="${btnStyle(tab === "promo" ? "tabOn" : "tab")}">プロモ</button>
        <button type="button" id="sf-tab-staff" style="${btnStyle(tab === "staff" ? "tabOn" : "tab")}">管理者</button>
      </div>
      <div id="sf-pa-body">${tab === "promo" ? renderPromoBody() : renderStaffBody()}</div>
      `;

      card.querySelector("#sf-pa-x")!.addEventListener("click", close);
      card.querySelector("#sf-tab-promo")!.addEventListener("click", () => {
        tab = "promo";
        flash = "";
        render();
      });
      card.querySelector("#sf-tab-staff")!.addEventListener("click", () => {
        tab = "staff";
        flash = "";
        render();
        void reloadStaff().then(() => render());
      });

      if (tab === "promo") bindPromoHandlers();
      else bindStaffHandlers();
    }

    function bindPromoHandlers() {
      const defs = getAllPromoDefs();
      const claimed = new Set(loadClaimedPromos(null));
      const customs = defs.filter((d) => d.custom);
      const builtins = defs.filter((d) => !d.custom);

      const bindRow = (host: HTMLElement, def: PromoDef, isCustom: boolean) => {
        const row = document.createElement("div");
        const claimedMark = claimed.has(def.code) ? " · 受取済" : "";
        row.style.cssText =
          "background:#031018;border:1px solid #234;border-radius:8px;padding:8px";
        row.innerHTML = `
        <div style="font-size:12px;font-weight:700;color:${isCustom ? "#ffe088" : "#9cf"}">${esc(def.code)}${isCustom ? "" : " 🔒"}</div>
        <div style="font-size:10px;color:#9ab;margin-top:2px">${esc(def.label)} · ${esc(formatGrantSummary(def.grant))}${esc(claimedMark)}</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px"></div>
      `;
        const actions = row.lastElementChild as HTMLElement;
        const addBtn = (
          label: string,
          kind: Parameters<typeof btnStyle>[0],
          fn: () => void,
        ) => {
          const b = document.createElement("button");
          b.type = "button";
          b.textContent = label;
          b.style.cssText = btnStyle(kind);
          b.onclick = fn;
          actions.appendChild(b);
        };

        addBtn("URL", "ok", async () => {
          const url = buildPromoUrl(def.code);
          try {
            await navigator.clipboard.writeText(url);
            setFlash(`コピー: ${url}`);
          } catch {
            setFlash(url, true);
          }
        });
        if (isCustom) {
          addBtn("編集", "ghost", () => {
            const snapshot = { ...def };
            flash = "";
            render();
            fillForm(snapshot);
          });
          addBtn("削除", "danger", () => {
            if (!confirm(`削除: ${def.code} ?`)) return;
            deleteCustomPromo(def.code);
            if (editCode === def.code) editCode = "";
            setFlash(`削除: ${def.code}`);
          });
        }
        addBtn("受取解除", "ghost", () => {
          unclaimPromoCode(def.code);
          setFlash(`受取履歴クリア: ${def.code}`);
        });
        host.appendChild(row);
      };

      const customHost = card.querySelector("#sf-pa-custom") as HTMLElement | null;
      if (customHost) {
        if (!customs.length) {
          customHost.innerHTML =
            '<div style="font-size:11px;color:#678;padding:6px">まだカスタムコードがありません</div>';
        } else {
          for (const d of customs) bindRow(customHost, d, true);
        }
      }
      const builtHost = card.querySelector("#sf-pa-built") as HTMLElement | null;
      if (builtHost) {
        for (const d of builtins) bindRow(builtHost, d, false);
      }

      card.querySelector("#sf-pa-save")?.addEventListener("click", () => {
        if (!isPromoAdminPlayer(opts.playerId)) {
          setFlash("管理者のみ操作できます", false);
          return;
        }
        const form = readForm();
        const res = upsertCustomPromo(form);
        if (!res.ok) {
          const msg =
            res.reason === "bad_code"
              ? "コードが不正です (2文字以上 A-Z0-9)"
              : res.reason === "empty_grant"
                ? "配布内容を1つ以上指定してください"
                : "ビルトインコードは上書きできません";
          setFlash(msg, false);
          return;
        }
        editCode = res.def.code;
        setFlash(`保存: ${res.def.code} (${formatGrantSummary(res.def.grant)})`);
      });
      card.querySelector("#sf-pa-clear")?.addEventListener("click", () => {
        editCode = "";
        flash = "";
        render();
        fillForm(null);
      });
      if (editCode) {
        const cur = defs.find((d) => d.code === editCode && d.custom);
        if (cur) fillForm(cur);
      }
    }

    function bindStaffHandlers() {
      const listHost = card.querySelector("#sf-st-list") as HTMLElement | null;
      if (listHost) {
        if (!staff.length) {
          listHost.innerHTML =
            '<div style="font-size:11px;color:#678;padding:6px">読み込み中…</div>';
        }
        for (const s of staff) {
          const row = document.createElement("div");
          const fixed = !!s.fixed || s.playerId === SUPER_ADMIN_PLAYER_ID;
          row.style.cssText =
            "background:#031018;border:1px solid #234;border-radius:8px;padding:8px";
          row.innerHTML = `
            <div style="font-size:12px;font-weight:700;color:${fixed ? "#9cf" : "#ffe088"}">${esc(s.playerId)}${fixed ? " 🔒" : ""}</div>
            <div style="font-size:10px;color:#9ab;margin-top:2px">${esc(s.label || (fixed ? "固定管理者" : "追加管理者"))}${s.appointedBy ? ` · by ${esc(s.appointedBy)}` : ""}</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px"></div>
          `;
          const actions = row.lastElementChild as HTMLElement;
          if (!fixed) {
            const b = document.createElement("button");
            b.type = "button";
            b.textContent = "解任";
            b.style.cssText = btnStyle("danger");
            b.onclick = () => {
              if (!confirm(`解任: ${s.playerId} ?`)) return;
              staffBusy = true;
              void removeAppointedAdmin(s.playerId).then(async (r) => {
                staffBusy = false;
                if (!r.ok) {
                  setFlash(
                    r.reason === "forbidden"
                      ? "権限がありません"
                      : r.reason === "fixed"
                        ? "固定管理者は解任できません"
                        : `解任失敗 (${r.reason})`,
                    false,
                  );
                  return;
                }
                if (r.staff) staff = r.staff;
                else await reloadStaff();
                opts.onStaffChange?.();
                setFlash(`解任: ${s.playerId}`);
              });
            };
            actions.appendChild(b);
          } else {
            const sp = document.createElement("span");
            sp.style.cssText = "font-size:10px;color:#567";
            sp.textContent = "固定 · 削除不可";
            actions.appendChild(sp);
          }
          listHost.appendChild(row);
        }
      }

      card.querySelector("#sf-st-add")?.addEventListener("click", () => {
        if (staffBusy) return;
        if (!isPromoAdminPlayer(opts.playerId)) {
          setFlash("管理者のみ操作できます", false);
          return;
        }
        const id = normalizePlayerId(
          (card.querySelector("#sf-st-id") as HTMLInputElement)?.value || "",
        );
        const label =
          (card.querySelector("#sf-st-label") as HTMLInputElement)?.value?.trim() ||
          id;
        if (!id || id.length < 4) {
          setFlash("プレイヤーIDを入力してください", false);
          return;
        }
        staffBusy = true;
        void appointAdmin(id, label).then(async (r) => {
          staffBusy = false;
          if (!r.ok) {
            const msg =
              r.reason === "forbidden"
                ? "権限がありません（連携済み管理者のみ）"
                : r.reason === "auth"
                  ? "連携セッションが必要です"
                  : r.reason === "already_super"
                    ? "既に固定管理者です"
                    : r.reason === "bad_id"
                      ? "IDが不正です"
                      : `任命失敗 (${r.reason})`;
            setFlash(msg, false);
            return;
          }
          if (r.staff) staff = r.staff;
          else await reloadStaff();
          opts.onStaffChange?.();
          setFlash(`任命: ${id}`);
        });
      });
    }

    void reloadStaff().then(() => {
      render();
    });

    dlg.addEventListener("click", (e) => {
      if (e.target === dlg) close();
    });
  }
}
