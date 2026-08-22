/**
 * JPDOC: 広告主ポータルの単独ページ。/advertiser は広告ブロッカーに消されるので使わない。
 */
/**
 * Direct URL for linked advertisers: /partner
 * Requires external account link. Guests are sent to /login?next=/partner
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchLinkedAccount } from "@/lib/account";
import { openPartnerPortalDialog } from "@/lib/partner-portal-ui";

export const Route = createFileRoute("/partner")({
  component: AdvertiserPortalPage,
  head: () => ({
    meta: [
      { title: "広告主ポータル · SWIPE FORCE" },
      {
        name: "description",
        content: "SWIPE FORCE advertiser portal — prepaid codes & ad videos",
      },
    ],
  }),
});

type Phase = "loading" | "need_link" | "ready" | "error";

function AdvertiserPortalPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [playerId, setPlayerId] = useState("");
  const [name, setName] = useState<string | null>(null);
  const [portalUrl, setPortalUrl] = useState("/partner");

  useEffect(() => {
    setPortalUrl(`${window.location.origin}/partner`);
    let cancelled = false;
    (async () => {
      try {
        const acc = await fetchLinkedAccount();
        if (cancelled) return;
        if (!acc.linked || !acc.playerId) {
          setPhase("need_link");
          return;
        }
        setPlayerId(acc.playerId);
        setName(acc.name);
        setPhase("ready");
        // Open portal UI once (dialog host on this page)
        openPartnerPortalDialog({
          playerId: acc.playerId,
          sfxUi: () => {},
          sfxOk: () => {},
          sfxFail: () => {},
        });
      } catch {
        if (!cancelled) setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const goLogin = () => {
    const next = encodeURIComponent("/partner");
    window.location.href = `/login?next=${next}`;
  };

  return (
    <main className="min-h-dvh bg-[#030a10] text-[#def] antialiased">
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 py-6">
        <header className="mb-6 border-b border-[#234] pb-4">
          <div className="text-xs tracking-widest text-[#6a9]">
            SWIPE FORCE
          </div>
          <h1 className="mt-1 text-xl font-extrabold text-[#9ef]">
            📣 広告主ポータル
          </h1>
          <p className="mt-1 text-[11px] leading-relaxed text-[#8ab]">
            外部アカウント連携済みユーザー専用。表示・編集できるのは自分が登録した広告のみ。
          </p>
          <div className="mt-3 rounded-lg border border-dashed border-[#356] bg-[#061018] px-3 py-2 text-[11px]">
            <div className="text-[#678]">直リンク URL</div>
            <a
              href={portalUrl}
              className="mt-0.5 block break-all font-semibold text-[#8cf] underline select-all"
            >
              {portalUrl}
            </a>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
            <Link
              to="/banner"
              className="rounded-lg border border-[#8cf] bg-[#102838] px-3 py-2 font-semibold text-[#9ef] underline"
            >
              ✂️ バナーエディタ直リンク
            </Link>
          </div>
          <div className="mt-2 rounded-lg border border-[#345] bg-[#0a1520] px-3 py-2 text-[11px]">
            <div className="text-[#8ab]">サポート窓口</div>
            <a
              href="https://discord.gg/hfDykSD2JJ"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 block font-semibold text-[#8cf] underline"
            >
              Discord
            </a>
            <div className="mt-0.5 break-all text-[10px] text-[#567] select-all">
              https://discord.gg/hfDykSD2JJ
            </div>
          </div>
        </header>

        {phase === "loading" && (
          <p className="text-sm text-[#8ab]">連携状態を確認しています…</p>
        )}

        {phase === "need_link" && (
          <div className="space-y-4 rounded-xl border border-[#456] bg-[#0a1520] p-5">
            <p className="text-sm leading-relaxed text-[#cde]">
              広告主ポータルを使うには、
              <b className="text-[#fe8]"> 外部 ID 連携</b>
              が必要です。
            </p>
            <button
              type="button"
              onClick={goLogin}
              className="w-full rounded-lg border border-[#6af] bg-[#1a4060] px-4 py-3 text-sm font-bold text-[#dff]"
            >
              連携して入る
            </button>
            <Link
              to="/"
              className="block text-center text-xs text-[#8ab] underline"
            >
              ← ゲームに戻る
            </Link>
          </div>
        )}

        {phase === "error" && (
          <div className="space-y-3 rounded-xl border border-[#a44] bg-[#200a10] p-5 text-sm">
            <p>読み込みに失敗しました。再読み込みしてください。</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg border border-[#a66] px-3 py-2 text-[#fcc]"
            >
              再試行
            </button>
          </div>
        )}

        {phase === "ready" && (
          <div className="space-y-3 text-sm text-[#9bc]">
            <p>
              連携中{" "}
              <b className="text-[#cfe]">{name || "プレイヤー"}</b>
              <span className="ml-2 text-[10px] text-[#567]">{playerId}</span>
            </p>
            <p className="text-[11px] text-[#678]">
              ポータルウィンドウが開きます。閉じた場合は下のボタンから再表示できます。
            </p>
            <button
              type="button"
              onClick={() =>
                openPartnerPortalDialog({
                  playerId,
                  sfxUi: () => {},
                  sfxOk: () => {},
                  sfxFail: () => {},
                })
              }
              className="w-full rounded-lg border border-[#6af] bg-[#1a4060] px-4 py-3 text-sm font-bold text-[#dff]"
            >
              ポータルを開く
            </button>
            <Link
              to="/"
              className="block text-center text-xs text-[#8ab] underline"
            >
              ← ゲームに戻る
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
