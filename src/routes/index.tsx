import { createFileRoute } from "@tanstack/react-router";
import { SwipeForceGame } from "@/components/game/SwipeForceGame";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <SwipeForceGame />;
}
