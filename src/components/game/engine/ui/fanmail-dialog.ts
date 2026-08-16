/**
 * Fan-mail dialog to sharer (recovered yi DOM).
 */

import { t as i18n } from "@/lib/i18n";

export type FanmailDialogHandlers = {
  host: HTMLElement;
  sanitize: (raw: string) => { ok: true; text: string } | { ok: false; reason: string };
  reasonText: (reason: string) => string;
  send: (text: string) => Promise<{ ok: boolean; reason?: string }>;
  onClose: () => void;
  onSent: () => void;
  playOk?: () => void;
  playError?: () => void;
};

const DLG_ID = "sf-mail-dlg";

export function closeFanmailDialog(): void {
  document.getElementById(DLG_ID)?.remove();
}

export function openFanmailDialog(h: FanmailDialogHandlers): boolean {
  if (document.getElementById(DLG_ID)) return false;

  const e = document.createElement("div");
  e.id = DLG_ID;
  e.setAttribute("role", "dialog");
  e.style.cssText = [
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
  e.innerHTML = `
        <div style="width:min(340px,100%);background:#0a1a14;border:2px solid #66ffcc;border-radius:12px;padding:16px 14px;color:#dff;box-shadow:0 8px 32px #000;">
          <div style="font-size:15px;font-weight:700;color:#8ff;margin-bottom:4px;">${i18n("mail.fanTitle")}</div>
          <div style="font-size:11px;color:#6a9;margin-bottom:10px;">${i18n("mail.fanLead")}</div>
          <textarea id="sf-mail-input" maxlength="80" rows="3" placeholder="${i18n("mail.fanPh")}"
            style="width:100%;box-sizing:border-box;resize:none;border-radius:8px;border:1px solid #2a6;background:#03140e;color:#efe;padding:10px;font-size:16px;line-height:1.4;"></textarea>
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button type="button" id="sf-mail-cancel"
              style="flex:1;padding:12px;border-radius:8px;border:1px solid #456;background:#123;color:#9ab;font-size:14px;">${i18n("common.cancel")}</button>
            <button type="button" id="sf-mail-send"
              style="flex:1.2;padding:12px;border-radius:8px;border:1px solid #8fc;background:#1a4030;color:#cff;font-size:14px;font-weight:700;">${i18n("mail.send")}</button>
          </div>
          <div id="sf-mail-status" style="margin-top:8px;min-height:1.2em;font-size:12px;color:#fc8;text-align:center;"></div>
        </div>`;

  if (!h.host.style.position || h.host.style.position === "static") {
    h.host.style.position = "relative";
  }
  h.host.appendChild(e);

  const t = e.querySelector("#sf-mail-input") as HTMLTextAreaElement | null;
  const r = e.querySelector("#sf-mail-status") as HTMLElement | null;
  const i = e.querySelector("#sf-mail-send") as HTMLButtonElement | null;
  const a = e.querySelector("#sf-mail-cancel") as HTMLButtonElement | null;

  setTimeout(() => t?.focus(), 50);
  const stop = (ev: Event) => ev.stopPropagation();
  e.addEventListener("pointerdown", stop);
  e.addEventListener("touchstart", stop, { passive: true });

  a &&
    (a.onclick = () => {
      e.remove();
      h.onClose();
    });

  i &&
    (i.onclick = () => {
      void (async () => {
        const sanitized = h.sanitize(t?.value || "");
        if (!sanitized.ok) {
          if (r) r.textContent = h.reasonText(sanitized.reason);
          h.playError?.();
          t?.focus();
          return;
        }
        if (i) i.disabled = true;
        if (r) r.textContent = i18n("mail.sending");
        const n = await h.send(sanitized.text);
        if (n.ok) {
          if (r) r.textContent = i18n("mail.sent");
          h.playOk?.();
          h.onSent();
          setTimeout(() => {
            e.remove();
            h.onClose();
          }, 700);
        } else {
          if (r) {
            r.textContent =
              n.reason === "missions"
                ? i18n("mail.incomplete")
                : n.reason === "already"
                  ? i18n("mail.already")
                  : h.reasonText(n.reason || "unsafe");
          }
          if (i) i.disabled = false;
          h.playError?.();
        }
      })();
    });

  return true;
}
