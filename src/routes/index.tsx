import { createFileRoute } from "@tanstack/react-router";
import { SwipeForceGame } from "@/components/game/SwipeForceGame";
import { bootLocale } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  bootLocale();
  return <SwipeForceGame />;
}