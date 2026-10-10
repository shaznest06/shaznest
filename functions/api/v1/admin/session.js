import { adminCookie, corsAllowed, hasAdminSecret, json, methodNotAllowed, options, rejectOrigin, verifyAdminRequest, issueAdminCookie } from "../_utils.js";

async function equalSecret(candidate, expected) {
  const encoder = new TextEncoder();
  const [left, right] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(candidate)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  const a = new Uint8Array(left);
  const b = new Uint8Array(right);
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) mismatch |= a[index] ^ b[index];
  return mismatch === 0;
}

export async function onRequestOptions({ request, env }) {
  return options(request, env);
}

export async function onRequest({ request, env }) {
  const originError = rejectOrigin(request, env);
  if (originError) return originError;
  if (request.method === "OPTIONS") return options(request, env);
  if (!hasAdminSecret(env)) return json(request, env, { error: "Admin authentication is not configured. Set ADMIN_SECRET (minimum 16 characters)." }, 503);

  if (request.method === "GET") {
    const authenticated = await verifyAdminRequest(request, env);
    return json(request, env, authenticated ? { authenticated: true, admin: { name: "Administrator" } } : { authenticated: false }, authenticated ? 200 : 401);
  }

  if (request.method === "DELETE") {
    return json(request, env, { authenticated: false }, 200, {
      "Set-Cookie": adminCookie(request, "", 0),
    });
  }

  if (request.method !== "POST") return methodNotAllowed(request, env, ["GET", "POST", "DELETE"]);

  let body;
  try { body = await request.json(); } catch { return json(request, env, { error: "Expected a JSON request body." }, 400); }
  if (typeof body?.passcode !== "string" || body.passcode.length > 512 || !(await equalSecret(body.passcode, env.ADMIN_SECRET))) {
    return json(request, env, { error: "Administrator credentials were not accepted." }, 401);
  }

  const token = await issueAdminCookie(env);
  return json(request, env, { authenticated: true, admin: { name: "Administrator" } }, 200, {
    "Set-Cookie": adminCookie(request, token),
  });
}