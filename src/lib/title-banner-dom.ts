/**
 * Title-screen sponsor strips in leftover black around the canvas:
 *  - bottom-left — YouTube ad video thumbnail + label only
 *  - top-right — partner custom image (or "広告募集中" placeholder)
 *    portrait: top letterbox · landscape: right-side gutter
 * DOM overlays outside the game canvas so they sit in the black margins.
 */

import {
  getAdWatchVideos,
  pickAdVideoBiased,
  type AdVideo,
} from "@/components/game/engine/modes/media-watch";
import { fetchMediaCatalog } from "@/lib/media-catalog-api";
import { fetchBannerPool, billPartnerBanner } from "@/lib/partner-banner-api";
import { openPartnerPortal } from "@/lib/partner-portal-url";
import { bannerUrlTrackKey, isExternalHttpUrl, openUrlCushion } from "@/lib/url-cushion";
import { translate } from "@/lib/i18n";
import { tutorialProgress } from "@/lib/tutorial";

const ROOT_ID = "sf-title-banner";
const ROOT_TR_ID = "sf-title-strip-tr";
const ROOT_TL_ID = "sf-title-strip-tl";
const ROTATE_MS = 12_000;
/** Practical strip height (~85px). Full letterbox is often too tall. */
const TARGET_STRIP_H = 85;
/** Shown when no partner image is configured */
const WANTED_URL = "/sponsor-wanted.png";

export type TitleBannerDomOpts = {
  host: HTMLElement;
  getPlayerId: () => string;
  getLinked?: () => boolean;
  onNeedLink?: () => void;
  /** true only on title attract screens */
  isVisible: () => boolean;
  onOpen: (videoId: string | null) => void;
  onOpenHelp?: () => void;
  sfxUi?: () => void;
};

export type TitleBannerDomHandle = {
  destroy: () => void;
  refresh: () => void;
};

function thumbUrl(id: string): string {
  return `https://i.ytimg.com/vi/${encodeURIComponent(id)}/mqdefault.jpg`;
}

function ensureHostRelative(host: HTMLElement) {
  if (getComputedStyle(host).position === "static") {
    host.style.position = "relative";
  }
}

export function mountTitleBannerDom(
  opts: TitleBannerDomOpts,
): TitleBannerDomHandle {
  try {
    document.getElementById(ROOT_ID)?.remove();
  } catch {
    /* */
  }
  try {
    document.getElementById(ROOT_TR_ID)?.remove();
  } catch {
    /* */
  }
  try {
    document.getElementById(ROOT_TL_ID)?.remove();
  } catch {
    /* */
  }

  const host = opts.host;
  ensureHostRelative(host);

  // ── bottom-left strip (video ads only) ──
  const root = document.createElement("button");
  root.id = ROOT_ID;
  root.type = "button";
  root.setAttribute("aria-label", "広告視聴バナー");
  root.style.cssText = [
    "position:absolute",
    "left:max(6px, env(safe-area-inset-left, 0px))",
    "bottom:0px",
    "z-index:30",
    "display:none",
    "width:min(48vw, 200px)",
    "height:56px",
    "padding:0",
    "margin:0",
    "border:1px solid #3a6a4a",
    "border-radius:10px 10px 0 0",
    "overflow:hidden",
    "background:#041008",
    "box-shadow:0 4px 16px #000c, 0 0 0 1px #0a2010",
    "cursor:pointer",
    "touch-action:manipulation",
    "text-align:left",
    "font-family:system-ui,sans-serif",
    "-webkit-tap-highlight-color:transparent",
    "box-sizing:border-box",
  ].join(";");

  const inner = document.createElement("div");
  inner.style.cssText =
    "display:flex;align-items:stretch;width:100%;height:100%;gap:0";

  const thumb = document.createElement("div");
  thumb.style.cssText =
    "width:72px;flex-shrink:0;background:#0a1810 center/cover no-repeat";

  const meta = document.createElement("div");
  meta.style.cssText =
    "flex:1;min-width:0;padding:6px 8px 5px;display:flex;flex-direction:column;justify-content:center;gap:2px";

  const tag = document.createElement("div");
  tag.style.cssText =
    "font-size:9px;font-weight:800;letter-spacing:.06em;color:#6a9;line-height:1";
  tag.textContent = "WATCH AD";

  const title = document.createElement("div");
  title.style.cssText =
    "font-size:11px;font-weight:800;color:#cfe;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2";
  title.textContent = "…";

  const cta = document.createElement("div");
  cta.style.cssText = "font-size:9px;color:#8c6;line-height:1.2";
  cta.textContent = "タップで視聴";

  meta.append(tag, title, cta);
  inner.append(thumb, meta);
  root.appendChild(inner);
  host.appendChild(root);

  // ── top-right image strip (partner images / 募集中) ──
  const tr = document.createElement("button");
  tr.id = ROOT_TR_ID;
  tr.type = "button";
  tr.setAttribute("aria-label", "スポンサーバナー");
  tr.dataset.slot = "hidden";
  tr.style.cssText = [
    "position:absolute",
    "right:max(6px, env(safe-area-inset-right, 0px))",
    "top:0px",
    "z-index:30",
    "display:none",
    "width:min(52vw, 220px)",
    "height:56px",
    "padding:0",
    "margin:0",
    "border:1px solid #3a5a6a",
    "border-radius:0 0 10px 10px",
    "overflow:hidden",
    "background:#040810 center/cover no-repeat",
    "box-shadow:0 4px 16px #000c, 0 0 0 1px #0a1820",
    "cursor:pointer",
    "touch-action:manipulation",
    "-webkit-tap-highlight-color:transparent",
    "box-sizing:border-box",
  ].join(";");

  const trBadge = document.createElement("div");
  trBadge.style.cssText = [
    "position:absolute",
    "left:6px",
    "bottom:5px",
    "padding:2px 6px",
    "border-radius:4px",
    "font-size:9px",
    "font-weight:800",
    "letter-spacing:.04em",
    "color:#9cf",
    "background:rgba(0,12,20,.72)",
    "border:1px solid rgba(80,140,180,.45)",
    "pointer-events:none",
    "font-family:system-ui,sans-serif",
  ].join(";");
  trBadge.textContent = "SPONSOR";
  tr.appendChild(trBadge);
  host.appendChild(tr);

  // ── top-left how-to strip (mirrors sponsor, leftover black) ──
  const tl = document.createElement("button");
  tl.id = ROOT_TL_ID;
  tl.type = "button";
  tl.setAttribute("aria-label", translate("help.title"));
  tl.dataset.slot = "hidden";
  tl.style.cssText = [
    "position:absolute",
    "left:max(6px, env(safe-area-inset-left, 0px))",
    "top:0px",
    "z-index:30",
    "display:none",
    "width:min(46vw, 200px)",
    "height:56px",
    "padding:0",
    "margin:0",
    "border:1px solid #4a6a3a",
    "border-radius:0 0 10px 10px",
    "overflow:hidden",
    "background:linear-gradient(180deg,#102818,#06140c)",
    "box-shadow:0 4px 16px #000c, 0 0 0 1px #0a2010",
    "cursor:pointer",
    "touch-action:manipulation",
    "text-align:left",
    "font-family:system-ui,sans-serif",
    "-webkit-tap-highlight-color:transparent",
    "box-sizing:border-box",
  ].join(";");
  const tlInner = document.createElement("div");
  tlInner.style.cssText =
    "display:flex;align-items:stretch;width:100%;height:100%;gap:0";
  const tlMark = document.createElement("div");
  tlMark.style.cssText =
    "width:44px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:22px;background:#0a2014";
  tlMark.textContent = "📖";
  const tlMeta = document.createElement("div");
  tlMeta.style.cssText =
    "flex:1;min-width:0;padding:6px 8px 5px;display:flex;flex-direction:column;justify-content:center;gap:2px";
  const tlTag = document.createElement("div");
  tlTag.style.cssText =
    "font-size:9px;font-weight:800;letter-spacing:.06em;color:#8c6;line-height:1";
  const tlTitle = document.createElement("div");
  tlTitle.style.cssText =
    "font-size:11px;font-weight:800;color:#cfe;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2";
  const tlCta = document.createElement("div");
  tlCta.style.cssText = "font-size:9px;color:#8c6;line-height:1.2";
  tlMeta.append(tlTag, tlTitle, tlCta);
  tlInner.append(tlMark, tlMeta);
  tl.appendChild(tlInner);
  host.appendChild(tl);

  const paintTl = () => {
    const prog = tutorialProgress();
    tlTag.textContent = translate("help.bannerTag");
    tlTitle.textContent = translate("help.menu").replace(/^📖\s*/, "");
    tlCta.textContent =
      prog.got > 0
        ? `${translate("help.bannerCta")} · ${translate("help.bannerProg", { got: prog.got, all: prog.all })}`
        : translate("help.bannerCta");
    tl.setAttribute("aria-label", translate("help.title"));
    tl.style.display = canShowTl() ? "block" : "none";
  };

  const measureLetterbox = (): {
    bottom: number;
    top: number;
    topAvail: number;
    rightAvail: number;
    leftAvail: number;
  } => {
    const canvas = host.querySelector("canvas");
    const hr = host.getBoundingClientRect();
    let bottom = TARGET_STRIP_H;
    let top = TARGET_STRIP_H;
    let topAvail = 0;
    let rightAvail = 0;
    let leftAvail = 0;
    if (canvas) {
      const cr = canvas.getBoundingClientRect();
      // canvas not laid out yet — don't steal the whole screen as "letterbox"
      if (cr.width < 80 || cr.height < 80) {
        return {
          bottom: 0,
          top: 0,
          topAvail: 0,
          rightAvail: 0,
          leftAvail: 0,
        };
      }
      const botAvail = Math.max(0, Math.round(hr.bottom - cr.bottom));
      topAvail = Math.max(0, Math.round(cr.top - hr.top));
      rightAvail = Math.max(0, Math.round(hr.right - cr.right));
      leftAvail = Math.max(0, Math.round(cr.left - hr.left));
      const fit = (avail: number) => {
        if (avail <= 0) {
          return Math.max(
            44,
            Math.min(TARGET_STRIP_H, Math.round(hr.height * 0.08)),
          );
        }
        if (avail < 56) return Math.max(40, avail - 4);
        return Math.min(TARGET_STRIP_H, avail - 6);
      };
      bottom = fit(botAvail);
      top = topAvail > 0 ? fit(topAvail) : 0;
    } else {
      const band = Math.max(
        56,
        Math.min(TARGET_STRIP_H, Math.round(hr.height * 0.1)),
      );
      bottom = band;
      top = band;
      topAvail = band;
      rightAvail = Math.max(0, Math.round(hr.width * 0.22));
      leftAvail = rightAvail;
    }
    return {
      bottom: Math.max(40, Math.min(TARGET_STRIP_H, bottom)),
      top: top > 0 ? Math.max(40, Math.min(TARGET_STRIP_H, top)) : 0,
      topAvail,
      rightAvail,
      leftAvail,
    };
  };

  const layoutLetterbox = () => {
    const { bottom, top, topAvail, rightAvail, leftAvail } = measureLetterbox();
    const hostW = host.getBoundingClientRect().width;
    const pad = 8;

    root.style.bottom = "0px";
    if (bottom >= 36) {
      root.style.height = `${bottom}px`;
      root.style.width = `${Math.min(Math.round(bottom * 3.2), Math.round(hostW * 0.5), 280)}px`;
      root.dataset.slot = "bottom";
    } else {
      root.style.height = "0px";
      root.dataset.slot = "hidden";
    }
    const tw = Math.max(48, Math.min(96, Math.round(bottom * 1.15)));
    thumb.style.width = `${tw}px`;

    const placeTopBand = (el: HTMLElement, side: "left" | "right") => {
      el.style.top = "0px";
      el.style.bottom = "auto";
      if (side === "left") {
        el.style.left = "max(6px, env(safe-area-inset-left, 0px))";
        el.style.right = "auto";
      } else {
        el.style.right = "max(6px, env(safe-area-inset-right, 0px))";
        el.style.left = "auto";
      }
      el.style.borderRadius = "0 0 10px 10px";
      el.style.height = `${top}px`;
      const maxW = Math.min(Math.round(top * 2.8), Math.round(hostW * 0.4), 220);
      el.style.width = `${maxW}px`;
      el.dataset.slot = "top";
    };

    const placeSide = (el: HTMLElement, side: "left" | "right", avail: number) => {
      const h = Math.min(
        TARGET_STRIP_H,
        Math.max(48, Math.min(72, Math.round(avail / 2.4))),
      );
      const maxW = avail - pad * 2;
      const w = Math.min(Math.round(h * 3.0), maxW, 280);
      if (w < 96) {
        el.dataset.slot = "hidden";
        if (el.style.display !== "none") el.style.display = "none";
        return false;
      }
      el.style.top = `${pad}px`;
      el.style.bottom = "auto";
      if (side === "left") {
        el.style.left = `${pad}px`;
        el.style.right = "auto";
      } else {
        el.style.right = `${pad}px`;
        el.style.left = "auto";
      }
      el.style.borderRadius = "10px";
      el.style.height = `${h}px`;
      el.style.width = `${w}px`;
      el.dataset.slot = "side";
      return true;
    };

    if (topAvail >= 36 && top > 0) {
      placeTopBand(tr, "right");
      placeTopBand(tl, "left");
    } else {
      if (rightAvail >= 112) placeSide(tr, "right", rightAvail);
      else {
        tr.dataset.slot = "hidden";
        if (tr.style.display !== "none") tr.style.display = "none";
      }
      if (leftAvail >= 112) placeSide(tl, "left", leftAvail);
      else {
        // never overlay the playfield — sit in the bottom letterbox, right of the ad
        const adW = parseInt(root.style.width || "0", 10) || Math.round(hostW * 0.42);
        const gap = 8;
        const left = adW + pad + gap;
        const maxW = Math.max(96, hostW - left - pad);
        const w = Math.min(Math.round(bottom * 2.4), maxW, 200);
        if (bottom >= 40 && w >= 96) {
          tl.style.top = "auto";
          tl.style.bottom = "0px";
          tl.style.left = `${left}px`;
          tl.style.right = "auto";
          tl.style.borderRadius = "10px 10px 0 0";
          tl.style.height = `${bottom}px`;
          tl.style.width = `${w}px`;
          tl.dataset.slot = "bottom";
        } else {
          tl.dataset.slot = "hidden";
          if (tl.style.display !== "none") tl.style.display = "none";
        }
      }
    }

    try {
      (window as unknown as { __sfBannerMaxH?: number }).__sfBannerMaxH = bottom;
      (window as unknown as { __sfBannerTopMaxH?: number }).__sfBannerTopMaxH =
        top;
    } catch {
      /* */
    }
  };
  layoutLetterbox();
  const ro = new ResizeObserver(() => layoutLetterbox());
  try {
    ro.observe(host);
  } catch {
    /* */
  }
  window.addEventListener("resize", layoutLetterbox);

  let video: AdVideo | null = null;
  let pickedAt = 0;
  let rotateTimer: ReturnType<typeof setInterval> | null = null;
  let visTimer: ReturnType<typeof setInterval> | null = null;
  let catalogReady = false;

  let imagePool: { id?: string; url: string; href?: string }[] = [];
  let trUrl: string | null = null;
  let trHref: string | null = null;
  let trId: string | null = null;
  let trIsWanted = true;
  let trPickedAt = 0;

  const paintBl = () => {
    if (!video) {
      thumb.style.backgroundImage = "none";
      thumb.style.backgroundColor = "#0a2010";
      title.textContent = translate("bannerWanted");
      title.style.color = "#8a9";
      cta.textContent = "配信開始をお待ちください";
      cta.style.color = "#567";
      tag.textContent = "WATCH AD";
      return;
    }
    thumb.style.backgroundImage = `url("${thumbUrl(video.id)}")`;
    thumb.style.backgroundColor = "#000";
    title.textContent = (video.label || video.id).slice(0, 18);
    title.style.color = "#cfe";
    cta.textContent = "タップで視聴 · コインGET";
    cta.style.color = "#8c6";
    tag.textContent = "WATCH AD";
  };

  const canShowTr = () =>
    opts.isVisible() &&
    (tr.dataset.slot === "top" || tr.dataset.slot === "side");
  const canShowTl = () =>
    opts.isVisible() &&
    (tl.dataset.slot === "top" ||
      tl.dataset.slot === "side" ||
      tl.dataset.slot === "bottom");

  const paintTr = () => {
    const url = trUrl || WANTED_URL;
    const safe = url.replace(/"/g, "");
    tr.style.backgroundImage = `url("${safe}")`;
    tr.style.backgroundColor = "#000";
    if (trIsWanted || !trUrl) {
      trBadge.textContent = "募集中";
      trBadge.style.color = "#9df";
      trBadge.style.borderColor = "rgba(80,160,200,.5)";
      tr.style.cursor = "pointer";
    } else {
      trBadge.textContent = trHref ? "SPONSOR" : "SPONSOR";
      trBadge.style.color = "#9cf";
      trBadge.style.borderColor = "rgba(80,140,180,.45)";
      tr.style.cursor = trHref ? "pointer" : "default";
    }
    tr.style.display = canShowTr() ? "block" : "none";
  };

  /** Top-right: partner images only; else 広告募集中 placeholder */
  const pickTr = (force = false) => {
    const now = Date.now();
    if (!force && now - trPickedAt < ROTATE_MS && trUrl) return;

    if (imagePool.length > 0) {
      let next = imagePool[Math.floor(Math.random() * imagePool.length)]!;
      if (imagePool.length > 1 && trUrl) {
        for (let i = 0; i < 6; i++) {
          const c = imagePool[Math.floor(Math.random() * imagePool.length)]!;
          if (c.url !== trUrl) {
            next = c;
            break;
          }
        }
      }
      trUrl = next.url;
      trHref = String(next.href || "").trim() || null;
      trId = String(next.id || "").trim() || null;
      trIsWanted = false;
      trPickedAt = now;
      paintTr();
      if (trId) {
        void billPartnerBanner(opts.getPlayerId() || "", trId, "impress");
      }
      return;
    }

    trUrl = WANTED_URL;
    trHref = null;
    trId = null;
    trIsWanted = true;
    trPickedAt = now;
    paintTr();
  };

  /** Bottom-left: catalog video thumbs only (no partner images) */
  const pickBl = (force = false) => {
    const now = Date.now();
    if (!force && now - pickedAt < ROTATE_MS && video) return;

    const pool = getAdWatchVideos();
    if (!pool.length) {
      video = null;
      pickedAt = now;
      paintBl();
      return;
    }
    let next = pickAdVideoBiased(now + Math.random() * 1e6);
    if (video && next && next.id === video.id && pool.length > 1) {
      next = pickAdVideoBiased(now + 77_001) || next;
    }
    video = next;
    pickedAt = now;
    paintBl();
  };

  const syncVisibility = () => {
    const show = opts.isVisible();
    root.style.display = show && root.dataset.slot !== "hidden" ? "block" : "none";
    if (show) {
      layoutLetterbox();
      paintTr();
      paintTl();
      root.style.display = show && root.dataset.slot !== "hidden" ? "block" : "none";
    } else {
      tr.style.display = "none";
      tl.style.display = "none";
    }
    if (show && catalogReady) {
      pickBl(false);
      pickTr(false);
    }
  };

  const onClick = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    opts.sfxUi?.();
    opts.onOpen(video?.id || null);
  };
  root.addEventListener("click", onClick);
  root.addEventListener(
    "touchstart",
    (e) => {
      e.stopPropagation();
    },
    { passive: true },
  );

  const onTrClick = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    opts.sfxUi?.();
    if (trHref && !trIsWanted && isExternalHttpUrl(trHref)) {
      openUrlCushion({
        trackKey: bannerUrlTrackKey(trId || undefined),
        url: trHref,
        contextLabel: "スポンサーバナー",
        playerId: opts.getPlayerId() || "",
        linked: !!opts.getLinked?.(),
        onNeedLink: opts.onNeedLink,
        requireLinkToOpen: false,
        onOpened: () => {
          if (trId) {
            void billPartnerBanner(opts.getPlayerId() || "", trId, "click");
          }
        },
      });
      return;
    }
    // same-origin / no href: no 20-min credit
    if (trHref && !trIsWanted) {
      try {
        window.open(trHref, "_blank", "noopener,noreferrer");
      } catch {
        /* */
      }
      return;
    }
    // 募集中 → 広告主ポータル
    if (trIsWanted) {
      openPartnerPortal();
    }
  };
  tr.addEventListener("click", onTrClick);
  tr.addEventListener(
    "touchstart",
    (e) => {
      e.stopPropagation();
    },
    { passive: true },
  );

  const onTlClick = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    opts.sfxUi?.();
    opts.onOpenHelp?.();
  };
  tl.addEventListener("click", onTlClick);
  tl.addEventListener(
    "touchstart",
    (e) => {
      e.stopPropagation();
    },
    { passive: true },
  );

  void Promise.all([fetchMediaCatalog(), fetchBannerPool()]).then(
    ([r, banners]) => {
      catalogReady = true;
      imagePool = (banners || []).filter((b) => !!b?.url);
      pickBl(true);
      pickTr(true);
      void r;
      syncVisibility();
    },
  );

  rotateTimer = setInterval(() => {
    if (opts.isVisible()) {
      pickBl(true);
      pickTr(true);
    }
  }, ROTATE_MS);
  visTimer = setInterval(syncVisibility, 400);
  // default: show wanted until pool loads
  trUrl = WANTED_URL;
  trIsWanted = true;
  syncVisibility();
  paintBl();
  paintTr();

  return {
    destroy: () => {
      if (rotateTimer) clearInterval(rotateTimer);
      if (visTimer) clearInterval(visTimer);
      try {
        ro.disconnect();
      } catch {
        /* */
      }
      try {
        window.removeEventListener("resize", layoutLetterbox);
      } catch {
        /* */
      }
      root.removeEventListener("click", onClick);
      tr.removeEventListener("click", onTrClick);
      tl.removeEventListener("click", onTlClick);
      try {
        root.remove();
      } catch {
        /* */
      }
      try {
        tr.remove();
      } catch {
        /* */
      }
      try {
        tl.remove();
      } catch {
        /* */
      }
    },
    refresh: () => {
      void Promise.all([fetchMediaCatalog(), fetchBannerPool()]).then(
        ([, banners]) => {
          imagePool = (banners || []).filter((b) => !!b?.url);
          pickBl(true);
          pickTr(true);
        },
      );
    },
  };
}
