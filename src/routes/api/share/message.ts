/**
 * JPDOC: ファンレター／お礼。
 */
import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { sanitizeFanMessage } from "@/lib/sanitize-message";

export const Route = createFileRoute("/api/share/message")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const playerId = (url.searchParams.get("playerId") || "")
          .replace(/[^a-z0-9]/gi, "")
          .slice(0, 32);
        if (!playerId) return Response.json({ messages: [] }, { status: 400 });
        try {
          const sql = await getSql();
          // fan mail received as sharer
          const fan = await sql.query<{
            id: number;
            visitor_id: string;
            body: string;
            created_at: string;
            share_id: string;
            deleted: number | null;
            thanks_sent: number | null;
          }>(
            `SELECT m.id, m.visitor_id, m.body, m.created_at, m.share_id,
                    COALESCE(meta.deleted, 0) AS deleted,
                    COALESCE(meta.thanks_sent, 0) AS thanks_sent
             FROM share_messages_v2 m
             LEFT JOIN share_message_meta meta ON meta.message_id = m.id
             WHERE m.sharer_id = $1
             ORDER BY m.id DESC
             LIMIT 100`,
            [playerId],
          );
          // thank-you notes received as visitor
          const thanks = await sql.query<{
            id: number;
            from_id: string;
            body: string;
            created_at: string;
            message_id: number;
            deleted: number;
          }>(
            `SELECT id, from_id, body, created_at, message_id, deleted
             FROM share_thanks
             WHERE to_id = $1
             ORDER BY id DESC
             LIMIT 100`,
            [playerId],
          );

          const messages: {
            id: string;
            from: string;
            body: string;
            at: string;
            shareId?: string;
            source: "mission" | "thanks";
            canThanks: boolean;
            thanksSent: boolean;
            kind?: "fan" | "thanks"; // legacy compat
          }[] = [];

          for (const r of fan) {
            if (Number(r.deleted) === 1) continue;
            const body = sanitizeFanMessage(r.body);
            if (!body.ok) continue;
            messages.push({
              id: `f${r.id}`,
              from: String(r.visitor_id).replace(/[^a-z0-9]/gi, "").slice(0, 32),
              body: body.text,
              at: r.created_at || "",
              shareId: r.share_id,
              source: "mission",
              canThanks: true, // ミッション完了MSGのみお礼可
              thanksSent: Number(r.thanks_sent) === 1,
              kind: "fan",
            });
          }
          for (const r of thanks) {
            if (Number(r.deleted) === 1) continue;
            const body = sanitizeFanMessage(r.body);
            if (!body.ok) continue;
            messages.push({
              id: `t${r.id}`,
              from: String(r.from_id).replace(/[^a-z0-9]/gi, "").slice(0, 32),
              body: body.text,
              at: r.created_at || "",
              source: "thanks",
              canThanks: false, // お礼にはお礼不可
              thanksSent: true,
              kind: "thanks",
            });
          }
          // newest first by id-ish: keep fan order then thanks, stable enough
          return Response.json({ messages });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json({ messages: [], offline: true, error: msg });
        }
      },

      POST: async ({ request }) => {
        let body: {
          action?: string;
          sharerId?: string;
          shareId?: string;
          visitorId?: string;
          text?: string;
          messageId?: string;
          playerId?: string;
        };
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false, reason: "bad_json" }, { status: 400 });
        }

        const action = String(body.action || "fan");

        // --- delete ---
        if (action === "delete") {
          const playerId = String(body.playerId || "")
            .replace(/[^a-z0-9]/gi, "")
            .slice(0, 32);
          const messageId = String(body.messageId || "");
          if (!playerId || !messageId) {
            return Response.json({ ok: false, reason: "bad" }, { status: 400 });
          }
          try {
            const sql = await getSql();
            if (messageId.startsWith("f")) {
              const id = Number(messageId.slice(1));
              if (!Number.isFinite(id)) {
                return Response.json({ ok: false, reason: "bad" }, { status: 400 });
              }
              const own = await sql.query(
                `SELECT 1 FROM share_messages_v2 WHERE id=$1 AND sharer_id=$2`,
                [id, playerId],
              );
              if (!own.length) {
                return Response.json({ ok: false, reason: "forbidden" }, { status: 403 });
              }
              await sql.query(
                `INSERT INTO share_message_meta (message_id, deleted, thanks_sent)
                 VALUES ($1, 1, 0)
                 ON CONFLICT (message_id) DO UPDATE SET deleted = 1`,
                [id],
              );
              return Response.json({ ok: true });
            }
            if (messageId.startsWith("t")) {
              const id = Number(messageId.slice(1));
              if (!Number.isFinite(id)) {
                return Response.json({ ok: false, reason: "bad" }, { status: 400 });
              }
              await sql.query(
                `UPDATE share_thanks SET deleted = 1 WHERE id=$1 AND to_id=$2`,
                [id, playerId],
              );
              return Response.json({ ok: true });
            }
            return Response.json({ ok: false, reason: "bad" }, { status: 400 });
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            return Response.json({ ok: false, reason: "db", error: msg }, { status: 500 });
          }
        }

        // --- thank-you (only on mission-complete fan messages, once) ---
        if (action === "thanks") {
          const playerId = String(body.playerId || "")
            .replace(/[^a-z0-9]/gi, "")
            .slice(0, 32);
          const messageId = String(body.messageId || "");
          const clean = sanitizeFanMessage(body.text);
          if (!clean.ok) {
            return Response.json({ ok: false, reason: clean.reason }, { status: 400 });
          }
          // only mission fan-mail ids (f123) — never thanks (t123)
          if (!playerId || !messageId.startsWith("f")) {
            return Response.json({ ok: false, reason: "not_mission" }, { status: 400 });
          }
          const id = Number(messageId.slice(1));
          if (!Number.isFinite(id)) {
            return Response.json({ ok: false, reason: "bad" }, { status: 400 });
          }
          try {
            const sql = await getSql();
            const rows = await sql.query<{
              visitor_id: string;
              sharer_id: string;
            }>(
              `SELECT visitor_id, sharer_id FROM share_messages_v2 WHERE id=$1`,
              [id],
            );
            // share_messages_v2 only holds mission-complete messages
            if (!rows.length || rows[0].sharer_id !== playerId) {
              return Response.json({ ok: false, reason: "forbidden" }, { status: 403 });
            }
            const meta = await sql.query<{ thanks_sent: number; deleted: number }>(
              `SELECT COALESCE(thanks_sent,0) AS thanks_sent, COALESCE(deleted,0) AS deleted
               FROM share_message_meta WHERE message_id=$1`,
              [id],
            );
            if (meta[0] && Number(meta[0].deleted) === 1) {
              return Response.json({ ok: false, reason: "deleted" });
            }
            if (meta[0] && Number(meta[0].thanks_sent) === 1) {
              return Response.json({ ok: false, reason: "already" });
            }
            const visitorId = rows[0].visitor_id;
            await sql.query(
              `INSERT INTO share_thanks (message_id, from_id, to_id, body)
               VALUES ($1,$2,$3,$4)`,
              [id, playerId, visitorId, clean.text],
            );
            await sql.query(
              `INSERT INTO share_message_meta (message_id, deleted, thanks_sent)
               VALUES ($1, 0, 1)
               ON CONFLICT (message_id) DO UPDATE SET thanks_sent = 1`,
              [id],
            );
            return Response.json({ ok: true, to: visitorId });
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            if (msg.toLowerCase().includes("unique")) {
              return Response.json({ ok: false, reason: "already" });
            }
            return Response.json({ ok: false, reason: "db", error: msg }, { status: 500 });
          }
        }

        // --- fan mail (mission complete, one per share) ---
        const sharerId = String(body.sharerId || "")
          .replace(/[^a-z0-9]/gi, "")
          .slice(0, 32);
        const shareId = String(body.shareId || "")
          .replace(/[^a-z0-9]/gi, "")
          .slice(0, 32);
        const visitorId = String(body.visitorId || "")
          .replace(/[^a-z0-9]/gi, "")
          .slice(0, 32);
        const clean = sanitizeFanMessage(body.text);
        if (!clean.ok) {
          return Response.json({ ok: false, reason: clean.reason }, { status: 400 });
        }
        const text = clean.text;
        if (!sharerId || !shareId || !visitorId) {
          return Response.json({ ok: false, reason: "bad" }, { status: 400 });
        }
        if (sharerId === visitorId) {
          return Response.json({ ok: false, reason: "self" });
        }
        try {
          const sql = await getSql();
          const done = await sql.query(
            `SELECT mission_id FROM share_mission_v2
             WHERE share_id=$1 AND visitor_id=$2`,
            [shareId, visitorId],
          );
          const ids = new Set(done.map((r) => (r as { mission_id: string }).mission_id));
          if (!["m1", "m2", "m3", "m4"].every((m) => ids.has(m))) {
            return Response.json({ ok: false, reason: "missions" });
          }
          const existing = await sql.query(
            `SELECT 1 FROM share_messages_v2
             WHERE share_id=$1 AND visitor_id=$2 LIMIT 1`,
            [shareId, visitorId],
          );
          if (existing.length) {
            return Response.json({ ok: false, reason: "already" });
          }
          await sql.query(
            `INSERT INTO share_messages_v2 (share_id, sharer_id, visitor_id, body)
             VALUES ($1,$2,$3,$4)`,
            [shareId, sharerId, visitorId, text],
          );
          return Response.json({ ok: true, shareId });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("[share/message]", msg);
          return Response.json({ ok: false, reason: "db", error: msg }, { status: 500 });
        }
      },
    },
  },
});
