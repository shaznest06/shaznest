import { empty, internalError, json, methodNotAllowed, missingDatabase, options, readJson, rejectOrigin, sha256Hex } from "../_utils.js";

const ALLOWED_PAGES = new Set(["home", "checkout", "reviews", "product", "other", "admin"]);
const SESSION_ID_PATTERN = /^[0-9a-f-]{36}$/i;

export async function onRequestOptions({ request, env }) {
  return options(request, env);
}

export async function onRequest({ request, env }) {
  const originError = rejectOrigin(request, env);
  if (originError) return originError;
  if (request.method === "OPTIONS") return options(request, env);
  if (request.method !== "POST") return methodNotAllowed(request, env, ["POST"]);
  const databaseError = missingDatabase(request, env);
  if (databaseError) return databaseError;

  const body = await readJson(request);
  if (!body || typeof body.sessionId !== "string" || !SESSION_ID_PATTERN.test(body.sessionId) || !ALLOWED_PAGES.has(body.page) || typeof body.active !== "boolean") {
    return json(request, env, { error: "Invalid analytics heartbeat." }, 400);
  }

  try {
    const sessionHash = await sha256Hex(body.sessionId);
    if (body.active) {
      await env.DB.prepare(`
        INSERT INTO visitor_sessions (session_hash, page, active, last_seen_at, expires_at)
        VALUES (?, ?, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+45 seconds'))
        ON CONFLICT(session_hash) DO UPDATE SET
          page = excluded.page,
          active = 1,
          last_seen_at = excluded.last_seen_at,
          expires_at = excluded.expires_at
      `).bind(sessionHash, body.page).run();
    } else {
      await env.DB.prepare("UPDATE visitor_sessions SET active = 0, last_seen_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), expires_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE session_hash = ?").bind(sessionHash).run();
    }

    return empty(request, env);
  } catch {
    return internalError(request, env);
  }
}