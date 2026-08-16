/**
 * Thanks-reply dialog for inbox mission messages (recovered loadLocalCommentsStore DOM).
 */

import { t as i18n } from "@/lib/i18n";

export type ThanksDialogHandlers = {
  host: HTMLElement;
  sanitize: (
    raw: string,
  ) => { ok: true; text: string } | { ok: false; reason: string };
  reasonText: (reason: string) => string;
  send: (text: string) => Promise<{ ok: boolean; reason?: string }>;
  onClose: () => void;
  onSent: () => void;
  playOk?: () => void;
  playError?: () => void;
  playUi?: () => void;
};

const DLG_ID = "sf-mail-dlg";

export function closeThanksDialog(): void {
  document.getElementById(DLG_ID)?.remove();
}

export function openThanksDialog(h: ThanksDialogHandlers): boolean {
  if (document.getElementById(DLG_ID)) return false;

  const t = document.createElement("div");
  t.id = DLG_ID;
  t.setAttribute("role", "dialog");
  t.style.cssText = [
    "position:absolute",
    "inset:0",
    "z-index:80",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "background:rgba(0,10,8,0.78)",
    "padding:16px",
    "box-sizing:border-box",
    "font-family:system-ui,sans-serif",
  ].join(";");
  t.innerHTML = `
        <div style="width:min(340px,100%);background:#0a1a14;border:2px solid #ffcc66;border-radius:12px;padding:16px 14px;color:#dff;box-shadow:0 8px 32px #000;">
          <div style="font-size:15px;font-weight:700;color:#ffcc88;margin-bottom:4px;">${i18n("mail.thanksTitle")}</div>
          <div style="font-size:11px;color:#9a8;margin-bottom:10px;">${i18n("mail.thanksLead")}</div>
          <textarea id="sf-mail-input" maxlength="80" rows="3" placeholder="${i18n("mail.fanPh")}"
            style="width:100%;box-sizing:border-box;resize:none;border-radius:8px;border:1px solid #2a6;background:#03140e;color:#efe;padding:10px;font-size:16px;line-height:1.4;"></textarea>
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button type="button" id="sf-mail-cancel"
              style="flex:1;padding:12px;border-radius:8px;border:1px solid #456;background:#123;color:#9ab;font-size:14px;">${i18n("common.cancel")}</button>
            <button type="button" id="sf-mail-send"
              style="flex:1.2;padding:12px;border-radius:8px;border:1px solid #fc6;background:#403010;color:#ffe;font-size:14px;font-weight:700;">${i18n("mail.thanksSend")}</button>
          </div>
          <div id="sf-mail-status" style="margin-top:8px;min-height:1.2em;font-size:12px;color:#fc8;text-align:center;"></div>
        </div>`;

  if (!h.host.style.position || h.host.style.position === "static") {
    h.host.style.position = "relative";
  }
  h.host.appendChild(t);

  const input = t.querySelector("#sf-mail-input") as HTMLTextAreaElement | null;
  const status = t.querySelector("#sf-mail-status") as HTMLElement | null;
  const sendBtn = t.querySelector("#sf-mail-send") as HTMLButtonElement | null;
  const cancelBtn = t.querySelector(
    "#sf-mail-cancel",
  ) as HTMLButtonElement | null;

  setTimeout(() => input?.focus(), 50);
  const stop = (ev: Event) => ev.stopPropagation();
  t.addEventListener("pointerdown", stop);
  t.addEventListener("touchstart", stop, { passive: true });

  if (cancelBtn) {
    cancelBtn.onclick = () => {
      t.remove();
      h.onClose();
      h.playUi?.();
    };
  }

  if (sendBtn) {
    sendBtn.onclick = () => {
      void (async () => {
        const sanitized = h.sanitize(input?.value || "");
        if (!sanitized.ok) {
          if (status) status.textContent = h.reasonText(sanitized.reason);
          h.playError?.();
          return;
        }
        sendBtn.disabled = true;
        if (status) status.textContent = i18n("mail.sending");
        const res = await h.send(sanitized.text);
        if (res.ok) {
          if (status) status.textContent = i18n("mail.sent");
          h.playOk?.();
          h.onSent();
          setTimeout(() => {
            t.remove();
            h.onClose();
          }, 700);
        } else {
          if (status) {
            status.textContent =
              res.reason === "already"
                ? i18n("mail.thanksOnce")
                : res.reason === "not_mission"
                  ? i18n("mail.thanksNeed")
                  : h.reasonText(res.reason || "unsafe");
          }
          sendBtn.disabled = false;
          h.playError?.();
        }
      })();
    };
  }

  return true;
}

export function thanksBlockedMessage(msg: {
  source?: string;
  thanksSent?: boolean;
}): string {
  if (msg.source === "thanks") return i18n("mail.thanksNeed");
  if (msg.thanksSent) return i18n("mail.thanksDone");
  return i18n("mail.thanksOnly");
}
