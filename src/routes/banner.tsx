/**
 * JPDOC: バナーエディタの単独ページ。ログインなしで使える。
 */
/**
 * Direct URL for banner editor: /banner
 * Guest OK — edit & download anytime.
 * Linked accounts can also publish to the title banner (weekly limit).
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { fetchLinkedAccount } from "@/lib/account";
import { openBannerEditor } from "@/lib/banner-editor-ui";
import { openBannerHistoryDialog } from "@/lib/banner-history-ui";
import { confirmBannerDelete } from "@/lib/banner-delete-ui";
import { translate, useLocale } from "@/lib/i18n";
import {
  fetchPartnerBannerStatus,
  savePartnerBannerHref,
  setPartnerBannerActive,
  uploadPartnerBanner,
  clearPartnerBanner,
  type PartnerBanner,
} from "@/lib/partner-banner-api";

const BANNER_OG = "/og-banner.jpg";
const BANNER_TITLE = "バナーエディタ · SWIPE FORCE";
const BANNER_DESC =
  "無料のバナーエディタ。画像＋文字レイヤー、枠で切り抜き、端末保存＆連携で配信。ログイン不要で編集・ダウンロードOK。";

export const Route = createFileRoute("/banner")({
  component: BannerEditorPage,
  head: () => ({
    meta: [
      { title: BANNER_TITLE },
      { name: "description", content: BANNER_DESC },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "SWIPE FORCE" },
      { property: "og:title", content: BANNER_TITLE },
      { property: "og:description", content: BANNER_DESC },
      { property: "og:image", content: BANNER_OG },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:locale", content: "ja_JP" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: BANNER_TITLE },
      { name: "twitter:description", content: BANNER_DESC },
      { name: "twitter:image", content: BANNER_OG },
    ],
    links: [{ rel: "image_src", href: BANNER_OG }],
  }),
});

function downloadDataUrl(dataUrl: string, filename: string) {
  try {
    const bin = atob((dataUrl.split(",")[1] || "").replace(/\s/g, ""));
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const blob = new Blob([arr], { type: "image/jpeg" });
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
        /* */
      }
    }, 1500);
  } catch {
    try {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = filename;
      a.click();
    } catch {
      try {
        window.open(dataUrl, "_blank");
      } catch {
        /* */
      }
    }
  }
}

function BannerEditorPage() {
  useLocale();
  const [linked, setLinked] = useState(false);
  const [playerId, setPlayerId] = useState("");
  const [name, setName] = useState<string | null>(null);
  const [pageUrl, setPageUrl] = useState("/banner");
  const [flash, setFlash] = useState("");
  const [busy, setBusy] = useState(false);
  const [banners, setBanners] = useState<PartnerBanner[]>([]);
  const [weekRemaining, setWeekRemaining] = useState(8);
  const [weekLimit, setWeekLimit] = useState(8);
  const [maxOwned, setMaxOwned] = useState(200);
  const [ready, setReady] = useState(false);

  const reloadBanner = useCallback(async (pid: string) => {
    const st = await fetchPartnerBannerStatus(pid);
    if (st.ok) {
      setBanners(st.banners || []);
      setWeekRemaining(st.weekRemaining);
      setWeekLimit(st.weekLimit);
      setMaxOwned(st.maxOwned || 200);
    }
  }, []);

  const handleSave = useCallback(
    async (dataUrl: string, meta: { width: number; height: number }) => {
      // Always download so guests get the file
      downloadDataUrl(
        dataUrl,
        `swipe-force-banner-${meta.width}x${meta.height}.jpg`,
      );

      if (!linked || !playerId) {
        setFlash(
          `ダウンロードしました（${meta.width}×${meta.height}）· 配信登録は連携後にポータルから`,
        );
        return;
      }

      if (weekRemaining <= 0) {
        setFlash(
          `ダウンロード済み · 配信側は今週の上限（${weekLimit}回）のため未アップロード`,
        );
        return;
      }
      if (banners.length >= maxOwned) {
        setFlash(
          `ダウンロード済み · 登録上限（${maxOwned}枚）のため未追加`,
        );
        return;
      }

      setBusy(true);
      setFlash(`書き出し ${meta.width}×${meta.height} · 配信枠へ送信中…`);
      const res = await uploadPartnerBanner(playerId, dataUrl);
      setBusy(false);
      if (!res.ok) {
        const map: Record<string, string> = {
          week_limit: "ダウンロード済み · 配信は週上限のためスキップ",
          too_large: "ダウンロード済み · 配信は200KB超過でスキップ",
          bad_ratio: "ダウンロード済み · 比率エラーで配信スキップ",
          too_small: "ダウンロード済み · サイズ不足で配信スキップ",
          bad_format: "ダウンロード済み · 形式エラーで配信スキップ",
          bad_image: "ダウンロード済み · 配信アップロード失敗",
          slot_limit: "ダウンロード済み · 登録上限のため未追加",
        };
        setFlash(map[res.reason || ""] || `ダウンロード済み · 配信失敗 (${res.reason || "?"})`);
        return;
      }
      setFlash(
        res.via === "blob"
          ? `DL + 配信保存（Blob）· 残り ${res.weekRemaining} 回`
          : `DL + 配信保存 · 残り ${res.weekRemaining} 回`,
      );
      await reloadBanner(playerId);
    },
    [linked, playerId, weekRemaining, weekLimit, banners.length, maxOwned, reloadBanner],
  );

  const openEditor = useCallback(
    (pid?: string | null) => {
      openBannerEditor({
        maxH: 85,
        minRatio: 1.5,
        maxRatio: 5,
        maxBytes: 200 * 1024,
        playerId: (pid ?? playerId) || null,
        onSave: (dataUrl, meta) => {
          void handleSave(dataUrl, meta);
        },
      });
    },
    [handleSave, playerId],
  );

  useEffect(() => {
    setPageUrl(`${window.location.origin}/banner`);
    let cancelled = false;
    (async () => {
      let linkedPid: string | null = null;
      try {
        const acc = await fetchLinkedAccount();
        if (cancelled) return;
        if (acc.linked && acc.playerId) {
          setLinked(true);
          setPlayerId(acc.playerId);
          setName(acc.name);
          linkedPid = acc.playerId;
          await reloadBanner(acc.playerId);
        } else {
          setLinked(false);
          setPlayerId("");
          setName(null);
        }
      } catch {
        /* guest mode still ok */
        setLinked(false);
      }
      if (!cancelled) {
        setReady(true);
        setTimeout(() => {
          if (!cancelled) openEditor(linkedPid);
        }, 200);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open once
  }, []);

  const goLogin = () => {
    const next = encodeURIComponent("/banner");
    window.location.href = `/login?next=${next}`;
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setFlash("直リンクをコピーしました");
    } catch {
      setFlash("コピーできませんでした · URLを長押しで選択");
    }
  };

  return (
    <main className="min-h-dvh bg-[#030a10] text-[#def] antialiased">
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 py-6">
        <header className="mb-6 border-b border-[#234] pb-4">
          <div className="text-xs tracking-widest text-[#6a9]">
            SWIPE FORCE
          </div>
          <h1 className="mt-1 text-xl font-extrabold text-[#9ef]">
            ✂️ バナーエディタ
          </h1>
          <p className="mt-1 text-[11px] leading-relaxed text-[#8ab]">
            ログイン不要で編集・ダウンロード可能。縦≤85px · 比率1.5〜5。
            配信登録だけ連携が必要です。
          </p>
          <div className="mt-3 rounded-lg border border-dashed border-[#356] bg-[#061018] px-3 py-2 text-[11px]">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[#678]">直リンク URL</div>
              <button
                type="button"
                onClick={() => void copyUrl()}
                className="rounded border border-[#456] bg-[#122028] px-2 py-0.5 text-[10px] text-[#bcd]"
              >
                コピー
              </button>
            </div>
            <a
              href={pageUrl}
              className="mt-0.5 block break-all font-semibold text-[#8cf] underline select-all"
            >
              {pageUrl}
            </a>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
            <Link
              to="/partner"
              className="rounded-lg border border-[#456] bg-[#0a1520] px-3 py-2 text-[#9cf] underline"
            >
              📣 広告主ポータル
            </Link>
            <Link
              to="/"
              className="rounded-lg border border-[#345] bg-[#0a1018] px-3 py-2 text-[#8ab] underline"
            >
              ゲームへ
            </Link>
          </div>
        </header>

        {!ready && (
          <p className="text-sm text-[#8ab]">準備中…</p>
        )}

        {ready && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#264] bg-[#0a1820] p-4 text-[12px] leading-relaxed">
              {linked ? (
                <>
                  <div>
                    連携中{" "}
                    <b className="text-[#fe8]">
                      {name || playerId.slice(0, 10)}
                    </b>
                  </div>
                  <div className="mt-1 text-[#8ab]">
                    配信 {banners.length} 枚 · 今週の追加残り{" "}
                    <b className="text-[#9ef]">{weekRemaining}</b> / {weekLimit}
                    <span className="text-[#678]">（保存で1枚追加・抽選表示）</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      openBannerHistoryDialog({
                        playerId,
                      })
                    }
                    className="mt-3 w-full rounded-lg border border-[#456] bg-[#122028] px-3 py-2 text-[12px] font-bold text-[#bcd]"
                  >
                    表示・クリック履歴
                  </button>
                </>
              ) : (
                <>
                  <div className="text-[#cde]">
                    <b className="text-[#9ef]">ゲスト利用OK</b>
                    {" · "}編集・JPEGダウンロードは自由です
                  </div>
                  <div className="mt-2 text-[#8ab]">
                    タイトル画面への配信登録をする場合は連携してください
                  </div>
                  <button
                    type="button"
                    onClick={goLogin}
                    className="mt-3 w-full rounded-lg border border-[#456] bg-[#122028] px-3 py-2 text-[12px] font-bold text-[#bcd]"
                  >
                    連携 / ログイン（任意）
                  </button>
                </>
              )}
            </div>

            {linked && banners.length ? (
              <div className="space-y-3">
                {banners.map((item, i) => {
                  const on = item.active !== false;
                  return (
                  <div
                    key={item.id || item.url}
                    className="overflow-hidden rounded-xl border bg-[#041008]"
                    style={{
                      borderColor: on ? "#345" : "#543",
                      opacity: on ? 1 : 0.78,
                    }}
                  >
                    <div
                      className="h-16 w-full bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${item.url})`,
                        filter: on ? undefined : "grayscale(0.7)",
                      }}
                    />
                    <div className="flex items-center justify-between gap-2 px-3 py-2 text-[10px] text-[#8ab]">
                      <span>
                        #{i + 1} · {item.width}×{item.height}
                        {item.bytes != null
                          ? ` · ${Math.round(item.bytes / 1024)}KB`
                          : ""}{" "}
                        · {on ? "抽選1票" : "抽選なし"}
                      </span>
                      <span
                        className="rounded-full border px-2 py-0.5 text-[9px] font-extrabold"
                        style={{
                          borderColor: on ? "#3a6" : "#864",
                          background: on ? "#0f2a18" : "#2a1810",
                          color: on ? "#cfc" : "#fc8",
                        }}
                      >
                        {on ? "有効" : "無効"}
                      </span>
                    </div>
                    <form
                      className="space-y-2 border-t border-[#234] px-3 py-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        const href = String(fd.get("href") || "").trim();
                        void (async () => {
                          setBusy(true);
                          const res = await savePartnerBannerHref(
                            playerId,
                            href,
                            item.id,
                          );
                          setBusy(false);
                          if (!res.ok) {
                            setFlash(
                              res.reason === "bad_href"
                                ? "リンクは http / https のURLにしてください"
                                : `リンク保存失敗 (${res.reason || "?"})`,
                            );
                            return;
                          }
                          setFlash(
                            href
                              ? translate("partner.hrefSaved")
                              : translate("partner.hrefCleared"),
                          );
                          await reloadBanner(playerId);
                        })();
                      }}
                    >
                      <label className="block text-[10px] text-[#8ab]">
                        {translate("bannerPage.hrefLabel")}
                      </label>
                      <input
                        name="href"
                        type="url"
                        inputMode="url"
                        defaultValue={item.href || ""}
                        key={`${item.id || i}-${item.href || "empty"}`}
                        placeholder="https://example.com"
                        className="w-full rounded-lg border border-[#456] bg-[#0a1520] px-3 py-2 text-[12px] text-[#eef] break-all"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={busy}
                          className="shrink-0 rounded-lg border border-[#6af] bg-[#1a4060] px-3 py-2 text-[11px] font-bold text-[#dff] disabled:opacity-50"
                        >
                          {translate("common.save")}
                        </button>
                        <button
                          type="button"
                          disabled={busy || !item.id}
                          onClick={() => {
                            void (async () => {
                              if (!item.id) return;
                              setBusy(true);
                              const res = await setPartnerBannerActive(
                                playerId,
                                item.id,
                                !on,
                              );
                              setBusy(false);
                              if (!res.ok) {
                                setFlash(translate("partner.toggleFail", { r: res.reason || "?" }));
                                return;
                              }
                              setFlash(on ? translate("partner.disabled") : translate("partner.enabled"));
                              await reloadBanner(playerId);
                            })();
                          }}
                          className="shrink-0 rounded-lg border px-3 py-2 text-[11px] font-bold disabled:opacity-50"
                          style={{
                            borderColor: on ? "#a64" : "#6af",
                            background: on ? "#301818" : "#1a4060",
                            color: on ? "#fcc" : "#dff",
                          }}
                        >
                          {on ? translate("partner.disable") : translate("partner.enable")}
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={busy || !item.id}
                        onClick={() => {
                          if (!item.id) return;
                          void (async () => {
                            const ok = await confirmBannerDelete();
                            if (!ok) return;
                            setBusy(true);
                            const res = await clearPartnerBanner(
                              playerId,
                              item.id,
                            );
                            setBusy(false);
                            if (!res.ok) {
                              setFlash(translate("partner.delFail", { r: res.reason || "?" }));
                              return;
                            }
                            setFlash(translate("partner.deleted"));
                            await reloadBanner(playerId);
                          })();
                        }}
                        className="w-full rounded-lg border border-[#844] bg-[#2a1010] px-3 py-2 text-[11px] font-bold text-[#fcc] disabled:opacity-50"
                      >
                        {translate("partner.delThis")}
                      </button>
                    </form>
                  </div>
                  );
                })}
              </div>
            ) : null}

            <button
              type="button"
              disabled={busy}
              onClick={() => openEditor()}
              className="w-full rounded-xl border border-[#8cf] bg-gradient-to-b from-[#1a4060] to-[#102838] px-4 py-4 text-sm font-extrabold text-[#eff] disabled:opacity-50"
            >
              {busy ? "処理中…" : "✂️ バナーエディタを開く"}
            </button>

            {flash ? (
              <p className="text-center text-[12px] text-[#fc8]">{flash}</p>
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}
