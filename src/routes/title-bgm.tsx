/**
 * Title BGM sample player — KEYGEN-style attract theme (~2 min form).
 * Open /title-bgm to audition without navigating the in-game menu.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/title-bgm")({
  component: TitleBgmSamplePage,
  head: () => ({
    meta: [
      { title: "KEYGEN TITLE · 試聴 · SWIPE FORCE" },
      {
        name: "description",
        content: "Title theme sample — keygen chiptune A/B/Bridge/Chorus",
      },
    ],
  }),
});

type Phase = "idle" | "playing" | "error";

function TitleBgmSamplePage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [sec, setSec] = useState(0);
  const timerRef = useRef<number | null>(null);

  const stop = useCallback(async () => {
    try {
      const engine = await import("@/components/game/engine/audio/engine");
      // bgmUnlock clears timer and sets mode off (stop)
      engine.bgmUnlock();
    } catch {
      /* */
    }
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPhase("idle");
    setSec(0);
  }, []);

  const play = useCallback(async () => {
    try {
      const engine = await import("@/components/game/engine/audio/engine");
      // resume audio context + unmute + start keygen attract
      engine.bgmSetMaster();
      engine.bgmSetMuted(false);
      engine.bgmStartScene("attract");
      setPhase("playing");
      setSec(0);
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        setSec((s) => s + 1);
      }, 1000);
    } catch (e) {
      console.error(e);
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    return () => {
      void stop();
    };
  }, [stop]);

  const mm = String(Math.floor(sec / 60));
  const ss = String(sec % 60).padStart(2, "0");

  return (
    <main className="min-h-dvh bg-[#030a12] text-[#def] antialiased">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-8">
        <header className="mb-6 border-b border-[#234] pb-4">
          <div className="text-[10px] tracking-[0.2em] text-[#6a9]">
            SWIPE FORCE · SAMPLE
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-[#9ef]">
            ♪ KEYGEN TITLE
          </h1>
          <p className="mt-2 text-[12px] leading-relaxed text-[#8ab]">
            トップページ曲 · キージェネ風チップチューン
            <br />
            Aメロ / Bメロ / ブリッジ / コーラス · 約2分で一周
          </p>
        </header>

        <div className="mb-5 rounded-xl border border-[#356] bg-[#0a1520] p-4 text-[11px] leading-relaxed text-[#9bc]">
          <div className="mb-2 font-bold text-[#fec]">構成</div>
          <ol className="list-decimal space-y-1 pl-4">
            <li>Intro（ベース＋アルペジオ）</li>
            <li>Aメロ → A'変奏</li>
            <li>Bメロ</li>
            <li>ブリッジ</li>
            <li>コーラス（厚め）</li>
            <li>A → コーラス → ブリッジ → フィナーレ → ループ</li>
          </ol>
        </div>

        <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#3a6a8a] bg-[#0c141c] px-6 py-8 shadow-[0_12px_40px_#000a]">
          <div className="font-mono text-3xl font-bold tabular-nums text-[#8cf]">
            {mm}:{ss}
          </div>
          <div className="text-[10px] text-[#678]">
            {phase === "playing"
              ? "再生中 · 約2:00 で一周"
              : phase === "error"
                ? "再生に失敗しました"
                : "再生ボタンを押すと音が出ます"}
          </div>
          <div className="flex w-full gap-3">
            {phase !== "playing" ? (
              <button
                type="button"
                onClick={() => void play()}
                className="flex-1 rounded-xl border border-[#6af] bg-[#1a4060] px-4 py-3.5 text-sm font-bold text-[#dff] active:scale-[0.98]"
              >
                ▶ 試聴する
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void stop()}
                className="flex-1 rounded-xl border border-[#a66] bg-[#301018] px-4 py-3.5 text-sm font-bold text-[#fcc] active:scale-[0.98]"
              >
                ■ 停止
              </button>
            )}
          </div>
          {phase === "playing" && (
            <button
              type="button"
              onClick={() => void play()}
              className="text-[11px] text-[#8ab] underline"
            >
              最初から再生
            </button>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-[#567]">
          ゲーム内タイトル画面でも同じ曲が流れます
        </p>
        <Link
          to="/"
          className="mt-3 block text-center text-xs font-semibold text-[#8cf] underline"
        >
          ← ゲームに戻る
        </Link>
      </div>
    </main>
  );
}
