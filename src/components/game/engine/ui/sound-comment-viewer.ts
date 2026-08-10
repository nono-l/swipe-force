// @ts-nocheck
/**
 * Sound-test comment viewer (cushion URL UI).
 * Recovered `Ni` — behavior preserved via opts injection.
 */
import { commentKindLabel } from "../modes/sound-test-meta";
import { sn, tn, on, nn, Zt } from "../meta/sound_social";

export type SoundComment = {
  id?: string;
  from?: string;
  body: string;
  kind?: string;
  at?: string;
  urls?: string[];
};

export type SoundCommentViewerOpts = {
  trackKey: string;
  trackCard: { cat: string; key: string; title: string };
  mode: string;
  modeIndex: number;
  playerId: string;
  linked: boolean;
  redraw: () => void;
  playError: () => void;
};

export function openSoundCommentViewer(e: SoundComment, opts: SoundCommentViewerOpts) {

            let t = commentKindLabel(e.kind),
                n = opts.trackKey,
                r = document.createElement(`div`);
            r.style.cssText = `position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.82);display:flex;align-items:flex-start;justify-content:center;font-family:system-ui,sans-serif;padding:14px 10px;overflow:auto`;
            let i = document.createElement(`div`);
            i.style.cssText = `width:min(390px,96vw);background:linear-gradient(180deg,#0c1c16,#081410);border:2px solid #44ffaa;border-radius:12px;padding:14px;color:#dff;margin:auto;box-shadow:0 12px 40px rgba(0,0,0,.55)`;
            let a = opts.trackCard,
                o = document.createElement(`div`);
            o.style.cssText = `background:#041810;border:1px solid #3a6;border-radius:8px;padding:8px 10px;margin-bottom:10px`, o.innerHTML = `<div style="font-size:10px;color:#8fd;font-weight:700">対象トラック</div>
        <div style="font-size:11px;color:#fc8">${a.cat}${opts.mode === `title`?``:` `+String(opts.modeIndex).padStart(2,`0`)} · ${a.key}</div>
        <div style="font-size:13px;color:#ffe;font-weight:700;word-break:break-all">${a.title.replace(/[<>&]/g,``)}</div>`, i.appendChild(o);
            let s = document.createElement(`div`);
            s.style.cssText = `display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px`;
            let c = document.createElement(`div`);
            c.innerHTML = `<div style="font-size:12px;font-weight:700;color:#aef">${(e.from||`?`).replace(/[<>&]/g,``)}</div>
        <div style="font-size:10px;color:#7a9;margin-top:2px">${t} · ${(e.at||``).slice(0,19)}</div>`;
            let l = document.createElement(`button`);
            l.type = `button`, l.textContent = `✕`, l.style.cssText = `background:#1a3030;border:1px solid #456;color:#cde;border-radius:8px;width:32px;height:32px;font-size:14px;cursor:pointer`, l.onclick = () => r.remove(), s.appendChild(c), s.appendChild(l), i.appendChild(s);
            let u = document.createElement(`div`);
            u.style.cssText = `font-size:13px;line-height:1.55;white-space:pre-wrap;word-break:break-word;color:#eef;background:#04140e;border:1px solid #1a4;border-radius:8px;padding:10px;margin-bottom:12px`, u.textContent = e.body, i.appendChild(u);

            function d(e, t, r) {
                let i = `link`;
                try {
                    i = new URL(e).hostname
                } catch {}
                let a = document.createElement(`div`);
                a.style.cssText = `position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;padding:12px;font-family:system-ui,sans-serif`;
                let o = document.createElement(`div`);
                o.style.cssText = `width:min(360px,94vw);background:#0a1418;border:2px solid #6cf;border-radius:14px;padding:16px;color:#eef;box-shadow:0 16px 48px rgba(0,0,0,.6)`, a.appendChild(o), document.body.appendChild(a);
                let s = () => a.remove(),
                    c = () => {
                        o.innerHTML = ``;
                        let a = t[e] || {
                                counts: Object.fromEntries(Zt.map(e => [e.id, 0])),
                                mine: null,
                                visited: on(n, e)
                            },
                            u = !!(a.visited || on(n, e)),
                            d = document.createElement(`div`);
                        d.style.cssText = `font-size:13px;font-weight:800;color:#8ef;margin-bottom:4px`, d.textContent = `① クッション · 評価を見る`, o.appendChild(d);
                        let f = document.createElement(`div`);
                        f.style.cssText = `font-size:10px;color:#fc8;background:#1a1208;border:1px solid #643;border-radius:6px;padding:6px 8px;margin-bottom:8px;word-break:break-all`, f.textContent = `曲: ${opts.trackCard.line}`, o.appendChild(f);
                        let p = document.createElement(`div`);
                        p.style.cssText = `font-size:11px;color:#8ab;margin-bottom:10px;word-break:break-all`, p.textContent = `リンク先: ${i}`, o.appendChild(p);
                        let m = document.createElement(`div`);
                        m.style.cssText = `display:inline-block;padding:3px 8px;border-radius:999px;font-size:10px;margin-bottom:10px;border:1px solid ${u?`#4a6`:`#864`};background:${u?`#0f2a18`:`#2a1810`};color:${u?`#cfc`:`#fc8`}`, m.textContent = u ? `✓ 開封済み · 評価できます` : `未開封 · 飛んだ人だけ評価可`, o.appendChild(m);
                        let h = document.createElement(`div`);
                        h.style.cssText = `display:flex;flex-wrap:wrap;gap:6px;min-height:28px;margin-bottom:12px;padding:10px;background:#061018;border-radius:10px;border:1px solid #234`;
                        let g = !1;
                        for (let e of Zt) {
                            let t = a.counts[e.id] || 0;
                            if (!t) continue;
                            g = !0;
                            let n = document.createElement(`span`);
                            n.textContent = `${e.emoji} ${e.label} ${t}`, n.style.cssText = `padding:4px 8px;border-radius:999px;font-size:11px;border:1px solid ${e.tone===`good`?`#3a6`:e.tone===`warn`?`#a83`:`#a44`};color:#eef;background:#0a1512`, h.appendChild(n)
                        }
                        if (!g) {
                            let e = document.createElement(`span`);
                            e.style.cssText = `font-size:11px;color:#678`, e.textContent = `まだ評価がありません`, h.appendChild(e)
                        }
                        o.appendChild(h);
                        let _ = document.createElement(`div`);
                        _.style.cssText = `font-size:11px;font-weight:700;color:#9bc;margin-bottom:6px`, _.textContent = `定型評価`, o.appendChild(_);
                        let v = document.createElement(`div`);
                        v.style.cssText = `display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px`;
                        for (let i of Zt) {
                            let o = document.createElement(`button`);
                            o.type = `button`, o.disabled = !u, o.innerHTML = `<span>${i.emoji}</span> <span style="font-size:11px;font-weight:700">${i.label}</span>`;
                            let s = a.mine === i.id;
                            o.style.cssText = `display:flex;gap:6px;align-items:center;justify-content:center;padding:10px 6px;border-radius:8px;border:1px solid ${s?`#8f8`:`#456`};background:${u?s?`#1a4030`:`#122`:`#111`};color:${u?`#eef`:`#666`};cursor:${u?`pointer`:`not-allowed`};opacity:${u?`1`:`0.55`}`, o.onclick = () => {
                                if (u) {
                                    if (!opts.linked) {
                                        opts.playError();
                                        return
                                    }(async () => {
                                        o.disabled = !0;
                                        let a = await nn(n, e, opts.playerId, i.id);
                                        if (!a.ok) {
                                            opts.playError(), o.disabled = !1;
                                            return
                                        }
                                        t[e] = a, r(), opts.redraw(), c()
                                    })()
                                }
                            }, v.appendChild(o)
                        }
                        if (o.appendChild(v), !u) {
                            let e = document.createElement(`div`);
                            e.style.cssText = `font-size:10px;color:#a86;margin-bottom:10px;line-height:1.4;padding:8px;background:#1a1008;border-radius:8px;border:1px solid #643`, e.textContent = `🔒 2段目のクッションから実際にリンクを開いた人だけが評価できます（スパム防止）`, o.appendChild(e)
                        }
                        let ee = document.createElement(`div`);
                        ee.style.cssText = `display:flex;flex-direction:column;gap:8px;margin-top:6px`;
                        let y = document.createElement(`button`);
                        y.type = `button`, y.textContent = `② 本当に開く（クッション2）→`, y.style.cssText = `padding:12px;border-radius:10px;border:1px solid #4af;background:linear-gradient(180deg,#1a4060,#102838);color:#dff;font-weight:800;font-size:13px;cursor:pointer`, y.onclick = () => {
                            opts.redraw(), l()
                        };
                        let te = document.createElement(`button`);
                        te.type = `button`, te.textContent = `閉じる`, te.style.cssText = `padding:10px;border-radius:10px;border:1px solid #456;background:#1a2428;color:#bcd;cursor:pointer`, te.onclick = s, ee.appendChild(y), ee.appendChild(te), o.appendChild(ee)
                    },
                    l = () => {
                        o.innerHTML = ``;
                        let i = document.createElement(`div`);
                        i.style.cssText = `font-size:13px;font-weight:800;color:#fc8;margin-bottom:6px`, i.textContent = `② クッション · 外部サイトへ`, o.appendChild(i);
                        let a = document.createElement(`div`);
                        a.style.cssText = `font-size:11px;line-height:1.5;color:#cba;background:#1a1208;border:1px solid #864;border-radius:8px;padding:10px;margin-bottom:10px`, a.textContent = `ここから先は外部サイトです。内容・安全は保証されません。問題のあるリンクは戻って評価してください。`, o.appendChild(a);
                        let s = document.createElement(`div`);
                        s.style.cssText = `font-size:11px;word-break:break-all;color:#8cf;background:#061018;border-radius:8px;padding:10px;margin-bottom:12px;border:1px solid #246`, s.textContent = e, o.appendChild(s);
                        let l = document.createElement(`button`);
                        l.type = `button`, l.textContent = `サイトを開く`, l.style.cssText = `width:100%;padding:14px;border-radius:10px;border:1px solid #4f8;background:linear-gradient(180deg,#1a6040,#0e3020);color:#fff;font-weight:800;font-size:14px;cursor:pointer;margin-bottom:8px`, l.onclick = () => {
                            (async () => {
                                if (!opts.linked) {
                                    opts.playError();
                                    let e = document.createElement(`div`);
                                    e.textContent = `外部リンクを開くにはアカウント連携が必要です`, e.style.cssText = `font-size:11px;color:#fc8;margin:8px 0`, l.insertAdjacentElement(`beforebegin`, e);
                                    return
                                }
                                if (!await sn(n, e, opts.playerId)) {
                                    opts.playError(), l.textContent = `連携してから開く`;
                                    return
                                }
                                t[e] = {
                                    ...t[e] || {
                                        counts: Object.fromEntries(Zt.map(e => [e.id, 0])),
                                        mine: null
                                    },
                                    visited: !0
                                }, r(), window.open(e, `_blank`, `noopener,noreferrer`), opts.redraw(), c()
                            })()
                        };
                        let u = document.createElement(`button`);
                        u.type = `button`, u.textContent = `← 評価画面に戻る`, u.style.cssText = `width:100%;padding:10px;border-radius:10px;border:1px solid #456;background:#1a2428;color:#bcd;cursor:pointer`, u.onclick = () => {
                            opts.redraw(), c()
                        }, o.appendChild(l), o.appendChild(u)
                    };
                c(), a.addEventListener(`click`, e => {
                    e.target === a && s()
                })
            }
            if (e.urls && e.urls.length) {
                let t = document.createElement(`div`);
                t.style.cssText = `font-size:11px;font-weight:700;color:#8fd;margin:4px 0 8px;letter-spacing:.04em`, t.textContent = `LINKS  ·  2段クッション経由`, i.appendChild(t);
                let r = document.createElement(`div`);
                r.style.cssText = `display:flex;flex-direction:column;gap:10px`, i.appendChild(r);
                let a = {},
                    o = (e, t) => {
                        let r = a[t] || {
                                counts: Object.fromEntries(Zt.map(e => [e.id, 0])),
                                mine: null,
                                visited: on(n, t)
                            },
                            i = e.querySelector(`.stc-chips`),
                            o = e.querySelector(`.stc-lock`);
                        if (i) {
                            i.innerHTML = ``;
                            let e = !1;
                            for (let t of Zt) {
                                let n = r.counts[t.id] || 0;
                                if (!n && r.mine !== t.id) continue;
                                e = !0;
                                let a = document.createElement(`span`);
                                a.textContent = `${t.emoji}${t.label} ${n}`, a.style.cssText = `display:inline-flex;padding:2px 7px;border-radius:999px;font-size:10px;border:1px solid ${t.tone===`good`?`#3a6`:t.tone===`warn`?`#a83`:`#a44`};background:#0a1814;color:#eef`, i.appendChild(a)
                            }
                            if (!e) {
                                let e = document.createElement(`span`);
                                e.textContent = `評価なし`, e.style.cssText = `font-size:10px;color:#567`, i.appendChild(e)
                            }
                        }
                        if (o) {
                            let e = !!(r.visited || on(n, t));
                            o.textContent = e ? `開封済` : `未開封`, o.style.background = e ? `#0f2a18` : `#2a1810`, o.style.color = e ? `#cfc` : `#fc8`, o.style.borderColor = e ? `#3a6` : `#864`
                        }
                    };
                for (let t = 0; t < e.urls.length; t++) {
                    let n = e.urls[t],
                        i = n;
                    try {
                        i = new URL(n).hostname
                    } catch {}
                    let s = document.createElement(`div`);
                    s.style.cssText = `background:#061610;border:1px solid #245;border-radius:10px;padding:10px`;
                    let c = document.createElement(`div`);
                    c.style.cssText = `display:flex;gap:8px;align-items:flex-start`;
                    let l = document.createElement(`div`);
                    l.textContent = String(t + 1), l.style.cssText = `min-width:22px;height:22px;border-radius:6px;background:#1a4030;color:#9f8;font-size:11px;display:flex;align-items:center;justify-content:center;font-weight:700`;
                    let u = document.createElement(`div`);
                    u.style.cssText = `flex:1;min-width:0`;
                    let f = document.createElement(`div`);
                    f.textContent = i, f.style.cssText = `font-size:12px;color:#8cf;font-weight:700;word-break:break-all`;
                    let p = document.createElement(`div`);
                    p.className = `stc-chips`, p.style.cssText = `display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;min-height:18px`, u.appendChild(f), u.appendChild(p);
                    let m = document.createElement(`span`);
                    m.className = `stc-lock`, m.style.cssText = `flex-shrink:0;padding:3px 7px;border-radius:999px;font-size:9px;border:1px solid #864;background:#2a1810;color:#fc8`, m.textContent = `未開封`, c.appendChild(l), c.appendChild(u), c.appendChild(m), s.appendChild(c);
                    let h = document.createElement(`button`);
                    h.type = `button`, h.textContent = `クッションを開く（評価 → 移動）`, h.style.cssText = `margin-top:8px;width:100%;padding:9px;border-radius:8px;border:1px solid #4af;background:#123040;color:#cef;font-size:11px;font-weight:700;cursor:pointer`, h.onclick = () => {
                        opts.redraw(), d(n, a, () => o(s, n))
                    }, s.appendChild(h), r.appendChild(s), o(s, n)
                }
                tn(n, e.urls, opts.playerId).then(t => {
                    for (let [e, r] of Object.entries(t)) a[e] = {
                        ...r,
                        visited: r.visited || on(n, e)
                    };
                    r.querySelectorAll(`:scope > div`).forEach((t, n) => {
                        let r = e.urls[n];
                        r && o(t, r)
                    })
                })
            } else {
                let e = document.createElement(`div`);
                e.style.cssText = `font-size:11px;color:#567;margin-bottom:8px`, e.textContent = `リンクなし`, i.appendChild(e)
            }
            let f = document.createElement(`div`);
            f.style.cssText = `margin-top:14px;display:flex;justify-content:flex-end`;
            let p = document.createElement(`button`);
            p.type = `button`, p.textContent = `閉じる`, p.style.cssText = `padding:9px 16px;background:#1a3030;color:#cde;border:1px solid #456;border-radius:8px;font-weight:700;cursor:pointer`, p.onclick = () => r.remove(), f.appendChild(p), i.appendChild(f), r.appendChild(i), r.addEventListener(`click`, e => {
                e.target === r && r.remove()
            }), document.body.appendChild(r)
        
}
