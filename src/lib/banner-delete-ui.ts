/**
 * JPDOC: バナー削除の3段確認。クレジットもアップロード枠も戻らない。
 */
/** 3-step last-resort confirm before deleting a partner banner. */

import { translate } from "@/lib/i18n";

export function confirmBannerDelete(opts?: {
  sfxUi?: () => void;
}): Promise<boolean> {
  return new Promise((resolve) => {
    document.getElementById("sf-bn-del-root")?.remove();
    const root = document.createElement("div");
    root.id = "sf-bn-del-root";
    root.style.cssText =
      "position:fixed;inset:0;z-index:100040;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;padding:14px;font-family:system-ui,sans-serif";
    const card = document.createElement("div");
    card.style.cssText =
      "width:min(400px,96vw);background:#140808;border:2px solid #a64;border-radius:12px;padding:16px;color:#fee;box-shadow:0 16px 40px #000c";
    root.appendChild(card);
    document.body.appendChild(root);

    const steps = [
      { n: 1, title: translate("bannerDel.s1t"), body: translate("bannerDel.s1b"), next: translate("bannerDel.next") },
      { n: 2, title: translate("bannerDel.s2t"), body: translate("bannerDel.s2b"), next: translate("bannerDel.next") },
      { n: 3, title: translate("bannerDel.s3t"), body: translate("bannerDel.s3b"), next: translate("bannerDel.last") },
    ];
    let i = 0;
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      opts?.sfxUi?.();
      root.remove();
      resolve(ok);
    };

    const paint = () => {
      const s = steps[i]!;
      const last = i >= steps.length - 1;
      card.innerHTML = `
        <div style="font-size:10px;font-weight:800;letter-spacing:.08em;color:#fc8;margin-bottom:6px">${translate("bannerDel.stepOf", { n: s.n })}</div>
        <div style="font-size:16px;font-weight:800;color:#fcc;margin-bottom:8px">${s.title}</div>
        <div style="font-size:13px;line-height:1.55;color:#edc;background:#1a0c0c;border:1px solid #643;border-radius:8px;padding:10px;margin-bottom:14px">${s.body}</div>
        <div style="display:flex;gap:8px">
          <button type="button" id="sf-bd-no" style="flex:1;padding:12px;border-radius:10px;border:1px solid #567;background:#1a2428;color:#cde;font-weight:700;cursor:pointer">${i === 0 ? translate("bannerDel.stop") : translate("bannerDel.back")}</button>
          <button type="button" id="sf-bd-yes" style="flex:1.2;padding:12px;border-radius:10px;border:1px solid ${last ? "#c64" : "#864"};background:${last ? "#501818" : "#301010"};color:#fcc;font-weight:800;cursor:pointer">${s.next}</button>
        </div>
      `;
      card.querySelector("#sf-bd-no")?.addEventListener("click", () => {
        opts?.sfxUi?.();
        if (i === 0) finish(false);
        else {
          i -= 1;
          paint();
        }
      });
      card.querySelector("#sf-bd-yes")?.addEventListener("click", () => {
        opts?.sfxUi?.();
        if (last) finish(true);
        else {
          i += 1;
          paint();
        }
      });
    };

    root.addEventListener("click", (e) => {
      if (e.target === root) finish(false);
    });
    paint();
  });
}
