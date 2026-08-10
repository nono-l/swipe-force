// @ts-nocheck
/**
 * Recovered canvas game loop (production bundle decompiled).
 * Behavior frozen — rename internals gradually with playtests.
 */
import {
  A,
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
  ln,
  lr,
  lt,
  m,
  me,
  mn,
  mr,
  mt,
  ne,
  nr,
  nt,
  oe,
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
  sr,
  st,
  te,
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
} from "./support/runtime";
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

import { openAccountDialog } from "./ui/account-dialog";
import { openSoundCommentViewer } from "./ui/sound-comment-viewer";
import { openSoundCommentComposer } from "./ui/sound-comment-composer";

import { openFanmailDialog, closeFanmailDialog } from "./ui/fanmail-dialog";
import { openThanksDialog, thanksBlockedMessage } from "./ui/thanks-dialog";
import {
  aabbOverlap,
  applyEnemyDamage,
  applyOptionDelta,
  applyShopPurchase,
  armedLevel,
  beamCooldownFrames,
  bgm,
  BOSS_CLEAR_MISSION,
  bossClearMissionId,
  bossFlashAlpha,
  bossHpBar,
  bossLocalRects,
  buildBeams,
  buildBossEntity,
  buildBurstParticles,
  buildChangelogRows,
  buildCommentRows,
  buildContinueSeed,
  buildEnemyFire,
  buildFlames,
  buildGameOverView,
  buildGrunt,
  buildHudBottomChips,
  buildHudFlags,
  buildHudTop,
  buildInboxDetail,
  buildInboxListRows,
  buildLockonHits,
  buildMissiles,
  buildMissionChips,
  buildNameEntryView,
  buildNewRunSeed,
  buildOptionRows,
  buildParticles,
  buildPlayerShots,
  buildSharePayload,
  buildShopRows,
  buildSoundTestRootMenu,
  buildSoundTestTrackList,
  buildStageSeed,
  buildTitleMenu,
  buildTitleMissionRows,
  buildTrackCard,
  buildWeaponChips,
  bulletOutOfBounds,
  bulletRects,
  canAttemptMission,
  canOpenComments,
  changelogBackHit,
  changelogMaxScroll,
  changelogVisibleRows,
  clampPlayerPos,
  closeShopSeed,
  commentKindEmoji,
  commentKindLabel,
  commentsFooterButtons,
  commentsReturnMode,
  continueCoinLine,
  countArmedWeapons,
  decayTimers,
  defaultSettings,
  defaultWepLv,
  dodgeOnlyFeedback,
  dragScrollSteps,
  drawRoute,
  enemyHpHud,
  enemyHpMultiplier,
  enemyPlayerHit,
  enemyReloadFrames,
  enemyShouldDespawn,
  enemyShouldFire,
  enemySpawnInterval,
  fanmailGate,
  fanmailGateMessage,
  fieldDrawsEntities,
  fieldShowsHud,
  filterShopCatalog,
  FIRST_BOSS_MISSION,
  firstBossMissionId,
  flameCooldownFrames,
  floatTextAlpha,
  formatLoadoutSummary,
  formatOptionValue,
  formatShotSubSummary,
  formatVolumeBar,
  gameOverHit,
  getSideRailButtons,
  gruntLocalRects,
  highScoreUpdate,
  inboxPointerHit,
  invulnBlink,
  isArmed,
  keyboardAxis,
  lifePipXs,
  listWindowStart,
  loadEasyCarry,
  LOADOUT_COUNT_KEYS,
  lockonAlpha,
  lockonCooldownFrames,
  mergeSettingsFromStorage,
  missileCooldownFrames,
  missionClearFloats,
  missionNextLine,
  missionPlaySeconds,
  missionTooFastFloats,
  muteButtonHit,
  muteLabel,
  nameEntryHit,
  normalCostScale,
  normalizeAxis,
  openOptionsSeed,
  openShopSeed,
  optionPodRects,
  OPTIONS_PAGE,
  optionsActivate,
  optionsBackTarget,
  optionsCursorStep,
  optionsHint,
  optionsPointerDown,
  optionsPointerUp,
  optionsRowAtY,
  optionsRowColors,
  optionsScreenTitle,
  optionsSwipeStep,
  ownedLevel,
  particleAlpha,
  particleCooldownFrames,
  pickNearestEnemies,
  PLAYER_SHIP_FILL,
  PLAYER_SHIP_PATH,
  playerBulletHit,
  playerShipLocalRects,
  playerSpeed,
  playingFooterButtons,
  playMoveFromPointer,
  playSceneBgm,
  playBossBgm,
  playSfx,
  requireLinked,
  resolveAttractPointer,
  resolveKeyAction,
  resolvePlayerHit,
  routePointerDown,
  scoreHpThresholds,
  screenShakeOffset,
  serializeEasyCarry,
  sfx,
  shieldStrokeColor,
  shopCursorMax,
  shopCursorStep,
  shopDragScroll,
  shopEmptyConfirm,
  shopFooterButtonsExact,
  shopFooterIndices,
  shopHeaderChips,
  shopItemCost,
  shopItemMax,
  shopPointerDown,
  shopPointerUp,
  shopStatusLine,
  shopTierHint,
  shopUnlockTier,
  SHOT_SUMMARY_KEYS,
  shotCooldownFrames,
  SIDE_RAIL_BRAND,
  sideRailBtnStyle,
  sideRailHints,
  SOUND_TEST_MENU,
  soundTestCommentsFooterHit,
  soundTestListAction,
  soundTestListHeader,
  soundTestListTop,
  soundTestListWindow,
  soundTestMenuAction,
  soundTestPageSize,
  soundTestPlayingFooterHit,
  soundTestPointerDown,
  soundTestPointerUp,
  soundTestRowAtY,
  stageBanner,
  starColor,
  steerMissile,
  stepBossPosition,
  stepEnemyMotion,
  swipeFollowFactor,
  tickFloats,
  tickLifetimes,
  tickMode,
  tickParticles,
  tickSpawnTimer,
  tickStars,
  tickWeaponCds,
  titleFooter,
  titleHeader,
  titleHitHeights,
  titleInboxLabels,
  titleLinkStyle,
  titleMenuLen,
  titleMenuRowColors,
  titleMenuYs,
  titleMissionFooter,
  titleNoiseDot,
  titleNoiseRgb,
  titleSelectLabel,
  totalHpScale,
  trackCardLayout,
  virtualStickAxis,
  virtualStickLayout,
  VSTICK_DEADZONE,
  vstickDrawOps,
  vstickVisible,
  createPlayerShots,
  createMissiles,
  createParticles,
  createBeams,
  createFlames,
  createEnemyVolley,
  createLockonHits,
  spawnGrunt,
  spawnBoss,
  toAttractDispatch,
  routePointerMove,
  clampSwipeFollow,
  buildSideRailPaint,
  stageBannerOverlay,
  scanlineFill,
  planWeaponFire,
  planSpawn,
} from "./modes/game-api";


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
                sfx.ui();
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
                sfx.buyFail(), xt = thanksBlockedMessage(e), St = 80;
                return
            }
            if (Lt) return;
            Lt = !0, sfx.ui();
            openThanksDialog({
                host: n,
                sanitize: (raw) => At(raw),
                reasonText: (reason) => Nt(reason),
                send: (text) => er({
                    playerId: B,
                    messageId: e.id,
                    text
                }),
                onClose: () => { vi() },
                onSent: () => { It(), yr() },
                playOk: () => sfx.buy(),
                playError: () => sfx.buyFail(),
                playUi: () => sfx.ui()
            })
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
            bgm.setMasterVol(K.master / 10), bgm.setBgmVol(K.bgm / 10), bgm.setSfxVol(K.sfx / 10), bgm.setMuted(K.muted), Fe = K.muted
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
            return totalHpScale(Ie, m)
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
                je = `PTS不足 / MAX`, Me = 60, sfx.buyFail();
                return
            }
            h = result.pts, _ = result.lives, Ce = result.shieldFrames, O = result.upgrades;
            if (result.wepLvChanged) {
                K.wepLv = result.wepLv, Kt()
            }
            if (e.id !== `life` && e.id !== `shield`) ir();
            sfx.buy(), je = result.message, Me = 50;
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
            kn(), bgm.start(`play`, v)
        }

        
        // ── open shop ──
        function fr(e = !1) {
            let seed = openShopSeed(!!e);
            p = seed.mode, Ne = seed.paused, D = seed.cursor, je = seed.toast, Me = seed.toastLife;
            vn = !1, kn();
            if (seed.clearEntities) Y.length = 0, dn.length = 0, gn.length = 0;
            sfx.ui(), bgm.start(`attract`)
        }

        function pr() {
            let seed = closeShopSeed(!!Ne);
            if (seed.type === `resume_play`) {
                p = `playing`, Se = Math.max(Se, seed.invulnMin), Ne = !1;
                De ? bgm.boss(mn(v).vibe, v) : bgm.start(`play`, v)
            } else {
                v++, dr()
            }
            sfx.ui()
        }

        
        // ── open options ──
        function mr(e) {
            let seed = openOptionsSeed(e);
            Ze = seed.from, p = seed.mode, z = seed.submenu, R = seed.cursor;
            Qe = ``, $e = 0, vn = !1, kn(), sfx.ui(), bgm.start(`attract`)
        }

        function hr() {
            if (Kt(), sfx.ui(), z === `shot` || z === `weapons`) {
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
            if (Ze === `shop`) p = `shop`, bgm.start(`attract`);
            else if (Ze === `play` || Ze === `playing` || Ze === `game`) {
                p = `playing`, Se = Math.max(Se, 45), Ne = !1;
                De ? bgm.boss(mn(v).vibe, v) : bgm.start(`play`, v);
            } else p = `attract`, bgm.start(`attract`);
            sfx.ui()
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
            if (res.type === `navigate_shot`) { z = `shot`, R = 1, sfx.ui(); return }
            if (res.type === `navigate_weapons`) { z = `weapons`, R = 1, sfx.ui(); return }
            if (res.type === `applied`) {
                K = res.settings;
                if (res.clearVstick) kn();
                if (n.kind === `weapon`) {
                    let fb = dodgeOnlyFeedback($t(), res.feedback);
                    Qe = fb || res.feedback || ``, $e = res.feedbackLife || 55
                }
                Kt();
                if (res.replayAttractIfUnmuted && !K.muted) bgm.start(`attract`);
                sfx.ui()
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
            let out = applyEnemyDamage(e, t, n, r);
            sfx.hit();
            if (out.type === `survive`) {
                Pr(out.spark.x, out.spark.y, out.spark.color, out.spark.count);
                return
            }
            Pr(out.burst.x, out.burst.y, out.burst.color, out.burst.count);
            sfx.explode(out.boss);
            m += out.scoreAdd;
            h += out.ptsAdd;
            pn.push(out.float);
            if (!out.boss) Te++;
            if (out.boss) {
                gi(), p = `stageclear`, oe = 120, sfx.stageClear(), bgm.stop();
                if (K.shake && out.shake) we = out.shake;
            }
            let idx = dn.indexOf(e);
            idx >= 0 && dn.splice(idx, 1)
        }

        function Rr() {
            let out = resolvePlayerHit({
                invulnFrames: Se,
                shieldFrames: Ce,
                lives: _
            });
            if (out.type === `blocked_invuln`) return;
            if (out.type === `shield_break`) {
                Ce = 0, Se = out.invulnFrames;
                Pr(J.x, J.y, out.burst.color, out.burst.count), sfx.playerHit();
                return
            }
            _ = out.lives, Se = out.invulnFrames;
            if (K.shake) we = out.shake;
            sfx.playerHit(), Pr(J.x, J.y, out.burst.color, out.burst.count);
            if (out.gameover) {
                p = `gameover`, oe = out.gameoverFrames, sfx.gameOver(), bgm.stop();
                let hs = highScoreUpdate(m, g);
                if (hs.dirty) {
                    g = hs.high;
                    localStorage.setItem(kr, String(g))
                }
            }
        }

        function zr() {
            dn.push(spawnGrunt({
                id: f++,
                stage: v,
                hpScale: Xn()
            }))
        }

        function Br() {
            let e = mn(v);
            E = e.name, De = !0, p = `bossintro`, oe = 120, sfx.bossWarn(), hi(), bgm.boss(e.vibe, v);
            dn.push(spawnBoss({
                id: f++,
                stage: v,
                hpScale: Xn(),
                boss: e,
                fieldCenterX: X / 2
            }))
        }

        function Vr(e) {
            let atk = e.boss ? hn(e.bossId).atk : 0;
            for (let b of createEnemyVolley(e, J.x, J.y, atk)) Y.push(b)
        }

        function Hr() {
            let bullets = createPlayerShots(J.x, J.y, {
                shot: q(`shot`),
                overdrive: q(`overdrive`),
                power: q(`power`),
                option: q(`option`)
            });
            if (bullets.length) {
                sfx.shoot();
                for (let b of bullets) Y.push(b)
            }
        }

        function Ur() {
            let e = q(`beam`);
            if (e <= 0 || !V.linked) return;
            sfx.lockon();
            for (let b of createBeams({
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
            for (let b of createFlames({
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
            sfx.missile();
            for (let b of createMissiles({
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
            sfx.particle();
            for (let b of createParticles({
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
                hits = createLockonHits({
                    targets: Ir(e + (t > 0 ? t + 1 : 0)),
                    lockon: e,
                    hyper: t
                });
            hits.length && sfx.lockon();
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
            let paint = buildSideRailPaint({
                mode: p,
                titleSub: tSub,
                shopPaused: !!Ne,
                muted: !!Fe,
                fieldH: Z,
                leftW: Sr,
                rightX: wr,
                muteDisabled: p === `options` || p === `shop`
            });
            Q(0, 0, Sr, Z, paint.railFill), Q(wr, 0, Sr, Z, paint.railFill);
            $(paint.brand.lines[0], paint.brand.leftX, 12, paint.brand.color, 6);
            $(paint.brand.lines[1], paint.brand.leftX, 22, paint.brand.color, 6);
            $(paint.brand.lines[0], paint.brand.rightX, 12, paint.brand.color, 6);
            $(paint.brand.lines[1], paint.brand.rightX, 22, paint.brand.color, 6);
            for (let b of paint.buttons) {
                Q(b.x, b.y, b.w, b.h, b.fill);
                l.strokeStyle = b.stroke;
                l.lineWidth = 1;
                l.strokeRect(b.x + .5, b.y + .5, b.w - 1, b.h - 1);
                $(b.label, b.x + b.w / 2, b.y + 10, b.labelColor, 6, `center`);
                if (b.sub) $(b.sub, b.x + b.w / 2, b.y + 24, b.subColor, 5, `center`);
            }
            if (paint.hints.left) $(paint.hints.left, 24, 160, `#335533`, 5, `center`);
            if (paint.hints.right) $(paint.hints.right, wr + 24, 160, `#335533`, 5, `center`);
            $(paint.mute.text, paint.mute.x, paint.mute.y, paint.mute.color, 7);
        }

        function $r() {
            let top = buildHudTop({ score: m, high: g, pts: h, coins: ht, stage: v });
            $(top.score, 52, 4, `#00ff88`, 8);
            $(top.hi, 268, 4, `#ffff66`, 8, `right`);
            $(top.pts, 52, 14, `#ffff66`, 8);
            $(top.coins, 118, 14, `#ffee88`, 8);
            $(top.stage, 268, 14, `#88ffaa`, 8, `right`);
            let flags = buildHudFlags({
                weaponsEnabledCount: $t(),
                shotArmed: Qt(`shot`),
                vstick: !!K.vstick,
                difficulty: Ie,
                enemyHpMult: Yn()
            });
            let ehp = enemyHpHud(flags.enemyHpMult);
            ehp && $(ehp, 52, 24, `#ff8866`, 7);
            $(flags.diffLabel, 268, 24, flags.diffLabel === `ESY` ? `#88ff88` : `#ffaa66`, 6, `right`);
            for (let x of lifePipXs(_)) Q(x, 388, 6, 6, `#44ff88`);
            let chips = buildHudBottomChips({
                dodgeOnly: flags.dodgeOnly,
                shotOff: flags.shotOff,
                weaponLabels: buildWeaponChips(O, q).map(c => ({ label: c.label, color: c.color })),
                frame: y
            });
            let n = 52;
            for (let item of chips.items) {
                $(item.text, n, 376, item.color, 7);
                n += item.text === `DODGE ONLY` ? 56 : item.text === `SHOT OFF` ? 48 : 18;
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
            if (!vstickVisible(!!K.vstick, p)) return;
            let lay = virtualStickLayout({
                active: !!xn,
                centerX: Cn,
                centerY: Tn,
                axisX: En,
                axisY: Dn
            });
            for (let op of vstickDrawOps(lay, !!xn)) {
                if (op.type === `save`) l.save();
                else if (op.type === `restore`) l.restore();
                else if (op.type === `alpha`) l.globalAlpha = op.a;
                else if (op.type === `strokeStyle`) l.strokeStyle = op.c;
                else if (op.type === `fillStyle`) l.fillStyle = op.c;
                else if (op.type === `lineWidth`) l.lineWidth = op.w;
                else if (op.type === `arc`) {
                    l.beginPath(), l.arc(op.x, op.y, op.r, 0, Math.PI * 2);
                    op.fill && l.fill();
                    op.stroke && l.stroke();
                } else if (op.type === `cross`) {
                    l.beginPath();
                    l.moveTo(op.x - op.r + 4, op.y), l.lineTo(op.x + op.r - 4, op.y);
                    l.moveTo(op.x, op.y - op.r + 4), l.lineTo(op.x, op.y + op.r - 4);
                    l.stroke();
                }
            }
        }

        function ri() {
            let e = Kn(),
                t = qn(e, 10);
            Q(Cr, 0, Tr, Z, `#001400`), Q(54, 20, 212, 372, `#002200`), l.strokeStyle = `#00ff66`, l.strokeRect(54.5, 20.5, 211, 371), $(`POWER SHOP`, 62, 24, `#ffff00`, 11);
            let foot = shopFooterIndices(e.length),
                n = D === foot.share,
                r = D === foot.opt;
            for (let chip of shopHeaderChips({ shareSelected: n, optSelected: r })) {
                Q(chip.x, chip.y, chip.w, chip.h, chip.fill);
                l.strokeStyle = chip.stroke;
                l.lineWidth = 2;
                l.strokeRect(chip.x + .5, chip.y + .5, chip.w - 1, chip.h - 1);
                $(chip.label, chip.labelX, chip.labelY, chip.labelColor, 8, `center`);
            }
            l.lineWidth = 1;
            let st = shopStatusLine({ pts: h, tier: zn(), difficulty: Ie });
            $(st.text, X / 2, 46, st.color, 8, `center`);
            let tier = shopTierHint({ tier2: Fn(), tier3: Rn(), celebrate: Pe > 0, frame: y });
            $(tier.text, X / 2, 56, tier.color, 6, `center`);
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
            for (let b of shopFooterButtonsExact({ catalogLen: e.length, cursor: D, pauseShop: !!Ne, shareSelected: n, optSelected: r })) {
                Q(b.x, b.y, b.w, b.h, b.fill);
                l.strokeStyle = b.stroke;
                l.lineWidth = 2;
                l.strokeRect(b.x + .5, b.y + .5, b.w - 1, b.h - 1);
                $(b.label, b.labelX, b.labelY, b.labelColor, b.sub ? 8 : 9, `center`);
                b.sub && $(b.sub, b.labelX, b.subY, `#886644`, 6, `center`);
            }
            l.lineWidth = 1;
            Me > 0 ? $(je, X / 2, 388, `#ffaa00`, 6, `center`) : $(Ne ? `進行中SHAREで助けを呼べます` : `上下スワイプ · 空欄タップで決定`, X / 2, 388, `#335544`, 6, `center`)
        }

        function ii() {
            let e = an();
            R >= e.length && (R = Math.max(0, e.length - 1));
            let scr = optionsScreenTitle(z);
            Q(Cr, 0, Tr, Z, `#001018`), Q(54, 18, 212, 370, `#001a22`), l.strokeStyle = scr.border, l.strokeRect(54.5, 18.5, 211, 369);
            $(scr.title, X / 2, 22, scr.titleColor, 11, `center`);
            $(scr.subtitle, X / 2, 36, `#448888`, 7, `center`);
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
                let cols = optionsRowColors({
                    kind: i.kind,
                    selected: o,
                    weaponOn: i.kind === `weapon` ? q(i.key) > 0 : undefined
                });
                $(i.label, 64, a + 3, cols.label, 8);
                let c = xr(i);
                c && $(c, 260, a + 3, cols.value, 7, `right`)
            }
            t > 0 && $(`▲`, X / 2, 38, `#00ccff`, 7, `center`), t + 14 < e.length && $(`▼`, X / 2, 372, `#00ccff`, 7, `center`);
            let hint = optionsHint({ submenu: z, feedback: Qe, feedbackActive: $e > 0 });
            $(hint, X / 2, 386, $e > 0 ? `#ffaa00` : `#446666`, 6, `center`)
        }

        
        // ── version changelog mode ──
        function ai() {
            p = `changelog`, Le = 0, sfx.ui()
        }

        function oi() {
            p = `attract`, sfx.ui()
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
            for (Be += n, ze = t; Be <= -14;) Le = Math.max(0, Le - 1), Be += 14, Ve = !0, sfx.ui();
            for (; Be >= 14;) Le = Math.min(si(), Le + 1), Be -= 14, Ve = !0, sfx.ui()
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
            for (let i = 0; i < 400; i++) {
                let d = titleNoiseDot(Cr, Tr, Z);
                l.fillStyle = titleNoiseRgb(d.g), l.fillRect(d.x, d.y, 1, 1)
            }
            let e = X / 2;
            let hdr = titleHeader(un());
            $(hdr.title, e, 28, `#00ff88`, 15, `center`);
            $(hdr.tagline, e, 44, `#66aa66`, 7, `center`);
            $(hdr.credit, e, 56, `#88cc88`, 8, `center`);
            $(hdr.versionLine, e, 66, `#556666`, 6, `center`);
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
            let coin = continueCoinLine(ht);
            $(coin.text, e, 80, coin.color, 9, `center`);
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
            let foot = titleFooter();
            $(foot.left, 56, 386, `#335533`, 6), $(foot.right, 266, 386, `#2a4a2a`, 6, `right`)
        }

        
        // ── start run ──
        function pi() {
            cr(), yt = performance.now(), bt = !1, Ot(), wt = 0, Tt = ``, Et = 0, sfx.start(), dr();
            try { noteRunStart(); window.__sfPlayAcc = 0; } catch (err) {}
        }

        
        // ── mission progress tick ──
        function mi(e) {
            if (!canAttemptMission({ sharerId: H, shareId: U, alreadyDone: !!Dt[e] })) return;
            let t = missionPlaySeconds(yt),
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
                    wt = fb.bannerFrames, Tt = fb.toast, Et = fb.toastLife, sfx.stageClear();
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
            if (bt) return;
            let mid = firstBossMissionId(v, bt);
            if (mid) bt = !0, mi(mid)
        }

        function gi() {
            let mid = bossClearMissionId(v);
            mid && mi(mid)
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
                onClose: () => sfx.ui(),
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
                        sfx.ui();
                    }
                },
                onOpenProfile: () => {
                    try { window.__sfOpenProfile?.(); } catch {}
                },
                onOpenStats: () => {
                    try { window.__sfOpenStats?.(); } catch {}
                },
                onAfterLink: () => {
                    sfx.buy();
                    setTimeout(() => _i(), 200);
                },
                playUi: () => sfx.buy(),
                playError: () => sfx.buyFail()
            });
            sfx.ui();
            bgm.unlock();
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
                if (gate.reason === `no_share`) { sfx.buyFail(); return }
                sfx.buyFail(), xt = fanmailGateMessage(gate.reason), St = 90;
                return
            }
            sfx.ui(), Lt = !0;
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
                onClose: () => { vi(); sfx.ui() },
                onSent: () => { yr() },
                playOk: () => sfx.buy(),
                playError: () => sfx.buyFail()
            })
        }

        
        // ── inbox ──
        function bi() {
            It(), yr(), p = `inbox`, Pt = 0, Ft = !1, sfx.ui()
        }
        async function xi() {
            if (Ct || ht <= 0) return;
            Ct = !0;
            let e = await Un(B);
            if (ht = e.coins, Ct = !1, !e.ok) {
                sfx.buyFail();
                return
            }
            let seed = buildContinueSeed({ currentShield: Ce });
            _ = seed.lives, Se = seed.invulnFrames, Ce = seed.shieldFrames;
            p = seed.mode, oe = seed.readyFrames, sfx.buy();
            pn.push({
                x: J.x,
                y: J.y + seed.float.dy,
                text: seed.float.text,
                color: seed.float.color,
                life: seed.float.life
            });
            De ? bgm.boss(mn(v).vibe, v) : bgm.start(`play`, v)
        }

        function Si(e = `この機能`) {
            let gate = requireLinked(!!V.linked, e);
            if (gate.ok) return !0;
            Je = gate.message, Ye = 100, xt = Je, St = 100, sfx.buyFail();
            return !1
        }

        
        // ── sound test ──
        function Ci() {
            if (!V.linked) {
                xt = `SOUND TEST はアカウント連携特典です`, St = 90, sfx.buyFail();
                return
            }
            bgm.unlock(), A = `menu`, j = 0, M = ``, p = `soundtest`, bgm.start(`attract`), N = `title`, Ke = 0, M = `TITLE THEME`, Yt(`title`, B).then(e => {
                L = e
            }), sfx.ui()
        }

        function wi() {
            p = `attract`, bgm.start(`attract`), M = ``, sfx.ui()
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
                lay = trackCardLayout({
                    top: e,
                    compact: !!t?.compact,
                    mode: N,
                    index: Ke,
                    cat: n.cat
                });
            Q(lay.box.x, lay.box.y, lay.box.w, lay.box.h, `#0a1a14`);
            l.strokeStyle = n.catColor;
            l.strokeRect(lay.box.x + .5, lay.box.y + .5, lay.box.w - 1, lay.box.h - 1);
            Q(lay.catBadge.x, lay.catBadge.y, lay.catBadge.w, lay.catBadge.h, `#102820`);
            $(lay.catBadge.text, lay.catLabelX, lay.catLabelY, n.catColor, 6, `center`);
            $(`この曲に対する評価・コメント`, lay.metaX, lay.metaY, `#668877`, 6);
            $(n.short, 64, lay.titleY, `#ffeeaa`, lay.titleSize);
            lay.showId && $(`ID ${n.key}`, 258, lay.idY, `#445544`, 5, `right`);
            return lay.height
        }

        function Oi(e, t = 0) {
            N = e, Ke = t, M = _t(e, t), Yt(Rt(e, t), B).then(e => {
                L = e
            })
        }
        async function ki(e) {
            if (!Si(`曲の評価`)) return;
            L = await Xt(Ti(), B, e), sfx.ui()
        }
        async function Ai(e) {
            P = e, F = await Ut(e), qe = 0
        }

        function ji() {
            let can = canOpenComments(M);
            if (!can.ok) {
                Je = can.message, Ye = 80, sfx.buyFail();
                return
            }
            Xe = commentsReturnMode(A, N);
            let e = Ti();
            Promise.all([Ai(e), Yt(e, B)]).then(([, e]) => {
                L = e, A = `comments`, qe = 0, sfx.ui()
            })
        }

        function Mi() {
            A = Xe, sfx.ui()
        }

        function Ni(e) {
            openSoundCommentViewer(e, {
                trackKey: P || Ti(),
                trackCard: Ei(),
                mode: N,
                modeIndex: Ke,
                playerId: B,
                linked: !!V.linked,
                redraw: () => sfx.ui(),
                playError: () => sfx.buyFail()
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
                playOk: () => sfx.buy(),
                playError: () => sfx.buyFail()
            })
        }

        function Fi() {
            return buildSoundTestRootMenu()
        }

        function Ii(e) {
            return buildSoundTestTrackList(e, vt())
        }

        function Li() {
            if (bgm.unlock(), A === `menu`) {
                let e = Fi()[j];
                if (!e) return;
                let act = soundTestMenuAction(e.action);
                if (act.type === `play_title`) Oi(`title`, 0), sfx.ui();
                else if (act.type === `open_stage`) A = `stage`, j = 0, sfx.ui();
                else if (act.type === `open_boss`) A = `boss`, j = 0, sfx.ui();
                else if (act.type === `open_legacy`) A = `legacy`, j = 0, sfx.ui();
                else if (act.type === `stop`) bgm.stop(), M = `— STOPPED —`, sfx.ui();
                else if (act.type === `back`) wi();
                return
            }
            if (A === `comments`) return;
            let e = Ii(A)[j];
            let act = soundTestListAction(A, e);
            if (act.type === `back_menu`) A = `menu`, j = 0, sfx.ui();
            else if (act.type === `play`) Oi(act.list, act.index), sfx.ui()
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
                $(V.linked ? `👍 ${L.likes}   👎 ${L.dislikes}` : `評価・投稿はアカウント連携必須`, X / 2, 348, V.linked ? `#88aa88` : `#aa8844`, 7, `center`);
                for (let b of commentsFooterButtons({ mine: L.mine })) {
                    Q(b.x, b.y, b.w, b.h, b.fill);
                    l.strokeStyle = b.stroke;
                    l.strokeRect(b.x + .5, b.y + .5, b.w - 1, b.h - 1);
                    $(b.label, b.labelX, b.labelY, b.labelColor, 8, `center`);
                }
                Ye > 0 && $(Je, X / 2, 388, `#ffaa66`, 6, `center`);
                return
            }
            $(`SOUND TEST`, X / 2, 18, `#88ffee`, 11, `center`), $(`LINK PERK · 全曲試聴`, X / 2, 30, `#448866`, 6, `center`);
            let playing = !!(M && !M.startsWith(`—`)),
                cardH = 0;
            if (playing) cardH = Di(36, { compact: !1 });
            let top = soundTestListTop(playing, cardH);
            if (playing && top.ratingY != null) $(`この曲の評価  👍${L.likes}  👎${L.dislikes}`, X / 2, top.ratingY, `#88aa88`, 6, `center`);
            else if (top.hintY != null) $(`曲を選ぶと、その曲の評価・コメントが対象になります`, X / 2, top.hintY, `#556666`, 6, `center`);
            let t = soundTestPageSize(playing),
                n = top.listTop;
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
                for (let b of playingFooterButtons({ likes: L.likes, dislikes: L.dislikes, mine: L.mine })) {
                    Q(b.x, b.y, b.w, b.h, b.fill);
                    l.strokeStyle = b.stroke;
                    l.strokeRect(b.x + .5, b.y + .5, b.w - 1, b.h - 1);
                    $(b.label, b.labelX, b.labelY, b.labelColor, 7, `center`);
                }
                if (!V.linked) $(`評価・コメントは連携必須`, X / 2, 350, `#aa8844`, 6, `center`);
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
            let down = soundTestPointerDown({
                x: e,
                y: t,
                left: Cr,
                right: wr,
                mode: A,
                rowAtY: Bi
            });
            if (down.type === `side_back_comments`) { Mi(); return }
            if (down.type === `side_back_list`) { wi(); return }
            He = !0, Ue = t, We = 0, Ge = !1;
            if (down.selectRow != null) j = down.selectRow
        }

        function Hi(e, t) {
            if (!He || p !== `soundtest`) return;
            let n = t - Ue;
            let scr = dragScrollSteps(We, n, 15);
            We = scr.accum, Ue = t;
            if (!scr.steps) return;
            Ge = !0;
            if (A === `comments`) {
                let e = Math.max(0, F.length - 1);
                qe = Math.max(0, Math.min(e, qe + scr.steps)), sfx.ui();
                return
            }
            let r = A === `menu` ? Fi().length - 1 : Ii(A).length - 1;
            j = Math.max(0, Math.min(r, j + scr.steps)), sfx.ui()
        }

        function Ui(e, t) {
            if (!He) return;
            if (He = !1, Ge) {
                Ge = !1;
                return
            }
            let up = soundTestPointerUp({
                dragged: !1,
                x: e,
                y: t,
                left: Cr,
                right: wr,
                mode: A,
                playing: !!(M && !M.startsWith(`—`)),
                hasComments: !!F.length,
                commentsFooter: soundTestCommentsFooterHit,
                playingFooter: soundTestPlayingFooterHit,
                rowAtY: Bi
            });
            if (up.type === `ignore`) return;
            if (up.type === `footer_like`) { ki(1); return }
            if (up.type === `footer_dislike`) { ki(-1); return }
            if (up.type === `footer_write` || up.type === `write_first`) { Pi(); return }
            if (up.type === `footer_back`) { Mi(); return }
            if (up.type === `footer_comments`) { ji(); return }
            if (up.type === `open_comment`) { F[qe] && Ni(F[qe]); return }
            if (up.type === `activate_row`) {
                if (up.row >= 0) j = up.row;
                Li()
            }
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
            xt = pack.toast, St = 120, sfx.ui()
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
            let a = toAttractDispatch(res.action);
            if (a.type === `account`) { _i(); return }
            if (a.type === `side_back_extra`) { tSub = `root`, k = 4, sfx.ui(); return }
            if (a.type === `side_back_diff`) { tSub = `root`, k = 0, sfx.ui(); return }
            if (a.type === `side_options`) { mr(`attract`); return }
            if (a.type === `side_extra`) { tSub = `extra`, k = 0, sfx.ui(); return }
            if (a.type === `sound_test`) { Ci(); return }
            if (a.type === `profile`) { try { window.__sfOpenProfile?.() } catch {} return }
            if (a.type === `stats`) { try { window.__sfOpenStats?.() } catch {} return }
            if (a.type === `back_root`) { tSub = `root`, k = a.cursor, sfx.ui(); return }
            if (a.type === `start_easy`) { Ie = `easy`, pi(); return }
            if (a.type === `start_normal`) { Ie = `normal`, pi(); return }
            if (a.type === `open_diff`) { tSub = `diff`, k = a.preferNormal ? 1 : 0, sfx.ui(); return }
            if (a.type === `share`) { Wi(); return }
            if (a.type === `inbox`) { H && jt() ? yi() : bi(); return }
            if (a.type === `options`) { mr(`attract`); return }
            if (a.type === `open_extra`) { tSub = `extra`, k = 0, sfx.ui(); return }
            if (a.type === `changelog`) { ai(); return }
            sfx.ui()
        }

        
        // ── main update tick ──
        function Ki(e) {
            try {
              if (p === `playing` || p === `ready` || p === `bossintro`) {
                window.__sfPlayAcc = (window.__sfPlayAcc || 0) + (typeof e === "number" ? e : 0.016);
                if (window.__sfPlayAcc >= 1) { addPlayTime(window.__sfPlayAcc); window.__sfPlayAcc = 0; }
              }
            } catch (err) {}
            y++;
            {
                let d = decayTimers({
                    shake: we, shopToast: Me, optToast: $e, stToast: Ye,
                    shareToast: St, missionBanner: wt, missionToast: Et,
                    shield: Ce, celebrate: Pe
                });
                we = d.shake, Me = d.shopToast, $e = d.optToast, Ye = d.stToast;
                St = d.shareToast, wt = d.missionBanner, Et = d.missionToast;
                Ce = d.shield, Pe = d.celebrate;
            }
            tickStars(_n, p, Z, Cr, Tr);
            tickFloats(pn);
            tickLifetimes(gn);
            tickParticles(fn);

            let mtick = tickMode({ mode: p, readyFrames: oe, frame: y });
            if (mtick.type === `menu_idle`) return;
            if (mtick.type === `stageclear_to_shop`) {
                oe = mtick.readyLeft;
                if (mtick.openShop) fr(!1);
                return
            }
            if (mtick.type === `gameover_poll`) {
                mtick.pollCoins && Bt();
                return
            }
            if (mtick.type === `name_blink`) { Ae++; return }
            if (mtick.type === `inbox_idle`) return;
            if (mtick.type === `countdown_to_playing`) {
                oe = mtick.readyLeft;
                if (oe <= 0) p = `playing`;
            } else if (mtick.type === `play`) {
                if (K.vstick && xn) {
                let sp = playerSpeed(O.speed, K.sense);
                Math.min(1, Math.hypot(En, Dn)) > VSTICK_DEADZONE && (J.x += En * sp * e, J.y += Dn * sp * e);
            } else if (!K.vstick && vn) {
                let t = swipeFollowFactor(O.speed, K.sense, e);
                J.x += (yn - J.x) * t, J.y += (bn - J.y) * t
            }
            }
            {
                let pos = clampPlayerPos(J.x, J.y);
                J.x = pos.x, J.y = pos.y
            }
            if (Se > 0 && Se--, p === `playing`) {
                {
                    let tick = planWeaponFire({
                        shot: x, missile: S, particle: T, lockon: ye, beam: be, flame: xe
                    }, {
                        rate: q(`rate`),
                        missile: q(`missile`),
                        cluster: q(`cluster`),
                        particle: q(`particle`),
                        overdrive: q(`overdrive`),
                        lockon: q(`lockon`),
                        hyper: q(`hyper`),
                        beam: q(`beam`),
                        flame: q(`flame`),
                        shotArmed: Qt(`shot`),
                        optionArmed: Qt(`option`),
                        linked: !!V.linked
                    }, e);
                    x = tick.cds.shot, S = tick.cds.missile, T = tick.cds.particle;
                    ye = tick.cds.lockon, be = tick.cds.beam, xe = tick.cds.flame;
                    for (let f of tick.fire) {
                        if (f === `shot`) Hr();
                        else if (f === `missile`) Gr();
                        else if (f === `particle`) Kr();
                        else if (f === `lockon`) qr();
                        else if (f === `beam`) Ur();
                        else if (f === `flame`) Wr();
                    }
                }
                {
                    let sp = planSpawn({
                        bossActive: !!De,
                        spawnCd: b,
                        kills: Te,
                        killTarget: Ee,
                        stage: v
                    });
                    b = sp.spawnCd;
                    if (sp.spawn) zr(), b = sp.afterSpawnCd;
                    if (sp.startBoss) Br();
                }
                for (let t = dn.length - 1; t >= 0; t--) {
                    let n = dn[t];
                    stepEnemyMotion(n, e, (en) => {
                        let meta = hn(en.bossId);
                        stepBossPosition(en, meta.move, Cr, wr);
                    });
                    n.fireCd--;
                    if (enemyShouldFire(n)) {
                        Vr(n);
                        n.fireCd = enemyReloadFrames(n);
                    }
                    if (enemyShouldDespawn(n)) {
                        dn.splice(t, 1);
                        continue
                    }
                    if (Se <= 0 && enemyPlayerHit(n.x, n.y, n.w, n.h, J.x, J.y, J.w, J.h)) {
                        Rr();
                        if (!n.boss) Lr(n, 999, n.x, n.y);
                    }
                }
                for (let bi = Y.length - 1; bi >= 0; bi--) {
                    let t = Y[bi];
                    t.life--;
                    if (t.kind === `missile` && t.from === `p`) {
                        let tgt = t.targetId ? Fr(t.targetId) : void 0;
                        if (!tgt) {
                            let n = Ir(1)[0];
                            n && (t.targetId = n.id, tgt = n)
                        }
                        steerMissile(t, tgt);
                    }
                    t.x += t.vx, t.y += t.vy;
                    if (bulletOutOfBounds(t)) {
                        Y.splice(bi, 1);
                        continue
                    }
                    if (t.from === `p`) {
                        for (let n of dn)
                            if (aabbOverlap(t.x, t.y, t.w * 2, t.h * 2, n.x, n.y, n.w, n.h)) {
                                Lr(n, t.dmg, t.x, t.y), t.kind !== `particle` && Y.splice(bi, 1), K.shake && (we = Math.min(10, we + 1));
                                break
                            }
                    } else Se <= 0 && playerBulletHit(J.x, J.y, t.x, t.y) && (Rr(), Y.splice(bi, 1))
                }
            }
        }

        function qi() {
            l.fillStyle = `#000`, l.fillRect(0, 0, X, Z);
            let shake = screenShakeOffset(we),
                e = shake.x,
                t = shake.y;
            let route = drawRoute(p);
            if (l.save(), l.translate(e, t), Q(Cr, 0, Tr, Z, `#000`), route === `attract`) fi();
            else if (route === `changelog`) ci();
            else if (route === `soundtest`) Ri();
            else if (route === `shop`) ri();
            else if (route === `options`) ii();
            else {
                for (let e of _n) Q(e.x, e.y, e.s, e.s, starColor(e.s));
                if (fieldDrawsEntities(p)) {
                    for (let e of gn) l.strokeStyle = e.color, l.globalAlpha = lockonAlpha(e.life), l.lineWidth = 1 + O.lockon * .4, l.beginPath(), l.moveTo(J.x, J.y - 6), l.lineTo(e.tx, e.ty), l.stroke(), l.strokeRect(e.tx - 6, e.ty - 6, 12, 12), l.globalAlpha = 1;
                    let powerLv = q(`power`);
                    for (let e of Y)
                        for (let r of bulletRects(e, powerLv)) Q(r.x, r.y, r.w, r.h, r.color);
                    for (let e of dn) Xr(e);
                    Ce > 0 && (l.strokeStyle = shieldStrokeColor(y), l.beginPath(), l.arc(J.x, J.y, 14, 0, Math.PI * 2), l.stroke()), Jr(J.x, J.y, 1, invulnBlink(Se)), Yr();
                    for (let e of fn) l.globalAlpha = particleAlpha(e.life, e.max), Q(e.x, e.y, e.size, e.size, e.color);
                    l.globalAlpha = 1;
                    for (let e of pn) l.globalAlpha = floatTextAlpha(e.life), $(e.text, e.x, e.y, e.color, 8, `center`);
                    l.globalAlpha = 1, ni()
                }
                {
                    let ov = stageBannerOverlay(stageBanner(p, v, E, y), X, Z);
                    if (ov) {
                        for (let r of ov.rects) {
                            if (r.fill) Q(r.x, r.y, r.w, r.h, r.fill);
                            if (r.stroke) {
                                l.strokeStyle = r.stroke;
                                l.strokeRect(r.x + .5, r.y + .5, r.w - 1, r.h - 1);
                            }
                        }
                        for (let t of ov.texts) $(t.text, t.x, t.y, t.color, t.size, t.align || `center`);
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
                                Q(72, Z * .55, 176, 28, `#332200`), l.strokeStyle = `#ffcc66`, l.strokeRect(72.5, Z * .55 + .5, 175, 27);
                                $(d.thanksLabel, X / 2, Z * .55 + 8, `#ffeeaa`, 9, `center`);
                            } else {
                                $(d.thanksLabel, X / 2, Z * .55 + 8, `#889988`, 8, `center`);
                            }
                            Q(72, Z * .68, 176, 26, `#220011`), l.strokeStyle = `#ff6688`, l.strokeRect(72.5, Z * .68 + .5, 175, 25);
                            $(`🗑 削除する`, X / 2, Z * .68 + 7, `#ff99aa`, 9, `center`);
                            Q(88, Z * .8, 144, 22, `#001820`), l.strokeStyle = `#446666`, l.strokeRect(88.5, Z * .8 + .5, 143, 21);
                            $(`◀ 一覧へ`, X / 2, Z * .8 + 5, `#88aaaa`, 8, `center`);
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
                }
                fieldShowsHud(p) && $r()
            }
            if (l.restore(), Qr(), K.scanlines) {
                l.fillStyle = scanlineFill();
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
            let act = shopPointerUp({
                x: e,
                y: t,
                left: Cr,
                right: wr,
                catalogLen: Kn().length,
                cursor: D
            });
            let n = Kn();
            if (act.type === `side_opt`) { mr(`shop`); return }
            if (act.type === `side_back`) { pr(); return }
            if (act.type === `header_share` || act.type === `footer_share`) { D = n.length + 2, Wi(); return }
            if (act.type === `header_opt` || act.type === `footer_opt`) { D = n.length + 1, mr(`shop`); return }
            if (act.type === `footer_go`) { D = n.length, pr(); return }
            if (act.type === `buy`) { D = act.index, sr(n[act.index]); return }
            if (act.type === `select`) { D = act.index, sfx.ui(); return }
            if (act.type === `empty_confirm`) $i()
        }

        function $i() {
            let e = Kn(),
                act = shopEmptyConfirm(D, e.length);
            if (act.type === `buy`) sr(e[act.index]);
            else if (act.type === `go`) pr();
            else if (act.type === `opt`) mr(`shop`);
            else if (act.type === `share`) Wi()
        }

        function ea() {
            return shopCursorMax(Kn().length)
        }

        function ta(e) {
            D = shopCursorStep(D, e, Kn().length), sfx.ui()
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
            let scr = shopDragScroll({ dx: r, dy: n, accum: lt, stepPx: 16 });
            if (scr.vertical) {
                lt = scr.accum, ct = t, st = e;
                if (scr.steps) ta(scr.steps), ut = !0;
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
            let down = optionsPointerDown({
                x: e,
                y: t,
                left: Cr,
                right: wr,
                rowAtY: aa,
                rowKind: (i) => an()[i]?.kind
            });
            if (down.sideBack) { hr(); return }
            et = !0, tt = e, nt = t, rt = 0, it = 0, at = !1;
            if (down.selectRow) R = down.rowIndex
        }

        function ca(e, t) {
            if (!et || p !== `options`) return;
            let n = e - tt,
                r = t - nt;
            if (Math.abs(r) > Math.abs(n) * .85) {
                for (it += r, tt = e, nt = t; it <= -15;) R = oa(R, -1), it += 15, at = !0, sfx.ui();
                for (; it >= 15;) R = oa(R, 1), it -= 15, at = !0, sfx.ui();
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
                act.key === `shot` ? (z = `shot`, R = 1) : (z = `weapons`, R = 1), sfx.ui();
                return
            }
            if (act.type === `toggle` || act.type === `adjust`) {
                Nr(1);
                return
            }
            if (act.type === `confirm_slider`) {
                Qe = `${act.label}  OK`, $e = 40, sfx.ui();
                return
            }
        }

        function ua(e, t) {
            if (!et) return;
            et = !1;
            let up = optionsPointerUp({
                dragged: !!at,
                x: e,
                y: t,
                left: Cr,
                right: wr,
                cursor: R,
                rowAtY: aa,
                rowKind: (i) => an()[i]?.kind
            });
            at = !1;
            if (up.type === `ignore`) return;
            if (up.type === `activate`) { la(up.cursor); return }
            if (up.type === `select`) { R = up.cursor, sfx.ui() }
        }

        function da(e, t) {
            let a = virtualStickAxis(e, t, Cn, Tn, 30);
            En = a.x, Dn = a.y
        }

        function fa(e, t) {
            let n = Xi(e, t);
            bgm.unlock(), Gt();
            let route = routePointerDown({
                mode: p,
                x: n.x,
                y: n.y,
                left: Cr,
                right: wr,
                muteHit: muteButtonHit(n.x, n.y)
            });
            if (route.type === `mute`) {
                Fe = bgm.toggleMute(), K.muted = Fe, Kt(), Fe || (p === `bossintro` || p === `playing` && De ? bgm.boss(mn(v).vibe, v) : (p === `playing` || p === `ready`) && bgm.start(`play`, v)), sfx.ui();
                return
            }
            if (route.type === `mode` && route.mode === `attract`) { Gi(n.x, n.y); return }
            if (route.type === `mode` && route.mode === `changelog`) { li(n.x, n.y); return }
            if (route.type === `mode` && route.mode === `soundtest`) { Vi(n.x, n.y); return }
            if (route.type === `mode` && route.mode === `options`) { sa(n.x, n.y); return }
            if (route.type === `mode` && route.mode === `shop`) { na(n.x, n.y); return }
            if (route.type === `mode` && route.mode === `gameover`) {
                let hit = gameOverHit(n.x, n.y, Cr, wr);
                if (hit === `side_share` || hit === `share`) { Wi(), Bt(); return }
                if (hit === `side_title` || hit === `title`) { p = `attract`, Bt(), bgm.start(`attract`), sfx.ui(); return }
                if (hit === `continue`) {
                    ht > 0 ? xi() : (sfx.buyFail(), xt = `コインが必要です · シェアしよう`, St = 80);
                    return
                }
                return
            }
            if (route.type === `mode` && route.mode === `name`) {
                let hit = nameEntryHit(n.x, X, Cr, wr);
                if (hit === `side_back`) { p = `attract`, bgm.start(`attract`), sfx.ui(); return }
                if (hit === `letter_prev`) Zi(-1);
                else if (hit === `letter_next`) Zi(1);
                else Oe++, Oe >= 3 && (p = `attract`, bgm.start(`attract`));
                return
            }
            if (route.type === `mode` && route.mode === `inbox`) {
                let hit = inboxPointerHit({
                    x: n.x,
                    y: n.y,
                    left: Cr,
                    right: wr,
                    fieldH: Z,
                    messageCount: G.length,
                    detailOpen: !!Ft,
                    cursor: Pt
                });
                if (hit.type === `side_title` || hit.type === `empty_title` || hit.type === `list_back`) {
                    p = `attract`, bgm.start(`attract`), sfx.ui();
                    return
                }
                if (hit.type === `open`) { Pt = hit.index, Ft = !0, sfx.ui(); return }
                if (hit.type === `thanks`) {
                    let e = G[Pt];
                    if (!e) { Ft = !1; return }
                    Wn(e) ? zt(e) : sfx.buyFail();
                    return
                }
                if (hit.type === `delete`) {
                    let e = G[Pt];
                    if (!e) { Ft = !1; return }
                    $n({ playerId: B, messageId: e.id }).then(() => { It(), Ft = !1, sfx.ui() });
                    return
                }
                if (hit.type === `to_list`) { Ft = !1, sfx.ui(); return }
                if (hit.type === `clear_detail`) { Ft = !1; return }
                return
            }
            if (route.type === `play_side`) {
                if (route.left) route.upper ? fr(!0) : mr(`play`);
                else route.upper ? mr(`play`) : fr(!0);
                return
            }
            if (route.type === `play_move`) {
                let mv = playMoveFromPointer({ x: n.x, y: n.y, vstick: !!K.vstick });
                if (mv.vstick) xn = !0, Cn = mv.stickX, Tn = mv.stickY, En = 0, Dn = 0;
                else vn = !0, yn = mv.followX, bn = mv.followY
            }
        }

        function pa(e, t) {
            let route = routePointerMove({
                mode: p,
                optionsDragging: !!et,
                shopDragging: !!ot,
                soundtestDragging: !!He,
                changelogDragging: !!Re,
                vstickEnabled: !!K.vstick,
                vstickActive: !!xn,
                swipeActive: !!vn
            });
            let n = Xi(e, t);
            if (route.type === `options_drag`) { ca(n.x, n.y); return }
            if (route.type === `shop_drag`) { ra(n.x, n.y); return }
            if (route.type === `soundtest_drag`) { Hi(n.x, n.y); return }
            if (route.type === `changelog_drag`) { ui(n.x, n.y); return }
            if (route.type === `vstick`) { da(n.x, n.y); return }
            if (route.type === `swipe_follow`) {
                let pos = clampSwipeFollow(n.x, n.y);
                yn = pos.x, bn = pos.y
            }
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
                On.add(e.key), bgm.unlock();
                let act = resolveKeyAction({
                    key: e.key,
                    mode: p,
                    soundSub: A,
                    shopPaused: !!Ne
                });
                if (act.type === `mute_toggle`) {
                    Fe = bgm.toggleMute(), K.muted = Fe, Kt(), Fe || (p === `shop` || p === `attract` || p === `options` ? bgm.start(`attract`) : p === `playing` && De ? bgm.boss(mn(v).vibe, v) : (p === `playing` || p === `ready`) && bgm.start(`play`, v));
                    return
                }
                if (p === `options`) {
                    if (act.type === `options_up`) R = oa(R, -1), sfx.ui();
                    else if (act.type === `options_down`) R = oa(R, 1), sfx.ui();
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
                        if (act.type === `st_comments_up`) qe = Math.max(0, qe - 1), sfx.ui();
                        else if (act.type === `st_comments_down`) qe = Math.min(Math.max(0, F.length - 1), qe + 1), sfx.ui();
                        else if (act.type === `st_comments_write`) Pi();
                        else if (act.type === `st_comments_back`) Mi();
                        else if (act.type === `st_like`) ki(1);
                        else if (act.type === `st_dislike`) ki(-1);
                        return
                    }
                    let t = A === `menu` ? Fi().length - 1 : Ii(A).length - 1;
                    if (act.type === `st_up`) j = Math.max(0, j - 1), sfx.ui();
                    else if (act.type === `st_down`) j = Math.min(t, j + 1), sfx.ui();
                    else if (act.type === `st_confirm`) Li();
                    else if (act.type === `st_comments_open`) ji();
                    else if (act.type === `st_like`) ki(1);
                    else if (act.type === `st_dislike`) ki(-1);
                    else if (act.type === `st_escape`) A === `menu` ? wi() : (A = `menu`, j = 0);
                    return
                }
                if (p === `attract`) {
                    if (act.type === `attract_up`) k = (k + titleMenuLen(tSub) - 1) % titleMenuLen(tSub), sfx.ui();
                    else if (act.type === `attract_down`) k = (k + 1) % titleMenuLen(tSub), sfx.ui();
                    else if (act.type === `attract_confirm`) {
                        if (tSub === `extra`) {
                            if (k === 0) Ci();
                            else if (k === 1) (typeof window.__sfOpenProfile === `function` ? window.__sfOpenProfile() : 0);
                            else if (k === 2) (typeof window.__sfOpenStats === `function` ? window.__sfOpenStats() : 0);
                            else tSub = `root`, k = 4, sfx.ui();
                        } else if (tSub === `diff`) {
                            if (k === 0) Ie = `easy`, pi();
                            else if (k === 1) Ie = `normal`, pi();
                            else tSub = `root`, k = 0, sfx.ui();
                        } else if (k === 0) tSub = `diff`, k = Ie === `normal` ? 1 : 0, sfx.ui();
                        else if (k === 1) Wi();
                        else if (k === 2) H && jt() ? yi() : bi();
                        else if (k === 3) mr(`attract`);
                        else if (k === 4) tSub = `extra`, k = 0, sfx.ui();
                        else if (k === 5) ai();
                        else sfx.ui()
                    }
                    return
                }
                if (p === `changelog`) {
                    if (act.type === `changelog_up`) Le = Math.max(0, Le - 1), sfx.ui();
                    else if (act.type === `changelog_down`) Le = Math.min(si(), Le + 1), sfx.ui();
                    else if (act.type === `changelog_back`) oi();
                    return
                }
                if (p === `inbox`) {
                    if (act.type === `inbox_escape`) {
                        Ft ? Ft = !1 : (p = `attract`, bgm.start(`attract`));
                        return
                    }
                    if (act.type === `inbox_up` && !Ft && G.length) Pt = (Pt - 1 + G.length) % G.length, sfx.ui();
                    if (act.type === `inbox_down` && !Ft && G.length) Pt = (Pt + 1) % G.length, sfx.ui();
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
                    if (act.type === `gameover_title`) { p = `attract`, Bt(), bgm.start(`attract`); return }
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
                  sfxUi: function(){ try{sfx.ui()}catch(e){} },
                  sfxOk: function(){ try{sfx.buy()}catch(e){} },
                  sfxFail: function(){ try{sfx.buyFail()}catch(e){} },
                  onNeedLink: function(){ try{_i()}catch(e){} }
                });
              } catch (err) { console.error(err); }
            }, window.__sfOpenStats = function() {
              try {
                openStatsDialog({
                  playerId: B || "",
                  linked: !!(V && V.linked),
                  sfxUi: function(){ try{sfx.ui()}catch(e){} }
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
        }, bgm.start(`attract`), () => {
            u = !1, cancelAnimationFrame(d), Mn.disconnect(), s.removeEventListener(`touchstart`, ma), s.removeEventListener(`touchmove`, ha), s.removeEventListener(`touchend`, ga), s.removeEventListener(`mousedown`, _a), window.removeEventListener(`mousemove`, va), window.removeEventListener(`mouseup`, ya), window.removeEventListener(`keydown`, ba), window.removeEventListener(`keyup`, xa), bgm.stop()
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
