/**
 * DOM admin UI: promo codes + staff (appointed admins).
 * Promo codes are stored in the server DB (not localStorage-only).
 */

import {
  buildPromoUrl,
  formatGrantSummary,
  loadClaimedPromos,
  normalizePromoCode,
  unclaimPromoCode,
  type PromoDef,
  type GrantBundle,
  PROMO_DEFS,
} from "@/components/game/engine/modes/bag-grants";
import {
  appointAdmin,
  fetchStaffList,
  isPromoAdminPlayer,
  isSuperAdmin,
  removeAppointedAdmin,
  SUPER_ADMIN_PLAYER_ID,
  type StaffEntry,
} from "@/components/game/engine/modes/admin";
import { translate, onLocaleChange } from "@/lib/i18n";
import {
  deleteAdminPromo,
  fetchAdminPromos,
  saveAdminPromo,
  type ServerPromo,
} from "@/lib/promo-api";
import {
  formatExpiresLabel,
  formatMaxClaimsLabel,
  isPromoExpired,
  isPromoSoldOut,
} from "@/lib/promo-server";
import { openMediaAdminDialog } from "@/lib/media-admin-ui";
import { partnerPortalUrl, openPartnerPortal } from "@/lib/partner-portal-url";

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

export function openPromoAdminDialog(opts: {
  playerId?: string | null;
  sfxUi?: () => void;
  sfxOk?: () => void;
  sfxFail?: () => void;
  onDenied?: () => void;
  onStaffChange?: () => void;
}) {
  if (document.getElementById("sf-promo-admin")) return;

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

    let tab: "promo" | "staff" | "ads" = "promo";
    let editCode = "";
    let flash = "";
    let staff: StaffEntry[] = [
      { playerId: SUPER_ADMIN_PLAYER_ID, label: translate("admin.fixedAdmin"), fixed: true },
    ];
    let staffBusy = false;
    let promoBusy = false;
    let serverCustoms: ServerPromo[] = [];
    let serverBuiltins: ServerPromo[] = PROMO_DEFS.map((d) => ({
      ...d,
      custom: false,
      claimCount: 0,
    }));
    let promoLoaded = false;
    let totalClaims = 0;


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
      expiresAt: string;
      maxClaims: number;
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
      const unlockParts: string[] = [];
      if ((card.querySelector("#sf-pa-u-beam") as HTMLInputElement)?.checked)
        unlockParts.push("beam");
      if ((card.querySelector("#sf-pa-u-flame") as HTMLInputElement)?.checked)
        unlockParts.push("flame");
      if (unlockParts.length) grant.unlocks = unlockParts.join(",");
      const expiresAt =
        (card.querySelector("#sf-pa-exp") as HTMLInputElement)?.value || "";
      const maxClaims = Number(
        (card.querySelector("#sf-pa-max") as HTMLInputElement)?.value || 0,
      );
      return { code, label, grant, expiresAt, maxClaims };
    };

    const fillForm = (def?: ServerPromo | null) => {
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
      setN("#sf-pa-max", def?.maxClaims || 0);
      const unlocks = String(def?.grant?.unlocks || "")
        .toLowerCase()
        .split(",");
      const beamEl = card.querySelector(
        "#sf-pa-u-beam",
      ) as HTMLInputElement | null;
      const flameEl = card.querySelector(
        "#sf-pa-u-flame",
      ) as HTMLInputElement | null;
      if (beamEl) beamEl.checked = unlocks.includes("beam");
      if (flameEl) flameEl.checked = unlocks.includes("flame");
      const expEl = card.querySelector("#sf-pa-exp") as HTMLInputElement | null;
      if (expEl) {
        const raw = String(def?.expiresAt || "").trim();
        if (!raw) expEl.value = "";
        else {
          // date input wants YYYY-MM-DD
          const t = Date.parse(raw);
          if (Number.isFinite(t)) {
            const d = new Date(t);
            expEl.value = d.toISOString().slice(0, 10);
          } else if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
            expEl.value = raw.slice(0, 10);
          } else expEl.value = "";
        }
      }
    };

    async function reloadStaff() {
      const list = await fetchStaffList();
      staff = list.staff;
      opts.onStaffChange?.();
    }

    async function reloadPromos() {
      promoBusy = true;
      const res = await fetchAdminPromos();
      promoBusy = false;
      promoLoaded = true;
      if (res.ok) {
        serverCustoms = res.customs.map((c) => ({ ...c, custom: true }));
        serverBuiltins = res.builtins.map((b) => ({ ...b, custom: false }));
        totalClaims = res.totalClaims || 0;
      } else {
        flash =
          res.reason === "auth" || res.reason === "forbidden"
            ? translate("admin.needLogin")
            : translate("admin.loadFail", { r: res.reason || "error" });
      }
    }

    function renderPromoBody(): string {
      const customs = serverCustoms;
      const builtins = serverBuiltins;
      return `
      ${flash ? `<div style="font-size:11px;margin-bottom:8px;padding:8px;border-radius:8px;background:#1a2010;border:1px solid #664;color:#fec">${esc(flash)}</div>` : ""}
      <div style="font-size:10px;color:#8a7;margin-bottom:8px;line-height:1.4">
        ${translate("admin.lead")}<br/>
        ${translate("admin.uses", { n: totalClaims })}
        ${promoLoaded ? "" : ` · ${translate("admin.loading")}`}
        ${promoBusy ? ` · ${translate("admin.busy")}` : ""}
      </div>
      <div style="background:#0a141c;border:1px solid #345;border-radius:10px;padding:10px;margin-bottom:12px">
        <div style="font-size:11px;font-weight:700;color:#9cf;margin-bottom:8px">${editCode ? translate("admin.editCode", { code: esc(editCode) }) : translate("admin.newCode")}</div>
        <label style="display:block;font-size:10px;color:#8ab;margin-bottom:3px">${translate("admin.code")}</label>
        <input id="sf-pa-code" maxlength="24" placeholder="SUMMER2026" style="${inputStyle("margin-bottom:8px;text-transform:uppercase")}" />
        <label style="display:block;font-size:10px;color:#8ab;margin-bottom:3px">${translate("admin.label")}</label>
        <input id="sf-pa-label" maxlength="40" placeholder="${translate("admin.labelPh")}" style="${inputStyle("margin-bottom:8px")}" />
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
        <div style="background:#0a1810;border:1px solid #264;border-radius:8px;padding:8px;margin-bottom:10px">
          <div style="font-size:10px;font-weight:700;color:#9ec;margin-bottom:6px">${translate("admin.unlocks")}</div>
          <label style="display:inline-flex;align-items:center;gap:6px;font-size:11px;color:#cfe;margin-right:14px;cursor:pointer">
            <input type="checkbox" id="sf-pa-u-beam" /> OPT-LASER (beam)
          </label>
          <label style="display:inline-flex;align-items:center;gap:6px;font-size:11px;color:#cfe;cursor:pointer">
            <input type="checkbox" id="sf-pa-u-flame" /> FLAME (flame)
          </label>
          <div style="font-size:9px;color:#678;margin-top:6px;line-height:1.35">${translate("admin.unlockHint")}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
          <div>
            <label style="font-size:10px;color:#8ab">${translate("admin.expires")}</label>
            <input id="sf-pa-exp" type="date" style="${inputStyle()}" />
          </div>
          <div>
            <label style="font-size:10px;color:#8ab">${translate("admin.maxUse")}</label>
            <input id="sf-pa-max" type="number" min="0" max="1000000" value="0" style="${inputStyle()}" />
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" id="sf-pa-save" style="flex:1;${btnStyle("primary")}" ${promoBusy ? "disabled" : ""}>${editCode ? translate("admin.updDb") : translate("admin.addDb")}</button>
          <button type="button" id="sf-pa-clear" style="${btnStyle("ghost")}">${translate("admin.clear")}</button>
          <button type="button" id="sf-pa-reload" style="${btnStyle("ok")}">${translate("admin.reload")}</button>
        </div>
      </div>
      <div style="font-size:11px;font-weight:700;color:#fec;margin-bottom:6px">${translate("admin.customDb", { n: customs.length })}</div>
      <div id="sf-pa-custom" style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px"></div>
      <div style="font-size:11px;font-weight:700;color:#8ab;margin-bottom:6px">${translate("admin.builtin", { n: builtins.length })}</div>
      <div id="sf-pa-built" style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px"></div>
      `;
    }

    function renderStaffBody(): string {
      return `
      ${flash ? `<div style="font-size:11px;margin-bottom:8px;padding:8px;border-radius:8px;background:#1a2010;border:1px solid #664;color:#fec">${esc(flash)}</div>` : ""}
      <div style="font-size:10px;color:#8a7;margin-bottom:10px;line-height:1.45">
        ${translate("admin.staffLead", { id: esc(SUPER_ADMIN_PLAYER_ID) })}
      </div>
      <div style="background:#0a141c;border:1px solid #345;border-radius:10px;padding:10px;margin-bottom:12px">
        <div style="font-size:11px;font-weight:700;color:#9cf;margin-bottom:8px">${translate("admin.appoint")}</div>
        <label style="display:block;font-size:10px;color:#8ab;margin-bottom:3px">${translate("admin.playerId")}</label>
        <input id="sf-st-id" maxlength="32" placeholder="uxxxxxxxxxxxx" style="${inputStyle("margin-bottom:8px")}" />
        <label style="display:block;font-size:10px;color:#8ab;margin-bottom:3px">${translate("admin.nameOpt")}</label>
        <input id="sf-st-label" maxlength="40" placeholder="${translate("admin.namePh")}" style="${inputStyle("margin-bottom:10px")}" />
        <button type="button" id="sf-st-add" style="width:100%;${btnStyle("primary")}" ${staffBusy ? "disabled" : ""}>${translate("admin.appointBtn")}</button>
      </div>
      <div style="font-size:11px;font-weight:700;color:#fec;margin-bottom:6px">${translate("admin.staffList", { n: staff.length })}</div>
      <div id="sf-st-list" style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px"></div>
      `;
    }

    function renderAdsBody(): string {
      return `
      <div style="font-size:12px;color:#9bc;line-height:1.5;margin-bottom:12px">
        ${translate("admin.adsLead")}
      </div>
      <button type="button" id="sf-open-media-admin" style="width:100%;padding:12px;border-radius:8px;border:1px solid #6af;background:#1a4060;color:#dff;font-weight:800;cursor:pointer">
        ${translate("admin.openAds")}
      </button>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button type="button" id="sf-open-ad-portal"
           style="flex:1;box-sizing:border-box;padding:12px;border-radius:8px;border:1px solid #8cf;background:#102030;color:#cef;font-weight:800;cursor:pointer;text-align:center">
          ${translate("admin.openPortal")}
        </button>
        <button type="button" id="sf-portal-copy" style="flex-shrink:0;padding:12px 14px;border-radius:8px;border:1px solid #6af;background:#1a4060;color:#dff;font-weight:800;cursor:pointer;font-size:12px">
          ${translate("admin.copyUrl")}
        </button>
      </div>
      <a id="sf-portal-url" href="/partner" target="_blank" rel="noopener" title="${translate("common.open")}" style="display:block;font-size:10px;color:#8cf;margin-top:8px;word-break:break-all;text-align:center;user-select:all;cursor:pointer;padding:8px;border:1px dashed #356;border-radius:8px;background:#041018;text-decoration:none"></a>
      <div style="font-size:10px;color:#678;margin-top:10px;line-height:1.4;white-space:pre-line">
        ${translate("admin.adsHint")}
      </div>
      ${flash ? `<div style="margin-top:8px;font-size:11px;color:#fc8">${esc(flash)}</div>` : ""}
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
        <div style="font-size:14px;font-weight:800;color:#ffe088">${translate("admin.title")}</div>
        <button type="button" id="sf-pa-x" style="border:0;background:transparent;color:#9ab;font-size:20px;cursor:pointer;line-height:1">×</button>
      </div>
      <div style="font-size:10px;color:#8a7;margin-bottom:8px">
        ${translate("admin.operator", { id: esc(String(opts.playerId || "").slice(0, 28)), role: isSuperAdmin(opts.playerId) ? " · SUPER" : " · STAFF" })}
      </div>
      <div style="display:flex;gap:6px;margin-bottom:12px">
        <button type="button" id="sf-tab-promo" style="${btnStyle(tab === "promo" ? "tabOn" : "tab")}">${translate("admin.tabPromo")}</button>
        <button type="button" id="sf-tab-ads" style="${btnStyle(tab === "ads" ? "tabOn" : "tab")}">${translate("admin.tabAds")}</button>
        <button type="button" id="sf-tab-staff" style="${btnStyle(tab === "staff" ? "tabOn" : "tab")}">${translate("admin.tabStaff")}</button>
      </div>
      <div id="sf-pa-body">${tab === "promo" ? renderPromoBody() : tab === "ads" ? renderAdsBody() : renderStaffBody()}</div>
      `;

      card.querySelector("#sf-pa-x")!.addEventListener("click", close);
      card.querySelector("#sf-tab-promo")!.addEventListener("click", () => {
        tab = "promo";
        flash = "";
        render();
        void reloadPromos().then(() => render());
      });
      card.querySelector("#sf-tab-ads")!.addEventListener("click", () => {
        tab = "ads";
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
      else if (tab === "ads") bindAdsHandlers();
      else bindStaffHandlers();
    }

    function bindAdsHandlers() {
      const portalUrl = partnerPortalUrl();
      const setFlash = (msg: string) => {
        flash = msg;
        render();
      };
      const urlEl = card.querySelector("#sf-portal-url") as HTMLAnchorElement | null;
      if (urlEl) {
        urlEl.href = portalUrl;
        urlEl.textContent = portalUrl;
      }
      card.querySelector("#sf-open-ad-portal")?.addEventListener("click", () => {
        opts.sfxUi?.();
        openPartnerPortal();
      });
      card.querySelector("#sf-portal-copy")?.addEventListener("click", async () => {
        const ok = await copyText(portalUrl);
        if (ok) {
          opts.sfxOk?.();
          setFlash(translate("admin.copiedPortal"));
        } else {
          opts.sfxFail?.();
          setFlash(translate("admin.copyFail"));
        }
      });
      card.querySelector("#sf-open-media-admin")?.addEventListener("click", () => {
        opts.sfxUi?.();
        close();
        openMediaAdminDialog({
          playerId: opts.playerId,
          sfxUi: opts.sfxUi,
          sfxOk: opts.sfxOk,
          sfxFail: opts.sfxFail,
          onDenied: opts.onDenied,
        });
      });
    }

    function bindPromoHandlers() {
      const claimed = new Set(loadClaimedPromos(null));
      const customs = serverCustoms;
      const builtins = serverBuiltins;

      const bindRow = (host: HTMLElement, def: ServerPromo, isCustom: boolean) => {
        const row = document.createElement("div");
        const claimedMark = claimed.has(def.code) ? translate("admin.claimedLocal") : "";
        const uses = Number(def.claimCount) || 0;
        const max = Number(def.maxClaims) || 0;
        const expired = isCustom && isPromoExpired(def.expiresAt);
        const soldOut = isCustom && isPromoSoldOut(def.maxClaims, uses);
        const status =
          expired ? translate("admin.expired") : soldOut ? translate("admin.soldOut") : isCustom ? translate("admin.live") : translate("admin.always");
        const statusCol = expired || soldOut ? "#f88" : "#8ef";
        row.style.cssText =
          "background:#031018;border:1px solid #234;border-radius:8px;padding:8px";
        row.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
          <div style="font-size:12px;font-weight:700;color:${isCustom ? "#ffe088" : "#9cf"}">${esc(def.code)}${isCustom ? " · DB" : " 🔒"}</div>
          <div style="font-size:11px;font-weight:800;color:${statusCol};white-space:nowrap">${esc(status)}</div>
        </div>
        <div style="font-size:10px;color:#9ab;margin-top:2px">${esc(def.label)} · ${esc(formatGrantSummary(def.grant))}${esc(claimedMark)}</div>
        <div style="font-size:10px;color:#8ab;margin-top:3px">${esc(formatMaxClaimsLabel(max, uses))} · ${esc(isCustom ? formatExpiresLabel(def.expiresAt) : translate("admin.noExpire"))}</div>
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
            setFlash(translate("admin.copied", { url }));
          } catch {
            setFlash(url, true);
          }
        });
        if (isCustom) {
          addBtn(translate("admin.edit"), "ghost", () => {
            const snapshot = { ...def };
            flash = "";
            render();
            fillForm(snapshot);
          });
          addBtn(translate("admin.del"), "danger", () => {
            if (!confirm(translate("admin.delConfirm", { code: def.code }))) return;
            void (async () => {
              promoBusy = true;
              const r = await deleteAdminPromo(def.code);
              promoBusy = false;
              if (!r.ok) {
                setFlash(translate("admin.delFail", { r: r.reason || "error" }), false);
                return;
              }
              if (editCode === def.code) editCode = "";
              await reloadPromos();
              setFlash(translate("admin.deleted", { code: def.code }));
            })();
          });
        }
        addBtn(translate("admin.unclaimLocal"), "ghost", () => {
          unclaimPromoCode(def.code);
          setFlash(translate("admin.unclaimed", { code: def.code }));
        });
        host.appendChild(row);
      };

      const customHost = card.querySelector("#sf-pa-custom") as HTMLElement | null;
      if (customHost) {
        if (!promoLoaded && !customs.length) {
          customHost.innerHTML =
            `<div style="font-size:11px;color:#678;padding:6px">${translate("admin.loadingServer")}</div>`;
        } else if (!customs.length) {
          customHost.innerHTML =
            `<div style="font-size:11px;color:#678;padding:6px">${translate("admin.noCustom")}</div>`;
        } else {
          for (const d of customs) bindRow(customHost, d, true);
        }
      }
      const builtHost = card.querySelector("#sf-pa-built") as HTMLElement | null;
      if (builtHost) {
        for (const d of builtins) bindRow(builtHost, d, false);
      }

      card.querySelector("#sf-pa-reload")?.addEventListener("click", () => {
        void reloadPromos().then(() => {
          setFlash(translate("admin.reloaded"));
        });
      });

      card.querySelector("#sf-pa-save")?.addEventListener("click", () => {
        if (!isPromoAdminPlayer(opts.playerId)) {
          setFlash(translate("admin.adminOnly"), false);
          return;
        }
        const form = readForm();
        void (async () => {
          promoBusy = true;
          render();
          const res = await saveAdminPromo(form);
          promoBusy = false;
          if (!res.ok) {
            const msg =
              res.reason === "bad_code"
                ? translate("admin.badCode")
                : res.reason === "empty_grant"
                  ? translate("admin.needGrant")
                  : res.reason === "builtin_locked"
                    ? translate("admin.noOverwrite")
                    : res.reason === "auth" || res.reason === "forbidden"
                      ? translate("admin.loginAdmin")
                      : translate("admin.saveFail", { r: res.reason || "error" });
            setFlash(msg, false);
            return;
          }
          editCode = res.def?.code || form.code;
          await reloadPromos();
          setFlash(
            translate("admin.saved", { code: res.def?.code || form.code }),
          );
        })();
      });
      card.querySelector("#sf-pa-clear")?.addEventListener("click", () => {
        editCode = "";
        flash = "";
        render();
        fillForm(null);
      });
      if (editCode) {
        const cur = customs.find((d) => d.code === editCode);
        if (cur) fillForm(cur);
      }
    }

    function bindStaffHandlers() {
      const listHost = card.querySelector("#sf-st-list") as HTMLElement | null;
      if (listHost) {
        if (!staff.length) {
          listHost.innerHTML =
            `<div style="font-size:11px;color:#678;padding:6px">${translate("admin.loading")}</div>`;
        }
        for (const s of staff) {
          const row = document.createElement("div");
          const fixed = !!s.fixed || s.playerId === SUPER_ADMIN_PLAYER_ID;
          row.style.cssText =
            "background:#031018;border:1px solid #234;border-radius:8px;padding:8px";
          row.innerHTML = `
            <div style="font-size:12px;font-weight:700;color:${fixed ? "#9cf" : "#ffe088"}">${esc(s.playerId)}${fixed ? " 🔒" : ""}</div>
            <div style="font-size:10px;color:#9ab;margin-top:2px">${esc(s.label || (fixed ? translate("admin.fixedAdmin") : translate("admin.extraAdmin")))}${s.appointedBy ? ` · by ${esc(s.appointedBy)}` : ""}</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px"></div>
          `;
          const actions = row.lastElementChild as HTMLElement;
          if (!fixed) {
            const b = document.createElement("button");
            b.type = "button";
            b.textContent = translate("admin.dismiss");
            b.style.cssText = btnStyle("danger");
            b.onclick = () => {
              if (!confirm(translate("admin.dismissQ", { id: s.playerId }))) return;
              void (async () => {
                staffBusy = true;
                const r = await removeAppointedAdmin(s.playerId);
                staffBusy = false;
                if (!r.ok) {
                  setFlash(translate("admin.dismissFail", { r: r.reason || "error" }), false);
                  return;
                }
                await reloadStaff();
                setFlash(translate("admin.dismissed", { id: s.playerId }));
              })();
            };
            actions.appendChild(b);
          }
          listHost.appendChild(row);
        }
      }

      card.querySelector("#sf-st-add")?.addEventListener("click", () => {
        const rawId =
          (card.querySelector("#sf-st-id") as HTMLInputElement)?.value || "";
        const label =
          (card.querySelector("#sf-st-label") as HTMLInputElement)?.value || "";
        void (async () => {
          staffBusy = true;
          render();
          const r = await appointAdmin(rawId, label);
          staffBusy = false;
          if (!r.ok) {
            setFlash(translate("admin.appointFail", { r: r.reason || "error" }), false);
            return;
          }
          await reloadStaff();
          setFlash(translate("admin.appointed", { id: rawId }));
        })();
      });
    }

    // initial load
    void (async () => {
      await Promise.all([reloadPromos(), reloadStaff()]);
      render();
    })();
  }
}
