/**
 * How-to / explanation overlay. Tutorial Easy starts only from here.
 */

import { translate, onLocaleChange } from "@/lib/i18n";
import {
  TUTORIAL_MISSIONS,
  formatTutorialReward,
  isTutorialClaimed,
  missionHint,
  missionLabel,
  tutorialProgress,
} from "@/lib/tutorial";

export type HelpDialogOpts = {
  onClose?: () => void;
  onStartTutorial: () => void;
  sfxUi?: () => void;
  sfxOk?: () => void;
};

let helpCleanup: (() => void) | null = null;

function el(tag: string, css: string, text?: string) {
  const n = document.createElement(tag);
  n.style.cssText = css;
  if (text != null) n.textContent = text;
  return n;
}

export function closeHelpDialog() {
  try {
    helpCleanup?.();
  } catch {
    /* */
  }
  helpCleanup = null;
  document.getElementById("sf-help-root")?.remove();
}

export function openHelpDialog(opts: HelpDialogOpts): void {
  closeHelpDialog();

  const root = el(
    "div",
    "position:fixed;inset:0;z-index:99980;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;padding:12px;font-family:system-ui,sans-serif",
  );
  root.id = "sf-help-root";
  const card = el(
    "div",
    "width:min(440px,96vw);max-height:92vh;overflow:auto;background:#061018;border:1px solid #3a6;border-radius:12px;padding:14px 14px 12px;color:#def;box-shadow:0 12px 40px #000a",
  );
  root.appendChild(card);
  document.body.appendChild(root);

  const unsub = onLocaleChange(() => paint());

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      opts.sfxUi?.();
      close();
    }
  };

  const close = () => {
    window.removeEventListener("keydown", onKey);
    unsub();
    helpCleanup = null;
    root.remove();
    opts.onClose?.();
  };
  helpCleanup = close;
  window.addEventListener("keydown", onKey);

  const section = (title: string, body: string) => {
    const box = el(
      "div",
      "background:#0a1520;border:1px solid #234;border-radius:10px;padding:10px;margin-bottom:8px",
    );
    box.append(
      el("div", "font-size:12px;font-weight:800;color:#9ef;margin-bottom:4px", title),
      el("div", "font-size:11px;color:#bcd;line-height:1.45", body),
    );
    return box;
  };

  const paint = () => {
    const prog = tutorialProgress();
    card.replaceChildren();

    const head = el(
      "div",
      "display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px",
    );
    const left = el("div");
    left.append(
      el("div", "font-size:15px;font-weight:800;color:#9ef", translate("help.title")),
      el("div", "font-size:10px;color:#8ab;margin-top:4px;line-height:1.4", translate("help.lead")),
    );
    const btnX = el(
      "button",
      "background:#123;border:1px solid #456;color:#cde;border-radius:8px;padding:6px 10px;cursor:pointer;flex-shrink:0",
      translate("help.close"),
    ) as HTMLButtonElement;
    btnX.type = "button";
    btnX.addEventListener("click", () => {
      opts.sfxUi?.();
      close();
    });
    head.append(left, btnX);
    card.appendChild(head);

    card.append(
      section(translate("help.coinTitle"), translate("help.coinBody")),
      section(translate("help.shopTitle"), translate("help.shopBody")),
      section(translate("help.optTitle"), translate("help.optBody")),
      section(translate("help.promoTitle"), translate("help.promoBody")),
    );

    const mis = el(
      "div",
      "background:#0a1810;border:1px solid #364;border-radius:10px;padding:10px;margin-bottom:10px",
    );
    mis.append(
      el("div", "font-size:12px;font-weight:800;color:#cfe;margin-bottom:6px", translate("tutorial.title")),
      el(
        "div",
        "font-size:10px;color:#8ab;margin-bottom:8px",
        translate("tutorial.sum", {
          got: prog.got,
          all: prog.all,
          coins: prog.coins,
          ticket: prog.ticket > 0 ? translate("tutorial.ticketBit", { n: prog.ticket }) : "",
        }),
      ),
    );
    for (const m of TUTORIAL_MISSIONS) {
      const done = isTutorialClaimed(m.id);
      const row = el(
        "div",
        `display:flex;justify-content:space-between;gap:8px;align-items:flex-start;padding:6px 0;border-top:1px solid #1a2a22`,
      );
      const info = el("div");
      info.append(
        el(
          "div",
          `font-size:11px;font-weight:700;color:${done ? "#8a8" : "#def"}`,
          `${done ? "✓ " : "○ "}${missionLabel(m.id)}`,
        ),
        el("div", "font-size:9px;color:#678;margin-top:1px", missionHint(m.id)),
      );
      const pay = el(
        "div",
        `font-size:10px;font-weight:800;color:${done ? "#686" : "#fe8"};white-space:nowrap`,
        done ? translate("tutorial.claimed") : formatTutorialReward(m.coins, m.ticket),
      );
      row.append(info, pay);
      mis.appendChild(row);
    }
    card.appendChild(mis);

    const start = el(
      "button",
      "width:100%;padding:14px;border-radius:10px;border:1px solid #8c4;background:linear-gradient(180deg,#1a5030,#0e2818);color:#dfe;font-weight:800;font-size:14px;cursor:pointer",
      translate("help.start"),
    ) as HTMLButtonElement;
    start.type = "button";
    start.addEventListener("click", () => {
      opts.sfxOk?.();
      close();
      opts.onStartTutorial();
    });
    card.append(
      start,
      el(
        "div",
        "font-size:9px;color:#8ab;margin-top:6px;text-align:center;line-height:1.35",
        `${translate("help.startHint")}${prog.got > 0 ? " · " + translate("help.already") : ""}`,
      ),
    );
  };

  root.addEventListener("click", (e) => {
    if (e.target === root) {
      opts.sfxUi?.();
      close();
    }
  });

  paint();
}

export function openTutorialClearDialog(opts: {
  onClose: () => void;
  sfxUi?: () => void;
}): void {
  closeHelpDialog();
  const root = el(
    "div",
    "position:fixed;inset:0;z-index:99985;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;padding:12px;font-family:system-ui,sans-serif",
  );
  root.id = "sf-help-root";
  const card = el(
    "div",
    "width:min(400px,94vw);background:#061018;border:1px solid #6a4;border-radius:14px;padding:18px 16px 14px;color:#def;box-shadow:0 12px 40px #000a;text-align:center",
  );
  const close = () => {
    window.removeEventListener("keydown", onKey);
    helpCleanup = null;
    root.remove();
    opts.onClose();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" || e.key === "Enter") {
      e.preventDefault();
      opts.sfxUi?.();
      close();
    }
  };
  helpCleanup = close;
  window.addEventListener("keydown", onKey);

  card.append(
    el("div", "font-size:13px;font-weight:800;letter-spacing:.08em;color:#fe8;margin-bottom:8px", "TUTORIAL CLEAR"),
    el("div", "font-size:18px;font-weight:900;color:#9ef;line-height:1.35;margin-bottom:10px", translate("tutorial.clearTitle")),
    el("div", "font-size:12px;color:#bcd;line-height:1.45;margin-bottom:16px", translate("tutorial.clearLead")),
  );
  const btn = el(
    "button",
    "width:100%;padding:14px;border-radius:10px;border:1px solid #8c4;background:linear-gradient(180deg,#1a5030,#0e2818);color:#dfe;font-weight:800;font-size:14px;cursor:pointer",
    translate("tutorial.clearOk"),
  ) as HTMLButtonElement;
  btn.type = "button";
  btn.addEventListener("click", () => {
    opts.sfxUi?.();
    close();
  });
  card.appendChild(btn);
  root.appendChild(card);
  root.addEventListener("click", (e) => {
    if (e.target === root) {
      opts.sfxUi?.();
      close();
    }
  });
  document.body.appendChild(root);
}

