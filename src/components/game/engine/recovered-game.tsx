// @ts-nocheck
/**
 * SWIPE FORCE 本体キャンバス。
 *
 * 本番バンドルを復元したゲームループです。読みやすい名前へ戻してありますが、
 * 挙動は変えないでください。状態は SwipeForceEngine のクロージャに閉じます。
 *
 * 名前の約束:
 * - 翻訳は translate()。1文字の t は圧縮後の引数と衝突して落ちます。
 * - ポインタ座標の再代入で let を重ねない（TDZ）。
 */
import * as React from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";

const jsxRuntime = { jsx: _jsx, jsxs: _jsxs };

import {
  PLAY_W,
  PLAY_H,
  RAIL_W,
  FIELD_RIGHT,
  FIELD_INNER_W,
  DEFAULT_UPGRADES,
  SHOP_ITEMS,
  LINKED_ITEM_IDS,
  SETTINGS_KEY,
  EASY_UP_KEY,
  HI_SCORE_KEY,
  NAME_CHARSET,
  MISSION_DEFS as MISSION_DEFS,
  loadPlayerId as loadPlayerId,
  linkAccountPost as linkAccountPost,
  fetchAccountGet as fetchAccountGet,
  syncAccountCloud as syncAccountCloud,
  unlinkAccountLocal as unlinkAccountLocal,
  ensureLocalPlayerId as ensureLocalPlayerId,
  getMissionsForShare as loadMissionsDone,
  parseShareParams as parseShareParams,
  getCoins as loadContinueCoins,
  canSendFanmailTo as canSendFanmailTo,
  allMissionsComplete as allMissionsDoneFor,
  hasSentFanmail as alreadySentFanmailTo,
  canReplyThanks as canReplyThanks,
  deleteInboxMessage as deleteInboxMessage,
  bossForStage as bossForStage,
  bossById as bossById,
  openShareSheet as openShareSheet,
  reportMissionClear as reportMissionClear,
  spendContinueCoin as spendContinueCoin,
  fetchCoinBalance as fetchCoinBalance,
  sendThanksReply as sendThanksReply,
  fetchInboxMessages as fetchInboxMessages,
  sendFanmailMessage as sendFanmailMessage,
  sanitizeUserText as sanitizeUserText,
  sanitizeReasonText as sanitizeReasonText,
  makeTrackKey as makeTrackKey,
  fetchTrackComments as fetchTrackComments,
  postTrackComment as postTrackComment,
  fetchTrackVotes as fetchTrackVotes,
  castTrackVote as castTrackVote,
  playBgmForMode as playBgmForMode,
  soundCatalogMeta as soundCatalogMeta,
  APP_VERSION as APP_VERSION,
  VERSION_HISTORY as VERSION_HISTORY,
  versionShortLabel as versionShortLabel,
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
  openViewProfileDialog,
  loadSharerProfile,
  shareProfilePayload,
} from "@/lib/profile-ui";
import { syncProfileFromServer } from "@/lib/account";
import { openPromoAdminDialog } from "@/lib/promo-admin-ui";
import { claimPromoRemote } from "@/lib/promo-api";
import {
  drawStageMap,
  getStageMap,
  stageMapLabel,
  warmAllStageMaps,
} from "@/lib/stage-map";
import {
  loadPromoUnlocks,
  hasSpecialWeaponAccess,
} from "@/components/game/engine/modes/weapon-unlocks";
import { openMediaWatchDialog } from "@/lib/media-watch-ui";
import { openHelpDialog, closeHelpDialog, openTutorialClearDialog } from "@/lib/help-ui";
import {
  mountTutorialDock,
  unmountTutorialDock,
  noteTutorialEvent,
} from "@/lib/tutorial-dock";
import { mountTitleBannerDom } from "@/lib/title-banner-dom";
import { openPartnerPortalDialog } from "@/lib/partner-portal-ui";
import { isPromoAdminPlayer, fetchStaffList } from "./modes/admin";
import { cycleLocale, translate } from "@/lib/i18n";
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
  readStats,
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
  BAG_KEY,
  BAG_PENDING_KEY,
  loadBag,
  serializeBag,
  loadPending,
  serializePending,
  addBagStock,
  consumeBagStock,
  bagFieldForShopId,
  isStockableShopId,
  buildBagRows,
  buildStageSelectRows,
  maxSelectableStage,
  LOGIN_BONUS_KEY,
  PROMO_CLAIMED_KEY,
  loginBonusGrant,
  formatGrantSummary,
  loadLastLoginDate,
  serializeLoginBonus,
  canClaimLoginBonus,
  claimLoginBonus,
  loadClaimedPromos,
  serializeClaimedPromos,
  parsePromoFromUrl,
  stripPromoFromUrl,
} from "./modes/game-api";

// 認証の別名。ダイアログ側が短い名前を期待する場合に備える。
const authProviders = GROK_PROVIDERS;
const authSignIn = signIn;
const authSignOut = signOut;
const authGetBearer = getBearerToken;

/*
  画面と主な入口
  -----------------------------------
  startRun / openShop / openOptions
  openSoundTest / openChangelog / openAccount
  shareProgress / openInbox / openFanmail
  tickGame / resetRun / startStage
  状態: mode, score, pts, lives, stage, titleCursor
*/

/** キャンバス本体。useEffect 内のクロージャがゲーム状態そのもの。 */
function SwipeForceEngine() {
    let hostRef = React.useRef(null),
        canvasRef = React.useRef(null);
    return React.useEffect(() => {
        let hostEl = hostRef.current,
            canvasEl = canvasRef.current;
        if (!hostEl || !canvasEl) return;
        let canvas = canvasEl,
            rawCtx = canvas.getContext(`2d`);
        if (!rawCtx) return;
        let ctx = rawCtx,
            running = !0,
            rafId = 0,
            nextEntityId = 1,
            mode = `attract`, // mode: attract|ready|playing|bossintro|shop|options|gameover|name|changelog|soundtest|inbox|...
            score = 0, // score
            pts = 0, // pts (shop currency)
            highScore = Number(localStorage.getItem(HI_SCORE_KEY) || `50000`) || 5e4,
            lives = 3, // lives
            stage = 1, // stage
            mapScroll = 0, // xevious-style chip map scroll
            frame = 0,
            readyTimer = 0,
            spawnTimer = 0,
            shotTimer = 0,
            missileTimer = 0,
            particleTimer = 0,
            lockonTimer = 0,
            beamTimer = 0,
            flameTimer = 0,
            invuln = 0,
            shield = 0,
            shake = 0,
            kills = 0,
            killsForBoss = 18,
            bossActive = !1,
            bossName = ``,
            nameCursor = 0,
            nameLetters = [`A`, `A`, `A`],
            nameBlink = 0,
            shopCursor = 0,
            shopToast = ``,
            shopToastLife = 0,
            shopPaused = !1,
            upgrades = {
                ...DEFAULT_UPGRADES
            },
            celebrate = 0,
            mutedFlag = !1,
            difficulty = `easy`,
            tutorialRun = !1,
            tutorialShopQueued = !1,
            tutorialShopForced = !1,
            titleCursor = 0,
            titleSub = `root`, // title: root | diff | extra
            changelogScroll = 0,
            changelogDragOn = !1,
            changelogDragY = 0,
            changelogDragAcc = 0,
            changelogDragMoved = !1,
            soundListMode = `menu`,
            soundCursor = 0,
            trackLabel = ``,
            soundDragOn = !1,
            soundDragY = 0,
            soundDragAcc = 0,
            soundDragged = !1,
            soundPlayMode = `title`,
            soundIndex = 0,
            trackKey = ``,
            comments = [],
            commentCursor = 0,
            soundToast = ``,
            soundToastLife = 0,
            composing = !1,
            commentsReturn = `menu`,
            ratings = {
                likes: 0,
                dislikes: 0,
                mine: null
            },
            optionsFrom = `shop`,
            optionsCursor = 0,
            optionsSub = `main`,
            optionsToast = ``,
            optionsToastLife = 0,
            bagCursor = 0,
            bagFrom = `attract`,
            bagToast = ``,
            bagToastLife = 0,
            stageSelectCursor = 0,
            bagStock = loadBag(typeof localStorage < `u` ? localStorage.getItem(BAG_KEY) : null),
            bagPending = loadPending(typeof localStorage < `u` ? localStorage.getItem(BAG_PENDING_KEY) : null),
            loginLastDate = loadLastLoginDate(typeof localStorage < `u` ? localStorage.getItem(LOGIN_BONUS_KEY) : null),
            promoClaimed = loadClaimedPromos(typeof localStorage < `u` ? localStorage.getItem(PROMO_CLAIMED_KEY) : null),
            runPtsMult = 1,
            optionsDragOn = !1,
            optionsDragX = 0,
            optionsDragY = 0,
            optionsDragAccX = 0,
            optionsDragAccY = 0,
            optionsDragged = !1,
            shopDragOn = !1,
            shopDragX = 0,
            shopDragY = 0,
            shopDragAcc = 0,
            shopDragged = !1;
        ensureLocalPlayerId();
        let playerId = loadPlayerId(),
            account = {
                linked: !1,
                playerId: playerId,
                name: null,
                email: null,
                image: null
            },
            accountBusy = !1,
            continueCoins = 0,
            inbox = [],
            inboxCursor = 0,
            inboxDetail = !1;

        /** 受信箱をサーバーから取り直す。未連携なら空のまま。 */
        function reloadInbox() {
            fetchInboxMessages(playerId).then(list => {
                inbox = list, inboxCursor >= inbox.length && (inboxCursor = Math.max(0, inbox.length - 1))
            })
        }

        async function refreshAccount(forceLink = !1) {
            try {
                const acc = forceLink ? await linkAccountPost() : await fetchAccountGet();
                account = {
                    linked: !!acc.linked,
                    playerId: acc.playerId || loadPlayerId(),
                    name: acc.name ?? null,
                    email: acc.email ?? null,
                    image: acc.image ?? null
                };
                playerId = account.linked && account.playerId ? account.playerId : loadPlayerId();
                continueCoins = typeof acc.coins === `number` ? acc.coins : loadContinueCoins(playerId);
                try { reloadInbox(); } catch {}
                try { refreshCoins(); } catch {}
                if (account.linked) {
                    void fetchStaffList().catch(() => {});
                    // pull profile from DB into this origin (custom domain ↔ main)
                    void syncProfileFromServer(playerId).catch(() => {});
                }
                return account;
            } catch (err) {
                console.warn("[SWIPE FORCE] account refresh failed", err);
                return account;
            }
        }
        // initial status (no SFX)
        void fetchStaffList().catch(() => {});
        void refreshAccount(!1).then(() => {
            continueCoins = loadContinueCoins(playerId);
        });
        let shareParams = parseShareParams(),
            sharerId = shareParams.ref,
            shareId = shareParams.sid;
        sharerId && sharerId === playerId && (sharerId = null, shareId = null), (!sharerId || !shareId) && (sharerId = null, shareId = null);
        continueCoins = loadContinueCoins(playerId);
        let sharerProfile = {
                displayName: ``,
                bio: ``,
                shareBlurb: ``,
                hasProfile: !1
            },
            sharerProfileLoaded = !1;
        /** シェア主のプロフィールを再取得する。ミッション画面の依頼主表示用。 */
        function refreshSharerProfile() {
            if (!sharerId) {
                sharerProfile = { displayName: ``, bio: ``, shareBlurb: ``, hasProfile: !1 };
                sharerProfileLoaded = !0;
                return
            }
            sharerProfileLoaded = !1;
            loadSharerProfile(sharerId).then(p => {
                if (sharerId) {
                    sharerProfile = p;
                    sharerProfileLoaded = !0;
                }
            }).catch(() => { sharerProfileLoaded = !0 })
        }
        refreshSharerProfile();
        /** シェア主のプロフダイアログを開く。連携済みのときだけ実データを載せる。 */
        function openSharerProfileView() {
            if (!sharerId) return;
            openViewProfileDialog({
                ownerId: sharerId,
                profile: sharerProfileLoaded ? sharerProfile : null,
                viewerId: playerId,
                linked: !!account.linked,
                onNeedLink: () => openAccount(),
                sfxUi: () => sfx.ui(),
                sfxFail: () => sfx.buyFail(),
            });
        }
        let runStartedAt = 0,
            firstBossFlagged = !1,
            shareToast = ``,
            shareToastLife = 0,
            continueBusy = !1,
            missionBannerLife = 0,
            missionToast = ``,
            missionToastLife = 0,
            missionsDone = shareId ? loadMissionsDone(shareId) : {};

        /** このシェアセッションのミッション達成状況を読み直す。 */
        function reloadMissions() {
            missionsDone = shareId ? loadMissionsDone(shareId) : {}
        }

        /** シェアミッションが全部終わっているか。ファンレター解禁の条件。 */
        function allMissionsClear() {
            return !!shareId && allMissionsDoneFor(shareId)
        }

        /** ファンレターを送れるか。ミッション完了かつ未送信。 */
        function canSendFanmail() {
            return !!sharerId && !!shareId && canSendFanmailTo(shareId, sharerId, playerId)
        }

        /** 同じシェア主へファンレターを既に送ったか。 */
        function alreadySentFanmail() {
            return !!shareId && alreadySentFanmailTo(shareId, playerId)
        }
        reloadInbox();
        let mailBusy = !1;

        /** お礼メッセージの返信ダイアログを開く。 */
        function openThanks(message) {
            if (!canReplyThanks(message)) {
                sfx.buyFail(), shareToast = thanksBlockedMessage(message), shareToastLife = 80;
                return
            }
            if (mailBusy) return;
            mailBusy = !0, sfx.ui();
            openThanksDialog({
                host: hostEl,
                sanitize: (raw) => sanitizeUserText(raw),
                reasonText: (reason) => sanitizeReasonText(reason),
                send: (text) => sendThanksReply({
                    playerId: playerId,
                    messageId: message.id,
                    text
                }),
                onClose: () => { closeMailDialog() },
                onSent: () => { reloadInbox(), syncAccountCloud() },
                playOk: () => sfx.buy(),
                playError: () => sfx.buyFail(),
                playUi: () => sfx.ui()
            })
        }

        /** コンティニューコイン残高をサーバーから同期する。 */
        function refreshCoins() {
            fetchCoinBalance(playerId).then(coins => {
                continueCoins = coins
            })
        }
        refreshCoins();
        let settings = mergeSettingsFromStorage(localStorage.getItem(SETTINGS_KEY));

        /** BGM/SE の音量とミュートを現在の設定に合わせる。 */
        function applyAudioSettings() {
            bgm.setMasterVol(settings.master / 10), bgm.setBgmVol(settings.bgm / 10), bgm.setSfxVol(settings.sfx / 10), bgm.setMuted(settings.muted), mutedFlag = settings.muted
        }

        /** 操作・音量などの設定を localStorage に書く。端末ごとの保存。 */
        function persistSettings() {
            try {
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
            } catch {}
            applyAudioSettings()
        }
        applyAudioSettings();

        /** その武器のレベル上限。所持していなければ 0。 */
        function weaponLevelCap(weaponId) {
            return ownedLevel(weaponId, upgrades)
        }

        /** ショップで買った、またはプロモでアンロックした武器か。 */
        function isWeaponOwned(weaponId) {
            return weaponLevelCap(weaponId) > 0
        }

        /** ロードアウトに載せている武器の実レベル。未装備は 0。 */
        function armedLevelOf(weaponId) {
            return armedLevel(weaponId, upgrades, settings.wepLv)
        }

        /** 今の出撃ロードアウトにその武器が入っているか。 */
        function isWeaponArmed(weaponId) {
            return isArmed(weaponId, upgrades, settings.wepLv)
        }

        /** 同時装備している武器の本数。枠の上限判定に使う。 */
        function armedWeaponCount() {
            return countArmedWeapons(LOADOUT_COUNT_KEYS, upgrades, settings.wepLv)
        }

        /** オプション画面用の装備概要テキスト。 */
        function loadoutSummaryText() {
            return formatLoadoutSummary(armedWeaponCount());
        }

        /** ショット系統の内訳テキスト。 */
        function shotSubSummaryText() {
            const detailOn = SHOT_SUMMARY_KEYS.filter(e => isWeaponArmed(e)).length;
            return formatShotSubSummary({
                shotOn: isWeaponArmed(`shot`),
                optionOn: isWeaponArmed(`option`),
                detailOnCount: detailOn,
            });
        }

        /** オプション画面の行一覧。画面サブ状態に応じて組む。 */
        function optionRows() {
            return buildOptionRows(optionsSub, isWeaponOwned);
        }
        let player = {
                x: PLAY_W / 2,
                y: 352,
                w: 14,
                h: 12
            },
            bullets = [],
            enemies = [],
            fxParticles = [],
            floatTexts = [],
            lockBeams = [],
            stars = [];
        for (let i = 0; i < 48; i++) stars.push({
            x: RAIL_W + Math.random() * FIELD_INNER_W,
            y: Math.random() * PLAY_H,
            s: 1 + i % 2,
            speed: .4 + i % 5 * .25
        });
        try { warmAllStageMaps() } catch {}
        let swipeActive = !1,
            swipeX = player.x,
            swipeY = player.y,
            vstickActive = !1,
            vstickX = 88,
            vstickY = 348,
            vstickAxisX = 0,
            vstickAxisY = 0,
            keysDown = new Set;

        /** キーと仮想スティックの入力を捨てる。画面遷移の誤操作防止。 */
        function clearInput() {
            vstickActive = !1, vstickAxisX = 0, vstickAxisY = 0, swipeActive = !1;
            try { keysDown.clear() } catch {}
        }

        /** ホストサイズに合わせてキャンバスを引き伸ばす。レターボックスを維持。 */
        function layoutCanvas() {
            let rect = hostEl.getBoundingClientRect();
            let availW = Math.max(rect.width, window.innerWidth || 0, 160);
            let availH = Math.max(rect.height, window.innerHeight || 0, 200);
            let scale = Math.min(availW / PLAY_W, availH / PLAY_H);
            if (!(scale > 0) || !isFinite(scale)) scale = 0.5;
            scale = Math.max(0.35, scale);
            canvas.style.width = `${Math.floor(PLAY_W * scale)}px`;
            canvas.style.height = `${Math.floor(PLAY_H * scale)}px`;
            canvas.style.display = `block`;
            canvas.style.flexShrink = `0`;
            let px = Math.max(1, Math.floor(scale * Math.min(window.devicePixelRatio || 1, 2)));
            if (canvas.width !== PLAY_W * px || canvas.height !== PLAY_H * px) {
                canvas.width = PLAY_W * px;
                canvas.height = PLAY_H * px;
                ctx.setTransform(px, 0, 0, px, 0, 0);
                ctx.imageSmoothingEnabled = !1;
            } else {
                ctx.setTransform(px, 0, 0, px, 0, 0);
            }
        }
        layoutCanvas();
        let resizeObserver = new ResizeObserver(layoutCanvas);
        try { resizeObserver.observe(hostEl); } catch {}
        window.addEventListener(`resize`, layoutCanvas);
        window.addEventListener(`orientationchange`, layoutCanvas);
        try { window.visualViewport && window.visualViewport.addEventListener(`resize`, layoutCanvas); } catch {}
        window.addEventListener(`pageshow`, layoutCanvas);

        // HTML banner in letterbox bottom-left (phone black margin)
        let titleBannerDom = null;
        try {
            titleBannerDom = mountTitleBannerDom({
                host: hostEl,
                getPlayerId: () => playerId || ``,
                getLinked: () => !!account.linked,
                onNeedLink: () => { try { openAccount() } catch {} },
                isVisible: () => mode === `attract`,
                onOpenHelp: () => { try { tryOpenHelp(); } catch {} },
                onOpen: (videoId) => {
                    try {
                        openMediaWatchDialog({
                            playerId: playerId || ``,
                            preferredVideoId: videoId,
                            sfxUi: () => { try { sfx.ui() } catch {} },
                            sfxOk: () => { try { sfx.buy() } catch {} },
                            sfxFail: () => { try { sfx.buyFail() } catch {} },
                            onCoins: (c) => {
                                continueCoins = Math.max(0, c | 0);
                                shareToast = translate(`hud.watchOpen`, { n: continueCoins });
                                shareToastLife = 100;
                            },
                        });
                    } catch {
                        try { tryOpenMediaWatch(); } catch {}
                    }
                },
                sfxUi: () => { try { sfx.ui() } catch {} },
            });
        } catch (e) {
            console.warn(`[title-banner]`, e);
        }

        /** プロモ等で解禁した特殊武器 ID の集合。 */
        function specialUnlocks() {
            try { return loadPromoUnlocks() } catch { return [] }
        }

        /** 特殊武器（ビーム・フレイム等）が解禁済みか。 */
        function hasSpecial(id) {
            return hasSpecialWeaponAccess(id, !!account.linked, specialUnlocks());
        }

        /** 武器ショップの第2ティアが開いているか。 */
        function tier2Unlocked() {
            return upgrades.shot >= 3 && upgrades.rate >= 3 && upgrades.speed >= 3 && upgrades.power >= 3 && upgrades.option >= 2
        }

        /** 武器ショップの第3ティアが開いているか。 */
        function tier3Unlocked() {
            return upgrades.lockon >= 3 && upgrades.missile >= 3 && upgrades.particle >= 3
        }

        /** いま買えるショップ階層。クリア状況から決まる。 */
        function currentShopTier() {
            const u = specialUnlocks();
            return shopUnlockTier(!!account.linked, tier3Unlocked(), tier2Unlocked(), u.length > 0);
        }

        /** その商品の所持上限。 */
        function itemMaxOf(item) {
            return shopItemMax(item, !!account.linked, LINKED_ITEM_IDS, specialUnlocks());
        }

        /** いまの難易度・ティアで見える商品だけに絞ったカタログ。 */
        function shopCatalog() {
            return filterShopCatalog(SHOP_ITEMS, currentShopTier(), !!account.linked, specialUnlocks());
        }

        /** ショップリストのスクロール窓。カーソルが常に見える範囲。 */
        function shopListWindow(rows, pageSize) {
            return listWindowStart(rows.length, shopCursor, pageSize)
        }

        /** ハイスコアを localStorage へ。下回っても消さない。 */
        function saveHighScore() {
            return scoreHpThresholds();
        }

        /** スコア帯に応じた敵HP倍率。 */
        function scoreHpMult() {
            return enemyHpMultiplier(score);
        }

        /** 難易度とスコアを合成した敵の耐久。 */
        function enemyHpScale() {
            return totalHpScale(difficulty, score)
        }

        /** ノーマルの価格スケール。イージーは掛けない。 */
        function normalCostMult(item) {
            return normalCostScale(item, difficulty);
        }

        /** 表示・購入に使う実価格。 */
        function itemCostOf(item) {
            return shopItemCost(item, upgrades, difficulty);
        }

        /** 所持金・上限・解禁条件をすべて満たすか。 */
        function canBuyItem(item) {
            if (item.stockable) {
                return bagStockOfId(item.id) < itemMaxOf(item) && pts >= itemCostOf(item)
            }
            return item.consumable ? item.id === `life` && lives >= 5 || item.id === `shield` && shield > 0 ? !1 : pts >= itemCostOf(item) : (item.linkOnly || item.tier >= 4) && !hasSpecial(item.id) || upgrades[item.id] >= itemMaxOf(item) ? !1 : pts >= itemCostOf(item)
        }

        /** イージーの持ち越し装備を今のアップグレードへ反映する。 */
        function syncEasyCarry() {
            if (difficulty === `easy` || difficulty === `tutorial`) {
                try {
                    localStorage.setItem(EASY_UP_KEY, serializeEasyCarry(upgrades))
                } catch {}
                syncAccountCloud()
            }
        }

        /** イージー持ち越しの保存データを読む。 */
        function loadEasyCarryState() {
            try {
                return loadEasyCarry(localStorage.getItem(EASY_UP_KEY), DEFAULT_UPGRADES)
            } catch {
                return { ...DEFAULT_UPGRADES }
            }
        }

        /** イージーで持ち越している武器レベル。 */
        function easyCarryLevelOf(weaponId) {
            return Object.keys(DEFAULT_UPGRADES).reduce((t, n) => t + weaponId[n], 0)
        }

        /** バッグ在庫を localStorage に書く。 */
        function persistBag() {
            try {
                localStorage.setItem(BAG_KEY, serializeBag(bagStock))
            } catch {}
        }

        /** 未適用のバッグ効果（倍率など）を保存する。 */
        function persistPending() {
            try {
                localStorage.setItem(BAG_PENDING_KEY, serializePending(bagPending))
            } catch {}
        }

        /** バッグとログイン日・プロモ使用履歴をディスクから読み直す。 */
        function reloadBag() {
            try {
                bagStock = loadBag(localStorage.getItem(BAG_KEY));
                bagPending = loadPending(localStorage.getItem(BAG_PENDING_KEY));
                loginLastDate = loadLastLoginDate(localStorage.getItem(LOGIN_BONUS_KEY));
                promoClaimed = loadClaimedPromos(localStorage.getItem(PROMO_CLAIMED_KEY));
            } catch {
                bagStock = loadBag(null);
                bagPending = loadPending(null);
            }
        }

        /** ログインボーナスを受け取った日付を残す。同じ日は二度出さない。 */
        function persistLoginDate(d) {
            loginLastDate = d;
            try {
                localStorage.setItem(LOGIN_BONUS_KEY, serializeLoginBonus(d))
            } catch {}
        }

        /** 使ったプロモコード一覧を端末に残す。 */
        function persistPromoClaimed(list) {
            promoClaimed = list;
            try {
                localStorage.setItem(PROMO_CLAIMED_KEY, serializeClaimedPromos(list))
            } catch {}
        }

        /** 日付が変わっていればログインボーナスを付与する。 */
        function tryClaimLoginBonus(silent) {
            let res = claimLoginBonus(bagStock, loginLastDate);
            if (!res.ok) {
                if (!silent) {
                    bagToast = translate(`bag.loginDone`), bagToastLife = 60, sfx.buyFail();
                }
                return !1
            }
            bagStock = res.bag, persistBag(), persistLoginDate(res.today);
            if (silent) {
                shareToast = `LOGIN BONUS ${res.summary}`, shareToastLife = 140;
            } else {
                bagToast = `LOGIN ${res.summary}`, bagToastLife = 80;
            }
            sfx.buy();
            return !0
        }

        /** URL のプロモコードを一度だけ請求する。失敗してもゲームは止めない。 */
        function tryClaimPromoFromUrl() {
            let code = parsePromoFromUrl();
            if (!code) return;
            stripPromoFromUrl();
            void (async () => {
                const res = await claimPromoRemote(bagStock, code, playerId, promoClaimed);
                if (!res.ok) {
                    shareToast =
                        res.reason === `already`
                            ? translate(`bag.promoOk`, { code })
                            : res.reason === `expired`
                              ? translate(`bag.promoExp`, { code })
                              : res.reason === `sold_out`
                                ? translate(`bag.promoEnd`, { code })
                                : res.reason === `network`
                                  ? translate(`bag.promoNet`, { code })
                                  : translate(`bag.promoBad`, { code });
                    shareToastLife = 120;
                    if (res.reason === `already`) {
                        promoClaimed = [...new Set([...promoClaimed, code.toUpperCase()])];
                        persistPromoClaimed(promoClaimed);
                        sfx.ui();
                    } else sfx.buyFail();
                    return
                }
                bagStock = res.bag, persistBag(), persistPromoClaimed(res.claimed);
                promoClaimed = res.claimed;
                shareToast = `PROMO ${res.label} ${res.summary}`, shareToastLife = 160, sfx.buy()
            })()
        }

        // gift claims once on boot
        try {
            tryClaimPromoFromUrl();
            if (canClaimLoginBonus(loginLastDate)) tryClaimLoginBonus(!0);
        } catch {}


        /** バッグ内のそのアイテムの残り個数。 */
        function bagStockOfId(id) {
            let f = bagFieldForShopId(id);
            return f ? bagStock[f] || 0 : 0
        }

        /** この難易度でクリア済みの最奥ステージ。スキップ上限。 */
        function maxClearedForDiff() {
            try {
                let st = readStats();
                // allow skip to any stage cleared on either difficulty
                return Math.max(st.maxStageEasy | 0, st.maxStageNormal | 0)
            } catch {
                return 0
            }
        }

        /** ゲーム中バッグか、タイトルからのバッグか。使える項目が変わる。 */
        function bagInRunContext() {
            return bagFrom === `shop` || bagFrom === `play`
        }

        /** バッグ画面に出す行。個数0は出さない。 */
        function bagRows() {
            let ready = canClaimLoginBonus(loginLastDate);
            return buildBagRows({
                bag: bagStock,
                pending: bagPending,
                difficulty: difficulty,
                inRun: bagInRunContext(),
                maxStage: maxClearedForDiff(),
                runPtsMult: runPtsMult,
                loginReady: ready,
                loginSummary: ready ? formatGrantSummary(loginBonusGrant()) : ``
            })
        }

        /** バッグを開く。どこから開いたかを覚えて戻れるようにする。 */
        function openBag(from) {
            reloadBag();
            bagFrom = from || (mode === `shop` ? `shop` : `attract`);
            if (mode === `playing` || mode === `ready` || mode === `bossintro`) bagFrom = `play`;
            mode = `bag`, bagCursor = 0, bagToast = ``, bagToastLife = 0, clearInput(), sfx.ui()
        }

        /** バッグを閉じて元の画面へ戻す。 */
        function closeBag() {
            if (bagFrom === `shop`) mode = `shop`, bgm.start(`attract`);
            else if (bagFrom === `play`) mode = `playing`, invuln = Math.max(invuln, 45), bossActive ? bgm.boss(bossForStage(stage).vibe, stage) : bgm.start(`play`, stage);
            else mode = `attract`, titleSub = `extra`, titleCursor = 3, bgm.start(`attract`);
            sfx.ui()
        }

        /** ステージセレクト券の行き先を選ぶ画面。 */
        function openStageSelect() {
            let maxS = maxClearedForDiff();
            if (maxS < 1) {
                bagToast = translate(`bag.noClear`), bagToastLife = 70, sfx.buyFail();
                return
            }
            stageSelectCursor = Math.max(0, Math.min(maxS - 1, (bagPending.startStage || 1) - 1));
            mode = `stageselect`, sfx.ui()
        }

        /** バッグの1行を使う。消耗品は在庫を減らし、即時効果を掛ける。 */
        function useBagRow(row) {
            if (!row || row.kind === `header` || row.kind === `status`) return;
            if (row.kind === `back`) {
                closeBag();
                return
            }
            if (row.kind === `claim_login`) {
                tryClaimLoginBonus(!1);
                return
            }
            if (row.kind !== `item` || row.action === `locked`) {
                bagToast = row.lockedReason || translate(`bag.noUse`), bagToastLife = 60, sfx.buyFail();
                return
            }
            if (row.action === `use_stage`) {
                openStageSelect();
                return
            }
            if (row.action === `use_x5` || row.action === `use_x10`) {
                if (bagPending.ptsMult > 1 || (bagInRunContext() && runPtsMult > 1)) {
                    bagToast = translate(`bag.noDup`), bagToastLife = 70, sfx.buyFail();
                    return
                }
                let field = row.action === `use_x5` ? `ptsX5` : `ptsX10`;
                let res = consumeBagStock(bagStock, field, 1);
                if (!res.ok) {
                    bagToast = translate(`bag.noInv`), bagToastLife = 50, sfx.buyFail();
                    return
                }
                bagStock = res.bag, persistBag();
                let mult = row.action === `use_x5` ? 5 : 10;
                if (bagInRunContext()) {
                    if (difficulty !== `normal`) {
                        // refund stock if wrong difficulty mid-run
                        bagStock = addBagStock(bagStock, field, 1);
                        persistBag();
                        bagToast = translate(`bag.nrmNeed`), bagToastLife = 60, sfx.buyFail();
                        return
                    }
                    runPtsMult = mult;
                    bagToast = translate(`bag.ptsGo`, { n: mult }), bagToastLife = 70, sfx.buy();
                    return
                }
                bagPending = {
                    ...bagPending,
                    ptsMult: mult
                }, persistPending();
                bagToast = translate(`bag.ptsSet`, { n: mult }), bagToastLife = 70, sfx.buy();
                return
            }
            if (row.action === `use_pack`) {
                if (difficulty !== `normal`) {
                    bagToast = translate(`bag.nrmNeed`), bagToastLife = 60, sfx.buyFail();
                    return
                }
                let res = consumeBagStock(bagStock, `ptsPack`, 1);
                if (!res.ok) {
                    bagToast = translate(`bag.noInv`), bagToastLife = 50, sfx.buyFail();
                    return
                }
                bagStock = res.bag, persistBag();
                pts += 5e3;
                bagToast = `PTS +5000!`, bagToastLife = 70, sfx.buy();
                return
            }
        }

        /** 選んだ面へスキップしてプレイ開始。クリア済みまでしか選べない。 */
        function confirmStageSelect() {
            let maxS = maxClearedForDiff();
            let rows = buildStageSelectRows(maxS);
            let row = rows[stageSelectCursor];
            if (!row || row.stage === 0) {
                mode = `bag`, sfx.ui();
                return
            }
            let res = consumeBagStock(bagStock, `stageTicket`, 1);
            if (!res.ok) {
                bagToast = translate(`bag.noTicket`), bagToastLife = 60, mode = `bag`, sfx.buyFail();
                return
            }
            bagStock = res.bag, persistBag();
            if (bagFrom === `shop` || bagFrom === `play`) {
                stage = row.stage;
                shopPaused = !1;
                startStage();
                bagToast = translate(`bag.stageStart`, { n: row.stage }), bagToastLife = 60, sfx.buy();
                return
            }
            bagPending = {
                ...bagPending,
                startStage: row.stage
            }, persistPending();
            bagToast = translate(`bag.stageSet`, { n: row.stage }), bagToastLife = 70;
            mode = `attract`, titleSub = `extra`, titleCursor = 3, sfx.buy()
        }

        /** PTS を払って買う。上限と解禁を再確認してから在庫を足す。 */
        function buyShopItem(item) {
            let before = { ...upgrades };
            let result = applyShopPurchase({
                item: item,
                cost: itemCostOf(item),
                pts: pts,
                lives: lives,
                shieldFrames: shield,
                upgrades: upgrades,
                maxLevel: itemMaxOf(item),
                canBuy: canBuyItem(item),
                difficulty: difficulty,
                wepLv: settings.wepLv,
                wepCap: weaponLevelCap,
                bagStock: bagStockOfId(item.id)
            }, {
                tier2Ready: false,
                tier3Ready: false,
                linkedSpecial: false
            });
            if (!result.ok) {
                shopToast = translate(`hud.needPts`), shopToastLife = 60, sfx.buyFail();
                return
            }
            pts = result.pts, lives = result.lives, shield = result.shieldFrames, upgrades = result.upgrades;
            if (result.wepLvChanged) {
                settings.wepLv = result.wepLv, persistSettings()
            }
            if (result.bagAddId) {
                let field = bagFieldForShopId(result.bagAddId);
                if (field) {
                    bagStock = addBagStock(bagStock, field, 1, itemMaxOf(item)), persistBag()
                }
            }
            if (item.id !== `life` && item.id !== `shield` && !item.stockable) syncEasyCarry();
            sfx.buy(), shopToast = result.message, shopToastLife = 50;
            if (tutorialRun) noteTutorialEvent(`buy`);
            // celebrate after state applied (match original)
            if (tier2Unlocked() || tier3Unlocked() || (hasSpecial(`beam`) || hasSpecial(`flame`)) && (upgrades.beam > 0 || upgrades.flame > 0)) celebrate = 90
        }

        
        // ── reset run state ──
        /** 1プレイ分の状態を初期化する。ハイスコアとバッグは残す。 */
        function resetRun() {
            let seed = buildNewRunSeed({
                difficulty: difficulty,
                easyCarry: loadEasyCarryState(),
                defaults: DEFAULT_UPGRADES,
                fieldW: PLAY_W
            });
            score = seed.score, pts = seed.pts, lives = seed.lives, stage = seed.stage;
            upgrades = seed.upgrades, shield = seed.shieldFrames, invuln = seed.invulnFrames;
            bullets.length = 0, enemies.length = 0, fxParticles.length = 0, floatTexts.length = 0, lockBeams.length = 0;
            player.x = seed.playerX, player.y = seed.playerY, clearInput()
        }

        
        // ── begin stage ──
        /** 面の開始。マップスクロールとスポーン、BGM を面番号に合わせる。 */
        function startStage() {
            let seed = buildStageSeed(stage);
            kills = seed.kills, killsForBoss = seed.killTarget, bossActive = seed.bossActive, bossName = seed.bossName;
            spawnTimer = seed.spawnTimer, shotTimer = seed.shotCd, missileTimer = seed.missileCd, particleTimer = seed.particleCd, lockonTimer = seed.lockonCd;
            bullets.length = 0, enemies.length = 0, lockBeams.length = 0;
            mapScroll = 0;
            try { getStageMap(stage) } catch {}
            mode = seed.mode, readyTimer = seed.readyFrames, invuln = seed.invulnFrames;
            clearInput(), bgm.start(`play`, stage)
        }

        
        // ── open shop ──
        /** ショップを開く。paused=true はゲーム中一時停止ショップ。 */
        function openShop(paused = !1) {
            let seed = openShopSeed(!!paused);
            mode = seed.mode, shopPaused = seed.paused, shopCursor = seed.cursor, shopToast = seed.toast, shopToastLife = seed.toastLife;
            swipeActive = !1, clearInput();
            if (seed.clearEntities) bullets.length = 0, enemies.length = 0, lockBeams.length = 0;
            sfx.ui(), bgm.start(`attract`);
            if (tutorialRun) noteTutorialEvent(`shop`);
        }

        /** ショップを閉じる。ボス後なら次面へ、ポーズならプレイ再開。 */
        function closeShop() {
            let seed = closeShopSeed(!!shopPaused);
            if (seed.type === `resume_play`) {
                mode = `playing`, invuln = Math.max(invuln, seed.invulnMin), shopPaused = !1;
                bossActive ? bgm.boss(bossForStage(stage).vibe, stage) : bgm.start(`play`, stage)
            } else {
                stage++, startStage()
            }
            sfx.ui()
        }

        
        // ── open options ──
        /** オプション。戻り先（ショップ/タイトル/プレイ）を保持する。 */
        function openOptions(from) {
            let seed = openOptionsSeed(from);
            optionsFrom = seed.from, mode = seed.mode, optionsSub = seed.submenu, optionsCursor = seed.cursor;
            optionsToast = ``, optionsToastLife = 0, swipeActive = !1, clearInput(), sfx.ui(), bgm.start(`attract`)
        }

        /** オプションを閉じて戻り先の画面へ。 */
        function closeOptions() {
            if (persistSettings(), sfx.ui(), optionsSub === `shot` || optionsSub === `weapons`) {
                let nav = optionsBackTarget(optionsSub);
                if (nav.type === `to_weapons_from_shot`) {
                    optionsSub = `weapons`, optionsCursor = 1;
                    return
                }
                if (nav.type === `to_main_from_weapons`) {
                    optionsSub = `main`;
                    let e = optionRows().findIndex(e => e.kind === `submenu` && e.key === `weapons`);
                    optionsCursor = e >= 0 ? e : 0;
                    return
                }
            }
            if (optionsFrom === `shop`) mode = `shop`, bgm.start(`attract`);
            else if (optionsFrom === `play` || optionsFrom === `playing` || optionsFrom === `game`) {
                mode = `playing`, invuln = Math.max(invuln, 45), shopPaused = !1;
                bossActive ? bgm.boss(bossForStage(stage).vibe, stage) : bgm.start(`play`, stage);
            } else mode = `attract`, bgm.start(`attract`);
            sfx.ui()
        }

        /** Quit current run / menus and return to title attract */
        function quitToTitle() {
            try { persistSettings() } catch {}
            shopPaused = !1;
            optionsSub = `main`;
            bagFrom = `attract`;
            bossActive = !1;
            bullets.length = 0;
            enemies.length = 0;
            lockBeams.length = 0;
            fxParticles.length = 0;
            floatTexts.length = 0;
            runPtsMult = 1;
            bagPending = { ...bagPending, ptsMult: 1 };
            try { persistPending() } catch {}
            clearInput();
            titleSub = `root`;
            titleCursor = 0;
            tutorialRun = !1;
            tutorialShopQueued = !1;
            tutorialShopForced = !1;
            if (difficulty === `tutorial`) difficulty = `easy`;
            try { unmountTutorialDock(); } catch {}
            try { closeHelpDialog(); } catch {}
            mode = `attract`;
            refreshCoins();
            bgm.start(`attract`);
            sfx.ui();
            shareToast = translate(`hud.titleBack`), shareToastLife = 70;
        }

        /** タイトル側から音量などを仮変更するときのヘルパ。 */
        function nudgeOptionFromMenu(value) {
            return formatVolumeBar(value);
        }

        /** オプション行の現在値を表示用文字列にする。 */
        function formatOptionValueForRow(row) {
            return formatOptionValue(row, {
                options: settings,
                armedLevel: armedLevelOf,
                maxLevel: weaponLevelCap,
                loadoutSummary: loadoutSummaryText(),
                shotSummary: shotSubSummaryText(),
            });
        }

        /** 左右で値を変える。保存はここではせず、確定時に persist する行もある。 */
        function nudgeOption(delta) {
            let rows = optionRows();
            (optionsCursor < 0 || optionsCursor >= rows.length) && (optionsCursor = 0);
            let row = rows[optionsCursor];
            let res = applyOptionDelta({
                row: row,
                delta: delta,
                settings: settings,
                maxArmed: (key) => weaponLevelCap(key),
                currentArmed: (key) => armedLevelOf(key),
                weaponsEnabledCount: armedWeaponCount()
            });
            if (res.type === `noop`) return;
            if (res.type === `back`) { closeOptions(); return }
            if (res.type === `title`) { quitToTitle(); return }
            if (res.type === `locale`) {
                cycleLocale(delta >= 0 ? 1 : -1);
                sfx.ui();
                return;
            }
            if (res.type === `navigate_shot`) { optionsSub = `shot`, optionsCursor = 1, sfx.ui(); return }
            if (res.type === `navigate_weapons`) { optionsSub = `weapons`, optionsCursor = 1, sfx.ui(); return }
            if (res.type === `applied`) {
                settings = res.settings;
                if (res.clearVstick) clearInput();
                if (row.kind === `weapon`) {
                    let feedback = dodgeOnlyFeedback(armedWeaponCount(), res.feedback);
                    optionsToast = feedback || res.feedback || ``, optionsToastLife = res.feedbackLife || 55
                }
                persistSettings();
                if (res.replayAttractIfUnmuted && !settings.muted) bgm.start(`attract`);
                sfx.ui()
            }
        }

        /** 敵撃破などの粒子バースト。 */
        function spawnBurst(x, y, color, count = 14) {
            for (let particle of buildBurstParticles(x, y, color, count)) fxParticles.push(particle)
        }

        /** ロックオンやミサイルが追う敵を ID で探す。 */
        function findEnemyById(id) {
            return enemies.find(en => en.id === id)
        }

        /** 自機から近い敵を最大 count 体。ホーミング用。 */
        function nearestEnemies(count) {
            return pickNearestEnemies(enemies, player.x, player.y, count)
        }

        /** ダメージを通す。0以下なら撃破処理とスコア・PTS。 */
        function damageEnemy(enemy, dmg, srcX, srcY) {
            let out = applyEnemyDamage(enemy, dmg, srcX, srcY);
            sfx.hit();
            if (out.type === `survive`) {
                spawnBurst(out.spark.x, out.spark.y, out.spark.color, out.spark.count);
                return
            }
            spawnBurst(out.burst.x, out.burst.y, out.burst.color, out.burst.count);
            sfx.explode(out.boss);
            score += out.scoreAdd;
            {
                let mult = difficulty === `normal` && runPtsMult > 1 ? runPtsMult : 1;
                let gained = (out.ptsAdd | 0) * mult;
                pts += gained;
                if (mult > 1 && out.float) {
                    out.float = { ...out.float, text: `+${gained}`, color: `#ffee66` };
                }
            }
            floatTexts.push(out.float);
            if (!out.boss) {
                kills++;
                try { noteKill(1); } catch {}
                if (tutorialRun && kills >= 1) {
                    noteTutorialEvent(`kills`);
                    if (!tutorialShopForced) {
                        tutorialShopForced = !0;
                        tutorialShopQueued = !0;
                        pts += 1000;
                        floatTexts.push({
                            x: player.x,
                            y: player.y - 18,
                            text: `+1000 PTS`,
                            color: `#ffee66`,
                            life: 70
                        });
                    }
                }
            }
            if (out.boss) {
                missionBossClear(), mode = `stageclear`, readyTimer = 120, sfx.stageClear(), bgm.stop();
                if (settings.shake && out.shake) shake = out.shake;
                try {
                    noteBossClear();
                    noteStage(difficulty === `normal` ? `normal` : `easy`, stage);
                } catch {}
            }
            let idx = enemies.indexOf(enemy);
            idx >= 0 && enemies.splice(idx, 1)
        }

        /** 被弾。無敵中は無視。シールドがあればそれを消費する。 */
        function playerTakeHit() {
            let out = resolvePlayerHit({
                invulnFrames: invuln,
                shieldFrames: shield,
                lives: lives
            });
            if (out.type === `blocked_invuln`) return;
            if (out.type === `shield_break`) {
                shield = 0, invuln = out.invulnFrames;
                spawnBurst(player.x, player.y, out.burst.color, out.burst.count), sfx.playerHit();
                return
            }
            lives = out.lives, invuln = out.invulnFrames;
            if (settings.shake) shake = out.shake;
            sfx.playerHit(), spawnBurst(player.x, player.y, out.burst.color, out.burst.count);
            if (out.gameover) {
                mode = `gameover`, readyTimer = out.gameoverFrames, sfx.gameOver(), bgm.stop();
                let hiScoreResult = highScoreUpdate(score, highScore);
                if (hiScoreResult.dirty) {
                    highScore = hiScoreResult.high;
                    localStorage.setItem(HI_SCORE_KEY, String(highScore))
                }
            }
        }

        /** 雑魚を1機出す。出現位置はスクロールに合わせる。 */
        function spawnGruntEnemy() {
            enemies.push(spawnGrunt({
                id: nextEntityId++,
                stage: stage,
                hpScale: enemyHpScale()
            }))
        }

        /** その面のボスを出す。BGM をボス曲へ切り替える。 */
        function spawnBossEnemy() {
            let e = bossForStage(stage);
            bossName = e.name, bossActive = !0, mode = `bossintro`, readyTimer = 120, sfx.bossWarn(), missionFirstBoss(), bgm.boss(e.vibe, stage);
            enemies.push(spawnBoss({
                id: nextEntityId++,
                stage: stage,
                hpScale: enemyHpScale(),
                boss: e,
                fieldCenterX: PLAY_W / 2
            }))
        }

        /** 敵の弾を1発。弾種は敵データに従う。 */
        function enemyShoot(enemy) {
            let atk = enemy.boss ? bossById(enemy.bossId).atk : 0;
            for (let entity of createEnemyVolley(enemy, player.x, player.y, atk)) bullets.push(entity)
        }

        /** 通常ショット。連射間隔は装備レベルで縮む。 */
        function firePlayerShots() {
            let shots = createPlayerShots(player.x, player.y, {
                shot: armedLevelOf(`shot`),
                overdrive: armedLevelOf(`overdrive`),
                power: armedLevelOf(`power`),
                option: armedLevelOf(`option`)
            });
            if (shots.length) {
                sfx.shoot();
                for (let shot of shots) bullets.push(shot)
            }
        }

        /** ビーム。特殊解禁が必要。 */
        function fireBeam() {
            let e = armedLevelOf(`beam`);
            if (e <= 0 || !hasSpecial(`beam`)) return;
            sfx.lockon();
            for (let entity of createBeams({
                px: player.x,
                py: player.y,
                beam: e,
                power: armedLevelOf(`power`),
                option: armedLevelOf(`option`)
            })) bullets.push(entity)
        }

        /** 火炎放射。近距離・持続。 */
        function fireFlame() {
            let e = armedLevelOf(`flame`);
            if (e <= 0 || !hasSpecial(`flame`)) return;
            for (let entity of createFlames({
                px: player.x,
                py: player.y,
                flame: e,
                power: armedLevelOf(`power`)
            })) bullets.push(entity)
        }

        /** 誘導ミサイル。近い敵を割り当てる。 */
        function fireMissiles() {
            let e = armedLevelOf(`missile`);
            if (e <= 0) return;
            let t = armedLevelOf(`cluster`),
                n = e + (t > 0 ? t + 1 : 0),
                r = nearestEnemies(n);
            sfx.missile();
            for (let entity of createMissiles({
                px: player.x,
                py: player.y,
                missile: e,
                cluster: t,
                targets: r
            })) bullets.push(entity)
        }

        /** 拡散パーティクル弾。 */
        function fireParticles() {
            let e = armedLevelOf(`particle`);
            if (e <= 0) return;
            let t = armedLevelOf(`overdrive`);
            sfx.particle();
            for (let entity of createParticles({
                px: player.x,
                py: player.y,
                particle: e,
                overdrive: t
            })) bullets.push(entity);
            spawnBurst(player.x, player.y - 16, `#66ccff`, 6)
        }

        /** ロックオンレーザー。対象が消えたら打ち切る。 */
        function fireLockon() {
            let e = armedLevelOf(`lockon`);
            if (e <= 0) return;
            let t = armedLevelOf(`hyper`),
                hits = createLockonHits({
                    targets: nearestEnemies(e + (t > 0 ? t + 1 : 0)),
                    lockon: e,
                    hyper: t
                });
            hits.length && sfx.lockon();
            for (let pts of hits) {
                lockBeams.push(pts.beam);
                fxParticles.push(pts.spark);
                damageEnemy(pts.target, pts.dmg, pts.target.x, pts.target.y)
            }
        }

        /** 整数座標で塗る。キャンバスのぼやけ防止。 */
        function fillRect(x, y, w, h, color) {
            ctx.fillStyle = color, ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
        }

        /** HUD/メニュー用の小さいビットマップ風テキスト。 */
        function drawText(text, x, y, color, size = 8, align = `left`) {
            ctx.fillStyle = color, ctx.font = `bold ${size}px "Courier New", monospace`, ctx.textAlign = align, ctx.textBaseline = `top`, ctx.fillText(text, x, y)
        }

        /** 自機。無敵点滅中は間引き描画。 */
        function drawPlayerShip(x, y, _flash, blinking) {
            if (blinking) return;
            ctx.save(), ctx.translate(Math.round(x), Math.round(y));
            ctx.fillStyle = PLAYER_SHIP_FILL, ctx.beginPath();
            let path = PLAYER_SHIP_PATH;
            ctx.moveTo(path[0][0], path[0][1]);
            for (let i = 1; i < path.length; i++) ctx.lineTo(path[i][0], path[i][1]);
            ctx.closePath(), ctx.fill();
            for (let rect of playerShipLocalRects()) fillRect(rect.x, rect.y, rect.w, rect.h, rect.color);
            ctx.restore()
        }

        /** オプションポッドの位置と弾口。 */
        function drawOptionPods() {
            for (let r of optionPodRects(player.x, player.y, armedLevelOf(`option`))) fillRect(r.x, r.y, r.w, r.h, r.color)
        }

        /** 雑魚のスプライト。 */
        function drawEnemy(enemy) {
            if (enemy.boss) {
                drawBoss(enemy);
                return
            }
            ctx.save(), ctx.translate(Math.round(enemy.x), Math.round(enemy.y)), enemy.flash > 0 && (ctx.globalAlpha = .5);
            enemy.type === 2 && ctx.rotate(enemy.phase);
            for (let r of gruntLocalRects(enemy.type)) fillRect(r.x, r.y, r.w, r.h, r.color);
            ctx.restore()
        }

        /** ボス。体の部位と弱点の見た目。 */
        function drawBoss(enemy) {
            let t = bossById(enemy.bossId);
            ctx.save(), ctx.translate(Math.round(enemy.x), Math.round(enemy.y));
            enemy.flash > 0 && (ctx.globalAlpha = bossFlashAlpha(enemy.flash, frame));
            for (let r of bossLocalRects(t, enemy.w, enemy.h)) fillRect(r.x, r.y, r.w, r.h, r.color);
            ctx.restore();
            let bar = bossHpBar({ hp: enemy.hp, maxHp: enemy.maxHp });
            fillRect(bar.bg.x, bar.bg.y, bar.bg.w, bar.bg.h, bar.bg.color);
            fillRect(bar.fg.x, bar.fg.y, bar.fg.w, bar.fg.h, bar.fg.color);
            drawText(t.name, PLAY_W / 2, 18, `#ff66aa`, 8, `center`)
        }

        /** 左右レール（MUTE・PAUSE・バッグなど）。 */
        function drawSideRails() {
            let paint = buildSideRailPaint({
                mode: mode,
                titleSub: titleSub,
                shopPaused: !!shopPaused,
                muted: !!mutedFlag,
                fieldH: PLAY_H,
                leftW: RAIL_W,
                rightX: FIELD_RIGHT,
                muteDisabled: mode === `options` || mode === `shop`
            });
            fillRect(0, 0, RAIL_W, PLAY_H, paint.railFill), fillRect(FIELD_RIGHT, 0, RAIL_W, PLAY_H, paint.railFill);
            drawText(paint.brand.lines[0], paint.brand.leftX, 12, paint.brand.color, 6);
            drawText(paint.brand.lines[1], paint.brand.leftX, 22, paint.brand.color, 6);
            drawText(paint.brand.lines[0], paint.brand.rightX, 12, paint.brand.color, 6);
            drawText(paint.brand.lines[1], paint.brand.rightX, 22, paint.brand.color, 6);
            for (let entity of paint.buttons) {
                fillRect(entity.x, entity.y, entity.w, entity.h, entity.fill);
                ctx.strokeStyle = entity.stroke;
                ctx.lineWidth = 1;
                ctx.strokeRect(entity.x + .5, entity.y + .5, entity.w - 1, entity.h - 1);
                drawText(entity.label, entity.x + entity.w / 2, entity.y + 10, entity.labelColor, 6, `center`);
                if (entity.sub) drawText(entity.sub, entity.x + entity.w / 2, entity.y + 24, entity.subColor, 5, `center`);
            }
            if (paint.hints.left) drawText(paint.hints.left, 24, 160, `#335533`, 5, `center`);
            if (paint.hints.right) drawText(paint.hints.right, FIELD_RIGHT + 24, 160, `#335533`, 5, `center`);
            drawText(paint.mute.text, paint.mute.x, paint.mute.y, paint.mute.color, 7);
        }

        /** スコア・残機・PTS・武器HUD。 */
        function drawPlayHud() {
            let top = buildHudTop({ score: score, high: highScore, pts: pts, coins: continueCoins, stage: stage });
            drawText(top.score, 52, 4, `#00ff88`, 8);
            drawText(top.hi, 268, 4, `#ffff66`, 8, `right`);
            drawText(top.pts, 52, 14, `#ffff66`, 8);
            drawText(top.coins, 118, 14, `#ffee88`, 8);
            drawText(top.stage, 268, 14, `#88ffaa`, 8, `right`);
            if (difficulty === `normal` && runPtsMult > 1) {
                drawText(`PTS×${runPtsMult}`, 168, 14, `#ffcc44`, 7);
            }
            let flags = buildHudFlags({
                weaponsEnabledCount: armedWeaponCount(),
                shotArmed: isWeaponArmed(`shot`),
                vstick: !!settings.vstick,
                difficulty: difficulty,
                enemyHpMult: scoreHpMult()
            });
            let ehp = enemyHpHud(flags.enemyHpMult);
            ehp && drawText(ehp, 52, 24, `#ff8866`, 7);
            drawText(flags.diffLabel, 268, 24, flags.diffLabel === `TUT` ? `#88ffee` : flags.diffLabel === `ESY` ? `#88ff88` : `#ffaa66`, 6, `right`);
            for (let pipX of lifePipXs(lives)) fillRect(pipX, 388, 6, 6, `#44ff88`);
            let chips = buildHudBottomChips({
                dodgeOnly: flags.dodgeOnly,
                shotOff: flags.shotOff,
                weaponLabels: buildWeaponChips(upgrades, armedLevelOf).map(c => ({ label: c.label, color: c.color })),
                frame: frame
            });
            let n = 52;
            for (let item of chips.items) {
                drawText(item.text, n, 376, item.color, 7);
                n += item.text === `DODGE ONLY` ? 56 : item.text === `SHOT OFF` ? 48 : 18;
            }
            drawText(flags.controlLabel, 268, 376, `#448866`, 6, `right`), drawMissionHud()
        }

        /** シェアミッションの進捗帯。 */
        function drawMissionHud() {
            if (!sharerId) return;
            fillRect(52, 24, 216, 28, `#001a22`), ctx.strokeStyle = allMissionsClear() ? `#ffee66` : frame % 40 < 28 ? `#44ddaa` : `#228866`, ctx.strokeRect(52.5, 24.5, 215, 27), drawText(`MISSION`, 56, 27, `#66ffcc`, 7);
            for (let chip of buildMissionChips(MISSION_DEFS, missionsDone)) {
                drawText(chip.label, chip.x, 27, chip.color, 7);
                drawText(chip.mark, chip.x + 14, 27, chip.markColor, 7);
            }
            let next = missionNextLine(MISSION_DEFS, missionsDone, allMissionsClear());
            next && drawText(next, 56, 39, allMissionsClear() ? `#ffee88` : `#ffcc66`, 7);
            missionToastLife > 0 && drawText(missionToast, 264, 39, `#aaffff`, 6, `right`)
        }

        /** タイトルに出すシェア依頼の要約。 */
        function drawTitleMissions(cx) {
            if (!sharerId) return;
            reloadMissions(), fillRect(58, 90, 204, 82, `#001820`), ctx.strokeStyle = allMissionsClear() ? `#ffee66` : `#44ffcc`, ctx.lineWidth = 2, ctx.strokeRect(58.5, 90.5, 203, 81), ctx.lineWidth = 1;
            drawText(`◆ SHARE MISSIONS`, cx, 94, `#66ffee`, 9, `center`);
            {
                let who = sharerProfile.hasProfile && sharerProfile.displayName
                    ? sharerProfile.displayName.slice(0, 12)
                    : `ID ${String(sharerId).slice(0, 8)}`;
                drawText(translate(`hud.requester`, { who }), cx, 106, `#aaddff`, 7, `center`);
            }
            drawText(translate(`hud.missionMax`), cx, 116, `#ffcc66`, 6, `center`);
            for (let row of buildTitleMissionRows(MISSION_DEFS, missionsDone, 126, 9)) {
                drawText(row.line, 66, row.y, row.color, 7);
            }
            let foot = titleMissionFooter(allMissionsClear(), alreadySentFanmail());
            foot && drawText(foot, cx, 164, alreadySentFanmail() ? `#88aa88` : `#ffff88`, 6, `center`);
            drawText(translate(`hud.tapProfile`), cx, 173, `#5588aa`, 6, `center`);
        }

        /** タイトルのミッション帯がタップされたか。 */
        function titleMissionHit(x, y) {
            return !!sharerId && x >= 58 && x <= 262 && y >= 90 && y <= 174
        }

        /** タッチ用仮想スティック。キーボード操作時は出さないこともある。 */
        function drawVirtualStick() {
            if (!vstickVisible(!!settings.vstick, mode)) return;
            let lay = virtualStickLayout({
                active: !!vstickActive,
                centerX: vstickX,
                centerY: vstickY,
                axisX: vstickAxisX,
                axisY: vstickAxisY
            });
            for (let drawOp of vstickDrawOps(lay, !!vstickActive)) {
                if (drawOp.type === `save`) ctx.save();
                else if (drawOp.type === `restore`) ctx.restore();
                else if (drawOp.type === `alpha`) ctx.globalAlpha = drawOp.a;
                else if (drawOp.type === `strokeStyle`) ctx.strokeStyle = drawOp.c;
                else if (drawOp.type === `fillStyle`) ctx.fillStyle = drawOp.c;
                else if (drawOp.type === `lineWidth`) ctx.lineWidth = drawOp.w;
                else if (drawOp.type === `arc`) {
                    ctx.beginPath(), ctx.arc(drawOp.x, drawOp.y, drawOp.r, 0, Math.PI * 2);
                    drawOp.fill && ctx.fill();
                    drawOp.stroke && ctx.stroke();
                } else if (drawOp.type === `cross`) {
                    ctx.beginPath();
                    ctx.moveTo(drawOp.x - drawOp.r + 4, drawOp.y), ctx.lineTo(drawOp.x + drawOp.r - 4, drawOp.y);
                    ctx.moveTo(drawOp.x, drawOp.y - drawOp.r + 4), ctx.lineTo(drawOp.x, drawOp.y + drawOp.r - 4);
                    ctx.stroke();
                }
            }
        }

        /** 武器ショップ画面。 */
        function drawShop() {
            let e = shopCatalog(),
                winStart = shopListWindow(e, 10);
            fillRect(RAIL_W, 0, FIELD_INNER_W, PLAY_H, `#001400`), fillRect(54, 20, 212, 372, `#002200`), ctx.strokeStyle = `#00ff66`, ctx.strokeRect(54.5, 20.5, 211, 371), drawText(`POWER SHOP`, 62, 24, `#ffff00`, 11);
            let foot = shopFooterIndices(e.length),
                n = shopCursor === foot.share,
                r = shopCursor === foot.opt;
            for (let chip of shopHeaderChips({ shareSelected: n, optSelected: r })) {
                fillRect(chip.x, chip.y, chip.w, chip.h, chip.fill);
                ctx.strokeStyle = chip.stroke;
                ctx.lineWidth = 2;
                ctx.strokeRect(chip.x + .5, chip.y + .5, chip.w - 1, chip.h - 1);
                drawText(chip.label, chip.labelX, chip.labelY, chip.labelColor, 8, `center`);
            }
            ctx.lineWidth = 1;
            let statusLine = shopStatusLine({ pts: pts, tier: currentShopTier(), difficulty: difficulty });
            drawText(statusLine.text, PLAY_W / 2, 46, statusLine.color, 8, `center`);
            let tier = shopTierHint({ tier2: tier2Unlocked(), tier3: tier3Unlocked(), celebrate: celebrate > 0, frame: frame, linked: !!account.linked });
            drawText(tier.text, PLAY_W / 2, 56, tier.color, 6, `center`);
            for (let row of buildShopRows({
                catalog: e,
                cursor: shopCursor,
                windowStart: winStart,
                upgrades: upgrades,
                lives: lives,
                shieldFrames: shield,
                bagStockOf: bagStockOfId,
                costOf: itemCostOf,
                maxOf: itemMaxOf,
                canBuy: canBuyItem
            })) {
                row.selected && (fillRect(58, row.y - 1, 204, 19, `#004400`), ctx.strokeStyle = `#00ff00`, ctx.strokeRect(58.5, row.y - .5, 203, 18));
                drawText(row.item.name, 62, row.y + 3, row.nameColor, 8);
                drawText(row.levelText, 148, row.y + 3, `#66ccaa`, 7);
                drawText(row.costText, 260, row.y + 3, row.costColor, 8, `right`);
            }
            winStart > 0 && drawText(`▲`, PLAY_W / 2, 60, `#00ff88`, 8, `center`), winStart + 10 < e.length && drawText(`▼`, PLAY_W / 2, 336, `#00ff88`, 8, `center`);
            for (let entity of shopFooterButtonsExact({ catalogLen: e.length, cursor: shopCursor, pauseShop: !!shopPaused, shareSelected: n, optSelected: r })) {
                fillRect(entity.x, entity.y, entity.w, entity.h, entity.fill);
                ctx.strokeStyle = entity.stroke;
                ctx.lineWidth = 2;
                ctx.strokeRect(entity.x + .5, entity.y + .5, entity.w - 1, entity.h - 1);
                drawText(entity.label, entity.labelX, entity.labelY, entity.labelColor, entity.sub ? 8 : 9, `center`);
                entity.sub && drawText(entity.sub, entity.labelX, entity.subY, `#886644`, 6, `center`);
            }
            ctx.lineWidth = 1;
            shopToastLife > 0 ? drawText(shopToast, PLAY_W / 2, 388, `#ffaa00`, 6, `center`) : drawText(shopPaused ? translate(`hud.shopHelpPause`) : translate(`hud.shopHelp`), PLAY_W / 2, 388, `#335544`, 6, `center`)
        }

        /** オプション画面。 */
        function drawOptions() {
            let e = optionRows();
            optionsCursor >= e.length && (optionsCursor = Math.max(0, e.length - 1));
            let scr = optionsScreenTitle(optionsSub);
            fillRect(RAIL_W, 0, FIELD_INNER_W, PLAY_H, `#001018`), fillRect(54, 18, 212, 370, `#001a22`), ctx.strokeStyle = scr.border, ctx.strokeRect(54.5, 18.5, 211, 369);
            drawText(scr.title, PLAY_W / 2, 22, scr.titleColor, 11, `center`);
            drawText(scr.subtitle, PLAY_W / 2, 36, `#448888`, 7, `center`);
            let t = listWindowStart(e.length, optionsCursor, 14);
            for (let n = 0; n < Math.min(14, e.length); n++) {
                let r = n + t,
                    i = e[r],
                    a = 48 + n * 18,
                    o = r === optionsCursor;
                if (i.kind === `header`) {
                    drawText(i.label, PLAY_W / 2, a + 4, `#558888`, 7, `center`);
                    continue
                }
                o && (fillRect(60, a - 1, 200, 16, `#003344`), ctx.strokeStyle = `#00eeff`, ctx.strokeRect(60.5, a - .5, 199, 15));
                let cols = optionsRowColors({
                    kind: i.kind,
                    selected: o,
                    weaponOn: i.kind === `weapon` ? armedLevelOf(i.key) > 0 : undefined
                });
                drawText(i.label, 64, a + 3, cols.label, 8);
                let c = formatOptionValueForRow(i);
                c && drawText(c, 260, a + 3, cols.value, 7, `right`)
            }
            t > 0 && drawText(`▲`, PLAY_W / 2, 38, `#00ccff`, 7, `center`), t + 14 < e.length && drawText(`▼`, PLAY_W / 2, 372, `#00ccff`, 7, `center`);
            let hint = optionsHint({ submenu: optionsSub, feedback: optionsToast, feedbackActive: optionsToastLife > 0 });
            drawText(hint, PLAY_W / 2, 386, optionsToastLife > 0 ? `#ffaa00` : `#446666`, 6, `center`)
        }

        /** バッグ画面。個数と効果説明。 */
        function drawBag() {
            let rows = bagRows();
            bagCursor = Math.max(0, Math.min(rows.length - 1, bagCursor));
            fillRect(RAIL_W, 0, FIELD_INNER_W, PLAY_H, `#140c00`), fillRect(54, 18, 212, 370, `#1a1200`), ctx.strokeStyle = `#ffcc66`, ctx.strokeRect(54.5, 18.5, 211, 369);
            drawText(`ITEM BAG`, PLAY_W / 2, 22, `#ffee88`, 11, `center`);
            drawText(translate(`bag.hint`), PLAY_W / 2, 36, `#886644`, 7, `center`);
            let win = listWindowStart(rows.length, bagCursor, 12);
            for (let i = 0; i < Math.min(12, rows.length); i++) {
                let idx = i + win, row = rows[idx], y = 50 + i * 24, sel = idx === bagCursor;
                if (row.kind === `header`) {
                    drawText(row.label, PLAY_W / 2, y + 6, `#665533`, 7, `center`);
                    continue
                }
                if (row.kind === `claim_login`) {
                    sel && (fillRect(60, y - 1, 200, 22, `#3a2800`), ctx.strokeStyle = `#ffcc44`, ctx.strokeRect(60.5, y - .5, 199, 21));
                    drawText(row.label, 64, y + 2, sel ? `#fff` : `#ffee88`, 8);
                    drawText(`GET`, 256, y + 2, `#66ff88`, 8, `right`);
                    drawText(row.desc, 64, y + 12, `#aa8844`, 6);
                    continue
                }
                if (row.kind === `status`) {
                    sel && (fillRect(60, y - 1, 200, 20, `#2a2000`), ctx.strokeStyle = `#886600`, ctx.strokeRect(60.5, y - .5, 199, 19));
                    drawText(row.label, 64, y + 4, `#aa8866`, 8);
                    drawText(row.value, 256, y + 4, `#ffdd88`, 7, `right`);
                    continue
                }
                if (row.kind === `back`) {
                    sel && (fillRect(60, y - 1, 200, 20, `#332200`), ctx.strokeStyle = `#ffcc66`, ctx.strokeRect(60.5, y - .5, 199, 19));
                    drawText(row.label, PLAY_W / 2, y + 4, sel ? `#fff` : `#ccaa66`, 9, `center`);
                    continue
                }
                // item
                sel && (fillRect(60, y - 1, 200, 22, `#3a2800`), ctx.strokeStyle = `#ffaa33`, ctx.strokeRect(60.5, y - .5, 199, 21));
                let can = row.action !== `locked`;
                drawText(row.label, 64, y + 2, can ? (sel ? `#fff` : `#ffe088`) : `#665544`, 8);
                drawText(`×${row.stock}`, 256, y + 2, can ? `#ffff66` : `#554433`, 8, `right`);
                drawText(can ? row.desc : (row.lockedReason || row.desc), 64, y + 12, can ? `#887744` : `#553322`, 6);
            }
            bagToastLife > 0 ? drawText(bagToast, PLAY_W / 2, 386, `#ffaa00`, 6, `center`) : drawText(translate(`bag.foot`), PLAY_W / 2, 386, `#554422`, 6, `center`)
        }

        /** スキップ先の面番号リスト。 */
        function drawStageSelect() {
            let maxS = maxClearedForDiff();
            let rows = buildStageSelectRows(maxS);
            stageSelectCursor = Math.max(0, Math.min(rows.length - 1, stageSelectCursor));
            fillRect(RAIL_W, 0, FIELD_INNER_W, PLAY_H, `#001018`), fillRect(54, 18, 212, 370, `#001a28`), ctx.strokeStyle = `#66ccff`, ctx.strokeRect(54.5, 18.5, 211, 369);
            drawText(`STAGE SELECT`, PLAY_W / 2, 22, `#88eeff`, 11, `center`);
            drawText(translate(`bag.skipHint`), PLAY_W / 2, 36, `#447788`, 7, `center`);
            let win = listWindowStart(rows.length, stageSelectCursor, 12);
            for (let i = 0; i < Math.min(12, rows.length); i++) {
                let idx = i + win, row = rows[idx], y = 52 + i * 24, sel = idx === stageSelectCursor;
                sel && (fillRect(60, y - 1, 200, 20, `#003344`), ctx.strokeStyle = `#66eeff`, ctx.strokeRect(60.5, y - .5, 199, 19));
                drawText(row.label, PLAY_W / 2, y + 2, sel ? `#fff` : `#88ccee`, 9, `center`);
                drawText(row.sub, PLAY_W / 2, y + 12, `#446677`, 6, `center`);
            }
            drawText(translate(`bag.skipFoot`), PLAY_W / 2, 386, `#335566`, 6, `center`)
        }

        
        // ── version changelog mode ──
        /** バージョン履歴を開く。 */
        function openChangelog() {
            mode = `changelog`, changelogScroll = 0, sfx.ui()
        }

        /** 履歴から1つ上のメニューへ戻る。 */
        function leaveChangelog() {
            mode = `attract`, sfx.ui()
        }

        /** 履歴のスクロール上限。 */
        function getChangelogMaxScroll() {
            return changelogMaxScroll(buildChangelogRows(VERSION_HISTORY).length)
        }

        /** バージョン履歴の描画。 */
        function drawChangelog() {
            fillRect(RAIL_W, 0, FIELD_INNER_W, PLAY_H, `#000a12`), fillRect(54, 12, 212, 380, `#001018`), ctx.strokeStyle = `#44ffcc`, ctx.strokeRect(54.5, 12.5, 211, 379), drawText(`VERSION HISTORY`, PLAY_W / 2, 20, `#88ffee`, 11, `center`), drawText(`NOW  ${versionShortLabel()}`, PLAY_W / 2, 34, `#ffee88`, 8, `center`), drawText(`Grok Build iOS`, PLAY_W / 2, 46, `#556666`, 6, `center`);
            let rows = buildChangelogRows(VERSION_HISTORY),
                maxScroll = changelogMaxScroll(rows.length);
            changelogScroll > maxScroll && (changelogScroll = maxScroll);
            for (let vis of changelogVisibleRows(rows, changelogScroll)) {
                if (vis.row.kind === `gap`) continue;
                let fontSize = vis.row.kind === `head` ? 7 : 6;
                drawText(vis.row.text.slice(0, 34), 62, vis.y, vis.row.color, fontSize)
            }
            changelogScroll > 0 && drawText(`▲`, PLAY_W / 2, 52, `#44aa88`, 7, `center`), changelogScroll < maxScroll && drawText(`▼`, PLAY_W / 2, 364, `#44aa88`, 7, `center`), fillRect(60, 370, 200, 18, `#1a3030`), ctx.strokeStyle = `#6688aa`, ctx.strokeRect(60.5, 370.5, 199, 17), drawText(`◀ BACK`, PLAY_W / 2, 375, `#aaccff`, 8, `center`)
        }

        /** 履歴のタップ。戻る／行選択。 */
        function onChangelogTap(x, y) {
            changelogDragOn = !0, changelogDragY = y, changelogDragAcc = 0, changelogDragMoved = !1
        }

        /** 履歴のドラッグスクロール。 */
        function onChangelogDrag(x, y) {
            if (!changelogDragOn || mode !== `changelog`) return;
            let dy = y - changelogDragY;
            for (changelogDragAcc += dy, changelogDragY = y; changelogDragAcc <= -14;) changelogScroll = Math.max(0, changelogScroll - 1), changelogDragAcc += 14, changelogDragMoved = !0, sfx.ui();
            for (; changelogDragAcc >= 14;) changelogScroll = Math.min(getChangelogMaxScroll(), changelogScroll + 1), changelogDragAcc -= 14, changelogDragMoved = !0, sfx.ui()
        }

        /** 履歴ドラッグ終了。微小移動はタップ扱いに戻す。 */
        function onChangelogPointerUp(x, y) {
            if (changelogDragOn) {
                if (changelogDragOn = !1, changelogDragMoved) {
                    changelogDragMoved = !1;
                    return
                }
                changelogBackHit(y, x, RAIL_W, FIELD_RIGHT) && leaveChangelog()
            }
        }

        /** タイトル（アトラクト）。メニュー・バナー余白・ミッション。 */
        function drawAttract() {
            ctx.fillStyle = `#001100`, ctx.fillRect(RAIL_W, 0, FIELD_INNER_W, PLAY_H);
            for (let i = 0; i < 400; i++) {
                let rafId = titleNoiseDot(RAIL_W, FIELD_INNER_W, PLAY_H);
                ctx.fillStyle = titleNoiseRgb(rafId.g), ctx.fillRect(rafId.x, rafId.y, 1, 1)
            }
            let e = PLAY_W / 2;
            let hdr = titleHeader(versionShortLabel());
            drawText(hdr.title, e, 28, `#00ff88`, 15, `center`);
            drawText(hdr.tagline, e, 44, `#66aa66`, 7, `center`);
            drawText(hdr.credit, e, 56, `#88cc88`, 8, `center`);
            drawText(hdr.versionLine, e, 66, `#556666`, 6, `center`);
            {
                let linkStyle = titleLinkStyle(!!account.linked);
                fillRect(210, 6, 56, 18, linkStyle.fill);
                ctx.strokeStyle = linkStyle.stroke;
                ctx.strokeRect(210.5, 6.5, 55, 17);
                drawText(account.linked ? (account.name || `LINK`).slice(0, 6) : `LINK`, 238, 11, linkStyle.textColor, 7, `center`);
            }
            fillRect(68, 76, 184, 18, `#1a1500`);
            ctx.strokeStyle = `#ffcc44`;
            ctx.strokeRect(68.5, 76.5, 183, 17);
            let coin = continueCoinLine(continueCoins);
            drawText(coin.text, e, 80, coin.color, 9, `center`);
            sharerId ? drawTitleMissions(e) : drawText(translate(`hud.shareHelp`), e, 96, `#558866`, 7, `center`);
            shareToastLife > 0 && drawText(shareToast, e, sharerId ? 148 : 110, `#ffaa00`, 7, `center`);
            drawText(titleSelectLabel(titleSub), e, PLAY_H * .385, `#ffff66`, 7, `center`);
            let adminMenu = !!(account.linked && isPromoAdminPlayer(playerId));
            let menuYs = titleMenuYs(titleSub, PLAY_H, { isPromoAdmin: adminMenu }),
                n = easyCarryLevelOf(loadEasyCarryState()),
                inboxLabels = titleInboxLabels({ canSendFanmail: canSendFanmail(), alreadySent: alreadySentFanmail(), inboxCount: inbox.length }),
                r = buildTitleMenu(titleSub, {
                    linked: !!account.linked,
                    easyCarryLv: n,
                    msgTitle: inboxLabels.title,
                    msgSub: inboxLabels.sub,
                    versionLabel: APP_VERSION,
                    isPromoAdmin: adminMenu
                });
            // clamp cursor if menu shrank
            if (titleCursor >= r.length) titleCursor = Math.max(0, r.length - 1);
            for (let n = 0; n < r.length; n++) {
                let i = menuYs[n],
                    a = titleCursor === n,
                    o = r[n].h,
                    cols = titleMenuRowColors(n, a, frame % 24 < 16);
                cols.fill ? (fillRect(62, i - 2, 196, o, cols.fill), ctx.strokeStyle = cols.stroke, ctx.strokeRect(62.5, i - 1.5, 195, o - 1)) : (ctx.strokeStyle = cols.stroke, ctx.strokeRect(62.5, i - 1.5, 195, o - 1));
                drawText(r[n].title, e, i + 2, cols.title, 10, `center`), r[n].sub && drawText(r[n].sub, e, i + 13, cols.sub, 6, `center`)
            }
            let foot = titleFooter();
            drawText(foot.left, 56, 386, `#335533`, 6), drawText(foot.right, 266, 386, `#2a4a2a`, 6, `right`)
        }

        
        // ── start run ──
        /** ゲーム開始。チュートリアルならコイン0・専用ミッション。 */
        function startRun() {
            reloadBag();
            resetRun();
            // apply stage ticket pending
            if (bagPending.startStage > 0) {
                stage = bagPending.startStage;
                bagPending = { ...bagPending, startStage: 0 };
                persistPending();
            }
            // PTS mult only on normal; consume pending on start
            if (difficulty === `normal` && bagPending.ptsMult > 1) {
                runPtsMult = bagPending.ptsMult;
                bagPending = { ...bagPending, ptsMult: 1 };
                persistPending();
            } else {
                runPtsMult = 1;
            }
            runStartedAt = performance.now(), firstBossFlagged = !1, reloadMissions(), missionBannerLife = 0, missionToast = ``, missionToastLife = 0, sfx.start(), startStage();
            try { noteRunStart(); window.__sfPlayAcc = 0; } catch (err) {}
            if (tutorialRun) {
                tutorialShopQueued = !1;
                tutorialShopForced = !1;
                mountTutorialDock({
                    playerId,
                    onGrant: (coins, ticket, balance) => {
                        if (typeof balance === `number` && balance > 0) continueCoins = balance;
                        else refreshCoins();
                        if (ticket > 0) {
                            bagStock = addBagStock(bagStock, `stageTicket`, ticket);
                            persistBag();
                        }
                    },
                    onToast: (text) => { shareToast = text, shareToastLife = 90 },
                    sfxOk: () => { try { sfx.buy() } catch {} },
                    sfxUi: () => { try { sfx.ui() } catch {} },
                });
            } else {
                unmountTutorialDock();
            }
        }

        
        // ── mission progress tick ──
        /** シェアミッション達成をサーバーへ。二重報告しない。 */
        function reportMission(missionId) {
            if (!canAttemptMission({ sharerId: sharerId, shareId: shareId, alreadyDone: !!missionsDone[missionId] })) return;
            let t = missionPlaySeconds(runStartedAt),
                n = MISSION_DEFS.find(t => t.id === missionId);
            reportMissionClear({
                sharerId: sharerId,
                shareId: shareId,
                visitorId: playerId,
                missionId: missionId,
                playSeconds: t
            }).then(missionId => {
                reloadMissions();
                if (missionId.ok && !missionId.already) {
                    let feedback = missionClearFloats({
                        label: n.label,
                        allClearCanMsg: !!(allMissionsClear() && canSendFanmail()),
                        cx: PLAY_W / 2,
                        cy: PLAY_H
                    });
                    missionBannerLife = feedback.bannerFrames, missionToast = feedback.toast, missionToastLife = feedback.toastLife, sfx.stageClear();
                    for (let nextEntityId of feedback.floats) floatTexts.push(nextEntityId);
                    refreshCoins()
                } else if (!missionId.ok && missionId.reason === `too_fast`) {
                    let feedback = missionTooFastFloats({ label: n.label, cx: PLAY_W / 2, cy: PLAY_H });
                    missionToast = feedback.toast, missionToastLife = feedback.toastLife;
                    for (let nextEntityId of feedback.floats) floatTexts.push(nextEntityId)
                }
            })
        }

        
        // ── award / continue coin refresh ──
        /** 1面目ボス到達ミッション。 */
        function missionFirstBoss() {
            if (firstBossFlagged) return;
            let mid = firstBossMissionId(stage, firstBossFlagged);
            if (mid) firstBossFlagged = !0, reportMission(mid)
            if (tutorialRun && stage === 1) noteTutorialEvent(`boss_reach`);
        }

        /** 各面ボス撃破ミッション。 */
        function missionBossClear() {
            let mid = bossClearMissionId(stage);
            mid && reportMission(mid)
            if (tutorialRun && stage === 1) noteTutorialEvent(`boss_clear`);
        }

        
        // ── account link dialog ──
        /** アカウント連携ダイアログ。 */
        function openAccount() {
            openAccountDialog(hostEl, {
                linked: !!account.linked,
                name: account.name,
                email: account.email,
                playerId: playerId,
                coins: continueCoins
            }, {
                providers: authProviders,
                onClose: () => sfx.ui(),
                onSignIn: async (providerId) => {
                    await authSignIn(providerId, { callbackURL: window.location.href });
                    return await refreshAccount(!0);
                },
                onSignOut: async () => {
                    try {
                        await unlinkAccountLocal();
                        await authSignOut(window.location.href);
                    } catch {
                        await unlinkAccountLocal();
                        playerId = loadPlayerId();
                        account = {
                            linked: !1,
                            playerId: playerId,
                            name: null,
                            email: null,
                            image: null
                        };
                        continueCoins = loadContinueCoins(playerId);
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
                    setTimeout(() => openAccount(), 200);
                },
                playUi: () => sfx.buy(),
                playError: () => sfx.buyFail()
            });
            sfx.ui();
            bgm.unlock();
        }

        /** ファンレター／お礼ダイアログを閉じる。 */
        function closeMailDialog() {
            let e = hostEl.querySelector(`#sf-mail-dlg`);
            e && e.remove(), mailBusy = !1
        }

        
        // ── fan mail to sharer ──
        /** ファンレター作成。連携必須。 */
        function openFanmail() {
            let gate = fanmailGate({
                sharerId: sharerId,
                alreadySent: alreadySentFanmail(),
                allMissionsClear: allMissionsClear(),
                busy: !!mailBusy
            });
            if (!gate.ok) {
                if (gate.reason === `busy`) return;
                if (gate.reason === `no_share`) { sfx.buyFail(); return }
                sfx.buyFail(), shareToast = fanmailGateMessage(gate.reason), shareToastLife = 90;
                return
            }
            sfx.ui(), mailBusy = !0;
            openFanmailDialog({
                host: hostEl,
                sanitize: (raw) => sanitizeUserText(raw),
                reasonText: (reason) => sanitizeReasonText(reason),
                send: (text) => sendFanmailMessage({
                    sharerId: sharerId,
                    shareId: shareId,
                    visitorId: playerId,
                    text
                }),
                onClose: () => { closeMailDialog(); sfx.ui() },
                onSent: () => { syncAccountCloud() },
                playOk: () => sfx.buy(),
                playError: () => sfx.buyFail()
            })
        }

        
        // ── inbox ──
        /** 受信箱。連携必須。 */
        function openInbox() {
            reloadInbox(), syncAccountCloud(), mode = `inbox`, inboxCursor = 0, inboxDetail = !1, sfx.ui()
        }
        async function doContinue() {
            if (continueBusy) return;
            const free = tutorialRun || difficulty === `tutorial`;
            if (!free && continueCoins <= 0) return;
            continueBusy = !0;
            if (!free) {
                let e = await spendContinueCoin(playerId);
                if (continueCoins = e.coins, continueBusy = !1, !e.ok) {
                    sfx.buyFail();
                    return
                }
            } else {
                continueBusy = !1;
            }
            let seed = buildContinueSeed({ currentShield: shield });
            lives = seed.lives, invuln = seed.invulnFrames, shield = seed.shieldFrames;
            mode = seed.mode, readyTimer = seed.readyFrames, sfx.buy();
            floatTexts.push({
                x: player.x,
                y: player.y + seed.float.dy,
                text: seed.float.text,
                color: seed.float.color,
                life: seed.float.life
            });
            bossActive ? bgm.boss(bossForStage(stage).vibe, stage) : bgm.start(`play`, stage)
        }

        /** 未連携なら案内して false。連携済みなら true。 */
        function requireAccountLink(feature = translate(`hud.featDefault`)) {
            let gate = requireLinked(!!account.linked, feature);
            if (gate.ok) return !0;
            soundToast = gate.message, soundToastLife = 100, shareToast = soundToast, shareToastLife = 100, sfx.buyFail();
            return !1
        }

        
        // ── sound test ──
        /** サウンドテスト。旧曲バックアップ枠も含む。 */
        function openSoundTest() {
            if (!account.linked) {
                shareToast = translate(`hud.soundLock`), shareToastLife = 90, sfx.buyFail();
                return
            }
            bgm.unlock(), soundListMode = `menu`, soundCursor = 0, trackLabel = ``, mode = `soundtest`, bgm.start(`attract`), soundPlayMode = `title`, soundIndex = 0, trackLabel = `TITLE THEME`, fetchTrackVotes(`title`, playerId).then(votes => {
                ratings = votes
            }), sfx.ui()
        }

        /** サウンドテストを閉じてタイトルへ。 */
        function leaveSoundTest() {
            mode = `attract`, titleSub = `extra`, titleCursor = 0, bgm.start(`attract`), trackLabel = ``, sfx.ui()
        }

        /** 再生中トラックの識別キー。コメント紐付け用。 */
        function currentTrackKey() {
            return makeTrackKey(soundPlayMode, soundIndex)
        }

        /** 再生中トラックの表示カード。 */
        function currentTrackCard() {
            let e = currentTrackKey(),
                r = soundCatalogMeta();
            return buildTrackCard({
                trackKey: e,
                mode: soundPlayMode,
                index: soundIndex,
                titleOverride: trackLabel,
                labels: r.labels
            })
        }

        /** 「いまの曲」カード。i18n は translate()。引数名を短くしないこと。 */
        function drawTrackCard(topY, opts) {
            let n = currentTrackCard(),
                hasPeriod = !!(n.period && String(n.period).trim()),
                lay = trackCardLayout({
                    top: topY,
                    compact: !!opts?.compact,
                    mode: soundPlayMode,
                    index: soundIndex,
                    cat: n.cat,
                    hasPeriod
                });
            fillRect(lay.box.x, lay.box.y, lay.box.w, lay.box.h, `#0a1a14`);
            ctx.strokeStyle = n.catColor;
            ctx.strokeRect(lay.box.x + .5, lay.box.y + .5, lay.box.w - 1, lay.box.h - 1);
            fillRect(lay.catBadge.x, lay.catBadge.y, lay.catBadge.w, lay.catBadge.h, `#102820`);
            drawText(lay.catBadge.text, lay.catLabelX, lay.catLabelY, n.catColor, 6, `center`);
            drawText(translate(`hud.thisTrack`), lay.metaX, lay.metaY, `#668877`, 6);
            // title without period crammed in
            drawText(n.short, 64, lay.titleY, `#ffeeaa`, lay.titleSize);
            if (lay.periodY != null && hasPeriod) {
                drawText(String(n.period), 64, lay.periodY, `#ccaa66`, lay.periodSize);
            }
            lay.showId && drawText(`ID ${n.key}`, 258, lay.idY, `#445544`, 5, `right`);
            return lay.height
        }

        /** 指定リストの曲を再生。BGM エンジンへ委譲。 */
        function playSoundTrack(listMode, index = 0) {
            soundPlayMode = listMode, soundIndex = index, trackLabel = playBgmForMode(listMode, index), fetchTrackVotes(makeTrackKey(listMode, index), playerId).then(votes => {
                ratings = votes
            })
        }
        async function voteTrack(dir) {
            if (!requireAccountLink(translate(`hud.featRate`))) return;
            ratings = await castTrackVote(currentTrackKey(), playerId, dir), sfx.ui()
        }
        async function loadComments(key) {
            trackKey = key, comments = await fetchTrackComments(key), commentCursor = 0
        }

        /** トラックへのファンコメント一覧。 */
        function openComments() {
            let can = canOpenComments(trackLabel);
            if (!can.ok) {
                soundToast = can.message, soundToastLife = 80, sfx.buyFail();
                return
            }
            commentsReturn = commentsReturnMode(soundListMode, soundPlayMode);
            let key = currentTrackKey();
            Promise.all([loadComments(key), fetchTrackVotes(key, playerId)]).then(([, votes]) => {
                ratings = votes, soundListMode = `comments`, commentCursor = 0, sfx.ui()
            })
        }

        /** コメント画面からサウンドテストへ戻る。 */
        function leaveComments() {
            soundListMode = commentsReturn, sfx.ui()
        }

        /** 1件のコメントを開く。URL はクッション経由。 */
        function viewComment(comment) {
            openSoundCommentViewer(comment, {
                trackKey: trackKey || currentTrackKey(),
                trackCard: currentTrackCard(),
                mode: soundPlayMode,
                modeIndex: soundIndex,
                playerId: playerId,
                linked: !!account.linked,
                redraw: () => sfx.ui(),
                playError: () => sfx.buyFail()
            })
        }

        async function writeComment() {
            if (!requireAccountLink(translate(`hud.featPost`)) || composing) return;
            openSoundCommentComposer({
                trackKey: trackKey || currentTrackKey(),
                trackCard: currentTrackCard(),
                mode: soundPlayMode,
                modeIndex: soundIndex,
                playerId: playerId,
                setComposing: (stage) => { composing = stage },
                postComment: (trackKey, playerId, body, urls, kind) => postTrackComment(trackKey, playerId, body, urls, kind),
                onPosted: async (trackKey) => { comments = await fetchTrackComments(trackKey) },
                playOk: () => sfx.buy(),
                playError: () => sfx.buyFail()
            })
        }

        /** サウンドテストのルートメニュー行。 */
        function soundTestMenuRows() {
            return buildSoundTestRootMenu()
        }

        /** 曲リストの行。旧版は日付付き。 */
        function soundTestListRows(listMode) {
            return buildSoundTestTrackList(listMode, soundCatalogMeta())
        }

        /** サウンドテストの決定。再生またはサブ画面へ。 */
        function activateSoundTestRow() {
            if (bgm.unlock(), soundListMode === `menu`) {
                let e = soundTestMenuRows()[soundCursor];
                if (!e) return;
                let act = soundTestMenuAction(e.action);
                if (act.type === `play_title`) playSoundTrack(`title`, 0), sfx.ui();
                else if (act.type === `open_stage`) soundListMode = `stage`, soundCursor = 0, sfx.ui();
                else if (act.type === `open_boss`) soundListMode = `boss`, soundCursor = 0, sfx.ui();
                else if (act.type === `open_legacy`) soundListMode = `legacy`, soundCursor = 0, sfx.ui();
                else if (act.type === `open_archive`) soundListMode = `archive`, soundCursor = 0, sfx.ui();
                else if (act.type === `stop`) bgm.stop(), trackLabel = `— STOPPED —`, sfx.ui();
                else if (act.type === `back`) leaveSoundTest();
                return
            }
            if (soundListMode === `comments`) return;
            let e = soundTestListRows(soundListMode)[soundCursor];
            let act = soundTestListAction(soundListMode, e);
            if (act.type === `back_menu`) soundListMode = `menu`, soundCursor = 0, sfx.ui();
            else if (act.type === `play`) playSoundTrack(act.list, act.index), sfx.ui()
        }

        /** サウンドテスト全体の描画。 */
        function drawSoundTest() {
            if (fillRect(RAIL_W, 0, FIELD_INNER_W, PLAY_H, `#000a12`), fillRect(54, 14, 212, 376, `#001018`), ctx.strokeStyle = `#44ffcc`, ctx.strokeRect(54.5, 14.5, 211, 375), soundListMode === `comments`) {
                drawText(`COMMENTS`, PLAY_W / 2, 18, `#88ffee`, 10, `center`);
                let e = drawTrackCard(28, {
                    compact: !0
                });
                drawText(translate(`hud.comments`, { n: comments.length }), PLAY_W / 2, 28 + e + 4, `#668866`, 6, `center`);
                let listY = 28 + e + 14;
                if (!comments.length) drawText(translate(`hud.noComments`), PLAY_W / 2, 120, `#556666`, 8, `center`), drawText(translate(`hud.writeFirst`), PLAY_W / 2, 136, `#445555`, 7, `center`);
                else {
                    let { rows } = buildCommentRows({ comments: comments, cursor: commentCursor, baseY: listY });
                    for (let row of rows) {
                        row.selected && (fillRect(60, row.y - 1, 200, 20, `#003322`), ctx.strokeStyle = `#66ffaa`, ctx.strokeRect(60.5, row.y - .5, 199, 19));
                        drawText(row.text, 64, row.y + 4, row.selected ? `#ffffff` : `#99bbaa`, 7)
                    }
                }
                drawText(account.linked ? `👍 ${ratings.likes}   👎 ${ratings.dislikes}` : translate(`hud.rateNeedLong`), PLAY_W / 2, 348, account.linked ? `#88aa88` : `#aa8844`, 7, `center`);
                for (let entity of commentsFooterButtons({ mine: ratings.mine })) {
                    fillRect(entity.x, entity.y, entity.w, entity.h, entity.fill);
                    ctx.strokeStyle = entity.stroke;
                    ctx.strokeRect(entity.x + .5, entity.y + .5, entity.w - 1, entity.h - 1);
                    drawText(entity.label, entity.labelX, entity.labelY, entity.labelColor, 8, `center`);
                }
                soundToastLife > 0 && drawText(soundToast, PLAY_W / 2, 388, `#ffaa66`, 6, `center`);
                return
            }
            drawText(`SOUND TEST`, PLAY_W / 2, 18, `#88ffee`, 11, `center`), drawText(translate(`hud.soundPerk`), PLAY_W / 2, 30, `#448866`, 6, `center`);
            let playing = !!(trackLabel && !trackLabel.startsWith(`—`)),
                cardH = 0;
            if (playing) cardH = drawTrackCard(36, { compact: !1 });
            let top = soundTestListTop(playing, cardH);
            if (playing && top.ratingY != null) drawText(translate(`hud.thisRate`, { up: ratings.likes, dn: ratings.dislikes }), PLAY_W / 2, top.ratingY, `#88aa88`, 6, `center`);
            else if (top.hintY != null) drawText(translate(`hud.pickTrack`), PLAY_W / 2, top.hintY, `#556666`, 6, `center`);
            let pageSize = soundTestPageSize(playing),
                listTop = top.listTop;
            if (soundListMode === `menu`) {
                let menuRows = soundTestMenuRows();
                soundCursor >= menuRows.length && (soundCursor = menuRows.length - 1);
                for (let i = 0; i < menuRows.length; i++) {
                    let rowY = listTop + i * 17,
                        selected = i === soundCursor;
                    selected && (fillRect(60, rowY - 1, 200, 15, `#003322`), ctx.strokeStyle = `#66ffaa`, ctx.strokeRect(60.5, rowY - .5, 199, 14)), drawText(menuRows[i].label, 66, rowY + 2, selected ? `#ffffff` : `#88ccaa`, 8), menuRows[i].sub && drawText(menuRows[i].sub, 258, rowY + 3, `#446655`, 6, `right`)
                }
            } else {
                let listRows = soundTestListRows(soundListMode);
                soundCursor >= listRows.length && (soundCursor = listRows.length - 1);
                let winStart = soundTestListWindow(listRows.length, soundCursor, pageSize);
                {
                    // header only when not overlapping the track card
                    if (!playing) {
                        let hdr = soundTestListHeader(soundListMode);
                        drawText(hdr.title, PLAY_W / 2, 52, hdr.color, 6, `center`);
                    }
                }
                for (let i = 0; i < Math.min(pageSize, listRows.length); i++) {
                    let idx = i + winStart,
                        rowY = listTop + 2 + i * 17,
                        selected = idx === soundCursor;
                    selected && (fillRect(60, rowY - 1, 200, 15, `#002233`), ctx.strokeStyle = `#66ccff`, ctx.strokeRect(60.5, rowY - .5, 199, 14));
                    let isBack = listRows[idx].action === `back`;
                    drawText(listRows[idx].label, 66, rowY + 2, selected ? `#ffffff` : isBack ? `#888` : `#88aacc`, 8), !isBack && soundPlayMode === soundListMode && soundIndex === listRows[idx].n && drawText(`▶`, 256, rowY + 2, `#ffee66`, 7, `right`)
                }
                winStart > 0 && drawText(`▲`, PLAY_W / 2, listTop - 4, `#44aa88`, 7, `center`), winStart + pageSize < listRows.length && drawText(`▼`, PLAY_W / 2, 360, `#44aa88`, 7, `center`)
            }
            if (trackLabel && !trackLabel.startsWith(`—`)) {
                for (let entity of playingFooterButtons({ likes: ratings.likes, dislikes: ratings.dislikes, mine: ratings.mine })) {
                    fillRect(entity.x, entity.y, entity.w, entity.h, entity.fill);
                    ctx.strokeStyle = entity.stroke;
                    ctx.strokeRect(entity.x + .5, entity.y + .5, entity.w - 1, entity.h - 1);
                    drawText(entity.label, entity.labelX, entity.labelY, entity.labelColor, 7, `center`);
                }
                if (!account.linked) drawText(translate(`hud.rateNeed`), PLAY_W / 2, 350, `#aa8844`, 6, `center`);
                else {
                    let card = currentTrackCard();
                    let idxPart = soundPlayMode === "title" ? "" : String(soundIndex);
                    drawText(`対象: ${card.cat}${idxPart} ${card.short.slice(0, 16)}`, PLAY_W / 2, 350, `#668866`, 5, `center`)
                }
            } else drawText(translate(`hud.swipe`), PLAY_W / 2, 366, `#335544`, 6, `center`);
            soundToastLife > 0 && drawText(soundToast, PLAY_W / 2, 388, `#ffaa66`, 6, `center`)
        }

        /** 曲リスト先頭の Y。ヒット判定と揃える。 */
        function soundListTopY() {
            return soundListMode === `comments` ? 70 : trackLabel && !trackLabel.startsWith(`—`) ? 84 : 58
        }

        /** Y座標から行番号へ。 */
        function soundTestRowIndexAtY(y) {
            return soundTestRowAtY({
                y: y,
                mode: soundListMode,
                menuLen: soundTestMenuRows().length,
                listLen: soundTestListRows(soundListMode).length,
                cursor: soundCursor,
                listTop: soundListTopY(),
                playing: !!(trackLabel && !trackLabel.startsWith(`—`))
            })
        }

        /** サウンドテストの押し下げ。ドラッグ開始もここで。 */
        function onSoundTestPointerDown(x, y) {
            let down = soundTestPointerDown({
                x: x,
                y: y,
                left: RAIL_W,
                right: FIELD_RIGHT,
                mode: soundListMode,
                rowAtY: soundTestRowIndexAtY
            });
            if (down.type === `side_back_comments`) { leaveComments(); return }
            if (down.type === `side_back_list`) { leaveSoundTest(); return }
            soundDragOn = !0, soundDragY = y, soundDragAcc = 0, soundDragged = !1;
            if (down.selectRow != null) soundCursor = down.selectRow
        }

        /** サウンドテストのスクロール。 */
        function onSoundTestPointerDrag(x, y) {
            if (!soundDragOn || mode !== `soundtest`) return;
            let dy = y - soundDragY;
            let scr = dragScrollSteps(soundDragAcc, dy, 15);
            soundDragAcc = scr.accum, soundDragY = y;
            if (!scr.steps) return;
            soundDragged = !0;
            if (soundListMode === `comments`) {
                let lastComment = Math.max(0, comments.length - 1);
                commentCursor = Math.max(0, Math.min(lastComment, commentCursor + scr.steps)), sfx.ui();
                return
            }
            let lastIndex = soundListMode === `menu` ? soundTestMenuRows().length - 1 : soundTestListRows(soundListMode).length - 1;
            soundCursor = Math.max(0, Math.min(lastIndex, soundCursor + scr.steps)), sfx.ui()
        }

        /** サウンドテストの離し。移動が小さければ決定。 */
        function onSoundTestPointerUp(x, y) {
            if (!soundDragOn) return;
            if (soundDragOn = !1, soundDragged) {
                soundDragged = !1;
                return
            }
            let pointerUp = soundTestPointerUp({
                dragged: !1,
                x: x,
                y: y,
                left: RAIL_W,
                right: FIELD_RIGHT,
                mode: soundListMode,
                playing: !!(trackLabel && !trackLabel.startsWith(`—`)),
                hasComments: !!comments.length,
                commentsFooter: soundTestCommentsFooterHit,
                playingFooter: soundTestPlayingFooterHit,
                rowAtY: soundTestRowIndexAtY
            });
            if (pointerUp.type === `ignore`) return;
            if (pointerUp.type === `footer_like`) { voteTrack(1); return }
            if (pointerUp.type === `footer_dislike`) { voteTrack(-1); return }
            if (pointerUp.type === `footer_write` || pointerUp.type === `write_first`) { writeComment(); return }
            if (pointerUp.type === `footer_back`) { leaveComments(); return }
            if (pointerUp.type === `footer_comments`) { openComments(); return }
            if (pointerUp.type === `open_comment`) { comments[commentCursor] && viewComment(comments[commentCursor]); return }
            if (pointerUp.type === `activate_row`) {
                if (pointerUp.row >= 0) soundCursor = pointerUp.row;
                activateSoundTestRow()
            }
        }

        
        // ── share (PLAY_W) ──
        /** 管理者だけプロモ管理を開く。 */
        function tryOpenPromoAdmin() {
            try {
                openPromoAdminDialog({
                    playerId: account.linked ? playerId : null,
                    sfxUi: () => { try { sfx.ui() } catch {} },
                    sfxOk: () => { try { sfx.buy() } catch {} },
                    sfxFail: () => { try { sfx.buyFail() } catch {} },
                    onDenied: () => {
                        shareToast = translate(`hud.adminOnly`), shareToastLife = 90;
                        try { sfx.buyFail() } catch {}
                    },
                    onStaffChange: () => {
                        // menu re-evaluates isPromoAdminPlayer from cache
                    },
                });
            } catch {}
        }

        /** 説明（ヘルプ）。チュートリアルへの入口もある。 */
        function tryOpenHelp() {
            try {
                openHelpDialog({
                    sfxUi: () => { try { sfx.ui() } catch {} },
                    sfxOk: () => { try { sfx.buy() } catch {} },
                    onStartTutorial: () => {
                        tutorialRun = !0;
                        difficulty = `tutorial`;
                        startRun();
                    },
                });
                if (!document.getElementById(`sf-help-root`)) {
                    shareToast = translate(`hud.dataFail`), shareToastLife = 80;
                } else {
                    try { sfx.ui() } catch {}
                }
            } catch (e) {
                console.error(`[help]`, e);
                shareToast = translate(`hud.dataFail`), shareToastLife = 80;
            }
        }

        /** 視聴ミッション。カタログが空なら「ありません」。 */
        function tryOpenMediaWatch() {
            try {
                openMediaWatchDialog({
                    playerId: playerId || ``,
                    sfxUi: () => { try { sfx.ui() } catch {} },
                    sfxOk: () => { try { sfx.buy() } catch {} },
                    sfxFail: () => { try { sfx.buyFail() } catch {} },
                    onCoins: (c) => {
                        continueCoins = Math.max(0, c | 0);
                        shareToast = translate(`hud.watchOpen`, { n: continueCoins }), shareToastLife = 100;
                    },
                });
                // confirm DOM mount (silent fail was hard to debug on touch)
                if (!document.getElementById(`sf-media-watch-root`)) {
                    shareToast = translate(`hud.watchFail`), shareToastLife = 90;
                    try { sfx.buyFail() } catch {}
                } else {
                    try { sfx.ui() } catch {}
                }
            } catch (e) {
                console.error(`[media-watch]`, e);
                shareToast = translate(`hud.watchFail`), shareToastLife = 80;
                try { sfx.buyFail() } catch {}
            }
        }

        /** 広告主ポータル。未連携ならロック。 */
        function tryOpenPartnerPortal() {
            try {
                if (!account.linked) {
                    shareToast = translate(`hud.partnerLock`), shareToastLife = 90;
                    try { sfx.buyFail() } catch {}
                    return;
                }
                if (!playerId) {
                    shareToast = `プレイヤーIDがありません`, shareToastLife = 80;
                    try { sfx.buyFail() } catch {}
                    return;
                }
                // remove stuck portal if any
                try { document.getElementById(`sf-partner-root`)?.remove() } catch {}
                openPartnerPortalDialog({
                    playerId: playerId,
                    sfxUi: () => { try { sfx.ui() } catch {} },
                    sfxOk: () => { try { sfx.buy() } catch {} },
                    sfxFail: () => { try { sfx.buyFail() } catch {} },
                });
                if (!document.getElementById(`sf-partner-root`)) {
                    shareToast = translate(`hud.partnerFail`), shareToastLife = 90;
                    try { sfx.buyFail() } catch {}
                } else {
                    try { sfx.ui() } catch {}
                }
            } catch (e) {
                console.error("[partner]", e);
                shareToast = translate(`hud.partnerFail`), shareToastLife = 90;
                try { sfx.buyFail() } catch {}
            }
        }

        /** 進捗シェア文面を組んでシートを開く。ハッシュタグは末尾に1回。 */
        function shareProgress() {
            let pack = buildSharePayload({
                playerId: playerId,
                stage: stage,
                score: score,
                difficulty: difficulty,
                mode: mode,
                bossActive: !!bossActive,
                bossName: bossName,
                lives: lives,
                continueCoins: continueCoins
            });
            openShareSheet(playerId, pack.payload);
            shareToast = pack.toast, shareToastLife = 120, sfx.ui()
        }

        /** タイトルのタップ。空き地の誤爆決定はしない。1回目は選択音のみ。 */
        function handleAttractTap(gx, gy) {
            // mission host profile (before menu resolve)
            if (titleMissionHit(gx, gy)) {
                openSharerProfileView();
                return
            }
            let adminMenu = !!(account.linked && isPromoAdminPlayer(playerId));
            let res = resolveAttractPointer({
                x: gx,
                y: gy,
                Z: PLAY_H,
                left: RAIL_W,
                right: FIELD_RIGHT,
                sub: titleSub,
                cursor: titleCursor,
                difficulty: difficulty,
                isPromoAdmin: adminMenu
            });
            if (res.cursor != null) titleCursor = res.cursor;
            let act = toAttractDispatch(res.action);
            if (act.type === `account`) { openAccount(); return }
            if (act.type === `side_back_extra`) { titleSub = `root`, titleCursor = 4, sfx.ui(); return }
            if (act.type === `side_back_diff`) { titleSub = `root`, titleCursor = 0, sfx.ui(); return }
            if (act.type === `side_options`) { openOptions(`attract`); return }
            if (act.type === `side_extra`) { titleSub = `extra`, titleCursor = 0, sfx.ui(); return }
            if (act.type === `sound_test`) { openSoundTest(); return }
            if (act.type === `profile`) {
                if (typeof window.__sfOpenProfile === `function`) window.__sfOpenProfile();
                else { shareToast = translate(`hud.profileFail`), shareToastLife = 80; try { sfx.buyFail() } catch {} }
                return
            }
            if (act.type === `stats`) {
                if (typeof window.__sfOpenStats === `function`) window.__sfOpenStats();
                else { shareToast = translate(`hud.dataFail`), shareToastLife = 80; try { sfx.buyFail() } catch {} }
                return
            }
            if (act.type === `open_bag`) { openBag(`attract`); return }
            // VIEW BOOST / ADVERTISER: always open (1-tap from EXTRA; do not fall through to noop)
            if (act.type === `open_media_watch`) { tryOpenMediaWatch(); return }
            if (act.type === `open_partner`) { tryOpenPartnerPortal(); return }
            if (act.type === `open_promo_admin`) {
                tryOpenPromoAdmin();
                return
            }
            if (act.type === `back_root`) { titleSub = `root`, titleCursor = act.cursor, sfx.ui(); return }
            if (act.type === `start_easy`) { tutorialRun = !1, unmountTutorialDock(), difficulty = `easy`, startRun(); return }
            if (act.type === `start_normal`) { tutorialRun = !1, unmountTutorialDock(), difficulty = `normal`, startRun(); return }
            if (act.type === `open_diff`) { titleSub = `diff`, titleCursor = act.preferNormal ? 1 : 0, sfx.ui(); return }
            if (act.type === `share`) { shareProgress(); return }
            if (act.type === `inbox`) { sharerId && canSendFanmail() ? openFanmail() : openInbox(); return }
            if (act.type === `options`) { openOptions(`attract`); return }
            if (act.type === `open_extra`) { titleSub = `extra`, titleCursor = 0, sfx.ui(); return }
            if (act.type === `changelog`) { openChangelog(); return }
            if (act.type === `noop` || act.type === `noop_ui`) {
                // first tap on a menu row (root): move cursor + select SE
                if (res.cursor != null) {
                    try { sfx.select() } catch { try { sfx.ui() } catch {} }
                }
                return
            }
            // successful open: soft UI blip (actions play their own SFX)
            try { sfx.ui() } catch {}
        }

        
        // ── main update tick ──
        /** 1フレーム分の更新。モード分岐の心臓。チュートリアルの割り込みもここ。 */
        function tickGame(dt) {
            try {
              if (mode === `playing` || mode === `ready` || mode === `bossintro`) {
                window.__sfPlayAcc = (window.__sfPlayAcc || 0) + (typeof dt === "number" ? dt : 0.016);
                if (window.__sfPlayAcc >= 1) { addPlayTime(window.__sfPlayAcc); window.__sfPlayAcc = 0; }
              }
            } catch (err) {}
            frame++;
            {
                let decayed = decayTimers({
                    shake: shake, shopToast: shopToastLife, optToast: optionsToastLife, stToast: soundToastLife,
                    shareToast: shareToastLife, missionBanner: missionBannerLife, missionToast: missionToastLife,
                    shield: shield, celebrate: celebrate
                });
                shake = decayed.shake, shopToastLife = decayed.shopToast, optionsToastLife = decayed.optToast, soundToastLife = decayed.stToast;
                shareToastLife = decayed.shareToast, missionBannerLife = decayed.missionBanner, missionToastLife = decayed.missionToast;
                shield = decayed.shield, celebrate = decayed.celebrate;
                if (bagToastLife > 0) bagToastLife--;
            }
            tickStars(stars, mode, PLAY_H, RAIL_W, FIELD_INNER_W);
            tickFloats(floatTexts);
            tickLifetimes(lockBeams);
            tickParticles(fxParticles);

            let mtick = tickMode({ mode: mode, readyFrames: readyTimer, frame: frame });
            if (tutorialShopQueued && tutorialRun && mode === `playing`) {
                tutorialShopQueued = !1;
                openShop(!0);
                return;
            }
            if (mtick.type === `menu_idle`) return;
            if (mtick.type === `stageclear_to_shop`) {
                readyTimer = mtick.readyLeft;
                if (mtick.openShop) {
                    if (tutorialRun && stage === 1) {
                        noteTutorialEvent(`boss_clear`);
                        try { unmountTutorialDock(); } catch {}
                        try {
                            openTutorialClearDialog({
                                sfxUi: () => { try { sfx.ui() } catch {} },
                                onClose: () => { quitToTitle(); },
                            });
                        } catch {
                            quitToTitle();
                        }
                        return;
                    }
                    if (settings.autoShop !== !1) openShop(!1);
                    else stage++, startStage();
                }
                return
            }
            if (mtick.type === `gameover_poll`) {
                mtick.pollCoins && refreshCoins();
                return
            }
            if (mtick.type === `name_blink`) { nameBlink++; return }
            if (mtick.type === `inbox_idle`) return;
            if (mtick.type === `countdown_to_playing`) {
                readyTimer = mtick.readyLeft;
                if (readyTimer <= 0) mode = `playing`;
            } else if (mtick.type === `play`) {
                let speed = playerSpeed(upgrades.speed, settings.sense);
                let ka = normalizeAxis(keyboardAxis(keysDown));
                // keyboard has priority so WASD/arrows always work mid-run
                if (ka.x !== 0 || ka.y !== 0) {
                    player.x += ka.x * speed * dt;
                    player.y += ka.y * speed * dt;
                    swipeActive = !1;
                } else if (settings.vstick && vstickActive) {
                    Math.min(1, Math.hypot(vstickAxisX, vstickAxisY)) > VSTICK_DEADZONE && (player.x += vstickAxisX * speed * dt, player.y += vstickAxisY * speed * dt);
                } else if (!settings.vstick && swipeActive) {
                    let t = swipeFollowFactor(upgrades.speed, settings.sense, dt);
                    player.x += (swipeX - player.x) * t, player.y += (swipeY - player.y) * t
                }
                if (tutorialRun && (ka.x !== 0 || ka.y !== 0 || swipeActive || (settings.vstick && vstickActive))) {
                    noteTutorialEvent(`move`);
                }
            }
            {
                let pos = clampPlayerPos(player.x, player.y);
                player.x = pos.x, player.y = pos.y
            }
            // map chip scroll (play / ready / boss intro)
            if (mode === `playing` || mode === `ready` || mode === `bossintro`) {
                try {
                    let mdef = getStageMap(stage);
                    let spd = mdef.scrollSpeed * (mode === `bossintro` ? 0.45 : 1);
                    mapScroll += spd * Math.max(0.5, Math.min(2, dt || 1));
                } catch {}
            }
            if (invuln > 0 && invuln--, mode === `playing`) {
                {
                    let tick = planWeaponFire({
                        shot: shotTimer, missile: missileTimer, particle: particleTimer, lockon: lockonTimer, beam: beamTimer, flame: flameTimer
                    }, {
                        rate: armedLevelOf(`rate`),
                        missile: armedLevelOf(`missile`),
                        cluster: armedLevelOf(`cluster`),
                        particle: armedLevelOf(`particle`),
                        overdrive: armedLevelOf(`overdrive`),
                        lockon: armedLevelOf(`lockon`),
                        hyper: armedLevelOf(`hyper`),
                        beam: armedLevelOf(`beam`),
                        flame: armedLevelOf(`flame`),
                        shotArmed: isWeaponArmed(`shot`),
                        optionArmed: isWeaponArmed(`option`),
                        linked: !!account.linked
                    }, dt);
                    shotTimer = tick.cds.shot, missileTimer = tick.cds.missile, particleTimer = tick.cds.particle;
                    lockonTimer = tick.cds.lockon, beamTimer = tick.cds.beam, flameTimer = tick.cds.flame;
                    for (let nextEntityId of tick.fire) {
                        if (nextEntityId === `shot`) firePlayerShots();
                        else if (nextEntityId === `missile`) fireMissiles();
                        else if (nextEntityId === `particle`) fireParticles();
                        else if (nextEntityId === `lockon`) fireLockon();
                        else if (nextEntityId === `beam`) fireBeam();
                        else if (nextEntityId === `flame`) fireFlame();
                    }
                }
                {
                    let spawnPlan = planSpawn({
                        bossActive: !!bossActive,
                        spawnCd: spawnTimer,
                        kills: kills,
                        killTarget: killsForBoss,
                        stage: stage
                    });
                    spawnTimer = spawnPlan.spawnCd;
                    if (spawnPlan.spawn) spawnGruntEnemy(), spawnTimer = spawnPlan.afterSpawnCd;
                    if (spawnPlan.startBoss) spawnBossEnemy();
                }
                for (let t = enemies.length - 1; t >= 0; t--) {
                    let n = enemies[t];
                    stepEnemyMotion(n, dt, (loadoutSummaryText) => {
                        let meta = bossById(loadoutSummaryText.bossId);
                        stepBossPosition(loadoutSummaryText, meta.move, RAIL_W, FIELD_RIGHT);
                    });
                    n.fireCd--;
                    if (enemyShouldFire(n)) {
                        enemyShoot(n);
                        n.fireCd = enemyReloadFrames(n);
                    }
                    if (enemyShouldDespawn(n)) {
                        enemies.splice(t, 1);
                        continue
                    }
                    if (invuln <= 0 && enemyPlayerHit(n.x, n.y, n.w, n.h, player.x, player.y, player.w, player.h)) {
                        playerTakeHit();
                        if (!n.boss) damageEnemy(n, 999, n.x, n.y);
                    }
                }
                for (let bulletIdx = bullets.length - 1; bulletIdx >= 0; bulletIdx--) {
                    let t = bullets[bulletIdx];
                    t.life--;
                    if (t.kind === `missile` && t.from === `p`) {
                        let tgt = t.targetId ? findEnemyById(t.targetId) : void 0;
                        if (!tgt) {
                            let n = nearestEnemies(1)[0];
                            n && (t.targetId = n.id, tgt = n)
                        }
                        steerMissile(t, tgt);
                    }
                    t.x += t.vx, t.y += t.vy;
                    if (bulletOutOfBounds(t)) {
                        bullets.splice(bulletIdx, 1);
                        continue
                    }
                    if (t.from === `p`) {
                        for (let n of enemies)
                            if (aabbOverlap(t.x, t.y, t.w * 2, t.h * 2, n.x, n.y, n.w, n.h)) {
                                damageEnemy(n, t.dmg, t.x, t.y), t.kind !== `particle` && bullets.splice(bulletIdx, 1), settings.shake && (shake = Math.min(10, shake + 1));
                                break
                            }
                    } else invuln <= 0 && playerBulletHit(player.x, player.y, t.x, t.y) && (playerTakeHit(), bullets.splice(bulletIdx, 1))
                }
            }
        }

        /** 1フレーム分の描画。更新とは分離してチラつきを避ける。 */
        function drawFrame() {
            ctx.fillStyle = `#000`, ctx.fillRect(0, 0, PLAY_W, PLAY_H);
            let shakeOff = screenShakeOffset(shake),
                e = shakeOff.x,
                sy = shakeOff.y;
            let route = drawRoute(mode);
            if (ctx.save(), ctx.translate(e, sy), fillRect(RAIL_W, 0, FIELD_INNER_W, PLAY_H, `#000`), route === `attract`) drawAttract();
            else if (route === `changelog`) drawChangelog();
            else if (route === `soundtest`) drawSoundTest();
            else if (route === `shop`) drawShop();
            else if (route === `options`) drawOptions();
            else if (route === `bag`) drawBag();
            else if (route === `stageselect`) drawStageSelect();
            else {
                // terrain chip map under stars
                try {
                    drawStageMap(ctx, stage, mapScroll, RAIL_W, 0, FIELD_INNER_W, PLAY_H);
                } catch {
                    fillRect(RAIL_W, 0, FIELD_INNER_W, PLAY_H, `#001400`);
                }
                for (let e of stars) fillRect(e.x, e.y, e.s, e.s, starColor(e.s));
                if (fieldDrawsEntities(mode)) {
                    for (let e of lockBeams) ctx.strokeStyle = e.color, ctx.globalAlpha = lockonAlpha(e.life), ctx.lineWidth = 1 + upgrades.lockon * .4, ctx.beginPath(), ctx.moveTo(player.x, player.y - 6), ctx.lineTo(e.tx, e.ty), ctx.stroke(), ctx.strokeRect(e.tx - 6, e.ty - 6, 12, 12), ctx.globalAlpha = 1;
                    let powerLv = armedLevelOf(`power`);
                    for (let e of bullets)
                        for (let r of bulletRects(e, powerLv)) fillRect(r.x, r.y, r.w, r.h, r.color);
                    for (let e of enemies) drawEnemy(e);
                    shield > 0 && (ctx.strokeStyle = shieldStrokeColor(frame), ctx.beginPath(), ctx.arc(player.x, player.y, 14, 0, Math.PI * 2), ctx.stroke()), drawPlayerShip(player.x, player.y, 1, invulnBlink(invuln)), drawOptionPods();
                    for (let e of fxParticles) ctx.globalAlpha = particleAlpha(e.life, e.max), fillRect(e.x, e.y, e.size, e.size, e.color);
                    ctx.globalAlpha = 1;
                    for (let e of floatTexts) ctx.globalAlpha = floatTextAlpha(e.life), drawText(e.text, e.x, e.y, e.color, 8, `center`);
                    ctx.globalAlpha = 1, drawVirtualStick()
                }
                {
                    let bannerOverlay = stageBannerOverlay(stageBanner(mode, stage, bossName, frame, settings.autoShop !== !1), PLAY_W, PLAY_H);
                    if (bannerOverlay) {
                        for (let r of bannerOverlay.rects) {
                            if (r.fill) fillRect(r.x, r.y, r.w, r.h, r.fill);
                            if (r.stroke) {
                                ctx.strokeStyle = r.stroke;
                                ctx.strokeRect(r.x + .5, r.y + .5, r.w - 1, r.h - 1);
                            }
                        }
                        for (let t of bannerOverlay.texts) drawText(t.text, t.x, t.y, t.color, t.size, t.align || `center`);
                    }
                }
                if (mode === `gameover`) {
                    let gameOverView = buildGameOverView({ score: score, coins: continueCoins, frame: frame, tutorial: !!(tutorialRun || difficulty === `tutorial`) });
                    drawText(`GAME OVER`, PLAY_W / 2, PLAY_H / 2 - 48, `#ff2244`, 18, `center`);
                    drawText(gameOverView.scoreText, PLAY_W / 2, PLAY_H / 2 - 24, `#00ff88`, 12, `center`);
                    drawText(gameOverView.coinText, PLAY_W / 2, PLAY_H / 2 - 6, gameOverView.coinColor, 10, `center`);
                    drawText(translate(`hud.goHint`), PLAY_W / 2, 210, `#668866`, 7, `center`);
                    fillRect(72, 228, 176, 30, gameOverView.continue.fill), ctx.strokeStyle = gameOverView.continue.stroke, ctx.strokeRect(72.5, 228.5, 175, 29);
                    drawText(gameOverView.continue.label, PLAY_W / 2, 237, gameOverView.continue.labelColor, 9, `center`);
                    fillRect(72, 264, 176, 28, `#221100`), ctx.strokeStyle = gameOverView.shareStroke, ctx.strokeRect(72.5, 264.5, 175, 27);
                    drawText(translate(`hud.goShare`), PLAY_W / 2, 272, `#ffcc66`, 9, `center`);
                    fillRect(88, 298, 144, 22, `#001100`), ctx.strokeStyle = `#335533`, ctx.strokeRect(88.5, 298.5, 143, 21);
                    drawText(`→ TITLE`, PLAY_W / 2, 303, `#668866`, 8, `center`)
                }
                if (mode === `name`) {
                    let nameView = buildNameEntryView({ highScore: highScore, score: score, letters: nameLetters, cursor: nameCursor, blinkFrame: nameBlink });
                    drawText(`ENTER YOUR NAME!`, PLAY_W / 2, PLAY_H * .28, `#ff3333`, 12, `center`);
                    drawText(`BEST PLAYERS`, PLAY_W / 2, PLAY_H * .36, `#00ffaa`, 10, `center`);
                    drawText(`1ST  ${nameView.best}  SWF`, PLAY_W / 2, PLAY_H * .44, `#fff`, 9, `center`);
                    drawText(`2ND  030000  FOR`, PLAY_W / 2, PLAY_H * .5, `#fff`, 9, `center`);
                    drawText(`3RD  ${nameView.current}  ${nameLetters.join(``)}`, PLAY_W / 2, PLAY_H * .56, `#ff66ff`, 9, `center`);
                    for (let e = 0; e < nameView.letters.length; e++) {
                        drawText(nameView.letters[e].ch, PLAY_W / 2 - 20 + e * 20, PLAY_H * .64, nameView.letters[e].color, 16, `center`)
                    }
                }
                if (mode === `inbox`) {
                    fillRect(56, 24, 208, 360, `#001018`), ctx.strokeStyle = `#66ccff`, ctx.strokeRect(56.5, 24.5, 207, 359);
                    drawText(`INBOX`, PLAY_W / 2, 32, `#88eeff`, 12, `center`);
                    drawText(translate(`hud.inboxHint`), PLAY_W / 2, 46, `#446688`, 7, `center`);
                    if (!inbox.length) {
                        drawText(translate(`hud.inboxEmpty`), PLAY_W / 2, PLAY_H * .45, `#668888`, 8, `center`);
                        drawText(translate(`hud.inboxTap`), PLAY_W / 2, 372, `#556666`, 7, `center`);
                    } else if (inboxDetail) {
                        let e = inbox[inboxCursor];
                        if (!e) inboxDetail = !1;
                        else {
                            let rafId = buildInboxDetail(e, canReplyThanks(e));
                            drawText(rafId.header, PLAY_W / 2, 60, `#aaddff`, 9, `center`);
                            drawText(rafId.fromLine, PLAY_W / 2, 78, `#88aacc`, 8, `center`);
                            rafId.bodyLines.forEach((line, idx) => {
                                drawText(line, PLAY_W / 2, 110 + idx * 16, `#ffffff`, 10, `center`);
                            });
                            if (rafId.thanksState === `can`) {
                                fillRect(72, PLAY_H * .55, 176, 28, `#332200`), ctx.strokeStyle = `#ffcc66`, ctx.strokeRect(72.5, PLAY_H * .55 + .5, 175, 27);
                                drawText(rafId.thanksLabel, PLAY_W / 2, PLAY_H * .55 + 8, `#ffeeaa`, 9, `center`);
                            } else {
                                drawText(rafId.thanksLabel, PLAY_W / 2, PLAY_H * .55 + 8, `#889988`, 8, `center`);
                            }
                            fillRect(72, PLAY_H * .68, 176, 26, `#220011`), ctx.strokeStyle = `#ff6688`, ctx.strokeRect(72.5, PLAY_H * .68 + .5, 175, 25);
                            drawText(translate(`hud.inboxDel`), PLAY_W / 2, PLAY_H * .68 + 7, `#ff99aa`, 9, `center`);
                            fillRect(88, PLAY_H * .8, 144, 22, `#001820`), ctx.strokeStyle = `#446666`, ctx.strokeRect(88.5, PLAY_H * .8 + .5, 143, 21);
                            drawText(translate(`hud.inboxBack`), PLAY_W / 2, PLAY_H * .8 + 5, `#88aaaa`, 8, `center`);
                        }
                    } else {
                        let { rows } = buildInboxListRows({
                            messages: inbox,
                            cursor: inboxCursor,
                            canThanks: canReplyThanks
                        });
                        for (let row of rows) {
                            row.selected && fillRect(62, row.y - 2, 196, 44, `#002233`);
                            drawText(row.fromLine, 66, row.y, row.kindColor, 7);
                            drawText(row.bodyPreview, 66, row.y + 12, `#ffffff`, 9);
                            drawText(row.status, 258, row.y + 12, row.statusColor, 7, `right`);
                            drawText(row.sourceTag, 66, row.y + 26, `#445566`, 6);
                        }
                        drawText(translate(`hud.inboxList`), PLAY_W / 2, 372, `#556666`, 7, `center`);
                    }
                }
                fieldShowsHud(mode) && drawPlayHud()
            }
            if (ctx.restore(), drawSideRails(), settings.scanlines) {
                ctx.fillStyle = scanlineFill();
                for (let e = 0; e < PLAY_H; e += 2) ctx.fillRect(RAIL_W, e, FIELD_INNER_W, 1)
            }
        }
        let lastFrameMs = performance.now();

        /** requestAnimationFrame の入口。停止中は回さない。 */
        function frameLoop(now) {
            if (!running) return;
            try {
                let dt = (now - lastFrameMs) / 1e3;
                lastFrameMs = now, dt > .05 && (dt = .05), tickGame(dt), drawFrame();
            } catch (err) {
                console.error(`[swipe-force] frame`, err);
            }
            rafId = requestAnimationFrame(frameLoop)
        }
        rafId = requestAnimationFrame(frameLoop);

        /** 画面ピクセルをゲーム内座標へ。レターボックスを考慮。 */
        function pointerToGameCoords(clientX, clientY) {
            let rect = canvas.getBoundingClientRect();
            return {
                x: (clientX - rect.left) / rect.width * PLAY_W,
                y: (clientY - rect.top) / rect.height * PLAY_H
            }
        }

        /** ネームエントリの1文字を前後させる。 */
        function stepNameLetter(dir) {
            let idx = NAME_CHARSET.indexOf(nameLetters[nameCursor]);
            nameLetters[nameCursor] = NAME_CHARSET[(idx + dir + 36) % 36]
        }

        /** ショップの離し。 */
        function onShopPointerUp(x, y) {
            let act = shopPointerUp({
                x: x,
                y: y,
                left: RAIL_W,
                right: FIELD_RIGHT,
                catalogLen: shopCatalog().length,
                cursor: shopCursor
            });
            let catalog = shopCatalog();
            if (act.type === `side_opt`) { openBag(`shop`); return }
            if (act.type === `side_back`) { closeShop(); return }
            if (act.type === `header_share` || act.type === `footer_share`) { shopCursor = catalog.length + 2, shareProgress(); return }
            if (act.type === `header_opt` || act.type === `footer_opt`) { shopCursor = catalog.length + 1, openOptions(`shop`); return }
            if (act.type === `footer_go`) { shopCursor = catalog.length, closeShop(); return }
            if (act.type === `buy`) { shopCursor = act.index, buyShopItem(catalog[act.index]); return }
            if (act.type === `select`) { shopCursor = act.index, sfx.ui(); return }
            if (act.type === `empty_confirm`) confirmShopSelection()
        }

        /** ショップの決定。買うか戻るか。 */
        function confirmShopSelection() {
            let catalog = shopCatalog(),
                act = shopEmptyConfirm(shopCursor, catalog.length);
            if (act.type === `buy`) buyShopItem(catalog[act.index]);
            else if (act.type === `gameOverView`) closeShop();
            else if (act.type === `opt`) openOptions(`shop`);
            else if (act.type === `share`) shareProgress()
        }

        /** ショップカーソルの最大値。 */
        function shopCursorLimit() {
            return shopCursorMax(shopCatalog().length)
        }

        /** ショップカーソルを上下。 */
        function moveShopCursor(dir) {
            shopCursor = shopCursorStep(shopCursor, dir, shopCatalog().length), sfx.ui()
        }

        /** ショップの押し下げ。スクロール開始。 */
        function onShopPointerDown(x, y) {
            let hit = shopPointerDown({
                x: x,
                y: y,
                left: RAIL_W,
                right: FIELD_RIGHT,
                catalogLen: shopCatalog().length,
                cursor: shopCursor
            });
            if (hit.sideRail) {
                shopPaused && closeShop();
                return
            }
            shopDragOn = !0, shopDragX = x, shopDragY = y, shopDragAcc = 0, shopDragged = !1;
            if (hit.cursor != null) shopCursor = hit.cursor
        }

        /** ショップのドラッグスクロール。 */
        function onShopPointerDrag(x, y) {
            if (!shopDragOn || mode !== `shop`) return;
            let dy = y - shopDragY,
                dx = x - shopDragX;
            let scr = shopDragScroll({ dx: dx, dy: dy, accum: shopDragAcc, stepPx: 16 });
            if (scr.vertical) {
                shopDragAcc = scr.accum, shopDragY = y, shopDragX = x;
                if (scr.steps) moveShopCursor(scr.steps), shopDragged = !0;
                return
            }
            shopDragX = x, shopDragY = y
        }

        /** ショップポインタ終了の共通処理。 */
        function finishShopPointer(x, y) {
            if (shopDragOn) {
                if (shopDragOn = !1, shopDragged) {
                    shopDragged = !1;
                    return
                }
                onShopPointerUp(x, y)
            }
        }

        /** オプションの Y から行番号。 */
        function optionsRowIndexAtY(y) {
            return optionsRowAtY(y, optionRows().length, optionsCursor)
        }

        /** オプションカーソル移動。サブ画面の境界をまたがない。 */
        function stepOptionsCursor(from, dir) {
            return optionsCursorStep(optionRows(), from, dir)
        }

        /** オプションの押し下げ。 */
        function onOptionsPointerDown(x, y) {
            let down = optionsPointerDown({
                x: x,
                y: y,
                left: RAIL_W,
                right: FIELD_RIGHT,
                rowAtY: optionsRowIndexAtY,
                rowKind: (i) => optionRows()[i]?.kind
            });
            if (down.sideBack) { closeOptions(); return }
            optionsDragOn = !0, optionsDragX = x, optionsDragY = y, optionsDragAccX = 0, optionsDragAccY = 0, optionsDragged = !1;
            if (down.selectRow) optionsCursor = down.rowIndex
        }

        /** オプションのドラッグ（音量スライダ含む）。 */
        function onOptionsPointerDrag(x, y) {
            if (!optionsDragOn || mode !== `options`) return;
            let dx = x - optionsDragX,
                dy = y - optionsDragY;
            if (Math.abs(dy) > Math.abs(dx) * .85) {
                for (optionsDragAccY += dy, optionsDragX = x, optionsDragY = y; optionsDragAccY <= -15;) optionsCursor = stepOptionsCursor(optionsCursor, -1), optionsDragAccY += 15, optionsDragged = !0, sfx.ui();
                for (; optionsDragAccY >= 15;) optionsCursor = stepOptionsCursor(optionsCursor, 1), optionsDragAccY -= 15, optionsDragged = !0, sfx.ui();
                return
            }
            let row = optionRows()[optionsCursor];
            if (!row || row.kind !== `vol` && row.kind !== `sense` && row.kind !== `weapon`) {
                optionsDragX = x, optionsDragY = y;
                return
            }
            if (Math.abs(dx) < Math.abs(dy) * .7) {
                optionsDragX = x, optionsDragY = y;
                return
            }
            optionsDragAccX += dx, optionsDragX = x, optionsDragY = y;
            let stepPx = optionsSwipeStep(row.kind);
            for (; optionsDragAccX >= stepPx;) nudgeOption(1), optionsDragAccX -= stepPx, optionsDragged = !0;
            for (; optionsDragAccX <= -stepPx;) nudgeOption(-1), optionsDragAccX += stepPx, optionsDragged = !0
        }

        /** オプション行の決定。タイトルへ戻るも含む。 */
        function activateOptionRow(index) {
            let rows = optionRows();
            if (!rows.length) return;
            let idx = Math.max(0, Math.min(rows.length - 1, index));
            rows[idx].kind === `header` && (idx = stepOptionsCursor(idx, 1));
            let row = rows[idx];
            let act = optionsActivate(row);
            if (act.type === `noop`) return;
            optionsCursor = idx;
            if (act.type === `back`) { closeOptions(); return }
            if (act.type === `title`) { quitToTitle(); return }
            if (act.type === `submenu`) {
                act.key === `shot` ? (optionsSub = `shot`, optionsCursor = 1) : (optionsSub = `weapons`, optionsCursor = 1), sfx.ui();
                return
            }
            if (act.type === `toggle` || act.type === `adjust` || act.type === `locale`) {
                nudgeOption(1);
                return
            }
            if (act.type === `confirm_slider`) {
                optionsToast = `${act.label}  OK`, optionsToastLife = 40, sfx.ui();
                return
            }
        }

        /** オプションの離し。 */
        function onOptionsPointerUp(x, y) {
            if (!optionsDragOn) return;
            optionsDragOn = !1;
            let pointerUp = optionsPointerUp({
                dragged: !!optionsDragged,
                x: x,
                y: y,
                left: RAIL_W,
                right: FIELD_RIGHT,
                cursor: optionsCursor,
                rowAtY: optionsRowIndexAtY,
                rowKind: (i) => optionRows()[i]?.kind
            });
            optionsDragged = !1;
            if (pointerUp.type === `ignore`) return;
            if (pointerUp.type === `activate`) { activateOptionRow(pointerUp.cursor); return }
            if (pointerUp.type === `select`) { optionsCursor = pointerUp.cursor, sfx.ui() }
        }

        /** 仮想スティックの軸値を -1..1 に正規化する。 */
        function updateVirtualStickAxis(x, y) {
            let a = virtualStickAxis(x, y, vstickX, vstickY, 30);
            vstickAxisX = a.x, vstickAxisY = a.y
        }

        /** ポインタ押し下げの総入口。モードごとに委譲する。 */
        function onPointerDown(clientX, clientY) {
            let pos = pointerToGameCoords(clientX, clientY);
            bgm.unlock(), applyAudioSettings();
            let route = routePointerDown({
                mode: mode,
                x: pos.x,
                y: pos.y,
                left: RAIL_W,
                right: FIELD_RIGHT,
                muteHit: muteButtonHit(pos.x, pos.y)
            });
            if (route.type === `mute`) {
                mutedFlag = bgm.toggleMute(), settings.muted = mutedFlag, persistSettings(), mutedFlag || (mode === `bossintro` || mode === `playing` && bossActive ? bgm.boss(bossForStage(stage).vibe, stage) : (mode === `playing` || mode === `ready`) && bgm.start(`play`, stage)), sfx.ui();
                return
            }
            if (route.type === `mode` && route.mode === `attract`) { handleAttractTap(pos.x, pos.y); return }
            if (route.type === `mode` && route.mode === `changelog`) { onChangelogTap(pos.x, pos.y); return }
            if (route.type === `mode` && route.mode === `soundtest`) { onSoundTestPointerDown(pos.x, pos.y); return }
            if (route.type === `mode` && route.mode === `options`) { onOptionsPointerDown(pos.x, pos.y); return }
            if (route.type === `mode` && route.mode === `shop`) { onShopPointerDown(pos.x, pos.y); return }
            if (route.type === `mode` && route.mode === `bag`) {
                if (pos.x < RAIL_W || pos.x > FIELD_RIGHT) { closeBag(); return }
                let rows = bagRows();
                let win = listWindowStart(rows.length, bagCursor, 12);
                for (let i = 0; i < Math.min(12, rows.length); i++) {
                    let idx = i + win, y = 50 + i * 24;
                    if (pos.y >= y - 1 && pos.y < y + 23) {
                        if (bagCursor === idx) useBagRow(rows[idx]);
                        else bagCursor = idx, sfx.ui();
                        return
                    }
                }
                // empty confirm
                useBagRow(rows[bagCursor]);
                return
            }
            if (route.type === `mode` && route.mode === `stageselect`) {
                if (pos.x < RAIL_W || pos.x > FIELD_RIGHT) { mode = `bag`, sfx.ui(); return }
                let maxS = maxClearedForDiff();
                let rows = buildStageSelectRows(maxS);
                let win = listWindowStart(rows.length, stageSelectCursor, 12);
                for (let i = 0; i < Math.min(12, rows.length); i++) {
                    let idx = i + win, y = 52 + i * 24;
                    if (pos.y >= y - 1 && pos.y < y + 23) {
                        if (stageSelectCursor === idx) confirmStageSelect();
                        else stageSelectCursor = idx, sfx.ui();
                        return
                    }
                }
                confirmStageSelect();
                return
            }
            if (route.type === `mode` && route.mode === `gameover`) {
                let hit = gameOverHit(pos.x, pos.y, RAIL_W, FIELD_RIGHT);
                if (hit === `side_share` || hit === `share`) { shareProgress(), refreshCoins(); return }
                if (hit === `side_title` || hit === `title`) { quitToTitle(); return }
                if (hit === `continue`) {
                    tutorialRun || difficulty === `tutorial` || continueCoins > 0
                        ? doContinue()
                        : (sfx.buyFail(), tryOpenMediaWatch(), shareToast = translate(`hud.noCoin`), shareToastLife = 100);
                    return
                }
                return
            }
            if (route.type === `mode` && route.mode === `name`) {
                let hit = nameEntryHit(pos.x, PLAY_W, RAIL_W, FIELD_RIGHT);
                if (hit === `side_back`) { mode = `attract`, bgm.start(`attract`), sfx.ui(); return }
                if (hit === `letter_prev`) stepNameLetter(-1);
                else if (hit === `letter_next`) stepNameLetter(1);
                else nameCursor++, nameCursor >= 3 && (mode = `attract`, bgm.start(`attract`));
                return
            }
            if (route.type === `mode` && route.mode === `inbox`) {
                let hit = inboxPointerHit({
                    x: pos.x,
                    y: pos.y,
                    left: RAIL_W,
                    right: FIELD_RIGHT,
                    fieldH: PLAY_H,
                    messageCount: inbox.length,
                    detailOpen: !!inboxDetail,
                    cursor: inboxCursor
                });
                if (hit.type === `side_title` || hit.type === `empty_title` || hit.type === `list_back`) {
                    mode = `attract`, bgm.start(`attract`), sfx.ui();
                    return
                }
                if (hit.type === `open`) { inboxCursor = hit.index, inboxDetail = !0, sfx.ui(); return }
                if (hit.type === `thanks`) {
                    let clientX = inbox[inboxCursor];
                    if (!clientX) { inboxDetail = !1; return }
                    canReplyThanks(clientX) ? openThanks(clientX) : sfx.buyFail();
                    return
                }
                if (hit.type === `delete`) {
                    let clientX = inbox[inboxCursor];
                    if (!clientX) { inboxDetail = !1; return }
                    deleteInboxMessage({ playerId: playerId, messageId: clientX.id }).then(() => { reloadInbox(), inboxDetail = !1, sfx.ui() });
                    return
                }
                if (hit.type === `to_list`) { inboxDetail = !1, sfx.ui(); return }
                if (hit.type === `clear_detail`) { inboxDetail = !1; return }
                return
            }
            if (route.type === `play_side`) {
                let slot = route.slot != null ? route.slot : (route.upper ? 0 : 2);
                // left: shop / bag / opt · right: opt / bag / shop
                let act =
                    slot === 1
                        ? `bag`
                        : route.left
                          ? slot === 0
                            ? `shop`
                            : `options`
                          : slot === 0
                            ? `options`
                            : `shop`;
                if (act === `bag`) openBag(`play`);
                else if (act === `shop`) openShop(!0);
                else openOptions(`play`);
                return
            }
            if (route.type === `play_move`) {
                let moveResult = playMoveFromPointer({ x: pos.x, y: pos.y, vstick: !!settings.vstick });
                if (moveResult.vstick) vstickActive = !0, vstickX = moveResult.stickX, vstickY = moveResult.stickY, vstickAxisX = 0, vstickAxisY = 0;
                else swipeActive = !0, swipeX = moveResult.followX, swipeY = moveResult.followY
            }
        }

        /** ポインタ移動。スワイプ追従はここ。座標の再代入に注意（TDZ禁止）。 */
        function onPointerMove(clientX, clientY) {
            let route = routePointerMove({
                mode: mode,
                optionsDragging: !!optionsDragOn,
                shopDragging: !!shopDragOn,
                soundtestDragging: !!soundDragOn,
                changelogDragging: !!changelogDragOn,
                vstickEnabled: !!settings.vstick,
                vstickActive: !!vstickActive,
                swipeActive: !!swipeActive
            });
            let pos = pointerToGameCoords(clientX, clientY);
            if (route.type === `options_drag`) { onOptionsPointerDrag(pos.x, pos.y); return }
            if (route.type === `shop_drag`) { onShopPointerDrag(pos.x, pos.y); return }
            if (route.type === `soundtest_drag`) { onSoundTestPointerDrag(pos.x, pos.y); return }
            if (route.type === `changelog_drag`) { onChangelogDrag(pos.x, pos.y); return }
            if (route.type === `vstick`) { updateVirtualStickAxis(pos.x, pos.y); return }
            if (route.type === `swipe_follow`) {
                let follow = clampSwipeFollow(pos.x, pos.y);
                swipeX = follow.x, swipeY = follow.y
            }
        }
        let onTouchStart = e => {
                e.preventDefault(), onPointerDown(e.touches[0].clientX, e.touches[0].clientY)
            },
            onTouchMove = e => {
                e.preventDefault(), onPointerMove(e.touches[0].clientX, e.touches[0].clientY)
            },
            onTouchEnd = e => {
                if (e.preventDefault(), mode === `options` && optionsDragOn) {
                    let t = e.changedTouches[0];
                    if (t) {
                        let e = pointerToGameCoords(t.clientX, t.clientY);
                        onOptionsPointerUp(e.x, e.y)
                    } else onOptionsPointerUp(optionsDragX, optionsDragY);
                    return
                }
                if (mode === `shop` && shopDragOn) {
                    let t = e.changedTouches[0];
                    if (t) {
                        let e = pointerToGameCoords(t.clientX, t.clientY);
                        finishShopPointer(e.x, e.y)
                    } else finishShopPointer(shopDragX, shopDragY);
                    return
                }
                if (mode === `soundtest` && soundDragOn) {
                    let t = e.changedTouches[0];
                    if (t) {
                        let e = pointerToGameCoords(t.clientX, t.clientY);
                        onSoundTestPointerUp(e.x, e.y)
                    } else onSoundTestPointerUp(58, soundDragY);
                    return
                }
                if (mode === `changelog` && changelogDragOn) {
                    let t = e.changedTouches[0];
                    if (t) {
                        let e = pointerToGameCoords(t.clientX, t.clientY);
                        onChangelogPointerUp(e.x, e.y)
                    } else onChangelogPointerUp(58, changelogDragY);
                    return
                }
                swipeActive = !1, clearInput()
            },
            onMouseDown = e => onPointerDown(e.clientX, e.clientY),
            onMouseMove = e => onPointerMove(e.clientX, e.clientY),
            onMouseUp = e => {
                if (mode === `options` && optionsDragOn) {
                    let t = pointerToGameCoords(e.clientX, e.clientY);
                    onOptionsPointerUp(t.x, t.y);
                    return
                }
                if (mode === `shop` && shopDragOn) {
                    let t = pointerToGameCoords(e.clientX, e.clientY);
                    finishShopPointer(t.x, t.y);
                    return
                }
                if (mode === `soundtest` && soundDragOn) {
                    let t = pointerToGameCoords(e.clientX, e.clientY);
                    onSoundTestPointerUp(t.x, t.y);
                    return
                }
                if (mode === `changelog` && changelogDragOn) {
                    let t = pointerToGameCoords(e.clientX, e.clientY);
                    onChangelogPointerUp(t.x, t.y);
                    return
                }
                swipeActive = !1, clearInput()
            },
            onKeyDown = e => {
                keysDown.add(e.key), bgm.unlock();
                let act = resolveKeyAction({
                    key: e.key,
                    mode: mode,
                    soundSub: soundListMode,
                    shopPaused: !!shopPaused
                });
                if (act.type === `mute_toggle`) {
                    mutedFlag = bgm.toggleMute(), settings.muted = mutedFlag, persistSettings(), mutedFlag || (mode === `shop` || mode === `attract` || mode === `options` ? bgm.start(`attract`) : mode === `playing` && bossActive ? bgm.boss(bossForStage(stage).vibe, stage) : (mode === `playing` || mode === `ready`) && bgm.start(`play`, stage));
                    return
                }
                if (mode === `options`) {
                    if (act.type === `options_up`) optionsCursor = stepOptionsCursor(optionsCursor, -1), sfx.ui();
                    else if (act.type === `options_down`) optionsCursor = stepOptionsCursor(optionsCursor, 1), sfx.ui();
                    else if (act.type === `options_left`) nudgeOption(-1);
                    else if (act.type === `options_right`) nudgeOption(1);
                    else if (act.type === `options_confirm`) {
                        let t = optionRows();
                        let row = t[optionsCursor];
                        if (row?.kind === `back`) closeOptions();
                        else if (row?.kind === `title`) quitToTitle();
                        else nudgeOption(1)
                    } else if (act.type === `options_back`) closeOptions();
                    return
                }
                if (mode === `soundtest`) {
                    if (soundListMode === `comments`) {
                        if (act.type === `st_comments_up`) commentCursor = Math.max(0, commentCursor - 1), sfx.ui();
                        else if (act.type === `st_comments_down`) commentCursor = Math.min(Math.max(0, comments.length - 1), commentCursor + 1), sfx.ui();
                        else if (act.type === `st_comments_write`) writeComment();
                        else if (act.type === `st_comments_back`) leaveComments();
                        else if (act.type === `st_like`) voteTrack(1);
                        else if (act.type === `st_dislike`) voteTrack(-1);
                        return
                    }
                    let t = soundListMode === `menu` ? soundTestMenuRows().length - 1 : soundTestListRows(soundListMode).length - 1;
                    if (act.type === `st_up`) soundCursor = Math.max(0, soundCursor - 1), sfx.ui();
                    else if (act.type === `st_down`) soundCursor = Math.min(t, soundCursor + 1), sfx.ui();
                    else if (act.type === `st_confirm`) activateSoundTestRow();
                    else if (act.type === `st_comments_open`) openComments();
                    else if (act.type === `st_like`) voteTrack(1);
                    else if (act.type === `st_dislike`) voteTrack(-1);
                    else if (act.type === `st_escape`) soundListMode === `menu` ? leaveSoundTest() : (soundListMode = `menu`, soundCursor = 0);
                    return
                }
                if (mode === `attract`) {
                    let adminMenu = !!(account.linked && isPromoAdminPlayer(playerId));
                    let menuLen = titleMenuLen(titleSub, { isPromoAdmin: adminMenu });
                    if (act.type === `attract_up`) titleCursor = (titleCursor + menuLen - 1) % menuLen, sfx.select();
                    else if (act.type === `attract_down`) titleCursor = (titleCursor + 1) % menuLen, sfx.select();
                    else if (act.type === `attract_back`) {
                        // one level up: extra/diff → root
                        if (titleSub === `extra`) {
                            titleSub = `root`, titleCursor = 4, sfx.ui();
                        } else if (titleSub === `diff`) {
                            titleSub = `root`, titleCursor = 0, sfx.ui();
                        } else {
                            // root: ignore (stay on title)
                        }
                    } else if (act.type === `attract_confirm`) {
                        if (titleSub === `extra`) {
                            if (titleCursor === 0) openSoundTest();
                            else if (titleCursor === 1) (typeof window.__sfOpenProfile === `function` ? window.__sfOpenProfile() : 0);
                            else if (titleCursor === 2) (typeof window.__sfOpenStats === `function` ? window.__sfOpenStats() : 0);
                            else if (titleCursor === 3) openBag(`attract`);
                            else if (titleCursor === 4) tryOpenMediaWatch();
                            else if (titleCursor === 5) tryOpenPartnerPortal();
                            else if (adminMenu && titleCursor === 6) tryOpenPromoAdmin();
                            else titleSub = `root`, titleCursor = 4, sfx.ui();
                        } else if (titleSub === `diff`) {
                            if (titleCursor === 0) tutorialRun = !1, unmountTutorialDock(), difficulty = `easy`, startRun();
                            else if (titleCursor === 1) tutorialRun = !1, unmountTutorialDock(), difficulty = `normal`, startRun();
                            else titleSub = `root`, titleCursor = 0, sfx.ui();
                        } else if (titleCursor === 0) titleSub = `diff`, titleCursor = difficulty === `normal` ? 1 : 0, sfx.ui();
                        else if (titleCursor === 1) shareProgress();
                        else if (titleCursor === 2) sharerId && canSendFanmail() ? openFanmail() : openInbox();
                        else if (titleCursor === 3) openOptions(`attract`);
                        else if (titleCursor === 4) titleSub = `extra`, titleCursor = 0, sfx.ui();
                        else if (titleCursor === 5) openChangelog();
                        else sfx.ui()
                    }
                    return
                }
                if (mode === `changelog`) {
                    if (act.type === `changelog_up`) changelogScroll = Math.max(0, changelogScroll - 1), sfx.ui();
                    else if (act.type === `changelog_down`) changelogScroll = Math.min(getChangelogMaxScroll(), changelogScroll + 1), sfx.ui();
                    else if (act.type === `changelog_back`) leaveChangelog();
                    return
                }
                if (mode === `inbox`) {
                    if (act.type === `inbox_escape`) {
                        inboxDetail ? inboxDetail = !1 : (mode = `attract`, bgm.start(`attract`));
                        return
                    }
                    if (act.type === `inbox_up` && !inboxDetail && inbox.length) inboxCursor = (inboxCursor - 1 + inbox.length) % inbox.length, sfx.ui();
                    if (act.type === `inbox_down` && !inboxDetail && inbox.length) inboxCursor = (inboxCursor + 1) % inbox.length, sfx.ui();
                    if (act.type === `inbox_confirm`) {
                        if (!inboxDetail && inbox.length) inboxDetail = !0;
                        else if (inboxDetail) {
                            let e = inbox[inboxCursor];
                            canReplyThanks(e) && openThanks(e)
                        }
                        return
                    }
                    if (act.type === `inbox_delete` && inboxDetail) {
                        let e = inbox[inboxCursor];
                        e && deleteInboxMessage({ playerId: playerId, messageId: e.id }).then(() => { reloadInbox(), inboxDetail = !1 });
                        return
                    }
                    return
                }
                if (mode === `gameover`) {
                    if (act.type === `gameover_continue_or_share`) {
                        continueCoins > 0 || tutorialRun || difficulty === `tutorial` ? doContinue() : tryOpenMediaWatch();
                        return
                    }
                    if (act.type === `gameover_share`) { shareProgress(); return }
                    if (act.type === `gameover_title`) { quitToTitle(); return }
                }
                if (act.type === `pause_shop`) {
                    e.preventDefault(), openShop(!0);
                    return
                }
                if (act.type === `open_options_play`) {
                    e.preventDefault(), openOptions(`play`);
                    return
                }
                if (act.type === `open_bag_play`) {
                    e.preventDefault(), openBag(mode === `shop` ? `shop` : `play`);
                    return
                }
                if (mode === `shop`) {
                    let t = shopCatalog(),
                        n = t.length + 2;
                    if (act.type === `shop_up`) shopCursor = (shopCursor + n) % (n + 1);
                    else if (act.type === `shop_down`) shopCursor = (shopCursor + 1) % (n + 1);
                    else if (act.type === `shop_confirm`) {
                        shopCursor === t.length ? closeShop() : shopCursor === t.length + 1 ? openOptions(`shop`) : shopCursor === t.length + 2 ? shareProgress() : buyShopItem(t[shopCursor])
                    } else if (act.type === `shop_escape`) shopPaused && closeShop()
                    return
                }
                if (mode === `bag`) {
                    let rows = bagRows();
                    if (act.type === `bag_up`) bagCursor = (bagCursor + rows.length - 1) % rows.length, sfx.ui();
                    else if (act.type === `bag_down`) bagCursor = (bagCursor + 1) % rows.length, sfx.ui();
                    else if (act.type === `bag_confirm`) useBagRow(rows[bagCursor]);
                    else if (act.type === `bag_back`) closeBag();
                    return
                }
                if (mode === `stageselect`) {
                    let maxS = maxClearedForDiff();
                    let rows = buildStageSelectRows(maxS);
                    if (act.type === `stage_up`) stageSelectCursor = (stageSelectCursor + rows.length - 1) % rows.length, sfx.ui();
                    else if (act.type === `stage_down`) stageSelectCursor = (stageSelectCursor + 1) % rows.length, sfx.ui();
                    else if (act.type === `stage_confirm`) confirmStageSelect();
                    else if (act.type === `stage_back`) mode = `bag`, sfx.ui();
                    return
                }
            },
            onKeyUp = e => {
                keysDown.delete(e.key)
            };
        return canvas.addEventListener(`touchstart`, onTouchStart, {
            passive: !1
        }), canvas.addEventListener(`touchmove`, onTouchMove, {
            passive: !1
        }), canvas.addEventListener(`touchend`, onTouchEnd, {
            passive: !1
        }), canvas.addEventListener(`mousedown`, onMouseDown), window.addEventListener(`mousemove`, onMouseMove), window.addEventListener(`mouseup`, onMouseUp), window.addEventListener(`keydown`, onKeyDown), window.addEventListener(`keyup`, onKeyUp), window.__sfOpenProfile = function() {
              try {
                openProfileDialog({
                  linked: !!(account && account.linked),
                  playerId: playerId || "",
                  sfxUi: function(){ try{sfx.ui()}catch(e){} },
                  sfxOk: function(){ try{sfx.buy()}catch(e){} },
                  sfxFail: function(){ try{sfx.buyFail()}catch(e){} },
                  onNeedLink: function(){ try{openAccount()}catch(e){} }
                });
              } catch (err) { console.error(err); }
            }, window.__sfOpenStats = function() {
              try {
                openStatsDialog({
                  playerId: playerId || "",
                  linked: !!(account && account.linked),
                  sfxUi: function(){ try{sfx.ui()}catch(e){} }
                });
              } catch (err) { console.error(err); }
            }, window.__sfOpenPromoAdmin = function() {
              try {
                tryOpenPromoAdmin();
              } catch (err) { console.error(err); }
            }, window.__sfSpectatorGetFrame = function() {
              try {
                return {
                  v: 1,
                  mode: mode,
                  stage: stage,
                  score: score,
                  pts: pts,
                  lives: lives,
                  player: { x: player.x, y: player.y, invuln: (invuln|0) > 0 },
                  enemies: (enemies || []).slice(0, 40).map(function(e) {
                    return {
                      id: e.id|0, x: e.x, y: e.y, w: e.w||12, h: e.h||12,
                      hp: e.hp|0, maxHp: e.maxHp|0, boss: !!e.boss, type: e.type|0
                    };
                  }),
                  bullets: (bullets || []).slice(0, 80).map(function(b) {
                    return {
                      x: b.x, y: b.y, w: b.w||2, h: b.h||4,
                      from: b.from === "e" ? "e" : "p",
                      kind: String(b.kind || "normal")
                    };
                  }),
                  bossName: bossName || "",
                  bossActive: !!bossActive,
                  shake: shake|0,
                  difficulty: difficulty || "easy"
                };
              } catch (err) { return null; }
            }, window.__swipeForceTest = {
            mode: () => mode,
            start: () => startRun(),
            openShop: () => openShop(!0),
            openOptions: () => openOptions(`shop`),
            openBag: () => openBag(`attract`),
            openBagPlay: () => openBag(`play`),
            openSoundTest: () => openSoundTest(),
            setLinked: (v) => { account.linked = !!v; },
            playerPos: () => ({ x: player.x, y: player.y }),
            pressKeys: (arr) => {
                try {
                    for (const k of arr || []) keysDown.add(k);
                } catch {}
            },
            releaseKeys: () => { try { keysDown.clear() } catch {} },
            bag: () => ({ ...bagStock }),
            maxCleared: () => maxClearedForDiff(),
            readStatsProbe: () => {
                try { return readStats(); } catch (e) { return { err: String(e) }; }
            },
            setVstick: e => {
                settings.vstick = e, persistSettings()
            },
            playerId: () => playerId,
            coins: () => continueCoins,
            setCoins: e => {
                continueCoins = Math.max(0, e | 0)
            },
            setRef: (e, t) => {
                let n = e ? e.replace(/[^a-z0-9]/gi, ``).slice(0, 32) : null,
                    r = t ? t.replace(/[^a-z0-9]/gi, ``).slice(0, 32) : null;
                n && n !== playerId && r && r.length >= 4 ? (sharerId = n, shareId = r) : (sharerId = null, shareId = null), reloadMissions()
            },
            award: () => missionFirstBoss(),
            missions: () => missionsDone,
            openFanmail: () => openFanmail(),
            openInbox: () => openInbox(),
            share: () => shareProgress()
        }, bgm.start(`attract`), () => {
            running = !1; try { delete window.__sfSpectatorGetFrame } catch {}; try { titleBannerDom && titleBannerDom.destroy() } catch {}; cancelAnimationFrame(rafId), resizeObserver.disconnect(), window.removeEventListener(`resize`, layoutCanvas), window.removeEventListener(`orientationchange`, layoutCanvas), window.removeEventListener(`pageshow`, layoutCanvas); try { window.visualViewport && window.visualViewport.removeEventListener(`resize`, layoutCanvas); } catch {}; canvas.removeEventListener(`touchstart`, onTouchStart), canvas.removeEventListener(`touchmove`, onTouchMove), canvas.removeEventListener(`touchend`, onTouchEnd), canvas.removeEventListener(`mousedown`, onMouseDown), window.removeEventListener(`mousemove`, onMouseMove), window.removeEventListener(`mouseup`, onMouseUp), window.removeEventListener(`keydown`, onKeyDown), window.removeEventListener(`keyup`, onKeyUp), bgm.stop()
        }
    }, []), (0, jsxRuntime.jsx)(`div`, {
        ref: hostRef,
        className: `flex h-dvh w-full items-center justify-center bg-black`,
        style: {
            touchAction: `none`
        },
        children: (0, jsxRuntime.jsx)(`canvas`, {
            ref: canvasRef,
            width: PLAY_W,
            height: PLAY_H,
            className: `block max-h-full max-w-full shrink-0`,
            style: {
                aspectRatio: `${PLAY_W} / ${PLAY_H}`,
                width: `min(100vw, calc(100dvh * ${PLAY_W} / ${PLAY_H}))`,
                height: `auto`,
                background: `#001100`,
            }
        })
    })
}

/** エンジンをホスト要素に載せる薄いラッパ。 */
function SwipeForceGameRoot() {
    return (0, jsxRuntime.jsx)(SwipeForceEngine, {})
}

/** ルートから載せる公開エントリ。 */
export function SwipeForceGameCanvas() {
  return SwipeForceGameRoot();
}
export { SwipeForceEngine as SwipeForceEngineRoot, SwipeForceGameRoot };

