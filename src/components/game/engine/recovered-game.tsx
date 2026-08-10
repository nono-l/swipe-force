// @ts-nocheck
/**
 * Recovered canvas game loop (production bundle decompiled).
 * Readable renames applied — behavior preserved.
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

// Auth bindings (readable names; openAccountDialog may still expect short aliases via props)
const authProviders = GROK_PROVIDERS;
const authSignIn = signIn;
const authSignOut = signOut;
const authGetBearer = getBearerToken;

/*
  MODE / HANDLER MAP
  -----------------------------------
  startRun / openShop / openOptions
  openSoundTest / openChangelog / openAccount
  shareProgress / openInbox / openFanmail
  tickGame / resetRun / startStage
  state: mode, score, pts, lives, stage, titleCursor
*/

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
            accountBusy = !1;
        async function refreshAccount(e = !1) {
            try {
                const acc = e ? await linkAccountPost() : await fetchAccountGet();
                account = {
                    linked: !!acc.linked,
                    playerId: acc.playerId || loadPlayerId(),
                    name: acc.name ?? null,
                    email: acc.email ?? null,
                    image: acc.image ?? null
                };
                playerId = account.linked && account.playerId ? account.playerId : loadPlayerId();
                continueCoins = loadContinueCoins(playerId);
                reloadInbox();
                refreshCoins();
                sfx.ui();
                return account;
            } catch (err) {
                console.warn("[SWIPE FORCE] account refresh failed", err);
                return account;
            }
        }
        refreshAccount(!1);
        let shareParams = parseShareParams(),
            sharerId = shareParams.ref,
            shareId = shareParams.sid;
        sharerId && sharerId === playerId && (sharerId = null, shareId = null), (!sharerId || !shareId) && (sharerId = null, shareId = null);
        let continueCoins = loadContinueCoins(playerId),
            runStartedAt = 0,
            firstBossFlagged = !1,
            shareToast = ``,
            shareToastLife = 0,
            continueBusy = !1,
            missionBannerLife = 0,
            missionToast = ``,
            missionToastLife = 0,
            missionsDone = shareId ? loadMissionsDone(shareId) : {};

        function reloadMissions() {
            missionsDone = shareId ? loadMissionsDone(shareId) : {}
        }

        function allMissionsClear() {
            return !!shareId && allMissionsDoneFor(shareId)
        }

        function canSendFanmail() {
            return !!sharerId && !!shareId && canSendFanmailTo(shareId, sharerId, playerId)
        }

        function alreadySentFanmail() {
            return !!shareId && alreadySentFanmailTo(shareId, playerId)
        }
        let inbox = [],
            inboxCursor = 0,
            inboxDetail = !1;

        function reloadInbox() {
            fetchInboxMessages(playerId).then(e => {
                inbox = e, inboxCursor >= inbox.length && (inboxCursor = Math.max(0, inbox.length - 1))
            })
        }
        reloadInbox();
        let mailBusy = !1;

        function openThanks(e) {
            if (!canReplyThanks(e)) {
                sfx.buyFail(), shareToast = thanksBlockedMessage(e), shareToastLife = 80;
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
                    messageId: e.id,
                    text
                }),
                onClose: () => { closeMailDialog() },
                onSent: () => { reloadInbox(), syncAccountCloud() },
                playOk: () => sfx.buy(),
                playError: () => sfx.buyFail(),
                playUi: () => sfx.ui()
            })
        }

        function refreshCoins() {
            fetchCoinBalance(playerId).then(e => {
                continueCoins = e
            })
        }
        refreshCoins();
        let settings = mergeSettingsFromStorage(localStorage.getItem(SETTINGS_KEY));

        function applyAudioSettings() {
            bgm.setMasterVol(settings.master / 10), bgm.setBgmVol(settings.bgm / 10), bgm.setSfxVol(settings.sfx / 10), bgm.setMuted(settings.muted), mutedFlag = settings.muted
        }

        function persistSettings() {
            try {
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
            } catch {}
            applyAudioSettings()
        }
        applyAudioSettings();

        function weaponLevelCap(e) {
            return ownedLevel(e, upgrades)
        }

        function loadHighScore(e) {
            return weaponLevelCap(e) > 0
        }

        function armedLevelOf(e) {
            return armedLevel(e, upgrades, settings.wepLv)
        }

        function isWeaponArmed(e) {
            return isArmed(e, upgrades, settings.wepLv)
        }

        function armedWeaponCount() {
            return countArmedWeapons(LOADOUT_COUNT_KEYS, upgrades, settings.wepLv)
        }

        function loadoutSummaryText() {
            return formatLoadoutSummary(armedWeaponCount());
        }

        function shotSubSummaryText() {
            const detailOn = SHOT_SUMMARY_KEYS.filter(e => isWeaponArmed(e)).length;
            return formatShotSubSummary({
                shotOn: isWeaponArmed(`shot`),
                optionOn: isWeaponArmed(`option`),
                detailOnCount: detailOn,
            });
        }

        function optionRows() {
            return buildOptionRows(optionsSub, loadHighScore);
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
        for (let e = 0; e < 48; e++) stars.push({
            x: RAIL_W + Math.random() * FIELD_INNER_W,
            y: Math.random() * PLAY_H,
            s: 1 + e % 2,
            speed: .4 + e % 5 * .25
        });
        let swipeActive = !1,
            swipeX = player.x,
            swipeY = player.y,
            vstickActive = !1,
            vstickX = 88,
            vstickY = 348,
            vstickAxisX = 0,
            vstickAxisY = 0,
            keysDown = new Set;

        function clearInput() {
            vstickActive = !1, vstickAxisX = 0, vstickAxisY = 0
        }

        function layoutCanvas() {
            let rect = hostEl.getBoundingClientRect(),
                scale = Math.min(rect.width / PLAY_W, rect.height / PLAY_H),
                dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.style.width = `${Math.floor(PLAY_W*scale)}px`, canvas.style.height = `${Math.floor(PLAY_H*scale)}px`;
            let px = Math.max(1, Math.floor(scale * dpr));
            canvas.width = PLAY_W * px, canvas.height = PLAY_H * px, ctx.setTransform(px, 0, 0, px, 0, 0), ctx.imageSmoothingEnabled = !1
        }
        layoutCanvas();
        let resizeObserver = new ResizeObserver(layoutCanvas);
        resizeObserver.observe(hostEl);

        function tier2Unlocked() {
            return upgrades.shot >= 3 && upgrades.rate >= 3 && upgrades.speed >= 3 && upgrades.power >= 3 && upgrades.option >= 2
        }

        function tier3Unlocked() {
            return upgrades.lockon >= 3 && upgrades.missile >= 3 && upgrades.particle >= 3
        }

        function currentShopTier() {
            return shopUnlockTier(!!account.linked, tier3Unlocked(), tier2Unlocked());
        }

        function itemMaxOf(e) {
            return shopItemMax(e, !!account.linked, LINKED_ITEM_IDS);
        }

        function shopCatalog() {
            return filterShopCatalog(SHOP_ITEMS, currentShopTier(), !!account.linked);
        }

        function shopListWindow(e, t) {
            return listWindowStart(e.length, shopCursor, t)
        }

        function saveHighScore() {
            return scoreHpThresholds();
        }

        function scoreHpMult() {
            return enemyHpMultiplier(score);
        }

        function enemyHpScale() {
            return totalHpScale(difficulty, score)
        }

        function normalCostMult(e) {
            return normalCostScale(e, difficulty);
        }

        function itemCostOf(e) {
            return shopItemCost(e, upgrades, difficulty);
        }

        function canBuyItem(e) {
            return e.consumable ? e.id === `life` && lives >= 5 || e.id === `shield` && shield > 0 ? !1 : pts >= itemCostOf(e) : (e.linkOnly || e.tier >= 4) && !account.linked || upgrades[e.id] >= itemMaxOf(e) ? !1 : pts >= itemCostOf(e)
        }

        function syncEasyCarry() {
            if (difficulty === `easy`) {
                try {
                    localStorage.setItem(EASY_UP_KEY, serializeEasyCarry(upgrades))
                } catch {}
                syncAccountCloud()
            }
        }

        function loadEasyCarryState() {
            try {
                return loadEasyCarry(localStorage.getItem(EASY_UP_KEY), DEFAULT_UPGRADES)
            } catch {
                return { ...DEFAULT_UPGRADES }
            }
        }

        function easyCarryLevelOf(e) {
            return Object.keys(DEFAULT_UPGRADES).reduce((t, n) => t + e[n], 0)
        }

        function buyShopItem(e) {
            let before = { ...upgrades };
            let result = applyShopPurchase({
                item: e,
                cost: itemCostOf(e),
                pts: pts,
                lives: lives,
                shieldFrames: shield,
                upgrades: upgrades,
                maxLevel: itemMaxOf(e),
                canBuy: canBuyItem(e),
                difficulty: difficulty,
                wepLv: settings.wepLv,
                wepCap: weaponLevelCap
            }, {
                tier2Ready: false,
                tier3Ready: false,
                linkedSpecial: false
            });
            if (!result.ok) {
                shopToast = `PTS不足 / MAX`, shopToastLife = 60, sfx.buyFail();
                return
            }
            pts = result.pts, lives = result.lives, shield = result.shieldFrames, upgrades = result.upgrades;
            if (result.wepLvChanged) {
                settings.wepLv = result.wepLv, persistSettings()
            }
            if (e.id !== `life` && e.id !== `shield`) syncEasyCarry();
            sfx.buy(), shopToast = result.message, shopToastLife = 50;
            // celebrate after state applied (match original)
            if (tier2Unlocked() || tier3Unlocked() || account.linked && (upgrades.beam > 0 || upgrades.flame > 0)) celebrate = 90
        }

        
        // ── reset run state ──
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
        function startStage() {
            let seed = buildStageSeed(stage);
            kills = seed.kills, killsForBoss = seed.killTarget, bossActive = seed.bossActive, bossName = seed.bossName;
            spawnTimer = seed.spawnTimer, shotTimer = seed.shotCd, missileTimer = seed.missileCd, particleTimer = seed.particleCd, lockonTimer = seed.lockonCd;
            bullets.length = 0, enemies.length = 0, lockBeams.length = 0;
            mode = seed.mode, readyTimer = seed.readyFrames, invuln = seed.invulnFrames;
            clearInput(), bgm.start(`play`, stage)
        }

        
        // ── open shop ──
        function openShop(e = !1) {
            let seed = openShopSeed(!!e);
            mode = seed.mode, shopPaused = seed.paused, shopCursor = seed.cursor, shopToast = seed.toast, shopToastLife = seed.toastLife;
            swipeActive = !1, clearInput();
            if (seed.clearEntities) bullets.length = 0, enemies.length = 0, lockBeams.length = 0;
            sfx.ui(), bgm.start(`attract`)
        }

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
        function openOptions(e) {
            let seed = openOptionsSeed(e);
            optionsFrom = seed.from, mode = seed.mode, optionsSub = seed.submenu, optionsCursor = seed.cursor;
            optionsToast = ``, optionsToastLife = 0, swipeActive = !1, clearInput(), sfx.ui(), bgm.start(`attract`)
        }

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

        function nudgeOptionFromMenu(e) {
            return formatVolumeBar(e);
        }

        function formatOptionValueForRow(e) {
            return formatOptionValue(e, {
                options: settings,
                armedLevel: armedLevelOf,
                maxLevel: weaponLevelCap,
                loadoutSummary: loadoutSummaryText(),
                shotSummary: shotSubSummaryText(),
            });
        }

        function nudgeOption(e) {
            let t = optionRows();
            (optionsCursor < 0 || optionsCursor >= t.length) && (optionsCursor = 0);
            let n = t[optionsCursor];
            let res = applyOptionDelta({
                row: n,
                delta: e,
                settings: settings,
                maxArmed: (key) => weaponLevelCap(key),
                currentArmed: (key) => armedLevelOf(key),
                weaponsEnabledCount: armedWeaponCount()
            });
            if (res.type === `noop`) return;
            if (res.type === `back`) { closeOptions(); return }
            if (res.type === `navigate_shot`) { optionsSub = `shot`, optionsCursor = 1, sfx.ui(); return }
            if (res.type === `navigate_weapons`) { optionsSub = `weapons`, optionsCursor = 1, sfx.ui(); return }
            if (res.type === `applied`) {
                settings = res.settings;
                if (res.clearVstick) clearInput();
                if (n.kind === `weapon`) {
                    let feedback = dodgeOnlyFeedback(armedWeaponCount(), res.feedback);
                    optionsToast = feedback || res.feedback || ``, optionsToastLife = res.feedbackLife || 55
                }
                persistSettings();
                if (res.replayAttractIfUnmuted && !settings.muted) bgm.start(`attract`);
                sfx.ui()
            }
        }

        function spawnBurst(e, t, n, r = 14) {
            for (let mode of buildBurstParticles(e, t, n, r)) fxParticles.push(mode)
        }

        function findEnemyById(e) {
            return enemies.find(t => t.id === e)
        }

        function nearestEnemies(e) {
            return pickNearestEnemies(enemies, player.x, player.y, e)
        }

        function damageEnemy(e, t, n, r) {
            let out = applyEnemyDamage(e, t, n, r);
            sfx.hit();
            if (out.type === `survive`) {
                spawnBurst(out.spark.x, out.spark.y, out.spark.color, out.spark.count);
                return
            }
            spawnBurst(out.burst.x, out.burst.y, out.burst.color, out.burst.count);
            sfx.explode(out.boss);
            score += out.scoreAdd;
            pts += out.ptsAdd;
            floatTexts.push(out.float);
            if (!out.boss) kills++;
            if (out.boss) {
                missionBossClear(), mode = `stageclear`, readyTimer = 120, sfx.stageClear(), bgm.stop();
                if (settings.shake && out.shake) shake = out.shake;
            }
            let idx = enemies.indexOf(e);
            idx >= 0 && enemies.splice(idx, 1)
        }

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

        function spawnGruntEnemy() {
            enemies.push(spawnGrunt({
                id: nextEntityId++,
                stage: stage,
                hpScale: enemyHpScale()
            }))
        }

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

        function enemyShoot(e) {
            let atk = e.boss ? bossById(e.bossId).atk : 0;
            for (let entity of createEnemyVolley(e, player.x, player.y, atk)) bullets.push(entity)
        }

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

        function fireBeam() {
            let e = armedLevelOf(`beam`);
            if (e <= 0 || !account.linked) return;
            sfx.lockon();
            for (let entity of createBeams({
                px: player.x,
                py: player.y,
                beam: e,
                power: armedLevelOf(`power`),
                option: armedLevelOf(`option`)
            })) bullets.push(entity)
        }

        function fireFlame() {
            let e = armedLevelOf(`flame`);
            if (e <= 0 || !account.linked) return;
            for (let entity of createFlames({
                px: player.x,
                py: player.y,
                flame: e,
                power: armedLevelOf(`power`)
            })) bullets.push(entity)
        }

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

        function fillRect(e, t, n, r, i) {
            ctx.fillStyle = i, ctx.fillRect(Math.round(e), Math.round(t), Math.round(n), Math.round(r))
        }

        function drawText(e, t, n, r, i = 8, a = `left`) {
            ctx.fillStyle = r, ctx.font = `bold ${i}px "Courier New", monospace`, ctx.textAlign = a, ctx.textBaseline = `top`, ctx.fillText(e, t, n)
        }

        function drawPlayerShip(e, t, n, r) {
            if (r) return;
            ctx.save(), ctx.translate(Math.round(e), Math.round(t));
            ctx.fillStyle = PLAYER_SHIP_FILL, ctx.beginPath();
            let path = PLAYER_SHIP_PATH;
            ctx.moveTo(path[0][0], path[0][1]);
            for (let i = 1; i < path.length; i++) ctx.lineTo(path[i][0], path[i][1]);
            ctx.closePath(), ctx.fill();
            for (let r of playerShipLocalRects()) fillRect(r.x, r.y, r.w, r.h, r.color);
            ctx.restore()
        }

        function drawOptionPods() {
            for (let r of optionPodRects(player.x, player.y, armedLevelOf(`option`))) fillRect(r.x, r.y, r.w, r.h, r.color)
        }

        function drawEnemy(e) {
            if (e.boss) {
                drawBoss(e);
                return
            }
            ctx.save(), ctx.translate(Math.round(e.x), Math.round(e.y)), e.flash > 0 && (ctx.globalAlpha = .5);
            e.type === 2 && ctx.rotate(e.phase);
            for (let r of gruntLocalRects(e.type)) fillRect(r.x, r.y, r.w, r.h, r.color);
            ctx.restore()
        }

        function drawBoss(e) {
            let t = bossById(e.bossId);
            ctx.save(), ctx.translate(Math.round(e.x), Math.round(e.y));
            e.flash > 0 && (ctx.globalAlpha = bossFlashAlpha(e.flash, frame));
            for (let r of bossLocalRects(t, e.w, e.h)) fillRect(r.x, r.y, r.w, r.h, r.color);
            ctx.restore();
            let bar = bossHpBar({ hp: e.hp, maxHp: e.maxHp });
            fillRect(bar.bg.x, bar.bg.y, bar.bg.w, bar.bg.h, bar.bg.color);
            fillRect(bar.fg.x, bar.fg.y, bar.fg.w, bar.fg.h, bar.fg.color);
            drawText(t.name, PLAY_W / 2, 18, `#ff66aa`, 8, `center`)
        }

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

        function drawPlayHud() {
            let top = buildHudTop({ score: score, high: highScore, pts: pts, coins: continueCoins, stage: stage });
            drawText(top.score, 52, 4, `#00ff88`, 8);
            drawText(top.hi, 268, 4, `#ffff66`, 8, `right`);
            drawText(top.pts, 52, 14, `#ffff66`, 8);
            drawText(top.coins, 118, 14, `#ffee88`, 8);
            drawText(top.stage, 268, 14, `#88ffaa`, 8, `right`);
            let flags = buildHudFlags({
                weaponsEnabledCount: armedWeaponCount(),
                shotArmed: isWeaponArmed(`shot`),
                vstick: !!settings.vstick,
                difficulty: difficulty,
                enemyHpMult: scoreHpMult()
            });
            let ehp = enemyHpHud(flags.enemyHpMult);
            ehp && drawText(ehp, 52, 24, `#ff8866`, 7);
            drawText(flags.diffLabel, 268, 24, flags.diffLabel === `ESY` ? `#88ff88` : `#ffaa66`, 6, `right`);
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

        function drawTitleMissions(e) {
            if (!sharerId) return;
            reloadMissions(), fillRect(58, 90, 204, 72, `#001820`), ctx.strokeStyle = allMissionsClear() ? `#ffee66` : `#44ffcc`, ctx.lineWidth = 2, ctx.strokeRect(58.5, 90.5, 203, 71), ctx.lineWidth = 1, drawText(`◆ SHARE MISSIONS`, e, 94, `#66ffee`, 9, `center`), drawText(`4段階 × 各1枚 = 最大4 COIN`, e, 106, `#ffcc66`, 7, `center`);
            for (let row of buildTitleMissionRows(MISSION_DEFS, missionsDone)) {
                drawText(row.line, 66, row.y, row.color, 7);
            }
            let foot = titleMissionFooter(allMissionsClear(), alreadySentFanmail());
            foot && drawText(foot, e, 152, alreadySentFanmail() ? `#88aa88` : `#ffff88`, 7, `center`)
        }

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

        function drawShop() {
            let e = shopCatalog(),
                t = shopListWindow(e, 10);
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
            let tier = shopTierHint({ tier2: tier2Unlocked(), tier3: tier3Unlocked(), celebrate: celebrate > 0, frame: frame });
            drawText(tier.text, PLAY_W / 2, 56, tier.color, 6, `center`);
            for (let row of buildShopRows({
                catalog: e,
                cursor: shopCursor,
                windowStart: t,
                upgrades: upgrades,
                lives: lives,
                shieldFrames: shield,
                costOf: itemCostOf,
                maxOf: itemMaxOf,
                canBuy: canBuyItem
            })) {
                row.selected && (fillRect(58, row.y - 1, 204, 19, `#004400`), ctx.strokeStyle = `#00ff00`, ctx.strokeRect(58.5, row.y - .5, 203, 18));
                drawText(row.item.name, 62, row.y + 3, row.nameColor, 8);
                drawText(row.levelText, 148, row.y + 3, `#66ccaa`, 7);
                drawText(row.costText, 260, row.y + 3, row.costColor, 8, `right`);
            }
            t > 0 && drawText(`▲`, PLAY_W / 2, 60, `#00ff88`, 8, `center`), t + 10 < e.length && drawText(`▼`, PLAY_W / 2, 336, `#00ff88`, 8, `center`);
            for (let entity of shopFooterButtonsExact({ catalogLen: e.length, cursor: shopCursor, pauseShop: !!shopPaused, shareSelected: n, optSelected: r })) {
                fillRect(entity.x, entity.y, entity.w, entity.h, entity.fill);
                ctx.strokeStyle = entity.stroke;
                ctx.lineWidth = 2;
                ctx.strokeRect(entity.x + .5, entity.y + .5, entity.w - 1, entity.h - 1);
                drawText(entity.label, entity.labelX, entity.labelY, entity.labelColor, entity.sub ? 8 : 9, `center`);
                entity.sub && drawText(entity.sub, entity.labelX, entity.subY, `#886644`, 6, `center`);
            }
            ctx.lineWidth = 1;
            shopToastLife > 0 ? drawText(shopToast, PLAY_W / 2, 388, `#ffaa00`, 6, `center`) : drawText(shopPaused ? `進行中SHAREで助けを呼べます` : `上下スワイプ · 空欄タップで決定`, PLAY_W / 2, 388, `#335544`, 6, `center`)
        }

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

        
        // ── version changelog mode ──
        function openChangelog() {
            mode = `changelog`, changelogScroll = 0, sfx.ui()
        }

        function leaveChangelog() {
            mode = `attract`, sfx.ui()
        }

        function getChangelogMaxScroll() {
            return changelogMaxScroll(buildChangelogRows(VERSION_HISTORY).length)
        }

        function drawChangelog() {
            fillRect(RAIL_W, 0, FIELD_INNER_W, PLAY_H, `#000a12`), fillRect(54, 12, 212, 380, `#001018`), ctx.strokeStyle = `#44ffcc`, ctx.strokeRect(54.5, 12.5, 211, 379), drawText(`VERSION HISTORY`, PLAY_W / 2, 20, `#88ffee`, 11, `center`), drawText(`NOW  ${versionShortLabel()}`, PLAY_W / 2, 34, `#ffee88`, 8, `center`), drawText(`Grok Build iOS`, PLAY_W / 2, 46, `#556666`, 6, `center`);
            let e = buildChangelogRows(VERSION_HISTORY),
                t = changelogMaxScroll(e.length);
            changelogScroll > t && (changelogScroll = t);
            for (let vis of changelogVisibleRows(e, changelogScroll)) {
                if (vis.row.kind === `gap`) continue;
                let a = vis.row.kind === `head` ? 7 : 6;
                drawText(vis.row.text.slice(0, 34), 62, vis.y, vis.row.color, a)
            }
            changelogScroll > 0 && drawText(`▲`, PLAY_W / 2, 52, `#44aa88`, 7, `center`), changelogScroll < t && drawText(`▼`, PLAY_W / 2, 364, `#44aa88`, 7, `center`), fillRect(60, 370, 200, 18, `#1a3030`), ctx.strokeStyle = `#6688aa`, ctx.strokeRect(60.5, 370.5, 199, 17), drawText(`◀ BACK`, PLAY_W / 2, 375, `#aaccff`, 8, `center`)
        }

        function onChangelogTap(e, t) {
            changelogDragOn = !0, changelogDragY = t, changelogDragAcc = 0, changelogDragMoved = !1
        }

        function onChangelogDrag(e, t) {
            if (!changelogDragOn || mode !== `changelog`) return;
            let n = t - changelogDragY;
            for (changelogDragAcc += n, changelogDragY = t; changelogDragAcc <= -14;) changelogScroll = Math.max(0, changelogScroll - 1), changelogDragAcc += 14, changelogDragMoved = !0, sfx.ui();
            for (; changelogDragAcc >= 14;) changelogScroll = Math.min(getChangelogMaxScroll(), changelogScroll + 1), changelogDragAcc -= 14, changelogDragMoved = !0, sfx.ui()
        }

        function onChangelogPointerUp(e, t) {
            if (changelogDragOn) {
                if (changelogDragOn = !1, changelogDragMoved) {
                    changelogDragMoved = !1;
                    return
                }
                changelogBackHit(t, e, RAIL_W, FIELD_RIGHT) && leaveChangelog()
            }
        }

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
            sharerId ? drawTitleMissions(e) : drawText(`シェア先が1面ボス到達 → コインGET`, e, 96, `#558866`, 7, `center`);
            shareToastLife > 0 && drawText(shareToast, e, sharerId ? 148 : 110, `#ffaa00`, 7, `center`);
            drawText(titleSelectLabel(titleSub), e, PLAY_H * .385, `#ffff66`, 7, `center`);
            let t = titleMenuYs(titleSub, PLAY_H),
                n = easyCarryLevelOf(loadEasyCarryState()),
                inboxLabels = titleInboxLabels({ canSendFanmail: canSendFanmail(), alreadySent: alreadySentFanmail(), inboxCount: inbox.length }),
                r = buildTitleMenu(titleSub, {
                    linked: !!account.linked,
                    easyCarryLv: n,
                    msgTitle: inboxLabels.title,
                    msgSub: inboxLabels.sub,
                    versionLabel: APP_VERSION
                });
            for (let n = 0; n < r.length; n++) {
                let i = t[n],
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
        function startRun() {
            resetRun(), runStartedAt = performance.now(), firstBossFlagged = !1, reloadMissions(), missionBannerLife = 0, missionToast = ``, missionToastLife = 0, sfx.start(), startStage();
            try { noteRunStart(); window.__sfPlayAcc = 0; } catch (err) {}
        }

        
        // ── mission progress tick ──
        function reportMission(e) {
            if (!canAttemptMission({ sharerId: sharerId, shareId: shareId, alreadyDone: !!missionsDone[e] })) return;
            let t = missionPlaySeconds(runStartedAt),
                n = MISSION_DEFS.find(t => t.id === e);
            reportMissionClear({
                sharerId: sharerId,
                shareId: shareId,
                visitorId: playerId,
                missionId: e,
                playSeconds: t
            }).then(e => {
                reloadMissions();
                if (e.ok && !e.already) {
                    let feedback = missionClearFloats({
                        label: n.label,
                        allClearCanMsg: !!(allMissionsClear() && canSendFanmail()),
                        cx: PLAY_W / 2,
                        cy: PLAY_H
                    });
                    missionBannerLife = feedback.bannerFrames, missionToast = feedback.toast, missionToastLife = feedback.toastLife, sfx.stageClear();
                    for (let nextEntityId of feedback.floats) floatTexts.push(nextEntityId);
                    refreshCoins()
                } else if (!e.ok && e.reason === `too_fast`) {
                    let feedback = missionTooFastFloats({ label: n.label, cx: PLAY_W / 2, cy: PLAY_H });
                    missionToast = feedback.toast, missionToastLife = feedback.toastLife;
                    for (let nextEntityId of feedback.floats) floatTexts.push(nextEntityId)
                }
            })
        }

        
        // ── award / continue coin refresh ──
        function missionFirstBoss() {
            if (firstBossFlagged) return;
            let mid = firstBossMissionId(stage, firstBossFlagged);
            if (mid) firstBossFlagged = !0, reportMission(mid)
        }

        function missionBossClear() {
            let mid = bossClearMissionId(stage);
            mid && reportMission(mid)
        }

        
        // ── account link dialog ──
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

        function closeMailDialog() {
            let e = hostEl.querySelector(`#sf-mail-dlg`);
            e && e.remove(), mailBusy = !1
        }

        
        // ── fan mail to sharer ──
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
        function openInbox() {
            reloadInbox(), syncAccountCloud(), mode = `inbox`, inboxCursor = 0, inboxDetail = !1, sfx.ui()
        }
        async function doContinue() {
            if (continueBusy || continueCoins <= 0) return;
            continueBusy = !0;
            let e = await spendContinueCoin(playerId);
            if (continueCoins = e.coins, continueBusy = !1, !e.ok) {
                sfx.buyFail();
                return
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

        function requireAccountLink(e = `この機能`) {
            let gate = requireLinked(!!account.linked, e);
            if (gate.ok) return !0;
            soundToast = gate.message, soundToastLife = 100, shareToast = soundToast, shareToastLife = 100, sfx.buyFail();
            return !1
        }

        
        // ── sound test ──
        function openSoundTest() {
            if (!account.linked) {
                shareToast = `SOUND TEST はアカウント連携特典です`, shareToastLife = 90, sfx.buyFail();
                return
            }
            bgm.unlock(), soundListMode = `menu`, soundCursor = 0, trackLabel = ``, mode = `soundtest`, bgm.start(`attract`), soundPlayMode = `title`, soundIndex = 0, trackLabel = `TITLE THEME`, fetchTrackVotes(`title`, playerId).then(e => {
                ratings = e
            }), sfx.ui()
        }

        function leaveSoundTest() {
            mode = `attract`, bgm.start(`attract`), trackLabel = ``, sfx.ui()
        }

        function currentTrackKey() {
            return makeTrackKey(soundPlayMode, soundIndex)
        }

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

        function drawTrackCard(e, t) {
            let n = currentTrackCard(),
                lay = trackCardLayout({
                    top: e,
                    compact: !!t?.compact,
                    mode: soundPlayMode,
                    index: soundIndex,
                    cat: n.cat
                });
            fillRect(lay.box.x, lay.box.y, lay.box.w, lay.box.h, `#0a1a14`);
            ctx.strokeStyle = n.catColor;
            ctx.strokeRect(lay.box.x + .5, lay.box.y + .5, lay.box.w - 1, lay.box.h - 1);
            fillRect(lay.catBadge.x, lay.catBadge.y, lay.catBadge.w, lay.catBadge.h, `#102820`);
            drawText(lay.catBadge.text, lay.catLabelX, lay.catLabelY, n.catColor, 6, `center`);
            drawText(`この曲に対する評価・コメント`, lay.metaX, lay.metaY, `#668877`, 6);
            drawText(n.short, 64, lay.titleY, `#ffeeaa`, lay.titleSize);
            lay.showId && drawText(`ID ${n.key}`, 258, lay.idY, `#445544`, 5, `right`);
            return lay.height
        }

        function playSoundTrack(e, t = 0) {
            soundPlayMode = e, soundIndex = t, trackLabel = playBgmForMode(e, t), fetchTrackVotes(makeTrackKey(e, t), playerId).then(e => {
                ratings = e
            })
        }
        async function voteTrack(e) {
            if (!requireAccountLink(`曲の評価`)) return;
            ratings = await castTrackVote(currentTrackKey(), playerId, e), sfx.ui()
        }
        async function loadComments(e) {
            trackKey = e, comments = await fetchTrackComments(e), commentCursor = 0
        }

        function openComments() {
            let can = canOpenComments(trackLabel);
            if (!can.ok) {
                soundToast = can.message, soundToastLife = 80, sfx.buyFail();
                return
            }
            commentsReturn = commentsReturnMode(soundListMode, soundPlayMode);
            let e = currentTrackKey();
            Promise.all([loadComments(e), fetchTrackVotes(e, playerId)]).then(([, e]) => {
                ratings = e, soundListMode = `comments`, commentCursor = 0, sfx.ui()
            })
        }

        function leaveComments() {
            soundListMode = commentsReturn, sfx.ui()
        }

        function viewComment(e) {
            openSoundCommentViewer(e, {
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
            if (!requireAccountLink(`コメント投稿`) || composing) return;
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

        function soundTestMenuRows() {
            return buildSoundTestRootMenu()
        }

        function soundTestListRows(e) {
            return buildSoundTestTrackList(e, soundCatalogMeta())
        }

        function activateSoundTestRow() {
            if (bgm.unlock(), soundListMode === `menu`) {
                let e = soundTestMenuRows()[soundCursor];
                if (!e) return;
                let act = soundTestMenuAction(e.action);
                if (act.type === `play_title`) playSoundTrack(`title`, 0), sfx.ui();
                else if (act.type === `open_stage`) soundListMode = `stage`, soundCursor = 0, sfx.ui();
                else if (act.type === `open_boss`) soundListMode = `boss`, soundCursor = 0, sfx.ui();
                else if (act.type === `open_legacy`) soundListMode = `legacy`, soundCursor = 0, sfx.ui();
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

        function drawSoundTest() {
            if (fillRect(RAIL_W, 0, FIELD_INNER_W, PLAY_H, `#000a12`), fillRect(54, 14, 212, 376, `#001018`), ctx.strokeStyle = `#44ffcc`, ctx.strokeRect(54.5, 14.5, 211, 375), soundListMode === `comments`) {
                drawText(`COMMENTS`, PLAY_W / 2, 18, `#88ffee`, 10, `center`);
                let e = drawTrackCard(28, {
                    compact: !0
                });
                drawText(`コメント ${comments.length} 件  ·  この曲専用`, PLAY_W / 2, 28 + e + 4, `#668866`, 6, `center`);
                let t = 28 + e + 14;
                if (!comments.length) drawText(`まだコメントがありません`, PLAY_W / 2, 120, `#556666`, 8, `center`), drawText(`WRITE で最初の感想を`, PLAY_W / 2, 136, `#445555`, 7, `center`);
                else {
                    let { rows } = buildCommentRows({ comments: comments, cursor: commentCursor, baseY: t });
                    for (let row of rows) {
                        row.selected && (fillRect(60, row.y - 1, 200, 20, `#003322`), ctx.strokeStyle = `#66ffaa`, ctx.strokeRect(60.5, row.y - .5, 199, 19));
                        drawText(row.text, 64, row.y + 4, row.selected ? `#ffffff` : `#99bbaa`, 7)
                    }
                }
                drawText(account.linked ? `👍 ${L.likes}   👎 ${L.dislikes}` : `評価・投稿はアカウント連携必須`, PLAY_W / 2, 348, account.linked ? `#88aa88` : `#aa8844`, 7, `center`);
                for (let entity of commentsFooterButtons({ mine: ratings.mine })) {
                    fillRect(entity.x, entity.y, entity.w, entity.h, entity.fill);
                    ctx.strokeStyle = entity.stroke;
                    ctx.strokeRect(entity.x + .5, entity.y + .5, entity.w - 1, entity.h - 1);
                    drawText(entity.label, entity.labelX, entity.labelY, entity.labelColor, 8, `center`);
                }
                soundToastLife > 0 && drawText(soundToast, PLAY_W / 2, 388, `#ffaa66`, 6, `center`);
                return
            }
            drawText(`SOUND TEST`, PLAY_W / 2, 18, `#88ffee`, 11, `center`), drawText(`LINK PERK · 全曲試聴`, PLAY_W / 2, 30, `#448866`, 6, `center`);
            let playing = !!(trackLabel && !trackLabel.startsWith(`—`)),
                cardH = 0;
            if (playing) cardH = drawTrackCard(36, { compact: !1 });
            let top = soundTestListTop(playing, cardH);
            if (playing && top.ratingY != null) drawText(`この曲の評価  👍${L.likes}  👎${L.dislikes}`, PLAY_W / 2, top.ratingY, `#88aa88`, 6, `center`);
            else if (top.hintY != null) drawText(`曲を選ぶと、その曲の評価・コメントが対象になります`, PLAY_W / 2, top.hintY, `#556666`, 6, `center`);
            let t = soundTestPageSize(playing),
                n = top.listTop;
            if (soundListMode === `menu`) {
                let e = soundTestMenuRows();
                soundCursor >= e.length && (soundCursor = e.length - 1);
                for (let t = 0; t < e.length; t++) {
                    let r = n + t * 17,
                        i = t === soundCursor;
                    i && (fillRect(60, r - 1, 200, 15, `#003322`), ctx.strokeStyle = `#66ffaa`, ctx.strokeRect(60.5, r - .5, 199, 14)), drawText(e[t].label, 66, r + 2, i ? `#ffffff` : `#88ccaa`, 8), e[t].sub && drawText(e[t].sub, 258, r + 3, `#446655`, 6, `right`)
                }
            } else {
                let e = soundTestListRows(soundListMode);
                soundCursor >= e.length && (soundCursor = e.length - 1);
                let r = soundTestListWindow(e.length, soundCursor, t);
                {
                    let hdr = soundTestListHeader(soundListMode);
                    drawText(hdr.title, PLAY_W / 2, 52, hdr.color, 6, `center`);
                }
                for (let i = 0; i < Math.min(t, e.length); i++) {
                    let t = i + r,
                        a = n + 2 + i * 17,
                        o = t === soundCursor;
                    o && (fillRect(60, a - 1, 200, 15, `#002233`), ctx.strokeStyle = `#66ccff`, ctx.strokeRect(60.5, a - .5, 199, 14));
                    let s = e[t].action === `back`;
                    drawText(e[t].label, 66, a + 2, o ? `#ffffff` : s ? `#888` : `#88aacc`, 8), !s && soundPlayMode === soundListMode && soundIndex === e[t].n && drawText(`▶`, 256, a + 2, `#ffee66`, 7, `right`)
                }
                r > 0 && drawText(`▲`, PLAY_W / 2, n - 4, `#44aa88`, 7, `center`), r + t < e.length && drawText(`▼`, PLAY_W / 2, 360, `#44aa88`, 7, `center`)
            }
            if (trackLabel && !trackLabel.startsWith(`—`)) {
                for (let entity of playingFooterButtons({ likes: ratings.likes, dislikes: ratings.dislikes, mine: ratings.mine })) {
                    fillRect(entity.x, entity.y, entity.w, entity.h, entity.fill);
                    ctx.strokeStyle = entity.stroke;
                    ctx.strokeRect(entity.x + .5, entity.y + .5, entity.w - 1, entity.h - 1);
                    drawText(entity.label, entity.labelX, entity.labelY, entity.labelColor, 7, `center`);
                }
                if (!account.linked) drawText(`評価・コメントは連携必須`, PLAY_W / 2, 350, `#aa8844`, 6, `center`);
                else {
                    let e = currentTrackCard();
                    drawText(`対象: ${e.cat}${soundPlayMode===`title`?``:soundIndex} ${e.short.slice(0,16)}`, PLAY_W / 2, 350, `#668866`, 5, `center`)
                }
            } else drawText(`上下スワイプ · タップ決定`, PLAY_W / 2, 366, `#335544`, 6, `center`);
            soundToastLife > 0 && drawText(soundToast, PLAY_W / 2, 388, `#ffaa66`, 6, `center`)
        }

        function soundListTopY() {
            return soundListMode === `comments` ? 70 : trackLabel && !trackLabel.startsWith(`—`) ? 84 : 58
        }

        function soundTestRowIndexAtY(e) {
            return soundTestRowAtY({
                y: e,
                mode: soundListMode,
                menuLen: soundTestMenuRows().length,
                listLen: soundTestListRows(soundListMode).length,
                cursor: soundCursor,
                listTop: soundListTopY(),
                playing: !!(trackLabel && !trackLabel.startsWith(`—`))
            })
        }

        function onSoundTestPointerDown(e, t) {
            let down = soundTestPointerDown({
                x: e,
                y: t,
                left: RAIL_W,
                right: FIELD_RIGHT,
                mode: soundListMode,
                rowAtY: soundTestRowIndexAtY
            });
            if (down.type === `side_back_comments`) { leaveComments(); return }
            if (down.type === `side_back_list`) { leaveSoundTest(); return }
            soundDragOn = !0, soundDragY = t, soundDragAcc = 0, soundDragged = !1;
            if (down.selectRow != null) soundCursor = down.selectRow
        }

        function onSoundTestPointerDrag(e, t) {
            if (!soundDragOn || mode !== `soundtest`) return;
            let n = t - soundDragY;
            let scr = dragScrollSteps(soundDragAcc, n, 15);
            soundDragAcc = scr.accum, soundDragY = t;
            if (!scr.steps) return;
            soundDragged = !0;
            if (soundListMode === `comments`) {
                let e = Math.max(0, comments.length - 1);
                commentCursor = Math.max(0, Math.min(e, commentCursor + scr.steps)), sfx.ui();
                return
            }
            let r = soundListMode === `menu` ? soundTestMenuRows().length - 1 : soundTestListRows(soundListMode).length - 1;
            soundCursor = Math.max(0, Math.min(r, soundCursor + scr.steps)), sfx.ui()
        }

        function onSoundTestPointerUp(e, t) {
            if (!soundDragOn) return;
            if (soundDragOn = !1, soundDragged) {
                soundDragged = !1;
                return
            }
            let pointerUp = soundTestPointerUp({
                dragged: !1,
                x: e,
                y: t,
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

        function handleAttractTap(e, t) {
            let res = resolveAttractPointer({
                x: e,
                y: t,
                PLAY_H,
                left: RAIL_W,
                right: FIELD_RIGHT,
                sub: titleSub,
                cursor: titleCursor,
                difficulty: difficulty
            });
            if (res.cursor != null) titleCursor = res.cursor;
            let a = toAttractDispatch(res.action);
            if (a.type === `account`) { openAccount(); return }
            if (a.type === `side_back_extra`) { titleSub = `root`, titleCursor = 4, sfx.ui(); return }
            if (a.type === `side_back_diff`) { titleSub = `root`, titleCursor = 0, sfx.ui(); return }
            if (a.type === `side_options`) { openOptions(`attract`); return }
            if (a.type === `side_extra`) { titleSub = `extra`, titleCursor = 0, sfx.ui(); return }
            if (a.type === `sound_test`) { openSoundTest(); return }
            if (a.type === `profile`) { try { window.__sfOpenProfile?.() } catch {} return }
            if (a.type === `stats`) { try { window.__sfOpenStats?.() } catch {} return }
            if (a.type === `back_root`) { titleSub = `root`, titleCursor = a.cursor, sfx.ui(); return }
            if (a.type === `start_easy`) { difficulty = `easy`, startRun(); return }
            if (a.type === `start_normal`) { difficulty = `normal`, startRun(); return }
            if (a.type === `open_diff`) { titleSub = `diff`, titleCursor = a.preferNormal ? 1 : 0, sfx.ui(); return }
            if (a.type === `share`) { shareProgress(); return }
            if (a.type === `inbox`) { sharerId && canSendFanmail() ? openFanmail() : openInbox(); return }
            if (a.type === `options`) { openOptions(`attract`); return }
            if (a.type === `open_extra`) { titleSub = `extra`, titleCursor = 0, sfx.ui(); return }
            if (a.type === `changelog`) { openChangelog(); return }
            sfx.ui()
        }

        
        // ── main update tick ──
        function tickGame(e) {
            try {
              if (mode === `playing` || mode === `ready` || mode === `bossintro`) {
                window.__sfPlayAcc = (window.__sfPlayAcc || 0) + (typeof e === "number" ? e : 0.016);
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
            }
            tickStars(stars, mode, PLAY_H, RAIL_W, FIELD_INNER_W);
            tickFloats(floatTexts);
            tickLifetimes(lockBeams);
            tickParticles(fxParticles);

            let mtick = tickMode({ mode: mode, readyFrames: readyTimer, frame: frame });
            if (mtick.type === `menu_idle`) return;
            if (mtick.type === `stageclear_to_shop`) {
                readyTimer = mtick.readyLeft;
                if (mtick.openShop) openShop(!1);
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
                if (settings.vstick && vstickActive) {
                let speed = playerSpeed(upgrades.speed, settings.sense);
                Math.min(1, Math.hypot(vstickAxisX, vstickAxisY)) > VSTICK_DEADZONE && (player.x += vstickAxisX * speed * e, player.y += vstickAxisY * speed * e);
            } else if (!settings.vstick && swipeActive) {
                let t = swipeFollowFactor(upgrades.speed, settings.sense, e);
                player.x += (swipeX - player.x) * t, player.y += (swipeY - player.y) * t
            }
            }
            {
                let pos = clampPlayerPos(player.x, player.y);
                player.x = pos.x, player.y = pos.y
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
                    }, e);
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
                    stepEnemyMotion(n, e, (loadoutSummaryText) => {
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

        function drawFrame() {
            ctx.fillStyle = `#000`, ctx.fillRect(0, 0, PLAY_W, PLAY_H);
            let shakeOff = screenShakeOffset(shake),
                e = shakeOff.x,
                t = shakeOff.y;
            let route = drawRoute(mode);
            if (ctx.save(), ctx.translate(e, t), fillRect(RAIL_W, 0, FIELD_INNER_W, PLAY_H, `#000`), route === `attract`) drawAttract();
            else if (route === `changelog`) drawChangelog();
            else if (route === `soundtest`) drawSoundTest();
            else if (route === `shop`) drawShop();
            else if (route === `options`) drawOptions();
            else {
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
                    let bannerOverlay = stageBannerOverlay(stageBanner(mode, stage, bossName, frame), PLAY_W, PLAY_H);
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
                    let gameOverView = buildGameOverView({ score: score, coins: continueCoins, frame: frame });
                    drawText(`GAME OVER`, PLAY_W / 2, PLAY_H / 2 - 48, `#ff2244`, 18, `center`);
                    drawText(gameOverView.scoreText, PLAY_W / 2, PLAY_H / 2 - 24, `#00ff88`, 12, `center`);
                    drawText(gameOverView.coinText, PLAY_W / 2, PLAY_H / 2 - 6, gameOverView.coinColor, 10, `center`);
                    drawText(`制限時間なし · シェアしてコイン待ちOK`, PLAY_W / 2, 210, `#668866`, 7, `center`);
                    fillRect(72, 228, 176, 30, gameOverView.continue.fill), ctx.strokeStyle = gameOverView.continue.stroke, ctx.strokeRect(72.5, 228.5, 175, 29);
                    drawText(gameOverView.continue.label, PLAY_W / 2, 237, gameOverView.continue.labelColor, 9, `center`);
                    fillRect(72, 264, 176, 28, `#221100`), ctx.strokeStyle = gameOverView.shareStroke, ctx.strokeRect(72.5, 264.5, 175, 27);
                    drawText(`𝕏 SHARE してコインGET`, PLAY_W / 2, 272, `#ffcc66`, 9, `center`);
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
                    drawText(`消すまで残る · ミッションMSGのみお礼可`, PLAY_W / 2, 46, `#446688`, 7, `center`);
                    if (!inbox.length) {
                        drawText(`メッセージはありません`, PLAY_W / 2, PLAY_H * .45, `#668888`, 8, `center`);
                        drawText(`TAP=戻る`, PLAY_W / 2, 372, `#556666`, 7, `center`);
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
                            drawText(`🗑 削除する`, PLAY_W / 2, PLAY_H * .68 + 7, `#ff99aa`, 9, `center`);
                            fillRect(88, PLAY_H * .8, 144, 22, `#001820`), ctx.strokeStyle = `#446666`, ctx.strokeRect(88.5, PLAY_H * .8 + .5, 143, 21);
                            drawText(`◀ 一覧へ`, PLAY_W / 2, PLAY_H * .8 + 5, `#88aaaa`, 8, `center`);
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
                        drawText(`選択TAP→詳細  下端=戻る`, PLAY_W / 2, 372, `#556666`, 7, `center`);
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

        function frameLoop(e) {
            if (!running) return;
            let t = (e - lastFrameMs) / 1e3;
            lastFrameMs = e, t > .05 && (t = .05), tickGame(t), drawFrame(), rafId = requestAnimationFrame(frameLoop)
        }
        rafId = requestAnimationFrame(frameLoop);

        function pointerToGameCoords(e, t) {
            let n = canvas.getBoundingClientRect();
            return {
                x: (e - n.left) / n.width * PLAY_W,
                y: (t - n.top) / n.height * PLAY_H
            }
        }

        function stepNameLetter(e) {
            let t = NAME_CHARSET.indexOf(nameLetters[nameCursor]);
            nameLetters[nameCursor] = NAME_CHARSET[(t + e + 36) % 36]
        }

        function onShopPointerUp(e, t) {
            let act = shopPointerUp({
                x: e,
                y: t,
                left: RAIL_W,
                right: FIELD_RIGHT,
                catalogLen: shopCatalog().length,
                cursor: shopCursor
            });
            let n = shopCatalog();
            if (act.type === `side_opt`) { openOptions(`shop`); return }
            if (act.type === `side_back`) { closeShop(); return }
            if (act.type === `header_share` || act.type === `footer_share`) { shopCursor = n.length + 2, shareProgress(); return }
            if (act.type === `header_opt` || act.type === `footer_opt`) { shopCursor = n.length + 1, openOptions(`shop`); return }
            if (act.type === `footer_go`) { shopCursor = n.length, closeShop(); return }
            if (act.type === `buy`) { shopCursor = act.index, buyShopItem(n[act.index]); return }
            if (act.type === `select`) { shopCursor = act.index, sfx.ui(); return }
            if (act.type === `empty_confirm`) confirmShopSelection()
        }

        function confirmShopSelection() {
            let e = shopCatalog(),
                act = shopEmptyConfirm(shopCursor, e.length);
            if (act.type === `buy`) buyShopItem(e[act.index]);
            else if (act.type === `gameOverView`) closeShop();
            else if (act.type === `opt`) openOptions(`shop`);
            else if (act.type === `share`) shareProgress()
        }

        function shopCursorLimit() {
            return shopCursorMax(shopCatalog().length)
        }

        function moveShopCursor(e) {
            shopCursor = shopCursorStep(shopCursor, e, shopCatalog().length), sfx.ui()
        }

        function onShopPointerDown(e, t) {
            let hit = shopPointerDown({
                x: e,
                y: t,
                left: RAIL_W,
                right: FIELD_RIGHT,
                catalogLen: shopCatalog().length,
                cursor: shopCursor
            });
            if (hit.sideRail) {
                shopPaused && closeShop();
                return
            }
            shopDragOn = !0, shopDragX = e, shopDragY = t, shopDragAcc = 0, shopDragged = !1;
            if (hit.cursor != null) shopCursor = hit.cursor
        }

        function onShopPointerDrag(e, t) {
            if (!shopDragOn || mode !== `shop`) return;
            let n = t - shopDragY,
                r = e - shopDragX;
            let scr = shopDragScroll({ dx: r, dy: n, accum: shopDragAcc, stepPx: 16 });
            if (scr.vertical) {
                shopDragAcc = scr.accum, shopDragY = t, shopDragX = e;
                if (scr.steps) moveShopCursor(scr.steps), shopDragged = !0;
                return
            }
            shopDragX = e, shopDragY = t
        }

        function finishShopPointer(e, t) {
            if (shopDragOn) {
                if (shopDragOn = !1, shopDragged) {
                    shopDragged = !1;
                    return
                }
                onShopPointerUp(e, t)
            }
        }

        function optionsRowIndexAtY(e) {
            return optionsRowAtY(e, optionRows().length, optionsCursor)
        }

        function stepOptionsCursor(e, t) {
            return optionsCursorStep(optionRows(), e, t)
        }

        function onOptionsPointerDown(e, t) {
            let down = optionsPointerDown({
                x: e,
                y: t,
                left: RAIL_W,
                right: FIELD_RIGHT,
                rowAtY: optionsRowIndexAtY,
                rowKind: (i) => optionRows()[i]?.kind
            });
            if (down.sideBack) { closeOptions(); return }
            optionsDragOn = !0, optionsDragX = e, optionsDragY = t, optionsDragAccX = 0, optionsDragAccY = 0, optionsDragged = !1;
            if (down.selectRow) optionsCursor = down.rowIndex
        }

        function onOptionsPointerDrag(e, t) {
            if (!optionsDragOn || mode !== `options`) return;
            let n = e - optionsDragX,
                r = t - optionsDragY;
            if (Math.abs(r) > Math.abs(n) * .85) {
                for (optionsDragAccY += r, optionsDragX = e, optionsDragY = t; optionsDragAccY <= -15;) optionsCursor = stepOptionsCursor(optionsCursor, -1), optionsDragAccY += 15, optionsDragged = !0, sfx.ui();
                for (; optionsDragAccY >= 15;) optionsCursor = stepOptionsCursor(optionsCursor, 1), optionsDragAccY -= 15, optionsDragged = !0, sfx.ui();
                return
            }
            let i = optionRows()[optionsCursor];
            if (!i || i.kind !== `vol` && i.kind !== `sense` && i.kind !== `weapon`) {
                optionsDragX = e, optionsDragY = t;
                return
            }
            if (Math.abs(n) < Math.abs(r) * .7) {
                optionsDragX = e, optionsDragY = t;
                return
            }
            optionsDragAccX += n, optionsDragX = e, optionsDragY = t;
            let a = optionsSwipeStep(i.kind);
            for (; optionsDragAccX >= a;) nudgeOption(1), optionsDragAccX -= a, optionsDragged = !0;
            for (; optionsDragAccX <= -a;) nudgeOption(-1), optionsDragAccX += a, optionsDragged = !0
        }

        function activateOptionRow(e) {
            let t = optionRows();
            if (!t.length) return;
            let n = Math.max(0, Math.min(t.length - 1, e));
            t[n].kind === `header` && (n = stepOptionsCursor(n, 1));
            let r = t[n];
            let act = optionsActivate(r);
            if (act.type === `noop`) return;
            optionsCursor = n;
            if (act.type === `back`) { closeOptions(); return }
            if (act.type === `submenu`) {
                act.key === `shot` ? (optionsSub = `shot`, optionsCursor = 1) : (optionsSub = `weapons`, optionsCursor = 1), sfx.ui();
                return
            }
            if (act.type === `toggle` || act.type === `adjust`) {
                nudgeOption(1);
                return
            }
            if (act.type === `confirm_slider`) {
                optionsToast = `${act.label}  OK`, optionsToastLife = 40, sfx.ui();
                return
            }
        }

        function onOptionsPointerUp(e, t) {
            if (!optionsDragOn) return;
            optionsDragOn = !1;
            let pointerUp = optionsPointerUp({
                dragged: !!optionsDragged,
                x: e,
                y: t,
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

        function updateVirtualStickAxis(e, t) {
            let a = virtualStickAxis(e, t, vstickX, vstickY, 30);
            vstickAxisX = a.x, vstickAxisY = a.y
        }

        function onPointerDown(e, t) {
            let n = pointerToGameCoords(e, t);
            bgm.unlock(), applyAudioSettings();
            let route = routePointerDown({
                mode: mode,
                x: n.x,
                y: n.y,
                left: RAIL_W,
                right: FIELD_RIGHT,
                muteHit: muteButtonHit(n.x, n.y)
            });
            if (route.type === `mute`) {
                mutedFlag = bgm.toggleMute(), settings.muted = mutedFlag, persistSettings(), mutedFlag || (mode === `bossintro` || mode === `playing` && bossActive ? bgm.boss(bossForStage(stage).vibe, stage) : (mode === `playing` || mode === `ready`) && bgm.start(`play`, stage)), sfx.ui();
                return
            }
            if (route.type === `mode` && route.mode === `attract`) { handleAttractTap(n.x, n.y); return }
            if (route.type === `mode` && route.mode === `changelog`) { onChangelogTap(n.x, n.y); return }
            if (route.type === `mode` && route.mode === `soundtest`) { onSoundTestPointerDown(n.x, n.y); return }
            if (route.type === `mode` && route.mode === `options`) { onOptionsPointerDown(n.x, n.y); return }
            if (route.type === `mode` && route.mode === `shop`) { onShopPointerDown(n.x, n.y); return }
            if (route.type === `mode` && route.mode === `gameover`) {
                let hit = gameOverHit(n.x, n.y, RAIL_W, FIELD_RIGHT);
                if (hit === `side_share` || hit === `share`) { shareProgress(), refreshCoins(); return }
                if (hit === `side_title` || hit === `title`) { mode = `attract`, refreshCoins(), bgm.start(`attract`), sfx.ui(); return }
                if (hit === `continue`) {
                    continueCoins > 0 ? doContinue() : (sfx.buyFail(), shareToast = `コインが必要です · シェアしよう`, shareToastLife = 80);
                    return
                }
                return
            }
            if (route.type === `mode` && route.mode === `name`) {
                let hit = nameEntryHit(n.x, PLAY_W, RAIL_W, FIELD_RIGHT);
                if (hit === `side_back`) { mode = `attract`, bgm.start(`attract`), sfx.ui(); return }
                if (hit === `letter_prev`) stepNameLetter(-1);
                else if (hit === `letter_next`) stepNameLetter(1);
                else nameCursor++, nameCursor >= 3 && (mode = `attract`, bgm.start(`attract`));
                return
            }
            if (route.type === `mode` && route.mode === `inbox`) {
                let hit = inboxPointerHit({
                    x: n.x,
                    y: n.y,
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
                    let e = inbox[inboxCursor];
                    if (!e) { inboxDetail = !1; return }
                    canReplyThanks(e) ? openThanks(e) : sfx.buyFail();
                    return
                }
                if (hit.type === `delete`) {
                    let e = inbox[inboxCursor];
                    if (!e) { inboxDetail = !1; return }
                    deleteInboxMessage({ playerId: playerId, messageId: e.id }).then(() => { reloadInbox(), inboxDetail = !1, sfx.ui() });
                    return
                }
                if (hit.type === `to_list`) { inboxDetail = !1, sfx.ui(); return }
                if (hit.type === `clear_detail`) { inboxDetail = !1; return }
                return
            }
            if (route.type === `play_side`) {
                if (route.left) route.upper ? openShop(!0) : openOptions(`play`);
                else route.upper ? openOptions(`play`) : openShop(!0);
                return
            }
            if (route.type === `play_move`) {
                let moveResult = playMoveFromPointer({ x: n.x, y: n.y, vstick: !!settings.vstick });
                if (moveResult.vstick) vstickActive = !0, vstickX = moveResult.stickX, vstickY = moveResult.stickY, vstickAxisX = 0, vstickAxisY = 0;
                else swipeActive = !0, swipeX = moveResult.followX, swipeY = moveResult.followY
            }
        }

        function onPointerMove(e, t) {
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
            let n = pointerToGameCoords(e, t);
            if (route.type === `options_drag`) { onOptionsPointerDrag(n.x, n.y); return }
            if (route.type === `shop_drag`) { onShopPointerDrag(n.x, n.y); return }
            if (route.type === `soundtest_drag`) { onSoundTestPointerDrag(n.x, n.y); return }
            if (route.type === `changelog_drag`) { onChangelogDrag(n.x, n.y); return }
            if (route.type === `vstick`) { updateVirtualStickAxis(n.x, n.y); return }
            if (route.type === `swipe_follow`) {
                let pos = clampSwipeFollow(n.x, n.y);
                swipeX = pos.x, swipeY = pos.y
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
                        t[optionsCursor]?.kind === `back` ? closeOptions() : nudgeOption(1)
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
                    if (act.type === `attract_up`) titleCursor = (titleCursor + titleMenuLen(titleSub) - 1) % titleMenuLen(titleSub), sfx.ui();
                    else if (act.type === `attract_down`) titleCursor = (titleCursor + 1) % titleMenuLen(titleSub), sfx.ui();
                    else if (act.type === `attract_confirm`) {
                        if (titleSub === `extra`) {
                            if (titleCursor === 0) openSoundTest();
                            else if (titleCursor === 1) (typeof window.__sfOpenProfile === `function` ? window.__sfOpenProfile() : 0);
                            else if (titleCursor === 2) (typeof window.__sfOpenStats === `function` ? window.__sfOpenStats() : 0);
                            else titleSub = `root`, titleCursor = 4, sfx.ui();
                        } else if (titleSub === `diff`) {
                            if (titleCursor === 0) difficulty = `easy`, startRun();
                            else if (titleCursor === 1) difficulty = `normal`, startRun();
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
                        continueCoins > 0 ? doContinue() : shareProgress();
                        return
                    }
                    if (act.type === `gameover_share`) { shareProgress(); return }
                    if (act.type === `gameover_title`) { mode = `attract`, refreshCoins(), bgm.start(`attract`); return }
                }
                if (act.type === `pause_shop`) {
                    e.preventDefault(), openShop(!0);
                    return
                }
                if (act.type === `open_options_play`) {
                    e.preventDefault(), openOptions(`play`);
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
            }, window.__swipeForceTest = {
            mode: () => mode,
            start: () => startRun(),
            openShop: () => openShop(!0),
            openOptions: () => openOptions(`shop`),
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
            running = !1, cancelAnimationFrame(rafId), resizeObserver.disconnect(), canvas.removeEventListener(`touchstart`, onTouchStart), canvas.removeEventListener(`touchmove`, onTouchMove), canvas.removeEventListener(`touchend`, onTouchEnd), canvas.removeEventListener(`mousedown`, onMouseDown), window.removeEventListener(`mousemove`, onMouseMove), window.removeEventListener(`mouseup`, onMouseUp), window.removeEventListener(`keydown`, onKeyDown), window.removeEventListener(`keyup`, onKeyUp), bgm.stop()
        }
    }, []), (0, jsxRuntime.jsx)(`div`, {
        ref: hostRef,
        className: `flex h-dvh w-full items-center justify-center bg-black`,
        style: {
            touchAction: `none`
        },
        children: (0, jsxRuntime.jsx)(`canvas`, {
            ref: canvasRef,
            className: `max-h-full max-w-full`
        })
    })
}

function SwipeForceGameRoot() {
    return (0, jsxRuntime.jsx)(SwipeForceEngine, {})
}

/** React entry used by the route */
export function SwipeForceGameCanvas() {
  return SwipeForceGameRoot();
}
export { SwipeForceEngine as SwipeForceEngineRoot, SwipeForceGameRoot };

