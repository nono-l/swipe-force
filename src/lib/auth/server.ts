/**
 * JPDOC: サーバー側 better-auth。
 */
/**
 * Self-hosted Better Auth for THIS app (server-only).
 *
 * Pre-wired for live preview + deploy — do not rewrite this file. To enable
 * local email/password, flip the flag in `./email-password` only (see auth skill).
 *
 * The app runs its own Better Auth at `/api/auth/*`, so the session cookie stays
 * on this app's own origin. Sign-in federates to the shared **Grok auth broker**
 * (`GROK_AUTH_ISSUER`) via the `genericOAuth` plugin — the broker brokers the
 * upstream sign-in methods (Google, X, …) and holds their shared secrets; this
 * app only holds its own client id/secret and names the upstream it wants via
 * each provider's `idp` hint.
 *
 * Tri-mode:
 *   - Deployed: the deployer injects a per-app `GROK_AUTH_*` + `BETTER_AUTH_URL`
 *     + `DATABASE_URL`, so real federated auth is persisted in Postgres.
 *   - Sandbox live preview: no injection -> falls back to the shared **preview
 *     client** (`./preview`) and derives the preview's `https://*.grok-sandbox.com`
 *     origin from the request, so real sign-in works (no demo users). Sessions
 *     and identities persist in the embedded PGLite DB (same DB as app data);
 *     the process restart wipes both. Live-preview iframe clients use a bearer
 *     token (partitioned cookies) — see `client.ts`.
 *   - Explicitly off (`VITE_AUTH_ENABLED=false`): no providers; per-user server
 *     functions fall back to a dev user (see `verify.server.ts`).
 *
 * NEVER import this from client code — it pulls in `pg` + the preview secret +
 * server-only Better Auth internals. The client uses `@/lib/auth/client`;
 * components read the user via `@/lib/auth/use-current-user`; server functions get
 * a verified id via `@/lib/auth/middleware`.
 */
import { betterAuth } from "better-auth";
import { bearer, genericOAuth } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { getCookie } from "@tanstack/react-start/server";
import { randomBytes } from "node:crypto";
import { Pool } from "pg";
import { ensureDbReady, getPglite } from "../db";
import { emailAndPasswordEnabled } from "./email-password";
import { GROK_PROVIDERS } from "./providers";
import { pgliteDialect } from "./pglite-dialect";
import {
  GROK_ISSUER_DEFAULT,
  PREVIEW_ALLOWED_HOSTS,
  PREVIEW_CLIENT_ID,
  PREVIEW_CLIENT_SECRET,
} from "./preview";

// Kick (and share) PGLite bootstrap as soon as the auth server module loads.
void ensureDbReady();

/**
 * Preview secret must outlive module reloads: PGLite (and its session rows) is
 * stored on `globalThis`, so an HMR re-eval of this file must NOT mint a new
 * signing secret or every existing session becomes invalid mid-dev. Process
 * restart clears both the secret and PGLite together.
 */
const globalAuthRef = globalThis as typeof globalThis & {
  __grokAuthPreviewSecret__?: string;
};
function previewAuthSecret(): string {
  globalAuthRef.__grokAuthPreviewSecret__ ??= randomBytes(32).toString("hex");
  return globalAuthRef.__grokAuthPreviewSecret__;
}

/** Read an env var, treating empty/whitespace as unset. */
const env = (key: string): string | undefined => {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
};

// Explicit off-switch. The deployer sets `VITE_AUTH_ENABLED=true` when it
// provisions auth; set it to "false" to force auth off everywhere (dev user).
const authDisabled = env("VITE_AUTH_ENABLED") === "false";

// Broker federation creds: the deployer injects a per-app client when deployed;
// otherwise fall back to the shared live-preview client, which the broker accepts
// for any `*.grok-sandbox.com` callback (see `./preview`).
const grokIssuer = env("GROK_AUTH_ISSUER") ?? GROK_ISSUER_DEFAULT;
const grokClientId = env("GROK_AUTH_CLIENT_ID") ?? PREVIEW_CLIENT_ID;
const grokClientSecret = env("GROK_AUTH_CLIENT_SECRET") ?? PREVIEW_CLIENT_SECRET;

/** True when federated sign-in is active (real auth is enforced). */
export const authConfigured =
  !authDisabled && Boolean(grokClientId && grokClientSecret);

// This app's own Better Auth origin. When deployed the deployer injects the
// public URL. In the sandbox live preview there's no fixed URL (each preview gets
// a dynamic `*.grok-sandbox.com` host), so we hand Better Auth a dynamic baseURL:
// it derives the origin per-request from the (proxied) host, validated against the
// preview allowlist, which makes the OAuth `redirect_uri` the concrete preview URL
// the broker's preview client accepts.
//
// Custom domains: a fixed BETTER_AUTH_URL alone rejects Origin from the custom
// host ("Invalid origin"). We always use dynamic baseURL + an expanded host
// allowlist (Vercel hosts, BETTER_AUTH_URL host, BETTER_AUTH_ALLOWED_HOSTS /
// BETTER_AUTH_TRUSTED_ORIGINS) so custom domains and *.vercel.app both work.
const explicitBaseURL = env("BETTER_AUTH_URL");
// Explicit `string[]` (not a readonly tuple) — Better Auth's DynamicBaseURLConfig
// requires a mutable `allowedHosts: string[]`.
const previewAllowedHosts: string[] = [...PREVIEW_ALLOWED_HOSTS];
// Local `npm run dev` (port 8080 contract). Browsers may send Origin as any of
// these for the same server — trusting only `localhost` rejects `127.0.0.1` and
// breaks email/password with "Invalid origin".
const LOCAL_DEV_ORIGINS: string[] = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://[::1]:8080",
];

/** Split comma/space separated env lists. */
function parseEnvList(key: string): string[] {
  const raw = env(key);
  if (!raw) return [];
  return raw
    .split(/[, \n\t]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Normalize to hostname (no scheme/path). Keeps wildcards like `*.vercel.app`. */
function toHost(raw: string): string | null {
  const s = String(raw || "").trim();
  if (!s) return null;
  // Keep wildcard host patterns as-is (minus scheme/path)
  if (s.includes("*")) {
    return s
      .replace(/^https?:\/\//i, "")
      .replace(/\/.*$/, "")
      .toLowerCase() || null;
  }
  try {
    if (s.includes("://")) return new URL(s).host.toLowerCase();
  } catch {
    /* fall through */
  }
  return s
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .toLowerCase() || null;
}

/**
 * Hosts/patterns allowed for dynamic baseURL + origin checks.
 * Includes preview wildcards, loopback, Vercel, BETTER_AUTH_URL host,
 * and optional env extras for custom domains.
 */
function collectAllowedHosts(): string[] {
  const hosts = new Set<string>();
  const add = (v?: string | null) => {
    if (!v) return;
    const h = toHost(v);
    if (h) hosts.add(h);
  };

  for (const h of previewAllowedHosts) hosts.add(h);
  hosts.add("localhost");
  hosts.add("127.0.0.1");
  hosts.add("[::1]");

  // Production / custom domain
  add(explicitBaseURL);
  add(env("VERCEL_URL"));
  add(env("VERCEL_PROJECT_PRODUCTION_URL"));
  add(env("VERCEL_BRANCH_URL"));
  // Common Vercel / platform patterns
  hosts.add("*.vercel.app");
  // App custom domain(s)
  hosts.add("force.grok.pachimanzi.uk");
  hosts.add("*.pachimanzi.uk");

  for (const x of parseEnvList("BETTER_AUTH_ALLOWED_HOSTS")) add(x);
  for (const x of parseEnvList("BETTER_AUTH_TRUSTED_ORIGINS")) add(x);

  return [...hosts];
}

const allowedHosts: string[] = collectAllowedHosts();

// Always dynamic so the OAuth redirect_uri / cookies follow the host the user
// actually opened (custom domain vs vercel.app vs preview).
const baseURL = {
  allowedHosts,
  // `auto` → trust both http:// and https:// expansions of allowedHosts
  // (preview is https; local dev is http).
  protocol: "auto" as const,
  fallback: explicitBaseURL ?? "http://localhost:8080",
};

function hostMatchesAllowlist(host: string, patterns: string[]): boolean {
  const h = host.toLowerCase();
  for (const p of patterns) {
    const pat = p.toLowerCase();
    if (pat === h) return true;
    // simple *.example.com wildcard (matches one or more labels on the left)
    if (pat.startsWith("*.")) {
      const suffix = pat.slice(1); // ".example.com"
      if (h.endsWith(suffix) || h === pat.slice(2)) return true;
    }
  }
  return false;
}

// Origins Better Auth accepts on credentialed POSTs (sign-up/sign-in, etc.).
// Missing entries here surface as FORBIDDEN "Invalid origin".
// Static list + per-request Origin/Host when that host is on the allowlist
// (so custom domains work without listing every variant as a full origin).
const staticTrustedOrigins: string[] = [
  ...LOCAL_DEV_ORIGINS,
  ...previewAllowedHosts,
  ...previewAllowedHosts.flatMap((host) => [
    `https://${host}`,
    `http://${host}`,
  ]),
  ...(explicitBaseURL ? [explicitBaseURL] : []),
  // App custom domain
  "https://force.grok.pachimanzi.uk",
  "http://force.grok.pachimanzi.uk",
  "force.grok.pachimanzi.uk",
  ...parseEnvList("BETTER_AUTH_TRUSTED_ORIGINS"),
  ...allowedHosts.flatMap((h) =>
    h.includes("*") ? [h, `https://${h}`, `http://${h}`] : [h, `https://${h}`, `http://${h}`],
  ),
];


const trustedOrigins = async (request?: Request): Promise<string[]> => {
  const out = new Set<string>(staticTrustedOrigins.filter(Boolean));
  if (!request) return [...out];

  const rawHost = (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    ""
  )
    .split(",")[0]
    .trim()
    .toLowerCase();
  const hostNoPort = rawHost.replace(/:\d+$/, "");

  if (rawHost && hostMatchesAllowlist(rawHost, allowedHosts)) {
    out.add(rawHost);
    out.add(`https://${rawHost}`);
    out.add(`http://${rawHost}`);
  }
  if (hostNoPort && hostNoPort !== rawHost && hostMatchesAllowlist(hostNoPort, allowedHosts)) {
    out.add(hostNoPort);
    out.add(`https://${hostNoPort}`);
    out.add(`http://${hostNoPort}`);
  }

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const oh = new URL(origin).host.toLowerCase();
      // Same-origin browser calls: Origin host matches Host (custom domain OK)
      if (
        rawHost &&
        (oh === rawHost || oh === hostNoPort || hostMatchesAllowlist(oh, allowedHosts))
      ) {
        out.add(origin);
      }
    } catch {
      /* ignore bad Origin */
    }
  }

  return [...out];
};

const databaseUrl = env("DATABASE_URL");


// Static broker OAuth endpoints (skip OIDC discovery on every sign-in / callback).
// Discovery would cost an extra network hop to the broker before the popup can
// even redirect to Google/X — the live-preview popup felt stuck on the app for
// that whole round-trip. These paths match the broker's discovery document.
const issuerBase = grokIssuer.replace(/\/+$/, "");
const grokAuthorizationUrl = `${issuerBase}/api/auth/oauth2/authorize`;
const grokTokenUrl = `${issuerBase}/api/auth/oauth2/token`;
const grokUserInfoUrl = `${issuerBase}/api/auth/oauth2/userinfo`;

// Real Postgres when `DATABASE_URL` is set (deployed apps), else the app's
// embedded PGLite (preview) via a Kysely dialect — so Better Auth persists to the
// SAME DB as app data, including email/password users. Both use the Better Auth
// schema from `migrations/0001_auth.sql`.
const database = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : { dialect: pgliteDialect(() => getPglite()), type: "postgres" as const };

/** Session token cookie name — also read by the live-preview popup completion page. */
export const SESSION_TOKEN_COOKIE = "__Host-grok-auth.session_token";

// Built separately so the `betterAuth({...})` call stays easy to edit without
// breaking brackets (models often trip on the conditional plugin spread).
const grokOAuthPlugin = authConfigured
  ? genericOAuth({
      config: GROK_PROVIDERS.map(({ providerId, idp }) => ({
        providerId,
        clientId: grokClientId as string,
        clientSecret: grokClientSecret as string,
        // Prefer static endpoints over `discoveryUrl` so initiating (and
        // completing) OAuth does not wait on a broker discovery fetch.
        authorizationUrl: grokAuthorizationUrl,
        tokenUrl: grokTokenUrl,
        userInfoUrl: grokUserInfoUrl,
        scopes: ["openid", "profile", "email"],
        // `prompt: "login"` forces the broker to re-authenticate against the
        // upstream on every sign-in instead of silently reusing an existing
        // broker session. Combined with the broker sending Google
        // `prompt=select_account`, the user always gets the account chooser
        // and can pick (or switch) which account to sign in with.
        authorizationUrlParams: { idp, prompt: "login" },
      })),
    })
  : null;

export const auth = betterAuth({
  baseURL,
  // Deployed apps inject BETTER_AUTH_SECRET. Preview: process-stable secret on
  // globalThis so HMR doesn't invalidate PGLite-backed sessions (see above).
  secret: env("BETTER_AUTH_SECRET") ?? previewAuthSecret(),
  database,

  // CSRF / origin check for credentialed auth POSTs (email sign-up/sign-in, …).
  // See `trustedOrigins` construction above — must cover live preview hosts AND
  // local loopback variants, or clients get "Invalid origin".
  trustedOrigins,

  // Encrypt broker-issued OAuth tokens at rest, and treat the broker's upstreams
  // as trusted first-party identities. The broker owns identity and X emails are
  // synthetic/unverified, so WITHOUT this a login can fail with
  // `account_not_linked` (Better Auth refuses to attach an untrusted, unverified
  // identity to an existing user). Google and X carry DISTINCT emails, so this
  // never merges them into one user — they stay separate identities.
  account: {
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      trustedProviders: GROK_PROVIDERS.map((p) => p.providerId),
      // X's synthetic email is never "verified", so don't gate linking on the
      // local user's email-verified state.
      requireLocalEmailVerified: false,
    },
  },

  // Cache the session in the short-lived signed `session_data` cookie so reads
  // (incl. the client's `/get-session`) skip the DB — this shrinks the "loading"
  // window and reduces auth flicker. See the `auth` skill for the full
  // flicker-prevention guidance (gate on `isPending`; SSR the session).
  session: { cookieCache: { enabled: true, maxAge: 300 } },

  // Local email/password — toggled only via `./email-password` (not a plugin).
  ...(emailAndPasswordEnabled ? { emailAndPassword: { enabled: true } } : {}),

  // `__Host-` prefixed cookies: the browser REFUSES any same-named cookie that
  // carries a `Domain` attribute, so a sibling `*.grok.me` app cannot "toss" a
  // `Domain=.grok.me` session cookie onto this app. `__Host-` requires Secure +
  // Path=/ + no Domain; Better Auth otherwise uses `__Secure-` (which permits
  // Domain), so we drop its auto prefix (`useSecureCookies: false`) and set
  // Secure + the names ourselves. (Browsers allow Secure cookies on
  // `http://localhost`, so local dev still works.)
  advanced: {
    useSecureCookies: false,
    defaultCookieAttributes: { secure: true, sameSite: "lax", path: "/" },
    cookies: {
      session_token: { name: SESSION_TOKEN_COOKIE },
      session_data: { name: "__Host-grok-auth.session_data" },
      account_data: { name: "__Host-grok-auth.account_data" },
      dont_remember: { name: "__Host-grok-auth.dont_remember" },
    },
  },

  plugins: [
    // One genericOAuth provider per upstream (when auth is on), all federating
    // to the broker with the SAME client and differing only by the `idp` hint.
    ...(grokOAuthPlugin ? [grokOAuthPlugin] : []),

    // Accept `Authorization: Bearer <session-token>` as an alternative to the
    // cookie. Needed for the LIVE PREVIEW: the app runs in an embedded iframe
    // where cookies are partitioned, so after popup sign-in it authenticates with
    // a bearer token instead (see `client.ts` / the `auth` skill). The hook only
    // fires when an Authorization header is present, so the cookie path
    // (deployed apps) is unaffected.
    bearer(),

    // Bridges Better Auth's Set-Cookie into TanStack Start responses. MUST be
    // last so it runs after every other plugin's hooks.
    tanstackStartCookies(),
  ],
});

export function readSessionToken(): string | null {
  return getCookie(SESSION_TOKEN_COOKIE) ?? null;
}

// Re-exported for convenience; the array lives in the dependency-free
// `providers.ts` so the client can import it too.
export { GROK_PROVIDERS } from "./providers";
