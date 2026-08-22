/**
 * JPDOC: チュートリアルの左下ドック。受け取った報酬は二度出さない。
 */
/**
 * Bottom-left tutorial dock (same shape as the ad-watch coin history).
 * Only mounted during a How-To-launched Easy run.
 */

import { translate, onLocaleChange } from "@/lib/i18n";
import {
  TUTORIAL_MISSIONS,
  claimTutorialMission,
  formatTutorialReward,
  isTutorialClaimed,
  missionHint,
  missionLabel,
  tutorialClaims,
  tutorialProgress,
  type TutorialMissionId,
} from "@/lib/tutorial";

export type TutorialDockOpts = {
  playerId: string;
  onGrant?: (coins: number, ticket: number, balance: number) => void;
  onToast?: (text: string) => void;
  sfxOk?: () => void;
  sfxUi?: () => void;
};

function el(tag: string, css: string, text?: string) {
  const n = document.createElement(tag);
  n.style.cssText = css;
  if (text != null) n.textContent = text;
  return n;
}

let mounted: {
  root: HTMLElement;
  unsub: () => void;
  opts: TutorialDockOpts;
  open: boolean;
  paint: () => void;
} | null = null;

export function isTutorialDockOpen(): boolean {
  return !!mounted;
}

export function unmountTutorialDock() {
  if (!mounted) return;
  mounted.unsub();
  mounted.root.remove();
  mounted = null;
}

export function mountTutorialDock(opts: TutorialDockOpts) {
  unmountTutorialDock();

  const root = el(
    "div",
    "position:fixed;left:10px;bottom:10px;z-index:80;font-family:system-ui,sans-serif",
  );
  root.id = "sf-tutorial-dock";
  const btn = el(
    "button",
    "padding:8px 10px;border-radius:999px;border:1px solid #4a6;background:#0c1c16;color:#cfe;font-size:11px;font-weight:800;cursor:pointer;box-shadow:0 6px 18px #000a;letter-spacing:.02em;max-width:min(220px,70vw);overflow:hidden;text-overflow:ellipsis;white-space:nowrap",
    translate("tutorial.dock"),
  ) as HTMLButtonElement;
  btn.type = "button";
  btn.setAttribute("aria-expanded", "false");
  const panel = el(
    "div",
    "display:none;position:absolute;left:0;bottom:calc(100% + 8px);width:min(280px,calc(100vw - 24px));max-height:min(46vh,320px);overflow:auto;padding:10px;border-radius:10px;background:#07140f;border:1px solid #3a6;color:#def;box-shadow:0 10px 28px #000c",
  );
  root.append(btn, panel);
  document.body.appendChild(root);

  let open = false;
  const show = () => {
    panel.style.display = "block";
    btn.setAttribute("aria-expanded", "true");
  };
  const hide = () => {
    if (open) return;
    panel.style.display = "none";
    btn.setAttribute("aria-expanded", "false");
  };

  const paint = () => {
    const prog = tutorialProgress();
    const nextName = prog.next ? missionLabel(prog.next.id) : "";
    btn.textContent = prog.next
      ? translate("tutorial.dockNext", { name: nextName })
      : `${translate("tutorial.dock")} · ${translate("tutorial.dockDone")}`;

    panel.replaceChildren();
    panel.append(
      el("div", "font-size:11px;font-weight:800;color:#9ef;margin-bottom:4px", translate("tutorial.title")),
      el(
        "div",
        "font-size:10px;color:#8ab;margin-bottom:8px;line-height:1.35",
        translate("tutorial.sum", {
          got: prog.got,
          all: prog.all,
          coins: prog.coins,
          ticket: prog.ticket > 0 ? translate("tutorial.ticketBit", { n: prog.ticket }) : "",
        }),
      ),
    );
    const list = el("div", "display:flex;flex-direction:column;gap:6px");
    for (const m of TUTORIAL_MISSIONS) {
      const done = isTutorialClaimed(m.id);
      const item = el(
        "div",
        "padding:6px 7px;border-radius:8px;background:#0a1812;border:1px solid #234",
      );
      const top = el(
        "div",
        "display:flex;justify-content:space-between;gap:8px;align-items:baseline",
      );
      top.append(
        el(
          "div",
          `font-size:11px;font-weight:700;color:${done ? "#9c9" : "#def"}`,
          `${done ? "✓ " : "○ "}${missionLabel(m.id)}`,
        ),
        el(
          "div",
          `font-size:10px;font-weight:900;color:${done ? "#686" : "#fe8"}`,
          done ? translate("tutorial.claimed") : formatTutorialReward(m.coins, m.ticket),
        ),
      );
      item.append(top, el("div", "font-size:9px;color:#678;margin-top:2px", missionHint(m.id)));
      list.appendChild(item);
    }
    const hist = tutorialClaims();
    if (hist.length) {
      list.appendChild(el("div", "font-size:10px;color:#8ab;margin-top:4px", translate("watch.histTitle")));
      for (const row of hist.slice(0, 8)) {
        const when = new Date(row.at);
        const stamp = Number.isNaN(when.getTime())
          ? ""
          : `${when.getMonth() + 1}/${when.getDate()} ${String(when.getHours()).padStart(2, "0")}:${String(when.getMinutes()).padStart(2, "0")}`;
        const h = el(
          "div",
          "padding:5px 7px;border-radius:8px;background:#081410;border:1px solid #1a2a22;display:flex;justify-content:space-between;gap:8px",
        );
        h.append(
          el("div", "font-size:10px;color:#8ab", stamp),
          el("div", "font-size:10px;color:#cfe", `${missionLabel(row.id)} · ${formatTutorialReward(row.coins, row.ticket)}`),
        );
        list.appendChild(h);
      }
    } else {
      list.appendChild(el("div", "font-size:11px;color:#678;line-height:1.4", translate("tutorial.empty")));
    }
    panel.appendChild(list);
  };

  root.addEventListener("mouseenter", show);
  root.addEventListener("mouseleave", hide);
  root.addEventListener("pointerdown", (e) => e.stopPropagation());
  root.addEventListener("click", (e) => e.stopPropagation());
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    opts.sfxUi?.();
    open = !open;
    if (open) show();
    else {
      panel.style.display = "none";
      btn.setAttribute("aria-expanded", "false");
    }
  });

  const unsub = onLocaleChange(() => paint());
  mounted = { root, unsub, opts, open, paint };
  paint();
}

export function noteTutorialEvent(id: TutorialMissionId): boolean {
  if (!mounted) return false;
  if (isTutorialClaimed(id) && id !== "kills") {
    // already paid — still refresh so the checkmark is current
    mounted.paint();
    return false;
  }
  if (isTutorialClaimed(id)) {
    mounted.paint();
    return false;
  }
  const res = claimTutorialMission(id, mounted.opts.playerId);
  mounted.paint();
  if (!res.ok) return false;
  if (res.already) {
    mounted.opts.onToast?.(translate("tutorial.already", { name: missionLabel(id) }));
    return false;
  }
  mounted.opts.onGrant?.(res.coins, res.ticket, res.balance);
  mounted.opts.onToast?.(
    translate("tutorial.toast", {
      name: missionLabel(id),
      reward: formatTutorialReward(res.coins, res.ticket),
    }),
  );
  mounted.opts.sfxOk?.();
  return true;
}
