/**
 * Account link dialog DOM (title LINK button).
 * Behavior callbacks injected — no game state imports.
 */

export type AccountProvider = { providerId: string; label: string };

export type AccountDialogState = {
  linked: boolean;
  name: string | null;
  email: string | null;
  playerId: string;
  coins: number;
};

export type AccountDialogHandlers = {
  providers: readonly AccountProvider[];
  onClose: () => void;
  /** After successful OAuth + cloud bind */
  onSignIn: (providerId: string) => Promise<{ linked: boolean } | void>;
  onSignOut: () => Promise<void>;
  onOpenProfile: () => void;
  onOpenStats: () => void;
  /** Re-open dialog KEY_CLOUD_INBOX refresh UI after link */
  onAfterLink: () => void;
  playUi?: () => void;
  playError?: () => void;
};

const DLG_ID = "sf-account-dlg";

export function isAccountDialogOpen(): boolean {
  return !!document.getElementById(DLG_ID);
}

export function closeAccountDialog(): void {
  document.getElementById(DLG_ID)?.remove();
}

function buildHtml(state: AccountDialogState, providers: readonly AccountProvider[]): string {
  const display = state.linked
    ? state.name || state.email || "LINKED"
    : "ゲスト";
  const providerBtns = providers
    .map(
      (e) => `<button type="button" data-provider="${e.providerId}" class="sf-acc-btn"
                style="width:100%;padding:12px;margin-top:8px;border-radius:8px;border:1px solid #4a8;background:#0a2818;color:#cfe;font-size:14px;font-weight:600;cursor:pointer;">
                ${e.label === "X" ? "𝕏" : e.label} で連携
              </button>`,
    )
    .join("");
  const linkedActions = state.linked
    ? `<button type="button" id="sf-acc-profile" style="width:100%;padding:12px;margin-top:10px;border-radius:8px;border:1px solid #4a8;background:#0a2818;color:#cfe;font-size:14px;font-weight:600;cursor:pointer;">プロフィール設定</button>
                <button type="button" id="sf-acc-stats" style="width:100%;padding:10px;margin-top:8px;border-radius:8px;border:1px solid #468;background:#0a1820;color:#adf;font-size:13px;cursor:pointer;">ゲーム情報</button>
                <button type="button" id="sf-acc-logout"
                  style="width:100%;padding:12px;margin-top:8px;border-radius:8px;border:1px solid #844;background:#2a1010;color:#fcc;font-size:14px;cursor:pointer;">連携解除</button>`
    : providerBtns;

  return `
        <div style="width:min(300px,100%);margin-top:8px;background:#061a12;border:2px solid #66ffaa;border-radius:12px;padding:14px 12px;color:#dff;box-shadow:0 8px 28px #000;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div style="font-size:14px;font-weight:700;color:#8ff;">アカウント連携</div>
            <button type="button" id="sf-acc-close" style="border:0;background:transparent;color:#9ab;font-size:18px;cursor:pointer;line-height:1;">×</button>
          </div>
          <div style="font-size:11px;color:#6a9;line-height:1.4;margin-bottom:10px;">
            X / Google と連携すると引き継ぎます<br/>
            · コンティニューコイン<br/>
            · イージーのパワーアップ<br/>
            · INBOXメッセージ<br/>
            · OPT-LASER / FLAME 解放<br/>
            · 攻撃Lv20まで解禁<br/>
            · SOUND TEST（全曲試聴）<br/>
            · プロフィール / シェア文40字<br/>
            · ゲーム情報（統計画面）
          </div>
          <div style="background:#03140e;border-radius:8px;padding:10px;border:1px solid #245;">
            <div style="font-size:10px;color:#6a8;">STATUS</div>
            <div id="sf-acc-status" style="font-size:13px;font-weight:700;color:${state.linked ? "#8f8" : "#fc8"};margin-top:2px;">
              ${state.linked ? "連携中" : "未連携（ゲスト）"}
            </div>
            <div id="sf-acc-name" style="font-size:12px;color:#cfe;margin-top:4px;word-break:break-all;">${display}</div>
            <div style="font-size:10px;color:#567;margin-top:6px;">ID ${state.playerId}</div>
            <div style="font-size:10px;color:#aa8;margin-top:2px;">COIN ×${state.coins}</div>
          </div>
          <div id="sf-acc-actions">${linkedActions}</div>
          <div id="sf-acc-msg" style="min-height:1.2em;margin-top:8px;font-size:11px;color:#fc8;text-align:center;"></div>
        </div>`;
}

/** Mount account dialog under host. Returns false if already open. */
export function openAccountDialog(
  host: HTMLElement,
  state: AccountDialogState,
  handlers: AccountDialogHandlers,
): boolean {
  if (document.getElementById(DLG_ID)) return false;

  const el = document.createElement("div");
  el.id = DLG_ID;
  el.setAttribute("role", "dialog");
  el.style.cssText = [
    "position:absolute",
    "inset:0",
    "z-index:90",
    "display:flex",
    "align-items:flex-start",
    "justify-content:flex-end",
    "background:rgba(0,8,6,0.72)",
    "padding:12px",
    "box-sizing:border-box",
    "font-family:system-ui,sans-serif",
  ].join(";");
  el.innerHTML = buildHtml(state, handlers.providers);

  if (!host.style.position || host.style.position === "static") {
    host.style.position = "relative";
  }
  host.appendChild(el);

  const stop = (e: Event) => e.stopPropagation();
  el.addEventListener("pointerdown", stop);
  el.addEventListener("touchstart", stop, { passive: true });

  const msg = el.querySelector("#sf-acc-msg") as HTMLElement | null;
  let busy = false;

  el.querySelector("#sf-acc-close")?.addEventListener("click", () => {
    el.remove();
    handlers.onClose();
  });

  el.querySelector("#sf-acc-profile")?.addEventListener("click", () => {
    el.remove();
    handlers.onOpenProfile();
  });
  el.querySelector("#sf-acc-stats")?.addEventListener("click", () => {
    el.remove();
    handlers.onOpenStats();
  });

  el.querySelectorAll("[data-provider]").forEach((btn) => {
    btn.addEventListener("click", () => {
      void (async () => {
        if (busy) return;
        busy = true;
        if (msg) msg.textContent = "連携中…（ポップアップを許可してください）";
        const providerId = (btn as HTMLElement).dataset.provider || "";
        try {
          const acc = await handlers.onSignIn(providerId);
          if (acc && "linked" in acc && !acc.linked) {
            if (msg) msg.textContent = "認証は完了しましたが同期に失敗。もう一度お試しください";
            handlers.playError?.();
            return;
          }
          if (msg) msg.textContent = "連携しました";
          handlers.playUi?.();
          el.remove();
          handlers.onAfterLink();
        } catch (err) {
          let m = err instanceof Error ? err.message : "連携に失敗しました";
          if (/popup|Pop-up|blocked/i.test(m)) {
            m = "ポップアップがブロックされました。許可して再試行してください";
          }
          if (msg) msg.textContent = m;
          handlers.playError?.();
        } finally {
          busy = false;
        }
      })();
    });
  });

  el.querySelector("#sf-acc-logout")?.addEventListener("click", () => {
    void (async () => {
      if (busy) return;
      busy = true;
      if (msg) msg.textContent = "解除中…";
      try {
        await handlers.onSignOut();
      } catch {
        /* parent handles */
      } finally {
        busy = false;
      }
    })();
  });

  return true;
}
