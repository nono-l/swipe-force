/**
 * JPDOC: ログイン。
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  // Support ?next=/partner for post-link return
  const next =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("next") || "/"
      : "/";
  const callbackURL =
    next.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <main className="grid min-h-dvh place-items-center bg-black p-6 text-[#0f0]">
      <div className="w-full max-w-sm space-y-4 border-2 border-[#0f0] p-6 shadow-[0_0_24px_#0f04]">
        <h1 className="text-center text-2xl font-bold tracking-widest">SIGN IN</h1>
        <p className="text-center text-xs opacity-70">SWIPE FORCE / Grok Build iOS</p>
        {callbackURL !== "/" && (
          <p className="text-center text-[11px] opacity-60">
            連携後 → {callbackURL}
          </p>
        )}

        {authEnabled ? (
          GROK_PROVIDERS.map((p) => (
            <button
              key={p.providerId}
              type="button"
              onClick={() => signIn(p.providerId, { callbackURL })}
              className="w-full border border-[#0f0] bg-black px-4 py-3 text-[#0f0] hover:bg-[#0f0] hover:text-black"
            >
              Continue with {p.label}
            </button>
          ))
        ) : (
          <p className="text-center text-sm opacity-60">Sign-in is disabled.</p>
        )}
        <Link to="/" className="block text-center text-sm underline opacity-80">
          ← Back to game
        </Link>
      </div>
    </main>
  );
}
