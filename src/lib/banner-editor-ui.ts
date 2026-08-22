/**
 * JPDOC: バナーキャンバス編集。未ログインでも使える。文字プリセットは連携時クラウド。
 */
/**
 * Banner crop editor for non-designers.
 * Place images + movable text, crop frame H≤85 / W=H×(1.5…5.0), export JPEG.
 */
// @ts-nocheck

import {
  deleteCloudTextPreset,
  loadAllTextPresets,
  removeLocalTextPreset,
  saveCloudTextPreset,
  type StripTextPreset,
  upsertLocalTextPreset,
} from "@/lib/strip-text-presets";
import { translate } from "@/lib/i18n";

export type BannerEditorOpts = {
  onSave: (dataUrl: string, meta: { width: number; height: number; ratio: number }) => void;
  onCancel?: () => void;
  sfxUi?: () => void;
  sfxOk?: () => void;
  maxH?: number;
  minRatio?: number;
  maxRatio?: number;
  maxBytes?: number;
  playerId?: string | null;
};

type ImageLayer = {
  kind: "image";
  id: number;
  img: HTMLImageElement;
  cx: number;
  cy: number;
  scale: number;
  rot: number;
};

type TextLayer = {
  kind: "text";
  id: number;
  text: string;
  cx: number;
  cy: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  rot: number;
  opacity: number;
  shadow: boolean;
  shadowBlur: number;
  shadowColor: string;
  outline: boolean;
  outlineWidth: number;
  outlineColor: string;
};

type Layer = ImageLayer | TextLayer;

var STAGE_W = 640;
var STAGE_H = 360;
var FONTS = [
  { id: "system", label: translate("editor.fontSystem"), stack: "system-ui,Segoe UI,sans-serif" },
  { id: "sans", label: translate("editor.fontSans"), stack: '"Hiragino Sans","Noto Sans JP",Meiryo,sans-serif' },
  { id: "serif", label: translate("editor.fontSerif"), stack: '"Hiragino Mincho ProN","Noto Serif JP",serif' },
  { id: "mono", label: translate("editor.fontMono"), stack: "ui-monospace,Consolas,monospace" },
  { id: "impact", label: translate("editor.fontImpact"), stack: "Impact,Haettenschweiler,Arial Black,sans-serif" },
  { id: "rounded", label: translate("editor.fontRound"), stack: '"M PLUS Rounded 1c","Hiragino Maru Gothic ProN",sans-serif' },
  { id: "pixel", label: translate("editor.fontPixel"), stack: '"Courier New",monospace' }
];

function clampOpacity(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 100;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function normalizeHex(raw: string, fallback: string): string {
  let s = String(raw || "").trim();
  if (!s.startsWith("#")) s = `#${s}`;
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    s = `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
  }
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
  return fallback;
}

function hexToRgba(hex: string, alpha01: number): string {
  const h = normalizeHex(hex, "#000000").slice(1);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = Math.max(0, Math.min(1, alpha01));
  return `rgba(${r},${g},${b},${a})`;
}

async function canvasToJpegBlob(canvas, maxBytes) {
  let q = 0.92;
  const toBlob = (quality) => new Promise((resolve) => {
    try {
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
    } catch {
      resolve(null);
    }
  });
  let blob = await toBlob(q);
  while (blob && blob.size > maxBytes && q > 0.4) {
    q -= 0.08;
    blob = await toBlob(q);
  }
  if (!blob) {
    let dataUrl2 = canvas.toDataURL("image/jpeg", q);
    while (dataUrl2.length * 0.75 > maxBytes && q > 0.4) {
      q -= 0.08;
      dataUrl2 = canvas.toDataURL("image/jpeg", q);
    }
    const bin = atob(dataUrl2.split(",")[1] || "");
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    blob = new Blob([arr], { type: "image/jpeg" });
  }
  const dataUrl = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => reject(new Error("read"));
    r.readAsDataURL(blob);
  });
  return { blob, dataUrl, quality: q };
}
async function downloadBlob(blob, filename) {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        a.remove();
        URL.revokeObjectURL(url);
      } catch {
      }
    }, 2e3);
    return true;
  } catch {
    return false;
  }
}
async function shareOrDownload(blob, filename) {
  const file = new File([blob], filename, { type: "image/jpeg" });
  try {
    const nav = navigator;
    if (nav.canShare?.({ files: [file] }) && nav.share) {
      await nav.share({ files: [file], title: "SWIPE FORCE banner" });
      return "share";
    }
  } catch (e) {
    if (String(e).includes("Abort") || String(e).includes("cancel")) {
      return "share";
    }
  }
  const ok = await downloadBlob(blob, filename);
  return ok ? "download" : "fail";
}
function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("load"));
    };
    img.src = url;
  });
}
function fontSpec(L) {
  return `${L.bold ? "700" : "600"} ${L.fontSize}px ${L.fontFamily}`;
}
function measureText(ctx, L) {
  ctx.save();
  ctx.font = fontSpec(L);
  const m = ctx.measureText(L.text || " ");
  const w = Math.max(8, m.width);
  const h = L.fontSize * 1.25;
  ctx.restore();
  return { w, h };
}
function imageSize(L) {
  return {
    w: L.img.naturalWidth * L.scale,
    h: L.img.naturalHeight * L.scale
  };
}
function layerBounds(ctx, L) {
  if (L.kind === "image") {
    const { w: w2, h: h2 } = imageSize(L);
    const rad2 = L.rot * Math.PI / 180;
    const c2 = Math.abs(Math.cos(rad2));
    const s2 = Math.abs(Math.sin(rad2));
    const bw2 = w2 * c2 + h2 * s2;
    const bh2 = w2 * s2 + h2 * c2;
    return { x: L.cx - bw2 / 2, y: L.cy - bh2 / 2, w: bw2, h: bh2 };
  }
  const { w, h } = measureText(ctx, L);
  const rad = L.rot * Math.PI / 180;
  const c = Math.abs(Math.cos(rad));
  const s = Math.abs(Math.sin(rad));
  const bw = w * c + h * s;
  const bh = w * s + h * c;
  return { x: L.cx - bw / 2, y: L.cy - bh / 2, w: bw, h: bh };
}
function drawLayer(ctx, L, selected) {
  ctx.save();
  ctx.translate(L.cx, L.cy);
  ctx.rotate(L.rot * Math.PI / 180);
  if (L.kind === "image") {
    const { w, h } = imageSize(L);
    try {
      ctx.drawImage(L.img, -w / 2, -h / 2, w, h);
    } catch {
    }
    if (selected) {
      ctx.strokeStyle = "#6af";
      ctx.lineWidth = 2;
      ctx.strokeRect(-w / 2, -h / 2, w, h);
    }
  } else {
    ctx.font = fontSpec(L);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const text = L.text || "テキスト";
    const alpha = clampOpacity(L.opacity) / 100;
    if (L.shadow) {
      ctx.shadowColor = hexToRgba(L.shadowColor, alpha);
      ctx.shadowBlur = L.shadowBlur;
      ctx.shadowOffsetX = Math.max(1, L.shadowBlur * 0.35);
      ctx.shadowOffsetY = Math.max(1, L.shadowBlur * 0.35);
    } else {
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
    ctx.globalAlpha = alpha;
    if (L.outline && L.outlineWidth > 0) {
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;
      ctx.lineWidth = L.outlineWidth * 2;
      ctx.strokeStyle = normalizeHex(L.outlineColor, "#000000");
      ctx.strokeText(text, 0, 0);
    }
    ctx.fillStyle = normalizeHex(L.color, "#ffffff");
    ctx.fillText(text, 0, 0);
    ctx.globalAlpha = 1;
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    if (selected) {
      const { w, h } = measureText(ctx, L);
      ctx.strokeStyle = "#6af";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-w / 2 - 4, -h / 2 - 2, w + 8, h + 4);
    }
  }
  ctx.restore();
}
export function openBannerEditor(opts: BannerEditorOpts) {
  try {
    document.getElementById("sf-banner-editor")?.remove();
  } catch {
  }
  const maxH = Math.max(40, Math.min(120, opts.maxH ?? 85));
  const minRatio = opts.minRatio ?? 1.5;
  const maxRatio = opts.maxRatio ?? 5;
  const maxBytes = opts.maxBytes ?? 200 * 1024;
  const playerId = (opts.playerId || "").trim();
  let textPresets = [];
  let ratio = 3;
  let cropH = maxH;
  let cropW = Math.round(cropH * ratio);
  let layers = [];
  let selected = -1;
  let nextId = 1;
  let bg = "#0a1810";
  let drag = null;
  let cropX = Math.round((STAGE_W - cropW) / 2);
  let cropY = Math.round((STAGE_H - cropH) / 2);
  const root = document.createElement("div");
  root.id = "sf-banner-editor";
  root.style.cssText = "position:fixed;inset:0;z-index:10050;background:#000c;display:flex;align-items:center;justify-content:center;padding:10px;box-sizing:border-box;font-family:system-ui,sans-serif";
  root.addEventListener("pointerdown", (e) => e.stopPropagation());
  const card = document.createElement("div");
  card.style.cssText = "width:min(740px,100%);max-height:min(96vh,920px);overflow:auto;background:#0c141c;border:1px solid #3a6a8a;border-radius:14px;padding:12px;box-shadow:0 12px 40px #000a;color:#def";
  root.appendChild(card);
  document.body.appendChild(root);
  const head = document.createElement("div");
  head.style.cssText = "display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px";
  head.innerHTML = `
    <div>
      <div style="font-size:15px;font-weight:800;color:#9ef">${translate("editor.title")}</div>
      <div style="font-size:10px;color:#8ab;margin-top:2px;line-height:1.4">
        ${translate("editor.lead", { h: maxH, min: minRatio, max: maxRatio })}
      </div>
    </div>
    <button type="button" id="sf-be-x" style="border:0;background:transparent;color:#9ab;font-size:22px;cursor:pointer;line-height:1">\xD7</button>
  `;
  card.appendChild(head);
  const fontOpts = FONTS.map(
    (f) => `<option value="${f.id}">${f.label}</option>`
  ).join("");
  const controls = document.createElement("div");
  controls.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px";
  controls.innerHTML = `
    <div style="grid-column:1/-1;display:flex;flex-wrap:wrap;gap:6px">
      <label style="flex:1;min-width:100px;padding:8px;border-radius:8px;border:1px solid #6af;background:#1a4060;color:#dff;font-size:12px;font-weight:700;text-align:center;cursor:pointer">
        ${translate("editor.addImg")}
        <input id="sf-be-file" type="file" accept="image/*" multiple style="display:none" />
      </label>
      <button type="button" id="sf-be-add-text" style="flex:1;min-width:100px;padding:8px;border-radius:8px;border:1px solid #8c4;background:#1a4028;color:#dfe;font-size:12px;font-weight:700;cursor:pointer">${translate("editor.addText")}</button>
      <button type="button" id="sf-be-clear" style="padding:8px 10px;border-radius:8px;border:1px solid #a44;background:#301018;color:#fcc;font-size:12px;cursor:pointer">${translate("editor.clear")}</button>
      <button type="button" id="sf-be-fit" style="padding:8px 10px;border-radius:8px;border:1px solid #456;background:#122028;color:#bcd;font-size:12px;cursor:pointer">${translate("editor.fit")}</button>
    </div>
    <div>
      <label style="font-size:10px;color:#8ab">${translate("editor.height")} <span id="sf-be-h-val">${cropH}</span>px</label>
      <input id="sf-be-h" type="range" min="40" max="${maxH}" value="${cropH}" step="1" style="width:100%" />
    </div>
    <div>
      <label style="font-size:10px;color:#8ab">${translate("editor.ratio")} <span id="sf-be-r-val">${ratio.toFixed(2)}</span>（${translate("editor.width")} <span id="sf-be-w-val">${cropW}</span>px）</label>
      <input id="sf-be-r" type="range" min="${minRatio}" max="${maxRatio}" value="${ratio}" step="0.05" style="width:100%" />
    </div>
    <div style="grid-column:1/-1;background:#0a1820;border:1px solid #264;border-radius:10px;padding:8px">
      <div style="font-size:10px;font-weight:700;color:#9ec;margin-bottom:6px">${translate("editor.layers")}</div>
      <label style="font-size:10px;color:#8ab">${translate("editor.select")}</label>
      <select id="sf-be-layer" style="width:100%;box-sizing:border-box;padding:8px;border-radius:8px;border:1px solid #456;background:#0a1520;color:#eef;font-size:12px;margin:2px 0 8px">
        <option value="-1">${translate("editor.noLayer")}</option>
      </select>
      <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">
        <button type="button" id="sf-be-z-bot" title="${translate("editor.zBot")}" style="flex:1;min-width:56px;padding:8px;border-radius:8px;border:1px solid #456;background:#122;color:#cde;font-size:11px;cursor:pointer">${translate("editor.zBot")}</button>
        <button type="button" id="sf-be-z-down" title="${translate("editor.zDown")}" style="flex:1;min-width:56px;padding:8px;border-radius:8px;border:1px solid #456;background:#122;color:#cde;font-size:11px;cursor:pointer">${translate("editor.zDown")}</button>
        <button type="button" id="sf-be-z-up" title="${translate("editor.zUp")}" style="flex:1;min-width:56px;padding:8px;border-radius:8px;border:1px solid #456;background:#122;color:#cde;font-size:11px;cursor:pointer">${translate("editor.zUp")}</button>
        <button type="button" id="sf-be-z-top" title="${translate("editor.zTop")}" style="flex:1;min-width:56px;padding:8px;border-radius:8px;border:1px solid #456;background:#122;color:#cde;font-size:11px;cursor:pointer">${translate("editor.zTop")}</button>
      </div>
      <div style="font-size:10px;font-weight:700;color:#9ec;margin-bottom:6px">${translate("editor.layerOps")}</div>
      <div style="display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap">
        <button type="button" id="sf-be-zm-out" style="flex:1;min-width:48px;padding:8px;border-radius:8px;border:1px solid #456;background:#122;color:#cde;cursor:pointer">−</button>
        <button type="button" id="sf-be-zm-in" style="flex:1;min-width:48px;padding:8px;border-radius:8px;border:1px solid #456;background:#122;color:#cde;cursor:pointer">＋</button>
        <button type="button" id="sf-be-rot-l" style="flex:1;min-width:48px;padding:8px;border-radius:8px;border:1px solid #456;background:#122;color:#cde;cursor:pointer">↺</button>
        <button type="button" id="sf-be-rot-r" style="flex:1;min-width:48px;padding:8px;border-radius:8px;border:1px solid #456;background:#122;color:#cde;cursor:pointer">↻</button>
        <button type="button" id="sf-be-del" style="flex:1;min-width:48px;padding:8px;border-radius:8px;border:1px solid #a44;background:#301018;color:#fcc;cursor:pointer">${translate("editor.del")}</button>
      </div>
      <label style="font-size:10px;color:#8ab">${translate("editor.rot")} <span id="sf-be-rot-val">0</span>\xB0</label>
      <input id="sf-be-rot" type="range" min="-180" max="180" value="0" step="1" style="width:100%;margin-bottom:6px" />
      <div id="sf-be-text-panel" style="display:none">
        <label style="font-size:10px;color:#8ab">${translate("editor.text")}</label>
        <input id="sf-be-text" type="text" value="" maxlength="80" style="width:100%;box-sizing:border-box;padding:8px;border-radius:8px;border:1px solid #456;background:#0a1520;color:#eef;font-size:13px;margin:2px 0 6px" />
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
          <div>
            <label style="font-size:10px;color:#8ab">${translate("editor.font")}</label>
            <select id="sf-be-font" style="width:100%;padding:8px;border-radius:8px;border:1px solid #456;background:#0a1520;color:#eef;font-size:12px">${fontOpts}</select>
          </div>
          <div>
            <label style="font-size:10px;color:#8ab">${translate("editor.color")}</label>
            <div style="display:flex;gap:6px;align-items:center">
              <input id="sf-be-color" type="color" value="#ffffff" style="width:44px;height:32px;border:0;background:transparent;cursor:pointer;flex-shrink:0" />
              <input id="sf-be-color-hex" type="text" value="#ffffff" maxlength="7" spellcheck="false" style="flex:1;min-width:0;padding:6px;border-radius:8px;border:1px solid #456;background:#0a1520;color:#eef;font-size:12px;font-family:ui-monospace,monospace" />
            </div>
          </div>
          <div>
            <label style="font-size:10px;color:#8ab">${translate("editor.size")} <span id="sf-be-fs-val">28</span></label>
            <input id="sf-be-fs" type="range" min="10" max="96" value="28" step="1" style="width:100%" />
          </div>
          <div style="display:flex;align-items:flex-end;padding-bottom:4px">
            <label style="display:inline-flex;gap:6px;align-items:center;font-size:12px;cursor:pointer">
              <input type="checkbox" id="sf-be-bold" checked /> ${translate("editor.bold")}
            </label>
          </div>
          <div style="grid-column:1/-1">
            <label style="font-size:10px;color:#8ab">${translate("editor.opacity")} <span id="sf-be-op-val">100</span>%</label>
            <input id="sf-be-op" type="range" min="0" max="100" value="100" step="1" style="width:100%" />
          </div>
          <div style="grid-column:1/-1;padding:8px;border-radius:8px;border:1px solid #345;background:#081018">
            <label style="display:inline-flex;gap:6px;align-items:center;font-size:12px;cursor:pointer;margin-bottom:6px">
              <input type="checkbox" id="sf-be-shadow" checked /> ${translate("editor.shadow")}
            </label>
            <div style="font-size:10px;color:#8ab;margin-bottom:4px">${translate("editor.shadowC")}</div>
            <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">
              <input id="sf-be-shadow-c" type="color" value="#000000" title="影の色" style="width:44px;height:32px;border:0;background:transparent;cursor:pointer;flex-shrink:0" />
              <input id="sf-be-shadow-hex" type="text" value="#000000" maxlength="7" spellcheck="false" style="flex:1;min-width:0;padding:6px;border-radius:8px;border:1px solid #456;background:#0a1520;color:#eef;font-size:12px;font-family:ui-monospace,monospace" />
            </div>
            <label style="font-size:10px;color:#8ab">${translate("editor.blur")} <span id="sf-be-sb-val">6</span></label>
            <input id="sf-be-sb" type="range" min="0" max="24" value="6" step="1" style="width:100%" />
          </div>
          <div style="grid-column:1/-1;padding:8px;border-radius:8px;border:1px solid #345;background:#081018">
            <label style="display:inline-flex;gap:6px;align-items:center;font-size:12px;cursor:pointer;margin-bottom:6px">
              <input type="checkbox" id="sf-be-outline" checked /> ${translate("editor.outline")}
            </label>
            <div style="font-size:10px;color:#8ab;margin-bottom:4px">${translate("editor.outlineC")}</div>
            <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">
              <input id="sf-be-outline-c" type="color" value="#000000" title="縁取りの色" style="width:44px;height:32px;border:0;background:transparent;cursor:pointer;flex-shrink:0" />
              <input id="sf-be-outline-hex" type="text" value="#000000" maxlength="7" spellcheck="false" style="flex:1;min-width:0;padding:6px;border-radius:8px;border:1px solid #456;background:#0a1520;color:#eef;font-size:12px;font-family:ui-monospace,monospace" />
            </div>
            <label style="font-size:10px;color:#8ab">${translate("editor.thick")} <span id="sf-be-ow-val">3</span></label>
            <input id="sf-be-ow" type="range" min="1" max="12" value="3" step="1" style="width:100%" />
          </div>
          <div style="grid-column:1/-1;margin-top:8px;padding-top:8px;border-top:1px solid #234">
            <div style="font-size:10px;font-weight:700;color:#9ec;margin-bottom:6px">${translate("editor.presets")}</div>
            <select id="sf-be-preset" style="width:100%;box-sizing:border-box;padding:8px;border-radius:8px;border:1px solid #456;background:#0a1520;color:#eef;font-size:12px;margin-bottom:6px">
              <option value="">${translate("editor.noPreset")}</option>
            </select>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">
              <button type="button" id="sf-be-preset-apply" style="flex:1;min-width:70px;padding:8px;border-radius:8px;border:1px solid #6af;background:#1a4060;color:#dff;font-size:11px;font-weight:700;cursor:pointer">${translate("editor.apply")}</button>
              <button type="button" id="sf-be-preset-del" style="flex:1;min-width:70px;padding:8px;border-radius:8px;border:1px solid #a44;background:#301018;color:#fcc;font-size:11px;cursor:pointer">${translate("editor.del")}</button>
            </div>
            <label style="font-size:10px;color:#8ab">${translate("editor.saveNamed")}</label>
            <div style="display:flex;gap:6px;margin-top:2px">
              <input id="sf-be-preset-name" type="text" maxlength="40" placeholder="${translate("editor.namePh")}" style="flex:1;min-width:0;padding:8px;border-radius:8px;border:1px solid #456;background:#0a1520;color:#eef;font-size:12px" />
              <button type="button" id="sf-be-preset-save" style="padding:8px 10px;border-radius:8px;border:1px solid #8c4;background:#1a4028;color:#dfe;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap">${translate("editor.save")}</button>
            </div>
            <div id="sf-be-preset-hint" style="font-size:9px;color:#678;margin-top:4px;line-height:1.35">${translate("editor.presetHint")}</div>
          </div>
        </div>
      </div>
    </div>
    <div style="grid-column:1/-1">
      <label style="font-size:10px;color:#8ab">${translate("editor.bg")}</label>
      <div style="display:flex;gap:6px;align-items:center">
        <input id="sf-be-bg" type="color" value="${bg}" style="width:48px;height:32px;border:0;background:transparent;cursor:pointer" />
        <button type="button" data-bg="#000000" class="sf-be-bgp" style="flex:1;padding:6px;border-radius:6px;border:1px solid #345;background:#000;color:#888;font-size:10px;cursor:pointer">${translate("editor.bgBlack")}</button>
        <button type="button" data-bg="#0a1810" class="sf-be-bgp" style="flex:1;padding:6px;border-radius:6px;border:1px solid #345;background:#0a1810;color:#6a8;font-size:10px;cursor:pointer">${translate("editor.bgGreen")}</button>
        <button type="button" data-bg="#ffffff" class="sf-be-bgp" style="flex:1;padding:6px;border-radius:6px;border:1px solid #345;background:#fff;color:#333;font-size:10px;cursor:pointer">${translate("editor.bgWhite")}</button>
      </div>
    </div>
  `;
  const stageDock = document.createElement("div");
  stageDock.style.cssText = "flex-shrink:0;position:sticky;top:0;z-index:5;background:linear-gradient(180deg,#0e1820 0%,#0c141c 100%);border-bottom:1px solid #2a4a5a;padding:6px 10px 8px;box-shadow:0 6px 16px #0008";
  const stageHint = document.createElement("div");
  stageHint.style.cssText = "display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px";
  stageHint.innerHTML = `
    <div style="font-size:10px;color:#8cf;font-weight:700">${translate("editor.canvas")}</div>
    <div id="sf-be-dock-meta" style="font-size:9px;color:#8ab;font-variant-numeric:tabular-nums">${cropW}\xD7${cropH}</div>
  `;
  stageDock.appendChild(stageHint);
  const stageWrap = document.createElement("div");
  stageWrap.style.cssText = "position:relative;width:100%;background:#050a0e;border:1px solid #3a6a8a;border-radius:10px;overflow:hidden;touch-action:none;user-select:none";
  const canvas = document.createElement("canvas");
  canvas.width = STAGE_W;
  canvas.height = STAGE_H;
  canvas.style.cssText = "display:block;width:100%;height:auto;max-height:min(28vh,220px);object-fit:contain;cursor:grab;background:#050a0e";
  stageWrap.appendChild(canvas);
  stageDock.appendChild(stageWrap);
  const previewRow = document.createElement("div");
  previewRow.style.cssText = "display:flex;gap:8px;align-items:center;margin-top:6px;flex-wrap:wrap";
  previewRow.innerHTML = `
    <div style="font-size:9px;color:#8ab;white-space:nowrap">${translate("editor.export")}</div>
    <canvas id="sf-be-prev" width="${cropW}" height="${cropH}" style="border:1px solid #456;border-radius:4px;image-rendering:auto;max-height:36px;width:auto;background:#000"></canvas>
    <div id="sf-be-status" style="font-size:10px;color:#9ab;flex:1;min-width:100px;line-height:1.3">${translate("editor.status")}</div>
  `;
  stageDock.appendChild(previewRow);
  card.appendChild(stageDock);
  const scrollBody = document.createElement("div");
  scrollBody.style.cssText = "flex:1;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;padding:10px 12px 8px";
  controls.style.marginBottom = "0";
  scrollBody.appendChild(controls);
  card.appendChild(scrollBody);
  const foot = document.createElement("div");
  foot.style.cssText = "flex-shrink:0;display:flex;gap:8px;padding:10px 12px 12px;border-top:1px solid #234;background:#0a1218;z-index:4";
  foot.innerHTML = `
    <button type="button" id="sf-be-cancel" style="flex:1;padding:12px;border-radius:8px;border:1px solid #456;background:#122028;color:#bcd;font-weight:700;cursor:pointer">${translate("editor.cancel")}</button>
    <button type="button" id="sf-be-save" style="flex:2;padding:12px;border-radius:8px;border:1px solid #6af;background:#1a4060;color:#dff;font-weight:800;cursor:pointer">${translate("editor.saveDl")}</button>
  `;
  card.appendChild(foot);
  const ctx = canvas.getContext("2d");
  const prev = previewRow.querySelector("#sf-be-prev");
  const pctx = prev.getContext("2d");
  const statusEl = previewRow.querySelector("#sf-be-status");
  const hVal = controls.querySelector("#sf-be-h-val");
  const rVal = controls.querySelector("#sf-be-r-val");
  const wVal = controls.querySelector("#sf-be-w-val");
  const rotVal = controls.querySelector("#sf-be-rot-val");
  const textPanel = controls.querySelector("#sf-be-text-panel");
  const setStatus = (s) => {
    statusEl.textContent = s;
  };
  const syncCropSize = () => {
    cropH = Math.max(40, Math.min(maxH, cropH));
    cropW = Math.round(cropH * ratio);
    cropX = Math.max(0, Math.min(STAGE_W - cropW, cropX));
    cropY = Math.max(0, Math.min(STAGE_H - cropH, cropY));
    hVal.textContent = String(cropH);
    rVal.textContent = ratio.toFixed(2);
    wVal.textContent = String(cropW);
    prev.width = cropW;
    prev.height = cropH;
  };
  const sel = () => selected >= 0 && selected < layers.length ? layers[selected] : null;
  const layerLabel = (L, index) => {
    const z = index + 1;
    const total = layers.length;
    if (L.kind === "image") {
      const name = L.img.__name;
      const base = name || `画像#${L.id}`;
      return `${z}/${total} \xB7 \u{1F5BC} ${base}`;
    }
    const tx = (L.text || "テキスト").slice(0, 16);
    return `${z}/${total} \xB7 Ｔ ${tx}`;
  };
  const syncLayerSelect = () => {
    const selEl = controls.querySelector("#sf-be-layer");
    if (!selEl) return;
    const prev2 = selected;
    selEl.innerHTML = "";
    if (!layers.length) {
      const opt = document.createElement("option");
      opt.value = "-1";
      opt.textContent = "（レイヤーなし）";
      selEl.appendChild(opt);
      selEl.value = "-1";
      return;
    }
    for (let i = layers.length - 1; i >= 0; i--) {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = layerLabel(layers[i], i);
      selEl.appendChild(opt);
    }
    if (prev2 >= 0 && prev2 < layers.length) selEl.value = String(prev2);
    else selEl.value = String(layers.length - 1);
  };
  const moveLayer = (from, to) => {
    if (from < 0 || from >= layers.length) return;
    if (to < 0 || to >= layers.length) return;
    if (from === to) return;
    const [item] = layers.splice(from, 1);
    layers.splice(to, 0, item);
    selected = to;
    setStatus(
      to > from ? `前面へ移動（${to + 1}/${layers.length}）` : `背面へ移動（${to + 1}/${layers.length}）`
    );
    draw();
  };
  const refreshPresetSelect = () => {
    const selEl = controls.querySelector("#sf-be-preset");
    const hint = controls.querySelector("#sf-be-preset-hint");
    if (!selEl) return;
    const cur = selEl.value;
    selEl.innerHTML = "";
    if (!textPresets.length) {
      const o = document.createElement("option");
      o.value = "";
      o.textContent = "（保存済みなし）";
      selEl.appendChild(o);
    } else {
      const ph = document.createElement("option");
      ph.value = "";
      ph.textContent = `— ${textPresets.length}件 —`;
      selEl.appendChild(ph);
      for (const p of textPresets) {
        const o = document.createElement("option");
        o.value = p.id;
        const src = p.source === "cloud" ? "☁" : "\u{1F4F1}";
        o.textContent = `${src} ${p.name} \xB7 ${(p.text || "").slice(0, 12)}`;
        selEl.appendChild(o);
      }
    }
    if (cur && textPresets.some((p) => p.id === cur)) selEl.value = cur;
    if (hint) {
      hint.textContent = playerId ? translate("editor.cloud") : translate("editor.local");
    }
  };
  const reloadPresets = async () => {
    textPresets = await loadAllTextPresets(playerId || null);
    refreshPresetSelect();
  };
  const textLayerToPreset = (L, name, id) => ({
    id: id || `t${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name: (name || L.text || "テキスト").slice(0, 40),
    text: L.text,
    fontSize: L.fontSize,
    fontFamily: L.fontFamily,
    color: L.color,
    bold: L.bold,
    rot: L.rot,
    opacity: clampOpacity(L.opacity),
    shadow: L.shadow,
    shadowBlur: L.shadowBlur,
    shadowColor: normalizeHex(L.shadowColor, "#000000"),
    outline: L.outline,
    outlineWidth: L.outlineWidth,
    outlineColor: normalizeHex(L.outlineColor, "#000000"),
    updatedAt: new Date().toISOString()
  });
  const applyPresetToSelected = (p) => {
    const L = sel();
    if (!L || L.kind !== "text") {
      layers.push({
        kind: "text",
        id: nextId++,
        text: p.text,
        cx: cropX + cropW / 2,
        cy: cropY + cropH / 2,
        fontSize: p.fontSize,
        fontFamily: p.fontFamily,
        color: p.color,
        bold: p.bold,
        rot: p.rot,
        opacity: clampOpacity(p.opacity),
        shadow: p.shadow,
        shadowBlur: p.shadowBlur,
        shadowColor: normalizeHex(p.shadowColor, "#000000"),
        outline: p.outline,
        outlineWidth: p.outlineWidth,
        outlineColor: normalizeHex(p.outlineColor, "#000000")
      });
      selected = layers.length - 1;
    } else {
      L.text = p.text;
      L.fontSize = p.fontSize;
      L.fontFamily = p.fontFamily;
      L.color = p.color;
      L.bold = p.bold;
      L.rot = p.rot;
      L.opacity = clampOpacity(p.opacity);
      L.shadow = p.shadow;
      L.shadowBlur = p.shadowBlur;
      L.shadowColor = normalizeHex(p.shadowColor, "#000000");
      L.outline = p.outline;
      L.outlineWidth = p.outlineWidth;
      L.outlineColor = normalizeHex(p.outlineColor, "#000000");
    }
    setStatus(`プリセット適用: ${p.name}`);
    draw();
  };
  const syncTextPanel = () => {
    const L = sel();
    const isText = L?.kind === "text";
    textPanel.style.display = isText ? "block" : "none";
    const rot = L ? L.rot : 0;
    rotVal.textContent = String(Math.round(rot));
    const rotIn = controls.querySelector("#sf-be-rot");
    if (rotIn) rotIn.value = String(Math.round(rot));
    if (!isText || !L || L.kind !== "text") return;
    const t = L;
    const set = (id, val) => {
      const el = controls.querySelector(`#${id}`);
      if (!el) return;
      if (el instanceof HTMLInputElement && el.type === "checkbox") {
        el.checked = !!val;
      } else {
        el.value = String(val);
      }
    };
    set("sf-be-text", t.text);
    const fontId = FONTS.find((f) => f.stack === t.fontFamily)?.id || "system";
    set("sf-be-font", fontId);
    set("sf-be-color", normalizeHex(t.color, "#ffffff"));
    set("sf-be-color-hex", normalizeHex(t.color, "#ffffff"));
    set("sf-be-fs", t.fontSize);
    const fsVal = controls.querySelector("#sf-be-fs-val");
    if (fsVal) fsVal.textContent = String(t.fontSize);
    set("sf-be-bold", t.bold);
    set("sf-be-op", clampOpacity(t.opacity));
    const opVal = controls.querySelector("#sf-be-op-val");
    if (opVal) opVal.textContent = String(clampOpacity(t.opacity));
    set("sf-be-shadow", t.shadow);
    set("sf-be-shadow-c", normalizeHex(t.shadowColor, "#000000"));
    set("sf-be-shadow-hex", normalizeHex(t.shadowColor, "#000000"));
    set("sf-be-sb", t.shadowBlur);
    const sbVal = controls.querySelector("#sf-be-sb-val");
    if (sbVal) sbVal.textContent = String(t.shadowBlur);
    set("sf-be-outline", t.outline);
    set("sf-be-outline-c", normalizeHex(t.outlineColor, "#000000"));
    set("sf-be-outline-hex", normalizeHex(t.outlineColor, "#000000"));
    set("sf-be-ow", t.outlineWidth);
    const owVal = controls.querySelector("#sf-be-ow-val");
    if (owVal) owVal.textContent = String(t.outlineWidth);
  };
  const paintLayers = (g, ox, oy, withSelect) => {
    g.save();
    g.translate(-ox, -oy);
    for (let i = 0; i < layers.length; i++) {
      drawLayer(g, layers[i], withSelect && i === selected);
    }
    g.restore();
  };
  const draw = () => {
    ctx.save();
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    ctx.strokeStyle = "#0f1a14";
    ctx.lineWidth = 1;
    for (let x = 0; x < STAGE_W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, STAGE_H);
      ctx.stroke();
    }
    for (let y = 0; y < STAGE_H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(STAGE_W, y);
      ctx.stroke();
    }
    for (let i = 0; i < layers.length; i++) {
      drawLayer(ctx, layers[i], i === selected);
    }
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, STAGE_W, cropY);
    ctx.fillRect(0, cropY + cropH, STAGE_W, STAGE_H - cropY - cropH);
    ctx.fillRect(0, cropY, cropX, cropH);
    ctx.fillRect(cropX + cropW, cropY, STAGE_W - cropX - cropW, cropH);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(cropX + 1, cropY + 1, cropW - 2, cropH - 2);
    ctx.setLineDash([]);
    ctx.fillStyle = "#fe8";
    ctx.font = "11px system-ui";
    ctx.fillText(
      `${cropW}\xD7${cropH}  比率 ${ratio.toFixed(2)}`,
      cropX + 4,
      Math.max(12, cropY - 6)
    );
    ctx.restore();
    pctx.fillStyle = bg;
    pctx.fillRect(0, 0, cropW, cropH);
    paintLayers(pctx, cropX, cropY, false);
    syncLayerSelect();
    syncTextPanel();
  };
  const hitLayer = (sx, sy) => {
    for (let i = layers.length - 1; i >= 0; i--) {
      const b = layerBounds(ctx, layers[i]);
      if (sx >= b.x && sx <= b.x + b.w && sy >= b.y && sy <= b.y + b.h) {
        return i;
      }
    }
    return -1;
  };
  const clientToStage = (clientX, clientY) => {
    const r = canvas.getBoundingClientRect();
    return {
      sx: (clientX - r.left) / r.width * STAGE_W,
      sy: (clientY - r.top) / r.height * STAGE_H
    };
  };
  const addImage = async (file) => {
    try {
      const img = await loadImageFromFile(file);
      const fit = Math.min(
        STAGE_W * 0.7 / img.naturalWidth,
        STAGE_H * 0.7 / img.naturalHeight,
        1
      );
      try {
        img.__name = file.name || `image${nextId}`;
      } catch {
      }
      layers.push({
        kind: "image",
        id: nextId++,
        img,
        cx: STAGE_W / 2,
        cy: STAGE_H / 2,
        scale: fit,
        rot: 0
      });
      selected = layers.length - 1;
      setStatus(`画像追加: ${file.name || "image"}`);
      draw();
    } catch {
      setStatus(translate("editor.addImgFail"));
    }
  };
  const addText = () => {
    const stack = FONTS[0].stack;
    layers.push({
      kind: "text",
      id: nextId++,
      text: "SWIPE FORCE",
      cx: STAGE_W / 2,
      cy: STAGE_H / 2,
      fontSize: 28,
      fontFamily: stack,
      color: "#ffffff",
      bold: true,
      rot: 0,
      opacity: 100,
      shadow: true,
      shadowBlur: 6,
      shadowColor: "#000000",
      outline: true,
      outlineWidth: 3,
      outlineColor: "#000000"
    });
    selected = layers.length - 1;
    setStatus(translate("editor.addTextOk"));
    draw();
  };
  const fitSelectedToCrop = () => {
    const L = sel();
    if (!L) return;
    if (L.kind === "image") {
      const iw = L.img.naturalWidth;
      const ih = L.img.naturalHeight;
      L.scale = Math.max(cropW / iw, cropH / ih);
      L.cx = cropX + cropW / 2;
      L.cy = cropY + cropH / 2;
      L.rot = 0;
    } else {
      L.cx = cropX + cropW / 2;
      L.cy = cropY + cropH / 2;
      L.fontSize = Math.max(12, Math.min(64, Math.round(cropH * 0.55)));
      L.rot = 0;
    }
    setStatus(translate("editor.fitted"));
    draw();
  };
  const exportCanvas = () => {
    const out = document.createElement("canvas");
    out.width = Math.max(1, cropW);
    out.height = Math.max(1, cropH);
    const g = out.getContext("2d");
    if (!g) throw new Error("no_2d");
    g.fillStyle = bg;
    g.fillRect(0, 0, cropW, cropH);
    paintLayers(g, cropX, cropY, false);
    return out;
  };
  const showResultPanel = (dataUrl, width, height, bytes) => {
    try {
      document.getElementById("sf-be-result")?.remove();
    } catch {
    }
    const panel = document.createElement("div");
    panel.id = "sf-be-result";
    panel.style.cssText = "position:fixed;inset:0;z-index:10060;background:#000d;display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box";
    panel.innerHTML = `
      <div style="width:min(420px,100%);background:#0c141c;border:1px solid #3a6a8a;border-radius:14px;padding:14px;color:#def;font-family:system-ui,sans-serif">
        <div style="font-size:15px;font-weight:800;color:#9ef;margin-bottom:8px">${translate("editor.doneTitle")}</div>
        <div style="font-size:11px;color:#8ab;margin-bottom:10px">${width}\xD7${height}px \xB7 ${Math.max(1, Math.round(bytes / 1024))}KB</div>
        <div style="background:#000;border:1px solid #345;border-radius:8px;padding:8px;margin-bottom:12px;text-align:center">
          <img id="sf-be-result-img" alt="preview" src="${dataUrl.replace(/"/g, "")}" style="max-width:100%;height:auto;image-rendering:auto;border-radius:4px" />
        </div>
        <div style="font-size:10px;color:#9ab;margin-bottom:10px;line-height:1.4">
          ${translate("editor.doneHint")}
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <button type="button" id="sf-be-dl" style="padding:12px;border-radius:8px;border:1px solid #6af;background:#1a4060;color:#dff;font-weight:800;cursor:pointer">${translate("editor.dl")}</button>
          <button type="button" id="sf-be-done" style="padding:12px;border-radius:8px;border:1px solid #8c4;background:#1a4028;color:#dfe;font-weight:800;cursor:pointer">${translate("editor.done")}</button>
          <button type="button" id="sf-be-back" style="padding:10px;border-radius:8px;border:1px solid #456;background:#122028;color:#bcd;cursor:pointer">${translate("editor.backEdit")}</button>
        </div>
        <div id="sf-be-result-msg" style="font-size:11px;color:#fc8;margin-top:8px;min-height:1.2em"></div>
      </div>
    `;
    document.body.appendChild(panel);
    return panel;
  };
  const mutateSelectedText = (fn) => {
    const L = sel();
    if (!L || L.kind !== "text") return;
    fn(L);
    draw();
    syncTextPanel();
  };
  controls.querySelector("#sf-be-file")?.addEventListener("change", (e) => {
    const input = e.target;
    const files = input.files;
    if (!files?.length) return;
    void (async () => {
      for (const f of Array.from(files)) await addImage(f);
      input.value = "";
    })();
    opts.sfxUi?.();
  });
  controls.querySelector("#sf-be-add-text")?.addEventListener("click", () => {
    addText();
    opts.sfxUi?.();
  });
  controls.querySelector("#sf-be-clear")?.addEventListener("click", () => {
    layers = [];
    selected = -1;
    setStatus(translate("editor.cleared"));
    draw();
    opts.sfxUi?.();
  });
  controls.querySelector("#sf-be-fit")?.addEventListener("click", () => {
    fitSelectedToCrop();
    opts.sfxUi?.();
  });
  controls.querySelector("#sf-be-h")?.addEventListener("input", (e) => {
    const ocx = cropX + cropW / 2;
    const ocy = cropY + cropH / 2;
    cropH = Number(e.target.value) || maxH;
    syncCropSize();
    cropX = Math.round(ocx - cropW / 2);
    cropY = Math.round(ocy - cropH / 2);
    syncCropSize();
    draw();
  });
  controls.querySelector("#sf-be-r")?.addEventListener("input", (e) => {
    const ocx = cropX + cropW / 2;
    const ocy = cropY + cropH / 2;
    ratio = Number(e.target.value) || 3;
    syncCropSize();
    cropX = Math.round(ocx - cropW / 2);
    cropY = Math.round(ocy - cropH / 2);
    syncCropSize();
    draw();
  });
  const scaleSel = (factor) => {
    const L = sel();
    if (!L) return;
    if (L.kind === "image") {
      L.scale = Math.max(0.05, Math.min(8, L.scale * factor));
    } else {
      L.fontSize = Math.max(10, Math.min(96, Math.round(L.fontSize * factor)));
    }
    draw();
  };
  controls.querySelector("#sf-be-zm-in")?.addEventListener("click", () => {
    scaleSel(1.12);
    opts.sfxUi?.();
  });
  controls.querySelector("#sf-be-zm-out")?.addEventListener("click", () => {
    scaleSel(1 / 1.12);
    opts.sfxUi?.();
  });
  controls.querySelector("#sf-be-rot-l")?.addEventListener("click", () => {
    const L = sel();
    if (!L) return;
    L.rot = Math.round(L.rot - 15);
    draw();
    opts.sfxUi?.();
  });
  controls.querySelector("#sf-be-rot-r")?.addEventListener("click", () => {
    const L = sel();
    if (!L) return;
    L.rot = Math.round(L.rot + 15);
    draw();
    opts.sfxUi?.();
  });
  controls.querySelector("#sf-be-rot")?.addEventListener("input", (e) => {
    const L = sel();
    if (!L) return;
    L.rot = Number(e.target.value) || 0;
    draw();
  });
  controls.querySelector("#sf-be-del")?.addEventListener("click", () => {
    if (selected < 0) return;
    layers.splice(selected, 1);
    selected = layers.length ? Math.min(selected, layers.length - 1) : -1;
    setStatus(translate("editor.deleted"));
    draw();
    opts.sfxUi?.();
  });
  controls.querySelector("#sf-be-layer")?.addEventListener("change", (e) => {
    const v = Number(e.target.value);
    if (Number.isFinite(v) && v >= 0 && v < layers.length) {
      selected = v;
      setStatus(`選択: ${layerLabel(layers[v], v)}`);
      draw();
      opts.sfxUi?.();
    }
  });
  controls.querySelector("#sf-be-z-up")?.addEventListener("click", () => {
    if (selected < 0) return;
    moveLayer(selected, Math.min(layers.length - 1, selected + 1));
    opts.sfxUi?.();
  });
  controls.querySelector("#sf-be-z-down")?.addEventListener("click", () => {
    if (selected < 0) return;
    moveLayer(selected, Math.max(0, selected - 1));
    opts.sfxUi?.();
  });
  controls.querySelector("#sf-be-z-top")?.addEventListener("click", () => {
    if (selected < 0) return;
    moveLayer(selected, layers.length - 1);
    opts.sfxUi?.();
  });
  controls.querySelector("#sf-be-z-bot")?.addEventListener("click", () => {
    if (selected < 0) return;
    moveLayer(selected, 0);
    opts.sfxUi?.();
  });
  controls.querySelector("#sf-be-text")?.addEventListener("input", (e) => {
    mutateSelectedText((t) => {
      t.text = e.target.value.slice(0, 80);
    });
  });
  controls.querySelector("#sf-be-font")?.addEventListener("change", (e) => {
    const id = e.target.value;
    const f = FONTS.find((x) => x.id === id) || FONTS[0];
    mutateSelectedText((t) => {
      t.fontFamily = f.stack;
    });
  });
  const bindColorPair = (pickerId, hexId, apply) => {
    controls.querySelector(pickerId)?.addEventListener("input", (e) => {
      const hex = normalizeHex(e.target.value, "#000000");
      mutateSelectedText((t) => apply(t, hex));
    });
    controls.querySelector(hexId)?.addEventListener("change", (e) => {
      const hex = normalizeHex(e.target.value, "");
      if (!hex) {
        setStatus("色は #RRGGBB で入力してください");
        return;
      }
      mutateSelectedText((t) => apply(t, hex));
    });
  };
  bindColorPair("#sf-be-color", "#sf-be-color-hex", (t, hex) => {
    t.color = hex;
  });
  controls.querySelector("#sf-be-op")?.addEventListener("input", (e) => {
    const n = clampOpacity(e.target.value);
    const el = controls.querySelector("#sf-be-op-val");
    if (el) el.textContent = String(n);
    mutateSelectedText((t) => {
      t.opacity = n;
    });
  });
  controls.querySelector("#sf-be-fs")?.addEventListener("input", (e) => {
    const n = Number(e.target.value) || 28;
    const fsVal = controls.querySelector("#sf-be-fs-val");
    if (fsVal) fsVal.textContent = String(n);
    mutateSelectedText((t) => {
      t.fontSize = n;
    });
  });
  controls.querySelector("#sf-be-bold")?.addEventListener("change", (e) => {
    mutateSelectedText((t) => {
      t.bold = e.target.checked;
    });
  });
  controls.querySelector("#sf-be-shadow")?.addEventListener("change", (e) => {
    mutateSelectedText((t) => {
      t.shadow = e.target.checked;
    });
  });
  bindColorPair("#sf-be-shadow-c", "#sf-be-shadow-hex", (t, hex) => {
    t.shadowColor = hex;
  });
  controls.querySelector("#sf-be-sb")?.addEventListener("input", (e) => {
    const n = Number(e.target.value) || 0;
    const el = controls.querySelector("#sf-be-sb-val");
    if (el) el.textContent = String(n);
    mutateSelectedText((t) => {
      t.shadowBlur = n;
    });
  });
  controls.querySelector("#sf-be-outline")?.addEventListener("change", (e) => {
    mutateSelectedText((t) => {
      t.outline = e.target.checked;
    });
  });
  bindColorPair("#sf-be-outline-c", "#sf-be-outline-hex", (t, hex) => {
    t.outlineColor = hex;
  });
  controls.querySelector("#sf-be-ow")?.addEventListener("input", (e) => {
    const n = Number(e.target.value) || 1;
    const el = controls.querySelector("#sf-be-ow-val");
    if (el) el.textContent = String(n);
    mutateSelectedText((t) => {
      t.outlineWidth = n;
    });
  });
  controls.querySelector("#sf-be-preset-apply")?.addEventListener("click", () => {
    const id = controls.querySelector("#sf-be-preset")?.value;
    const p = textPresets.find((x) => x.id === id);
    if (!p) {
      setStatus("プリセットを選んでください");
      return;
    }
    applyPresetToSelected(p);
    opts.sfxUi?.();
  });
  controls.querySelector("#sf-be-preset-save")?.addEventListener("click", () => {
    void (async () => {
      const L = sel();
      if (!L || L.kind !== "text") {
        setStatus("先に文字レイヤーを選択してください");
        opts.sfxUi?.();
        return;
      }
      const nameIn = controls.querySelector("#sf-be-preset-name");
      const name = (nameIn?.value || L.text || "テキスト").trim().slice(0, 40);
      const preset = textLayerToPreset(L, name);
      upsertLocalTextPreset(preset);
      if (playerId) {
        const r = await saveCloudTextPreset(playerId, preset);
        if (!r.ok) {
          setStatus(`端末に保存 \xB7 クラウド失敗 (${r.reason})`);
        } else {
          setStatus(`保存しました（端末+クラウド）: ${name}`);
        }
      } else {
        setStatus(`端末に保存: ${name}`);
      }
      if (nameIn) nameIn.value = name;
      await reloadPresets();
      const selEl = controls.querySelector("#sf-be-preset");
      if (selEl) selEl.value = preset.id;
      opts.sfxOk?.();
    })();
  });
  controls.querySelector("#sf-be-preset-del")?.addEventListener("click", () => {
    void (async () => {
      const id = controls.querySelector("#sf-be-preset")?.value;
      if (!id) {
        setStatus("削除するプリセットを選んでください");
        return;
      }
      if (!confirm("この文字プリセットを削除しますか？")) return;
      removeLocalTextPreset(id);
      if (playerId) await deleteCloudTextPreset(playerId, id);
      await reloadPresets();
      setStatus("プリセットを削除しました");
      opts.sfxUi?.();
    })();
  });
  controls.querySelector("#sf-be-bg")?.addEventListener("input", (e) => {
    bg = e.target.value;
    draw();
  });
  controls.querySelectorAll(".sf-be-bgp").forEach((btn) => {
    btn.addEventListener("click", () => {
      bg = btn.getAttribute("data-bg") || "#000";
      const inp = controls.querySelector("#sf-be-bg");
      if (inp) inp.value = bg;
      draw();
      opts.sfxUi?.();
    });
  });
  const onDown = (clientX, clientY) => {
    const { sx, sy } = clientToStage(clientX, clientY);
    const li = hitLayer(sx, sy);
    if (li >= 0) {
      selected = li;
      const L = layers[li];
      drag = { kind: "layer", lcx: L.cx, lcy: L.cy, ox: sx, oy: sy };
      canvas.style.cursor = "grabbing";
      draw();
      return;
    }
    const nearCrop = sx >= cropX - 8 && sx <= cropX + cropW + 8 && sy >= cropY - 8 && sy <= cropY + cropH + 8;
    if (nearCrop) {
      drag = { kind: "crop", lcx: cropX, lcy: cropY, ox: sx, oy: sy };
      canvas.style.cursor = "move";
      draw();
    } else {
      selected = -1;
      draw();
    }
  };
  const onMove = (clientX, clientY) => {
    if (!drag) return;
    const { sx, sy } = clientToStage(clientX, clientY);
    const dx = sx - drag.ox;
    const dy = sy - drag.oy;
    if (drag.kind === "layer" && selected >= 0) {
      const L = layers[selected];
      L.cx = drag.lcx + dx;
      L.cy = drag.lcy + dy;
    } else if (drag.kind === "crop") {
      cropX = Math.round(drag.lcx + dx);
      cropY = Math.round(drag.lcy + dy);
      syncCropSize();
    }
    draw();
  };
  const onUp = () => {
    drag = null;
    canvas.style.cursor = "grab";
  };
  canvas.addEventListener("mousedown", (e) => {
    e.preventDefault();
    onDown(e.clientX, e.clientY);
  });
  window.addEventListener("mousemove", (e) => onMove(e.clientX, e.clientY));
  window.addEventListener("mouseup", onUp);
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches[0]) {
        e.preventDefault();
        onDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    { passive: false }
  );
  window.addEventListener(
    "touchmove",
    (e) => {
      if (!drag || !e.touches[0]) return;
      e.preventDefault();
      onMove(e.touches[0].clientX, e.touches[0].clientY);
    },
    { passive: false }
  );
  window.addEventListener("touchend", onUp);
  canvas.addEventListener(
    "wheel",
    (e) => {
      if (selected < 0) return;
      e.preventDefault();
      scaleSel(e.deltaY > 0 ? 0.92 : 1.08);
    },
    { passive: false }
  );
  const close = () => {
    try {
      root.remove();
    } catch {
    }
  };
  head.querySelector("#sf-be-x")?.addEventListener("click", () => {
    opts.sfxUi?.();
    opts.onCancel?.();
    close();
  });
  foot.querySelector("#sf-be-cancel")?.addEventListener("click", () => {
    opts.sfxUi?.();
    opts.onCancel?.();
    close();
  });
  foot.querySelector("#sf-be-save")?.addEventListener("click", () => {
    void (async () => {
      if (!layers.length) {
        setStatus("先に画像か文字を追加してください（「＋画像」または「Ｔ文字」）");
        opts.sfxUi?.();
        return;
      }
      const saveBtn = foot.querySelector("#sf-be-save");
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "書き出し中…";
      }
      setStatus("書き出し中…");
      try {
        const canvas2 = exportCanvas();
        const { blob, dataUrl } = await canvasToJpegBlob(canvas2, maxBytes);
        const width = canvas2.width;
        const height = canvas2.height;
        setStatus(`書き出し ${width}\xD7${height} \xB7 ${Math.round(blob.size / 1024)}KB`);
        opts.sfxOk?.();
        const panel = showResultPanel(dataUrl, width, height, blob.size);
        const msg = panel.querySelector("#sf-be-result-msg");
        let finalized = false;
        const finalize = () => {
          if (finalized) return;
          finalized = true;
          try {
            opts.onSave(dataUrl, { width, height, ratio });
          } catch (e) {
            console.warn("[strip-editor] onSave", e);
          }
        };
        panel.querySelector("#sf-be-dl")?.addEventListener("click", () => {
          void (async () => {
            const name = `swipe-force-banner-${width}x${height}.jpg`;
            const mode = await shareOrDownload(blob, name);
            if (msg) {
              msg.textContent = mode === "share" ? "共有シートを開きました（写真に保存を選べます）" : mode === "download" ? "ダウンロードを開始しました" : "自動DLに失敗 \xB7 画像を長押しして保存してください";
            }
          })();
        });
        panel.querySelector("#sf-be-done")?.addEventListener("click", () => {
          finalize();
          try {
            panel.remove();
          } catch {
          }
          close();
        });
        panel.querySelector("#sf-be-back")?.addEventListener("click", () => {
          try {
            panel.remove();
          } catch {
          }
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = "この枠で保存 / DL";
          }
          setStatus("編集に戻りました \xB7 再保存できます");
        });
        void shareOrDownload(blob, `swipe-force-banner-${width}x${height}.jpg`).then((mode) => {
          if (msg && mode === "download") {
            msg.textContent = "ダウンロードを試行しました \xB7 下のボタンでも再実行できます";
          } else if (msg && mode === "fail") {
            msg.textContent = "自動DL不可 \xB7「ダウンロード / 共有」か画像の長押しで保存";
          }
        });
      } catch (e) {
        console.warn("[strip-editor] export", e);
        setStatus(`書き出し失敗: ${e instanceof Error ? e.message : "error"}`);
        opts.sfxUi?.();
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = "この枠で保存 / DL";
        }
      }
    })();
  });
  root.addEventListener("click", (e) => {
    if (e.target === root) {
      opts.onCancel?.();
      close();
    }
  });
  syncCropSize();
  draw();
  void reloadPresets();
}
