// @ts-nocheck
/**
 * Recovered canvas game loop (production bundle decompiled).
 * Behavior frozen — rename internals gradually with playtests.
 */
import {
  A,
  Ae,
  An,
  Ar,
  At,
  B,
  Be,
  Bn,
  Bt,
  C,
  Ce,
  Cn,
  Cr,
  Ct,
  D,
  De,
  Dn,
  Dr,
  Dt,
  E,
  Ee,
  En,
  Er,
  F,
  Fe,
  Fn,
  Ft,
  G,
  Ge,
  Gn,
  Gt,
  H,
  He,
  Hn,
  Ht,
  I,
  Ie,
  In,
  It,
  J,
  Je,
  Jn,
  Jt,
  K,
  Ke,
  Kn,
  Kt,
  L,
  Le,
  Ln,
  Lt,
  M,
  Me,
  Mn,
  Mr,
  Mt,
  N,
  Ne,
  Nn,
  Nt,
  O,
  Oe,
  On,
  Or,
  Ot,
  P,
  Pe,
  Pn,
  Pt,
  Qe,
  Qn,
  Qt,
  R,
  Re,
  Rn,
  Rt,
  S,
  Se,
  Sn,
  Sr,
  St,
  T,
  Te,
  Tn,
  Tr,
  U,
  Ue,
  Un,
  Ut,
  V,
  Ve,
  Vn,
  Vt,
  W,
  We,
  Wn,
  Wt,
  X,
  Xe,
  Xn,
  Xt,
  Y,
  Ye,
  Yn,
  Yt,
  Z,
  Ze,
  Zn,
  Zt,
  _,
  _e,
  _n,
  _r,
  _t,
  ae,
  an,
  ar,
  at,
  b,
  be,
  bn,
  br,
  bt,
  c,
  ce,
  cn,
  cr,
  ct,
  d,
  de,
  dn,
  dr,
  dt,
  ee,
  en,
  er,
  et,
  f,
  fe,
  fn,
  fr,
  ft,
  g,
  ge,
  gn,
  gr,
  gt,
  h,
  he,
  hn,
  hr,
  ht,
  ie,
  ir,
  it,
  j,
  je,
  jn,
  jr,
  jt,
  k,
  ke,
  kn,
  kr,
  kt,
  l,
  le,
  ln,
  lr,
  lt,
  m,
  me,
  mn,
  mr,
  mt,
  ne,
  nn,
  nr,
  nt,
  oe,
  on,
  or,
  ot,
  p,
  pe,
  pn,
  pr,
  pt,
  q,
  qe,
  qn,
  qt,
  re,
  rn,
  rr,
  rt,
  s,
  se,
  sn,
  sr,
  st,
  te,
  tn,
  tr,
  tt,
  u,
  ue,
  un,
  ur,
  ut,
  v,
  ve,
  vn,
  vr,
  vt,
  w,
  we,
  wn,
  wr,
  x,
  xe,
  xn,
  xr,
  xt,
  y,
  ye,
  yn,
  yr,
  yt,
  z,
  ze,
  zn,
  zt
} from "./recovered-support";
import {
  GROK_PROVIDERS,
  signIn,
  signOut,
  getBearerToken,
} from "@/lib/auth/client";
import {
  openProfileDialog,
  openStatsDialog,
  shareProfilePayload,
} from "@/lib/profile-ui";
import {
  addPlayTime,
  noteHelpAsked,
  noteHelpReceived,
  noteRunStart,
  noteStage,
  noteKill,
  noteBossClear,
  noteContinue,
  noteHiScore,
} from "@/lib/player-stats";
import {
  buildOptionRows,
  formatVolumeBar,
  formatLoadoutSummary,
  formatShotSubSummary,
  formatOptionValue,
  LOADOUT_COUNT_KEYS,
  SHOT_SUMMARY_KEYS,
} from "./modes/options-rows";
import {
  buildTitleMenu,
  titleMenuYs,
  titleHitHeights,
  titleMenuLen,
  titleSelectLabel,
} from "./modes/title-menu";
import {
  getSideRailButtons,
  sideRailHints,
} from "./modes/side-rails";
import {
  shopItemCost,
  shopItemMax,
  enemyHpMultiplier,
  scoreHpThresholds,
  shopUnlockTier,
  filterShopCatalog,
  normalCostScale,
} from "./modes/shop-pricing";
import { openAccountDialog } from "./ui/account-dialog";
import { openSoundCommentViewer } from "./ui/sound-comment-viewer";
import { openSoundCommentComposer } from "./ui/sound-comment-composer";
import { listWindowStart } from "./modes/list-scroll";
import {
  buildTrackCard,
  commentKindEmoji,
  commentKindLabel,
  SOUND_TEST_MENU,
} from "./modes/sound-test-meta";
import {
  buildSoundTestRootMenu,
  buildSoundTestTrackList,
  soundTestPageSize,
  soundTestListWindow,
  buildCommentRows,
  soundTestListHeader,
  soundTestCommentsFooterHit,
  soundTestPlayingFooterHit,
} from "./modes/sound-test-lists";
import {
  buildChangelogRows,
  changelogMaxScroll,
  changelogVisibleRows,
  changelogBackHit,
} from "./modes/changelog-rows";
import { resolveAttractPointer } from "./modes/attract-actions";
import { muteButtonHit, gameOverHit } from "./modes/pointer-zones";
import {
  shotCooldownFrames,
  missileCooldownFrames,
  particleCooldownFrames,
  lockonCooldownFrames,
  beamCooldownFrames,
  flameCooldownFrames,
  enemySpawnInterval,
  playerSpeed,
  swipeFollowFactor,
  clampPlayerPos,
} from "./modes/combat-timing";
import {
  keyboardAxis,
  normalizeAxis,
  virtualStickAxis,
  VSTICK_DEADZONE,
} from "./modes/player-input";
import { shopPointerDown } from "./modes/shop-hit";
import { optionsRowAtY, optionsSwipeStep, OPTIONS_PAGE } from "./modes/options-hit";
import { stepBossPosition } from "./modes/boss-motion";
import {
  buildPlayerShots,
  buildMissiles,
  buildParticles,
  buildBeams,
  buildFlames,
  buildEnemyFire,
} from "./modes/combat-projectiles";
import { buildGrunt, buildBossEntity } from "./modes/combat-enemies";
import { aabbOverlap, playerBulletHit, enemyPlayerHit } from "./modes/collision";
import { buildBurstParticles, buildLockonHits } from "./modes/combat-fx";
import { pickNearestEnemies } from "./modes/combat-targeting";
import { bulletRects, gruntLocalRects, screenShakeOffset, starColor } from "./modes/draw-specs";
import { bossLocalRects, bossHpBar, bossFlashAlpha } from "./modes/draw-boss";
import {
  PLAYER_SHIP_PATH,
  PLAYER_SHIP_FILL,
  playerShipLocalRects,
  optionPodRects,
  virtualStickLayout,
} from "./modes/draw-player";
import { buildWeaponChips, buildHudFlags, lifePipXs } from "./modes/hud-chips";
import { titleMenuRowColors, titleLinkStyle, titleInboxLabels } from "./modes/title-draw";
import {
  buildGameOverView,
  buildNameEntryView,
  stageBanner,
} from "./modes/draw-gameover";
import {
  buildInboxListRows,
  buildInboxDetail,
} from "./modes/draw-inbox";
import {
  buildMissionChips,
  missionNextLine,
  buildTitleMissionRows,
  titleMissionFooter,
} from "./modes/mission-hud";
import {
  sideRailBtnStyle,
  muteLabel,
  SIDE_RAIL_BRAND,
} from "./modes/side-rail-draw";
import { buildSharePayload } from "./modes/share-context";
import {
  missionClearFloats,
  missionTooFastFloats,
  fanmailGate,
  fanmailGateMessage,
} from "./modes/mission-feedback";
import { buildNewRunSeed, buildStageSeed } from "./modes/session-state";
import { applyShopPurchase } from "./modes/shop-purchase";
import { openFanmailDialog, closeFanmailDialog } from "./ui/fanmail-dialog";
import {
  applyOptionDelta,
  dodgeOnlyFeedback,
} from "./modes/options-adjust";
import {
  ownedLevel,
  armedLevel,
  isArmed,
  countArmedWeapons,
} from "./modes/loadout";
import { loadEasyCarry, serializeEasyCarry } from "./modes/easy-carry";
import { buildContinueSeed } from "./modes/continue-state";
import {
  optionsCursorStep,
  optionsActivate,
  optionsBackTarget,
} from "./modes/options-nav";
import {
  defaultWepLv,
  defaultSettings,
  mergeSettingsFromStorage,
} from "./modes/settings-storage";
import {
  soundTestRowAtY,
  soundTestMenuAction,
  soundTestListAction,
} from "./modes/sound-test-input";
import { resolveKeyAction } from "./modes/keyboard-actions";









import { buildShopRows, shopFooterIndices } from "./modes/shop-rows";

// Auth bindings expected by recovered account UI
const r = GROK_PROVIDERS;
const i = signIn;
const a = signOut;
const o = getBearerToken;

/*
  MODE / HANDLER MAP (recovered names)
  -----------------------------------
  pi()  start run          fr()  shop open       mr() options
  Ci()  sound test         ai()  version history  _i() account
  Wi()  X share            bi()  inbox            yi() fanmail
  Ki()  update tick        cr()  reset run        dr() stage start
  Mode var: p
  Score m · PTS h · Lives _ · Stage v · Attract cursor k
*/


function Nr() {
    let e = (0, s.useRef)(null),
        t = (0, s.useRef)(null);
    return (0, s.useEffect)(() => {
        let n = e.current,
            o = t.current;
        if (!n || !o) return;
        let s = o,
            c = s.getContext(`2d`);
        if (!c) return;
        let l = c,
            u = !0,
            d = 0,
            f = 1,
            p = `attract`, // mode: attract|ready|playing|bossintro|shop|options|gameover|name|changelog|soundtest|inbox|...
            m = 0, // score
            h = 0, // pts (shop currency)
            g = Number(localStorage.getItem(kr) || `50000`) || 5e4,
            _ = 3, // lives
            v = 1, // stage
            y = 0,
            oe = 0,
            b = 0,
            x = 0,
            S = 0,
            T = 0,
            ye = 0,
            be = 0,
            xe = 0,
            Se = 0,
            Ce = 0,
            we = 0,
            Te = 0,
            Ee = 18,
            De = !1,
            E = ``,
            Oe = 0,
            ke = [`A`, `A`, `A`],
            Ae = 0,
            D = 0,
            je = ``,
            Me = 0,
            Ne = !1,
            O = {
                ...Dr
            },
            Pe = 0,
            Fe = !1,
            Ie = `easy`,
            k = 0,
            tSub = `root`, // title: root | diff | extra
            Le = 0,
            Re = !1,
            ze = 0,
            Be = 0,
            Ve = !1,
            A = `menu`,
            j = 0,
            M = ``,
            He = !1,
            Ue = 0,
            We = 0,
            Ge = !1,
            N = `title`,
            Ke = 0,
            P = ``,
            F = [],
            qe = 0,
            Je = ``,
            Ye = 0,
            I = !1,
            Xe = `menu`,
            L = {
                likes: 0,
                dislikes: 0,
                mine: null
            },
            Ze = `shop`,
            R = 0,
            z = `main`,
            Qe = ``,
            $e = 0,
            et = !1,
            tt = 0,
            nt = 0,
            rt = 0,
            it = 0,
            at = !1,
            ot = !1,
            st = 0,
            ct = 0,
            lt = 0,
            ut = !1;
        lr();
        let B = ur(),
            V = {
                linked: !1,
                playerId: B,
                name: null,
                email: null,
                image: null
            },
            dt = !1;
        async function ft(e = !1) {
            try {
                const acc = e ? await vr() : await _r();
                V = {
                    linked: !!acc.linked,
                    playerId: acc.playerId || ur(),
                    name: acc.name ?? null,
                    email: acc.email ?? null,
                    image: acc.image ?? null
                };
                B = V.linked && V.playerId ? V.playerId : ur();
                ht = wn(B);
                It();
                Bt();
                w();
                return V;
            } catch (err) {
                console.warn("[SWIPE FORCE] account refresh failed", err);
                return V;
            }
        }
        ft(!1);
        let pt = Ln(),
            H = pt.ref,
            U = pt.sid;
        H && H === B && (H = null, U = null), (!H || !U) && (H = null, U = null);
        let ht = wn(B),
            yt = 0,
            bt = !1,
            xt = ``,
            St = 0,
            Ct = !1,
            wt = 0,
            Tt = ``,
            Et = 0,
            Dt = U ? An(U) : {};

        function Ot() {
            Dt = U ? An(U) : {}
        }

        function kt() {
            return !!U && Nn(U)
        }

        function jt() {
            return !!H && !!U && In(U, H, B)
        }

        function Mt() {
            return !!U && Pn(U, B)
        }
        let G = [],
            Pt = 0,
            Ft = !1;

        function It() {
            nr(B).then(e => {
                G = e, Pt >= G.length && (Pt = Math.max(0, G.length - 1))
            })
        }
        It();
        let Lt = !1;

        function zt(e) {
            if (!Wn(e)) {
                C(), xt = e.source === `thanks` ? `お礼にはお礼できません` : e.thanksSent ? `この通はお礼済み` : `ミッション完了MSGのみお礼可`, St = 80;
                return
            }
            if (Lt) return;
            Lt = !0, w();
            let t = document.createElement(`div`);
            t.id = `sf-mail-dlg`, t.style.cssText = [`position:absolute`, `inset:0`, `z-index:80`, `display:flex`, `align-items:center`, `justify-content:center`, `background:rgba(0,10,8,0.78)`, `padding:16px`, `box-sizing:border-box`, `font-family:system-ui,sans-serif`].join(`;`), t.innerHTML = `
        <div style="width:min(340px,100%);background:#0a1a14;border:2px solid #ffcc66;border-radius:12px;padding:16px 14px;color:#dff;box-shadow:0 8px 32px #000;">
          <div style="font-size:15px;font-weight:700;color:#ffcc88;margin-bottom:4px;">🙏 お礼メッセージ</div>
          <div style="font-size:11px;color:#9a8;margin-bottom:10px;">この受信1通につき1回 · 相手のINBOXへ届きます</div>
          <textarea id="sf-mail-input" maxlength="80" rows="3" placeholder="ありがとう！楽しかった🎉"
            style="width:100%;box-sizing:border-box;resize:none;border-radius:8px;border:1px solid #2a6;background:#03140e;color:#efe;padding:10px;font-size:16px;line-height:1.4;"></textarea>
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button type="button" id="sf-mail-cancel"
              style="flex:1;padding:12px;border-radius:8px;border:1px solid #456;background:#123;color:#9ab;font-size:14px;">キャンセル</button>
            <button type="button" id="sf-mail-send"
              style="flex:1.2;padding:12px;border-radius:8px;border:1px solid #fc6;background:#403010;color:#ffe;font-size:14px;font-weight:700;">お礼を送る</button>
          </div>
          <div id="sf-mail-status" style="margin-top:8px;min-height:1.2em;font-size:12px;color:#fc8;text-align:center;"></div>
        </div>`, n.style.position = `relative`, n.appendChild(t);
            let r = t.querySelector(`#sf-mail-input`),
                i = t.querySelector(`#sf-mail-status`),
                a = t.querySelector(`#sf-mail-send`),
                o = t.querySelector(`#sf-mail-cancel`);
            setTimeout(() => r?.focus(), 50), t.addEventListener(`pointerdown`, e => e.stopPropagation()), o.onclick = () => {
                vi(), w()
            }, a.onclick = () => {
                (async () => {
                    let t = At(r.value || ``);
                    if (!t.ok) {
                        i.textContent = Nt(t.reason), C();
                        return
                    }
                    a.disabled = !0, i.textContent = `送信中…`;
                    let n = await er({
                        playerId: B,
                        messageId: e.id,
                        text: t.text
                    });
                    n.ok ? (i.textContent = `お礼を送りました`, _e(), It(), yr(), setTimeout(() => vi(), 700)) : (i.textContent = n.reason === `already` ? `このメッセージには送信済み` : n.reason === `not_mission` ? `ミッション完了MSGのみ` : Nt(n.reason || `unsafe`), a.disabled = !1, C())
                })()
            }
        }

        function Bt() {
            Vn(B).then(e => {
                ht = e
            })
        }
        Bt();
        let Vt = () => defaultWepLv(),
            Ht = () => defaultSettings(),
            K = mergeSettingsFromStorage(localStorage.getItem(Ar));

        function Gt() {
            re(K.master / 10), ie(K.bgm / 10), ae(K.sfx / 10), te(K.muted), Fe = K.muted
        }

        function Kt() {
            try {
                localStorage.setItem(Ar, JSON.stringify(K))
            } catch {}
            Gt()
        }
        Gt();

        function qt(e) {
            return ownedLevel(e, O)
        }

        function Jt(e) {
            return qt(e) > 0
        }

        function q(e) {
            return armedLevel(e, O, K.wepLv)
        }

        function Qt(e) {
            return isArmed(e, O, K.wepLv)
        }

        function $t() {
            return countArmedWeapons(LOADOUT_COUNT_KEYS, O, K.wepLv)
        }

        function en() {
            return formatLoadoutSummary($t());
        }

        function rn() {
            const detailOn = SHOT_SUMMARY_KEYS.filter(e => Qt(e)).length;
            return formatShotSubSummary({
                shotOn: Qt(`shot`),
                optionOn: Qt(`option`),
                detailOnCount: detailOn,
            });
        }

        function an() {
            return buildOptionRows(z, Jt);
        }
        let J = {
                x: X / 2,
                y: 352,
                w: 14,
                h: 12
            },
            Y = [],
            dn = [],
            fn = [],
            pn = [],
            gn = [],
            _n = [];
        for (let e = 0; e < 48; e++) _n.push({
            x: Cr + Math.random() * Tr,
            y: Math.random() * Z,
            s: 1 + e % 2,
            sp: .4 + e % 5 * .25
        });
        let vn = !1,
            yn = J.x,
            bn = J.y,
            xn = !1,
            Cn = 88,
            Tn = 348,
            En = 0,
            Dn = 0,
            On = new Set;

        function kn() {
            xn = !1, En = 0, Dn = 0
        }

        function jn() {
            let e = n.getBoundingClientRect(),
                t = Math.min(e.width / X, e.height / Z),
                r = Math.min(window.devicePixelRatio || 1, 2);
            s.style.width = `${Math.floor(X*t)}px`, s.style.height = `${Math.floor(Z*t)}px`;
            let i = Math.max(1, Math.floor(t * r));
            s.width = X * i, s.height = Z * i, l.setTransform(i, 0, 0, i, 0, 0), l.imageSmoothingEnabled = !1
        }
        jn();
        let Mn = new ResizeObserver(jn);
        Mn.observe(n);

        function Fn() {
            return O.shot >= 3 && O.rate >= 3 && O.speed >= 3 && O.power >= 3 && O.option >= 2
        }

        function Rn() {
            return O.lockon >= 3 && O.missile >= 3 && O.particle >= 3
        }

        function zn() {
            return shopUnlockTier(!!V.linked, Rn(), Fn());
        }

        function Gn(e) {
            return shopItemMax(e, !!V.linked, Or);
        }

        function Kn() {
            return filterShopCatalog(Er, zn(), !!V.linked);
        }

        function qn(e, t) {
            return listWindowStart(e.length, D, t)
        }

        function Jn() {
            return scoreHpThresholds();
        }

        function Yn() {
            return enemyHpMultiplier(m);
        }

        function Xn() {
            return (Ie === `normal` ? 6 : 1) * Yn()
        }

        function Zn(e) {
            return normalCostScale(e, Ie);
        }

        function Qn(e) {
            return shopItemCost(e, O, Ie);
        }

        function rr(e) {
            return e.consumable ? e.id === `life` && _ >= 5 || e.id === `shield` && Ce > 0 ? !1 : h >= Qn(e) : (e.linkOnly || e.tier >= 4) && !V.linked || O[e.id] >= Gn(e) ? !1 : h >= Qn(e)
        }

        function ir() {
            if (Ie === `easy`) {
                try {
                    localStorage.setItem(jr, serializeEasyCarry(O))
                } catch {}
                yr()
            }
        }

        function ar() {
            try {
                return loadEasyCarry(localStorage.getItem(jr), Dr)
            } catch {
                return { ...Dr }
            }
        }

        function or(e) {
            return Object.keys(Dr).reduce((t, n) => t + e[n], 0)
        }

        function sr(e) {
            let before = { ...O };
            let result = applyShopPurchase({
                item: e,
                cost: Qn(e),
                pts: h,
                lives: _,
                shieldFrames: Ce,
                upgrades: O,
                maxLevel: Gn(e),
                canBuy: rr(e),
                difficulty: Ie,
                wepLv: K.wepLv,
                wepCap: qt
            }, {
                tier2Ready: false,
                tier3Ready: false,
                linkedSpecial: false
            });
            if (!result.ok) {
                je = `PTS不足 / MAX`, Me = 60, C();
                return
            }
            h = result.pts, _ = result.lives, Ce = result.shieldFrames, O = result.upgrades;
            if (result.wepLvChanged) {
                K.wepLv = result.wepLv, Kt()
            }
            if (e.id !== `life` && e.id !== `shield`) ir();
            _e(), je = result.message, Me = 50;
            // celebrate after state applied (match original)
            if (Fn() || Rn() || V.linked && (O.beam > 0 || O.flame > 0)) Pe = 90
        }

        
        // ── reset run state ──
        function cr() {
            let seed = buildNewRunSeed({
                difficulty: Ie,
                easyCarry: ar(),
                defaults: Dr,
                fieldW: X
            });
            m = seed.score, h = seed.pts, _ = seed.lives, v = seed.stage;
            O = seed.upgrades, Ce = seed.shieldFrames, Se = seed.invulnFrames;
            Y.length = 0, dn.length = 0, fn.length = 0, pn.length = 0, gn.length = 0;
            J.x = seed.playerX, J.y = seed.playerY, kn()
        }

        
        // ── begin stage ──
        function dr() {
            let seed = buildStageSeed(v);
            Te = seed.kills, Ee = seed.killTarget, De = seed.bossActive, E = seed.bossName;
            b = seed.spawnTimer, x = seed.shotCd, S = seed.missileCd, T = seed.particleCd, ye = seed.lockonCd;
            Y.length = 0, dn.length = 0, gn.length = 0;
            p = seed.mode, oe = seed.readyFrames, Se = seed.invulnFrames;
            kn(), W(`play`, v)
        }

        
        // ── open shop ──
        function fr(e = !1) {
            p = `shop`, Ne = e, D = 0, je = e ? `一時ショップ (戦闘一時停止)` : `PTSで強化せよ`, Me = 80, vn = !1, kn(), e || (Y.length = 0, dn.length = 0, gn.length = 0), w(), W(`attract`)
        }

        function pr() {
            Ne ? (p = `playing`, Se = Math.max(Se, 45), Ne = !1, De ? mt(mn(v).vibe, v) : W(`play`, v)) : (v++, dr()), w()
        }

        
        // ── open options ──
        function mr(e) {
            Ze = e, p = `options`, z = `main`, R = 0, Qe = ``, $e = 0, vn = !1, kn(), w(), W(`attract`)
        }

        function hr() {
            if (Kt(), w(), z === `shot` || z === `weapons`) {
                let nav = optionsBackTarget(z);
                if (nav.type === `to_weapons_from_shot`) {
                    z = `weapons`, R = 1;
                    return
                }
                if (nav.type === `to_main_from_weapons`) {
                    z = `main`;
                    let e = an().findIndex(e => e.kind === `submenu` && e.key === `weapons`);
                    R = e >= 0 ? e : 0;
                    return
                }
            }
            if (Ze === `shop`) p = `shop`, W(`attract`);
            else if (Ze === `play` || Ze === `playing` || Ze === `game`) {
                p = `playing`, Se = Math.max(Se, 45), Ne = !1;
                De ? mt(mn(v).vibe, v) : W(`play`, v);
            } else p = `attract`, W(`attract`);
            w()
        }

        function gr(e) {
            return formatVolumeBar(e);
        }

        function xr(e) {
            return formatOptionValue(e, {
                options: K,
                armedLevel: q,
                maxLevel: qt,
                loadoutSummary: en(),
                shotSummary: rn(),
            });
        }

        function Nr(e) {
            let t = an();
            (R < 0 || R >= t.length) && (R = 0);
            let n = t[R];
            let res = applyOptionDelta({
                row: n,
                delta: e,
                settings: K,
                maxArmed: (key) => qt(key),
                currentArmed: (key) => q(key),
                weaponsEnabledCount: $t()
            });
            if (res.type === `noop`) return;
            if (res.type === `back`) { hr(); return }
            if (res.type === `navigate_shot`) { z = `shot`, R = 1, w(); return }
            if (res.type === `navigate_weapons`) { z = `weapons`, R = 1, w(); return }
            if (res.type === `applied`) {
                K = res.settings;
                if (res.clearVstick) kn();
                if (n.kind === `weapon`) {
                    let fb = dodgeOnlyFeedback($t(), res.feedback);
                    Qe = fb || res.feedback || ``, $e = res.feedbackLife || 55
                }
                Kt();
                if (res.replayAttractIfUnmuted && !K.muted) W(`attract`);
                w()
            }
        }

        function Pr(e, t, n, r = 14) {
            for (let p of buildBurstParticles(e, t, n, r)) fn.push(p)
        }

        function Fr(e) {
            return dn.find(t => t.id === e)
        }

        function Ir(e) {
            return pickNearestEnemies(dn, J.x, J.y, e)
        }

        function Lr(e, t, n, r) {
            if (e.hp -= t, e.flash = 6, de(), e.hp <= 0) {
                let t = e.boss;
                Pr(e.x, e.y, e.boss ? `#ff66ff` : `#ffaa00`, t ? 28 : 12), fe(t), m += e.score, h += e.pts, pn.push({
                    x: e.x,
                    y: e.y,
                    text: `+${e.pts}`,
                    color: `#ffff66`,
                    life: 40
                }), e.boss || Te++, e.boss && (gi(), p = `stageclear`, oe = 120, he(), gt(), K.shake && (we = 12));
                let n = dn.indexOf(e);
                n >= 0 && dn.splice(n, 1)
            } else Pr(n, r, `#ffffff`, 3)
        }

        function Rr() {
            if (!(Se > 0)) {
                if (Ce > 0) {
                    Ce = 0, Se = 50, Pr(J.x, J.y, `#66ffff`, 10), pe();
                    return
                }
                _--, Se = 90, K.shake && (we = 10), pe(), Pr(J.x, J.y, `#ff2244`, 16), _ < 0 && (_ = 0, p = `gameover`, oe = 150, ge(), gt(), m > g && (g = m, localStorage.setItem(kr, String(g))))
            }
        }

        function zr() {
            dn.push(buildGrunt({
                id: f++,
                stage: v,
                hpScale: Xn()
            }))
        }

        function Br() {
            let e = mn(v);
            E = e.name, De = !0, p = `bossintro`, oe = 120, me(), hi(), mt(e.vibe, v);
            dn.push(buildBossEntity({
                id: f++,
                stage: v,
                hpScale: Xn(),
                boss: e,
                fieldCenterX: X / 2
            }))
        }

        function Vr(e) {
            let atk = e.boss ? hn(e.bossId).atk : 0;
            for (let b of buildEnemyFire(e, J.x, J.y, atk)) Y.push(b)
        }

        function Hr() {
            let bullets = buildPlayerShots(J.x, J.y, {
                shot: q(`shot`),
                overdrive: q(`overdrive`),
                power: q(`power`),
                option: q(`option`)
            });
            if (bullets.length) {
                // SFX once if any main shot or option fired
                se();
                for (let b of bullets) Y.push(b)
            }
        }

        function Ur() {
            let e = q(`beam`);
            if (e <= 0 || !V.linked) return;
            ue();
            for (let b of buildBeams({
                px: J.x,
                py: J.y,
                beam: e,
                power: q(`power`),
                option: q(`option`)
            })) Y.push(b)
        }

        function Wr() {
            let e = q(`flame`);
            if (e <= 0 || !V.linked) return;
            for (let b of buildFlames({
                px: J.x,
                py: J.y,
                flame: e,
                power: q(`power`)
            })) Y.push(b)
        }

        function Gr() {
            let e = q(`missile`);
            if (e <= 0) return;
            let t = q(`cluster`),
                n = e + (t > 0 ? t + 1 : 0),
                r = Ir(n);
            ce();
            for (let b of buildMissiles({
                px: J.x,
                py: J.y,
                missile: e,
                cluster: t,
                targets: r
            })) Y.push(b)
        }

        function Kr() {
            let e = q(`particle`);
            if (e <= 0) return;
            let t = q(`overdrive`);
            le();
            for (let b of buildParticles({
                px: J.x,
                py: J.y,
                particle: e,
                overdrive: t
            })) Y.push(b);
            Pr(J.x, J.y - 16, `#66ccff`, 6)
        }

        function qr() {
            let e = q(`lockon`);
            if (e <= 0) return;
            let t = q(`hyper`),
                hits = buildLockonHits({
                    targets: Ir(e + (t > 0 ? t + 1 : 0)),
                    lockon: e,
                    hyper: t
                });
            hits.length && ue();
            for (let h of hits) {
                gn.push(h.beam);
                fn.push(h.spark);
                Lr(h.target, h.dmg, h.target.x, h.target.y)
            }
        }

        function Q(e, t, n, r, i) {
            l.fillStyle = i, l.fillRect(Math.round(e), Math.round(t), Math.round(n), Math.round(r))
        }

        function $(e, t, n, r, i = 8, a = `left`) {
            l.fillStyle = r, l.font = `bold ${i}px "Courier New", monospace`, l.textAlign = a, l.textBaseline = `top`, l.fillText(e, t, n)
        }

        function Jr(e, t, n, r) {
            if (r) return;
            l.save(), l.translate(Math.round(e), Math.round(t));
            l.fillStyle = PLAYER_SHIP_FILL, l.beginPath();
            let path = PLAYER_SHIP_PATH;
            l.moveTo(path[0][0], path[0][1]);
            for (let i = 1; i < path.length; i++) l.lineTo(path[i][0], path[i][1]);
            l.closePath(), l.fill();
            for (let r of playerShipLocalRects()) Q(r.x, r.y, r.w, r.h, r.color);
            l.restore()
        }

        function Yr() {
            for (let r of optionPodRects(J.x, J.y, q(`option`))) Q(r.x, r.y, r.w, r.h, r.color)
        }

        function Xr(e) {
            if (e.boss) {
                Zr(e);
                return
            }
            l.save(), l.translate(Math.round(e.x), Math.round(e.y)), e.flash > 0 && (l.globalAlpha = .5);
            e.type === 2 && l.rotate(e.phase);
            for (let r of gruntLocalRects(e.type)) Q(r.x, r.y, r.w, r.h, r.color);
            l.restore()
        }

        function Zr(e) {
            let t = hn(e.bossId);
            l.save(), l.translate(Math.round(e.x), Math.round(e.y));
            e.flash > 0 && (l.globalAlpha = bossFlashAlpha(e.flash, y));
            for (let r of bossLocalRects(t, e.w, e.h)) Q(r.x, r.y, r.w, r.h, r.color);
            l.restore();
            let bar = bossHpBar({ hp: e.hp, maxHp: e.maxHp });
            Q(bar.bg.x, bar.bg.y, bar.bg.w, bar.bg.h, bar.bg.color);
            Q(bar.fg.x, bar.fg.y, bar.fg.w, bar.fg.h, bar.fg.color);
            $(t.name, X / 2, 18, `#ff66aa`, 8, `center`)
        }

        function Qr() {
            Q(0, 0, Sr, Z, `#0a1a0a`), Q(wr, 0, Sr, Z, `#0a1a0a`);
            const railBtn = (x0, y, label, sub, hot) => {
                let st = sideRailBtnStyle(!!hot);
                Q(x0 + 8, y, 32, 40, st.fill);
                l.strokeStyle = st.stroke;
                l.lineWidth = 1;
                l.strokeRect(x0 + 8.5, y + .5, 31, 39);
                $(label, x0 + 24, y + 10, st.labelColor, 6, `center`);
                if (sub) $(sub, x0 + 24, y + 24, st.subColor, 5, `center`);
            };
            for (const x0 of [0, wr]) {
                $(SIDE_RAIL_BRAND.lines[0], x0 + 8, 12, SIDE_RAIL_BRAND.color, 6);
                $(SIDE_RAIL_BRAND.lines[1], x0 + 8, 22, SIDE_RAIL_BRAND.color, 6);
            }
            const rails = getSideRailButtons({
                mode: p,
                titleSub: tSub,
                shopPaused: !!Ne
            });
            for (const b of rails) {
                railBtn(b.side === `left` ? 0 : wr, b.y, b.label, b.sub, b.hot);
            }
            const hints = sideRailHints(p);
            if (hints.left) $(hints.left, 24, 160, `#335533`, 5, `center`);
            if (hints.right) $(hints.right, wr + 24, 160, `#335533`, 5, `center`);
            {
                let m = muteLabel(!!Fe, p === `options` || p === `shop`);
                $(m.text, 280, 378, m.color, 7);
            }
        }

        function $r() {
            $(`SC ${String(m).padStart(7,`0`)}`, 52, 4, `#00ff88`, 8), $(`HI ${String(g).padStart(7,`0`)}`, 268, 4, `#ffff66`, 8, `right`), $(`PTS ${h}`, 52, 14, `#ffff66`, 8), $(`¢${ht}`, 118, 14, `#ffee88`, 8), $(`ST${v}`, 268, 14, `#88ffaa`, 8, `right`);
            let flags = buildHudFlags({
                weaponsEnabledCount: $t(),
                shotArmed: Qt(`shot`),
                vstick: !!K.vstick,
                difficulty: Ie,
                enemyHpMult: Yn()
            });
            flags.enemyHpMult > 1 && $(`ENEMY HP×${flags.enemyHpMult}`, 52, 24, `#ff8866`, 7);
            $(flags.diffLabel, 268, 24, flags.diffLabel === `ESY` ? `#88ff88` : `#ffaa66`, 6, `right`);
            for (let x of lifePipXs(_)) Q(x, 388, 6, 6, `#44ff88`);
            let n = 52;
            if (flags.dodgeOnly) $(`DODGE ONLY`, n, 376, y % 20 < 12 ? `#ff88aa` : `#aa4466`, 7), n += 56;
            else if (flags.shotOff) $(`SHOT OFF`, n, 376, `#aa4444`, 7), n += 48;
            for (let chip of buildWeaponChips(O, q)) {
                $(chip.label, n, 376, chip.color, 7), n += 18
            }
            $(flags.controlLabel, 268, 376, `#448866`, 6, `right`), ei()
        }

        function ei() {
            if (!H) return;
            Q(52, 24, 216, 28, `#001a22`), l.strokeStyle = kt() ? `#ffee66` : y % 40 < 28 ? `#44ddaa` : `#228866`, l.strokeRect(52.5, 24.5, 215, 27), $(`MISSION`, 56, 27, `#66ffcc`, 7);
            for (let chip of buildMissionChips(Sn, Dt)) {
                $(chip.label, chip.x, 27, chip.color, 7);
                $(chip.mark, chip.x + 14, 27, chip.markColor, 7);
            }
            let next = missionNextLine(Sn, Dt, kt());
            next && $(next, 56, 39, kt() ? `#ffee88` : `#ffcc66`, 7);
            Et > 0 && $(Tt, 264, 39, `#aaffff`, 6, `right`)
        }

        function ti(e) {
            if (!H) return;
            Ot(), Q(58, 90, 204, 72, `#001820`), l.strokeStyle = kt() ? `#ffee66` : `#44ffcc`, l.lineWidth = 2, l.strokeRect(58.5, 90.5, 203, 71), l.lineWidth = 1, $(`◆ SHARE MISSIONS`, e, 94, `#66ffee`, 9, `center`), $(`4段階 × 各1枚 = 最大4 COIN`, e, 106, `#ffcc66`, 7, `center`);
            for (let row of buildTitleMissionRows(Sn, Dt)) {
                $(row.line, 66, row.y, row.color, 7);
            }
            let foot = titleMissionFooter(kt(), Mt());
            foot && $(foot, e, 152, Mt() ? `#88aa88` : `#ffff88`, 7, `center`)
        }

        function ni() {
            if (!K.vstick || p !== `playing` && p !== `ready` && p !== `bossintro`) return;
            let lay = virtualStickLayout({
                active: !!xn,
                centerX: Cn,
                centerY: Tn,
                axisX: En,
                axisY: Dn
            });
            l.save(), l.globalAlpha = lay.alpha, l.strokeStyle = `#44ffaa`, l.lineWidth = 2;
            l.beginPath(), l.arc(lay.baseX, lay.baseY, lay.radius, 0, Math.PI * 2), l.stroke();
            l.strokeStyle = `#226644`, l.beginPath(), l.arc(lay.baseX, lay.baseY, lay.innerR, 0, Math.PI * 2), l.stroke();
            l.strokeStyle = `#338855`, l.lineWidth = 1;
            l.beginPath(), l.moveTo(lay.baseX - lay.radius + 4, lay.baseY), l.lineTo(lay.baseX + lay.radius - 4, lay.baseY);
            l.moveTo(lay.baseX, lay.baseY - lay.radius + 4), l.lineTo(lay.baseX, lay.baseY + lay.radius - 4), l.stroke();
            l.globalAlpha = lay.knobAlpha, l.fillStyle = xn ? `#88ffcc` : `#44aa77`;
            l.beginPath(), l.arc(lay.knobX, lay.knobY, lay.knobR, 0, Math.PI * 2), l.fill();
            l.strokeStyle = `#ffffff`, l.lineWidth = 1, l.stroke(), l.restore()
        }

        function ri() {
            let e = Kn(),
                t = qn(e, 10);
            Q(Cr, 0, Tr, Z, `#001400`), Q(54, 20, 212, 372, `#002200`), l.strokeStyle = `#00ff66`, l.strokeRect(54.5, 20.5, 211, 371), $(`POWER SHOP`, 62, 24, `#ffff00`, 11);
            let foot = shopFooterIndices(e.length),
                n = D === foot.share,
                r = D === foot.opt;
            Q(150, 22, 58, 20, n ? `#442200` : `#221100`), l.strokeStyle = n ? `#ffcc66` : `#aa8844`, l.lineWidth = 2, l.strokeRect(150.5, 22.5, 57, 19), $(`𝕏 SHARE`, 179, 27, n ? `#ffeeaa` : `#ccaa66`, 8, `center`), Q(212, 22, 52, 20, r ? `#004466` : `#002233`), l.strokeStyle = r ? `#66eeff` : `#33aacc`, l.strokeRect(212.5, 22.5, 51, 19), l.lineWidth = 1, $(`⚙ OPT`, 238, 27, r ? `#ffffff` : `#88ddff`, 8, `center`), $(`PTS ${h}  ·  T${zn()}  ·  ${Ie===`normal`?`NRM`:`ESY SAVE`}`, X / 2, 46, Ie === `normal` ? `#ffaa66` : `#ffff66`, 8, `center`), $(Fn() ? Rn() ? `最終強化解放済み` : `上級兵器を全MAX → TIER3解放` : `基本強化を全MAX → TIER2兵器解放`, X / 2, 56, Pe > 0 && y % 10 < 5 ? `#ff66ff` : `#66aa66`, 6, `center`);
            for (let row of buildShopRows({
                catalog: e,
                cursor: D,
                windowStart: t,
                upgrades: O,
                lives: _,
                shieldFrames: Ce,
                costOf: Qn,
                maxOf: Gn,
                canBuy: rr
            })) {
                row.selected && (Q(58, row.y - 1, 204, 19, `#004400`), l.strokeStyle = `#00ff00`, l.strokeRect(58.5, row.y - .5, 203, 18));
                $(row.item.name, 62, row.y + 3, row.nameColor, 8);
                $(row.levelText, 148, row.y + 3, `#66ccaa`, 7);
                $(row.costText, 260, row.y + 3, row.costColor, 8, `right`);
            }
            t > 0 && $(`▲`, X / 2, 60, `#00ff88`, 8, `center`), t + 10 < e.length && $(`▼`, X / 2, 336, `#00ff88`, 8, `center`);
            let i = 200 / 3,
                a = D === e.length;
            Q(56, 352, i, 32, n ? `#553300` : `#2a1800`), l.strokeStyle = n ? `#ffcc66` : `#aa7744`, l.lineWidth = 2, l.strokeRect(56.5, 352.5, 65.66666666666667, 31), $(`𝕏 SHARE`, 89.33333333333334, 358, n ? `#ffeeaa` : `#ddaa66`, 8, `center`), $(`進行度つき`, 89.33333333333334, 370, `#886644`, 6, `center`), Q(126.66666666666667, 352, i, 32, r ? `#005577` : `#003344`), l.strokeStyle = r ? `#88eeff` : `#44aacc`, l.strokeRect(127.16666666666667, 352.5, 65.66666666666667, 31), $(`⚙ OPT`, 160, 362, r ? `#ffffff` : `#aaddff`, 9, `center`), Q(197.33333333333334, 352, i, 32, a ? `#007700` : `#004400`), l.strokeStyle = a ? `#ffff00` : `#00aa44`, l.strokeRect(197.83333333333334, 352.5, 65.66666666666667, 31), l.lineWidth = 1, $(Ne ? `▶ GO` : `▶ NEXT`, 230.66666666666669, 362, a ? `#ffff00` : `#88ff88`, 9, `center`), Me > 0 ? $(je, X / 2, 388, `#ffaa00`, 6, `center`) : $(Ne ? `進行中SHAREで助けを呼べます` : `上下スワイプ · 空欄タップで決定`, X / 2, 388, `#335544`, 6, `center`)
        }

        function ii() {
            let e = an();
            R >= e.length && (R = Math.max(0, e.length - 1)), Q(Cr, 0, Tr, Z, `#001018`), Q(54, 18, 212, 370, `#001a22`), l.strokeStyle = z === `weapons` ? `#66ffaa` : `#00ccff`, l.strokeRect(54.5, 18.5, 211, 369), $(z === `shot` ? `SHOT TUNING` : z === `weapons` ? `WEAPON LOADOUT` : `OPTIONS`, X / 2, 22, z === `shot` || z === `weapons` ? `#88ffcc` : `#66eeff`, 11, `center`), $(z === `shot` ? `MAIN / RATE / POWER / OPTION を個別調整` : z === `weapons` ? `SHOTを開くと強化を個別ON/OFF` : `音量・操作 · 武装は下の LOADOUT へ`, X / 2, 36, `#448888`, 7, `center`);
            let t = listWindowStart(e.length, R, 14);
            for (let n = 0; n < Math.min(14, e.length); n++) {
                let r = n + t,
                    i = e[r],
                    a = 48 + n * 18,
                    o = r === R;
                if (i.kind === `header`) {
                    $(i.label, X / 2, a + 4, `#558888`, 7, `center`);
                    continue
                }
                o && (Q(60, a - 1, 200, 16, `#003344`), l.strokeStyle = `#00eeff`, l.strokeRect(60.5, a - .5, 199, 15));
                let s = i.kind === `weapon` ? q(i.key) > 0 ? o ? `#aaffcc` : `#66aa88` : o ? `#ffaaaa` : `#886666` : i.kind === `submenu` ? o ? `#aaffdd` : `#66ccaa` : o ? `#ffffff` : `#88aacc`;
                $(i.label, 64, a + 3, s, 8);
                let c = xr(i);
                c && $(c, 260, a + 3, i.kind === `weapon` ? q(i.key) > 0 ? `#66ff88` : `#ff6666` : i.kind === `submenu` ? `#88ffcc` : o ? `#ffff66` : `#668888`, 7, `right`)
            }
            t > 0 && $(`▲`, X / 2, 38, `#00ccff`, 7, `center`), t + 14 < e.length && $(`▼`, X / 2, 372, `#00ccff`, 7, `center`), $($e > 0 ? Qe : z === `shot` ? `上下=項目  左右=強度  空き=決定` : z === `weapons` ? `上下スワイプ  空きタップ=決定` : `上下=項目  左右=調整  空き=決定`, X / 2, 386, $e > 0 ? `#ffaa00` : `#446666`, 6, `center`)
        }

        
        // ── version changelog mode ──
        function ai() {
            p = `changelog`, Le = 0, w()
        }

        function oi() {
            p = `attract`, w()
        }

        function si() {
            return changelogMaxScroll(buildChangelogRows(ln).length)
        }

        function ci() {
            Q(Cr, 0, Tr, Z, `#000a12`), Q(54, 12, 212, 380, `#001018`), l.strokeStyle = `#44ffcc`, l.strokeRect(54.5, 12.5, 211, 379), $(`VERSION HISTORY`, X / 2, 20, `#88ffee`, 11, `center`), $(`NOW  ${un()}`, X / 2, 34, `#ffee88`, 8, `center`), $(`Grok Build iOS`, X / 2, 46, `#556666`, 6, `center`);
            let e = buildChangelogRows(ln),
                t = changelogMaxScroll(e.length);
            Le > t && (Le = t);
            for (let vis of changelogVisibleRows(e, Le)) {
                if (vis.row.kind === `gap`) continue;
                let a = vis.row.kind === `head` ? 7 : 6;
                $(vis.row.text.slice(0, 34), 62, vis.y, vis.row.color, a)
            }
            Le > 0 && $(`▲`, X / 2, 52, `#44aa88`, 7, `center`), Le < t && $(`▼`, X / 2, 364, `#44aa88`, 7, `center`), Q(60, 370, 200, 18, `#1a3030`), l.strokeStyle = `#6688aa`, l.strokeRect(60.5, 370.5, 199, 17), $(`◀ BACK`, X / 2, 375, `#aaccff`, 8, `center`)
        }

        function li(e, t) {
            Re = !0, ze = t, Be = 0, Ve = !1
        }

        function ui(e, t) {
            if (!Re || p !== `changelog`) return;
            let n = t - ze;
            for (Be += n, ze = t; Be <= -14;) Le = Math.max(0, Le - 1), Be += 14, Ve = !0, w();
            for (; Be >= 14;) Le = Math.min(si(), Le + 1), Be -= 14, Ve = !0, w()
        }

        function di(e, t) {
            if (Re) {
                if (Re = !1, Ve) {
                    Ve = !1;
                    return
                }
                changelogBackHit(t, e, Cr, wr) && oi()
            }
        }

        function fi() {
            l.fillStyle = `#001100`, l.fillRect(Cr, 0, Tr, Z);
            for (let e = 0; e < 400; e++) {
                let e = Cr + Math.random() * Tr,
                    t = Math.random() * Z,
                    n = 100 + Math.random() * 120;
                l.fillStyle = `rgb(0,${n|0},${n*.35|0})`, l.fillRect(e, t, 1, 1)
            }
            let e = X / 2;
            $(`SWIPE FORCE`, e, 28, `#00ff88`, 15, `center`);
            $(`RETRO VERTICAL SHOOTER`, e, 44, `#66aa66`, 7, `center`);
            $(un() + ` · Grok Build iOS`, e, 56, `#88cc88`, 8, `center`);
            $(`v1.5 · 連携特典は EXTRA へ`, e, 66, `#556666`, 6, `center`);
            {
                let ls = titleLinkStyle(!!V.linked);
                Q(210, 6, 56, 18, ls.fill);
                l.strokeStyle = ls.stroke;
                l.strokeRect(210.5, 6.5, 55, 17);
                $(V.linked ? (V.name || `LINK`).slice(0, 6) : `LINK`, 238, 11, ls.textColor, 7, `center`);
            }
            Q(68, 76, 184, 18, `#1a1500`);
            l.strokeStyle = `#ffcc44`;
            l.strokeRect(68.5, 76.5, 183, 17);
            $(`CONTINUE COIN  ×${ht}`, e, 80, ht > 0 ? `#ffee88` : `#887744`, 9, `center`);
            H ? ti(e) : $(`シェア先が1面ボス到達 → コインGET`, e, 96, `#558866`, 7, `center`);
            St > 0 && $(xt, e, H ? 148 : 110, `#ffaa00`, 7, `center`);
            $(titleSelectLabel(tSub), e, Z * .385, `#ffff66`, 7, `center`);
            let t = titleMenuYs(tSub, Z),
                n = or(ar()),
                inbox = titleInboxLabels({ canSendFanmail: jt(), alreadySent: Mt(), inboxCount: G.length }),
                r = buildTitleMenu(tSub, {
                    linked: !!V.linked,
                    easyCarryLv: n,
                    msgTitle: inbox.title,
                    msgSub: inbox.sub,
                    versionLabel: cn
                });
            for (let n = 0; n < r.length; n++) {
                let i = t[n],
                    a = k === n,
                    o = r[n].h,
                    cols = titleMenuRowColors(n, a, y % 24 < 16);
                cols.fill ? (Q(62, i - 2, 196, o, cols.fill), l.strokeStyle = cols.stroke, l.strokeRect(62.5, i - 1.5, 195, o - 1)) : (l.strokeStyle = cols.stroke, l.strokeRect(62.5, i - 1.5, 195, o - 1));
                $(r[n].title, e, i + 2, cols.title, 10, `center`), r[n].sub && $(r[n].sub, e, i + 13, cols.sub, 6, `center`)
            }
            $(`Grok Build iOS`, 56, 386, `#335533`, 6), $(`電気通信事業者 届出済`, 266, 386, `#2a4a2a`, 6, `right`)
        }

        
        // ── start run ──
        function pi() {
            cr(), yt = performance.now(), bt = !1, Ot(), wt = 0, Tt = ``, Et = 0, ve(), dr();
            try { noteRunStart(); window.__sfPlayAcc = 0; } catch (err) {}
        }

        
        // ── mission progress tick ──
        function mi(e) {
            if (!H || !U || Dt[e]) return;
            let t = (performance.now() - yt) / 1e3,
                n = Sn.find(t => t.id === e);
            Hn({
                sharerId: H,
                shareId: U,
                visitorId: B,
                missionId: e,
                playSeconds: t
            }).then(e => {
                Ot();
                if (e.ok && !e.already) {
                    let fb = missionClearFloats({
                        label: n.label,
                        allClearCanMsg: !!(kt() && jt()),
                        cx: X / 2,
                        cy: Z
                    });
                    wt = fb.bannerFrames, Tt = fb.toast, Et = fb.toastLife, he();
                    for (let f of fb.floats) pn.push(f);
                    Bt()
                } else if (!e.ok && e.reason === `too_fast`) {
                    let fb = missionTooFastFloats({ label: n.label, cx: X / 2, cy: Z });
                    Tt = fb.toast, Et = fb.toastLife;
                    for (let f of fb.floats) pn.push(f)
                }
            })
        }

        
        // ── award / continue coin refresh ──
        function hi() {
            bt || v === 1 && (bt = !0, mi(`m1`))
        }

        function gi() {
            v === 2 ? mi(`m2`) : v === 3 ? mi(`m3`) : v === 4 && mi(`m4`)
        }

        
        // ── account link dialog ──
        function _i() {
            openAccountDialog(n, {
                linked: !!V.linked,
                name: V.name,
                email: V.email,
                playerId: B,
                coins: ht
            }, {
                providers: r,
                onClose: () => w(),
                onSignIn: async (providerId) => {
                    await i(providerId, { callbackURL: window.location.href });
                    return await ft(!0);
                },
                onSignOut: async () => {
                    try {
                        await br();
                        await a(window.location.href);
                    } catch {
                        await br();
                        B = ur();
                        V = {
                            linked: !1,
                            playerId: B,
                            name: null,
                            email: null,
                            image: null
                        };
                        ht = wn(B);
                        w();
                    }
                },
                onOpenProfile: () => {
                    try { window.__sfOpenProfile?.(); } catch {}
                },
                onOpenStats: () => {
                    try { window.__sfOpenStats?.(); } catch {}
                },
                onAfterLink: () => {
                    _e();
                    setTimeout(() => _i(), 200);
                },
                playUi: () => _e(),
                playError: () => C()
            });
            w();
            ee();
        }

        function vi() {
            let e = n.querySelector(`#sf-mail-dlg`);
            e && e.remove(), Lt = !1
        }

        
        // ── fan mail to sharer ──
        function yi() {
            let gate = fanmailGate({
                sharerId: H,
                alreadySent: Mt(),
                allMissionsClear: kt(),
                busy: !!Lt
            });
            if (!gate.ok) {
                if (gate.reason === `busy`) return;
                if (gate.reason === `no_share`) { C(); return }
                C(), xt = fanmailGateMessage(gate.reason), St = 90;
                return
            }
            w(), Lt = !0;
            openFanmailDialog({
                host: n,
                sanitize: (raw) => At(raw),
                reasonText: (reason) => Nt(reason),
                send: (text) => tr({
                    sharerId: H,
                    shareId: U,
                    visitorId: B,
                    text
                }),
                onClose: () => { vi(); w() },
                onSent: () => { yr() },
                playOk: () => _e(),
                playError: () => C()
            })
        }

        
        // ── inbox ──
        function bi() {
            It(), yr(), p = `inbox`, Pt = 0, Ft = !1, w()
        }
        async function xi() {
            if (Ct || ht <= 0) return;
            Ct = !0;
            let e = await Un(B);
            if (ht = e.coins, Ct = !1, !e.ok) {
                C();
                return
            }
            let seed = buildContinueSeed({ currentShield: Ce });
            _ = seed.lives, Se = seed.invulnFrames, Ce = seed.shieldFrames;
            p = seed.mode, oe = seed.readyFrames, _e();
            pn.push({
                x: J.x,
                y: J.y + seed.float.dy,
                text: seed.float.text,
                color: seed.float.color,
                life: seed.float.life
            });
            De ? mt(mn(v).vibe, v) : W(`play`, v)
        }

        function Si(e = `この機能`) {
            return V.linked ? !0 : (Je = `${e}はアカウント連携が必要です`, Ye = 100, xt = Je, St = 100, C(), !1)
        }

        
        // ── sound test ──
        function Ci() {
            if (!V.linked) {
                xt = `SOUND TEST はアカウント連携特典です`, St = 90, C();
                return
            }
            ee(), A = `menu`, j = 0, M = ``, p = `soundtest`, W(`attract`), N = `title`, Ke = 0, M = `TITLE THEME`, Yt(`title`, B).then(e => {
                L = e
            }), w()
        }

        function wi() {
            p = `attract`, W(`attract`), M = ``, w()
        }

        function Ti() {
            return Rt(N, Ke)
        }

        function Ei() {
            let e = Ti(),
                r = vt();
            return buildTrackCard({
                trackKey: e,
                mode: N,
                index: Ke,
                titleOverride: M,
                labels: r.labels
            })
        }

        function Di(e, t) {
            let n = Ei(),
                r = !!t?.compact,
                i = r ? 28 : 36;
            Q(58, e, 204, i, `#0a1a14`), l.strokeStyle = n.catColor, l.strokeRect(58.5, e + .5, 203, i - 1);
            let a = N === `title` ? 44 : 56;
            return Q(62, e + 5, a, 12, `#102820`), $(n.cat + (N === `title` ? `` : String(Ke).padStart(2, `0`)), 62 + a / 2, e + 7, n.catColor, 6, `center`), $(`この曲に対する評価・コメント`, 66 + a, e + 7, `#668877`, 6), $(n.short, 64, e + (r ? 16 : 20), `#ffeeaa`, r ? 7 : 8), r || $(`ID ${n.key}`, 258, e + 20, `#445544`, 5, `right`), i
        }

        function Oi(e, t = 0) {
            N = e, Ke = t, M = _t(e, t), Yt(Rt(e, t), B).then(e => {
                L = e
            })
        }
        async function ki(e) {
            Si(`曲の評価`) && (L = await Xt(Ti(), B, e), w())
        }
        async function Ai(e) {
            P = e, F = await Ut(e), qe = 0
        }

        function ji() {
            if (!M || M.startsWith(`—`)) {
                Je = `先に曲を再生してください`, Ye = 80, C();
                return
            }
            Xe = A === `menu` || A === `stage` || A === `boss` || A === `legacy` ? A : N === `title` ? `menu` : N;
            let e = Ti();
            Promise.all([Ai(e), Yt(e, B)]).then(([, e]) => {
                L = e, A = `comments`, qe = 0, w()
            })
        }

        function Mi() {
            A = Xe, w()
        }

        function Ni(e) {
            openSoundCommentViewer(e, {
                trackKey: P || Ti(),
                trackCard: Ei(),
                mode: N,
                modeIndex: Ke,
                playerId: B,
                linked: !!V.linked,
                redraw: () => w(),
                playError: () => C()
            })
        }

        async function Pi() {
            if (!Si(`コメント投稿`) || I) return;
            openSoundCommentComposer({
                trackKey: P || Ti(),
                trackCard: Ei(),
                mode: N,
                modeIndex: Ke,
                playerId: B,
                setComposing: (v) => { I = v },
                postComment: (trackKey, playerId, body, urls, kind) => Wt(trackKey, playerId, body, urls, kind),
                onPosted: async (trackKey) => { F = await Ut(trackKey) },
                playOk: () => _e(),
                playError: () => C()
            })
        }

        function Fi() {
            return buildSoundTestRootMenu()
        }

        function Ii(e) {
            return buildSoundTestTrackList(e, vt())
        }

        function Li() {
            if (ee(), A === `menu`) {
                let e = Fi()[j];
                if (!e) return;
                let act = soundTestMenuAction(e.action);
                if (act.type === `play_title`) Oi(`title`, 0), w();
                else if (act.type === `open_stage`) A = `stage`, j = 0, w();
                else if (act.type === `open_boss`) A = `boss`, j = 0, w();
                else if (act.type === `open_legacy`) A = `legacy`, j = 0, w();
                else if (act.type === `stop`) gt(), M = `— STOPPED —`, w();
                else if (act.type === `back`) wi();
                return
            }
            if (A === `comments`) return;
            let e = Ii(A)[j];
            let act = soundTestListAction(A, e);
            if (act.type === `back_menu`) A = `menu`, j = 0, w();
            else if (act.type === `play`) Oi(act.list, act.index), w()
        }

        function Ri() {
            if (Q(Cr, 0, Tr, Z, `#000a12`), Q(54, 14, 212, 376, `#001018`), l.strokeStyle = `#44ffcc`, l.strokeRect(54.5, 14.5, 211, 375), A === `comments`) {
                $(`COMMENTS`, X / 2, 18, `#88ffee`, 10, `center`);
                let e = Di(28, {
                    compact: !0
                });
                $(`コメント ${F.length} 件  ·  この曲専用`, X / 2, 28 + e + 4, `#668866`, 6, `center`);
                let t = 28 + e + 14;
                if (!F.length) $(`まだコメントがありません`, X / 2, 120, `#556666`, 8, `center`), $(`WRITE で最初の感想を`, X / 2, 136, `#445555`, 7, `center`);
                else {
                    let { rows } = buildCommentRows({ comments: F, cursor: qe, baseY: t });
                    for (let row of rows) {
                        row.selected && (Q(60, row.y - 1, 200, 20, `#003322`), l.strokeStyle = `#66ffaa`, l.strokeRect(60.5, row.y - .5, 199, 19));
                        $(row.text, 64, row.y + 4, row.selected ? `#ffffff` : `#99bbaa`, 7)
                    }
                }
                $(V.linked ? `👍 ${L.likes}   👎 ${L.dislikes}` : `評価・投稿はアカウント連携必須`, X / 2, 348, V.linked ? `#88aa88` : `#aa8844`, 7, `center`), Q(58, 360, 46.5, 22, L.mine === 1 ? `#204020` : `#152018`), l.strokeStyle = L.mine === 1 ? `#88ff88` : `#446644`, l.strokeRect(58.5, 360.5, 45.5, 21), $(`👍`, 82.25, 366, `#ccffcc`, 8, `center`), Q(108.5, 360, 46.5, 22, L.mine === -1 ? `#402020` : `#201518`), l.strokeStyle = L.mine === -1 ? `#ff8888` : `#664444`, l.strokeRect(109, 360.5, 45.5, 21), $(`👎`, 132.75, 366, `#ffcccc`, 8, `center`), Q(159, 360, 46.5, 22, `#1a4030`), l.strokeStyle = `#66cc88`, l.strokeRect(159.5, 360.5, 45.5, 21), $(`✍`, 183.25, 366, `#ccffdd`, 8, `center`), Q(209.5, 360, 46.5, 22, `#203040`), l.strokeStyle = `#6688aa`, l.strokeRect(210, 360.5, 45.5, 21), $(`◀`, 233.75, 366, `#aaccff`, 8, `center`), Ye > 0 && $(Je, X / 2, 388, `#ffaa66`, 6, `center`);
                return
            }
            $(`SOUND TEST`, X / 2, 18, `#88ffee`, 11, `center`), $(`LINK PERK · 全曲試聴`, X / 2, 30, `#448866`, 6, `center`);
            let e = 38;
            M && !M.startsWith(`—`) ? (e = 38 + Di(36, {
                compact: !1
            }) + 4, $(`この曲の評価  👍${L.likes}  👎${L.dislikes}`, X / 2, e - 2, `#88aa88`, 6, `center`), e += 8) : ($(`曲を選ぶと、その曲の評価・コメントが対象になります`, X / 2, 48, `#556666`, 6, `center`), e = 58);
            let t = soundTestPageSize(!!(M && !M.startsWith(`—`))),
                n = e;
            if (A === `menu`) {
                let e = Fi();
                j >= e.length && (j = e.length - 1);
                for (let t = 0; t < e.length; t++) {
                    let r = n + t * 17,
                        i = t === j;
                    i && (Q(60, r - 1, 200, 15, `#003322`), l.strokeStyle = `#66ffaa`, l.strokeRect(60.5, r - .5, 199, 14)), $(e[t].label, 66, r + 2, i ? `#ffffff` : `#88ccaa`, 8), e[t].sub && $(e[t].sub, 258, r + 3, `#446655`, 6, `right`)
                }
            } else {
                let e = Ii(A);
                j >= e.length && (j = e.length - 1);
                let r = soundTestListWindow(e.length, j, t);
                {
                    let hdr = soundTestListHeader(A);
                    $(hdr.title, X / 2, 52, hdr.color, 6, `center`);
                }
                for (let i = 0; i < Math.min(t, e.length); i++) {
                    let t = i + r,
                        a = n + 2 + i * 17,
                        o = t === j;
                    o && (Q(60, a - 1, 200, 15, `#002233`), l.strokeStyle = `#66ccff`, l.strokeRect(60.5, a - .5, 199, 14));
                    let s = e[t].action === `back`;
                    $(e[t].label, 66, a + 2, o ? `#ffffff` : s ? `#888` : `#88aacc`, 8), !s && N === A && Ke === e[t].n && $(`▶`, 256, a + 2, `#ffee66`, 7, `right`)
                }
                r > 0 && $(`▲`, X / 2, n - 4, `#44aa88`, 7, `center`), r + t < e.length && $(`▼`, X / 2, 360, `#44aa88`, 7, `center`)
            }
            if (M && !M.startsWith(`—`)) {
                if (Q(58, 360, 63.33333333333333, 22, L.mine === 1 ? `#204020` : `#152018`), l.strokeStyle = L.mine === 1 ? `#88ff88` : `#446644`, l.strokeRect(58.5, 360.5, 62.33333333333333, 21), $(`👍${L.likes}`, 90.66666666666666, 366, L.mine === 1 ? `#ccffcc` : `#88aa88`, 7, `center`), Q(125.33333333333333, 360, 63.33333333333333, 22, L.mine === -1 ? `#402020` : `#201518`), l.strokeStyle = L.mine === -1 ? `#ff8888` : `#664444`, l.strokeRect(125.83333333333333, 360.5, 62.33333333333333, 21), $(`👎 ${L.dislikes}`, 158, 366, L.mine === -1 ? `#ffcccc` : `#aa8888`, 7, `center`), Q(192.66666666666666, 360, 63.33333333333333, 22, `#1a3028`), l.strokeStyle = `#55aa77`, l.strokeRect(193.16666666666666, 360.5, 62.33333333333333, 21), $(`💬感想`, 225.33333333333331, 366, `#aaffee`, 7, `center`), !V.linked) $(`評価・コメントは連携必須`, X / 2, 350, `#aa8844`, 6, `center`);
                else {
                    let e = Ei();
                    $(`対象: ${e.cat}${N===`title`?``:Ke} ${e.short.slice(0,16)}`, X / 2, 350, `#668866`, 5, `center`)
                }
            } else $(`上下スワイプ · タップ決定`, X / 2, 366, `#335544`, 6, `center`);
            Ye > 0 && $(Je, X / 2, 388, `#ffaa66`, 6, `center`)
        }

        function zi() {
            return A === `comments` ? 70 : M && !M.startsWith(`—`) ? 84 : 58
        }

        function Bi(e) {
            return soundTestRowAtY({
                y: e,
                mode: A,
                menuLen: Fi().length,
                listLen: Ii(A).length,
                cursor: j,
                listTop: zi(),
                playing: !!(M && !M.startsWith(`—`))
            })
        }

        function Vi(e, t) {
            if (e < Cr || e > wr) {
                A === `comments` ? Mi() : wi();
                return
            }
            if (He = !0, Ue = t, We = 0, Ge = !1, A === `comments`) {
                for (let e = 0; e < F.length; e++);
                return
            }
            let n = Bi(t);
            n >= 0 && (j = n)
        }

        function Hi(e, t) {
            if (!He || p !== `soundtest`) return;
            let n = t - Ue;
            if (We += n, Ue = t, A === `comments`) {
                let e = Math.max(0, F.length - 1);
                for (; We <= -15;) qe = Math.max(0, qe - 1), We += 15, Ge = !0, w();
                for (; We >= 15;) qe = Math.min(e, qe + 1), We -= 15, Ge = !0, w();
                return
            }
            let r = A === `menu` ? Fi().length - 1 : Ii(A).length - 1;
            for (; We <= -15;) j = Math.max(0, j - 1), We += 15, Ge = !0, w();
            for (; We >= 15;) j = Math.min(r, j + 1), We -= 15, Ge = !0, w()
        }

        function Ui(e, t) {
            if (!He) return;
            if (He = !1, Ge) {
                Ge = !1;
                return
            }
            if (e < Cr || e > wr) return;
            if (A === `comments`) {
                let hit = soundTestCommentsFooterHit(e, t);
                if (hit === `like`) { ki(1); return }
                if (hit === `dislike`) { ki(-1); return }
                if (hit === `write`) { Pi(); return }
                if (hit === `back`) { Mi(); return }
                F.length ? F[qe] && Ni(F[qe]) : Pi();
                return
            }
            if (M && !M.startsWith(`—`)) {
                let hit = soundTestPlayingFooterHit(e, t);
                if (hit === `like`) { ki(1); return }
                if (hit === `dislike`) { ki(-1); return }
                if (hit === `comments`) { ji(); return }
            }
            let n = Bi(t);
            n >= 0 && (j = n), Li()
        }

        
        // ── share (X) ──
        function Wi() {
            let pack = buildSharePayload({
                playerId: B,
                stage: v,
                score: m,
                difficulty: Ie,
                mode: p,
                bossActive: !!De,
                bossName: E,
                lives: _,
                continueCoins: ht
            });
            Bn(B, pack.payload);
            xt = pack.toast, St = 120, w()
        }

        function Gi(e, t) {
            let res = resolveAttractPointer({
                x: e,
                y: t,
                Z,
                left: Cr,
                right: wr,
                sub: tSub,
                cursor: k,
                difficulty: Ie
            });
            if (res.cursor != null) k = res.cursor;
            let a = res.action;
            if (a.type === `account`) { _i(); return }
            if (a.type === `side_back_extra`) { tSub = `root`, k = 4, w(); return }
            if (a.type === `side_back_diff`) { tSub = `root`, k = 0, w(); return }
            if (a.type === `side_options`) { mr(`attract`); return }
            if (a.type === `side_extra`) { tSub = `extra`, k = 0, w(); return }
            if (a.type === `sound_test`) { Ci(); return }
            if (a.type === `profile`) { try { window.__sfOpenProfile?.() } catch {} return }
            if (a.type === `stats`) { try { window.__sfOpenStats?.() } catch {} return }
            if (a.type === `back_root`) { tSub = `root`, k = a.cursor, w(); return }
            if (a.type === `start_easy`) { Ie = `easy`, pi(); return }
            if (a.type === `start_normal`) { Ie = `normal`, pi(); return }
            if (a.type === `open_diff`) { tSub = `diff`, k = a.preferNormal ? 1 : 0, w(); return }
            if (a.type === `share`) { Wi(); return }
            if (a.type === `inbox`) { H && jt() ? yi() : bi(); return }
            if (a.type === `options`) { mr(`attract`); return }
            if (a.type === `open_extra`) { tSub = `extra`, k = 0, w(); return }
            if (a.type === `changelog`) { ai(); return }
            w()
        }

        
        // ── main update tick ──
        function Ki(e) {
            try {
              if (p === `playing` || p === `ready` || p === `bossintro`) {
                window.__sfPlayAcc = (window.__sfPlayAcc || 0) + (typeof e === "number" ? e : 0.016);
                if (window.__sfPlayAcc >= 1) { addPlayTime(window.__sfPlayAcc); window.__sfPlayAcc = 0; }
              }
            } catch (err) {}
            y++, we > 0 && (we *= .85), we < .2 && (we = 0), Me > 0 && Me--, $e > 0 && $e--, Ye > 0 && Ye--, St > 0 && St--, wt > 0 && wt--, Et > 0 && Et--, Ce > 0 && Ce--, Pe > 0 && Pe--;
            for (let e of _n) e.y += e.sp * (p === `playing` ? 1 : .3), e.y > Z && (e.y = 0, e.x = Cr + Math.random() * Tr);
            for (let e = pn.length - 1; e >= 0; e--) pn[e].y -= .45, pn[e].life--, pn[e].life <= 0 && pn.splice(e, 1);
            for (let e = gn.length - 1; e >= 0; e--) gn[e].life--, gn[e].life <= 0 && gn.splice(e, 1);
            for (let e = fn.length - 1; e >= 0; e--) {
                let t = fn[e];
                t.x += t.vx, t.y += t.vy, t.life--, t.life <= 0 && fn.splice(e, 1)
            }
            if (p === `attract` || p === `shop` || p === `options` || p === `soundtest` || p === `changelog`) return;
            if (p === `ready`) oe--, oe <= 0 && (p = `playing`);
            else if (p === `bossintro`) oe--, oe <= 0 && (p = `playing`);
            else if (p === `stageclear`) {
                oe--, oe <= 0 && fr(!1);
                return
            } else if (p === `gameover`) {
                y % 90 == 0 && Bt();
                return
            } else if (p === `name`) {
                Ae++;
                return
            } else if (p === `inbox`) {
                    Q(56, 24, 208, 360, `#001018`), l.strokeStyle = `#66ccff`, l.strokeRect(56.5, 24.5, 207, 359);
                    $(`INBOX`, X / 2, 32, `#88eeff`, 12, `center`);
                    $(`消すまで残る · ミッションMSGのみお礼可`, X / 2, 46, `#446688`, 7, `center`);
                    if (!G.length) {
                        $(`メッセージはありません`, X / 2, Z * .45, `#668888`, 8, `center`);
                        $(`TAP=戻る`, X / 2, 372, `#556666`, 7, `center`);
                    } else if (Ft) {
                        let e = G[Pt];
                        if (!e) Ft = !1;
                        else {
                            let d = buildInboxDetail(e, Wn(e));
                            $(d.header, X / 2, 60, `#aaddff`, 9, `center`);
                            $(d.fromLine, X / 2, 78, `#88aacc`, 8, `center`);
                            d.bodyLines.forEach((line, idx) => {
                                $(line, X / 2, 110 + idx * 16, `#ffffff`, 10, `center`);
                            });
                            if (d.thanksState === `can`) {
                                Q(72, Z * .55, 176, 28, `#332200`), l.strokeStyle = `#ffcc66`, l.strokeRect(72.5, 220.5, 175, 27);
                                $(d.thanksLabel, X / 2, 228, `#ffeeaa`, 9, `center`);
                            } else {
                                $(d.thanksLabel, X / 2, 228, `#889988`, 8, `center`);
                            }
                            Q(72, Z * .68, 176, 26, `#220011`), l.strokeStyle = `#ff6688`, l.strokeRect(72.5, 272.5, 175, 25);
                            $(`🗑 削除する`, X / 2, 279, `#ff99aa`, 9, `center`);
                            Q(88, Z * .8, 144, 22, `#001820`), l.strokeStyle = `#446666`, l.strokeRect(88.5, 320.5, 143, 21);
                            $(`◀ 一覧へ`, X / 2, 325, `#88aaaa`, 8, `center`);
                        }
                    } else {
                        let { rows } = buildInboxListRows({
                            messages: G,
                            cursor: Pt,
                            canThanks: Wn
                        });
                        for (let row of rows) {
                            row.selected && Q(62, row.y - 2, 196, 44, `#002233`);
                            $(row.fromLine, 66, row.y, row.kindColor, 7);
                            $(row.bodyPreview, 66, row.y + 12, `#ffffff`, 9);
                            $(row.status, 258, row.y + 12, row.statusColor, 7, `right`);
                            $(row.sourceTag, 66, row.y + 26, `#445566`, 6);
                        }
                        $(`選択TAP→詳細  下端=戻る`, X / 2, 372, `#556666`, 7, `center`);
                    }
                } else if (K.vstick && xn) Math.min(1, Math.hypot(En, Dn)) > VSTICK_DEADZONE && (J.x += En * t * e, J.y += Dn * t * e);
            else if (!K.vstick && vn) {
                let t = swipeFollowFactor(O.speed, K.sense, e);
                J.x += (yn - J.x) * t, J.y += (bn - J.y) * t
            }
            {
                let pos = clampPlayerPos(J.x, J.y);
                J.x = pos.x, J.y = pos.y
            }
            if (Se > 0 && Se--, p === `playing`) {
                if (x -= e * 60, x <= 0) {
                    (Qt(`shot`) || Qt(`option`)) && Hr();
                    {
                        x = shotCooldownFrames(q(`rate`))
                    }
                }
                if (S -= e * 60, S <= 0 && q(`missile`) > 0) {
                    Gr();
                    let e = q(`missile`),
                        t = q(`cluster`);
                    S = missileCooldownFrames(e, t)
                }
                if (T -= e * 60, T <= 0 && q(`particle`) > 0) {
                    Kr();
                    let e = q(`particle`),
                        t = q(`overdrive`);
                    T = particleCooldownFrames(e, t)
                }
                if (ye -= e * 60, ye <= 0 && q(`lockon`) > 0) {
                    qr();
                    let e = q(`lockon`),
                        t = q(`hyper`);
                    ye = lockonCooldownFrames(e, t)
                }
                if (be -= e * 60, be <= 0 && q(`beam`) > 0 && V.linked) {
                    Ur();
                    let e = q(`beam`);
                    be = beamCooldownFrames(e)
                }
                if (xe -= e * 60, xe <= 0 && q(`flame`) > 0 && V.linked) {
                    Wr();
                    let e = q(`flame`);
                    xe = flameCooldownFrames(e)
                }
                De || (b--, b <= 0 && (zr(), b = enemySpawnInterval(v)), Te >= Ee && Br());
                for (let t = dn.length - 1; t >= 0; t--) {
                    let n = dn[t];
                    if (n.phase += e * 3, n.flash > 0 && n.flash--, n.boss) {
                        let e = hn(n.bossId);
                        stepBossPosition(n, e.move, Cr, wr)
                    } else n.x += n.vx, n.y += n.vy, n.type === 2 && (n.x += Math.sin(n.phase) * .8), (n.x < 56 || n.x > 264) && (n.vx *= -1);
                    n.fireCd--, n.fireCd <= 0 && n.y > 20 && n.y < 360 && (Vr(n), n.fireCd = n.boss ? 28 + n.bossId % 20 : 50 + Math.random() * 40), !n.boss && n.y > 430 && dn.splice(t, 1), Se <= 0 && enemyPlayerHit(n.x, n.y, n.w, n.h, J.x, J.y, J.w, J.h) && (Rr(), n.boss || Lr(n, 999, n.x, n.y))
                }
                for (let e = Y.length - 1; e >= 0; e--) {
                    let t = Y[e];
                    if (t.life--, t.kind === `missile` && t.from === `p`) {
                        let e = t.targetId ? Fr(t.targetId) : void 0;
                        if (!e) {
                            let n = Ir(1)[0];
                            n && (t.targetId = n.id, e = n)
                        }
                        if (e) {
                            let n = Math.atan2(e.y - t.y, e.x - t.x),
                                r = Math.atan2(t.vy, t.vx),
                                i = n - r;
                            for (; i > Math.PI;) i -= Math.PI * 2;
                            for (; i < -Math.PI;) i += Math.PI * 2;
                            let a = r + Math.max(-t.turn, Math.min(t.turn, i)),
                                o = Math.hypot(t.vx, t.vy) || 3;
                            t.vx = Math.cos(a) * Math.min(5.5, o + .05), t.vy = Math.sin(a) * Math.min(5.5, o + .05)
                        }
                    }
                    if (t.x += t.vx, t.y += t.vy, t.life <= 0 || t.y < -20 || t.y > 420 || t.x < 28 || t.x > 292) {
                        Y.splice(e, 1);
                        continue
                    }
                    if (t.from === `p`) {
                        for (let n of dn)
                            if (aabbOverlap(t.x, t.y, t.w * 2, t.h * 2, n.x, n.y, n.w, n.h)) {
                                Lr(n, t.dmg, t.x, t.y), t.kind !== `particle` && Y.splice(e, 1), K.shake && (we = Math.min(10, we + 1));
                                break
                            }
                    } else Se <= 0 && playerBulletHit(J.x, J.y, t.x, t.y) && (Rr(), Y.splice(e, 1))
                }
            }
        }

        function qi() {
            l.fillStyle = `#000`, l.fillRect(0, 0, X, Z);
            let shake = screenShakeOffset(we),
                e = shake.x,
                t = shake.y;
            if (l.save(), l.translate(e, t), Q(Cr, 0, Tr, Z, `#000`), p === `attract`) fi();
            else if (p === `changelog`) ci();
            else if (p === `soundtest`) Ri();
            else if (p === `shop`) ri();
            else if (p === `options`) ii();
            else {
                for (let e of _n) Q(e.x, e.y, e.s, e.s, starColor(e.s));
                if (p === `playing` || p === `ready` || p === `stageclear` || p === `bossintro`) {
                    for (let e of gn) l.strokeStyle = e.color, l.globalAlpha = Math.min(1, e.life / 6), l.lineWidth = 1 + O.lockon * .4, l.beginPath(), l.moveTo(J.x, J.y - 6), l.lineTo(e.tx, e.ty), l.stroke(), l.strokeRect(e.tx - 6, e.ty - 6, 12, 12), l.globalAlpha = 1;
                    let powerLv = q(`power`);
                    for (let e of Y)
                        for (let r of bulletRects(e, powerLv)) Q(r.x, r.y, r.w, r.h, r.color);
                    for (let e of dn) Xr(e);
                    Ce > 0 && (l.strokeStyle = y % 8 < 4 ? `#66ffff` : `#2288aa`, l.beginPath(), l.arc(J.x, J.y, 14, 0, Math.PI * 2), l.stroke()), Jr(J.x, J.y, 1, Se > 0 && Math.floor(Se / 3) % 2 == 0), Yr();
                    for (let e of fn) l.globalAlpha = Math.max(0, e.life / e.max), Q(e.x, e.y, e.size, e.size, e.color);
                    l.globalAlpha = 1;
                    for (let e of pn) l.globalAlpha = Math.min(1, e.life / 20), $(e.text, e.x, e.y, e.color, 8, `center`);
                    l.globalAlpha = 1, ni()
                }
                {
                    let ban = stageBanner(p, v, E, y);
                    if (ban?.kind === `ready`) {
                        $(`STAGE ${ban.stage}`, X / 2, Z / 2 - 10, `#00ffaa`, 16, `center`);
                        $(`GET READY`, X / 2, 212, `#ffffff`, 10, `center`);
                    } else if (ban?.kind === `bossintro`) {
                        Q(58, Z / 2 - 40, 204, 70, `#220011`);
                        l.strokeStyle = ban.blink ? `#ff2244` : `#880000`;
                        l.strokeRect(58.5, Z / 2 - 39.5, 203, 69);
                        $(`WARNING!`, X / 2, Z / 2 - 28, `#ff2244`, 16, `center`);
                        $(`BOSS APPROACHING`, X / 2, Z / 2 - 6, `#ffaa00`, 10, `center`);
                        $(ban.name, X / 2, 214, `#ff66ff`, 12, `center`);
                    } else if (ban?.kind === `stageclear`) {
                        $(`STAGE CLEAR`, X / 2, Z / 2 - 8, `#ffff00`, 14, `center`);
                        $(`BOSS DEFEATED`, X / 2, 212, `#ff66ff`, 10, `center`);
                        $(`→ POWER SHOP`, X / 2, 228, `#ffff66`, 9, `center`);
                    }
                }
                if (p === `gameover`) {
                    let go = buildGameOverView({ score: m, coins: ht, frame: y });
                    $(`GAME OVER`, X / 2, Z / 2 - 48, `#ff2244`, 18, `center`);
                    $(go.scoreText, X / 2, Z / 2 - 24, `#00ff88`, 12, `center`);
                    $(go.coinText, X / 2, Z / 2 - 6, go.coinColor, 10, `center`);
                    $(`制限時間なし · シェアしてコイン待ちOK`, X / 2, 210, `#668866`, 7, `center`);
                    Q(72, 228, 176, 30, go.continue.fill), l.strokeStyle = go.continue.stroke, l.strokeRect(72.5, 228.5, 175, 29);
                    $(go.continue.label, X / 2, 237, go.continue.labelColor, 9, `center`);
                    Q(72, 264, 176, 28, `#221100`), l.strokeStyle = go.shareStroke, l.strokeRect(72.5, 264.5, 175, 27);
                    $(`𝕏 SHARE してコインGET`, X / 2, 272, `#ffcc66`, 9, `center`);
                    Q(88, 298, 144, 22, `#001100`), l.strokeStyle = `#335533`, l.strokeRect(88.5, 298.5, 143, 21);
                    $(`→ TITLE`, X / 2, 303, `#668866`, 8, `center`)
                }
                if (p === `name`) {
                    let nv = buildNameEntryView({ highScore: g, score: m, letters: ke, cursor: Oe, blinkFrame: Ae });
                    $(`ENTER YOUR NAME!`, X / 2, Z * .28, `#ff3333`, 12, `center`);
                    $(`BEST PLAYERS`, X / 2, Z * .36, `#00ffaa`, 10, `center`);
                    $(`1ST  ${nv.best}  SWF`, X / 2, Z * .44, `#fff`, 9, `center`);
                    $(`2ND  030000  FOR`, X / 2, Z * .5, `#fff`, 9, `center`);
                    $(`3RD  ${nv.current}  ${ke.join(``)}`, X / 2, Z * .56, `#ff66ff`, 9, `center`);
                    for (let e = 0; e < nv.letters.length; e++) {
                        $(nv.letters[e].ch, X / 2 - 20 + e * 20, Z * .64, nv.letters[e].color, 16, `center`)
                    }
                }
                if (p === `inbox`) {
                    if (Q(56, 24, 208, 360, `#001018`), l.strokeStyle = `#66ccff`, l.strokeRect(56.5, 24.5, 207, 359), $(`INBOX`, X / 2, 32, `#88eeff`, 12, `center`), $(`消すまで残る · ミッションMSGのみお礼可`, X / 2, 46, `#446688`, 7, `center`), !G.length) $(`メッセージはありません`, X / 2, Z * .45, `#668888`, 8, `center`), $(`TAP=戻る`, X / 2, 372, `#556666`, 7, `center`);
                    else if (Ft) {
                        let e = G[Pt];
                        if (!e) Ft = !1;
                        else {
                            $(e.source === `thanks` ? `お礼メッセージ` : `ミッション完了メッセージ`, X / 2, 60, `#aaddff`, 9, `center`), $(`From ${e.from}`, X / 2, 78, `#88aacc`, 8, `center`);
                            let t = e.body;
                            $(t.slice(0, 18), X / 2, 110, `#ffffff`, 10, `center`), t.length > 18 && $(t.slice(18, 36), X / 2, 126, `#ffffff`, 10, `center`), t.length > 36 && $(t.slice(36, 40), X / 2, 142, `#ffffff`, 10, `center`), Wn(e) ? (Q(72, Z * .55, 176, 28, `#332200`), l.strokeStyle = `#ffcc66`, l.strokeRect(72.5, 220.50000000000003, 175, 27), $(`🙏 お礼を送る (1回)`, X / 2, 228.00000000000003, `#ffeeaa`, 9, `center`)) : e.source === `thanks` ? $(`お礼MSG · 返信不可`, X / 2, 228.00000000000003, `#889988`, 8, `center`) : $(`この通にはお礼送信済み`, X / 2, 228.00000000000003, `#889988`, 8, `center`), Q(72, Z * .68, 176, 26, `#220011`), l.strokeStyle = `#ff6688`, l.strokeRect(72.5, 272.5, 175, 25), $(`🗑 削除する`, X / 2, 279, `#ff99aa`, 9, `center`), Q(88, Z * .8, 144, 22, `#001820`), l.strokeStyle = `#446666`, l.strokeRect(88.5, 320.5, 143, 21), $(`◀ 一覧へ`, X / 2, 325, `#88aaaa`, 8, `center`)
                        }
                    } else {
                        let e = Math.max(0, Math.min(Pt, Math.max(0, G.length - 5)));
                        for (let t = 0; t < Math.min(5, G.length - e); t++) {
                            let n = G[e + t],
                                r = 58 + t * 48;
                            e + t === Pt && Q(62, r - 2, 196, 44, `#002233`), $(`${n.source===`thanks`?`お礼`:`完走`} From ${n.from.slice(0,8)}`, 66, r, n.source === `thanks` ? `#ffcc88` : `#88aacc`, 7), $(n.body.slice(0, 20), 66, r + 12, `#ffffff`, 9), $(Wn(n) ? `お礼可` : n.source === `thanks` ? `受信お礼` : n.thanksSent ? `お礼済` : `—`, 258, r + 12, Wn(n) ? `#ffcc66` : `#668866`, 7, `right`), $(n.source === `mission` ? `完走MSG` : `お礼MSG`, 66, r + 26, `#445566`, 6)
                        }
                        $(`選択TAP→詳細  下端=戻る`, X / 2, 372, `#556666`, 7, `center`)
                    }
                }
                p !== `name` && p !== `inbox` && $r()
            }
            if (l.restore(), Qr(), K.scanlines) {
                l.fillStyle = `rgba(0,0,0,0.12)`;
                for (let e = 0; e < Z; e += 2) l.fillRect(Cr, e, Tr, 1)
            }
        }
        let Ji = performance.now();

        function Yi(e) {
            if (!u) return;
            let t = (e - Ji) / 1e3;
            Ji = e, t > .05 && (t = .05), Ki(t), qi(), d = requestAnimationFrame(Yi)
        }
        d = requestAnimationFrame(Yi);

        function Xi(e, t) {
            let n = s.getBoundingClientRect();
            return {
                x: (e - n.left) / n.width * X,
                y: (t - n.top) / n.height * Z
            }
        }

        function Zi(e) {
            let t = Mr.indexOf(ke[Oe]);
            ke[Oe] = Mr[(t + e + 36) % 36]
        }

        function Qi(e, t) {
            if (e < Cr || e > wr) {
                // upper BACK, lower OPT
                if (t >= 100 && t < 150) mr(`shop`);
                else pr();
                return
            }
            let n = Kn();
            if (t >= 22 && t <= 46) {
                if (e >= 150 && e <= 208) {
                    D = n.length + 2, Wi();
                    return
                }
                if (e >= 212 && e <= 264) {
                    D = n.length + 1, mr(`shop`);
                    return
                }
            }
            let r = qn(n, 10);
            for (let e = 0; e < Math.min(10, n.length); e++) {
                let i = e + r,
                    a = 68 + e * 20;
                if (t >= a - 1 && t < a + 20 - 1) {
                    D === i ? sr(n[i]) : (D = i, w());
                    return
                }
            }
            if (t >= 350 && t <= 388) {
                if (e >= 56 && e < 122.66666666666667) {
                    D = n.length + 2, Wi();
                    return
                }
                if (e >= 126.66666666666667 && e < 193.33333333333334) {
                    D = n.length + 1, mr(`shop`);
                    return
                }
                if (e >= 197.33333333333334 && e <= 264) {
                    D = n.length, pr();
                    return
                }
            }
            $i()
        }

        function $i() {
            let e = Kn();
            if (D < e.length) {
                sr(e[D]);
                return
            }
            if (D === e.length) {
                pr();
                return
            }
            if (D === e.length + 1) {
                mr(`shop`);
                return
            }
            if (D === e.length + 2) {
                Wi();
                return
            }
        }

        function ea() {
            return Kn().length + 2
        }

        function ta(e) {
            let t = ea();
            D = Math.max(0, Math.min(t, D + e)), w()
        }

        function na(e, t) {
            let hit = shopPointerDown({
                x: e,
                y: t,
                left: Cr,
                right: wr,
                catalogLen: Kn().length,
                cursor: D
            });
            if (hit.sideRail) {
                Ne && pr();
                return
            }
            ot = !0, st = e, ct = t, lt = 0, ut = !1;
            if (hit.cursor != null) D = hit.cursor
        }

        function ra(e, t) {
            if (!ot || p !== `shop`) return;
            let n = t - ct,
                r = e - st;
            if (Math.abs(n) >= Math.abs(r) * .65) {
                for (lt += n, ct = t, st = e; lt <= -16;) ta(-1), lt += 16, ut = !0;
                for (; lt >= 16;) ta(1), lt -= 16, ut = !0;
                return
            }
            st = e, ct = t
        }

        function ia(e, t) {
            if (ot) {
                if (ot = !1, ut) {
                    ut = !1;
                    return
                }
                Qi(e, t)
            }
        }

        function aa(e) {
            return optionsRowAtY(e, an().length, R)
        }

        function oa(e, t) {
            return optionsCursorStep(an(), e, t)
        }

        function sa(e, t) {
            if (e < Cr || e > wr) {
                hr();
                return
            }
            et = !0, tt = e, nt = t, rt = 0, it = 0, at = !1;
            let n = aa(t);
            n >= 0 && an()[n].kind !== `header` && (R = n)
        }

        function ca(e, t) {
            if (!et || p !== `options`) return;
            let n = e - tt,
                r = t - nt;
            if (Math.abs(r) > Math.abs(n) * .85) {
                for (it += r, tt = e, nt = t; it <= -15;) R = oa(R, -1), it += 15, at = !0, w();
                for (; it >= 15;) R = oa(R, 1), it -= 15, at = !0, w();
                return
            }
            let i = an()[R];
            if (!i || i.kind !== `vol` && i.kind !== `sense` && i.kind !== `weapon`) {
                tt = e, nt = t;
                return
            }
            if (Math.abs(n) < Math.abs(r) * .7) {
                tt = e, nt = t;
                return
            }
            rt += n, tt = e, nt = t;
            let a = optionsSwipeStep(i.kind);
            for (; rt >= a;) Nr(1), rt -= a, at = !0;
            for (; rt <= -a;) Nr(-1), rt += a, at = !0
        }

        function la(e) {
            let t = an();
            if (!t.length) return;
            let n = Math.max(0, Math.min(t.length - 1, e));
            t[n].kind === `header` && (n = oa(n, 1));
            let r = t[n];
            let act = optionsActivate(r);
            if (act.type === `noop`) return;
            R = n;
            if (act.type === `back`) { hr(); return }
            if (act.type === `submenu`) {
                act.key === `shot` ? (z = `shot`, R = 1) : (z = `weapons`, R = 1), w();
                return
            }
            if (act.type === `toggle` || act.type === `adjust`) {
                Nr(1);
                return
            }
            if (act.type === `confirm_slider`) {
                Qe = `${act.label}  OK`, $e = 40, w();
                return
            }
        }

        function ua(e, t) {
            if (!et) return;
            if (et = !1, at) {
                at = !1;
                return
            }
            if (e < Cr || e > wr) return;
            let n = aa(t);
            if (n < 0) {
                la(R);
                return
            }
            let r = an()[n];
            if (!r || r.kind === `header`) {
                la(R);
                return
            }
            if (n === R) {
                la(R);
                return
            }
            R = n, w()
        }

        function da(e, t) {
            let a = virtualStickAxis(e, t, Cn, Tn, 30);
            En = a.x, Dn = a.y
        }

        function fa(e, t) {
            let n = Xi(e, t);
            if (ee(), Gt(), p !== `attract` && p !== `options` && p !== `shop` && muteButtonHit(n.x, n.y)) {
                Fe = ne(), K.muted = Fe, Kt(), Fe || (p === `bossintro` || p === `playing` && De ? mt(mn(v).vibe, v) : (p === `playing` || p === `ready`) && W(`play`, v)), w();
                return
            }
            if (p === `attract`) {
                Gi(n.x, n.y);
                return
            }
            if (p === `changelog`) {
                li(n.x, n.y);
                return
            }
            if (p === `soundtest`) {
                Vi(n.x, n.y);
                return
            }
            if (p === `options`) {
                sa(n.x, n.y);
                return
            }
            if (p === `shop`) {
                na(n.x, n.y);
                return
            }
            if (p === `gameover`) {
                let hit = gameOverHit(n.x, n.y, Cr, wr);
                if (hit === `side_share` || hit === `share`) { Wi(), Bt(); return }
                if (hit === `side_title` || hit === `title`) { p = `attract`, Bt(), W(`attract`), w(); return }
                if (hit === `continue`) {
                    ht > 0 ? xi() : (C(), xt = `コインが必要です · シェアしよう`, St = 80);
                    return
                }
                return
            }
            if (p === `name`) {
                if (n.x < Cr || n.x > wr) {
                    p = `attract`, W(`attract`), w();
                    return
                }
                n.x < X / 3 ? Zi(-1) : n.x > X * 2 / 3 ? Zi(1) : (Oe++, Oe >= 3 && (p = `attract`, W(`attract`)));
                return
            }
            if (p === `inbox`) {
                if (n.x < Cr || n.x > wr) {
                    p = `attract`, W(`attract`), w();
                    return
                }
                if (!G.length) {
                    p = `attract`, W(`attract`);
                    return
                }
                if (!Ft) {
                    if (n.y > 364) {
                        p = `attract`, W(`attract`);
                        return
                    }
                    let e = Math.max(0, Math.min(Pt, Math.max(0, G.length - 5)));
                    for (let t = 0; t < Math.min(5, G.length - e); t++) {
                        let r = 58 + t * 48;
                        if (n.y >= r - 2 && n.y < r + 44) {
                            Pt = e + t, Ft = !0, w();
                            return
                        }
                    }
                    return
                }
                let e = G[Pt];
                if (!e) {
                    Ft = !1;
                    return
                }
                if (n.y >= Z * .55 && n.y < Z * .65) {
                    Wn(e) ? zt(e) : C();
                    return
                }
                if (n.y >= Z * .68 && n.y < Z * .78) {
                    $n({
                        playerId: B,
                        messageId: e.id
                    }).then(() => {
                        It(), Ft = !1, w()
                    });
                    return
                }
                if (n.y >= Z * .8) {
                    Ft = !1, w();
                    return
                }
                return
            }
            if ((p === `playing` || p === `ready` || p === `bossintro`) && (n.x < Cr || n.x > wr)) {
                // side rails: upper=primary, lower=alt (shop / options)
                let left = n.x < Cr,
                    upper = n.y < 100;
                if (left) upper ? fr(!0) : mr(`play`);
                else upper ? mr(`play`) : fr(!0);
                return
            }(p === `playing` || p === `ready` || p === `bossintro`) && (K.vstick ? (xn = !0, Cn = Math.max(78, Math.min(242, n.x)), Tn = Math.max(70, Math.min(380, n.y)), En = 0, Dn = 0) : (vn = !0, yn = Math.max(58, Math.min(262, n.x)), bn = Math.max(36, Math.min(382, n.y))))
        }

        function pa(e, t) {
            if (p === `options` && et) {
                let n = Xi(e, t);
                ca(n.x, n.y);
                return
            }
            if (p === `shop` && ot) {
                let n = Xi(e, t);
                ra(n.x, n.y);
                return
            }
            if (p === `soundtest` && He) {
                let n = Xi(e, t);
                Hi(n.x, n.y);
                return
            }
            if (p === `changelog` && Re) {
                let n = Xi(e, t);
                ui(n.x, n.y);
                return
            }
            let n = Xi(e, t);
            if (K.vstick && xn) {
                da(n.x, n.y);
                return
            }
            vn && (yn = Math.max(58, Math.min(262, n.x)), bn = Math.max(36, Math.min(382, n.y)))
        }
        let ma = e => {
                e.preventDefault(), fa(e.touches[0].clientX, e.touches[0].clientY)
            },
            ha = e => {
                e.preventDefault(), pa(e.touches[0].clientX, e.touches[0].clientY)
            },
            ga = e => {
                if (e.preventDefault(), p === `options` && et) {
                    let t = e.changedTouches[0];
                    if (t) {
                        let e = Xi(t.clientX, t.clientY);
                        ua(e.x, e.y)
                    } else ua(tt, nt);
                    return
                }
                if (p === `shop` && ot) {
                    let t = e.changedTouches[0];
                    if (t) {
                        let e = Xi(t.clientX, t.clientY);
                        ia(e.x, e.y)
                    } else ia(st, ct);
                    return
                }
                if (p === `soundtest` && He) {
                    let t = e.changedTouches[0];
                    if (t) {
                        let e = Xi(t.clientX, t.clientY);
                        Ui(e.x, e.y)
                    } else Ui(58, Ue);
                    return
                }
                if (p === `changelog` && Re) {
                    let t = e.changedTouches[0];
                    if (t) {
                        let e = Xi(t.clientX, t.clientY);
                        di(e.x, e.y)
                    } else di(58, ze);
                    return
                }
                vn = !1, kn()
            },
            _a = e => fa(e.clientX, e.clientY),
            va = e => pa(e.clientX, e.clientY),
            ya = e => {
                if (p === `options` && et) {
                    let t = Xi(e.clientX, e.clientY);
                    ua(t.x, t.y);
                    return
                }
                if (p === `shop` && ot) {
                    let t = Xi(e.clientX, e.clientY);
                    ia(t.x, t.y);
                    return
                }
                if (p === `soundtest` && He) {
                    let t = Xi(e.clientX, e.clientY);
                    Ui(t.x, t.y);
                    return
                }
                if (p === `changelog` && Re) {
                    let t = Xi(e.clientX, e.clientY);
                    di(t.x, t.y);
                    return
                }
                vn = !1, kn()
            },
            ba = e => {
                On.add(e.key), ee();
                let act = resolveKeyAction({
                    key: e.key,
                    mode: p,
                    soundSub: A,
                    shopPaused: !!Ne
                });
                if (act.type === `mute_toggle`) {
                    Fe = ne(), K.muted = Fe, Kt(), Fe || (p === `shop` || p === `attract` || p === `options` ? W(`attract`) : p === `playing` && De ? mt(mn(v).vibe, v) : (p === `playing` || p === `ready`) && W(`play`, v));
                    return
                }
                if (p === `options`) {
                    if (act.type === `options_up`) R = oa(R, -1), w();
                    else if (act.type === `options_down`) R = oa(R, 1), w();
                    else if (act.type === `options_left`) Nr(-1);
                    else if (act.type === `options_right`) Nr(1);
                    else if (act.type === `options_confirm`) {
                        let t = an();
                        t[R]?.kind === `back` ? hr() : Nr(1)
                    } else if (act.type === `options_back`) hr();
                    return
                }
                if (p === `soundtest`) {
                    if (A === `comments`) {
                        if (act.type === `st_comments_up`) qe = Math.max(0, qe - 1), w();
                        else if (act.type === `st_comments_down`) qe = Math.min(Math.max(0, F.length - 1), qe + 1), w();
                        else if (act.type === `st_comments_write`) Pi();
                        else if (act.type === `st_comments_back`) Mi();
                        else if (act.type === `st_like`) ki(1);
                        else if (act.type === `st_dislike`) ki(-1);
                        return
                    }
                    let t = A === `menu` ? Fi().length - 1 : Ii(A).length - 1;
                    if (act.type === `st_up`) j = Math.max(0, j - 1), w();
                    else if (act.type === `st_down`) j = Math.min(t, j + 1), w();
                    else if (act.type === `st_confirm`) Li();
                    else if (act.type === `st_comments_open`) ji();
                    else if (act.type === `st_like`) ki(1);
                    else if (act.type === `st_dislike`) ki(-1);
                    else if (act.type === `st_escape`) A === `menu` ? wi() : (A = `menu`, j = 0);
                    return
                }
                if (p === `attract`) {
                    if (act.type === `attract_up`) k = (k + titleMenuLen(tSub) - 1) % titleMenuLen(tSub), w();
                    else if (act.type === `attract_down`) k = (k + 1) % titleMenuLen(tSub), w();
                    else if (act.type === `attract_confirm`) {
                        if (tSub === `extra`) {
                            if (k === 0) Ci();
                            else if (k === 1) (typeof window.__sfOpenProfile === `function` ? window.__sfOpenProfile() : 0);
                            else if (k === 2) (typeof window.__sfOpenStats === `function` ? window.__sfOpenStats() : 0);
                            else tSub = `root`, k = 4, w();
                        } else if (tSub === `diff`) {
                            if (k === 0) Ie = `easy`, pi();
                            else if (k === 1) Ie = `normal`, pi();
                            else tSub = `root`, k = 0, w();
                        } else if (k === 0) tSub = `diff`, k = Ie === `normal` ? 1 : 0, w();
                        else if (k === 1) Wi();
                        else if (k === 2) H && jt() ? yi() : bi();
                        else if (k === 3) mr(`attract`);
                        else if (k === 4) tSub = `extra`, k = 0, w();
                        else if (k === 5) ai();
                        else w()
                    }
                    return
                }
                if (p === `changelog`) {
                    if (act.type === `changelog_up`) Le = Math.max(0, Le - 1), w();
                    else if (act.type === `changelog_down`) Le = Math.min(si(), Le + 1), w();
                    else if (act.type === `changelog_back`) oi();
                    return
                }
                if (p === `inbox`) {
                    if (act.type === `inbox_escape`) {
                        Ft ? Ft = !1 : (p = `attract`, W(`attract`));
                        return
                    }
                    if (act.type === `inbox_up` && !Ft && G.length) Pt = (Pt - 1 + G.length) % G.length, w();
                    if (act.type === `inbox_down` && !Ft && G.length) Pt = (Pt + 1) % G.length, w();
                    if (act.type === `inbox_confirm`) {
                        if (!Ft && G.length) Ft = !0;
                        else if (Ft) {
                            let e = G[Pt];
                            Wn(e) && zt(e)
                        }
                        return
                    }
                    if (act.type === `inbox_delete` && Ft) {
                        let e = G[Pt];
                        e && $n({ playerId: B, messageId: e.id }).then(() => { It(), Ft = !1 });
                        return
                    }
                    return
                }
                if (p === `gameover`) {
                    if (act.type === `gameover_continue_or_share`) {
                        ht > 0 ? xi() : Wi();
                        return
                    }
                    if (act.type === `gameover_share`) { Wi(); return }
                    if (act.type === `gameover_title`) { p = `attract`, Bt(), W(`attract`); return }
                }
                if (act.type === `pause_shop`) {
                    e.preventDefault(), fr(!0);
                    return
                }
                if (act.type === `open_options_play`) {
                    e.preventDefault(), mr(`play`);
                    return
                }
                if (p === `shop`) {
                    let t = Kn(),
                        n = t.length + 2;
                    if (act.type === `shop_up`) D = (D + n) % (n + 1);
                    else if (act.type === `shop_down`) D = (D + 1) % (n + 1);
                    else if (act.type === `shop_confirm`) {
                        D === t.length ? pr() : D === t.length + 1 ? mr(`shop`) : D === t.length + 2 ? Wi() : sr(t[D])
                    } else if (act.type === `shop_escape`) Ne && pr()
                }
            },
            xa = e => {
                On.delete(e.key)
            };
        return s.addEventListener(`touchstart`, ma, {
            passive: !1
        }), s.addEventListener(`touchmove`, ha, {
            passive: !1
        }), s.addEventListener(`touchend`, ga, {
            passive: !1
        }), s.addEventListener(`mousedown`, _a), window.addEventListener(`mousemove`, va), window.addEventListener(`mouseup`, ya), window.addEventListener(`keydown`, ba), window.addEventListener(`keyup`, xa), window.__sfOpenProfile = function() {
              try {
                openProfileDialog({
                  linked: !!(V && V.linked),
                  playerId: B || "",
                  sfxUi: function(){ try{w()}catch(e){} },
                  sfxOk: function(){ try{_e()}catch(e){} },
                  sfxFail: function(){ try{C()}catch(e){} },
                  onNeedLink: function(){ try{_i()}catch(e){} }
                });
              } catch (err) { console.error(err); }
            }, window.__sfOpenStats = function() {
              try {
                openStatsDialog({
                  playerId: B || "",
                  linked: !!(V && V.linked),
                  sfxUi: function(){ try{w()}catch(e){} }
                });
              } catch (err) { console.error(err); }
            }, window.__swipeForceTest = {
            mode: () => p,
            start: () => pi(),
            openShop: () => fr(!0),
            openOptions: () => mr(`shop`),
            setVstick: e => {
                K.vstick = e, Kt()
            },
            playerId: () => B,
            coins: () => ht,
            setCoins: e => {
                ht = Math.max(0, e | 0)
            },
            setRef: (e, t) => {
                let n = e ? e.replace(/[^a-z0-9]/gi, ``).slice(0, 32) : null,
                    r = t ? t.replace(/[^a-z0-9]/gi, ``).slice(0, 32) : null;
                n && n !== B && r && r.length >= 4 ? (H = n, U = r) : (H = null, U = null), Ot()
            },
            award: () => hi(),
            missions: () => Dt,
            openFanmail: () => yi(),
            openInbox: () => bi(),
            share: () => Wi()
        }, W(`attract`), () => {
            u = !1, cancelAnimationFrame(d), Mn.disconnect(), s.removeEventListener(`touchstart`, ma), s.removeEventListener(`touchmove`, ha), s.removeEventListener(`touchend`, ga), s.removeEventListener(`mousedown`, _a), window.removeEventListener(`mousemove`, va), window.removeEventListener(`mouseup`, ya), window.removeEventListener(`keydown`, ba), window.removeEventListener(`keyup`, xa), gt()
        }
    }, []), (0, xr.jsx)(`div`, {
        ref: e,
        className: `flex h-dvh w-full items-center justify-center bg-black`,
        style: {
            touchAction: `none`
        },
        children: (0, xr.jsx)(`canvas`, {
            ref: t,
            className: `max-h-full max-w-full`
        })
    })
}

function Pr() {
    return (0, xr.jsx)(Nr, {})
}



/** React entry used by the route */
export function SwipeForceGameCanvas() {
  return Pr();
}
export { Nr as SwipeForceEngineRoot, Pr };
