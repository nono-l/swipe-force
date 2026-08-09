import { createFileRoute } from "@tanstack/react-router";
import { GiversGame } from "@/components/game/GiversGame";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <GiversGame />;
}
