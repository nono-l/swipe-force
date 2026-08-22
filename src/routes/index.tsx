/**
 * JPDOC: トップ。ゲームキャンバス、または ?watch=ROOM で観戦。
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SwipeForceGame } from "@/components/game/SwipeForceGame";
import { SpectatorView } from "@/components/game/SpectatorView";
import { LiveSpectateHost } from "@/components/game/LiveSpectateHost";
import { bootLocale } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  component: Home,
});

function useWatchRoom(): string {
  const [room, setRoom] = React.useState("");
  React.useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const w = (q.get("watch") || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
      setRoom(w);
    } catch {
      setRoom("");
    }
  }, []);
  return room;
}

function Home() {
  bootLocale();
  const room = useWatchRoom();
  if (room) {
    return <SpectatorView roomId={room} />;
  }
  return (
    <>
      <SwipeForceGame />
      <LiveSpectateHost />
    </>
  );
}
