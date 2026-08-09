"use client";

import { useEffect, useRef } from "react";
import {
  unlockAudio,
  toggleMute,
  setMuted,
  setMasterVol,
  setBgmVol,
  setSfxVol,
  sfxShoot,
  sfxMissile,
  sfxParticle,
  sfxLockon,
  sfxHit,
  sfxExplode,
  sfxPlayerHit,
  sfxBossWarn,
  sfxStageClear,
  sfxGameOver,
  sfxBuy,
  sfxBuyFail,
  sfxUi,
  sfxStart,
  startBgm,
  startBossBgm,
  stopBgm,
} from "@/lib/sfx";
import { bossForStage, bossById } from "@/lib/bosses";

/**
 * SWIPE FORCE — retro vertical shooter.
 * Free move · side shop · tiered weapons · bosses · v-stick.
 */

const BASE_W = 320;
const BASE_H = 400;
const SIDE_W = 48;
const PLAY_L = SIDE_W;
const PLAY_R = BASE_W - SIDE_W;
const PLAY_W = PLAY_R - PLAY_L;

type Mode =
  | "attract"
  | "ready"
  | "playing"
  | "bossintro"
  | "shop"
  | "options"
  | "stageclear"
  | "gameover"
  | "name";

type BulletKind = "normal" | "missile" | "particle";

type Bullet = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  from: "p" | "e";
  dmg: number;
  kind: BulletKind;
  targetId: number;
  life: number;
  turn: number;
};

type Enemy = {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  type: number;
  vx: number;
  vy: number;
  phase: number;
  flash: number;
  score: number;
  pts: number;
  boss: boolean;
  bossId: number;
  fireCd: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
};

type FloatText = { x: number; y: number; text: string; color: string; life: number };
type LockBeam = { tx: number; ty: number; life: number; color: string };

type Upgrades = {
  shot: number;
  rate: number;
  speed: number;
  power: number;
  option: number;
  lockon: number;
  missile: number;
  particle: number;
  hyper: number;
  cluster: number;
  overdrive: number;
};

type ShopId = keyof Upgrades | "life" | "shield";

type ShopItem = {
  id: ShopId;
  name: string;
  desc: string;
  baseCost: number;
  max: number;
  tier: number;
  consumable?: boolean;
};

const SHOP: ShopItem[] = [
  { id: "shot", name: "SHOT", desc: "弾が広がる", baseCost: 120, max: 3, tier: 1 },
  { id: "rate", name: "RATE", desc: "連射速度UP", baseCost: 140, max: 3, tier: 1 },
  { id: "speed", name: "SPEED", desc: "機体が速くなる", baseCost: 180, max: 3, tier: 1 },
  { id: "power", name: "POWER", desc: "弾の威力UP", baseCost: 200, max: 3, tier: 1 },
  { id: "option", name: "OPTION", desc: "補助ユニット", baseCost: 250, max: 2, tier: 1 },
  { id: "life", name: "1UP", desc: "残機+1", baseCost: 400, max: 5, tier: 1, consumable: true },
  { id: "shield", name: "SHIELD", desc: "一時バリア", baseCost: 300, max: 1, tier: 1, consumable: true },
  { id: "lockon", name: "LOCK-ON", desc: "ロックオンレーザー", baseCost: 500, max: 3, tier: 2 },
  { id: "missile", name: "MISSILE", desc: "誘導ミサイル", baseCost: 550, max: 3, tier: 2 },
  { id: "particle", name: "PARTICLE", desc: "荷電粒子砲", baseCost: 600, max: 3, tier: 2 },
  { id: "hyper", name: "HYPER", desc: "ロック強化", baseCost: 900, max: 2, tier: 3 },
  { id: "cluster", name: "CLUSTER", desc: "ミサイル強化", baseCost: 900, max: 2, tier: 3 },
  { id: "overdrive", name: "OVERDRIVE", desc: "粒子砲強化", baseCost: 1000, max: 2, tier: 3 },
];

const EMPTY_UP: Upgrades = {
  shot: 0,
  rate: 0,
  speed: 0,
  power: 0,
  option: 0,
  lockon: 0,
  missile: 0,
  particle: 0,
  hyper: 0,
  cluster: 0,
  overdrive: 0,
};

const HI_KEY = "swipe_force_hi_v1";
const OPT_KEY = "swipe_force_opt_v4";
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

type WepKey =
  | "shot"
  | "lockon"
  | "missile"
  | "particle"
  | "hyper"
  | "cluster"
  | "overdrive"
  | "option";

export function SwipeForceGame() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvasEl = canvasRef.current;
    if (!wrap || !canvasEl) return;
    const canvas = canvasEl;
    const ctx0 = canvas.getContext("2d");
    if (!ctx0) return;
    const ctx: CanvasRenderingContext2D = ctx0;

    let running = true;
    let raf = 0;
    let eid = 1;

    let mode: Mode = "attract";
    let score = 0;
    let pts = 0;
    let hi = Number(localStorage.getItem(HI_KEY) || "50000") || 50000;
    let lives = 3;
    let stage = 1;
    let frame = 0;
    let modeTimer = 0;
    let spawnTimer = 0;
    let fireCd = 0;
    let missileCd = 0;
    let particleCd = 0;
    let lockCd = 0;
    let invuln = 0;
    let shield = 0;
    let shake = 0;
    let stageKills = 0;
    let stageQuota = 18;
    let bossSpawned = false;
    let bossName = "";
    let nameIdx = 0;
    let nameChars = ["A", "A", "A"];
    let nameBlink = 0;
    let shopCursor = 0;
    let shopMsg = "";
    let shopMsgT = 0;
    let shopMid = false;
    let upgrades: Upgrades = { ...EMPTY_UP };
    let unlockFlash = 0;
    let mutedFlag = false;
    type Diff = "easy" | "normal";
    let difficulty: Diff = "easy";
    let attractSel = 2;
    let optionsFrom: "shop" | "attract" = "shop";
    let optCursor = 0;
    let optMsg = "";
    let optMsgT = 0;
    let optPtr = false;
    let optPtrX = 0;
    let optPtrY = 0;
    let optSwipeCarry = 0;
    let optDidSwipe = false;

    type Options = {
      master: number;
      bgm: number;
      sfx: number;
      muted: boolean;
      scanlines: boolean;
      shake: boolean;
      sense: number;
      vstick: boolean;
      wepLv: Record<WepKey, number>;
    };
    const defaultWepLv = (): Record<WepKey, number> => ({
      shot: 99,
      lockon: 99,
      missile: 99,
      particle: 99,
      hyper: 99,
      cluster: 99,
      overdrive: 99,
      option: 99,
    });
    const defaultOpt = (): Options => ({
      master: 10,
      bgm: 8,
      sfx: 10,
      muted: false,
      scanlines: true,
      shake: true,
      sense: 1,
      vstick: true,
      wepLv: defaultWepLv(),
    });
    let opts = defaultOpt();
    try {
      const raw = localStorage.getItem(OPT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Options> & {
          wep?: Partial<Record<WepKey, boolean>>;
        };
        const wepLv = { ...defaultWepLv(), ...(parsed.wepLv ?? {}) };
        if (parsed.wep && !parsed.wepLv) {
          (Object.keys(wepLv) as WepKey[]).forEach((k) => {
            wepLv[k] = parsed.wep?.[k] === false ? 0 : 99;
          });
        }
        opts = { ...defaultOpt(), ...parsed, wepLv };
      }
    } catch {
      /* ignore */
    }
    function applyAudioOpts() {
      setMasterVol(opts.master / 10);
      setBgmVol(opts.bgm / 10);
      setSfxVol(opts.sfx / 10);
      setMuted(opts.muted);
      mutedFlag = opts.muted;
    }
    function saveOpts() {
      try {
        localStorage.setItem(OPT_KEY, JSON.stringify(opts));
      } catch {
        /* ignore */
      }
      applyAudioOpts();
    }
    applyAudioOpts();

    type OptRow =
      | { kind: "vol"; key: "master" | "bgm" | "sfx"; label: string }
      | { kind: "toggle"; key: "muted" | "scanlines" | "shake" | "vstick"; label: string }
      | { kind: "sense"; label: string }
      | { kind: "header"; label: string }
      | { kind: "weapon"; key: WepKey; label: string }
      | { kind: "back"; label: string };

    function wepMax(k: WepKey): number {
      if (k === "shot") return upgrades.shot + 1;
      return upgrades[k];
    }
    function weaponUnlocked(k: WepKey): boolean {
      return wepMax(k) > 0;
    }
    function wepLv(k: WepKey): number {
      const max = wepMax(k);
      if (max <= 0) return 0;
      const raw = opts.wepLv[k];
      const v = raw === undefined || raw === null ? max : raw;
      return Math.max(0, Math.min(max, v | 0));
    }
    function wepOn(k: WepKey): boolean {
      return wepLv(k) > 0;
    }
    function enabledWepCount(): number {
      const keys: WepKey[] = [
        "shot",
        "lockon",
        "missile",
        "particle",
        "hyper",
        "cluster",
        "overdrive",
        "option",
      ];
      return keys.filter((k) => wepOn(k)).length;
    }
    function buildOptRows(): OptRow[] {
      const rows: OptRow[] = [
        { kind: "vol", key: "master", label: "MASTER VOL" },
        { kind: "vol", key: "bgm", label: "BGM VOL" },
        { kind: "vol", key: "sfx", label: "SFX VOL" },
        { kind: "toggle", key: "muted", label: "MUTE" },
        { kind: "toggle", key: "scanlines", label: "SCANLINES" },
        { kind: "toggle", key: "shake", label: "SCREEN SHAKE" },
        { kind: "toggle", key: "vstick", label: "V-STICK" },
        { kind: "sense", label: "MOVE SENSE" },
        { kind: "header", label: "— WEAPONS 左右スワイプで強度 —" },
        { kind: "weapon", key: "shot", label: "SHOT" },
      ];
      const extra: { key: WepKey; label: string }[] = [
        { key: "lockon", label: "LOCK-ON" },
        { key: "missile", label: "MISSILE" },
        { key: "particle", label: "PARTICLE" },
        { key: "hyper", label: "HYPER LOCK" },
        { key: "cluster", label: "CLUSTER" },
        { key: "overdrive", label: "OVERDRIVE" },
        { key: "option", label: "OPTION" },
      ];
      for (const e of extra) {
        if (weaponUnlocked(e.key)) rows.push({ kind: "weapon", key: e.key, label: e.label });
      }
      rows.push({ kind: "back", label: "BACK" });
      return rows;
    }

    const player = { x: BASE_W / 2, y: BASE_H - 48, w: 14, h: 12 };
    const bullets: Bullet[] = [];
    const enemies: Enemy[] = [];
    const particles: Particle[] = [];
    const floats: FloatText[] = [];
    const beams: LockBeam[] = [];
    const stars: { x: number; y: number; s: number; sp: number }[] = [];
    for (let i = 0; i < 48; i++) {
      stars.push({
        x: PLAY_L + Math.random() * PLAY_W,
        y: Math.random() * BASE_H,
        s: 1 + (i % 2),
        sp: 0.4 + (i % 5) * 0.25,
      });
    }

    let pointerActive = false;
    let pointerX = player.x;
    let pointerY = player.y;
    const STICK_R = 30;
    let stickActive = false;
    let stickBaseX = PLAY_L + 40;
    let stickBaseY = BASE_H - 52;
    let stickNX = 0;
    let stickNY = 0;
    const keys = new Set<string>();

    function resetStick() {
      stickActive = false;
      stickNX = 0;
      stickNY = 0;
    }

    function resize() {
      const rect = wrap.getBoundingClientRect();
      const scale = Math.min(rect.width / BASE_W, rect.height / BASE_H);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.style.width = `${Math.floor(BASE_W * scale)}px`;
      canvas.style.height = `${Math.floor(BASE_H * scale)}px`;
      const mult = Math.max(1, Math.floor(scale * dpr));
      canvas.width = BASE_W * mult;
      canvas.height = BASE_H * mult;
      ctx.setTransform(mult, 0, 0, mult, 0, 0);
      ctx.imageSmoothingEnabled = false;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    function tier1Maxed() {
      return (
        upgrades.shot >= 3 &&
        upgrades.rate >= 3 &&
        upgrades.speed >= 3 &&
        upgrades.power >= 3 &&
        upgrades.option >= 2
      );
    }
    function tier2Maxed() {
      return upgrades.lockon >= 3 && upgrades.missile >= 3 && upgrades.particle >= 3;
    }
    function maxTier() {
      if (tier2Maxed()) return 3;
      if (tier1Maxed()) return 2;
      return 1;
    }
    function visibleShopItems() {
      const t = maxTier();
      return SHOP.filter((it) => it.tier <= t);
    }
    function shopScroll(items: ShopItem[], maxVisible: number) {
      let scroll = 0;
      const cur = Math.min(shopCursor, Math.max(0, items.length - 1));
      if (items.length > maxVisible && cur >= 0) {
        scroll = Math.max(0, Math.min(cur, items.length - maxVisible));
        if (cur < scroll) scroll = cur;
        if (cur >= scroll + maxVisible) scroll = cur - maxVisible + 1;
      }
      return scroll;
    }
    function enemyHpMul() {
      return difficulty === "normal" ? 6 : 1;
    }
    function shopPriceMul(tier: number) {
      if (difficulty !== "normal") return 1;
      if (tier >= 3) return 81;
      if (tier >= 2) return 9;
      return 3;
    }
    function itemCost(item: ShopItem) {
      if (item.consumable) return Math.floor(item.baseCost * shopPriceMul(1));
      const lv = upgrades[item.id as keyof Upgrades] || 0;
      return Math.floor(item.baseCost * (1 + lv * 0.65) * shopPriceMul(item.tier));
    }
    function canBuy(item: ShopItem) {
      if (item.consumable) {
        if (item.id === "life" && lives >= 5) return false;
        if (item.id === "shield" && shield > 0) return false;
        return pts >= itemCost(item);
      }
      const lv = upgrades[item.id as keyof Upgrades];
      if (lv >= item.max) return false;
      return pts >= itemCost(item);
    }
    function buyItem(item: ShopItem) {
      if (!canBuy(item)) {
        shopMsg = "PTS不足 / MAX";
        shopMsgT = 60;
        sfxBuyFail();
        return;
      }
      const cost = itemCost(item);
      pts -= cost;
      if (item.id === "life") lives = Math.min(5, lives + 1);
      else if (item.id === "shield") shield = 60 * 8;
      else {
        const k = item.id as keyof Upgrades;
        upgrades[k] = Math.min(item.max, upgrades[k] + 1);
        // auto-raise wep strength to new max if was at previous max
        const wk = item.id as WepKey;
        if (wk in opts.wepLv) {
          const max = wepMax(wk);
          if (opts.wepLv[wk] >= max - 1 || opts.wepLv[wk] > 50) opts.wepLv[wk] = max;
          saveOpts();
        }
      }
      sfxBuy();
      shopMsg = `${item.name} GET!`;
      shopMsgT = 50;
      if (tier1Maxed() || tier2Maxed()) unlockFlash = 90;
    }

    function resetRun() {
      score = 0;
      pts = 0;
      lives = 3;
      stage = 1;
      upgrades = { ...EMPTY_UP };
      shield = 0;
      invuln = 0;
      bullets.length = 0;
      enemies.length = 0;
      particles.length = 0;
      floats.length = 0;
      beams.length = 0;
      player.x = BASE_W / 2;
      player.y = BASE_H - 48;
      resetStick();
    }

    function startStage() {
      stageKills = 0;
      stageQuota = 14 + stage * 4;
      bossSpawned = false;
      bossName = "";
      spawnTimer = 40;
      fireCd = 0;
      missileCd = 0;
      particleCd = 0;
      lockCd = 0;
      bullets.length = 0;
      enemies.length = 0;
      beams.length = 0;
      mode = "ready";
      modeTimer = 90;
      invuln = 60;
      resetStick();
      startBgm("play", stage);
    }

    function openShop(mid = false) {
      mode = "shop";
      shopMid = mid;
      shopCursor = 0;
      shopMsg = mid ? "一時ショップ (戦闘一時停止)" : "PTSで強化せよ";
      shopMsgT = 80;
      pointerActive = false;
      resetStick();
      if (!mid) {
        bullets.length = 0;
        enemies.length = 0;
        beams.length = 0;
      }
      sfxUi();
      startBgm("attract");
    }

    function closeShop() {
      if (shopMid) {
        mode = "playing";
        invuln = Math.max(invuln, 45);
        shopMid = false;
        if (bossSpawned) startBossBgm(bossForStage(stage).vibe, stage);
        else startBgm("play", stage);
      } else {
        stage++;
        startStage();
      }
      sfxUi();
    }

    function openOptions(from: "shop" | "attract") {
      optionsFrom = from;
      mode = "options";
      optCursor = 0;
      optMsg = "";
      optMsgT = 0;
      pointerActive = false;
      resetStick();
      sfxUi();
      startBgm("attract");
    }
    function closeOptions() {
      saveOpts();
      sfxUi();
      if (optionsFrom === "shop") mode = "shop";
      else {
        mode = "attract";
        startBgm("attract");
      }
    }

    function bar(n: number): string {
      const filled = Math.max(0, Math.min(10, n));
      return "■".repeat(filled) + "□".repeat(10 - filled) + ` ${filled}`;
    }
    function optValueLabel(row: OptRow): string {
      if (row.kind === "vol") return `◀${bar(opts[row.key])}▶`;
      if (row.kind === "toggle") return opts[row.key] ? "ON" : "OFF";
      if (row.kind === "sense") return `◀ ${opts.sense.toFixed(1)}x ▶`;
      if (row.kind === "weapon") {
        const lv = wepLv(row.key);
        const max = wepMax(row.key);
        if (lv <= 0) return "◀ OFF ▶";
        return `◀ Lv${lv}/${max} ▶`;
      }
      if (row.kind === "back") return "◀";
      return "";
    }
    function adjustOption(dir: number) {
      const rows = buildOptRows();
      if (optCursor < 0 || optCursor >= rows.length) optCursor = 0;
      const row = rows[optCursor];
      if (row.kind === "vol") {
        opts[row.key] = Math.max(0, Math.min(10, opts[row.key] + dir));
      } else if (row.kind === "toggle") {
        opts[row.key] = !opts[row.key];
        if (row.key === "vstick" && !opts.vstick) resetStick();
      } else if (row.kind === "sense") {
        opts.sense = Math.round((opts.sense + dir * 0.1) * 10) / 10;
        opts.sense = Math.max(0.6, Math.min(1.6, opts.sense));
      } else if (row.kind === "weapon") {
        const max = wepMax(row.key);
        const cur = wepLv(row.key);
        const next = Math.max(0, Math.min(max, cur + dir));
        opts.wepLv[row.key] = next;
        const allOff = enabledWepCount() === 0;
        optMsg = allOff
          ? "全武装OFF · 回避チャレンジ!"
          : next <= 0
            ? `${row.label} OFF`
            : `${row.label} → Lv${next}/${max}`;
        optMsgT = 55;
      } else if (row.kind === "header") {
        return;
      } else if (row.kind === "back") {
        closeOptions();
        return;
      }
      saveOpts();
      if (!opts.muted && (row.kind === "vol" || (row.kind === "toggle" && row.key === "muted"))) {
        startBgm("attract");
      }
      sfxUi();
    }

    function boom(x: number, y: number, color: string, n = 14) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 0.5 + Math.random() * 2.8;
        particles.push({
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 18 + Math.random() * 18,
          max: 36,
          color,
          size: 1 + (Math.random() > 0.6 ? 1 : 0),
        });
      }
    }

    function findEnemy(id: number) {
      return enemies.find((e) => e.id === id);
    }
    function nearestEnemies(n: number) {
      return [...enemies]
        .filter((e) => e.y > 10 && e.y < BASE_H + 20)
        .sort((a, b) => {
          const da = (a.x - player.x) ** 2 + (a.y - player.y) ** 2;
          const db = (b.x - player.x) ** 2 + (b.y - player.y) ** 2;
          return da - db;
        })
        .slice(0, n);
    }

    function damageEnemy(e: Enemy, dmg: number, hx: number, hy: number) {
      e.hp -= dmg;
      e.flash = 6;
      sfxHit();
      if (e.hp <= 0) {
        const big = e.boss;
        boom(e.x, e.y, e.boss ? "#ff66ff" : "#ffaa00", big ? 28 : 12);
        sfxExplode(big);
        score += e.score;
        pts += e.pts;
        floats.push({
          x: e.x,
          y: e.y,
          text: `+${e.pts}`,
          color: "#ffff66",
          life: 40,
        });
        if (!e.boss) stageKills++;
        if (e.boss) {
          mode = "stageclear";
          modeTimer = 120;
          sfxStageClear();
          stopBgm();
          if (opts.shake) shake = 12;
        }
        const idx = enemies.indexOf(e);
        if (idx >= 0) enemies.splice(idx, 1);
      } else {
        boom(hx, hy, "#ffffff", 3);
      }
    }

    function hitPlayer() {
      if (invuln > 0) return;
      if (shield > 0) {
        shield = 0;
        invuln = 50;
        boom(player.x, player.y, "#66ffff", 10);
        sfxPlayerHit();
        return;
      }
      lives--;
      invuln = 90;
      if (opts.shake) shake = 10;
      sfxPlayerHit();
      boom(player.x, player.y, "#ff2244", 16);
      if (lives < 0) {
        lives = 0;
        mode = "gameover";
        modeTimer = 150;
        sfxGameOver();
        stopBgm();
        if (score > hi) {
          hi = score;
          localStorage.setItem(HI_KEY, String(hi));
        }
      }
    }

    function spawnEnemy() {
      const roll = Math.random();
      const type = roll < 0.45 ? 0 : roll < 0.75 ? 1 : roll < 0.92 ? 2 : 3;
      const x = PLAY_L + 16 + Math.random() * (PLAY_W - 32);
      const mul = enemyHpMul();
      const baseHp = type === 0 ? 2 : type === 1 ? 4 : type === 2 ? 6 : 10;
      const hp = Math.floor((baseHp + Math.floor(stage / 3)) * mul);
      enemies.push({
        id: eid++,
        x,
        y: -16,
        w: type === 3 ? 22 : 14,
        h: type === 3 ? 18 : 12,
        hp,
        maxHp: hp,
        type,
        vx: (Math.random() - 0.5) * (1 + stage * 0.05),
        vy: 0.6 + Math.random() * 0.5 + stage * 0.03,
        phase: Math.random() * Math.PI * 2,
        flash: 0,
        score: (type + 1) * 100,
        pts: (type + 1) * 15 + stage,
        boss: false,
        bossId: 0,
        fireCd: 40 + Math.random() * 40,
      });
    }

    function spawnBoss() {
      const def = bossForStage(stage);
      bossName = def.name;
      bossSpawned = true;
      mode = "bossintro";
      modeTimer = 120;
      sfxBossWarn();
      startBossBgm(def.vibe, stage);
      const mul = enemyHpMul();
      const hp = Math.floor((80 + stage * 35) * mul);
      enemies.push({
        id: eid++,
        x: BASE_W / 2,
        y: -40,
        w: def.w,
        h: def.h,
        hp,
        maxHp: hp,
        type: 99,
        vx: 0,
        vy: 0.4,
        phase: 0,
        flash: 0,
        score: 5000 + stage * 500,
        pts: 200 + stage * 40,
        boss: true,
        bossId: def.id,
        fireCd: 30,
      });
    }

    function enemyShoot(e: Enemy) {
      if (e.boss) {
        const def = bossById(e.bossId);
        const atk = def.atk;
        const n = 3 + (atk % 4);
        for (let i = 0; i < n; i++) {
          const ang =
            Math.atan2(player.y - e.y, player.x - e.x) + (i - (n - 1) / 2) * 0.22;
          const sp = 1.4 + (atk % 3) * 0.25;
          bullets.push({
            x: e.x,
            y: e.y + e.h * 0.3,
            vx: Math.cos(ang) * sp,
            vy: Math.sin(ang) * sp,
            w: 3,
            h: 3,
            from: "e",
            dmg: 1,
            kind: "normal",
            targetId: 0,
            life: 200,
            turn: 0,
          });
        }
        if (atk % 3 === 0) {
          for (let i = -2; i <= 2; i++) {
            bullets.push({
              x: e.x + i * 8,
              y: e.y + 10,
              vx: i * 0.3,
              vy: 1.8,
              w: 3,
              h: 4,
              from: "e",
              dmg: 1,
              kind: "normal",
              targetId: 0,
              life: 180,
              turn: 0,
            });
          }
        }
      } else if (e.type >= 1) {
        const ang = Math.atan2(player.y - e.y, player.x - e.x);
        bullets.push({
          x: e.x,
          y: e.y + 6,
          vx: Math.cos(ang) * 1.6,
          vy: Math.sin(ang) * 1.6,
          w: 3,
          h: 3,
          from: "e",
          dmg: 1,
          kind: "normal",
          targetId: 0,
          life: 160,
          turn: 0,
        });
      }
    }

    function fireNormal() {
      const shotLv = wepLv("shot");
      const shotUp = Math.max(0, shotLv - 1);
      const od = wepLv("overdrive");
      const dmg = 1 + upgrades.power + (od > 0 ? 1 : 0);
      if (shotLv > 0) {
        const shots: { dx: number; dy: number }[] = [{ dx: 0, dy: -6.5 }];
        if (shotUp >= 1) shots.push({ dx: -1.2, dy: -6.2 }, { dx: 1.2, dy: -6.2 });
        if (shotUp >= 2) shots.push({ dx: -2.2, dy: -5.6 }, { dx: 2.2, dy: -5.6 });
        if (shotUp >= 3) shots.push({ dx: -3.2, dy: -5.0 }, { dx: 3.2, dy: -5.0 });
        sfxShoot();
        for (const s of shots) {
          bullets.push({
            x: player.x,
            y: player.y - 10,
            vx: s.dx,
            vy: s.dy,
            w: 2 + (upgrades.power > 1 ? 1 : 0),
            h: 6 + upgrades.power,
            from: "p",
            dmg,
            kind: "normal",
            targetId: 0,
            life: 120,
            turn: 0,
          });
        }
      }
      const optLv = wepLv("option");
      if (optLv >= 1) {
        if (shotLv <= 0) sfxShoot();
        bullets.push({
          x: player.x - 16,
          y: player.y - 4,
          vx: 0,
          vy: -5.5,
          w: 2,
          h: 5,
          from: "p",
          dmg: Math.max(1, dmg - 1),
          kind: "normal",
          targetId: 0,
          life: 120,
          turn: 0,
        });
      }
      if (optLv >= 2) {
        bullets.push({
          x: player.x + 16,
          y: player.y - 4,
          vx: 0,
          vy: -5.5,
          w: 2,
          h: 5,
          from: "p",
          dmg: Math.max(1, dmg - 1),
          kind: "normal",
          targetId: 0,
          life: 120,
          turn: 0,
        });
      }
    }

    function fireMissiles() {
      const mLv = wepLv("missile");
      if (mLv <= 0) return;
      const cl = wepLv("cluster");
      const count = mLv + (cl > 0 ? cl + 1 : 0);
      const targets = nearestEnemies(count);
      const dmg = 2 + mLv + cl;
      sfxMissile();
      for (let i = 0; i < count; i++) {
        const t = targets[i % Math.max(1, targets.length)];
        const ang = -Math.PI / 2 + (i - (count - 1) / 2) * 0.35;
        bullets.push({
          x: player.x + Math.cos(ang) * 6,
          y: player.y - 6,
          vx: Math.cos(ang) * 2.5,
          vy: Math.sin(ang) * 2.5 - 1.5,
          w: 4,
          h: 4,
          from: "p",
          dmg,
          kind: "missile",
          targetId: t ? t.id : 0,
          life: 160,
          turn: 0.12 + mLv * 0.03,
        });
      }
    }

    function fireParticle() {
      const pLv = wepLv("particle");
      if (pLv <= 0) return;
      const od = wepLv("overdrive");
      const dmg = 4 + pLv * 2 + od * 3;
      const thick = 4 + pLv + od * 2;
      sfxParticle();
      bullets.push({
        x: player.x,
        y: player.y - 14,
        vx: 0,
        vy: -9 - pLv,
        w: thick,
        h: 14 + pLv * 2,
        from: "p",
        dmg,
        kind: "particle",
        targetId: 0,
        life: 90,
        turn: 0,
      });
      if (od >= 1) {
        for (const side of [-1, 1] as const) {
          bullets.push({
            x: player.x + side * 10,
            y: player.y - 10,
            vx: side * 0.8,
            vy: -8,
            w: thick - 1,
            h: 12,
            from: "p",
            dmg: dmg - 1,
            kind: "particle",
            targetId: 0,
            life: 90,
            turn: 0,
          });
        }
      }
      if (od >= 2) {
        for (const side of [-1, 1] as const) {
          bullets.push({
            x: player.x,
            y: player.y - 8,
            vx: side * 2.5,
            vy: -7,
            w: 5,
            h: 10,
            from: "p",
            dmg: Math.floor(dmg * 0.7),
            kind: "particle",
            targetId: 0,
            life: 80,
            turn: 0,
          });
        }
      }
      boom(player.x, player.y - 16, "#66ccff", 6);
    }

    function fireLockOn() {
      const lLv = wepLv("lockon");
      if (lLv <= 0) return;
      const hy = wepLv("hyper");
      const n = lLv + (hy > 0 ? hy + 1 : 0);
      const targets = nearestEnemies(n);
      const dmg = 1 + lLv + hy;
      if (targets.length) sfxLockon();
      for (const t of targets) {
        beams.push({
          tx: t.x,
          ty: t.y,
          life: 8 + lLv * 2,
          color: hy > 0 ? "#ff66ff" : "#00ffcc",
        });
        particles.push({
          x: t.x,
          y: t.y,
          vx: 0,
          vy: 0,
          life: 10,
          max: 10,
          color: "#ff2244",
          size: 3,
        });
        damageEnemy(t, dmg, t.x, t.y);
      }
    }

    function fillRect(x: number, y: number, w: number, h: number, c: string) {
      ctx.fillStyle = c;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }
    function text(
      s: string,
      x: number,
      y: number,
      c: string,
      size = 8,
      align: CanvasTextAlign = "left",
    ) {
      ctx.fillStyle = c;
      ctx.font = `bold ${size}px "Courier New", monospace`;
      ctx.textAlign = align;
      ctx.textBaseline = "top";
      ctx.fillText(s, x, y);
    }

    function drawShip(x: number, y: number, _s: number, blink: boolean) {
      if (blink) return;
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y));
      ctx.fillStyle = "#44ff88";
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(7, 6);
      ctx.lineTo(3, 3);
      ctx.lineTo(0, 7);
      ctx.lineTo(-3, 3);
      ctx.lineTo(-7, 6);
      ctx.closePath();
      ctx.fill();
      fillRect(-2, -3, 4, 4, "#ffffff");
      fillRect(-5, 5, 3, 4, "#ff8800");
      fillRect(2, 5, 3, 4, "#ff8800");
      ctx.restore();
    }

    function drawOptionUnits() {
      const ol = wepLv("option");
      if (ol >= 1) {
        fillRect(player.x - 18, player.y - 2, 6, 6, "#88ff88");
        fillRect(player.x - 16, player.y, 2, 2, "#fff");
      }
      if (ol >= 2) {
        fillRect(player.x + 12, player.y - 2, 6, 6, "#88ff88");
        fillRect(player.x + 14, player.y, 2, 2, "#fff");
      }
    }

    function drawEnemy(e: Enemy) {
      if (e.boss) {
        drawBoss(e);
        return;
      }
      ctx.save();
      ctx.translate(Math.round(e.x), Math.round(e.y));
      if (e.flash > 0) ctx.globalAlpha = 0.5;
      if (e.type === 0) {
        fillRect(-6, -5, 12, 10, "#ff4466");
        fillRect(-3, 3, 6, 4, "#ffaa00");
      } else if (e.type === 1) {
        fillRect(-8, -6, 16, 12, "#44aaff");
        fillRect(-4, -2, 8, 6, "#aaddff");
      } else if (e.type === 2) {
        ctx.rotate(e.phase);
        fillRect(-6, -6, 12, 12, "#ff3333");
        fillRect(-9, -2, 18, 4, "#ff8888");
        fillRect(-2, -2, 4, 4, "#ffff00");
      } else {
        fillRect(-14, -8, 10, 16, "#aa44ff");
        fillRect(4, -8, 10, 16, "#aa44ff");
        fillRect(-10, -4, 20, 12, "#44ffcc");
        fillRect(-6, -10, 12, 6, "#ff88ff");
      }
      ctx.restore();
    }

    function drawBoss(e: Enemy) {
      const def = bossById(e.bossId);
      ctx.save();
      ctx.translate(Math.round(e.x), Math.round(e.y));
      if (e.flash > 0) ctx.globalAlpha = 0.45 + 0.55 * Math.sin(frame * 3);
      const s = def.shape;
      const hw = e.w / 2;
      const hh = e.h / 2;
      fillRect(-hw, -hh, e.w, e.h, def.c1);
      fillRect(-hw + 4, -hh + 4, e.w - 8, e.h - 8, def.c2);
      if (s % 2 === 0) {
        fillRect(-hw - 6, -4, 8, 8, def.c3);
        fillRect(hw - 2, -4, 8, 8, def.c3);
      } else {
        fillRect(-6, -hh - 6, 12, 8, def.c3);
      }
      fillRect(-4, -4, 8, 8, "#ffffff");
      ctx.restore();
      // hp bar
      const bw = PLAY_W - 20;
      const pct = Math.max(0, e.hp / e.maxHp);
      fillRect(PLAY_L + 10, 28, bw, 6, "#330011");
      fillRect(PLAY_L + 10, 28, bw * pct, 6, "#ff2244");
      text(def.name, BASE_W / 2, 18, "#ff66aa", 8, "center");
    }

    function drawBezel() {
      fillRect(0, 0, SIDE_W, BASE_H, "#0a1a0a");
      fillRect(PLAY_R, 0, SIDE_W, BASE_H, "#0a1a0a");
      // stickers
      for (const side of [0, PLAY_R] as const) {
        text("SWIPE", side + 8, 20, "#00ff66", 7);
        text("FORCE", side + 8, 30, "#00ff66", 7);
        fillRect(side + 10, 50, 28, 28, "#113311");
        ctx.strokeStyle = "#00aa44";
        ctx.strokeRect(side + 10.5, 50.5, 27, 27);
        text("SHOP", side + 14, 60, "#88ff88", 7);
        text("TAP", side + 16, 72, "#558855", 6);
      }
      text(mutedFlag ? "MUTE" : "🔊", PLAY_R + 8, BASE_H - 22, "#66aa66", 7);
    }

    function drawHud() {
      text(`SC ${String(score).padStart(7, "0")}`, PLAY_L + 4, 4, "#00ff88", 8);
      text(`HI ${String(hi).padStart(7, "0")}`, PLAY_R - 4, 4, "#ffff66", 8, "right");
      text(`PTS ${pts}`, PLAY_L + 4, 14, "#ffff66", 8);
      text(`ST${stage}`, PLAY_R - 4, 14, "#88ffaa", 8, "right");
      let lx = PLAY_L + 4;
      for (let i = 0; i < lives; i++) {
        fillRect(lx, BASE_H - 12, 6, 6, "#44ff88");
        lx += 9;
      }
      let wx = PLAY_L + 4;
      const pips: [string, number, number][] = [];
      if (upgrades.lockon) pips.push(["L", wepLv("lockon"), upgrades.lockon]);
      if (upgrades.missile) pips.push(["M", wepLv("missile"), upgrades.missile]);
      if (upgrades.particle) pips.push(["P", wepLv("particle"), upgrades.particle]);
      if (upgrades.hyper) pips.push(["H", wepLv("hyper"), upgrades.hyper]);
      if (upgrades.cluster) pips.push(["C", wepLv("cluster"), upgrades.cluster]);
      if (upgrades.overdrive) pips.push(["O", wepLv("overdrive"), upgrades.overdrive]);
      if (enabledWepCount() === 0) {
        text("DODGE ONLY", wx, BASE_H - 24, frame % 20 < 12 ? "#ff88aa" : "#aa4466", 7);
        wx += 56;
      } else if (!wepOn("shot")) {
        text("SHOT OFF", wx, BASE_H - 24, "#aa4444", 7);
        wx += 48;
      }
      for (const [lab, lv, max] of pips) {
        text(
          lv > 0 ? `${lab}${lv}` : `${lab}-`,
          wx,
          BASE_H - 24,
          lv > 0 ? (lv < max ? "#ffdd88" : "#88ffcc") : "#554444",
          7,
        );
        wx += 18;
      }
      if (opts.vstick) text("STICK", PLAY_R - 4, BASE_H - 24, "#448866", 6, "right");
      else text("SWIPE", PLAY_R - 4, BASE_H - 24, "#448866", 6, "right");
    }

    function drawVStick() {
      if (!opts.vstick) return;
      if (mode !== "playing" && mode !== "ready" && mode !== "bossintro") return;
      const idleX = PLAY_L + 38;
      const idleY = BASE_H - 54;
      const bx = stickActive ? stickBaseX : idleX;
      const by = stickActive ? stickBaseY : idleY;
      const knx = stickActive ? bx + stickNX * STICK_R : bx;
      const kny = stickActive ? by + stickNY * STICK_R : by;
      const a = stickActive ? 0.55 : 0.28;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = "#44ffaa";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bx, by, STICK_R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#226644";
      ctx.beginPath();
      ctx.arc(bx, by, STICK_R * 0.45, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#338855";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx - STICK_R + 4, by);
      ctx.lineTo(bx + STICK_R - 4, by);
      ctx.moveTo(bx, by - STICK_R + 4);
      ctx.lineTo(bx, by + STICK_R - 4);
      ctx.stroke();
      ctx.globalAlpha = stickActive ? 0.75 : 0.4;
      ctx.fillStyle = stickActive ? "#88ffcc" : "#44aa77";
      ctx.beginPath();
      ctx.arc(knx, kny, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    function drawShop() {
      const items = visibleShopItems();
      const rowH = 20;
      const startY = 70;
      const maxVisible = 11;
      const scroll = shopScroll(items, maxVisible);
      fillRect(PLAY_L, 0, PLAY_W, BASE_H, "#001400");
      fillRect(PLAY_L + 6, 22, PLAY_W - 12, BASE_H - 38, "#002200");
      ctx.strokeStyle = "#00ff66";
      ctx.strokeRect(PLAY_L + 6.5, 22.5, PLAY_W - 13, BASE_H - 39);
      text("POWER SHOP", BASE_W / 2, 26, "#ffff00", 11, "center");
      text(
        `PTS ${pts}  ·  TIER ${maxTier()}  ·  ${difficulty === "normal" ? "NORMAL" : "EASY"}`,
        BASE_W / 2,
        40,
        difficulty === "normal" ? "#ffaa66" : "#ffff66",
        8,
        "center",
      );
      const hint = !tier1Maxed()
        ? "基本強化を全MAX → TIER2兵器解放"
        : !tier2Maxed()
          ? "上級兵器を全MAX → TIER3解放"
          : "最終強化解放済み";
      text(hint, BASE_W / 2, 54, unlockFlash > 0 && frame % 10 < 5 ? "#ff66ff" : "#66aa66", 7, "center");
      for (let vi = 0; vi < Math.min(maxVisible, items.length); vi++) {
        const i = vi + scroll;
        const item = items[i];
        const y = startY + vi * rowH;
        const selected = i === shopCursor;
        const cost = itemCost(item);
        const maxed = !item.consumable && upgrades[item.id as keyof Upgrades] >= item.max;
        const tierCol =
          item.tier === 3 ? "#ff88ff" : item.tier === 2 ? "#66ccff" : selected ? "#fff" : "#88ff88";
        if (selected) {
          fillRect(PLAY_L + 10, y - 1, PLAY_W - 20, rowH - 1, "#004400");
          ctx.strokeStyle = "#00ff00";
          ctx.strokeRect(PLAY_L + 10.5, y - 0.5, PLAY_W - 21, rowH - 2);
        }
        text(item.name, PLAY_L + 14, y + 3, tierCol, 8);
        const lv =
          item.id === "life"
            ? `${lives}/5`
            : item.id === "shield"
              ? shield > 0
                ? "ON"
                : "OK"
              : `Lv${upgrades[item.id as keyof Upgrades]}/${item.max}`;
        text(lv, PLAY_L + 100, y + 3, "#66ccaa", 7);
        text(
          maxed ? "MAX" : `${cost}P`,
          PLAY_R - 12,
          y + 3,
          maxed ? "#888" : canBuy(item) ? "#ffff00" : "#aa4444",
          8,
          "right",
        );
      }
      if (scroll > 0) text("▲", BASE_W / 2, startY - 12, "#00ff88", 8, "center");
      if (scroll + maxVisible < items.length) text("▼", BASE_W / 2, BASE_H - 58, "#00ff88", 8, "center");
      const contY = BASE_H - 46;
      const contSel = shopCursor === items.length;
      const optSel = shopCursor === items.length + 1;
      if (contSel) fillRect(PLAY_L + 20, contY, PLAY_W - 40, 16, "#006600");
      ctx.strokeStyle = contSel ? "#ffff00" : "#00aa00";
      ctx.strokeRect(PLAY_L + 20.5, contY + 0.5, PLAY_W - 41, 15);
      text(
        shopMid ? "▶ RESUME" : "▶ NEXT STAGE",
        BASE_W / 2,
        contY + 3,
        contSel ? "#ffff00" : "#00ff88",
        8,
        "center",
      );
      const optY = BASE_H - 28;
      if (optSel) fillRect(PLAY_L + 20, optY, PLAY_W - 40, 14, "#003344");
      ctx.strokeStyle = optSel ? "#66ccff" : "#226688";
      ctx.strokeRect(PLAY_L + 20.5, optY + 0.5, PLAY_W - 41, 13);
      text("⚙ OPTIONS", BASE_W / 2, optY + 2, optSel ? "#aaddff" : "#5588aa", 8, "center");
      text(
        shopMsgT > 0
          ? shopMsg
          : shopMid
            ? "購入 · RESUME · OPTIONS"
            : "購入 · NEXT · OPTIONS",
        BASE_W / 2,
        BASE_H - 10,
        shopMsgT > 0 ? "#ffaa00" : "#558855",
        6,
        "center",
      );
    }

    function drawOptions() {
      const rows = buildOptRows();
      if (optCursor >= rows.length) optCursor = Math.max(0, rows.length - 1);
      fillRect(PLAY_L, 0, PLAY_W, BASE_H, "#001018");
      fillRect(PLAY_L + 6, 18, PLAY_W - 12, BASE_H - 30, "#001a22");
      ctx.strokeStyle = "#00ccff";
      ctx.strokeRect(PLAY_L + 6.5, 18.5, PLAY_W - 13, BASE_H - 31);
      text("OPTIONS", BASE_W / 2, 22, "#66eeff", 11, "center");
      text("V-STICK ONで指の下に隠れない操作", BASE_W / 2, 36, "#448888", 7, "center");
      const maxVisible = 14;
      const startY = 48;
      const rowH = 18;
      let scroll = 0;
      if (rows.length > maxVisible) {
        scroll = Math.max(0, Math.min(optCursor, rows.length - maxVisible));
        if (optCursor < scroll) scroll = optCursor;
        if (optCursor >= scroll + maxVisible) scroll = optCursor - maxVisible + 1;
      }
      for (let vi = 0; vi < Math.min(maxVisible, rows.length); vi++) {
        const i = vi + scroll;
        const row = rows[i];
        const y = startY + vi * rowH;
        const sel = i === optCursor;
        if (row.kind === "header") {
          text(row.label, BASE_W / 2, y + 4, "#558888", 7, "center");
          continue;
        }
        if (sel) {
          fillRect(PLAY_L + 12, y - 1, PLAY_W - 24, rowH - 2, "#003344");
          ctx.strokeStyle = "#00eeff";
          ctx.strokeRect(PLAY_L + 12.5, y - 0.5, PLAY_W - 25, rowH - 3);
        }
        const labCol =
          row.kind === "weapon"
            ? wepLv(row.key) > 0
              ? sel
                ? "#aaffcc"
                : "#66aa88"
              : sel
                ? "#ffaaaa"
                : "#886666"
            : sel
              ? "#ffffff"
              : "#88aacc";
        text(row.label, PLAY_L + 16, y + 3, labCol, 8);
        const val = optValueLabel(row);
        if (val) {
          text(
            val,
            PLAY_R - 12,
            y + 3,
            row.kind === "weapon"
              ? wepLv(row.key) > 0
                ? "#66ff88"
                : "#ff6666"
              : sel
                ? "#ffff66"
                : "#668888",
            7,
            "right",
          );
        }
      }
      if (scroll > 0) text("▲", BASE_W / 2, startY - 10, "#00ccff", 7, "center");
      if (scroll + maxVisible < rows.length)
        text("▼", BASE_W / 2, BASE_H - 28, "#00ccff", 7, "center");
      text(
        optMsgT > 0 ? optMsg : "▲▼選択  音量・武装は左右スワイプ",
        BASE_W / 2,
        BASE_H - 14,
        optMsgT > 0 ? "#ffaa00" : "#446666",
        6,
        "center",
      );
    }

    function drawAttract() {
      ctx.fillStyle = "#001100";
      ctx.fillRect(PLAY_L, 0, PLAY_W, BASE_H);
      for (let i = 0; i < 400; i++) {
        const x = PLAY_L + Math.random() * PLAY_W;
        const y = Math.random() * BASE_H;
        const g = 100 + Math.random() * 120;
        ctx.fillStyle = `rgb(0,${g | 0},${(g * 0.35) | 0})`;
        ctx.fillRect(x, y, 1, 1);
      }
      const cx = BASE_W / 2;
      text("SWIPE FORCE", cx, 40, "#00ff88", 16, "center");
      text("RETRO VERTICAL SHOOTER", cx, 62, "#66aa66", 8, "center");
      text("SELECT DIFFICULTY", cx, BASE_H * 0.4, "#ffff66", 8, "center");
      const rowY = [BASE_H * 0.46, BASE_H * 0.55, BASE_H * 0.66, BASE_H * 0.76];
      const labels = [
        { title: "EASY", sub: "標準バランス" },
        { title: "NORMAL", sub: "敵HP×6  店価格UP" },
        { title: "▶ START", sub: "" },
        { title: "⚙ OPTIONS", sub: "音量・V-STICK・武装" },
      ];
      for (let i = 0; i < 4; i++) {
        const y = rowY[i];
        const sel = attractSel === i;
        const h = i >= 2 ? 20 : 26;
        if (sel) {
          fillRect(PLAY_L + 14, y - 2, PLAY_W - 28, h, i === 3 ? "#002233" : "#003300");
          ctx.strokeStyle = i === 3 ? "#66ccff" : "#ffff00";
          ctx.strokeRect(PLAY_L + 14.5, y - 1.5, PLAY_W - 29, h - 1);
        } else {
          ctx.strokeStyle = "#005500";
          ctx.strokeRect(PLAY_L + 14.5, y - 1.5, PLAY_W - 29, h - 1);
        }
        const col =
          i === 0
            ? sel
              ? "#88ff88"
              : "#55aa55"
            : i === 1
              ? sel
                ? "#ffaa66"
                : "#aa6644"
              : i === 3
                ? sel
                  ? "#aaddff"
                  : "#5588aa"
                : sel && frame % 24 < 16
                  ? "#ffffff"
                  : "#00ff88";
        text(labels[i].title, cx, y + 2, col, 10, "center");
        if (i < 2) text(labels[i].sub, cx, y + 13, sel ? "#ccffcc" : "#446644", 6, "center");
      }
      text("横帯=SHOP · V-STICKで回避しやすく", cx, BASE_H * 0.92, "#558855", 7, "center");
    }

    function beginGame() {
      resetRun();
      sfxStart();
      startStage();
    }
    function attractTap(gx: number, gy: number) {
      const rowY = [BASE_H * 0.46, BASE_H * 0.55, BASE_H * 0.66, BASE_H * 0.76];
      const heights = [26, 26, 20, 20];
      for (let i = 0; i < 4; i++) {
        if (gy >= rowY[i] - 2 && gy <= rowY[i] + heights[i]) {
          if (i === 0) {
            difficulty = "easy";
            attractSel = 0;
            sfxUi();
          } else if (i === 1) {
            difficulty = "normal";
            attractSel = 1;
            sfxUi();
          } else if (i === 2) {
            attractSel = 2;
            beginGame();
          } else {
            attractSel = 3;
            openOptions("attract");
          }
          return;
        }
      }
      if (attractSel === 2) beginGame();
      else if (attractSel === 3) openOptions("attract");
      else {
        attractSel = 2;
        sfxUi();
      }
    }

    function update(dt: number) {
      frame++;
      if (shake > 0) shake *= 0.85;
      if (shake < 0.2) shake = 0;
      if (shopMsgT > 0) shopMsgT--;
      if (optMsgT > 0) optMsgT--;
      if (shield > 0) shield--;
      if (unlockFlash > 0) unlockFlash--;

      for (const s of stars) {
        s.y += s.sp * (mode === "playing" ? 1 : 0.3);
        if (s.y > BASE_H) {
          s.y = 0;
          s.x = PLAY_L + Math.random() * PLAY_W;
        }
      }
      for (let i = floats.length - 1; i >= 0; i--) {
        floats[i].y -= 0.45;
        floats[i].life--;
        if (floats[i].life <= 0) floats.splice(i, 1);
      }
      for (let i = beams.length - 1; i >= 0; i--) {
        beams[i].life--;
        if (beams[i].life <= 0) beams.splice(i, 1);
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
      }

      if (mode === "attract" || mode === "shop" || mode === "options") return;
      if (mode === "ready") {
        modeTimer--;
        if (modeTimer <= 0) mode = "playing";
        // allow move during ready
      } else if (mode === "bossintro") {
        modeTimer--;
        if (modeTimer <= 0) mode = "playing";
      } else if (mode === "stageclear") {
        modeTimer--;
        if (modeTimer <= 0) openShop(false);
        return;
      } else if (mode === "gameover") {
        modeTimer--;
        if (modeTimer <= 0) {
          if (score >= 1000) mode = "name";
          else {
            mode = "attract";
            startBgm("attract");
          }
        }
        return;
      } else if (mode === "name") {
        nameBlink++;
        return;
      }

      if (mode !== "playing" && mode !== "ready" && mode !== "bossintro") return;

      const moveSpd = (120 + upgrades.speed * 35) * opts.sense;
      let mx = 0;
      let my = 0;
      if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) mx -= 1;
      if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) mx += 1;
      if (keys.has("ArrowUp") || keys.has("w") || keys.has("W")) my -= 1;
      if (keys.has("ArrowDown") || keys.has("s") || keys.has("S")) my += 1;
      if (mx !== 0 || my !== 0) {
        const len = Math.hypot(mx, my) || 1;
        player.x += (mx / len) * moveSpd * dt;
        player.y += (my / len) * moveSpd * dt;
      } else if (opts.vstick && stickActive) {
        const mag = Math.min(1, Math.hypot(stickNX, stickNY));
        if (mag > 0.08) {
          player.x += stickNX * moveSpd * dt;
          player.y += stickNY * moveSpd * dt;
        }
      } else if (!opts.vstick && pointerActive) {
        const follow = Math.min(1, (12 + upgrades.speed * 2) * opts.sense * dt);
        player.x += (pointerX - player.x) * follow;
        player.y += (pointerY - player.y) * follow;
      }
      player.x = Math.max(PLAY_L + 10, Math.min(PLAY_R - 10, player.x));
      player.y = Math.max(36, Math.min(BASE_H - 18, player.y));
      if (invuln > 0) invuln--;

      if (mode === "playing") {
        fireCd -= dt * 60;
        if (fireCd <= 0) {
          if (wepOn("shot") || wepOn("option")) fireNormal();
          fireCd = Math.max(3, 8 - upgrades.rate * 1.1);
        }
        missileCd -= dt * 60;
        if (missileCd <= 0 && wepLv("missile") > 0) {
          fireMissiles();
          const m = wepLv("missile");
          const c = wepLv("cluster");
          missileCd = Math.max(22, 48 - m * 6 - c * 4);
        }
        particleCd -= dt * 60;
        if (particleCd <= 0 && wepLv("particle") > 0) {
          fireParticle();
          const p = wepLv("particle");
          const o = wepLv("overdrive");
          particleCd = Math.max(28, 70 - p * 8 - o * 6);
        }
        lockCd -= dt * 60;
        if (lockCd <= 0 && wepLv("lockon") > 0) {
          fireLockOn();
          const l = wepLv("lockon");
          const h = wepLv("hyper");
          lockCd = Math.max(10, 22 - l * 2 - h * 2);
        }

        // spawn
        if (!bossSpawned) {
          spawnTimer--;
          if (spawnTimer <= 0) {
            spawnEnemy();
            spawnTimer = Math.max(18, 50 - stage * 2);
          }
          if (stageKills >= stageQuota) spawnBoss();
        }

        // enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
          const e = enemies[i];
          e.phase += dt * 3;
          if (e.flash > 0) e.flash--;
          if (e.boss) {
            const def = bossById(e.bossId);
            if (e.y < 70) e.y += 0.6;
            else {
              const move = def.move;
              if (move % 4 === 0) e.x += Math.sin(e.phase * 0.7) * 1.4;
              else if (move % 4 === 1) e.x += Math.sin(e.phase) * 2.2;
              else if (move % 4 === 2) {
                e.x += Math.cos(e.phase * 0.5) * 1.8;
                e.y = 70 + Math.sin(e.phase * 0.4) * 20;
              } else e.x += Math.sin(e.phase * 1.3) * 1.1;
              e.x = Math.max(PLAY_L + e.w / 2, Math.min(PLAY_R - e.w / 2, e.x));
            }
          } else {
            e.x += e.vx;
            e.y += e.vy;
            if (e.type === 2) e.x += Math.sin(e.phase) * 0.8;
            if (e.x < PLAY_L + 8 || e.x > PLAY_R - 8) e.vx *= -1;
          }
          e.fireCd--;
          if (e.fireCd <= 0 && e.y > 20 && e.y < BASE_H - 40) {
            enemyShoot(e);
            e.fireCd = e.boss ? 28 + (e.bossId % 20) : 50 + Math.random() * 40;
          }
          if (!e.boss && e.y > BASE_H + 30) enemies.splice(i, 1);
          // collide player
          if (
            invuln <= 0 &&
            Math.abs(e.x - player.x) < (e.w + player.w) * 0.35 &&
            Math.abs(e.y - player.y) < (e.h + player.h) * 0.35
          ) {
            hitPlayer();
            if (!e.boss) {
              damageEnemy(e, 999, e.x, e.y);
            }
          }
        }

        // bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          b.life--;
          if (b.kind === "missile" && b.from === "p") {
            let t = b.targetId ? findEnemy(b.targetId) : undefined;
            if (!t) {
              const n = nearestEnemies(1)[0];
              if (n) {
                b.targetId = n.id;
                t = n;
              }
            }
            if (t) {
              const ang = Math.atan2(t.y - b.y, t.x - b.x);
              const cur = Math.atan2(b.vy, b.vx);
              let diff = ang - cur;
              while (diff > Math.PI) diff -= Math.PI * 2;
              while (diff < -Math.PI) diff += Math.PI * 2;
              const na = cur + Math.max(-b.turn, Math.min(b.turn, diff));
              const sp = Math.hypot(b.vx, b.vy) || 3;
              b.vx = Math.cos(na) * Math.min(5.5, sp + 0.05);
              b.vy = Math.sin(na) * Math.min(5.5, sp + 0.05);
            }
          }
          b.x += b.vx;
          b.y += b.vy;
          if (b.life <= 0 || b.y < -20 || b.y > BASE_H + 20 || b.x < PLAY_L - 20 || b.x > PLAY_R + 20) {
            bullets.splice(i, 1);
            continue;
          }
          if (b.from === "p") {
            for (const e of enemies) {
              if (Math.abs(b.x - e.x) < e.w / 2 + b.w && Math.abs(b.y - e.y) < e.h / 2 + b.h) {
                damageEnemy(e, b.dmg, b.x, b.y);
                if (b.kind !== "particle") {
                  bullets.splice(i, 1);
                }
                if (opts.shake) shake = Math.min(10, shake + 1);
                break;
              }
            }
          } else if (invuln <= 0) {
            if (Math.abs(b.x - player.x) < 6 && Math.abs(b.y - player.y) < 7) {
              hitPlayer();
              bullets.splice(i, 1);
            }
          }
        }
      }
    }

    function draw() {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      const ox = shake ? (Math.random() - 0.5) * shake : 0;
      const oy = shake ? (Math.random() - 0.5) * shake : 0;
      ctx.save();
      ctx.translate(ox, oy);
      fillRect(PLAY_L, 0, PLAY_W, BASE_H, "#000");

      if (mode === "attract") drawAttract();
      else if (mode === "shop") drawShop();
      else if (mode === "options") drawOptions();
      else {
        for (const s of stars) fillRect(s.x, s.y, s.s, s.s, s.s > 1 ? "#aaffaa" : "#446644");

        if (mode === "playing" || mode === "ready" || mode === "stageclear" || mode === "bossintro") {
          for (const bm of beams) {
            ctx.strokeStyle = bm.color;
            ctx.globalAlpha = Math.min(1, bm.life / 6);
            ctx.lineWidth = 1 + upgrades.lockon * 0.4;
            ctx.beginPath();
            ctx.moveTo(player.x, player.y - 6);
            ctx.lineTo(bm.tx, bm.ty);
            ctx.stroke();
            ctx.strokeRect(bm.tx - 6, bm.ty - 6, 12, 12);
            ctx.globalAlpha = 1;
          }
          for (const b of bullets) {
            if (b.from === "e") fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, "#ff3333");
            else if (b.kind === "missile") {
              fillRect(b.x - 2, b.y - 2, 4, 4, "#ffaa00");
              fillRect(b.x - 1, b.y + 2, 2, 3, "#ff4400");
            } else if (b.kind === "particle") {
              fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, "#66eeff");
              fillRect(b.x - b.w / 4, b.y - b.h / 2, b.w / 2, b.h, "#ffffff");
            } else {
              fillRect(
                b.x - b.w / 2,
                b.y - b.h / 2,
                b.w,
                b.h,
                upgrades.power >= 2 ? "#ffaa44" : "#ffff44",
              );
            }
          }
          for (const e of enemies) drawEnemy(e);
          if (shield > 0) {
            ctx.strokeStyle = frame % 8 < 4 ? "#66ffff" : "#2288aa";
            ctx.beginPath();
            ctx.arc(player.x, player.y, 14, 0, Math.PI * 2);
            ctx.stroke();
          }
          drawShip(player.x, player.y, 1, invuln > 0 && Math.floor(invuln / 3) % 2 === 0);
          drawOptionUnits();
          for (const p of particles) {
            ctx.globalAlpha = Math.max(0, p.life / p.max);
            fillRect(p.x, p.y, p.size, p.size, p.color);
          }
          ctx.globalAlpha = 1;
          for (const f of floats) {
            ctx.globalAlpha = Math.min(1, f.life / 20);
            text(f.text, f.x, f.y, f.color, 8, "center");
          }
          ctx.globalAlpha = 1;
          drawVStick();
        }

        if (mode === "ready") {
          text(`STAGE ${stage}`, BASE_W / 2, BASE_H / 2 - 10, "#00ffaa", 16, "center");
          text("GET READY", BASE_W / 2, BASE_H / 2 + 12, "#ffffff", 10, "center");
        }
        if (mode === "bossintro") {
          fillRect(PLAY_L + 10, BASE_H / 2 - 40, PLAY_W - 20, 70, "#220011");
          ctx.strokeStyle = frame % 12 < 6 ? "#ff2244" : "#880000";
          ctx.strokeRect(PLAY_L + 10.5, BASE_H / 2 - 39.5, PLAY_W - 21, 69);
          text("WARNING!", BASE_W / 2, BASE_H / 2 - 28, "#ff2244", 16, "center");
          text("BOSS APPROACHING", BASE_W / 2, BASE_H / 2 - 6, "#ffaa00", 10, "center");
          text(bossName, BASE_W / 2, BASE_H / 2 + 14, "#ff66ff", 12, "center");
        }
        if (mode === "stageclear") {
          text("STAGE CLEAR", BASE_W / 2, BASE_H / 2 - 8, "#ffff00", 14, "center");
          text("BOSS DEFEATED", BASE_W / 2, BASE_H / 2 + 12, "#ff66ff", 10, "center");
          text("→ POWER SHOP", BASE_W / 2, BASE_H / 2 + 28, "#ffff66", 9, "center");
        }
        if (mode === "gameover") {
          text("GAME OVER", BASE_W / 2, BASE_H / 2 - 8, "#ff2244", 18, "center");
          text(`SCORE ${score}`, BASE_W / 2, BASE_H / 2 + 16, "#00ff88", 12, "center");
          text(`PTS LEFT ${pts}`, BASE_W / 2, BASE_H / 2 + 32, "#ffff66", 10, "center");
        }
        if (mode === "name") {
          text("ENTER YOUR NAME!", BASE_W / 2, BASE_H * 0.28, "#ff3333", 12, "center");
          text("BEST PLAYERS", BASE_W / 2, BASE_H * 0.36, "#00ffaa", 10, "center");
          text(
            `1ST  ${String(Math.max(hi, 50000)).padStart(7, "0")}  SWF`,
            BASE_W / 2,
            BASE_H * 0.44,
            "#fff",
            9,
            "center",
          );
          text(`2ND  030000  FOR`, BASE_W / 2, BASE_H * 0.5, "#fff", 9, "center");
          text(
            `3RD  ${String(score).padStart(7, "0")}  ${nameChars.join("")}`,
            BASE_W / 2,
            BASE_H * 0.56,
            "#ff66ff",
            9,
            "center",
          );
          for (let i = 0; i < 3; i++) {
            const col = i === nameIdx && nameBlink % 20 < 12 ? "#ffff00" : "#00ff00";
            text(nameChars[i], BASE_W / 2 - 20 + i * 20, BASE_H * 0.64, col, 16, "center");
          }
        }
        if (mode !== "name") drawHud();
      }

      ctx.restore();
      drawBezel();
      if (opts.scanlines) {
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        for (let y = 0; y < BASE_H; y += 2) ctx.fillRect(PLAY_L, y, PLAY_W, 1);
      }
    }

    let last = performance.now();
    function loop(now: number) {
      if (!running) return;
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05;
      update(dt);
      draw();
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    function clientToGame(clientX: number, clientY: number) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * BASE_W,
        y: ((clientY - rect.top) / rect.height) * BASE_H,
      };
    }
    function shiftLetter(dir: number) {
      const cur = LETTERS.indexOf(nameChars[nameIdx]);
      nameChars[nameIdx] = LETTERS[(cur + dir + LETTERS.length) % LETTERS.length];
    }

    function shopTap(gx: number, gy: number) {
      if (gx < PLAY_L || gx > PLAY_R) {
        if (shopMid) closeShop();
        return;
      }
      const items = visibleShopItems();
      const rowH = 20;
      const startY = 70;
      const maxVisible = 11;
      const scroll = shopScroll(items, maxVisible);
      for (let vi = 0; vi < Math.min(maxVisible, items.length); vi++) {
        const i = vi + scroll;
        const y = startY + vi * rowH;
        if (gy >= y - 1 && gy < y + rowH - 1) {
          shopCursor = i;
          buyItem(items[i]);
          return;
        }
      }
      if (gy >= BASE_H - 46 && gy <= BASE_H - 30) {
        shopCursor = items.length;
        closeShop();
        return;
      }
      if (gy >= BASE_H - 28 && gy <= BASE_H - 12) {
        shopCursor = items.length + 1;
        openOptions("shop");
      }
    }

    function optionsHitRow(gy: number): number {
      const rows = buildOptRows();
      const maxVisible = 14;
      const startY = 48;
      const rowH = 18;
      let scroll = 0;
      if (rows.length > maxVisible) {
        scroll = Math.max(0, Math.min(optCursor, rows.length - maxVisible));
        if (optCursor < scroll) scroll = optCursor;
        if (optCursor >= scroll + maxVisible) scroll = optCursor - maxVisible + 1;
      }
      for (let vi = 0; vi < Math.min(maxVisible, rows.length); vi++) {
        const i = vi + scroll;
        const y = startY + vi * rowH;
        if (gy >= y - 1 && gy < y + rowH - 1) return i;
      }
      return -1;
    }
    function optionsPtrDown(gx: number, gy: number) {
      if (gx < PLAY_L || gx > PLAY_R) {
        closeOptions();
        return;
      }
      optPtr = true;
      optPtrX = gx;
      optPtrY = gy;
      optSwipeCarry = 0;
      optDidSwipe = false;
      const hit = optionsHitRow(gy);
      if (hit >= 0) {
        const rows = buildOptRows();
        if (rows[hit].kind !== "header") optCursor = hit;
      }
    }
    function optionsPtrMove(gx: number, gy: number) {
      if (!optPtr || mode !== "options") return;
      const rows = buildOptRows();
      const row = rows[optCursor];
      if (!row || (row.kind !== "vol" && row.kind !== "sense" && row.kind !== "weapon")) {
        optPtrX = gx;
        optPtrY = gy;
        return;
      }
      const dx = gx - optPtrX;
      const dy = gy - optPtrY;
      if (Math.abs(dx) < Math.abs(dy) * 0.7) {
        optPtrX = gx;
        optPtrY = gy;
        return;
      }
      optSwipeCarry += dx;
      optPtrX = gx;
      optPtrY = gy;
      const step = row.kind === "weapon" ? 18 : 14;
      while (optSwipeCarry >= step) {
        adjustOption(1);
        optSwipeCarry -= step;
        optDidSwipe = true;
      }
      while (optSwipeCarry <= -step) {
        adjustOption(-1);
        optSwipeCarry += step;
        optDidSwipe = true;
      }
    }
    function optionsPtrUp(gx: number, gy: number) {
      if (!optPtr) return;
      optPtr = false;
      if (optDidSwipe) {
        optDidSwipe = false;
        return;
      }
      if (gx < PLAY_L || gx > PLAY_R) return;
      const hit = optionsHitRow(gy);
      if (hit < 0) return;
      optCursor = hit;
      const rows = buildOptRows();
      const row = rows[hit];
      if (!row || row.kind === "header") return;
      if (row.kind === "back") {
        closeOptions();
        return;
      }
      if (row.kind === "vol" || row.kind === "sense" || row.kind === "weapon") {
        optMsg =
          row.kind === "weapon"
            ? "左右スワイプで強度 (0=OFF〜解放Lv)"
            : "左右スワイプで調整";
        optMsgT = 55;
        sfxUi();
        return;
      }
      adjustOption(1);
    }

    function setStickFrom(gx: number, gy: number) {
      const dx = gx - stickBaseX;
      const dy = gy - stickBaseY;
      const len = Math.hypot(dx, dy);
      if (len > STICK_R) {
        stickNX = dx / len;
        stickNY = dy / len;
      } else if (len < 0.001) {
        stickNX = 0;
        stickNY = 0;
      } else {
        stickNX = dx / STICK_R;
        stickNY = dy / STICK_R;
      }
    }

    function onDown(clientX: number, clientY: number) {
      const g = clientToGame(clientX, clientY);
      unlockAudio();
      if (
        mode !== "attract" &&
        g.x > PLAY_R - 36 &&
        g.y > BASE_H - 28 &&
        g.x < PLAY_R + 4
      ) {
        mutedFlag = toggleMute();
        opts.muted = mutedFlag;
        saveOpts();
        if (!mutedFlag) {
          if (mode === "shop" || mode === "options") startBgm("attract");
          else if (mode === "bossintro" || (mode === "playing" && bossSpawned))
            startBossBgm(bossForStage(stage).vibe, stage);
          else if (mode === "playing" || mode === "ready") startBgm("play", stage);
        }
        sfxUi();
        return;
      }
      if (mode === "attract") {
        attractTap(g.x, g.y);
        return;
      }
      if (mode === "options") {
        optionsPtrDown(g.x, g.y);
        return;
      }
      if (mode === "shop") {
        shopTap(g.x, g.y);
        return;
      }
      if (mode === "gameover" && modeTimer < 60) {
        mode = "attract";
        startBgm("attract");
        return;
      }
      if (mode === "name") {
        if (g.x < BASE_W / 3) shiftLetter(-1);
        else if (g.x > (BASE_W * 2) / 3) shiftLetter(1);
        else {
          nameIdx++;
          if (nameIdx >= 3) {
            mode = "attract";
            startBgm("attract");
          }
        }
        return;
      }
      if (
        (mode === "playing" || mode === "ready" || mode === "bossintro") &&
        (g.x < PLAY_L || g.x > PLAY_R)
      ) {
        openShop(true);
        return;
      }
      if (mode === "playing" || mode === "ready" || mode === "bossintro") {
        if (opts.vstick) {
          stickActive = true;
          stickBaseX = Math.max(PLAY_L + STICK_R, Math.min(PLAY_R - STICK_R, g.x));
          stickBaseY = Math.max(40 + STICK_R, Math.min(BASE_H - 20, g.y));
          stickNX = 0;
          stickNY = 0;
        } else {
          pointerActive = true;
          pointerX = Math.max(PLAY_L + 10, Math.min(PLAY_R - 10, g.x));
          pointerY = Math.max(36, Math.min(BASE_H - 18, g.y));
        }
      }
    }

    function onMove(clientX: number, clientY: number) {
      if (mode === "options" && optPtr) {
        const g = clientToGame(clientX, clientY);
        optionsPtrMove(g.x, g.y);
        return;
      }
      const g = clientToGame(clientX, clientY);
      if (opts.vstick && stickActive) {
        setStickFrom(g.x, g.y);
        return;
      }
      if (!pointerActive) return;
      pointerX = Math.max(PLAY_L + 10, Math.min(PLAY_R - 10, g.x));
      pointerY = Math.max(36, Math.min(BASE_H - 18, g.y));
    }

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      onDown(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      onMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (mode === "options" && optPtr) {
        const t = e.changedTouches[0];
        if (t) {
          const g = clientToGame(t.clientX, t.clientY);
          optionsPtrUp(g.x, g.y);
        } else optionsPtrUp(optPtrX, optPtrY);
        return;
      }
      pointerActive = false;
      resetStick();
    };
    const onMouseDown = (e: MouseEvent) => onDown(e.clientX, e.clientY);
    const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const onMouseUp = (e: MouseEvent) => {
      if (mode === "options" && optPtr) {
        const g = clientToGame(e.clientX, e.clientY);
        optionsPtrUp(g.x, g.y);
        return;
      }
      pointerActive = false;
      resetStick();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      keys.add(e.key);
      unlockAudio();
      if (e.key === "m" || e.key === "M") {
        mutedFlag = toggleMute();
        opts.muted = mutedFlag;
        saveOpts();
        if (!mutedFlag) {
          if (mode === "shop" || mode === "attract" || mode === "options") startBgm("attract");
          else if (mode === "playing" && bossSpawned)
            startBossBgm(bossForStage(stage).vibe, stage);
          else if (mode === "playing" || mode === "ready") startBgm("play", stage);
        }
        return;
      }
      if (mode === "options") {
        const rows = buildOptRows();
        const skipHeader = (from: number, dir: number) => {
          let c = from;
          for (let n = 0; n < rows.length; n++) {
            c = (c + dir + rows.length) % rows.length;
            if (rows[c].kind !== "header") return c;
          }
          return from;
        };
        if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
          optCursor = skipHeader(optCursor, -1);
          sfxUi();
        }
        if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
          optCursor = skipHeader(optCursor, 1);
          sfxUi();
        }
        if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") adjustOption(-1);
        if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") adjustOption(1);
        if (e.key === "Enter" || e.key === " ") {
          const row = rows[optCursor];
          if (row?.kind === "back") closeOptions();
          else adjustOption(1);
        }
        if (e.key === "Escape") closeOptions();
        return;
      }
      if (mode === "attract") {
        if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
          attractSel = (attractSel + 3) % 4;
          if (attractSel === 0) difficulty = "easy";
          if (attractSel === 1) difficulty = "normal";
          sfxUi();
        }
        if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
          attractSel = (attractSel + 1) % 4;
          if (attractSel === 0) difficulty = "easy";
          if (attractSel === 1) difficulty = "normal";
          sfxUi();
        }
        if (e.key === " " || e.key === "Enter") {
          if (attractSel === 3) openOptions("attract");
          else beginGame();
        }
        return;
      }
      if (
        (e.key === "p" || e.key === "P" || e.key === "Tab") &&
        (mode === "playing" || mode === "ready" || mode === "bossintro")
      ) {
        e.preventDefault();
        openShop(true);
        return;
      }
      if (mode === "shop") {
        const items = visibleShopItems();
        const maxC = items.length + 1;
        if (e.key === "ArrowUp" || e.key === "w" || e.key === "W")
          shopCursor = (shopCursor + maxC) % (maxC + 1);
        if (e.key === "ArrowDown" || e.key === "s" || e.key === "S")
          shopCursor = (shopCursor + 1) % (maxC + 1);
        if (e.key === "Enter" || e.key === " ") {
          if (shopCursor === items.length) closeShop();
          else if (shopCursor === items.length + 1) openOptions("shop");
          else buyItem(items[shopCursor]);
        }
        if (e.key === "Escape" && shopMid) closeShop();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.key);
    };

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // test hook
    (window as unknown as { __swipeForceTest?: object }).__swipeForceTest = {
      mode: () => mode,
      start: () => beginGame(),
      openShop: () => openShop(true),
      openOptions: () => openOptions("shop"),
      setVstick: (v: boolean) => {
        opts.vstick = v;
        saveOpts();
      },
    };

    startBgm("attract");

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      stopBgm();
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="flex h-dvh w-full items-center justify-center bg-black"
      style={{ touchAction: "none" }}
    >
      <canvas ref={canvasRef} className="max-h-full max-w-full" />
    </div>
  );
}
