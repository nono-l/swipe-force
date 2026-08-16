// @ts-nocheck
/**
 * Sound-test comment composer (write form).
 * Recovered `Pi` — gate (link required / busy) stays in game.
 */
import { translate as i18n } from "@/lib/i18n";
export type SoundCommentComposerOpts = {
  trackKey: string;
  trackCard: { cat: string; key: string; title: string };
  mode: string;
  modeIndex: number;
  playerId: string;
  setComposing: (v: boolean) => void;
  postComment: (
    trackKey: string,
    playerId: string,
    body: string,
    urls: string[],
    kind: string,
  ) => Promise<{ ok: boolean; reason?: string }>;
  onPosted: (trackKey: string) => Promise<void>;
  playOk: () => void;
  playError: () => void;
};

export function openSoundCommentComposer(opts: SoundCommentComposerOpts) {
let e = opts.trackKey;
            opts.setComposing(true);
            let t = document.createElement(`div`);
            t.style.cssText = `position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.78);display:flex;align-items:flex-start;justify-content:center;font-family:system-ui,sans-serif;overflow:auto;padding:16px 8px;`;
            let n = document.createElement(`div`);
            n.style.cssText = `width:min(360px,94vw);background:#0a1a14;border:2px solid #44ffaa;border-radius:10px;padding:14px;color:#dff;margin:auto;`;
            let r = opts.trackCard,
                i = r.title.replace(/[<>&"']/g, ``);
            n.innerHTML = `
        <div style="font-size:13px;font-weight:700;margin-bottom:4px;color:#8f8">${i18n("comment.title")}</div>
        <div style="background:#041810;border:1px solid #3a6;border-radius:8px;padding:8px 10px;margin-bottom:10px">
          <div style="font-size:10px;color:#8fd;font-weight:700;letter-spacing:.06em">${i18n("comment.onThis")}</div>
          <div style="font-size:11px;color:#fc8;margin-top:2px">${r.cat.replace(/[<>&"']/g,``)}${opts.mode === `title`?``:` `+String(opts.modeIndex).padStart(2,`0`)}</div>
          <div style="font-size:13px;color:#ffe;font-weight:700;margin-top:2px;word-break:break-all">${i}</div>
          <div style="font-size:10px;color:#567;margin-top:2px">track: ${r.key}</div>
        </div>
        <div style="font-size:11px;color:#9ab;margin-bottom:6px">${i18n("comment.kind")}</div>
        <div id="stc-kinds" style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">
          <button type="button" data-kind="note" class="stc-kind" style="padding:6px 10px;border-radius:6px;border:1px solid #4a6;background:#1a4030;color:#cfe;font-size:11px">${i18n("sound.kindNote")}</button>
          <button type="button" data-kind="arrange" class="stc-kind" style="padding:6px 10px;border-radius:6px;border:1px solid #456;background:#123;color:#9ab;font-size:11px">${i18n("sound.kindArrange")}</button>
          <button type="button" data-kind="cover" class="stc-kind" style="padding:6px 10px;border-radius:6px;border:1px solid #456;background:#123;color:#9ab;font-size:11px">${i18n("sound.kindCover")}</button>
        </div>
        <textarea id="stc-body" maxlength="2000" rows="5" placeholder="${i18n("comment.bodyPh")}" style="width:100%;box-sizing:border-box;background:#001a10;color:#efe;border:1px solid #2a6;border-radius:6px;padding:8px;font-size:13px;resize:vertical;min-height:90px"></textarea>
        <div id="stc-count" style="font-size:10px;color:#6a8;text-align:right;margin:2px 0 8px">0 / 2000</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <div style="font-size:11px;color:#9ab">リンク URL（https）</div>
          <button id="stc-add-url" type="button" style="padding:4px 10px;background:#245;color:#def;border:1px solid #4a8;border-radius:6px;font-size:11px;font-weight:700">＋ ADD</button>
        </div>
        <div id="stc-urls" style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px"></div>
        <div style="font-size:10px;color:#678;margin-bottom:6px">${i18n("comment.urlHint")}</div>
        <div id="stc-status" style="font-size:11px;color:#aa8;min-height:16px;margin:6px 0"></div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button id="stc-cancel" type="button" style="padding:8px 12px;background:#234;color:#cde;border:1px solid #456;border-radius:6px">${i18n("common.close")}</button>
          <button id="stc-send" type="button" style="padding:8px 12px;background:#1a5;color:#fff;border:1px solid #4f8;border-radius:6px;font-weight:700">${i18n("comment.post")}</button>
        </div>`, t.appendChild(n), document.body.appendChild(t);
            let a = `note`,
                o = () => n.querySelectorAll(`.stc-kind`),
                s = () => {
                    o().forEach(e => {
                        let t = e,
                            n = t.dataset.kind === a;
                        t.style.background = n ? `#1a4030` : `#123`, t.style.borderColor = n ? `#4a6` : `#456`, t.style.color = n ? `#cfe` : `#9ab`
                    })
                };
            o().forEach(e => e.addEventListener(`click`, () => {
                a = e.dataset.kind || `note`, s()
            })), s();
            let c = n.querySelector(`#stc-urls`),
                l = n.querySelector(`#stc-status`),
                u = (e = ``) => {
                    if (c.children.length >= 20) {
                        l.textContent = i18n("comment.urlLimit"), opts.playError();
                        return
                    }
                    let t = document.createElement(`div`);
                    t.style.cssText = `display:flex;gap:6px;align-items:center`;
                    let n = document.createElement(`input`);
                    n.type = `url`, n.placeholder = `https://… (${c.children.length+1}/20)`, n.value = e, n.maxLength = 500, n.style.cssText = `flex:1;box-sizing:border-box;background:#001a10;color:#efe;border:1px solid #2a6;border-radius:6px;padding:7px 8px;font-size:12px`;
                    let r = document.createElement(`button`);
                    r.type = `button`, r.textContent = `×`, r.style.cssText = `padding:6px 8px;background:#422;color:#fcc;border:1px solid #644;border-radius:6px`, r.onclick = () => {
                        t.remove(), d()
                    }, t.appendChild(n), t.appendChild(r), c.appendChild(t), d()
                },
                d = () => {
                    [...c.querySelectorAll(`input`)].forEach((e, t) => {
                        e.placeholder = `https://… (${t+1}/20)`
                    })
                };
            u();
            let f = n.querySelector(`#stc-body`),
                p = n.querySelector(`#stc-count`),
                m = () => {
                    p && (p.textContent = `${f.value.length} / 2000`)
                };
            f.addEventListener(`input`, m), m(), n.querySelector(`#stc-add-url`).addEventListener(`click`, () => u());
            let h = () => {
                opts.setComposing(false), t.remove()
            };
            n.querySelector(`#stc-cancel`).addEventListener(`click`, h), n.querySelector(`#stc-send`).addEventListener(`click`, () => {
                (async () => {
                    l.textContent = i18n("comment.sending");
                    let urls = [...c.querySelectorAll(`input`)].map(e => e.value),
                        n = await opts.postComment(e, opts.playerId, f.value, urls, a);
                    n.ok ? (l.textContent = i18n("comment.posted"), opts.playOk(), await opts.onPosted(e), setTimeout(h, 500)) : (l.textContent = n.reason === `link_required` ? i18n("comment.needLink") : n.reason === `limit` ? i18n("comment.limit") : n.reason === `empty` ? i18n("comment.empty") : n.reason === `url` || n.reason === `url_limit` ? n.reason === `url_limit` ? i18n("comment.urlLimit") : i18n("comment.urlOnly") : n.reason === `long` ? i18n("comment.long") : i18n("comment.bad"), opts.playError())
                })()
            }), setTimeout(() => f.focus(), 50)
        
}
